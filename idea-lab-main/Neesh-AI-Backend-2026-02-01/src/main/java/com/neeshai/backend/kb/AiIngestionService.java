package com.neeshai.backend.kb;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.UUID;

/**
 * AiIngestionService
 *
 * Calls the AI service's /internal/ingest/:projectId endpoint to trigger
 * re-embedding of all active documents for a project.
 * This must be called after every document upload, replace, or delete
 * so that the project_embeddings table stays in sync and RAG works correctly.
 */
@Service
public class AiIngestionService {

    private static final Logger log = LoggerFactory.getLogger(AiIngestionService.class);

    @Value("${ai.service.url:http://localhost:3000}")
    private String aiServiceUrl;

    @Value("${ai.service.internal-api-key:neesh-internal-api-key-2024}")
    private String internalApiKey;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    /**
     * Trigger ingestion asynchronously (fire-and-forget).
     * We don't block the upload response on ingestion success —
     * the document is already saved; the worst case is a brief delay
     * before the chatbot knows about the new content.
     */
    public void triggerIngestionAsync(UUID projectId) {
        Thread thread = new Thread(() -> {
            try {
                triggerIngestion(projectId);
            } catch (Exception e) {
                // Log but don't propagate — ingestion failure must not break the upload flow
                log.error("[AiIngestionService] Async ingestion failed for project {}: {}", projectId, e.getMessage());
            }
        });
        thread.setDaemon(true);
        thread.setName("ai-ingest-" + projectId);
        thread.start();
    }

    /**
     * Synchronously call the AI service ingestion endpoint.
     * POST /internal/ingest/{projectId}
     * Header: x-internal-api-key: <key>
     */
    public void triggerIngestion(UUID projectId) throws Exception {
        String url = aiServiceUrl + "/internal/ingest/" + projectId;
        log.info("[AiIngestionService] Triggering ingestion for project {} at {}", projectId, url);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Content-Type", "application/json")
                .header("x-internal-secret", internalApiKey)
                .POST(HttpRequest.BodyPublishers.noBody())
                .timeout(Duration.ofSeconds(120)) // ingestion can take time for large docs
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() == 200) {
            log.info("[AiIngestionService] Ingestion completed successfully for project {}", projectId);
        } else {
            log.warn("[AiIngestionService] Ingestion returned HTTP {} for project {}: {}",
                    response.statusCode(), projectId, response.body());
        }
    }
}
