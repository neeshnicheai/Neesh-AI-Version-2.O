import { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/api';

export type LlmProvider = string;

export interface SavedProvider {
    provider: LlmProvider;
    createdAt: string;
    updatedAt: string;
}

interface UseApiKeysReturn {
    savedProviders: SavedProvider[];
    loading: boolean;
    saving: boolean;
    error: string | null;
    saveApiKey: (provider: LlmProvider, apiKey: string) => Promise<boolean>;
    deleteApiKey: (provider: LlmProvider) => Promise<boolean>;
    refreshProviders: () => Promise<void>;
}

export const PROVIDER_CATEGORIES = [
  {
    category: "LLM / TEXT AI APIs",
    providers: [
      { id: "OPENROUTER", name: "OpenRouter" },
      { id: "OPENAI", name: "OpenAI" },
      { id: "CLAUDE", name: "Anthropic Claude" },
      { id: "GEMINI", name: "Google DeepMind (Gemini)", isDefault: true },
      { id: "GEMINI_25_PRO", name: "  └ Gemini 2.5 Pro" },
      { id: "GEMINI_25_FLASH", name: "  └ Gemini 2.5 Flash" },
      { id: "GEMINI_20_FLASH", name: "  └ Gemini 2.0 Flash" },
      { id: "GEMINI_20_FLASH_LITE", name: "  └ Gemini 2.0 Flash-Lite" },
      { id: "GEMINI_15_PRO", name: "  └ Gemini 1.5 Pro" },
      { id: "GEMINI_15_FLASH", name: "  └ Gemini 1.5 Flash" },
      { id: "AZURE_OPENAI", name: "Microsoft Azure OpenAI" },
      { id: "META", name: "Meta (LLaMA via partners)" },
      { id: "MISTRAL", name: "Mistral AI" },
      { id: "COHERE", name: "Cohere" },
      { id: "AI21", name: "AI21 Labs" },
      { id: "XAI", name: "xAI" },
      { id: "INFLECTION", name: "Inflection AI" },
      { id: "BAIDU_ERNIE", name: "Baidu (ERNIE)" },
      { id: "ALIBABA_QWEN", name: "Alibaba Cloud (Qwen)" },
      { id: "TENCENT_AI", name: "Tencent AI" },
      { id: "YANDEX", name: "Yandex AI" },
      { id: "NAVER", name: "Naver HyperCLOVA" },
      { id: "WRITER_AI", name: "Writer AI" },
      { id: "PERPLEXITY", name: "Perplexity AI" },
      { id: "DEEPSEEK", name: "DeepSeek AI" },
      { id: "01_AI", name: "01.AI" },
      { id: "ZHIPU", name: "Zhipu AI (GLM)" },
    ]
  },
  {
    category: "MULTI-MODAL AI APIs",
    providers: [
      { id: "STABILITY_AI", name: "Stability AI" },
      { id: "RUNWAY_ML", name: "Runway ML" },
      { id: "PIKA", name: "Pika Labs" },
      { id: "LUMA", name: "Luma AI" },
    ]
  },
  {
    category: "IMAGE GENERATION APIs",
    providers: [
      { id: "MIDJOURNEY", name: "Midjourney" },
      { id: "LEONARDO", name: "Leonardo AI" },
      { id: "PLAYGROUND", name: "Playground AI" },
      { id: "DEEPAI", name: "DeepAI" },
      { id: "CLIPDROP", name: "Clipdrop" },
      { id: "DREAMSTUDIO", name: "DreamStudio" },
    ]
  },
  {
    category: "VIDEO AI APIs",
    providers: [
      { id: "SYNTHESIA", name: "Synthesia" },
      { id: "HEYGEN", name: "HeyGen" },
      { id: "COLOSSYAN", name: "Colossyan" },
    ]
  },
  {
    category: "SPEECH-TO-TEXT APIs",
    providers: [
      { id: "ASSEMBLY_AI", name: "AssemblyAI" },
      { id: "DEEPGRAM", name: "Deepgram" },
      { id: "REV_AI", name: "Rev AI" },
      { id: "SPEECHMATICS", name: "Speechmatics" },
    ]
  },
  {
    category: "TEXT-TO-SPEECH APIs",
    providers: [
      { id: "ELEVENLABS", name: "ElevenLabs" },
      { id: "PLAYHT", name: "PlayHT" },
      { id: "AMAZON_POLLY", name: "Amazon Polly" },
      { id: "RESEMBLE", name: "Resemble AI" },
      { id: "MURF", name: "Murf AI" },
    ]
  },
  {
    category: "EMBEDDINGS & VECTOR DATABASE APIs",
    providers: [
      { id: "JINA", name: "Jina AI" },
      { id: "VOYAGE", name: "Voyage AI" },
      { id: "PINECONE", name: "Pinecone" },
      { id: "WEAVIATE", name: "Weaviate" },
      { id: "QDRANT", name: "Qdrant" },
      { id: "MILVUS", name: "Milvus (Zilliz)" },
      { id: "CHROMA", name: "Chroma" },
      { id: "SUPABASE_VECTOR", name: "Supabase Vector" },
      { id: "REDIS_VECTOR", name: "Redis Vector" },
      { id: "ELASTIC_VECTOR", name: "Elastic Vector" },
    ]
  },
  {
    category: "AGENT & ORCHESTRATION APIs",
    providers: [
      { id: "LANGCHAIN", name: "LangChain" },
      { id: "LLAMAINDEX", name: "LlamaIndex" },
      { id: "AUTOGEN", name: "AutoGen" },
      { id: "CREWAI", name: "CrewAI" },
      { id: "FLOWISE", name: "Flowise" },
      { id: "DUST", name: "Dust AI" },
    ]
  },
  {
    category: "OPEN-SOURCE HOSTING / CLOUD PLATFORMS",
    providers: [
      { id: "HUGGINGFACE", name: "Hugging Face Inference" },
      { id: "REPLICATE", name: "Replicate" },
      { id: "TOGETHER", name: "Together AI" },
      { id: "FIREWORKS", name: "Fireworks AI" },
      { id: "OCTOAI", name: "OctoAI" },
      { id: "ANYSCALE", name: "Anyscale" },
      { id: "MODAL", name: "Modal" },
      { id: "BASETEN", name: "Baseten" },
      { id: "AWS_BEDROCK", name: "AWS Bedrock" },
      { id: "IBM_WATSONX", name: "IBM Watsonx" },
      { id: "ORACLE_AI", name: "Oracle Cloud AI" },
    ]
  },
  {
    category: "REGIONAL & SPECIALIZED APIs",
    providers: [
      { id: "SARVAM", name: "Sarvam AI" },
      { id: "KRUTRIM", name: "Krutrim AI" },
      { id: "COROVER", name: "CoRover AI" },
      { id: "YELLOW_AI", name: "Yellow.ai" },
      { id: "YOU_COM", name: "You.com API" },
      { id: "SERPAPI", name: "SerpAPI" },
      { id: "SCALE", name: "Scale AI" },
      { id: "UNSTRUCTURED", name: "Unstructured.io" },
      { id: "ROSSUM", name: "Rossum" },
      { id: "NANONETS", name: "Nanonets" },
      { id: "CLARIFAI", name: "Clarifai" },
      { id: "OAK", name: "OpenCV AI Kit APIs" },
      { id: "ROBOFLOW", name: "Roboflow" },
      { id: "V7_LABS", name: "V7 Labs" },
      { id: "H2O", name: "H2O.ai" },
      { id: "DATAROBOT", name: "DataRobot" },
    ]
  }
];

// Flat list map for quick display name lookup
export const PROVIDER_DISPLAY_NAMES = PROVIDER_CATEGORIES.reduce((acc, cat) => {
  cat.providers.forEach(p => {
    acc[p.id] = p.name;
  });
  return acc;
}, {} as Record<string, string>);

// API key format validation per provider
const API_KEY_VALIDATORS: Record<string, { regex: RegExp; hint: string }> = {
    OPENROUTER: {
        regex: /^sk-or-/,
        hint: 'OpenRouter keys start with "sk-or-"',
    },
    OPENAI: {
        regex: /^sk-/,
        hint: 'OpenAI keys start with "sk-"',
    },
    CLAUDE: {
        regex: /^sk-ant-/,
        hint: 'Claude/Anthropic keys start with "sk-ant-"',
    },
    GEMINI: {
        regex: /^AIzaSy[A-Za-z0-9_-]{33}$/,
        hint: 'Gemini keys start with "AIzaSy" and are 39 characters long',
    },
    GEMINI_25_PRO: {
        regex: /^AIzaSy[A-Za-z0-9_-]{33}$/,
        hint: 'Gemini keys start with "AIzaSy" and are 39 characters long',
    },
    GEMINI_25_FLASH: {
        regex: /^AIzaSy[A-Za-z0-9_-]{33}$/,
        hint: 'Gemini keys start with "AIzaSy" and are 39 characters long',
    },
    GEMINI_20_FLASH: {
        regex: /^AIzaSy[A-Za-z0-9_-]{33}$/,
        hint: 'Gemini keys start with "AIzaSy" and are 39 characters long',
    },
    GEMINI_20_FLASH_LITE: {
        regex: /^AIzaSy[A-Za-z0-9_-]{33}$/,
        hint: 'Gemini keys start with "AIzaSy" and are 39 characters long',
    },
    GEMINI_15_PRO: {
        regex: /^AIzaSy[A-Za-z0-9_-]{33}$/,
        hint: 'Gemini keys start with "AIzaSy" and are 39 characters long',
    },
    GEMINI_15_FLASH: {
        regex: /^AIzaSy[A-Za-z0-9_-]{33}$/,
        hint: 'Gemini keys start with "AIzaSy" and are 39 characters long',
    },
};

export function validateApiKeyFormat(provider: LlmProvider, apiKey: string): string | null {
    if (!apiKey || apiKey.trim().length === 0) {
        return 'API key is required';
    }

    const validator = API_KEY_VALIDATORS[provider];
    if (validator && !validator.regex.test(apiKey.trim())) {
        return validator.hint;
    }

    // Generic generic fallback for providers without specific regex
    return null; // no error
}

export function getProviderDisplayName(provider: LlmProvider): string {
    return PROVIDER_DISPLAY_NAMES[provider] || provider;
}

export function useApiKeys(): UseApiKeysReturn {
    const [savedProviders, setSavedProviders] = useState<SavedProvider[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const refreshProviders = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await apiClient.get<SavedProvider[]>('/api/user/api-keys');
            setSavedProviders(data);
        } catch (err: any) {
            console.error('[useApiKeys] Failed to fetch saved providers:', err);
            setError(err.message || 'Failed to load API keys');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshProviders();
    }, [refreshProviders]);

    const saveApiKey = useCallback(async (provider: LlmProvider, apiKey: string): Promise<boolean> => {
        try {
            setSaving(true);
            setError(null);
            await apiClient.post('/api/user/api-keys', { provider, apiKey });
            await refreshProviders();
            return true;
        } catch (err: any) {
            console.error('[useApiKeys] Failed to save API key:', err);
            setError(err.message || 'Failed to save API key');
            return false;
        } finally {
            setSaving(false);
        }
    }, [refreshProviders]);

    const deleteApiKey = useCallback(async (provider: LlmProvider): Promise<boolean> => {
        try {
            setError(null);
            await apiClient.delete(`/api/user/api-keys/${provider}`);
            await refreshProviders();
            return true;
        } catch (err: any) {
            console.error('[useApiKeys] Failed to delete API key:', err);
            setError(err.message || 'Failed to delete API key');
            return false;
        }
    }, [refreshProviders]);

    return {
        savedProviders,
        loading,
        saving,
        error,
        saveApiKey,
        deleteApiKey,
        refreshProviders,
    };
}
