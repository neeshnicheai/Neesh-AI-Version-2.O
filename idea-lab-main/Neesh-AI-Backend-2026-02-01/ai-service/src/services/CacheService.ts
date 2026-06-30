import { QueryResult } from './VectorStoreService';

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    hitCount: number;
}

interface CacheStats {
    totalEntries: number;
    hitRate: number;
    totalHits: number;
    totalMisses: number;
    memoryUsageKB: number;
}

export class CacheService {
    private retrievalCache: Map<string, CacheEntry<QueryResult[]>> = new Map();
    private embeddingCache: Map<string, CacheEntry<number[]>> = new Map();
    private responseCache: Map<string, CacheEntry<any>> = new Map();

    // Cache configuration
    private static RETRIEVAL_TTL_MS = 15 * 60 * 1000; // 15 minutes
    private static EMBEDDING_TTL_MS = 60 * 60 * 1000; // 1 hour
    private static RESPONSE_TTL_MS = 5 * 60 * 1000; // 5 minutes

    private static MAX_RETRIEVAL_ENTRIES = 1000;
    private static MAX_EMBEDDING_ENTRIES = 2000;
    private static MAX_RESPONSE_ENTRIES = 500;

    // Statistics
    private stats = {
        retrievalHits: 0,
        retrievalMisses: 0,
        embeddingHits: 0,
        embeddingMisses: 0,
        responseHits: 0,
        responseMisses: 0
    };

    constructor() {
        console.log('[CacheService] Initialized with multi-layer caching');
        // Start background cleanup
        this.startCleanupInterval();
    }

    /**
     * Cache retrieval results by project ID and query hash.
     */
    cacheRetrievalResults(projectId: string, query: string, results: QueryResult[]): void {
        const key = this.generateRetrievalKey(projectId, query);
        const entry: CacheEntry<QueryResult[]> = {
            data: results,
            timestamp: Date.now(),
            hitCount: 0
        };

        this.retrievalCache.set(key, entry);
        this.cleanupCacheIfNeeded(this.retrievalCache, CacheService.MAX_RETRIEVAL_ENTRIES);
    }

    /**
     * Get cached retrieval results.
     */
    getCachedRetrievalResults(projectId: string, query: string): QueryResult[] | null {
        const key = this.generateRetrievalKey(projectId, query);
        const entry = this.retrievalCache.get(key);

        if (!entry) {
            this.stats.retrievalMisses++;
            return null;
        }

        if (Date.now() - entry.timestamp > CacheService.RETRIEVAL_TTL_MS) {
            this.retrievalCache.delete(key);
            this.stats.retrievalMisses++;
            return null;
        }

        entry.hitCount++;
        this.stats.retrievalHits++;
        console.log(`[CacheService] Retrieval cache HIT for query: "${query.substring(0, 50)}..."`);

        return entry.data;
    }

    /**
     * Cache embedding vectors by text hash.
     */
    cacheEmbedding(text: string, embedding: number[]): void {
        const key = this.generateTextKey(text);
        const entry: CacheEntry<number[]> = {
            data: embedding,
            timestamp: Date.now(),
            hitCount: 0
        };

        this.embeddingCache.set(key, entry);
        this.cleanupCacheIfNeeded(this.embeddingCache, CacheService.MAX_EMBEDDING_ENTRIES);
    }

    /**
     * Get cached embedding.
     */
    getCachedEmbedding(text: string): number[] | null {
        const key = this.generateTextKey(text);
        const entry = this.embeddingCache.get(key);

        if (!entry) {
            this.stats.embeddingMisses++;
            return null;
        }

        if (Date.now() - entry.timestamp > CacheService.EMBEDDING_TTL_MS) {
            this.embeddingCache.delete(key);
            this.stats.embeddingMisses++;
            return null;
        }

        entry.hitCount++;
        this.stats.embeddingHits++;
        console.log(`[CacheService] Embedding cache HIT for text: "${text.substring(0, 50)}..."`);

        return entry.data;
    }

    /**
     * Cache complete chat responses.
     */
    cacheResponse(projectId: string, query: string, response: any): void {
        const key = this.generateResponseKey(projectId, query);
        const entry: CacheEntry<any> = {
            data: response,
            timestamp: Date.now(),
            hitCount: 0
        };

        this.responseCache.set(key, entry);
        this.cleanupCacheIfNeeded(this.responseCache, CacheService.MAX_RESPONSE_ENTRIES);
    }

    /**
     * Get cached response.
     */
    getCachedResponse(projectId: string, query: string): any | null {
        const key = this.generateResponseKey(projectId, query);
        const entry = this.responseCache.get(key);

        if (!entry) {
            this.stats.responseMisses++;
            return null;
        }

        if (Date.now() - entry.timestamp > CacheService.RESPONSE_TTL_MS) {
            this.responseCache.delete(key);
            this.stats.responseMisses++;
            return null;
        }

        entry.hitCount++;
        this.stats.responseHits++;
        console.log(`[CacheService] Response cache HIT for query: "${query}"`);

        return entry.data;
    }

    /**
     * Invalidate all cached results for a project (used when project content changes).
     */
    invalidateProject(projectId: string): void {
        let removedCount = 0;

        // Remove from retrieval cache
        for (const [key] of this.retrievalCache) {
            if (key.startsWith(`proj:${projectId}:`)) {
                this.retrievalCache.delete(key);
                removedCount++;
            }
        }

        // Remove from response cache
        for (const [key] of this.responseCache) {
            if (key.startsWith(`resp:${projectId}:`)) {
                this.responseCache.delete(key);
                removedCount++;
            }
        }

        console.log(`[CacheService] Invalidated ${removedCount} cache entries for project ${projectId}`);
    }

    /**
     * Get comprehensive cache statistics.
     */
    getStats(): CacheStats {
        const totalHits = this.stats.retrievalHits + this.stats.embeddingHits + this.stats.responseHits;
        const totalMisses = this.stats.retrievalMisses + this.stats.embeddingMisses + this.stats.responseMisses;
        const totalRequests = totalHits + totalMisses;

        return {
            totalEntries: this.retrievalCache.size + this.embeddingCache.size + this.responseCache.size,
            hitRate: totalRequests > 0 ? (totalHits / totalRequests) * 100 : 0,
            totalHits,
            totalMisses,
            memoryUsageKB: this.estimateMemoryUsage()
        };
    }

    /**
     * Generate cache keys.
     */
    private generateRetrievalKey(projectId: string, query: string): string {
        return `proj:${projectId}:${this.hashString(query)}`;
    }

    private generateResponseKey(projectId: string, query: string): string {
        return `resp:${projectId}:${this.hashString(query)}`;
    }

    private generateTextKey(text: string): string {
        return `text:${this.hashString(text)}`;
    }

    /**
     * Hash function for generating cache keys.
     */
    private hashString(str: string): string {
        let hash = 0;
        if (str.length === 0) return hash.toString();

        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }

        return Math.abs(hash).toString(36);
    }

    /**
     * Clean up cache when it exceeds maximum entries.
     */
    private cleanupCacheIfNeeded<T>(cache: Map<string, CacheEntry<T>>, maxEntries: number): void {
        if (cache.size <= maxEntries) return;

        // Remove 20% of entries, prioritizing least frequently used
        const entriesToRemove = Math.floor(cache.size * 0.2);
        const sortedEntries = Array.from(cache.entries())
            .sort(([, a], [, b]) => a.hitCount - b.hitCount);

        for (let i = 0; i < entriesToRemove; i++) {
            cache.delete(sortedEntries[i][0]);
        }

        console.log(`[CacheService] Cleaned up ${entriesToRemove} entries from cache`);
    }

    /**
     * Start background cleanup for expired entries.
     */
    private startCleanupInterval(): void {
        setInterval(() => {
            this.cleanupExpiredEntries();
        }, 10 * 60 * 1000); // Run every 10 minutes
    }

    /**
     * Remove expired entries from all caches.
     */
    private cleanupExpiredEntries(): void {
        const now = Date.now();
        let removedCount = 0;

        // Clean retrieval cache
        for (const [key, entry] of this.retrievalCache) {
            if (now - entry.timestamp > CacheService.RETRIEVAL_TTL_MS) {
                this.retrievalCache.delete(key);
                removedCount++;
            }
        }

        // Clean embedding cache
        for (const [key, entry] of this.embeddingCache) {
            if (now - entry.timestamp > CacheService.EMBEDDING_TTL_MS) {
                this.embeddingCache.delete(key);
                removedCount++;
            }
        }

        // Clean response cache
        for (const [key, entry] of this.responseCache) {
            if (now - entry.timestamp > CacheService.RESPONSE_TTL_MS) {
                this.responseCache.delete(key);
                removedCount++;
            }
        }

        if (removedCount > 0) {
            console.log(`[CacheService] Cleaned up ${removedCount} expired cache entries`);
        }
    }

    /**
     * Estimate memory usage in KB.
     */
    private estimateMemoryUsage(): number {
        // Rough estimation - each cache entry is approximately 1KB on average
        const totalEntries = this.retrievalCache.size + this.embeddingCache.size + this.responseCache.size;
        return totalEntries * 1; // KB
    }

    /**
     * Clear all caches (for maintenance or testing).
     */
    clearAll(): void {
        this.retrievalCache.clear();
        this.embeddingCache.clear();
        this.responseCache.clear();
        console.log('[CacheService] All caches cleared');
    }
}