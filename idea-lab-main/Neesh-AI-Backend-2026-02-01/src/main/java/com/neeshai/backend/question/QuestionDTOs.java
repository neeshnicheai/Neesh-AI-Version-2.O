package com.neeshai.backend.question;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public class QuestionDTOs {

        public record QuestionResponse(
                        UUID id,
                        UUID projectId,
                        String question,
                        Instant createdAt,
                        boolean isResolved) {
                public static QuestionResponse fromEntity(UnansweredQuestion q) {
                        return new QuestionResponse(
                                        q.getId(),
                                        q.getProject().getId(),
                                        q.getQuestion(),
                                        q.getCreatedAt(),
                                        q.isResolved());
                }
        }

        public record CreateQuestionRequest(
                        String question,
                        String userName,
                        String userEmail,
                        String persona,
                        String source) {
        }

        public record QuestionListResponse(
                        List<QuestionResponse> questions,
                        int count) {
        }
}
