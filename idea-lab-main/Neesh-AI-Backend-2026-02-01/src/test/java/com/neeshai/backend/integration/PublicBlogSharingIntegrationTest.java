package com.neeshai.backend.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.neeshai.backend.blog.Blog;
import com.neeshai.backend.blog.BlogRepository;
import com.neeshai.backend.project.Project;
import com.neeshai.backend.project.ProjectRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureWebMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureWebMvc
@ActiveProfiles("test")
@Transactional
public class PublicBlogSharingIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private BlogRepository blogRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private Project testProject;
    private Blog testBlog;
    private String testSlug;

    @BeforeEach
    void setUp() {
        // Clean up any existing data
        blogRepository.deleteAll();
        projectRepository.deleteAll();

        // Create test project
        testProject = new Project(UUID.fromString("c7e3f37b-90fe-4d68-a2a7-bca5d2800f27"), UUID.randomUUID(), "Amazing Test Blog Post", "amazing-test-blog-post");
        testProject.setDescription("This is a test blog post for integration testing");

        testProject = projectRepository.save(testProject);

        // Create test blog
        testBlog = Blog.builder()
            .project(testProject)
            .heading("Amazing Test Blog Post")
            .coverImageUrl("https://example.com/cover.jpg")
            .introduction("This is an introduction to our amazing test blog post")
            .content("This is the main content of our test blog post. It contains valuable information.")
            .customFields("[]")
            .build();

        testBlog = blogRepository.save(testBlog);

        // Create test slug
        testSlug = "amazing-test-blog-post-" + testProject.getId().toString();
    }

    @Test
    void getPublicBlogByProjectId_ShouldReturnBlogContent() throws Exception {
        mockMvc.perform(get("/api/public/projects/{projectId}/blog", testProject.getId()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.heading").value("Amazing Test Blog Post"))
            .andExpect(jsonPath("$.coverImageUrl").value("https://example.com/cover.jpg"))
            .andExpect(jsonPath("$.introduction").value("This is an introduction to our amazing test blog post"))
            .andExpect(jsonPath("$.content").value("This is the main content of our test blog post. It contains valuable information."))
            .andExpect(jsonPath("$.customFields").isArray());
    }

    @Test
    void getPublicBlogBySlug_ShouldReturnBlogContent() throws Exception {
        mockMvc.perform(get("/api/public/projects/blog/{slug}", testSlug))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.heading").value("Amazing Test Blog Post"))
            .andExpect(jsonPath("$.coverImageUrl").value("https://example.com/cover.jpg"))
            .andExpect(jsonPath("$.introduction").value("This is an introduction to our amazing test blog post"))
            .andExpect(jsonPath("$.content").value("This is the main content of our test blog post. It contains valuable information."));
    }

    @Test
    void getPublicBlogByInvalidSlug_ShouldReturn404() throws Exception {
        mockMvc.perform(get("/api/public/projects/blog/{slug}", "invalid-slug-without-uuid"))
            .andExpect(status().isNotFound());
    }

    @Test
    void getPublicBlogByNonExistentSlug_ShouldReturn404() throws Exception {
        String nonExistentSlug = "non-existent-post-" + UUID.randomUUID().toString();

        mockMvc.perform(get("/api/public/projects/blog/{slug}", nonExistentSlug))
            .andExpect(status().isNotFound());
    }

    @Test
    void getPublicBlogBySlugWithMalformedUUID_ShouldReturn404() throws Exception {
        String malformedSlug = "test-blog-post-not-a-valid-uuid";

        mockMvc.perform(get("/api/public/projects/blog/{slug}", malformedSlug))
            .andExpect(status().isNotFound());
    }

    @Test
    void getPublicBlogForNonExistentProject_ShouldReturn404() throws Exception {
        UUID nonExistentProjectId = UUID.randomUUID();

        mockMvc.perform(get("/api/public/projects/{projectId}/blog", nonExistentProjectId))
            .andExpect(status().isNotFound());
    }

    @Test
    void getPublicBlogForProjectWithoutBlog_ShouldReturnEmptyBlogContent() throws Exception {
        // Create project without blog
        Project projectWithoutBlog = new Project(UUID.randomUUID(), UUID.randomUUID(), "Project Without Blog", "project-without-blog");
        projectWithoutBlog.setDescription("Test project");

        projectWithoutBlog = projectRepository.save(projectWithoutBlog);

        mockMvc.perform(get("/api/public/projects/{projectId}/blog", projectWithoutBlog.getId()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.heading").value(""))
            .andExpect(jsonPath("$.customFields").isArray())
            .andExpect(jsonPath("$.customFields").isEmpty());
    }
}