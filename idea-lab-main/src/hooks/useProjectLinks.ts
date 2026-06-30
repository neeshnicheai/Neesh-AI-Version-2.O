import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import apiClient from "@/lib/api";

export interface LinkedProject {
    linkId: string;
    projectId: string;
    projectTitle: string;
    projectSummary: string | null;
    linkType: string;
    createdAt: string;
}

interface BackendLinkedProject {
    linkId: string;
    projectId: string;
    projectTitle: string;
    projectSummary: string | null;
    linkType: string;
    createdAt: string;
}

export const useProjectLinks = (projectId: string | undefined) => {
    const [linkedProjects, setLinkedProjects] = useState<LinkedProject[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchLinks = useCallback(async () => {
        if (!projectId) return;
        try {
            setLoading(true);
            const data = await apiClient.get<BackendLinkedProject[]>(
                `/api/projects/${projectId}/links`
            );
            setLinkedProjects(data);
        } catch (err) {
            console.error("[useProjectLinks] Error fetching links:", err);
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        fetchLinks();
    }, [fetchLinks]);

    const linkProject = async (
        linkedProjectId: string,
        linkType: string
    ): Promise<boolean> => {
        if (!projectId) return false;
        try {
            const result = await apiClient.post<BackendLinkedProject>(
                `/api/projects/${projectId}/links`,
                { linkedProjectId, linkType }
            );
            setLinkedProjects((prev) => [...prev, result]);
            toast.success("Project linked successfully!");
            return true;
        } catch (err: any) {
            const message =
                err instanceof Error ? err.message : "Failed to link project";
            toast.error(message);
            console.error("[useProjectLinks] Error linking project:", err);
            return false;
        }
    };

    const unlinkProject = async (linkId: string): Promise<boolean> => {
        if (!projectId) return false;
        try {
            await apiClient.delete(`/api/projects/${projectId}/links/${linkId}`);
            setLinkedProjects((prev) => prev.filter((l) => l.linkId !== linkId));
            toast.success("Project unlinked successfully!");
            return true;
        } catch (err) {
            const message =
                err instanceof Error ? err.message : "Failed to unlink project";
            toast.error(message);
            console.error("[useProjectLinks] Error unlinking project:", err);
            return false;
        }
    };

    return {
        linkedProjects,
        loading,
        linkProject,
        unlinkProject,
        refetch: fetchLinks,
    };
};
