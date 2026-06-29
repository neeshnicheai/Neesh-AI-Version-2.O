"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IngestionService = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const ChunkingService_1 = require("./ChunkingService");
const EmbeddingService_1 = require("./EmbeddingService");
const VectorStoreService_1 = require("./VectorStoreService");
const CacheService_1 = require("./CacheService");
class IngestionService {
    constructor(cacheService) {
        const sbUrl = process.env.SUPABASE_URL;
        const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!sbUrl || !sbKey)
            throw new Error('SUPABASE env vars missing');
        this.supabase = (0, supabase_js_1.createClient)(sbUrl, sbKey);
        this.cacheService = cacheService || new CacheService_1.CacheService();
        // Share CacheService with EmbeddingService so chunk embeddings are cached
        this.embeddingService = new EmbeddingService_1.EmbeddingService(this.cacheService);
        this.chunkingService = new ChunkingService_1.ChunkingService();
        this.vectorStore = new VectorStoreService_1.VectorStoreService();
    }
    async ingestProject(projectId) {
        console.log(`[IngestionService] Starting ingestion for project ${projectId}`);
        // 1. Fetch active documents (must have extracted text in the 'content' column)
        const { data: documents, error } = await this.supabase
            .from('documents')
            .select('*')
            .eq('project_id', projectId)
            .eq('is_active', true);
        if (error || !documents) {
            throw new Error(`Failed to fetch documents: ${error?.message || 'No documents found'}`);
        }
        console.log(`[IngestionService] Found ${documents.length} active documents to index.`);
        if (documents.length === 0) {
            console.log('[IngestionService] No documents to ingest.');
            return;
        }
        const chunkConfig = this.chunkingService.getConfig();
        for (const doc of documents) {
            try {
                console.log(`[IngestionService] Processing: ${doc.original_filename} (v${doc.version})`);
                const content = doc.content;
                if (!content || content.trim().length === 0) {
                    console.warn(`[IngestionService] "${doc.original_filename}" has no text content — skipping.`);
                    continue;
                }
                console.log(`[IngestionService] Content length: ${content.length} chars`);
                // 2. Chunk
                const chunks = await this.chunkingService.chunkText(content);
                console.log(`[IngestionService] Created ${chunks.length} chunks`);
                if (chunks.length === 0)
                    continue;
                // 3. Generate embeddings (cache-aware — skips previously seen chunks)
                const embeddings = await this.embeddingService.generateEmbeddings(chunks);
                console.log(`[IngestionService] Generated ${embeddings.length} embeddings`);
                // 4. Build per-chunk metadata for retrieval enrichment
                const chunkMetadata = chunks.map((_, idx) => ({
                    filename: doc.original_filename,
                    mimeType: doc.mime_type,
                    version: doc.version,
                    chunkSize: chunkConfig.chunkSize,
                    chunkOverlap: chunkConfig.chunkOverlap,
                    chunkIndex: idx,
                    totalChunks: chunks.length,
                    ingestedAt: new Date().toISOString(),
                }));
                // 5. Store vectors with metadata (idempotent — deactivates old version first)
                await this.vectorStore.storeVectors(projectId, doc.document_group_id, doc.version, chunks, embeddings, undefined, // vectorMetadata — default DOCUMENT source
                chunkMetadata);
                console.log(`[IngestionService] ✅ Indexed "${doc.original_filename}" (${chunks.length} chunks)`);
            }
            catch (err) {
                console.error(`[IngestionService] Error processing ${doc.original_filename}:`, err.message);
                // Continue with remaining documents
            }
        }
        // 6. Invalidate retrieval and response cache for this project so stale results are purged
        this.cacheService.invalidateProject(projectId);
        console.log(`[IngestionService] Ingestion complete for project ${projectId}`);
    }
}
exports.IngestionService = IngestionService;
