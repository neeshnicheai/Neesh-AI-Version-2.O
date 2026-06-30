package com.neeshai.backend.audience;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public class AudienceDTOs {

        // ===== Member DTOs =====

        public record AudienceMemberSummary(
                        UUID id,
                        String name,
                        String email,
                        String occupation,
                        String personaType,
                        Double confidenceScore,
                        Double engagementScore,
                        String feedbackSummary,
                        Instant firstInteractionAt,
                        Instant lastInteractionAt,
                        int questionCount) {
                public static AudienceMemberSummary fromEntity(AudienceMember m) {
                        String summary = m.getFeedbackText();
                        if (summary != null && summary.length() > 100) {
                                summary = summary.substring(0, 100) + "...";
                        }
                        int qCount = m.getQuestions() != null ? m.getQuestions().size() : 0;
                        return new AudienceMemberSummary(
                                        m.getId(), m.getName(), m.getEmail(), m.getOccupation(),
                                        m.getPersonaType(), m.getConfidenceScore(), m.getEngagementScore(),
                                        summary, m.getFirstInteractionAt(), m.getLastInteractionAt(), qCount);
                }
        }

        public record AudienceMemberDetail(
                        UUID id,
                        String name,
                        String email,
                        String occupation,
                        String personaType,
                        Double confidenceScore,
                        Double engagementScore,
                        String feedbackText,
                        String feedbackSource,
                        Instant feedbackSubmittedAt,
                        Instant firstInteractionAt,
                        Instant lastInteractionAt,
                        List<AudienceQuestionDTO> questions) {
                public static AudienceMemberDetail fromEntity(AudienceMember m, List<AudienceQuestion> questions) {
                        List<AudienceQuestionDTO> qDtos = questions.stream()
                                        .map(AudienceQuestionDTO::fromEntity)
                                        .toList();
                        return new AudienceMemberDetail(
                                        m.getId(), m.getName(), m.getEmail(), m.getOccupation(),
                                        m.getPersonaType(), m.getConfidenceScore(), m.getEngagementScore(),
                                        m.getFeedbackText(), m.getFeedbackSource(), m.getFeedbackSubmittedAt(),
                                        m.getFirstInteractionAt(), m.getLastInteractionAt(), qDtos);
                }
        }

        public record AudienceMemberListResponse(
                        List<AudienceMemberSummary> members,
                        int count) {
        }

        // ===== Question DTOs =====

        public record AudienceQuestionDTO(
                        UUID id,
                        String questionText,
                        String chatbotAnswer,
                        String customAdminAnswer,
                        String status,
                        Instant askedAt,
                        Instant answeredAt,
                        Instant respondedAt) {
                public static AudienceQuestionDTO fromEntity(AudienceQuestion q) {
                        return new AudienceQuestionDTO(
                                        q.getId(), q.getQuestionText(), q.getChatbotAnswer(),
                                        q.getCustomAdminAnswer(), q.getStatus(),
                                        q.getAskedAt(), q.getAnsweredAt(), q.getRespondedAt());
                }
        }

        public record AnswerQuestionRequest(
                        String answer) {
        }

        public record AnswerQuestionResponse(
                        UUID questionId,
                        String status,
                        Instant respondedAt) {
        }

        // ===== Public Feedback DTOs =====

        public record PublicFeedbackRequest(
                        String name,
                        String email,
                        String occupation,
                        String feedbackText) {
        }

        public record PublicFeedbackResponse(
                        UUID memberId,
                        String message) {
        }

        // ===== Chat Interaction DTOs =====

        public record ChatInteractionRequest(
                        String query,
                        String answer,
                        String userName,
                        String userEmail) {
        }
}
