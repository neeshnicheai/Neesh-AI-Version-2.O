import { useState, useCallback, useEffect } from 'react';
import apiClient from '@/lib/api';
import { supabase } from "@/integrations/supabase/client";

// ===== Types =====

export interface ClusterSummary {
    id: string;
    canonicalQuestion: string;
    totalAskCount: number;
    status: string;
    personaSummary: string | null;
    priorityScore: number;
    firstAskedAt: string;
    lastAskedAt: string;
}

export interface ClusterInstance {
    id: string;
    originalQuestion: string;
    source: string;
    userName: string | null;
    userEmail: string | null;
    userPersona: string | null;
    status: string;
    askedAt: string;
    answeredAt: string | null;
    answerContent: string | null;
}

export interface ReplyHistory {
    id: string;
    answerContent: string;
    emailSubject: string | null;
    recipientCount: number;
    sentAt: string;
}

export interface ClusterDetail {
    id: string;
    canonicalQuestion: string;
    totalAskCount: number;
    status: string;
    personaSummary: string | null;
    priorityScore: number;
    firstAskedAt: string;
    lastAskedAt: string;
    instances: ClusterInstance[];
    replyHistory: ReplyHistory[];
}

interface ClusterListResponse {
    clusters: ClusterSummary[];
    count: number;
    unansweredCount: number;
}

interface SendReplyRequest {
    instanceIds: string[];
    answerText: string;
    emailSubject: string;
    sendToAll: boolean;
}

interface SendReplyResponse {
    clusterId: string;
    answeredCount: number;
    totalCount: number;
    clusterStatus: string;
}

interface BadgeCountResponse {
    count: number;
}

// ===== Hook =====

export function useNotifications(projectId: string | undefined) {
    const [clusters, setClusters] = useState<ClusterSummary[]>([]);
    const [clusterDetail, setClusterDetail] = useState<ClusterDetail | null>(null);
    const [loading, setLoading] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);
    const [sendingReply, setSendingReply] = useState(false);
    const [badgeCount, setBadgeCount] = useState(0);
    const [unansweredCount, setUnansweredCount] = useState(0);

    const fetchClusters = useCallback(async (status?: string, sort?: string, search?: string) => {
        if (!projectId) return;
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (status && status !== 'all') params.append('status', status);
            if (sort) params.append('sort', sort);
            if (search) params.append('search', search);
            const queryStr = params.toString() ? `?${params.toString()}` : '';

            const data = await apiClient.get<ClusterListResponse>(
                `/api/projects/${projectId}/notifications${queryStr}`
            );
            setClusters(data.clusters || []);
            setUnansweredCount(data.unansweredCount || 0);
        } catch (err) {
            console.error('[Notifications] Failed to fetch clusters:', err);
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    const fetchClusterDetail = useCallback(async (clusterId: string) => {
        setDetailLoading(true);
        try {
            const data = await apiClient.get<ClusterDetail>(
                `/api/notifications/clusters/${clusterId}`
            );
            setClusterDetail(data);
        } catch (err) {
            console.error('[Notifications] Failed to fetch cluster detail:', err);
        } finally {
            setDetailLoading(false);
        }
    }, []);

    const sendReply = useCallback(async (
        clusterId: string,
        instanceIds: string[],
        answerText: string,
        emailSubject: string,
        sendToAll: boolean
    ): Promise<SendReplyResponse | null> => {
        setSendingReply(true);
        try {
            const request: SendReplyRequest = {
                instanceIds,
                answerText,
                emailSubject,
                sendToAll,
            };
            const data = await apiClient.post<SendReplyResponse>(
                `/api/notifications/clusters/${clusterId}/reply`,
                request
            );
            // Refresh detail after reply
            await fetchClusterDetail(clusterId);
            return data;
        } catch (err) {
            console.error('[Notifications] Failed to send reply:', err);
            return null;
        } finally {
            setSendingReply(false);
        }
    }, [fetchClusterDetail]);

    const fetchBadgeCount = useCallback(async () => {
        if (!projectId) return;
        try {
            const data = await apiClient.get<BadgeCountResponse>(
                `/api/projects/${projectId}/notifications/count`
            );
            setBadgeCount(data.count || 0);
        } catch (err) {
            console.error('[Notifications] Failed to fetch badge count:', err);
        }
    }, [projectId]);

    useEffect(() => {
        if (!projectId) return;

        fetchClusters();
        fetchBadgeCount();

        // Subscribe to real-time changes
        const channel = supabase
            .channel(`public:question_clusters:project_id=eq.${projectId}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "question_clusters",
                    filter: `project_id=eq.${projectId}`,
                },
                () => {
                    console.log("[Notifications] Clusters changed, refetching...");
                    fetchClusters();
                    fetchBadgeCount();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [projectId, fetchClusters, fetchBadgeCount]);

    return {
        clusters,
        clusterDetail,
        loading,
        detailLoading,
        sendingReply,
        badgeCount,
        unansweredCount,
        fetchClusters,
        fetchClusterDetail,
        sendReply,
        fetchBadgeCount,
        setClusterDetail,
    };
}
