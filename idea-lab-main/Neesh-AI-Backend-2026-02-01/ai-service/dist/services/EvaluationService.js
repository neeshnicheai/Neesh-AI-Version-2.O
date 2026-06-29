"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluationService = void 0;
const EmbeddingService_1 = require("./EmbeddingService");
class EvaluationService {
    constructor(cacheService) {
        this.evaluationHistory = new Map();
        // Share cache so evaluation embeddings reuse already-cached vectors
        this.embeddingService = new EmbeddingService_1.EmbeddingService(cacheService);
        console.log('[EvaluationService] Initialized RAG Triad evaluation metrics (cache-aware)');
    }
    /**
     * Evaluate a complete RAG response using the RAG Triad methodology.
     */
    async evaluateRAGResponse(query, retrievedContext, generatedAnswer, projectId, questionId) {
        console.log(`[EvaluationService] Evaluating RAG response for query: "${query.substring(0, 50)}..."`);
        const startTime = Date.now();
        try {
            // 1. Context Relevance: How relevant is the retrieved context to the query?
            const contextRelevance = await this.evaluateContextRelevance(query, retrievedContext);
            // 2. Faithfulness: How well is the answer grounded in the provided context?
            const faithfulness = await this.evaluateFaithfulness(retrievedContext, generatedAnswer);
            // 3. Answer Relevance: How well does the answer address the original query?
            const answerRelevance = await this.evaluateAnswerRelevance(query, generatedAnswer);
            // 4. Calculate overall weighted score
            const overallScore = this.calculateOverallScore(contextRelevance.avgScore, faithfulness.score, answerRelevance);
            const metrics = {
                contextRelevance: contextRelevance.avgScore,
                faithfulness: faithfulness.score,
                answerRelevance,
                overallScore
            };
            const result = {
                metrics,
                details: {
                    retrievedChunks: retrievedContext.length,
                    avgContextRelevance: contextRelevance.avgScore,
                    faithfulnessBreakdown: {
                        groundedClaims: faithfulness.groundedClaims,
                        totalClaims: faithfulness.totalClaims,
                        groundingRatio: faithfulness.groundingRatio
                    },
                    queryAnswerSimilarity: answerRelevance
                },
                timestamp: Date.now(),
                questionId
            };
            // Store evaluation for analytics
            this.storeEvaluation(projectId, result);
            const elapsed = Date.now() - startTime;
            console.log(`[EvaluationService] Evaluation complete in ${elapsed}ms - Overall Score: ${overallScore.toFixed(3)}`);
            return result;
        }
        catch (error) {
            console.error(`[EvaluationService] Evaluation failed: ${error.message}`);
            // Return fallback evaluation
            return {
                metrics: {
                    contextRelevance: 0.5,
                    faithfulness: 0.5,
                    answerRelevance: 0.5,
                    overallScore: 0.5
                },
                details: {
                    retrievedChunks: retrievedContext.length,
                    avgContextRelevance: 0.5,
                    faithfulnessBreakdown: {
                        groundedClaims: 0,
                        totalClaims: 1,
                        groundingRatio: 0.5
                    },
                    queryAnswerSimilarity: 0.5
                },
                timestamp: Date.now(),
                questionId
            };
        }
    }
    /**
     * Evaluate how relevant the retrieved context chunks are to the query.
     */
    async evaluateContextRelevance(query, context) {
        if (context.length === 0) {
            return { avgScore: 0, scores: [] };
        }
        try {
            const queryEmbedding = await this.embeddingService.generateEmbedding(query);
            const scores = [];
            for (const chunk of context) {
                const chunkEmbedding = await this.embeddingService.generateEmbedding(chunk.chunk_text);
                const similarity = this.cosineSimilarity(queryEmbedding, chunkEmbedding);
                // Normalize similarity to 0-1 range and apply threshold
                const relevanceScore = Math.max(0, (similarity + 1) / 2); // Convert [-1,1] to [0,1]
                scores.push(relevanceScore);
            }
            const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
            return { avgScore, scores };
        }
        catch (error) {
            console.warn(`[EvaluationService] Context relevance evaluation failed: ${error.message}`);
            return { avgScore: 0.5, scores: [0.5] };
        }
    }
    /**
     * Evaluate how well the generated answer is grounded in the provided context.
     */
    async evaluateFaithfulness(context, answer) {
        if (context.length === 0) {
            return { score: 0, groundedClaims: 0, totalClaims: 1, groundingRatio: 0 };
        }
        try {
            // Combine all context into one text for grounding analysis
            const contextText = context.map(c => c.chunk_text).join(' ');
            // Simple faithfulness check: measure semantic overlap between answer and context
            const answerEmbedding = await this.embeddingService.generateEmbedding(answer);
            const contextEmbedding = await this.embeddingService.generateEmbedding(contextText);
            const similarity = this.cosineSimilarity(answerEmbedding, contextEmbedding);
            const groundingScore = Math.max(0, (similarity + 1) / 2); // Convert [-1,1] to [0,1]
            // Extract key claims from answer (simplified approach)
            const claims = this.extractClaims(answer);
            const groundedClaims = claims.filter(claim => contextText.toLowerCase().includes(claim.toLowerCase()) ||
                this.fuzzyMatch(claim, contextText)).length;
            const groundingRatio = claims.length > 0 ? groundedClaims / claims.length : 1;
            // Weighted combination of semantic similarity and claim grounding
            const faithfulnessScore = (groundingScore * 0.6) + (groundingRatio * 0.4);
            return {
                score: faithfulnessScore,
                groundedClaims,
                totalClaims: claims.length,
                groundingRatio
            };
        }
        catch (error) {
            console.warn(`[EvaluationService] Faithfulness evaluation failed: ${error.message}`);
            return { score: 0.5, groundedClaims: 1, totalClaims: 1, groundingRatio: 0.5 };
        }
    }
    /**
     * Evaluate how well the answer addresses the original query.
     */
    async evaluateAnswerRelevance(query, answer) {
        try {
            const queryEmbedding = await this.embeddingService.generateEmbedding(query);
            const answerEmbedding = await this.embeddingService.generateEmbedding(answer);
            const similarity = this.cosineSimilarity(queryEmbedding, answerEmbedding);
            // Convert similarity to 0-1 range and apply quality threshold
            const relevanceScore = Math.max(0, (similarity + 1) / 2);
            return relevanceScore;
        }
        catch (error) {
            console.warn(`[EvaluationService] Answer relevance evaluation failed: ${error.message}`);
            return 0.5;
        }
    }
    /**
     * Calculate overall weighted RAG score.
     */
    calculateOverallScore(contextRelevance, faithfulness, answerRelevance) {
        // Weighted combination - faithfulness is most important
        return (contextRelevance * 0.25) + (faithfulness * 0.5) + (answerRelevance * 0.25);
    }
    /**
     * Extract key claims from text (simplified NLP approach).
     */
    extractClaims(text) {
        // Simple sentence-based claim extraction
        const sentences = text
            .split(/[.!?]+/)
            .map(s => s.trim())
            .filter(s => s.length > 10); // Filter out very short fragments
        // Extract meaningful phrases (simplified approach)
        return sentences.flatMap(sentence => {
            // Look for noun-verb patterns and factual statements
            const words = sentence.split(/\s+/);
            if (words.length >= 3 && words.length <= 15) {
                return [sentence];
            }
            return [];
        });
    }
    /**
     * Check for fuzzy matching between claim and context.
     */
    fuzzyMatch(claim, context) {
        const claimWords = claim.toLowerCase().split(/\s+/).filter(w => w.length > 3);
        const contextLower = context.toLowerCase();
        // Check if most claim words appear in context
        const matchedWords = claimWords.filter(word => contextLower.includes(word));
        return matchedWords.length >= Math.ceil(claimWords.length * 0.6);
    }
    /**
     * Cosine similarity calculation.
     */
    cosineSimilarity(vecA, vecB) {
        if (vecA.length !== vecB.length)
            return 0;
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }
        const denominator = Math.sqrt(normA) * Math.sqrt(normB);
        return denominator === 0 ? 0 : dotProduct / denominator;
    }
    /**
     * Store evaluation result for analytics.
     */
    storeEvaluation(projectId, result) {
        if (!this.evaluationHistory.has(projectId)) {
            this.evaluationHistory.set(projectId, []);
        }
        const history = this.evaluationHistory.get(projectId);
        history.push(result);
        // Keep only last 100 evaluations per project
        if (history.length > 100) {
            history.shift();
        }
    }
    /**
     * Get evaluation analytics for a project.
     */
    getProjectAnalytics(projectId) {
        const history = this.evaluationHistory.get(projectId) || [];
        if (history.length === 0) {
            return {
                totalEvaluations: 0,
                averageScores: { contextRelevance: 0, faithfulness: 0, answerRelevance: 0, overallScore: 0 },
                trend: 'stable'
            };
        }
        // Calculate averages
        const averages = history.reduce((acc, entry) => {
            acc.contextRelevance += entry.metrics.contextRelevance;
            acc.faithfulness += entry.metrics.faithfulness;
            acc.answerRelevance += entry.metrics.answerRelevance;
            acc.overallScore += entry.metrics.overallScore;
            return acc;
        }, { contextRelevance: 0, faithfulness: 0, answerRelevance: 0, overallScore: 0 });
        const count = history.length;
        const averageScores = {
            contextRelevance: averages.contextRelevance / count,
            faithfulness: averages.faithfulness / count,
            answerRelevance: averages.answerRelevance / count,
            overallScore: averages.overallScore / count
        };
        // Calculate trend (compare recent vs older evaluations)
        let trend = 'stable';
        if (history.length >= 10) {
            const recent = history.slice(-5);
            const older = history.slice(-10, -5);
            const recentAvg = recent.reduce((sum, e) => sum + e.metrics.overallScore, 0) / recent.length;
            const olderAvg = older.reduce((sum, e) => sum + e.metrics.overallScore, 0) / older.length;
            const improvement = recentAvg - olderAvg;
            if (improvement > 0.05)
                trend = 'improving';
            else if (improvement < -0.05)
                trend = 'declining';
        }
        return {
            totalEvaluations: count,
            averageScores,
            trend
        };
    }
    /**
     * Get system-wide evaluation statistics.
     */
    getGlobalStats() {
        const allEvaluations = Array.from(this.evaluationHistory.values()).flat();
        const totalEvaluations = allEvaluations.length;
        const projectCount = this.evaluationHistory.size;
        if (totalEvaluations === 0) {
            return {
                totalEvaluations: 0,
                projectCount: 0,
                systemAverages: { contextRelevance: 0, faithfulness: 0, answerRelevance: 0, overallScore: 0 }
            };
        }
        const totals = allEvaluations.reduce((acc, entry) => {
            acc.contextRelevance += entry.metrics.contextRelevance;
            acc.faithfulness += entry.metrics.faithfulness;
            acc.answerRelevance += entry.metrics.answerRelevance;
            acc.overallScore += entry.metrics.overallScore;
            return acc;
        }, { contextRelevance: 0, faithfulness: 0, answerRelevance: 0, overallScore: 0 });
        const systemAverages = {
            contextRelevance: totals.contextRelevance / totalEvaluations,
            faithfulness: totals.faithfulness / totalEvaluations,
            answerRelevance: totals.answerRelevance / totalEvaluations,
            overallScore: totals.overallScore / totalEvaluations
        };
        return {
            totalEvaluations,
            projectCount,
            systemAverages
        };
    }
}
exports.EvaluationService = EvaluationService;
