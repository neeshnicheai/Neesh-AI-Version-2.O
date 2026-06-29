"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryExpansionService = void 0;
/**
 * QueryExpansionService
 *
 * Generates semantically meaningful alternative queries using two strategies:
 *   1. LLM-powered expansion (primary) — asks the LLM for 3 paraphrases/variations
 *   2. Heuristic fallback (synonym dictionary) — used when LLM call fails or is skipped
 *
 * The combined result is deduplicated and limited to 4 total variations
 * (original + up to 3 alternatives) to keep the retrieval cost bounded.
 */
class QueryExpansionService {
    constructor() {
        this.synonymDict = new Map();
        this.queryCache = new Map();
        this.initializeSynonymDictionary();
        console.log('[QueryExpansionService] Initialized with LLM + heuristic query expansion');
    }
    /**
     * Expand a query using LLM paraphrasing (primary) + synonym dictionary (fallback).
     * Returns an array that always starts with the original query.
     *
     * @param query     The user's original query
     * @param provider  LLM provider string ('OPENAI', 'OPENROUTER', 'GEMINI', 'CLAUDE')
     * @param apiKey    Active API key for the provider
     * @param maxVariations  Maximum number of total variations (including original), default 3
     */
    async expandQuery(query, provider, apiKey, maxVariations = 3) {
        const cacheKey = `${query.toLowerCase().trim()}::${maxVariations}`;
        if (this.queryCache.has(cacheKey)) {
            console.log(`[QueryExpansionService] Cache hit for query: "${query.substring(0, 50)}"`);
            return this.queryCache.get(cacheKey);
        }
        console.log(`[QueryExpansionService] Expanding query: "${query.substring(0, 80)}"`);
        let variations = [query];
        // 1. Try LLM-powered expansion
        if (provider && apiKey) {
            try {
                const llmVariations = await this.expandWithLLM(query, provider, apiKey, maxVariations - 1);
                variations = this.deduplicateVariations([query, ...llmVariations]);
                console.log(`[QueryExpansionService] LLM generated ${llmVariations.length} variations`);
            }
            catch (err) {
                console.warn(`[QueryExpansionService] LLM expansion failed (${err.message}), using heuristics`);
                variations = this.expandWithHeuristics(query, maxVariations);
            }
        }
        else {
            // No LLM available — fall back to heuristics
            variations = this.expandWithHeuristics(query, maxVariations);
        }
        const limited = variations.slice(0, maxVariations);
        // Cache result (LRU-capped at 500 entries)
        if (this.queryCache.size >= 500) {
            const firstKey = this.queryCache.keys().next().value;
            if (firstKey)
                this.queryCache.delete(firstKey);
        }
        this.queryCache.set(cacheKey, limited);
        return limited;
    }
    /**
     * LLM-powered query expansion.
     * Sends a compact prompt asking for N alternative search queries and parses JSON back.
     */
    async expandWithLLM(query, provider, apiKey, count) {
        const prompt = `Generate ${count} alternative search queries for the following query. ` +
            `Each variation should capture the same intent using different wording, synonyms, or perspective. ` +
            `Return ONLY a JSON array of strings with no extra text.\n\nOriginal query: "${query}"`;
        let responseText = '';
        switch (provider.toUpperCase()) {
            case 'OPENAI':
                responseText = await this.callOpenAI(apiKey, prompt);
                break;
            case 'OPENROUTER':
                responseText = await this.callOpenRouter(apiKey, prompt);
                break;
            case 'GEMINI':
                responseText = await this.callGemini(apiKey, prompt);
                break;
            case 'CLAUDE':
                responseText = await this.callClaude(apiKey, prompt);
                break;
            default:
                throw new Error(`Unsupported provider: ${provider}`);
        }
        // Parse JSON array from LLM response
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (!jsonMatch)
            throw new Error('LLM did not return a valid JSON array');
        const parsed = JSON.parse(jsonMatch[0]);
        if (!Array.isArray(parsed))
            throw new Error('Parsed value is not an array');
        return parsed
            .filter((v) => typeof v === 'string' && v.trim().length > 0)
            .map((v) => v.trim())
            .slice(0, count);
    }
    /**
     * Heuristic fallback: synonym dictionary + simple paraphrasing patterns.
     */
    expandWithHeuristics(query, maxVariations) {
        const variations = new Set([query]);
        const words = query.toLowerCase().split(/\s+/);
        for (const word of words) {
            const syns = this.synonymDict.get(word) || [];
            for (const syn of syns.slice(0, 2)) {
                const variation = query.replace(new RegExp(`\\b${word}\\b`, 'i'), syn);
                variations.add(variation);
                if (variations.size >= maxVariations)
                    break;
            }
            if (variations.size >= maxVariations)
                break;
        }
        // Add a question-form variation if we haven't hit the limit
        if (variations.size < maxVariations && !query.includes('?')) {
            variations.add(`Tell me about ${query}`);
        }
        return Array.from(variations).slice(0, maxVariations);
    }
    deduplicateVariations(variations) {
        const seen = new Set();
        return variations.filter(v => {
            const key = v.toLowerCase().trim();
            if (seen.has(key))
                return false;
            seen.add(key);
            return true;
        });
    }
    // --- Minimal LLM caller methods (low max_tokens since only short JSON needed) ---
    async callOpenAI(apiKey, prompt) {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 200,
                temperature: 0.4,
            })
        });
        if (!res.ok)
            throw new Error(`OpenAI ${res.status}`);
        const data = await res.json();
        return data.choices?.[0]?.message?.content || '';
    }
    async callOpenRouter(apiKey, prompt) {
        const model = process.env.OPENROUTER_MODEL || 'meta-llama/llama-3-8b-instruct:free';
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://neesh-ai.com',
                'X-Title': 'Neesh AI Query Expansion',
            },
            body: JSON.stringify({
                model,
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 200,
                temperature: 0.4,
            })
        });
        if (!res.ok)
            throw new Error(`OpenRouter ${res.status}`);
        const data = await res.json();
        return data.choices?.[0]?.message?.content || '';
    }
    async callGemini(apiKey, prompt) {
        const model = 'gemini-2.0-flash';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: { maxOutputTokens: 200, temperature: 0.4 },
            })
        });
        if (!res.ok)
            throw new Error(`Gemini ${res.status}`);
        const data = await res.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }
    async callClaude(apiKey, prompt) {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'x-api-key': apiKey,
                'Content-Type': 'application/json',
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 200,
                temperature: 0.4,
                messages: [{ role: 'user', content: prompt }],
            })
        });
        if (!res.ok)
            throw new Error(`Claude ${res.status}`);
        const data = await res.json();
        return data.content?.[0]?.text || '';
    }
    initializeSynonymDictionary() {
        const synonyms = {
            'api': ['endpoint', 'interface', 'service'],
            'database': ['db', 'data store', 'repository'],
            'user': ['customer', 'client', 'account'],
            'login': ['signin', 'authentication', 'access'],
            'password': ['credential', 'passcode', 'key'],
            'system': ['platform', 'infrastructure', 'application'],
            'project': ['initiative', 'program', 'product'],
            'feature': ['functionality', 'capability', 'function'],
            'issue': ['problem', 'bug', 'error'],
            'report': ['summary', 'analysis', 'document'],
            'create': ['make', 'build', 'generate'],
            'update': ['modify', 'change', 'edit'],
            'delete': ['remove', 'erase', 'clear'],
            'search': ['find', 'query', 'look for'],
            'view': ['see', 'display', 'show'],
            'configure': ['setup', 'set up', 'adjust'],
            'install': ['deploy', 'setup', 'add'],
            'active': ['enabled', 'running', 'live'],
            'inactive': ['disabled', 'stopped', 'offline'],
            'pending': ['waiting', 'queued', 'in progress'],
            'complete': ['done', 'finished', 'ready'],
            'failed': ['error', 'broken', 'unsuccessful'],
        };
        for (const [key, values] of Object.entries(synonyms)) {
            this.synonymDict.set(key, values);
        }
        console.log(`[QueryExpansionService] Loaded ${this.synonymDict.size} synonym mappings`);
    }
    clearCache() {
        this.queryCache.clear();
        console.log('[QueryExpansionService] Cache cleared');
    }
}
exports.QueryExpansionService = QueryExpansionService;
