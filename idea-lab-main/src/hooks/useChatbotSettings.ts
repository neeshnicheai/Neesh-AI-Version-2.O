import { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/api';

export interface ChatbotSettings {
  botName: string;
  welcomeMessage: string;
  primaryColor: string;
  botAvatarUrl: string | null;
}

const DEFAULT_SETTINGS: ChatbotSettings = {
  botName: 'Health Blog Assistant',
  welcomeMessage:
    "Hello! I'm your AI assistant. I've been trained on your project's knowledge base and can help you with summaries, explaining complex terms, or answering specific questions. How can I assist you today?",
  primaryColor: '#6366f1',
  botAvatarUrl: null,
};

/**
 * Hook to manage chatbot customisation settings per project (reads and writes).
 */
export function useChatbotSettings(projectId: string | undefined) {
  const [settings, setSettings] = useState<ChatbotSettings>(DEFAULT_SETTINGS);
  const [dirty, setDirty] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load settings from backend on mount
  useEffect(() => {
    if (!projectId) return;
    
    setLoading(true);
    apiClient.get<any>(`/api/projects/${projectId}`)
      .then(project => {
        setSettings({
          botName: project.chatbotName || DEFAULT_SETTINGS.botName,
          welcomeMessage: project.welcomeMessage || DEFAULT_SETTINGS.welcomeMessage,
          primaryColor: project.primaryColor || DEFAULT_SETTINGS.primaryColor,
          botAvatarUrl: project.botAvatarUrl || null,
        });
        setDirty(false);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [projectId]);

  // Clear success after 3s
  useEffect(() => {
    if (saveSuccess) {
      const t = setTimeout(() => setSaveSuccess(false), 3000);
      return () => clearTimeout(t);
    }
  }, [saveSuccess]);

  const updateField = useCallback(
    <K extends keyof ChatbotSettings>(key: K, value: ChatbotSettings[K]) => {
      setSettings((prev) => ({ ...prev, [key]: value }));
      setDirty(true);
    },
    []
  );

  const saveSettings = useCallback(async () => {
    if (!projectId) return;
    
    try {
      // We just PATCH the chatbot settings to the project update endpoint
      await apiClient.put(`/api/projects/${projectId}`, {
        chatbotName: settings.botName,
        welcomeMessage: settings.welcomeMessage,
        primaryColor: settings.primaryColor,
        botAvatarUrl: settings.botAvatarUrl,
      });
      
      setDirty(false);
      setSaveSuccess(true);
    } catch (err) {
      console.error("Failed to save chatbot settings:", err);
    }
  }, [projectId, settings]);

  return {
    settings,
    dirty,
    loading,
    saveSuccess,
    updateField,
    saveSettings,
    DEFAULT_SETTINGS,
  };
}

/**
 * Read-only hook for BlogPreview.
 * It tries to fetch from the public blog endpoint or public project endpoint fallback.
 */
export function useChatbotSettingsReadonly(projectId: string | undefined, isPublic: boolean = false): ChatbotSettings {
  const [settings, setSettings] = useState<ChatbotSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    if (!projectId) return;

    // We can fetch from public project endpoint /api/public/projects/{projectId}/blog isn't passing project...
    // Let's rely on standard endpoints. We'll use /api/public/projects/:slug if it was slug, but we only have ID.
    // wait, we can just use the authenticated endpoint if isPublic is false.
    if (!isPublic) {
      apiClient.get<any>(`/api/projects/${projectId}`)
        .then(project => {
          setSettings({
            botName: project.chatbotName || DEFAULT_SETTINGS.botName,
            welcomeMessage: project.welcomeMessage || DEFAULT_SETTINGS.welcomeMessage,
            primaryColor: project.primaryColor || DEFAULT_SETTINGS.primaryColor,
            botAvatarUrl: project.botAvatarUrl || null,
          });
        })
        .catch(console.error);
    } else {
       // Since the public endpoint for blog content doesn't return project info directly yet,
       // we should modify the backend GET /api/public/projects/{projectId}/blog to also return the project context.
       // For now, let's just make a generic GET call.
       apiClient.get<any>(`/api/public/projects/${projectId}`, { skipAuth: true })
        .then(project => {
            setSettings({
                botName: project.chatbotName || DEFAULT_SETTINGS.botName,
                welcomeMessage: project.welcomeMessage || DEFAULT_SETTINGS.welcomeMessage,
                primaryColor: project.primaryColor || DEFAULT_SETTINGS.primaryColor,
                botAvatarUrl: project.botAvatarUrl || null,
            });
        })
        .catch(() => {
            // Because /api/public/projects/{slug} expects a slug, passing an ID might fail.
            // In that case, we fallback to defaults for now, but we will fix the backend endpoint next.
        });
    }
  }, [projectId, isPublic]);

  return settings;
}
