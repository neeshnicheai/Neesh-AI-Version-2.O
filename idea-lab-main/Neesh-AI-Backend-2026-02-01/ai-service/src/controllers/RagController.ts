import { Request, Response } from 'express';
import { IngestionService } from '../services/IngestionService';
import { VectorStoreService } from '../services/VectorStoreService';
import { EmbeddingService } from '../services/EmbeddingService';
import { ChatService } from '../services/ChatService';
import { CacheService } from '../services/CacheService';
import { EvaluationService } from '../services/EvaluationService';

export class RagController {
    private ingestionService: IngestionService;
    private vectorStore: VectorStoreService;
    private embeddingService: EmbeddingService;
    private chatService: ChatService;
    // Shared service instances for analytics endpoints
    private cacheService: CacheService;
    private evaluationService: EvaluationService;

    constructor() {
        // Create a shared CacheService instance for all services that need it
        this.cacheService = new CacheService();

        this.ingestionService = new IngestionService(this.cacheService);
        this.embeddingService = new EmbeddingService(this.cacheService);
        this.evaluationService = new EvaluationService(this.cacheService);
        this.vectorStore = new VectorStoreService();
        this.chatService = new ChatService();
    }

    async ingestProject(req: Request, res: Response) {
        const { projectId } = req.params;
        if (!projectId) {
            return res.status(400).json({ error: 'Missing projectId' });
        }

        try {
            await this.ingestionService.ingestProject(projectId);
            return res.json({ status: 'Ingestion completed', projectId });
        } catch (error: any) {
            console.error('Ingestion Error:', error);
            return res.status(500).json({ error: 'Internal Server Error during ingestion' });
        }
    }

    async queryVectorStore(req: Request, res: Response) {
        const { projectId, query, topK, minScore } = req.body;

        if (!projectId || !query) {
            return res.status(400).json({ error: 'Missing projectId or query' });
        }

        const limit     = topK      ? parseInt(topK)      : 5;
        const threshold = minScore  ? parseFloat(minScore) : 0.1;

        try {
            const queryEmbedding = await this.embeddingService.generateEmbedding(query);
            const results = await this.vectorStore.queryVectors(
                projectId, queryEmbedding, limit, threshold
            );

            return res.json({
                results: results.map(r => ({
                    chunk_text:        r.chunk_text,
                    document_group_id: r.document_group_id,
                    document_version:  r.document_version,
                    chunk_index:       r.chunk_index,
                    similarity_score:  r.similarity,
                    source_type:       r.source_type,
                    metadata:          r.metadata,
                }))
            });
        } catch (error: any) {
            console.error('Query Error:', error);
            return res.status(500).json({ error: 'Internal Server Error during query' });
        }
    }

    // ── Chatbot Engine ──────────────────────────────────────────────────────────

    async chatWithProject(req: Request, res: Response) {
        const { projectId, query, linkedProjectIds, provider, apiKey, userName, userEmail } = req.body;

        console.log(
            `[RagController] chatWithProject — project: ${projectId}, ` +
            `query: "${query?.substring(0, 80)}", linkedProjects: ${linkedProjectIds?.length || 0}, ` +
            `provider: ${provider || 'fallback'}`
        );

        if (!projectId || !query) {
            return res.status(400).json({ error: 'Missing projectId or query' });
        }

        try {
            const startTime = Date.now();
            const response = await this.chatService.askQuestion(
                projectId, query, linkedProjectIds, provider, apiKey, userName, userEmail
            );
            const elapsed = Date.now() - startTime;

            console.log(
                `[RagController] ChatService responded in ${elapsed}ms — confidence: ${response.confidence}`
            );

            return res.json(response);

        } catch (error: any) {
            console.error('[RagController] Chat Error:', error.message);
            console.error('[RagController] Stack:', error.stack);

            const isProviderError =
                error.message?.includes('API key')    ||
                error.message?.includes('rate limit') ||
                error.message?.includes('quota')      ||
                error.message?.includes('API error');

            return res.status(isProviderError ? 400 : 500).json({
                error: error.message || 'Internal Server Error during chat',
                providerError: isProviderError
            });
        }
    }

    // ── Analytics Endpoints ──────────────────────────────────────────────────────

    /**
     * GET /internal/projects/:projectId/rag-analytics
     *
     * Returns RAG Triad evaluation analytics for a specific project:
     * - Total evaluations run
     * - Average scores (contextRelevance, faithfulness, answerRelevance, overallScore)
     * - Quality trend (improving / stable / declining)
     */
    async getProjectRagAnalytics(req: Request, res: Response) {
        const { projectId } = req.params;
        if (!projectId) {
            return res.status(400).json({ error: 'Missing projectId' });
        }

        try {
            const analytics = this.evaluationService.getProjectAnalytics(projectId);
            return res.json({
                projectId,
                ...analytics,
                retrievedAt: new Date().toISOString(),
            });
        } catch (error: any) {
            console.error('[RagController] Analytics Error:', error);
            return res.status(500).json({ error: 'Failed to retrieve RAG analytics' });
        }
    }

    /**
     * GET /internal/rag-analytics/global
     *
     * Returns system-wide RAG evaluation statistics across all projects.
     */
    async getGlobalRagAnalytics(req: Request, res: Response) {
        try {
            const stats = this.evaluationService.getGlobalStats();
            return res.json({
                ...stats,
                retrievedAt: new Date().toISOString(),
            });
        } catch (error: any) {
            console.error('[RagController] Global Analytics Error:', error);
            return res.status(500).json({ error: 'Failed to retrieve global RAG analytics' });
        }
    }

    /**
     * GET /internal/rag-analytics/cache
     *
     * Returns cache hit rates and memory usage.
     */
    async getCacheStats(req: Request, res: Response) {
        try {
            const stats = this.cacheService.getStats();
            return res.json({
                cache: stats,
                retrievedAt: new Date().toISOString(),
            });
        } catch (error: any) {
            console.error('[RagController] Cache Stats Error:', error);
            return res.status(500).json({ error: 'Failed to retrieve cache stats' });
        }
    }

    /**
     * DELETE /internal/projects/:projectId/cache
     *
     * Manually invalidate the retrieval and response cache for a project.
     */
    async invalidateProjectCache(req: Request, res: Response) {
        const { projectId } = req.params;
        if (!projectId) {
            return res.status(400).json({ error: 'Missing projectId' });
        }

        try {
            this.cacheService.invalidateProject(projectId);
            return res.json({ message: `Cache invalidated for project ${projectId}` });
        } catch (error: any) {
            console.error('[RagController] Cache Invalidation Error:', error);
            return res.status(500).json({ error: 'Failed to invalidate cache' });
        }
    }
}
