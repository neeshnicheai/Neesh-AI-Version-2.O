package com.neeshai.backend.notification;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public class NotificationDTOs {

    // ===== Cluster List DTOs =====

    public record ClusterSummaryResponse(
            UUID id,
            String canonicalQuestion,
            int totalAskCount,
            String status,
            String personaSummary,
            double priorityScore,
            Instant firstAskedAt,
            Instant lastAskedAt) {
        public static ClusterSummaryResponse fromEntity(QuestionCluster c) {
            return new ClusterSummaryResponse(
                    c.getId(),
                    c.getCanonicalQuestion(),
                    c.getTotalAskCount(),
                    c.getStatus(),
                    c.getPersonaSummary(),
                    c.getPriorityScore(),
                    c.getFirstAskedAt(),
                    c.getLastAskedAt());
        }
    }

    public record ClusterListResponse(
            List<ClusterSummaryResponse> clusters,
            int count,
            long unansweredCount) {
    }

    // ===== Cluster Detail DTOs =====

    public record ClusterInstanceDTO(
            UUID id,
            String originalQuestion,
            String source,
            String userName,
            String userEmail,
            String userPersona,
            String status,
            Instant askedAt,
            Instant answeredAt,
            String answerContent) {
        public static ClusterInstanceDTO fromEntity(ClusterInstance ci) {
            return new ClusterInstanceDTO(
                    ci.getId(),
                    ci.getOriginalQuestion(),
                    ci.getSource(),
                    ci.getUserName(),
                    ci.getUserEmail(),
                    ci.getUserPersona(),
                    ci.getStatus(),
                    ci.getAskedAt(),
                    ci.getAnsweredAt(),
                    ci.getAnswerContent());
        }
    }

    public record ReplyHistoryDTO(
            UUID id,
            String answerContent,
            String emailSubject,
            int recipientCount,
            Instant sentAt) {
        public static ReplyHistoryDTO fromEntity(ClusterReply r) {
            return new ReplyHistoryDTO(
                    r.getId(),
                    r.getAnswerContent(),
                    r.getEmailSubject(),
                    r.getRecipientCount(),
                    r.getSentAt());
        }
    }

    public record ClusterDetailResponse(
            UUID id,
            String canonicalQuestion,
            int totalAskCount,
            String status,
            String personaSummary,
            double priorityScore,
            Instant firstAskedAt,
            Instant lastAskedAt,
            List<ClusterInstanceDTO> instances,
            List<ReplyHistoryDTO> replyHistory) {
    }

    // ===== Request/Response for Reply =====

    public record SendReplyRequest(
            List<UUID> instanceIds,
            String answerText,
            String emailSubject,
            boolean sendToAll) {
    }

    public record SendReplyResponse(
            UUID clusterId,
            int answeredCount,
            int totalCount,
            String clusterStatus) {
    }

    // ===== Badge Count =====

    public record BadgeCountResponse(long count) {
    }
}
