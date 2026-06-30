
import { useState, useCallback } from "react";
import { toast } from "sonner";
import apiClient from "@/lib/api";

export interface Question {
    id: string;
    projectId: string;
    question: string;
    createdAt: string;
    isResolved: boolean;
}

export interface AudienceQuestionDTO {
    id: string;
    questionText: string;
    chatbotAnswer: string | null;
    customAdminAnswer: string | null;
    status: "answered" | "unanswered";
    askedAt: string;
    answeredAt: string | null;
    respondedAt: string | null;
}

interface AudienceMemberDetail {
    id: string;
    name: string;
    email: string;
    questions: AudienceQuestionDTO[];
}

interface QuestionResponse {
    questions: Question[];
    count: number;
}

export const useQuestions = (projectId: string | undefined) => {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [answeredQuestions, setAnsweredQuestions] = useState<AudienceQuestionDTO[]>([]);
    const [unansweredMemberQuestions, setUnansweredMemberQuestions] = useState<AudienceQuestionDTO[]>([]);
    const [loading, setLoading] = useState(false);
    const [memberLoading, setMemberLoading] = useState(false);

    const fetchUnansweredQuestions = useCallback(async () => {
        if (!projectId) return;
        try {
            setLoading(true);
            const data = await apiClient.get<QuestionResponse>(`/api/projects/${projectId}/questions/unanswered`);
            setQuestions(data.questions);
        } catch (err) {
            console.error("Error fetching questions:", err);
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    /**
     * Fetch all questions for a specific audience member from the audience_questions table.
     * Splits them into answered and unanswered arrays.
     */
    const fetchMemberQuestions = useCallback(async (memberId: string) => {
        if (!memberId) return;
        try {
            setMemberLoading(true);
            const data = await apiClient.get<AudienceMemberDetail>(`/api/audience/${memberId}`);
            const allQuestions = data.questions || [];
            setAnsweredQuestions(allQuestions.filter(q => q.status === "answered"));
            setUnansweredMemberQuestions(allQuestions.filter(q => q.status === "unanswered"));
        } catch (err) {
            console.error("Error fetching member questions:", err);
        } finally {
            setMemberLoading(false);
        }
    }, []);

    const reportQuestion = async (questionText: string) => {
        if (!projectId) return;
        try {
            // Public endpoint, use skipAuth: true
            await apiClient.post(`/api/public/projects/${projectId}/questions/report`, { question: questionText }, { skipAuth: true });
        } catch (err) {
            console.error("Error reporting question:", err);
        }
    };

    const resolveQuestion = async (questionId: string) => {
        try {
            await apiClient.put(`/api/questions/${questionId}/resolve`);
            setQuestions(prev => prev.filter(q => q.id !== questionId));
            toast.success("Question resolved");
        } catch (err) {
            console.error("Error resolving question:", err);
            toast.error("Failed to resolve question");
        }
    };

    return {
        questions,
        answeredQuestions,
        unansweredMemberQuestions,
        loading,
        memberLoading,
        fetchUnansweredQuestions,
        fetchMemberQuestions,
        reportQuestion,
        resolveQuestion
    };
};
