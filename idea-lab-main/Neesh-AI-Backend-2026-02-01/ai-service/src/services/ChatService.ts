import { VectorStoreService, QueryResult } from './VectorStoreService';
import { EmbeddingService } from './EmbeddingService';
import { LlmService } from './LlmService';
import { LearningService } from './LearningService';
import { CacheService } from './CacheService';
import { RerankerService } from './RerankerService';
import { EvaluationService, RAGTriadMetrics } from './EvaluationService';
import { QueryExpansionService } from './QueryExpansionService';

const UNANSWERABLE_FALLBACK = 'As of now this needs to be discussed, I will let you know when this is discussed.';

export interface ChatResponse {
    answer: string;
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    sources: SourceMetadata[];
    questionId: string;
    answerLogId: string;
    ragScore?: RAGTriadMetrics;  // RAG Triad evaluation metrics (async, best-effort)
}

export interface SourceMetadata {
    document_group_id: string;
    document_version: number;
    chunk_index: number;
    similarity_score: number;
    source_type?: 'DOCUMENT' | 'MANUAL';
    metadata?: Record<string, any>;
}

// Common greetings to detect
const GREETING_PATTERNS = /^(hi|hello|hey|howdy|greetings|good\s*(morning|afternoon|evening)|what'?s?\s*up|sup|yo)[\s!?.,]*$/i;

export class ChatService {
    private vectorStore: VectorStoreService;
    private embeddingService: EmbeddingService;
    private llmService: LlmService;
    private learningService: LearningService;
    private cacheService: CacheService;
    private rerankerService: RerankerService;
    private evaluationService: EvaluationService;
    private queryExpansionService: QueryExpansionService;

    constructor() {
        // Shared CacheService instance — used by EmbeddingService, retrieval, and response caches
        this.cacheService = new CacheService();

        // Services that share the cache
        this.embeddingService    = new EmbeddingService(this.cacheService);
        this.rerankerService     = new RerankerService(this.embeddingService);

        // Independent services
        this.vectorStore         = new VectorStoreService();
        this.llmService          = new LlmService();
        this.learningService     = new LearningService();
        this.evaluationService   = new EvaluationService(this.cacheService);
        this.queryExpansionService = new QueryExpansionService();

        console.log('[ChatService] Initialized — reranking, caching, evaluation, query-expansion active');
    }

    private isGreeting(query: string): boolean {
        return GREETING_PATTERNS.test(query.trim());
    }

    async askQuestion(
        projectId: string,
        query: string,
        linkedProjectIds?: string[],
        provider?: string,
        apiKey?: string,
        userName?: string,
        userEmail?: string
    ): Promise<ChatResponse> {
        console.log(
            `[ChatService] askQuestion — project: ${projectId}, query: "${query.substring(0, 80)}", ` +
            `linkedProjects: ${linkedProjectIds?.length || 0}, provider: ${provider || 'fallback'}`
        );

        // ── 0. Response cache (exact match) ─────────────────────────────────────
        const cachedResponse = this.cacheService.getCachedResponse(projectId, query);
        if (cachedResponse) {
            console.log('[ChatService] Response cache HIT — returning immediately');
            return cachedResponse;
        }

        // ── 1. Log the question ──────────────────────────────────────────────────
        let questionId: string;
        try {
            questionId = await this.learningService.logQuestion(projectId, query);
            console.log(`[ChatService] Question logged: ${questionId}`);
        } catch (logError: any) {
            console.warn(`[ChatService] Failed to log question (non-fatal): ${logError.message}`);
            questionId = 'unlogged-' + Date.now();
        }

        // ── 2. Greeting shortcut — skip RAG entirely ─────────────────────────────
        if (this.isGreeting(query)) {
            console.log('[ChatService] Greeting detected — skipping RAG');
            try {
                const generated = await this.llmService.generateGreeting(query, provider, apiKey);
                const logId = await this.safeLogAnswer(questionId, generated.answer, 'HIGH', false);
                const response: ChatResponse = {
                    answer: generated.answer,
                    confidence: 'HIGH',
                    sources: [],
                    questionId,
                    answerLogId: logId,
                };
                this.cacheService.cacheResponse(projectId, query, response);
                return response;
            } catch {
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
        let chunks: QueryResult[] = [];
        try {
            // 3a. Check retrieval cache
            const cachedRetrieval = this.cacheService.getCachedRetrievalResults(projectId, query);

            if (cachedRetrieval) {
                chunks = cachedRetrieval;
                console.log(`[ChatService] Retrieval cache HIT — ${chunks.length} chunks`);
            } else {
                // 3b. Query expansion — generate query variations via LLM
                let queryVariations: string[] = [query];
                try {
                    queryVariations = await this.queryExpansionService.expandQuery(
                        query, provider, apiKey, 3
                    );
                    console.log(`[ChatService] Query expanded to ${queryVariations.length} variations`);
                } catch (expandErr: any) {
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
                        const altChunks = await this.vectorStore.queryHybrid(
                            projectId, altEmbedding, altQuery, 5, 0.05
                        );
                        console.log(`[ChatService] Alt-query search: ${altChunks.length} chunks`);

                        // Merge and deduplicate
                        const seen = new Set<string>(chunks.map(c => `${c.document_group_id}::${c.chunk_index}`));
                        for (const c of altChunks) {
                            const key = `${c.document_group_id}::${c.chunk_index}`;
                            if (!seen.has(key)) { seen.add(key); chunks.push(c); }
                        }
                        console.log(`[ChatService] After merge: ${chunks.length} total chunks`);
                    } catch (altErr: any) {
                        console.warn(`[ChatService] Alt-query search failed (non-fatal): ${altErr.message}`);
                    }
                }

                // 3f. Query linked projects
                if (linkedProjectIds && linkedProjectIds.length > 0) {
                    const linkedChunks = await this.vectorStore.queryMultipleProjects(
                        linkedProjectIds, queryEmbedding, query, 3, 0.05
                    );
                    console.log(`[ChatService] Linked projects: ${linkedChunks.length} additional chunks`);

                    const seen = new Set<string>(chunks.map(c => `${c.document_group_id}::${c.chunk_index}`));
                    for (const c of linkedChunks) {
                        const key = `${c.document_group_id}::${c.chunk_index}`;
                        if (!seen.has(key)) { seen.add(key); chunks.push(c); }
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

        } catch (ragError: any) {
            console.warn(`[ChatService] RAG retrieval failed (falling back to direct LLM): ${ragError.message}`);
        }

        // ── 4. Priority Logic — OVERRIDE manual answers ──────────────────────────
        let answer = '';
        let confidence: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
        let finalSources: SourceMetadata[] = [];
        let isAi = true;

        const overrideChunk = chunks.find(
            c => c.source_type === 'MANUAL' &&
                 c.manual_answer_type === 'OVERRIDE' &&
                 c.similarity >= 0.85
        );

        if (overrideChunk) {
            console.log('[ChatService] Found manual OVERRIDE answer');
            const text = overrideChunk.chunk_text;
            const answerPart = text.split('Answer:')[1];
            answer = answerPart ? answerPart.trim() : text;
            confidence = 'HIGH';
            isAi = false;
            finalSources = [{
                document_group_id: overrideChunk.document_group_id,
                document_version:  overrideChunk.document_version,
                chunk_index:       overrideChunk.chunk_index,
                similarity_score:  overrideChunk.similarity,
                source_type:       'MANUAL',
                metadata:          overrideChunk.metadata,
            }];
        } else {
            // ── 5. LLM answer generation ──────────────────────────────────────────
            const contextTexts = chunks.map(c => c.chunk_text);

            if (chunks.length === 0) {
                console.log('[ChatService] No context chunks — LLM answering directly');
            } else {
                console.log(`[ChatService] Using ${chunks.length} reranked chunks for RAG generation`);
                confidence = this.calculateConfidence(chunks);
            }

            try {
                const generated = await this.llmService.generateAnswer(
                    query, contextTexts, provider, apiKey
                );
                answer = generated.answer;

                if (answer === UNANSWERABLE_FALLBACK) {
                    confidence = 'LOW';
                } else if (chunks.length === 0) {
                    confidence = 'LOW';
                } else {
                    console.log(`[ChatService] RAG response generated — confidence: ${confidence}`);
                }
            } catch (llmError: any) {
                console.error(`[ChatService] LLM generation failed: ${llmError.message}`);
                answer = UNANSWERABLE_FALLBACK;
                confidence = 'LOW';
            }

            finalSources = chunks.map(c => ({
                document_group_id: c.document_group_id,
                document_version:  c.document_version,
                chunk_index:       c.chunk_index,
                similarity_score:  c.similarity,
                source_type:       c.source_type,
                metadata:          c.metadata,
            }));
        }

        // ── 6. Log answer ────────────────────────────────────────────────────────
        const logId = await this.safeLogAnswer(questionId, answer, confidence, isAi);

        // ── 7. Report unanswered questions ───────────────────────────────────────
        if (confidence === 'LOW') {
            this.reportUnansweredQuestion(projectId, query, userName, userEmail).catch(err =>
                console.warn(`[ChatService] Failed to report unanswered question: ${err.message}`)
            );
        }

        // ── 8. Async RAG Triad evaluation (non-blocking — fires and forgets) ─────
        let ragScore: RAGTriadMetrics | undefined;
        if (chunks.length > 0 && answer && answer !== UNANSWERABLE_FALLBACK) {
            this.evaluationService.evaluateRAGResponse(
                query, chunks, answer, projectId, questionId
            ).then(result => {
                ragScore = result.metrics;
                console.log(
                    `[ChatService] RAG Triad — context: ${result.metrics.contextRelevance.toFixed(2)}, ` +
                    `faithfulness: ${result.metrics.faithfulness.toFixed(2)}, ` +
                    `answer: ${result.metrics.answerRelevance.toFixed(2)}, ` +
                    `overall: ${result.metrics.overallScore.toFixed(2)}`
                );
            }).catch(err =>
                console.warn(`[ChatService] RAG evaluation failed (non-fatal): ${err.message}`)
            );
        }

        const response: ChatResponse = {
            answer,
            confidence,
            sources: finalSources,
            questionId,
            answerLogId: logId,
            ragScore,
        };

        // Cache full response
        this.cacheService.cacheResponse(projectId, query, response);

        console.log(
            `[ChatService] Response ready — confidence: ${confidence}, ` +
            `answer length: ${answer.length} chars`
        );

        return response;
    }

    private async safeLogAnswer(
        questionId: string,
        answer: string,
        confidence: string,
        isAi: boolean
    ): Promise<string> {
        try {
            const logId = await this.learningService.logAnswer(
                questionId, answer, confidence as any, isAi
            );
            console.log(`[ChatService] Answer logged: ${logId}`);
            return logId;
        } catch (logError: any) {
            console.warn(`[ChatService] Failed to log answer (non-fatal): ${logError.message}`);
            return 'unlogged';
        }
    }

    private async reportUnansweredQuestion(
        projectId: string,
        question: string,
        userName?: string,
        userEmail?: string
    ): Promise<void> {
        const backendUrl = process.env.BACKEND_URL || 'http://localhost:8081';
        const url = `${backendUrl}/api/public/projects/${projectId}/questions/report`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                question,
                source:    'CHATBOT_AUTO',
                userName:  userName || null,
                userEmail: userEmail || null,
            })
        });

        if (!response.ok) throw new Error(`Backend responded with ${response.status}`);
        console.log('[ChatService] Unanswered question reported successfully');
    }

    private calculateConfidence(chunks: QueryResult[]): 'HIGH' | 'MEDIUM' | 'LOW' {
        if (chunks.length === 0) return 'LOW';
        const allHigh     = chunks.every(c => c.similarity >= 0.20);
        const hasMultiple = chunks.length >= 2;

        if (hasMultiple && allHigh) return 'HIGH';
        if (chunks.some(c => c.similarity >= 0.08)) return 'MEDIUM';
        return 'LOW';
    }
}
