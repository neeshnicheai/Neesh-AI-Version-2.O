package com.neeshai.backend.apikey;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/user/api-keys")
public class UserApiKeyController {

    private static final Logger logger = LoggerFactory.getLogger(UserApiKeyController.class);

    private final UserApiKeyService apiKeyService;

    public UserApiKeyController(UserApiKeyService apiKeyService) {
        this.apiKeyService = apiKeyService;
    }

    private UUID getCurrentUserId() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof Jwt) {
            Jwt jwt = (Jwt) authentication.getPrincipal();
            return UUID.fromString(jwt.getSubject());
        }
        throw new RuntimeException("User not authenticated");
    }

    /**
     * Save or update an API key for a provider.
     * Body: { "provider": "OPENAI", "apiKey": "sk-..." }
     */
    @PostMapping
    public ResponseEntity<?> saveApiKey(@RequestBody Map<String, String> request) {
        UUID userId = getCurrentUserId();
        String provider = request.get("provider");
        String apiKey = request.get("apiKey");

        logger.info("[UserApiKeyController] POST /api/user/api-keys - provider: {}, userId: {}", provider, userId);

        if (provider == null || provider.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Provider is required"));
        }
        if (apiKey == null || apiKey.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "API key is required"));
        }

        try {
            apiKeyService.saveApiKey(userId, provider.trim(), apiKey.trim());
            return ResponseEntity
                    .ok(Map.of("message", "API key saved successfully", "provider", provider.trim().toUpperCase()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            logger.error("[UserApiKeyController] Failed to save API key: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to save API key"));
        }
    }

    /**
     * Get list of saved providers (no keys returned for security).
     */
    @GetMapping
    public ResponseEntity<?> getSavedProviders() {
        UUID userId = getCurrentUserId();
        logger.info("[UserApiKeyController] GET /api/user/api-keys - userId: {}", userId);

        try {
            List<Map<String, String>> providers = apiKeyService.getSavedProviders(userId);
            return ResponseEntity.ok(providers);
        } catch (Exception e) {
            logger.error("[UserApiKeyController] Failed to get saved providers: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to retrieve API keys"));
        }
    }

    /**
     * Delete an API key for a specific provider.
     */
    @DeleteMapping("/{provider}")
    public ResponseEntity<?> deleteApiKey(@PathVariable String provider) {
        UUID userId = getCurrentUserId();
        logger.info("[UserApiKeyController] DELETE /api/user/api-keys/{} - userId: {}", provider, userId);

        try {
            apiKeyService.deleteApiKey(userId, provider);
            return ResponseEntity.ok(Map.of("message", "API key deleted successfully"));
        } catch (Exception e) {
            logger.error("[UserApiKeyController] Failed to delete API key: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to delete API key"));
        }
    }
}
