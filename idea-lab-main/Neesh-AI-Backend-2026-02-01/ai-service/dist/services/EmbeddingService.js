"use strict";
/**
 * EmbeddingService - OpenAI text-embedding-3-small integration
 *
 * Generates high-quality 1536-dimensional semantic embeddings for RAG.
 * Integrates with CacheService so repeated texts skip the API call entirely.
 *
 * Model: text-embedding-3-small (1536 dimensions, $0.02/1M tokens)
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmbeddingService = void 0;
const openai_1 = __importDefault(require("openai"));
class EmbeddingService {
    constructor(cacheService) {
        this.model = 'text-embedding-3-small';
        this.dimensions = 1536;
        this.maxTokens = 8191;
        this.batchSize = 100;
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            console.error('[EmbeddingService] OPENAI_API_KEY environment variable is required');
            throw new Error('OpenAI API key is required for embedding service');
        }
        this.openai = new openai_1.default({ apiKey });
        this.cacheService = cacheService || null;
        console.log(`[EmbeddingService] Initialized with OpenAI ${this.model} (${this.dimensions}D)` +
            (this.cacheService ? ' + embedding cache' : ''));
    }
    /**
     * Generate a semantic embedding for a single text.
     * Returns a cached embedding if one exists for this text.
     */
    async generateEmbedding(text) {
        const cleanText = this.preprocessText(text);
        if (cleanText.length === 0) {
            console.warn('[EmbeddingService] Empty text provided, returning zero vector');
            return new Array(this.dimensions).fill(0);
        }
        // --- Cache check ---
        if (this.cacheService) {
            const cached = this.cacheService.getCachedEmbedding(cleanText);
            if (cached)
                return cached;
        }
        try {
            const response = await this.openai.embeddings.create({
                model: this.model,
                input: cleanText,
                encoding_format: 'float',
            });
            const embedding = response.data[0].embedding;
            if (embedding.length !== this.dimensions) {
                throw new Error(`Unexpected embedding dimensions: ${embedding.length}`);
            }
            console.log(`[EmbeddingService] Generated embedding (${cleanText.length} chars, ` +
                `${response.usage.total_tokens} tokens)`);
            // --- Cache store ---
            if (this.cacheService) {
                this.cacheService.cacheEmbedding(cleanText, embedding);
            }
            return embedding;
        }
        catch (error) {
            console.error('[EmbeddingService] Failed to generate embedding:', error);
            if (error instanceof openai_1.default.APIError) {
                if (error.status === 429)
                    console.error('[EmbeddingService] Rate limit exceeded.');
                else if (error.status === 401)
                    console.error('[EmbeddingService] Invalid API key.');
            }
            // Return zero vector as fallback — callers should check for all-zero vectors
            console.warn('[EmbeddingService] Returning zero vector as fallback');
            return new Array(this.dimensions).fill(0);
        }
    }
    /**
     * Generate embeddings for multiple texts with batching and per-text cache lookup.
     * Texts that are already cached are skipped; only novel texts hit the API.
     */
    async generateEmbeddings(texts) {
        if (texts.length === 0)
            return [];
        const cleanTexts = texts.map(t => this.preprocessText(t));
        const result = new Array(texts.length);
        // Separate cached vs uncached
        const uncachedIndices = [];
        const uncachedTexts = [];
        for (let i = 0; i < cleanTexts.length; i++) {
            const text = cleanTexts[i];
            if (!text) {
                result[i] = new Array(this.dimensions).fill(0);
                continue;
            }
            if (this.cacheService) {
                const cached = this.cacheService.getCachedEmbedding(text);
                if (cached) {
                    result[i] = cached;
                    continue;
                }
            }
            uncachedIndices.push(i);
            uncachedTexts.push(text);
        }
        if (uncachedTexts.length > 0) {
            console.log(`[EmbeddingService] Generating ${uncachedTexts.length} embeddings ` +
                `(${texts.length - uncachedTexts.length} served from cache)`);
            // Process uncached texts in batches
            for (let i = 0; i < uncachedTexts.length; i += this.batchSize) {
                const batch = uncachedTexts.slice(i, i + this.batchSize);
                const batchOriginalIndices = uncachedIndices.slice(i, i + this.batchSize);
                console.log(`[EmbeddingService] Batch ${Math.floor(i / this.batchSize) + 1}/` +
                    `${Math.ceil(uncachedTexts.length / this.batchSize)}`);
                try {
                    const response = await this.openai.embeddings.create({
                        model: this.model,
                        input: batch,
                        encoding_format: 'float',
                    });
                    for (let j = 0; j < response.data.length; j++) {
                        const embedding = response.data[j].embedding;
                        const originalIdx = batchOriginalIndices[j];
                        result[originalIdx] = embedding;
                        // Cache each newly generated embedding
                        if (this.cacheService) {
                            this.cacheService.cacheEmbedding(batch[j], embedding);
                        }
                    }
                    console.log(`[EmbeddingService] Batch done: ${response.usage.total_tokens} tokens`);
                    if (i + this.batchSize < uncachedTexts.length) {
                        await this.delay(100);
                    }
                }
                catch (error) {
                    console.error(`[EmbeddingService] Batch failed:`, error);
                    // Fill with zero vectors for the failed batch
                    for (const originalIdx of batchOriginalIndices) {
                        result[originalIdx] = new Array(this.dimensions).fill(0);
                    }
                }
            }
        }
        return result;
    }
    getDimensions() { return this.dimensions; }
    getModel() { return this.model; }
    preprocessText(text) {
        if (!text || typeof text !== 'string')
            return '';
        let cleaned = text
            .replace(/\s+/g, ' ')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
        const estimatedTokens = cleaned.length / 4;
        if (estimatedTokens > this.maxTokens) {
            const maxChars = this.maxTokens * 4;
            cleaned = cleaned.substring(0, maxChars);
            console.warn(`[EmbeddingService] Text truncated to ${cleaned.length} chars`);
        }
        return cleaned;
    }
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    async testConnection() {
        try {
            await this.generateEmbedding('test');
            console.log('[EmbeddingService] ✅ OpenAI API connection successful');
            return true;
        }
        catch {
            console.error('[EmbeddingService] ❌ OpenAI API connection failed');
            return false;
        }
    }
}
exports.EmbeddingService = EmbeddingService;
