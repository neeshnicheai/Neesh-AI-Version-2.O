"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const VectorStoreService_1 = require("./VectorStoreService");
const EmbeddingService_1 = require("./EmbeddingService");
const LlmService_1 = require("./LlmService");
const LearningService_1 = require("./LearningService");
const CacheService_1 = require("./CacheService");
const RerankerService_1 = require("./RerankerService");
const EvaluationService_1 = require("./EvaluationService");
const QueryExpansionService_1 = require("./QueryExpansionService");
const UNANSWERABLE_FALLBACK = 'As of now this needs to be discussed, I will let you know when this is discussed.';
// Common greetings to detect
const GREETING_PATTERNS = /^(hi|hello|hey|howdy|greetings|good\s*(morning|afternoon|evening)|what'?s?\s*up|sup|yo)[\s!?.,]*$/i;
class ChatService {
    constructor() {
        // Shared CacheService instance — used by EmbeddingService, retrieval, and response caches
        this.cacheService = new CacheService_1.CacheService();
        // Services that share the cache
        this.embeddingService = new EmbeddingService_1.EmbeddingService(this.cacheService);
        this.rerankerService = new RerankerService_1.RerankerService(this.embeddingService);
        // Independent services
        this.vectorStore = new VectorStoreService_1.VectorStoreService();
        this.llmService = new LlmService_1.LlmService();
        this.learningService = new LearningService_1.LearningService();
        this.evaluationService = new EvaluationService_1.EvaluationService(this.cacheService);
        this.queryExpansionService = new QueryExpansionService_1.QueryExpansionService();
        console.log('[ChatService] Initialized — reranking, caching, evaluation, query-expansion active');
    }
    isGreeting(query) {
        return GREETING_PATTERNS.test(query.trim());
    }
    async askQuestion(projectId, query, linkedProjectIds, provider, apiKey, userName, userEmail) {
        console.log(`[ChatService] askQuestion — project: ${projectId}, query: "${query.substring(0, 80)}", ` +
            `linkedProjects: ${linkedProjectIds?.length || 0}, provider: ${provider || 'fallback'}`);
        // ── 0. Response cache (exact match) ─────────────────────────────────────
        const cachedResponse = this.cacheService.getCachedResponse(projectId, query);
        if (cachedResponse) {
            console.log('[ChatService] Response cache HIT — returning immediately');
            return cachedResponse;
        }
        // ── 1. Log the question ──────────────────────────────────────────────────
        let questionId;
        try {
            questionId = await this.learningService.logQuestion(projectId, query);
            console.log(`[ChatService] Question logged: ${questionId}`);
        }
        catch (logError) {
            console.warn(`[ChatService] Failed to log question (non-fatal): ${logError.message}`);
            questionId = 'unlogged-' + Date.now();
        }
        // ── 2. Greeting shortcut — skip RAG entirely ─────────────────────────────
        if (this.isGreeting(query)) {
            console.log('[ChatService] Greeting detected — skipping RAG');
            try {
                const generated = await this.llmService.generateGreeting(query, provider, apiKey);
                const logId = await this.safeLogAnswer(questionId, generated.answer, 'HIGH', false);
                const response = {
                    answer: generated.answer,
                    confidence: 'HIGH',
                    sources: [],
                    questionId,
                    answerLogId: logId,
                };
                this.cacheService.cacheResponse(projectId, query, response);
                return response;
            }
            catch {
                return {
                    answer: "Hello! 👋 I'm here to help with questions about this project.",
                    confidence: 'HIGH',
                    sources: [],
                    questionId,
                    answerLogId: 'fallback',
                };
            }
        }
        // ── 3. RAG retrieval ─────────────────────────────────────────────────────
        let chunks = [];
        try {
            // 3a. Check retrieval cache
            const cachedRetrieval = this.cacheService.getCachedRetrievalResults(projectId, query);
            if (cachedRetrieval) {
                chunks = cachedRetrieval;
                console.log(`[ChatService] Retrieval cache HIT — ${chunks.length} chunks`);
            }
            else {
                // 3b. Query expansion — generate query variations via LLM
                let queryVariations = [query];
                try {
                    queryVariations = await this.queryExpansionService.expandQuery(query, provider, apiKey, 3);
                    console.log(`[ChatService] Query expanded to ${queryVariations.length} variations`);
                }
                catch (expandErr) {
                    console.warn(`[ChatService] Query expansion failed (non-fatal): ${expandErr.message}`);
                }
                // 3c. Embed primary query
                console.log('[ChatService] Generating query embedding...');
                const queryEmbedding = await this.embeddingService.generateEmbedding(query);
                // 3d. Hybrid search on primary query
                chunks = await this.vectorStore.queryHybrid(projectId, queryEmbedding, query, 8, 0.05);
                console.log(`[ChatService] Primary search: ${chunks.length} chunks`);
                // 3e. Run hybrid search on best alternative variation (if any)
                if (queryVariations.length > 1) {
                    const altQuery = queryVariations[1];
                    try {
                        const altEmbedding = await this.embeddingService.generateEmbedding(altQuery);
                        const altChunks = await this.vectorStore.queryHybrid(projectId, altEmbedding, altQuery, 5, 0.05);
                        console.log(`[ChatService] Alt-query search: ${altChunks.length} chunks`);
                        // Merge and deduplicate
                        const seen = new Set(chunks.map(c => `${c.document_group_id}::${c.chunk_index}`));
                        for (const c of altChunks) {
                            const key = `${c.document_group_id}::${c.chunk_index}`;
                            if (!seen.has(key)) {
                                seen.add(key);
                                chunks.push(c);
                            }
                        }
                        console.log(`[ChatService] After merge: ${chunks.length} total chunks`);
                    }
                    catch (altErr) {
                        console.warn(`[ChatService] Alt-query search failed (non-fatal): ${altErr.message}`);
                    }
                }
                // 3f. Query linked projects
                if (linkedProjectIds && linkedProjectIds.length > 0) {
                    const linkedChunks = await this.vectorStore.queryMultipleProjects(linkedProjectIds, queryEmbedding, query, 3, 0.05);
                    console.log(`[ChatService] Linked projects: ${linkedChunks.length} additional chunks`);
                    const seen = new Set(chunks.map(c => `${c.document_group_id}::${c.chunk_index}`));
                    for (const c of linkedChunks) {
                        const key = `${c.document_group_id}::${c.chunk_index}`;
                        if (!seen.has(key)) {
                            seen.add(key);
                            chunks.push(c);
                        }
                    }
                }
                // 3g. Semantic reranking — 2 API calls total (batch)
                if (chunks.length > 1) {
                    console.log(`[ChatService] Reranking ${chunks.length} candidates...`);
                    chunks = await this.rerankerService.rerankResults(query, chunks, 6);
                    console.log(`[ChatService] Reranked to ${chunks.length} top chunks`);
                }
                // 3h. Cache retrieval result
                this.cacheService.cacheRetrievalResults(projectId, query, chunks);
            }
        }
        catch (ragError) {
            console.warn(`[ChatService] RAG retrieval failed (falling back to direct LLM): ${ragError.message}`);
        }
        // ── 4. Priority Logic — OVERRIDE manual answers ──────────────────────────
        let answer = '';
        let confidence = 'LOW';
        let finalSources = [];
        let isAi = true;
        const overrideChunk = chunks.find(c => c.source_type === 'MANUAL' &&
            c.manual_answer_type === 'OVERRIDE' &&
            c.similarity >= 0.85);
        if (overrideChunk) {
            console.log('[ChatService] Found manual OVERRIDE answer');
            const text = overrideChunk.chunk_text;
            const answerPart = text.split('Answer:')[1];
            answer = answerPart ? answerPart.trim() : text;
            confidence = 'HIGH';
            isAi = false;
            finalSources = [{
                    document_group_id: overrideChunk.document_group_id,
                    document_version: overrideChunk.document_version,
                    chunk_index: overrideChunk.chunk_index,
                    similarity_score: overrideChunk.similarity,
                    source_type: 'MANUAL',
                    metadata: overrideChunk.metadata,
                }];
        }
        else {
            // ── 5. LLM answer generation ──────────────────────────────────────────
            const contextTexts = chunks.map(c => c.chunk_text);
            if (chunks.length === 0) {
                console.log('[ChatService] No context chunks — LLM answering directly');
            }
            else {
                console.log(`[ChatService] Using ${chunks.length} reranked chunks for RAG generation`);
                confidence = this.calculateConfidence(chunks);
            }
            try {
                const generated = await this.llmService.generateAnswer(query, contextTexts, provider, apiKey);
                answer = generated.answer;
                if (answer === UNANSWERABLE_FALLBACK) {
                    confidence = 'LOW';
                }
                else if (chunks.length === 0) {
                    confidence = 'LOW';
                }
                else {
                    console.log(`[ChatService] RAG response generated — confidence: ${confidence}`);
                }
            }
            catch (llmError) {
                console.error(`[ChatService] LLM generation failed: ${llmError.message}`);
                answer = UNANSWERABLE_FALLBACK;
                confidence = 'LOW';
            }
            finalSources = chunks.map(c => ({
                document_group_id: c.document_group_id,
                document_version: c.document_version,
                chunk_index: c.chunk_index,
                similarity_score: c.similarity,
                source_type: c.source_type,
                metadata: c.metadata,
            }));
        }
        // ── 6. Log answer ────────────────────────────────────────────────────────
        const logId = await this.safeLogAnswer(questionId, answer, confidence, isAi);
        // ── 7. Report unanswered questions ───────────────────────────────────────
        if (confidence === 'LOW') {
            this.reportUnansweredQuestion(projectId, query, userName, userEmail).catch(err => console.warn(`[ChatService] Failed to report unanswered question: ${err.message}`));
        }
        // ── 8. Async RAG Triad evaluation (non-blocking — fires and forgets) ─────
        let ragScore;
        if (chunks.length > 0 && answer && answer !== UNANSWERABLE_FALLBACK) {
            this.evaluationService.evaluateRAGResponse(query, chunks, answer, projectId, questionId).then(result => {
                ragScore = result.metrics;
                console.log(`[ChatService] RAG Triad — context: ${result.metrics.contextRelevance.toFixed(2)}, ` +
                    `faithfulness: ${result.metrics.faithfulness.toFixed(2)}, ` +
                    `answer: ${result.metrics.answerRelevance.toFixed(2)}, ` +
                    `overall: ${result.metrics.overallScore.toFixed(2)}`);
            }).catch(err => console.warn(`[ChatService] RAG evaluation failed (non-fatal): ${err.message}`));
        }
        const response = {
            answer,
            confidence,
            sources: finalSources,
            questionId,
            answerLogId: logId,
            ragScore,
        };
        // Cache full response
        this.cacheService.cacheResponse(projectId, query, response);
        console.log(`[ChatService] Response ready — confidence: ${confidence}, ` +
            `answer length: ${answer.length} chars`);
        return response;
    }
    async safeLogAnswer(questionId, answer, confidence, isAi) {
        try {
            const logId = await this.learningService.logAnswer(questionId, answer, confidence, isAi);
            console.log(`[ChatService] Answer logged: ${logId}`);
            return logId;
        }
        catch (logError) {
            console.warn(`[ChatService] Failed to log answer (non-fatal): ${logError.message}`);
            return 'unlogged';
        }
    }
    async reportUnansweredQuestion(projectId, question, userName, userEmail) {
        const backendUrl = process.env.BACKEND_URL || 'http://localhost:8081';
        const url = `${backendUrl}/api/public/projects/${projectId}/questions/report`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                question,
                source: 'CHATBOT_AUTO',
                userName: userName || null,
                userEmail: userEmail || null,
            })
        });
        if (!response.ok)
            throw new Error(`Backend responded with ${response.status}`);
        console.log('[ChatService] Unanswered question reported successfully');
    }
    calculateConfidence(chunks) {
        if (chunks.length === 0)
            return 'LOW';
        const allHigh = chunks.every(c => c.similarity >= 0.20);
        const hasMultiple = chunks.length >= 2;
        if (hasMultiple && allHigh)
            return 'HIGH';
        if (chunks.some(c => c.similarity >= 0.08))
            return 'MEDIUM';
        return 'LOW';
    }
}
exports.ChatService = ChatService;
