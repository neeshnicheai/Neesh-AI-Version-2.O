package com.neeshai.backend.notification;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api")
public class NotificationController {

    private static final Logger log = LoggerFactory.getLogger(NotificationController.class);
    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    /**
     * List question clusters for a project.
     * Query params: status (all|UNANSWERED|PARTIALLY_ANSWERED|ANSWERED), sort
     * (priority|recent|most_asked), search
     */
    @GetMapping("/projects/{projectId}/notifications")
    public ResponseEntity<NotificationDTOs.ClusterListResponse> getClusters(
            @PathVariable UUID projectId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false, defaultValue = "priority") String sort,
            @RequestParam(required = false) String search,
            @AuthenticationPrincipal Jwt jwt) {
        log.info("GET /projects/{}/notifications?status={}&sort={}&search={}", projectId, status, sort, search);
        return ResponseEntity.ok(notificationService.getClusters(projectId, status, sort, search));
    }

    /**
     * Get unanswered cluster count for sidebar badge.
     */
    @GetMapping("/projects/{projectId}/notifications/count")
    public ResponseEntity<NotificationDTOs.BadgeCountResponse> getBadgeCount(
            @PathVariable UUID projectId,
            @AuthenticationPrincipal Jwt jwt) {
        long count = notificationService.getUnansweredCount(projectId);
        return ResponseEntity.ok(new NotificationDTOs.BadgeCountResponse(count));
    }

    /**
     * Get cluster detail with audience list and reply history.
     */
    @GetMapping("/notifications/clusters/{clusterId}")
    public ResponseEntity<NotificationDTOs.ClusterDetailResponse> getClusterDetail(
            @PathVariable UUID clusterId,
            @AuthenticationPrincipal Jwt jwt) {
        log.info("GET /notifications/clusters/{}", clusterId);
        return ResponseEntity.ok(notificationService.getClusterDetail(clusterId));
    }

    /**
     * Send reply to selected or all users in a cluster.
     */
    @PostMapping("/notifications/clusters/{clusterId}/reply")
    public ResponseEntity<NotificationDTOs.SendReplyResponse> sendReply(
            @PathVariable UUID clusterId,
            @RequestBody NotificationDTOs.SendReplyRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        UUID adminId = UUID.fromString(jwt.getSubject());
        log.info("POST /notifications/clusters/{}/reply by admin {}", clusterId, adminId);
        return ResponseEntity.ok(notificationService.sendReply(clusterId, request, adminId));
    }

    /**
     * Public endpoint: ingest a question from the chatbot.
     * This duplicates the question report flow but feeds into the clustering
     * engine.
     */
    @PostMapping("/public/projects/{projectId}/notifications/ingest")
    public ResponseEntity<NotificationDTOs.ClusterSummaryResponse> ingestQuestion(
            @PathVariable UUID projectId,
            @RequestBody IngestRequest request) {
        log.info("POST /public/projects/{}/notifications/ingest: '{}'", projectId, request.question());
        QuestionCluster cluster = notificationService.ingestQuestion(
                projectId, request.question(), request.userName(),
                request.userEmail(), request.persona(), request.source());
        return ResponseEntity.ok(NotificationDTOs.ClusterSummaryResponse.fromEntity(cluster));
    }

    public record IngestRequest(
            String question,
            String userName,
            String userEmail,
            String persona,
            String source) {
    }
}
