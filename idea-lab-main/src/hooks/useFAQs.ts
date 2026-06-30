import { useState, useEffect, useCallback } from "react";
import apiClient from "@/lib/api";
import { toast } from "sonner";

export interface FAQ {
    id: string;
    projectId: string;
    question: string;
    answer: string;
    displayOrder: number;
}

interface FAQListResponse {
    faqs: FAQ[];
    count: number;
}

interface CreateFAQInput {
    question: string;
    answer: string;
    displayOrder?: number;
}

interface UpdateFAQInput {
    question?: string;
    answer?: string;
    displayOrder?: number;
}

export const useFAQs = (projectId: string | undefined) => {
    const [faqs, setFaqs] = useState<FAQ[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchFAQs = useCallback(async () => {
        if (!projectId) {
            console.log('[useFAQs] No project ID provided, skipping fetch');
            setFaqs([]);
            setLoading(false);
            return;
        }

        try {
            console.group(`[useFAQs] Fetching FAQs for project ${projectId}`);
            console.log('  Timestamp:', new Date().toISOString());
            setLoading(true);
            setError(null);

            const response = await apiClient.get<FAQListResponse>(`/api/projects/${projectId}/faqs`);

            console.log(`  ✅ Received ${response.faqs?.length || 0} FAQs`);
            console.log('  FAQ data:', response.faqs);
            console.groupEnd();

            setFaqs(response.faqs || []);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to fetch FAQs";
            console.group(`[useFAQs] ❌ Error fetching FAQs for project ${projectId}`);
            console.error('  Error message:', message);
            console.error('  Error object:', err);
            console.groupEnd();

            setError(message);
            // Return empty array on error (might be no FAQs yet)
            setFaqs([]);
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        fetchFAQs();
    }, [fetchFAQs]);

    const createFAQ = async (input: CreateFAQInput): Promise<FAQ | null> => {
        if (!projectId) {
            console.error('[useFAQs] Cannot create FAQ: No project ID');
            toast.error("Project ID is required");
            return null;
        }

        try {
            console.log(`[useFAQs] Creating FAQ for project ${projectId}:`, input.question);
            const response = await apiClient.post<FAQ>(`/api/projects/${projectId}/faqs`, input);
            console.log(`[useFAQs] ✅ FAQ created successfully with ID:`, response.id);
            setFaqs(prev => [...prev, response]);
            toast.success("FAQ created successfully!");
            return response;
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to create FAQ";
            console.error('[useFAQs] ❌ Error creating FAQ:', err);
            toast.error(message);
            return null;
        }
    };

    const updateFAQ = async (faqId: string, input: UpdateFAQInput): Promise<FAQ | null> => {
        try {
            console.log(`[useFAQs] Updating FAQ ${faqId}`);
            const response = await apiClient.put<FAQ>(`/api/faqs/${faqId}`, input);
            console.log(`[useFAQs] ✅ FAQ ${faqId} updated successfully`);
            setFaqs(prev => prev.map(f => f.id === faqId ? response : f));
            toast.success("FAQ updated successfully!");
            return response;
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to update FAQ";
            console.error(`[useFAQs] ❌ Error updating FAQ ${faqId}:`, err);
            toast.error(message);
            return null;
        }
    };

    const deleteFAQ = async (faqId: string): Promise<boolean> => {
        try {
            console.log(`[useFAQs] Deleting FAQ ${faqId}`);
            await apiClient.delete(`/api/faqs/${faqId}`);
            console.log(`[useFAQs] ✅ FAQ ${faqId} deleted successfully`);
            setFaqs(prev => prev.filter(f => f.id !== faqId));
            toast.success("FAQ deleted successfully!");
            return true;
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to delete FAQ";
            console.error(`[useFAQs] ❌ Error deleting FAQ ${faqId}:`, err);
            toast.error(message);
            return false;
        }
    };

    return {
        faqs,
        loading,
        error,
        fetchFAQs,
        createFAQ,
        updateFAQ,
        deleteFAQ,
    };
};

// Hook for public FAQ access (no auth required)
export const usePublicFAQs = (projectId: string | undefined) => {
    const [faqs, setFaqs] = useState<FAQ[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPublicFAQs = async () => {
            if (!projectId) {
                setFaqs([]);
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:8081";
                const response = await fetch(`${backendUrl}/api/public/projects/${projectId}/faqs`);

                if (response.ok) {
                    const data: FAQListResponse = await response.json();
                    setFaqs(data.faqs || []);
                } else {
                    setFaqs([]);
                }
            } catch (err) {
                console.error("Error fetching public FAQs:", err);
                setFaqs([]);
            } finally {
                setLoading(false);
            }
        };

        fetchPublicFAQs();
    }, [projectId]);

    return { faqs, loading };
};
