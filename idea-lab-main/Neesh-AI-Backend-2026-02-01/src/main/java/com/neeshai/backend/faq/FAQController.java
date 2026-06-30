package com.neeshai.backend.faq;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api")
public class FAQController {

    private static final Logger logger = LoggerFactory.getLogger(FAQController.class);
    private final FAQService faqService;

    public FAQController(FAQService faqService) {
        this.faqService = faqService;
    }

    private UUID getUserIdFromJwt(Jwt jwt) {
        return UUID.fromString(jwt.getSubject());
    }

    // Get all FAQs for a project (authenticated)
    @GetMapping("/projects/{projectId}/faqs")
    public ResponseEntity<FAQDTOs.FAQListResponse> getFAQs(@PathVariable UUID projectId) {
        logger.info("[FAQController] GET /api/projects/{}/faqs - Fetching FAQs for project", projectId);
        try {
            FAQDTOs.FAQListResponse response = faqService.getFAQsForProject(projectId);
            logger.info("[FAQController] Successfully retrieved {} FAQs for project {}", response.count(), projectId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("[FAQController] Error fetching FAQs for project {}: {}", projectId, e.getMessage(), e);
            throw e;
        }
    }

    // Create new FAQ
    @PostMapping("/projects/{projectId}/faqs")
    public ResponseEntity<FAQDTOs.FAQResponse> createFAQ(
            @PathVariable UUID projectId,
            @RequestBody FAQDTOs.CreateFAQRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        UUID userId = getUserIdFromJwt(jwt);
        logger.info("[FAQController] POST /api/projects/{}/faqs - Creating FAQ. User: {}, Question: {}",
                projectId, userId, request.question());
        try {
            FAQDTOs.FAQResponse response = faqService.createFAQ(projectId, userId, request);
            logger.info("[FAQController] Successfully created FAQ with ID: {} for project {}", response.id(),
                    projectId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("[FAQController] Error creating FAQ for project {}: {}", projectId, e.getMessage(), e);
            throw e;
        }
    }

    // Update FAQ
    @PutMapping("/faqs/{faqId}")
    public ResponseEntity<FAQDTOs.FAQResponse> updateFAQ(
            @PathVariable UUID faqId,
            @RequestBody FAQDTOs.UpdateFAQRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        UUID userId = getUserIdFromJwt(jwt);
        logger.info("[FAQController] PUT /api/faqs/{} - Updating FAQ. User: {}", faqId, userId);
        try {
            FAQDTOs.FAQResponse response = faqService.updateFAQ(faqId, userId, request);
            logger.info("[FAQController] Successfully updated FAQ {}", faqId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("[FAQController] Error updating FAQ {}: {}", faqId, e.getMessage(), e);
            throw e;
        }
    }

    // Delete FAQ
    @DeleteMapping("/faqs/{faqId}")
    public ResponseEntity<Void> deleteFAQ(
            @PathVariable UUID faqId,
            @AuthenticationPrincipal Jwt jwt) {
        UUID userId = getUserIdFromJwt(jwt);
        logger.info("[FAQController] DELETE /api/faqs/{} - Deleting FAQ. User: {}", faqId, userId);
        try {
            faqService.deleteFAQ(faqId, userId);
            logger.info("[FAQController] Successfully deleted FAQ {}", faqId);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            logger.error("[FAQController] Error deleting FAQ {}: {}", faqId, e.getMessage(), e);
            throw e;
        }
    }

    // Public endpoint to get FAQs (no auth required)
    @GetMapping("/public/projects/{projectId}/faqs")
    public ResponseEntity<FAQDTOs.FAQListResponse> getPublicFAQs(@PathVariable UUID projectId) {
        logger.info("[FAQController] GET /api/public/projects/{}/faqs - Fetching public FAQs", projectId);
        try {
            FAQDTOs.FAQListResponse response = faqService.getFAQsForProject(projectId);
            logger.info("[FAQController] Successfully retrieved {} public FAQs for project {}", response.count(),
                    projectId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("[FAQController] Error fetching public FAQs for project {}: {}", projectId, e.getMessage(), e);
            throw e;
        }
    }
}
