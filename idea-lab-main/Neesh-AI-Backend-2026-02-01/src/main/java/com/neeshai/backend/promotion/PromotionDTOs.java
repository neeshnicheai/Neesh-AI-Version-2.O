package com.neeshai.backend.promotion;

import java.time.ZonedDateTime;
import java.util.List;
import java.util.UUID;

public class PromotionDTOs {

    // --- Requests ---
    public record SubmitPromotionRequest(UUID projectId, List<String> tags) {}

    // --- Responses ---
    public record PromotionDTO(
            UUID id,
            UUID blogId,
            UUID projectId,
            String blogTitle,
            String coverImageUrl,
            List<String> tags,
            String status,
            ZonedDateTime createdAt
    ) {}

    public record SimilarBlogDTO(
            UUID projectId,
            String title,
            String oneLineSummary,
            String coverImageUrl,
            String slug,
            String authorName,
            List<String> matchingTags
    ) {}

    public record PromotionStatsDTO(
            long totalPromotions,
            List<String> allTags
    ) {}

    public record BlogBrandingDTO(
            String subscriptionPlan,
            String customLogoUrl,
            String customBrandingText,
            boolean showNeeshBranding
    ) {}
}
