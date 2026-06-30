import { QueryResult } from './VectorStoreService';
import { EmbeddingService } from './EmbeddingService';

interface RerankedResult extends QueryResult {
    rerank_score: number;
    original_similarity: number;
}

export class RerankerService {
    private embeddingService: EmbeddingService;

    constructor(embeddingService?: EmbeddingService) {
        // Accept injected instance so the embedding cache is shared across the pipeline
        this.embeddingService = embeddingService || new EmbeddingService();
        console.log('[RerankerService] Initialized with batch-embedding semantic reranking');
    }

    /**
     * Rerank search results using batch semantic similarity.
     *
     * Makes exactly 2 OpenAI API calls regardless of the number of chunks:
     *   1. Generate query embedding (single)
     *   2. Batch-generate all chunk embeddings
     *
     * Each chunk receives a combined score:
     *   60% semantic cosine similarity  +  40% original pgvector similarity
     */
    async rerankResults(
        query: string,
        results: QueryResult[],
        topK: number = 5
    ): Promise<RerankedResult[]> {
        if (!results || results.length === 0) {
            return [];
        }

        if (results.length <= 1) {
            return results.map(r => ({
                ...r,
                rerank_score: r.similarity,
                original_similarity: r.similarity
            }));
        }

        console.log(`[RerankerService] Reranking ${results.length} results for query: "${query.substring(0, 60)}"`);

        try {
            // 1. Query embedding — single API call
            const queryEmbedding = await this.embeddingService.generateEmbedding(query);

            // 2. Chunk embeddings — one batched API call (100 texts per batch internally)
            const chunkTexts = results.map(r => r.chunk_text);
            const chunkEmbeddings = await this.embeddingService.generateEmbeddings(chunkTexts);

            // 3. Score and annotate
            const rerankedResults: RerankedResult[] = results.map((result, idx) => {
                const chunkEmbedding = chunkEmbeddings[idx];
                const semanticScore = this.cosineSimilarity(queryEmbedding, chunkEmbedding);
                const combinedScore = (semanticScore * 0.6) + (result.similarity * 0.4);

                return {
                    ...result,
                    rerank_score: combinedScore,
                    original_similarity: result.similarity,
                    similarity: combinedScore // overwrite so downstream sees the reranked score
                };
            });

            // 4. Sort descending and return top K
            const sorted = rerankedResults
                .sort((a, b) => b.rerank_score - a.rerank_score)
                .slice(0, topK);

            console.log(
                `[RerankerService] Done — top: ${sorted[0]?.rerank_score?.toFixed(3)}, ` +
                `bottom: ${sorted[sorted.length - 1]?.rerank_score?.toFixed(3)}`
            );

            return sorted;

        } catch (error: any) {
            console.warn(`[RerankerService] Reranking failed: ${error.message}. Using original order.`);
            return results.slice(0, topK).map(r => ({
                ...r,
                rerank_score: r.similarity,
                original_similarity: r.similarity
            }));
        }
    }

    /**
     * Cosine similarity between two equal-length vectors.
     */
    private cosineSimilarity(vecA: number[], vecB: number[]): number {
        if (vecA.length !== vecB.length) {
            console.warn('[RerankerService] Vector dimension mismatch');
            return 0;
        }

        let dot = 0, normA = 0, normB = 0;
        for (let i = 0; i < vecA.length; i++) {
            dot   += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }

        const denom = Math.sqrt(normA) * Math.sqrt(normB);
        return denom === 0 ? 0 : dot / denom;
    }
}