package com.neeshai.backend.project;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.neeshai.backend.audience.AudienceService;
import com.neeshai.backend.blog.BlogDTOs;
import com.neeshai.backend.blog.BlogService;
import com.neeshai.backend.projectlink.ProjectLinkService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(PublicProjectController.class)
class PublicProjectControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ProjectService projectService;

    @MockBean
    private BlogService blogService;

    @MockBean
    private AudienceService audienceService;

    @MockBean
    private ProjectLinkService projectLinkService;

    @Test
    void getPublicProject_WhenProjectExists_ShouldReturnProject() throws Exception {
        // Given
        String slug = "test-project-slug";
        Project testProject = new Project(UUID.randomUUID(), UUID.randomUUID(), "Test Project", slug);
        testProject.setDescription("Test Description");

        when(projectService.getPublicProject(slug)).thenReturn(Optional.of(testProject));

        // When & Then
        mockMvc.perform(get("/api/public/projects/{slug}", slug))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.title").value("Test Project"))
            .andExpect(jsonPath("$.description").value("Test Description"));
    }

    @Test
    void getPublicProject_WhenProjectNotFound_ShouldReturn404() throws Exception {
        // Given
        String slug = "non-existent-slug";
        when(projectService.getPublicProject(slug)).thenReturn(Optional.empty());

        // When & Then
        mockMvc.perform(get("/api/public/projects/{slug}", slug))
            .andExpect(status().isNotFound());
    }

    @Test
    void getPublicBlog_WhenBlogExists_ShouldReturnBlogContent() throws Exception {
        // Given
        UUID projectId = UUID.randomUUID();
        BlogDTOs.BlogContentDTO blogContent = new BlogDTOs.BlogContentDTO(
            "Test Blog",
            "http://example.com/image.jpg",
            "Test Introduction",
            "Test Content",
            List.of()
        );

        when(blogService.getBlogContent(eq(projectId), eq(null))).thenReturn(Optional.of(blogContent));

        // When & Then
        mockMvc.perform(get("/api/public/projects/{projectId}/blog", projectId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.heading").value("Test Blog"))
            .andExpect(jsonPath("$.coverImageUrl").value("http://example.com/image.jpg"))
            .andExpect(jsonPath("$.introduction").value("Test Introduction"))
            .andExpect(jsonPath("$.content").value("Test Content"));
    }

    @Test
    void getPublicBlog_WhenBlogNotFound_ShouldReturn404() throws Exception {
        // Given
        UUID projectId = UUID.randomUUID();
        when(blogService.getBlogContent(eq(projectId), eq(null))).thenReturn(Optional.empty());

        // When & Then
        mockMvc.perform(get("/api/public/projects/{projectId}/blog", projectId))
            .andExpect(status().isNotFound());
    }

    @Test
    void publicChat_WithValidRequest_ShouldReturnResponse() throws Exception {
        // Given
        UUID projectId = UUID.randomUUID();
        String chatRequest = """
            {
                "query": "Hello, how are you?",
                "userName": "John Doe",
                "userEmail": "john@example.com"
            }
            """;

        when(projectLinkService.getLinkedProjectIds(projectId)).thenReturn(List.of());

        // When & Then
        mockMvc.perform(post("/api/public/projects/{projectId}/chat", projectId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(chatRequest))
            .andExpect(status().isOk());
    }

    @Test
    void publicChat_WithEmptyQuery_ShouldReturnBadRequest() throws Exception {
        // Given
        UUID projectId = UUID.randomUUID();
        String chatRequest = """
            {
                "query": "",
                "userName": "John Doe"
            }
            """;

        // When & Then
        mockMvc.perform(post("/api/public/projects/{projectId}/chat", projectId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(chatRequest))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error").value("Query is required"));
    }

    @Test
    void publicChat_WithNullQuery_ShouldReturnBadRequest() throws Exception {
        // Given
        UUID projectId = UUID.randomUUID();
        String chatRequest = """
            {
                "userName": "John Doe"
            }
            """;

        // When & Then
        mockMvc.perform(post("/api/public/projects/{projectId}/chat", projectId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(chatRequest))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error").value("Query is required"));
    }
}