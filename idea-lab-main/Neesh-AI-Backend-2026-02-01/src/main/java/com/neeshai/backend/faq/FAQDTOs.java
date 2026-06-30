package com.neeshai.backend.faq;

import java.util.List;
import java.util.UUID;

public class FAQDTOs {

    public record FAQResponse(
            UUID id,
            UUID projectId,
            String question,
            String answer,
            Integer displayOrder) {
        public static FAQResponse fromEntity(FAQ faq) {
            return new FAQResponse(
                    faq.getId(),
                    faq.getProject().getId(),
                    faq.getQuestion(),
                    faq.getAnswer(),
                    faq.getDisplayOrder());
        }
    }

    public record CreateFAQRequest(
            String question,
            String answer,
            Integer displayOrder) {
    }

    public record UpdateFAQRequest(
            String question,
            String answer,
            Integer displayOrder) {
    }

    public record FAQListResponse(
            List<FAQResponse> faqs,
            int count) {
    }
}
