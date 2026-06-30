package com.neeshai.backend.blog;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.neeshai.backend.project.Project;
import com.neeshai.backend.project.ProjectRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class BlogService {

    private static final Logger log = LoggerFactory.getLogger(BlogService.class);

    private final BlogRepository blogRepository;
    private final ProjectRepository projectRepository;
    private final ObjectMapper objectMapper;

    public BlogService(BlogRepository blogRepository, ProjectRepository projectRepository, ObjectMapper objectMapper) {
        this.blogRepository = blogRepository;
        this.projectRepository = projectRepository;
        this.objectMapper = objectMapper;
    }

    public Optional<BlogDTOs.BlogContentDTO> getBlogContent(UUID projectId, UUID ownerId) {
        Optional<Project> projectOpt = projectRepository.findById(projectId);

        if (projectOpt.isEmpty()) {
            return Optional.empty();
        }

        // Only verify ownership if ownerId is provided (authenticated request)
        // If ownerId is null, allow public access
        if (ownerId != null && !projectOpt.get().getOwnerId().equals(ownerId)) {
            return Optional.empty();
        }

        Optional<Blog> blogOpt = blogRepository.findByProjectId(projectId);
        if (blogOpt.isEmpty()) {
            return Optional.of(new BlogDTOs.BlogContentDTO(
                    projectOpt.get().getTitle(), "", "", "", List.of()));
        }

        Blog blog = blogOpt.get();
        List<Map<String, Object>> customFields = parseCustomFields(blog.getCustomFields());

        log.debug("Retrieved blog content with {} custom fields for project {}", customFields.size(), projectId);

        String heading = (blog.getHeading() != null && !blog.getHeading().isBlank())
                ? blog.getHeading()
                : projectOpt.get().getTitle();

        return Optional.of(new BlogDTOs.BlogContentDTO(
                heading,
                blog.getCoverImageUrl(),
                blog.getIntroduction(),
                blog.getContent(),
                customFields));
    }

    @Transactional
    public Optional<BlogDTOs.BlogContentDTO> updateBlogContent(UUID projectId, UUID ownerId,
            BlogDTOs.UpdateBlogRequest request) {

        log.debug("Updating blog content for project {} by user {}", projectId, ownerId);
        if (log.isTraceEnabled()) {
            log.trace("Update request - Heading: {}, Cover Image: {}, Custom Fields: {}",
                    request.heading(), request.coverImageUrl(),
                    request.customFields() != null ? request.customFields().size() : 0);
        }

        Optional<Project> projectOpt = projectRepository.findById(projectId);

        if (projectOpt.isEmpty()) {
            log.warn("Project not found for id: {}", projectId);
            return Optional.empty();
        }

        log.debug("Found project owned by: {} for request by user: {}", projectOpt.get().getOwnerId(), ownerId);

        Project project = projectOpt.get();
        Blog blog = blogRepository.findByProjectId(projectId)
                .orElse(Blog.builder()
                        .project(project)
                        .build());

        boolean isNewBlog = blog.getId() == null;
        log.debug("{} blog for project {}", isNewBlog ? "Creating new" : "Updating existing", projectId);

        blog.setHeading(request.heading());
        blog.setCoverImageUrl(request.coverImageUrl());
        blog.setIntroduction(request.introduction());
        blog.setContent(request.content());
        blog.setCustomFields(serializeCustomFields(request.customFields()));

        Blog savedBlog = blogRepository.save(blog);
        log.debug("Successfully {} blog with id: {}", isNewBlog ? "created" : "updated", savedBlog.getId());

        return Optional.of(new BlogDTOs.BlogContentDTO(
                savedBlog.getHeading(),
                savedBlog.getCoverImageUrl(),
                savedBlog.getIntroduction(),
                savedBlog.getContent(),
                request.customFields()));
    }

    private List<Map<String, Object>> parseCustomFields(String json) {
        if (json == null || json.isEmpty()) {
            return List.of();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<List<Map<String, Object>>>() {
            });
        } catch (JsonProcessingException e) {
            log.error("Error parsing custom fields JSON", e);
            return List.of();
        }
    }

    private String serializeCustomFields(List<Map<String, Object>> customFields) {
        if (customFields == null || customFields.isEmpty()) {
            return "[]";
        }
        try {
            return objectMapper.writeValueAsString(customFields);
        } catch (JsonProcessingException e) {
            log.error("Error serializing custom fields", e);
            return "[]";
        }
    }
}
