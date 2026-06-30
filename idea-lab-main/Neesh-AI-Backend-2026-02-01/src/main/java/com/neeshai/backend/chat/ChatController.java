package com.neeshai.backend.chat;

import com.neeshai.backend.apikey.UserApiKeyService;
import com.neeshai.backend.projectlink.ProjectLinkService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import java.time.Instant;
import java.util.Map;
import java.util.HashMap;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Tag(name = "Chat", description = "AI chat endpoints for project-based conversations")
@RestController
@RequestMapping("/api")
public class ChatController {

    private static final Logger logger = LoggerFactory.getLogger(ChatController.class);

    @Value("${ai.service.url:http://localhost:3000}")
    private String aiServiceUrl;

    @Value("${ai.service.internal-api-key:neesh-internal-api-key-2024}")
    private String aiServiceApiKey;

    private final RestTemplate restTemplate;
    private final ProjectLinkService projectLinkService;
    private final UserApiKeyService userApiKeyService;

    public ChatController(ProjectLinkService projectLinkService, UserApiKeyService userApiKeyService) {
        this.restTemplate = new RestTemplate();
        this.projectLinkService = projectLinkService;
        this.userApiKeyService = userApiKeyService;
    }

    private UUID getCurrentUserId() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof Jwt) {
            Jwt jwt = (Jwt) authentication.getPrincipal();
            return UUID.fromString(jwt.getSubject());
        }
        return null;
    }

    @Operation(
        summary = "Chat with a project",
        description = "Send a query to chat with a specific project's knowledge base",
        responses = {
            @ApiResponse(responseCode = "200", description = "Successful response",
                        content = @Content(schema = @Schema(implementation = ChatDTOs.ChatResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid request",
                        content = @Content(schema = @Schema(implementation = ChatDTOs.ChatErrorResponse.class))),
            @ApiResponse(responseCode = "429", description = "Rate limit exceeded"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
        }
    )
    @PostMapping("/projects/{projectId}/chat")
    public ResponseEntity<Object> chatWithProject(
            @Parameter(description = "Project ID to chat with", required = true)
            @PathVariable UUID projectId,
            @Valid @RequestBody ChatDTOs.ChatRequest request) {

        String query = request.query();
        logger.info("[ChatController] POST /api/projects/{}/chat - Received chat query. Query length: {} chars",
                projectId, query.length());

        try {
            // Fetch linked project IDs for knowledge sharing
            List<UUID> linkedProjectIds = projectLinkService.getLinkedProjectIds(projectId);
            logger.info("[ChatController] Found {} linked projects for knowledge sharing", linkedProjectIds.size());

            String url = aiServiceUrl + "/internal/chat";
            logger.info("[ChatController] Forwarding chat request to AI service: {}", url);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("X-Internal-Secret", aiServiceApiKey);

            Map<String, Object> body = new HashMap<>();
            body.put("projectId", projectId.toString());
            body.put("query", query);
            // Pass linked project IDs for cross-project knowledge sharing
            if (!linkedProjectIds.isEmpty()) {
                body.put("linkedProjectIds", linkedProjectIds.stream()
                        .map(UUID::toString)
                        .collect(Collectors.toList()));
            }

            // Fetch user's LLM provider and API key
            UUID userId = getCurrentUserId();
            if (userId != null) {
                Map<String, String> apiKeyConfig = userApiKeyService.getActiveConfig(userId);
                if (apiKeyConfig != null) {
                    body.put("provider", apiKeyConfig.get("provider"));
                    body.put("apiKey", apiKeyConfig.get("apiKey"));
                    logger.info("[ChatController] Using user's LLM provider: {}", apiKeyConfig.get("provider"));
                } else {
                    logger.info("[ChatController] No user API key configured, AI service will use fallback");
                }
            }

            logger.debug("[ChatController] Request payload to AI service: projectId={}, query={}, linkedProjects={}",
                    projectId, query, linkedProjectIds.size());

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);

            logger.info("[ChatController] Received response from AI service. Status: {}", response.getStatusCode());
            if (response.getBody() != null) {
                logger.debug("[ChatController] AI service response: {}", response.getBody());
            }

            return ResponseEntity.ok(response.getBody());

        } catch (org.springframework.web.client.HttpClientErrorException e) {
            // Forward provider-specific errors from AI service
            logger.error("[ChatController] AI service returned error: {}", e.getResponseBodyAsString());
            try {
                // Try to parse the error response from AI service
                Map errorBody = new com.fasterxml.jackson.databind.ObjectMapper()
                        .readValue(e.getResponseBodyAsString(), Map.class);
                return ResponseEntity.status(e.getStatusCode()).body(errorBody);
            } catch (Exception parseError) {
                return ResponseEntity.status(e.getStatusCode()).body(Map.of(
                        "error", "AI Service error",
                        "details", e.getResponseBodyAsString()));
            }
        } catch (org.springframework.web.client.ResourceAccessException e) {
            logger.error("[ChatController] Cannot connect to AI service at {}. Is the AI service running? Error: {}",
                    aiServiceUrl, e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of(
                    "error", "AI Service is not available. Please ensure the AI service is running.",
                    "details", "Cannot connect to " + aiServiceUrl));
        } catch (Exception e) {
            logger.error("[ChatController] Error during chat processing for project {}: {}", projectId, e.getMessage(),
                    e);
            return ResponseEntity.internalServerError().body(Map.of(
                    "error", "Failed to communicate with AI Service",
                    "details", e.getMessage()));
        }
    }
}
