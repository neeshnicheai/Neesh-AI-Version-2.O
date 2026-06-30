package com.neeshai.backend.project;

import com.neeshai.backend.audience.AudienceDTOs;
import com.neeshai.backend.audience.AudienceService;
import com.neeshai.backend.blog.BlogDTOs;
import com.neeshai.backend.blog.BlogService;
import com.neeshai.backend.projectlink.ProjectLinkService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.beans.factory.annotation.Value;

import java.util.Map;
import java.util.HashMap;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/public/projects")
public class PublicProjectController {

    private static final Logger logger = LoggerFactory.getLogger(PublicProjectController.class);

    @Value("${ai.service.url:http://localhost:3000}")
    private String aiServiceUrl;

    private final ProjectService projectService;
    private final BlogService blogService;
    private final AudienceService audienceService;
    private final ProjectLinkService projectLinkService;
    private final RestTemplate restTemplate;

    public PublicProjectController(ProjectService projectService, BlogService blogService,
            AudienceService audienceService, ProjectLinkService projectLinkService) {
        this.projectService = projectService;
        this.blogService = blogService;
        this.audienceService = audienceService;
        this.projectLinkService = projectLinkService;
        this.restTemplate = new RestTemplate();
    }

    @GetMapping("/{slug}")
    public ResponseEntity<ProjectDTOs.PublicProjectDTO> getPublicProject(@PathVariable String slug) {
        return projectService.getPublicProject(slug)
                .map(ProjectDTOs.PublicProjectDTO::fromEntity)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{projectId}/blog")
    public ResponseEntity<BlogDTOs.BlogContentDTO> getPublicBlog(@PathVariable UUID projectId) {
        // Get blog content without owner verification for public access
        return blogService.getBlogContent(projectId, null)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/blog/{slug}")
    public ResponseEntity<BlogDTOs.BlogContentDTO> getPublicBlogBySlug(@PathVariable String slug) {
        // Parse slug to extract project ID
        UUID projectId = extractProjectIdFromSlug(slug);
        if (projectId == null) {
            return ResponseEntity.notFound().build();
        }

        // Get blog content without owner verification for public access
        return blogService.getBlogContent(projectId, null)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    private UUID extractProjectIdFromSlug(String slug) {
        try {
            // Expected format: "some-title-uuid"
            // UUID format: 8-4-4-4-12 hex characters
            String uuidPattern = "([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$";
            java.util.regex.Pattern pattern = java.util.regex.Pattern.compile(uuidPattern, java.util.regex.Pattern.CASE_INSENSITIVE);
            java.util.regex.Matcher matcher = pattern.matcher(slug);

            if (matcher.find()) {
                return UUID.fromString(matcher.group(1));
            }
            return null;
        } catch (Exception e) {
            logger.warn("Failed to extract UUID from slug: {}", slug, e);
            return null;
        }
    }

    @PostMapping("/{projectId}/feedback")
    public ResponseEntity<AudienceDTOs.PublicFeedbackResponse> submitFeedback(
            @PathVariable UUID projectId,
            @RequestBody AudienceDTOs.PublicFeedbackRequest request) {
        return ResponseEntity.ok(audienceService.submitPublicFeedback(projectId, request));
    }

    @PostMapping("/{projectId}/chat")
    public ResponseEntity<Map<String, Object>> publicChat(
            @PathVariable UUID projectId,
            @RequestBody Map<String, String> request) {

        String query = request.get("query");
        String userName = request.get("userName");
        String userEmail = request.get("userEmail");
        logger.info("[PublicChat] POST /api/public/projects/{}/chat - query length: {}",
                projectId, query != null ? query.length() : 0);

        if (query == null || query.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Query is required"));
        }

        try {
            List<UUID> linkedProjectIds = projectLinkService.getLinkedProjectIds(projectId);

            String url = aiServiceUrl + "/internal/chat";
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("X-Internal-Secret", "neesh-ai-secret-key-123");

            Map<String, Object> body = new HashMap<>();
            body.put("projectId", projectId.toString());
            body.put("query", query);
            if (userName != null && !userName.isBlank()) {
                body.put("userName", userName);
            }
            if (userEmail != null && !userEmail.isBlank()) {
                body.put("userEmail", userEmail);
            }
            if (!linkedProjectIds.isEmpty()) {
                body.put("linkedProjectIds", linkedProjectIds.stream()
                        .map(UUID::toString)
                        .collect(Collectors.toList()));
            }

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);

            logger.info("[PublicChat] AI service responded with status: {}", response.getStatusCode());

            // Save the chat interaction to audience_questions table
            try {
                String answer = null;
                if (response.getBody() != null && response.getBody().get("answer") != null) {
                    answer = response.getBody().get("answer").toString();
                }
                audienceService.recordChatInteraction(projectId,
                        new AudienceDTOs.ChatInteractionRequest(query, answer, userName, userEmail));
            } catch (Exception e) {
                logger.warn("[PublicChat] Failed to record chat interaction: {}", e.getMessage());
                // Don't fail the chat response if recording fails
            }

            return ResponseEntity.ok(response.getBody());

        } catch (org.springframework.web.client.ResourceAccessException e) {
            logger.error("[PublicChat] Cannot connect to AI service: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of(
                    "error", "AI Service is not available",
                    "details", "Cannot connect to " + aiServiceUrl));
        } catch (Exception e) {
            logger.error("[PublicChat] Error: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                    "error", "Failed to process chat request",
                    "details", e.getMessage()));
        }
    }

}
