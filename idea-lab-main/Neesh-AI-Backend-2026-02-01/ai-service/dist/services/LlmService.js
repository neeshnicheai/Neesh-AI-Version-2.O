"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LlmService = void 0;
const SystemPrompts_1 = require("../prompts/SystemPrompts");
class LlmService {
    constructor() {
        this.fallbackApiKey = process.env.OPENROUTER_API_KEY || null;
        this.fallbackModel = process.env.OPENROUTER_MODEL || 'meta-llama/llama-3-8b-instruct:free';
        if (this.fallbackApiKey) {
            console.log(`[LlmService] Initialized with OpenRouter fallback model: ${this.fallbackModel}`);
        }
        else {
            console.log('[LlmService] No fallback OPENROUTER_API_KEY set — user must provide their own key');
        }
    }
    /**
     * Resolve provider config: use user-provided if available, else fallback
     */
    resolveConfig(provider, apiKey) {
        if (provider && apiKey) {
            return { provider: provider.toUpperCase(), apiKey };
        }
        if (this.fallbackApiKey) {
            return { provider: 'OPENROUTER', apiKey: this.fallbackApiKey };
        }
        throw new Error('No LLM API key configured. Please add your API key in Settings.');
    }
    /**
     * Strip chain-of-thought / reasoning text from LLM responses.
     */
    stripReasoning(text) {
        if (!text)
            return text;
        const trimmed = text.trim();
        const reasoningPrefixes = [
            /^(?:Okay|Ok|Alright|Let me|So,? |First|Hmm|Right|Now|Wait|Thinking|I think|Looking)/i,
        ];
        let hasReasoning = false;
        for (const pattern of reasoningPrefixes) {
            if (pattern.test(trimmed)) {
                const metaPhrases = /(?:the user|I need to|I should|let'?s|looking at|the question|user'?s|need to respond|keep it|should be|maybe|perhaps|putting it|make sure|checking|instructions?)/i;
                if (metaPhrases.test(trimmed.substring(0, 300))) {
                    hasReasoning = true;
                    break;
                }
            }
        }
        if (!hasReasoning)
            return text;
        console.log('[LlmService] Detected reasoning text in response, stripping...');
        const blocks = trimmed.split(/\n\n+/);
        if (blocks.length >= 2) {
            for (let i = 1; i < blocks.length; i++) {
                const block = blocks[i].trim();
                const isReasoning = /^(?:Okay|Ok|Alright|Let me|So |First|Hmm|Wait|Also|But|Now|Check|I (?:need|should|think|want))/i.test(block);
                if (!isReasoning && block.length > 15) {
                    const answer = blocks.slice(i).join('\n\n').trim();
                    console.log(`[LlmService] Stripped reasoning, kept answer: ${answer.length} chars`);
                    return answer;
                }
            }
        }
        const answerPatterns = [
            /(?:^|\n)("?(?:Hello|Hi|Hey|Welcome|Greetings|Thank)[^]*)/im,
            /(?:^|\n)("?(?:The (?:product|project|platform|application|system|service))[^]*)/im,
            /(?:^|\n)("?(?:Based on|According to|From the)[^]*)/im,
            /(?:^|\n)("?(?:This (?:is|project|product|platform))[^]*)/im,
            /(?:^|\n)("?(?:I'?m here|I can help|Feel free)[^]*)/im,
        ];
        for (const pattern of answerPatterns) {
            const match = trimmed.match(pattern);
            if (match && match[1] && match[1].trim().length > 15) {
                console.log(`[LlmService] Found answer via pattern match: ${match[1].trim().length} chars`);
                return match[1].trim();
            }
        }
        const lastBlock = blocks[blocks.length - 1].trim();
        if (lastBlock.length > 15 && blocks.length >= 2) {
            console.log(`[LlmService] Using last paragraph as answer: ${lastBlock.length} chars`);
            return lastBlock;
        }
        console.log('[LlmService] Could not strip reasoning, returning original');
        return text;
    }
    /**
     * Generate a warm greeting response
     */
    async generateGreeting(query, provider, apiKey) {
        console.log(`[LlmService] generateGreeting called - query: "${query}"`);
        const config = this.resolveConfig(provider, apiKey);
        const messages = [
            { role: 'system', content: SystemPrompts_1.GREETING_SYSTEM_PROMPT },
            { role: 'user', content: query }
        ];
        const text = await this.callProvider(config, messages, 100, 0.7);
        return {
            answer: text.trim() || "Hello! 👋 I'm here to help you with questions about this project. Ask me anything!",
            confidence: 'HIGH'
        };
    }
    /**
     * Generate an answer using RAG context or direct Q&A
     */
    async generateAnswer(query, contextChunks, provider, apiKey) {
        console.log(`[LlmService] generateAnswer called - query: "${query}", chunks: ${contextChunks.length}`);
        const config = this.resolveConfig(provider, apiKey);
        try {
            let userPrompt;
            if (contextChunks.length === 0) {
                userPrompt = (0, SystemPrompts_1.constructUserPrompt)(query, []);
                console.log('[LlmService] No context provided — using general answer mode');
            }
            else {
                userPrompt = (0, SystemPrompts_1.constructUserPrompt)(query, contextChunks);
                console.log('[LlmService] Using RAG mode with context');
            }
            const messages = [
                { role: 'system', content: SystemPrompts_1.FOUNDER_SYSTEM_PROMPT },
                { role: 'user', content: userPrompt }
            ];
            let text = await this.callProvider(config, messages, 800, 0);
            // Retry once if empty response
            if (!text.trim()) {
                console.warn('[LlmService] Empty response from LLM, retrying once...');
                await new Promise(resolve => setTimeout(resolve, 1000));
                text = await this.callProvider(config, messages, 800, 0);
            }
            console.log(`[LlmService] Generated response, length: ${text.length}`);
            let confidence = contextChunks.length > 0 ? 'HIGH' : 'MEDIUM';
            if (!text.trim()) {
                confidence = 'LOW';
            }
            return { answer: text.trim(), confidence };
        }
        catch (error) {
            console.error("[LlmService] LLM Generation Error:", error.message || error);
            throw error; // Re-throw to preserve provider-specific error messages
        }
    }
    /**
     * Route to the correct provider's API
     */
    async callProvider(config, messages, maxTokens, temperature) {
        console.log(`[LlmService] Calling provider: ${config.provider}`);
        switch (config.provider) {
            case 'OPENROUTER':
                return this.callOpenRouter(config.apiKey, messages, maxTokens, temperature);
            case 'OPENAI':
                return this.callOpenAI(config.apiKey, messages, maxTokens, temperature);
            case 'CLAUDE':
                return this.callClaude(config.apiKey, messages, maxTokens, temperature);
            case 'GEMINI':
                return this.callGemini(config.apiKey, messages, maxTokens, temperature);
            default:
                console.warn(`[LlmService] Provider ${config.provider} not explicitly supported for text chat yet. Falling back to default OpenRouter if available.`);
                if (this.fallbackApiKey) {
                    return this.callOpenRouter(this.fallbackApiKey, messages, maxTokens, temperature);
                }
                throw new Error(`Provider ${config.provider} is not supported for text generation and no default fallback key exists.`);
        }
    }
    /**
     * OpenRouter API (existing logic, parameterized)
     */
    async callOpenRouter(apiKey, messages, maxTokens, temperature) {
        const model = this.fallbackModel;
        console.log(`[LlmService] Sending request to OpenRouter (${model})...`);
        const maxRetries = 3;
        let lastError = '';
        let data = null;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'https://neesh-ai.com',
                    'X-Title': 'Neesh AI Chatbot'
                },
                body: JSON.stringify({
                    model,
                    messages,
                    max_tokens: maxTokens,
                    temperature,
                    seed: 42,
                    reasoning: { exclude: true }
                })
            });
            if (response.ok) {
                data = await response.json();
                console.log(`[LlmService] OpenRouter responded successfully on attempt ${attempt}`);
                break;
            }
            const errorBody = await response.text();
            lastError = errorBody;
            if (response.status === 401) {
                throw new Error('Invalid OpenRouter API key. Please check your key in Settings.');
            }
            if (response.status === 429 && attempt < maxRetries) {
                const waitMs = attempt * 3000;
                console.warn(`[LlmService] Rate limited (429), retrying in ${waitMs}ms (attempt ${attempt}/${maxRetries})...`);
                await new Promise(resolve => setTimeout(resolve, waitMs));
                continue;
            }
            if (response.status === 429) {
                throw new Error('OpenRouter rate limit exceeded. Please try again later.');
            }
            console.error(`[LlmService] OpenRouter API error (${response.status}): ${errorBody}`);
            throw new Error(`OpenRouter API error: ${response.status} - ${errorBody}`);
        }
        if (!data) {
            throw new Error(`OpenRouter API failed after ${maxRetries} retries: ${lastError}`);
        }
        const rawText = data.choices?.[0]?.message?.content || '';
        return this.stripReasoning(rawText);
    }
    /**
     * OpenAI API (ChatGPT)
     */
    async callOpenAI(apiKey, messages, maxTokens, temperature) {
        const model = 'gpt-4o-mini';
        console.log(`[LlmService] Sending request to OpenAI (${model})...`);
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model,
                messages,
                max_tokens: maxTokens,
                temperature,
                seed: 42,
            })
        });
        if (!response.ok) {
            const errorBody = await response.text();
            if (response.status === 401) {
                throw new Error('Invalid OpenAI API key. Please check your key in Settings.');
            }
            if (response.status === 429) {
                throw new Error('OpenAI rate limit exceeded. Please try again later or check your usage limits.');
            }
            if (response.status === 402) {
                throw new Error('OpenAI: Insufficient quota. Please check your billing details.');
            }
            console.error(`[LlmService] OpenAI API error (${response.status}): ${errorBody}`);
            throw new Error(`OpenAI API error (${response.status}): ${errorBody}`);
        }
        const data = await response.json();
        const rawText = data.choices?.[0]?.message?.content || '';
        console.log(`[LlmService] OpenAI responded successfully`);
        return this.stripReasoning(rawText);
    }
    /**
     * Claude / Anthropic API
     */
    async callClaude(apiKey, messages, maxTokens, temperature) {
        const model = 'claude-sonnet-4-20250514';
        console.log(`[LlmService] Sending request to Claude/Anthropic (${model})...`);
        // Anthropic uses a different message format: system is separate, messages use 'user'/'assistant' roles
        const systemMessage = messages.find(m => m.role === 'system')?.content || '';
        const anthropicMessages = messages
            .filter(m => m.role !== 'system')
            .map(m => ({
            role: m.role === 'user' ? 'user' : 'assistant',
            content: m.content
        }));
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'x-api-key': apiKey,
                'Content-Type': 'application/json',
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model,
                max_tokens: maxTokens,
                temperature,
                system: systemMessage,
                messages: anthropicMessages
            })
        });
        if (!response.ok) {
            const errorBody = await response.text();
            if (response.status === 401) {
                throw new Error('Invalid Claude/Anthropic API key. Please check your key in Settings.');
            }
            if (response.status === 429) {
                throw new Error('Claude rate limit exceeded. Please try again later.');
            }
            if (response.status === 400) {
                // Parse Anthropic error for more detail
                try {
                    const errJson = JSON.parse(errorBody);
                    throw new Error(`Claude API error: ${errJson.error?.message || errorBody}`);
                }
                catch (parseErr) {
                    if (parseErr.message.startsWith('Claude'))
                        throw parseErr;
                    throw new Error(`Claude API error (${response.status}): ${errorBody}`);
                }
            }
            console.error(`[LlmService] Claude API error (${response.status}): ${errorBody}`);
            throw new Error(`Claude API error (${response.status}): ${errorBody}`);
        }
        const data = await response.json();
        // Anthropic response format: { content: [{ type: 'text', text: '...' }] }
        const rawText = data.content?.[0]?.text || '';
        console.log(`[LlmService] Claude responded successfully`);
        return this.stripReasoning(rawText);
    }
    /**
     * Google Gemini API
     */
    async callGemini(apiKey, messages, maxTokens, temperature) {
        const model = 'gemini-2.0-flash';
        console.log(`[LlmService] Sending request to Google Gemini (${model})...`);
        // Gemini uses a different format: contents array with parts
        const systemMessage = messages.find(m => m.role === 'system')?.content || '';
        const geminiContents = messages
            .filter(m => m.role !== 'system')
            .map(m => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }]
        }));
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: geminiContents,
                systemInstruction: systemMessage ? { parts: [{ text: systemMessage }] } : undefined,
                generationConfig: {
                    maxOutputTokens: maxTokens,
                    temperature,
                }
            })
        });
        if (!response.ok) {
            const errorBody = await response.text();
            if (response.status === 400 && errorBody.includes('API_KEY_INVALID')) {
                throw new Error('Invalid Gemini API key. Please check your key in Settings.');
            }
            if (response.status === 403) {
                throw new Error('Gemini API key does not have permission. Please check your API key and enable the Generative Language API.');
            }
            if (response.status === 429) {
                throw new Error('Gemini rate limit exceeded. Please try again later.');
            }
            console.error(`[LlmService] Gemini API error (${response.status}): ${errorBody}`);
            throw new Error(`Gemini API error (${response.status}): ${errorBody}`);
        }
        const data = await response.json();
        // Gemini response format: { candidates: [{ content: { parts: [{ text: '...' }] } }] }
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        console.log(`[LlmService] Gemini responded successfully`);
        return this.stripReasoning(rawText);
    }
}
exports.LlmService = LlmService;
