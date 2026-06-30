package com.neeshai.backend.blog;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.neeshai.backend.project.Project;
import com.neeshai.backend.project.ProjectRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BlogServiceTest {

    @Mock
    private BlogRepository blogRepository;

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private BlogService blogService;

    private UUID projectId;
    private UUID ownerId;
    private Project testProject;
    private Blog testBlog;

    @BeforeEach
    void setUp() {
        projectId = UUID.randomUUID();
        ownerId = UUID.randomUUID();

        testProject = Project.builder()
            .id(projectId)
            .ownerId(ownerId)
            .title("Test Project")
            .description("Test Description")
            .build();

        testBlog = Blog.builder()
            .id(UUID.randomUUID())
            .project(testProject)
            .heading("Test Blog")
            .coverImageUrl("http://example.com/image.jpg")
            .introduction("Test Introduction")
            .content("Test Content")
            .customFields("[]")
            .build();
    }

    @Test
    void getBlogContent_WhenProjectExists_ShouldReturnBlogContent() {
        // Given
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(testProject));
        when(blogRepository.findByProjectId(projectId)).thenReturn(Optional.of(testBlog));
        when(objectMapper.readValue(eq("[]"), any())).thenReturn(List.of());

        // When
        Optional<BlogDTOs.BlogContentDTO> result = blogService.getBlogContent(projectId, ownerId);

        // Then
        assertThat(result).isPresent();
        assertThat(result.get().heading()).isEqualTo("Test Blog");
        assertThat(result.get().coverImageUrl()).isEqualTo("http://example.com/image.jpg");
        assertThat(result.get().introduction()).isEqualTo("Test Introduction");
        assertThat(result.get().content()).isEqualTo("Test Content");
    }

    @Test
    void getBlogContent_WhenProjectNotFound_ShouldReturnEmpty() {
        // Given
        when(projectRepository.findById(projectId)).thenReturn(Optional.empty());

        // When
        Optional<BlogDTOs.BlogContentDTO> result = blogService.getBlogContent(projectId, ownerId);

        // Then
        assertThat(result).isEmpty();
        verify(blogRepository, never()).findByProjectId(any());
    }

    @Test
    void getBlogContent_WhenOwnerMismatch_ShouldReturnEmpty() {
        // Given
        UUID wrongOwnerId = UUID.randomUUID();
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(testProject));

        // When
        Optional<BlogDTOs.BlogContentDTO> result = blogService.getBlogContent(projectId, wrongOwnerId);

        // Then
        assertThat(result).isEmpty();
        verify(blogRepository, never()).findByProjectId(any());
    }

    @Test
    void getBlogContent_WithNullOwner_ShouldAllowPublicAccess() {
        // Given
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(testProject));
        when(blogRepository.findByProjectId(projectId)).thenReturn(Optional.of(testBlog));
        when(objectMapper.readValue(eq("[]"), any())).thenReturn(List.of());

        // When
        Optional<BlogDTOs.BlogContentDTO> result = blogService.getBlogContent(projectId, null);

        // Then
        assertThat(result).isPresent();
        assertThat(result.get().heading()).isEqualTo("Test Blog");
    }

    @Test
    void getBlogContent_WhenBlogNotFound_ShouldReturnEmptyContent() {
        // Given
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(testProject));
        when(blogRepository.findByProjectId(projectId)).thenReturn(Optional.empty());

        // When
        Optional<BlogDTOs.BlogContentDTO> result = blogService.getBlogContent(projectId, ownerId);

        // Then
        assertThat(result).isPresent();
        assertThat(result.get().heading()).isEmpty();
        assertThat(result.get().customFields()).isEmpty();
    }

    @Test
    void updateBlogContent_WhenProjectExists_ShouldUpdateBlog() throws Exception {
        // Given
        BlogDTOs.UpdateBlogRequest request = new BlogDTOs.UpdateBlogRequest(
            "Updated Heading",
            "http://example.com/new-image.jpg",
            "Updated Introduction",
            "Updated Content",
            List.of(Map.of("key", "value"))
        );

        when(projectRepository.findById(projectId)).thenReturn(Optional.of(testProject));
        when(blogRepository.findByProjectId(projectId)).thenReturn(Optional.of(testBlog));
        when(objectMapper.writeValueAsString(any())).thenReturn("[{\"key\":\"value\"}]");
        when(blogRepository.save(any(Blog.class))).thenReturn(testBlog);

        // When
        Optional<BlogDTOs.BlogContentDTO> result = blogService.updateBlogContent(projectId, ownerId, request);

        // Then
        assertThat(result).isPresent();
        verify(blogRepository).save(any(Blog.class));
        verify(objectMapper).writeValueAsString(request.customFields());
    }

    @Test
    void updateBlogContent_WhenProjectNotFound_ShouldReturnEmpty() {
        // Given
        BlogDTOs.UpdateBlogRequest request = new BlogDTOs.UpdateBlogRequest(
            "Updated Heading", null, null, null, null
        );
        when(projectRepository.findById(projectId)).thenReturn(Optional.empty());

        // When
        Optional<BlogDTOs.BlogContentDTO> result = blogService.updateBlogContent(projectId, ownerId, request);

        // Then
        assertThat(result).isEmpty();
        verify(blogRepository, never()).save(any());
    }

    @Test
    void updateBlogContent_WhenBlogNotExists_ShouldCreateNewBlog() throws Exception {
        // Given
        BlogDTOs.UpdateBlogRequest request = new BlogDTOs.UpdateBlogRequest(
            "New Blog", null, "New Intro", "New Content", null
        );

        when(projectRepository.findById(projectId)).thenReturn(Optional.of(testProject));
        when(blogRepository.findByProjectId(projectId)).thenReturn(Optional.empty());
        when(objectMapper.writeValueAsString(any())).thenReturn("[]");
        when(blogRepository.save(any(Blog.class))).thenReturn(testBlog);

        // When
        Optional<BlogDTOs.BlogContentDTO> result = blogService.updateBlogContent(projectId, ownerId, request);

        // Then
        assertThat(result).isPresent();
        verify(blogRepository).save(any(Blog.class));
    }
}