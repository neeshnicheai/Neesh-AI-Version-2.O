package com.neeshai.backend.projectlink;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/projects/{projectId}/links")
public class ProjectLinkController {

    private static final Logger log = LoggerFactory.getLogger(ProjectLinkController.class);

    private final ProjectLinkService projectLinkService;

    public ProjectLinkController(ProjectLinkService projectLinkService) {
        this.projectLinkService = projectLinkService;
    }

    private UUID getUserIdFromJwt(Jwt jwt) {
        try {
            return UUID.fromString(jwt.getSubject());
        } catch (IllegalArgumentException e) {
            log.error("Failed to parse UUID from JWT subject: {}", jwt.getSubject());
            throw e;
        }
    }

    @PostMapping
    public ResponseEntity<ProjectLinkDTOs.LinkedProjectDTO> linkProject(
            @PathVariable UUID projectId,
            @RequestBody ProjectLinkDTOs.CreateLinkRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        UUID ownerId = getUserIdFromJwt(jwt);
        log.info("Link project request: {} -> {} (type: {})", projectId, request.linkedProjectId(), request.linkType());
        ProjectLinkDTOs.LinkedProjectDTO result = projectLinkService.linkProject(projectId, ownerId, request);
        return ResponseEntity.ok(result);
    }

    @GetMapping
    public ResponseEntity<List<ProjectLinkDTOs.LinkedProjectDTO>> getLinkedProjects(
            @PathVariable UUID projectId,
            @AuthenticationPrincipal Jwt jwt) {
        UUID ownerId = getUserIdFromJwt(jwt);
        List<ProjectLinkDTOs.LinkedProjectDTO> links = projectLinkService.getLinkedProjects(projectId, ownerId);
        return ResponseEntity.ok(links);
    }

    @DeleteMapping("/{linkId}")
    public ResponseEntity<Void> unlinkProject(
            @PathVariable UUID projectId,
            @PathVariable UUID linkId,
            @AuthenticationPrincipal Jwt jwt) {
        UUID ownerId = getUserIdFromJwt(jwt);
        boolean unlinked = projectLinkService.unlinkProject(projectId, linkId, ownerId);
        if (unlinked) {
            return ResponseEntity.noContent().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}
