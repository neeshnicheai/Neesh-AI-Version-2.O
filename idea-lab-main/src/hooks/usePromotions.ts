import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "./useAuth";
import apiClient from "@/lib/api";

export interface Promotion {
  id: string;
  blogId: string;
  projectId: string;
  blogTitle: string;
  coverImageUrl: string | null;
  tags: string[];
  status: string;
  createdAt: string;
}

export interface SimilarBlog {
  projectId: string;
  title: string;
  oneLineSummary: string | null;
  coverImageUrl: string | null;
  slug: string;
  authorName: string;
  matchingTags: string[];
}

export const usePromotions = () => {
  const { user } = useAuth();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(false);

  // Guard against duplicate fetches
  const lastFetchedUserIdRef = useRef<string | null>(null);
  const isFetchingRef = useRef(false);

  const fetchPromotions = useCallback(async (force = false) => {
    if (!user) {
      setPromotions([]);
      lastFetchedUserIdRef.current = null;
      return;
    }

    if (!force && lastFetchedUserIdRef.current === user.id) {
      return;
    }

    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      setLoading(true);
      const data = await apiClient.get<Promotion[]>('/api/promotions');
      setPromotions(data);
      lastFetchedUserIdRef.current = user.id;
    } catch (err) {
      console.error("[usePromotions] Error fetching promotions:", err);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [user?.id]);

  useEffect(() => {
    fetchPromotions();
  }, [fetchPromotions]);

  const submitPromotion = async (projectId: string): Promise<Promotion | null> => {
    try {
      const result = await apiClient.post<Promotion>('/api/promotions', { projectId, tags: [] });
      await fetchPromotions();
      return result;
    } catch (err) {
      console.error("[usePromotions] Error submitting promotion:", err);
      throw err;
    }
  };

  const removePromotion = async (promotionId: string): Promise<boolean> => {
    try {
      console.log(`[usePromotions] Attempting to remove promotion with ID: ${promotionId}`);
      const response = await apiClient.delete(`/api/promotions/${promotionId}`);
      console.log("[usePromotions] API response received:", response);
      setPromotions(prev => {
        const next = prev.filter(p => p.id !== promotionId);
        console.log(`[usePromotions] Local state updated. Count: ${prev.length} -> ${next.length}`);
        return next;
      });
      return true;
    } catch (err) {
      console.error("[usePromotions] Error removing promotion:", err);
      return false;
    }
  };

  return {
    promotions,
    loading,
    submitPromotion,
    removePromotion,
    refetch: fetchPromotions,
  };
};

/**
 * Hook to fetch similar blogs for "More Like This" section (public, no auth needed).
 */
export const useSimilarBlogs = (projectId: string | undefined) => {
  const [similarBlogs, setSimilarBlogs] = useState<SimilarBlog[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!projectId) return;

    const fetchSimilar = async () => {
      try {
        setLoading(true);
        const data = await apiClient.get<SimilarBlog[]>(
          `/api/public/promotions/similar/${projectId}?limit=6`,
          { skipAuth: true }
        );
        setSimilarBlogs(data);
      } catch (err) {
        console.error("[useSimilarBlogs] Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSimilar();
  }, [projectId]);

  return { similarBlogs, loading };
};
