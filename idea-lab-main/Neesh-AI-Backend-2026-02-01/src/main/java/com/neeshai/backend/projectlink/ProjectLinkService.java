package com.neeshai.backend.projectlink;

import com.neeshai.backend.project.Project;
import com.neeshai.backend.project.ProjectRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ProjectLinkService {

    private static final Logger log = LoggerFactory.getLogger(ProjectLinkService.class);
    private static final List<String> VALID_LINK_TYPES = Arrays.asList("RESEARCH", "USECASE", "SOLUTION");

    private final ProjectLinkRepository projectLinkRepository;
    private final ProjectRepository projectRepository;

    public ProjectLinkService(ProjectLinkRepository projectLinkRepository, ProjectRepository projectRepository) {
        this.projectLinkRepository = projectLinkRepository;
        this.projectRepository = projectRepository;
    }

    @Transactional
    public ProjectLinkDTOs.LinkedProjectDTO linkProject(UUID sourceProjectId, UUID ownerId,
            ProjectLinkDTOs.CreateLinkRequest request) {
        // Validate ownership of source project
        projectRepository.findById(sourceProjectId)
                .filter(p -> p.getOwnerId().equals(ownerId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Source project not found"));

        // Validate linked project exists and belongs to same owner
        Project linkedProject = projectRepository.findById(request.linkedProjectId())
                .filter(p -> p.getOwnerId().equals(ownerId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Linked project not found"));

        // Prevent self-linking
        if (sourceProjectId.equals(request.linkedProjectId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot link a project to itself");
        }

        // Validate link type
        String linkType = request.linkType() != null ? request.linkType().toUpperCase() : "RESEARCH";
        if (!VALID_LINK_TYPES.contains(linkType)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Invalid link type. Must be one of: " + VALID_LINK_TYPES);
        }

        // Check for duplicate (both directions)
        if (projectLinkRepository.findBySourceProjectIdAndLinkedProjectId(sourceProjectId, request.linkedProjectId())
                .isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Projects are already linked");
        }
        // Also check reverse direction (B→A already exists)
        if (projectLinkRepository.findBySourceProjectIdAndLinkedProjectId(request.linkedProjectId(), sourceProjectId)
                .isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Projects are already linked (reverse direction)");
        }

        ProjectLink link = new ProjectLink(sourceProjectId, request.linkedProjectId(), linkType);
        link = projectLinkRepository.save(link);

        log.info("Linked project {} -> {} with type {}", sourceProjectId, request.linkedProjectId(), linkType);

        return new ProjectLinkDTOs.LinkedProjectDTO(
                link.getId(),
                linkedProject.getId(),
                linkedProject.getTitle(),
                linkedProject.getOneLineSummary(),
                link.getLinkType(),
                link.getCreatedAt());
    }

    public List<ProjectLinkDTOs.LinkedProjectDTO> getLinkedProjects(UUID sourceProjectId, UUID ownerId) {
        // Validate ownership
        projectRepository.findById(sourceProjectId)
                .filter(p -> p.getOwnerId().equals(ownerId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found"));

        List<ProjectLinkDTOs.LinkedProjectDTO> result = new java.util.ArrayList<>();

        // Forward links: this project is the source
        List<ProjectLink> forwardLinks = projectLinkRepository.findBySourceProjectId(sourceProjectId);
        for (ProjectLink link : forwardLinks) {
            Project linkedProject = projectRepository.findById(link.getLinkedProjectId()).orElse(null);
            if (linkedProject != null) {
                result.add(new ProjectLinkDTOs.LinkedProjectDTO(
                        link.getId(),
                        linkedProject.getId(),
                        linkedProject.getTitle(),
                        linkedProject.getOneLineSummary(),
                        link.getLinkType(),
                        link.getCreatedAt()));
            }
        }

        // Reverse links: this project is the target
        List<ProjectLink> reverseLinks = projectLinkRepository.findByLinkedProjectId(sourceProjectId);
        for (ProjectLink link : reverseLinks) {
            Project sourceProject = projectRepository.findById(link.getSourceProjectId()).orElse(null);
            if (sourceProject != null) {
                result.add(new ProjectLinkDTOs.LinkedProjectDTO(
                        link.getId(),
                        sourceProject.getId(),
                        sourceProject.getTitle(),
                        sourceProject.getOneLineSummary(),
                        link.getLinkType(),
                        link.getCreatedAt()));
            }
        }

        return result;
    }

    @Transactional
    public boolean unlinkProject(UUID sourceProjectId, UUID linkId, UUID ownerId) {
        // Validate ownership
        projectRepository.findById(sourceProjectId)
                .filter(p -> p.getOwnerId().equals(ownerId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found"));

        return projectLinkRepository.findById(linkId)
                .filter(link -> link.getSourceProjectId().equals(sourceProjectId))
                .map(link -> {
                    projectLinkRepository.delete(link);
                    log.info("Unlinked project {} from {}", link.getLinkedProjectId(), sourceProjectId);
                    return true;
                })
                .orElse(false);
    }

    /**
     * Used by ChatController to get linked project IDs for knowledge sharing.
     * No ownership check — called internally.
     * Returns IDs from both directions (forward + reverse links).
     */
    public List<UUID> getLinkedProjectIds(UUID sourceProjectId) {
        List<UUID> forwardIds = projectLinkRepository.findLinkedProjectIdsBySourceProjectId(sourceProjectId);
        List<UUID> reverseIds = projectLinkRepository.findSourceProjectIdsByLinkedProjectId(sourceProjectId);
        java.util.Set<UUID> allIds = new java.util.LinkedHashSet<>(forwardIds);
        allIds.addAll(reverseIds);
        return new java.util.ArrayList<>(allIds);
    }

    /**
     * Delete all links involving a project (both directions).
     * Called when a project is deleted.
     */
    @Transactional
    public void deleteAllLinksForProject(UUID projectId) {
        projectLinkRepository.deleteBySourceProjectIdOrLinkedProjectId(projectId, projectId);
        log.info("Deleted all links for project {}", projectId);
    }
}
