package com.neeshai.backend.project;

import com.neeshai.backend.util.SlugUtils;
import com.neeshai.backend.projectlink.ProjectLinkService;
import com.neeshai.backend.user.User;
import com.neeshai.backend.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class ProjectService {

    private static final int FREE_PROJECT_LIMIT = 5;

    private final ProjectRepository projectRepository;
    private final ProjectLinkService projectLinkService;
    private final UserRepository userRepository;

    public ProjectService(ProjectRepository projectRepository, ProjectLinkService projectLinkService,
                          UserRepository userRepository) {
        this.projectRepository = projectRepository;
        this.projectLinkService = projectLinkService;
        this.userRepository = userRepository;
    }

    @Transactional
    public Project createProject(UUID ownerId, ProjectDTOs.CreateProjectRequest request) {
        // Enforce project limit for Free users
        User user = userRepository.findById(ownerId).orElse(null);
        String plan = (user != null && user.getSubscriptionPlan() != null) ? user.getSubscriptionPlan() : "FREE";

        if ("FREE".equalsIgnoreCase(plan)) {
            long currentCount = projectRepository.findByOwnerId(ownerId).size();
            if (currentCount >= FREE_PROJECT_LIMIT) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Free users can create up to " + FREE_PROJECT_LIMIT + " projects. " +
                        "Please delete an existing project or upgrade to Pro.");
            }
        }

        String baseSlug = SlugUtils.toSlug(request.title());
        String slug = resolveUniqueSlug(baseSlug);

        Project project = new Project(null, ownerId, request.title(), slug);
        project.setOneLineSummary(request.oneLineSummary());
        project.setIntroduction(request.introduction());
        project.setDescription(request.description());
        project.setIndustry(request.industry());
        project.setStartupStage(request.startupStage());

        return projectRepository.save(project);
    }

    public List<Project> getMyProjects(UUID ownerId) {
        // Repository filters deleted=false via @Where/@SQLRestriction
        return projectRepository.findByOwnerId(ownerId);
    }

    public Optional<Project> getProject(UUID id, UUID ownerId) {
        return projectRepository.findById(id)
                .filter(p -> {
                    // Strict Ownership Check
                    if (!p.getOwnerId().equals(ownerId)) {
                        // We filter it out, which results in 404 (Not Found) to avoid leaking existence
                        return false;
                    }
                    return true;
                });
    }

    @Transactional
    public Optional<Project> updateProject(UUID id, UUID ownerId, ProjectDTOs.UpdateProjectRequest request) {
        return projectRepository.findById(id)
                .filter(p -> p.getOwnerId().equals(ownerId)) // Strict Ownership
                .map(project -> {
                    // Slug Logic: Regenerate ONLY if title changes
                    if (request.title() != null && !request.title().equals(project.getTitle())) {
                        project.setTitle(request.title());
                        String newBaseSlug = SlugUtils.toSlug(request.title());
                        if (!newBaseSlug.equals(project.getSlug())) {
                            String uniqueSlug = resolveUniqueSlug(newBaseSlug);
                            project.setSlug(uniqueSlug);
                        }
                    }

                    if (request.oneLineSummary() != null)
                        project.setOneLineSummary(request.oneLineSummary());
                    if (request.introduction() != null)
                        project.setIntroduction(request.introduction());
                    if (request.description() != null)
                        project.setDescription(request.description());
                    if (request.industry() != null)
                        project.setIndustry(request.industry());
                    if (request.startupStage() != null)
                        project.setStartupStage(request.startupStage());

                    // Status Transition Logic
                    if (request.status() != null) {
                        String statusUpper = request.status().toUpperCase();
                        // Simple validation
                        if ("DRAFT".equals(statusUpper) || "PUBLISHED".equals(statusUpper)) {
                            project.setStatus(statusUpper);
                        } else {
                            // Ignore invalid status or throw? Let's ignore to be safe/lenient or throw 400?
                            // Prompt says "Disallow invalid status values".
                            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status");
                        }
                    }

                    return projectRepository.save(project);
                });
    }

    @Transactional
    public boolean deleteProject(UUID id, UUID ownerId) {
        return projectRepository.findById(id)
                .filter(p -> p.getOwnerId().equals(ownerId)) // Strict Ownership
                .map(p -> {
                    // Clean up all project links involving this project (both directions)
                    projectLinkService.deleteAllLinksForProject(id);
                    projectRepository.delete(p); // Triggers @SQLDelete (soft delete)
                    return true;
                }).orElse(false);
    }

    public Optional<Project> getPublicProject(String slug) {
        return projectRepository.findBySlug(slug)
                .filter(p -> "PUBLISHED".equals(p.getStatus()))
                .filter(p -> !p.isDeleted()); // Double check, though repo handles it
    }

    // Deterministic Slug Resolution
    private String resolveUniqueSlug(String baseSlug) {
        // Check against DB (including deleted ones to ensure global uniqueness)
        if (!projectRepository.existsBySlugInDb(baseSlug)) {
            return baseSlug;
        }

        int attempt = 1;
        while (true) {
            String candidate = baseSlug + "-" + attempt;
            if (!projectRepository.existsBySlugInDb(candidate)) {
                return candidate;
            }
            attempt++;
            // Safety break
            if (attempt > 1000)
                throw new RuntimeException("Could not generate unique slug");
        }
    }
}
