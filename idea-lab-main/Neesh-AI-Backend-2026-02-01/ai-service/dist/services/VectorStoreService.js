"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VectorStoreService = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
class VectorStoreService {
    constructor() {
        const sbUrl = process.env.SUPABASE_URL;
        const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!sbUrl || !sbKey) {
            throw new Error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set');
        }
        this.supabase = (0, supabase_js_1.createClient)(sbUrl, sbKey);
    }
    /**
     * Store chunk vectors with optional per-chunk metadata.
     * Deactivates all existing vectors for the same document_group_id first
     * so re-ingestion is idempotent.
     *
     * @param chunkMetadata  Optional array of metadata objects aligned with chunks[].
     */
    async storeVectors(projectId, documentGroupId, documentVersion, chunks, embeddings, vectorMetadata, chunkMetadata) {
        // 1. Invalidate old vectors for this document group
        const { error: deactivateError } = await this.supabase
            .from('project_embeddings')
            .update({ is_active: false })
            .eq('project_id', projectId)
            .eq('document_group_id', documentGroupId);
        if (deactivateError) {
            throw new Error(`Failed to invalidate vectors: ${deactivateError.message}`);
        }
        // 2. Prepare records with optional chunk-level metadata
        const records = chunks.map((chunk, idx) => ({
            project_id: projectId,
            document_group_id: documentGroupId,
            document_version: documentVersion,
            chunk_index: idx,
            chunk_text: chunk,
            embedding: embeddings[idx],
            is_active: true,
            source_type: vectorMetadata?.source_type || 'DOCUMENT',
            manual_answer_type: vectorMetadata?.manual_answer_type || null,
            metadata: chunkMetadata?.[idx] || null,
        }));
        if (records.length === 0)
            return;
        // 3. Insert new active vectors
        const { error: insertError } = await this.supabase
            .from('project_embeddings')
            .insert(records);
        if (insertError) {
            throw new Error(`Failed to insert vectors: ${insertError.message}`);
        }
    }
    async queryVectors(projectId, queryEmbedding, topK = 5, minScore = 0.1) {
        const { data, error } = await this.supabase.rpc('match_project_embeddings', {
            query_embedding: queryEmbedding,
            match_threshold: minScore,
            match_count: topK,
            filter_project_id: projectId
        });
        if (error)
            throw new Error(`Query failed: ${error.message}`);
        return data;
    }
    /**
     * Keyword-based full-text search on chunk_text — used as hybrid complement.
     */
    async searchByKeywords(projectId, query, topK = 5) {
        const STOP_WORDS = new Set([
            'what', 'is', 'the', 'this', 'how', 'are', 'does', 'for', 'and',
            'from', 'that', 'with', 'was', 'its', 'can', 'you', 'your', 'have',
            'has', 'will', 'would', 'about', 'which', 'there', 'their', 'they',
            'been', 'more', 'also', 'any', 'all', 'when', 'who'
        ]);
        const keywords = query
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, ' ')
            .split(/\s+/)
            .filter(w => w.length > 3 && !STOP_WORDS.has(w));
        if (keywords.length === 0)
            return [];
        console.log(`[VectorStoreService] Keyword search with terms: ${keywords.join(', ')}`);
        const orFilters = keywords.map(kw => `chunk_text.ilike.%${kw}%`).join(',');
        const { data, error } = await this.supabase
            .from('project_embeddings')
            .select('chunk_text, document_group_id, document_version, chunk_index, source_type, manual_answer_type, metadata')
            .eq('project_id', projectId)
            .eq('is_active', true)
            .or(orFilters)
            .limit(topK);
        if (error) {
            console.warn(`[VectorStoreService] Keyword search failed: ${error.message}`);
            return [];
        }
        if (!data || data.length === 0)
            return [];
        const scored = data.map(row => {
            const text = (row.chunk_text || '').toLowerCase();
            const matchCount = keywords.filter(k => text.includes(k)).length;
            return {
                chunk_text: row.chunk_text,
                document_group_id: row.document_group_id,
                document_version: row.document_version,
                chunk_index: row.chunk_index,
                similarity: (matchCount / keywords.length) * 0.6,
                source_type: row.source_type,
                manual_answer_type: row.manual_answer_type,
                metadata: row.metadata,
            };
        });
        return scored.sort((a, b) => b.similarity - a.similarity).slice(0, topK);
    }
    /**
     * Hybrid retrieval: vector similarity + keyword fallback, merged and deduped.
     */
    async queryHybrid(projectId, queryEmbedding, query, topK = 5, minScore = 0.05) {
        const [vectorResults, keywordResults] = await Promise.all([
            this.queryVectors(projectId, queryEmbedding, topK, minScore).catch(() => []),
            this.searchByKeywords(projectId, query, topK)
        ]);
        console.log(`[VectorStoreService] Hybrid: ${vectorResults.length} vector + ${keywordResults.length} keyword results`);
        const seen = new Set();
        const merged = [];
        for (const r of vectorResults) {
            const key = `${r.document_group_id}::${r.chunk_index}`;
            if (!seen.has(key)) {
                seen.add(key);
                merged.push(r);
            }
        }
        for (const r of keywordResults) {
            const key = `${r.document_group_id}::${r.chunk_index}`;
            if (!seen.has(key)) {
                seen.add(key);
                merged.push(r);
            }
        }
        return merged.sort((a, b) => b.similarity - a.similarity).slice(0, topK);
    }
    /**
     * Query across multiple linked projects, merge and sort by similarity.
     */
    async queryMultipleProjects(projectIds, queryEmbedding, query, topK = 5, minScore = 0.05) {
        if (projectIds.length === 0)
            return [];
        const results = await Promise.all(projectIds.map(async (pid) => {
            try {
                return await this.queryHybrid(pid, queryEmbedding, query, topK, minScore);
            }
            catch (err) {
                console.warn(`[VectorStoreService] Failed to query project ${pid}: ${err.message}`);
                return [];
            }
        }));
        return results.flat().sort((a, b) => b.similarity - a.similarity).slice(0, topK);
    }
}
exports.VectorStoreService = VectorStoreService;
