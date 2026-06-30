import { useState, useCallback } from "react";
import { toast } from "sonner";
import apiClient from "@/lib/api";

// ===== Types =====

export interface AudienceMemberSummary {
    id: string;
    name: string;
    email: string;
    occupation: string | null;
    personaType: string | null;
    confidenceScore: number | null;
    engagementScore: number | null;
    feedbackSummary: string | null;
    firstInteractionAt: string | null;
    lastInteractionAt: string | null;
}

export interface AudienceQuestionDTO {
    id: string;
    questionText: string;
    chatbotAnswer: string | null;
    customAdminAnswer: string | null;
    status: "answered" | "unanswered";
    askedAt: string | null;
    answeredAt: string | null;
    respondedAt: string | null;
}

export interface AudienceMemberDetail {
    id: string;
    name: string;
    email: string;
    occupation: string | null;
    personaType: string | null;
    confidenceScore: number | null;
    engagementScore: number | null;
    feedbackText: string | null;
    feedbackSource: string | null;
    feedbackSubmittedAt: string | null;
    firstInteractionAt: string | null;
    lastInteractionAt: string | null;
    questions: AudienceQuestionDTO[];
}

interface AudienceMemberListResponse {
    members: AudienceMemberSummary[];
    count: number;
}

interface AnswerQuestionResponse {
    questionId: string;
    status: string;
    respondedAt: string;
}

// ===== Hook =====

export const useResponsePage = (projectId: string | undefined) => {
    const [members, setMembers] = useState<AudienceMemberSummary[]>([]);
    const [selectedMember, setSelectedMember] = useState<AudienceMemberDetail | null>(null);
    const [loading, setLoading] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);
    const [answeringId, setAnsweringId] = useState<string | null>(null);

    /**
     * Fetch all audience members for the project.
     */
    const fetchMembers = useCallback(async () => {
        if (!projectId) return;
        setLoading(true);
        try {
            const data = await apiClient.get<AudienceMemberListResponse>(
                `/api/projects/${projectId}/audience`
            );
            setMembers(data.members);
        } catch (err) {
            console.error("[ResponsePage] Error fetching audience members:", err);
            // Don't show error toast — may not have audience data yet
            setMembers([]);
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    /**
     * Fetch detailed profile for a specific audience member.
     */
    const fetchMemberDetail = useCallback(async (memberId: string) => {
        setDetailLoading(true);
        try {
            const data = await apiClient.get<AudienceMemberDetail>(
                `/api/audience/${memberId}`
            );
            setSelectedMember(data);
        } catch (err) {
            console.error("[ResponsePage] Error fetching member detail:", err);
            toast.error("Failed to load audience profile");
        } finally {
            setDetailLoading(false);
        }
    }, []);

    /**
     * Answer a question (Reply & Notify flow).
     */
    const answerQuestion = useCallback(async (questionId: string, answer: string) => {
        setAnsweringId(questionId);
        try {
            const data = await apiClient.put<AnswerQuestionResponse>(
                `/api/audience/questions/${questionId}/answer`,
                { answer }
            );

            // Update the selected member's questions in state
            if (selectedMember) {
                setSelectedMember({
                    ...selectedMember,
                    questions: selectedMember.questions.map((q) =>
                        q.id === questionId
                            ? { ...q, customAdminAnswer: answer, status: "answered" as const, respondedAt: data.respondedAt }
                            : q
                    ),
                });
            }

            toast.success("Reply sent & user notified!");
            return true;
        } catch (err) {
            console.error("[ResponsePage] Error answering question:", err);
            toast.error("Failed to send reply");
            return false;
        } finally {
            setAnsweringId(null);
        }
    }, [selectedMember]);

    /**
     * Close the detail modal.
     */
    const closeDetail = useCallback(() => {
        setSelectedMember(null);
    }, []);

    return {
        members,
        selectedMember,
        loading,
        detailLoading,
        answeringId,
        fetchMembers,
        fetchMemberDetail,
        answerQuestion,
        closeDetail,
    };
};
