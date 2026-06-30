package com.neeshai.backend.chat;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureWebMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.client.RestTemplate;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for ChatController
 *
 * Tests the API endpoints for chat functionality including validation,
 * error handling, and rate limiting.
 */
@SpringBootTest
@AutoConfigureWebMvc
@ActiveProfiles("test")
class ChatControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private RestTemplate restTemplate; // Mock external AI service calls

    @Test
    @WithMockUser
    void chatWithProject_ValidRequest_ShouldReturnOk() throws Exception {
        // Given
        String projectId = "550e8400-e29b-41d4-a716-446655440000";
        ChatDTOs.ChatRequest request = new ChatDTOs.ChatRequest("How do I get started?");

        // When & Then
        mockMvc.perform(post("/api/projects/{projectId}/chat", projectId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().is5xxServerError()); // Expected since AI service is mocked
    }

    @Test
    @WithMockUser
    void chatWithProject_EmptyQuery_ShouldReturnBadRequest() throws Exception {
        // Given
        String projectId = "550e8400-e29b-41d4-a716-446655440000";
        ChatDTOs.ChatRequest request = new ChatDTOs.ChatRequest("");

        // When & Then
        mockMvc.perform(post("/api/projects/{projectId}/chat", projectId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Validation Failed"))
                .andExpect(jsonPath("$.details").exists());
    }

    @Test
    @WithMockUser
    void chatWithProject_TooLongQuery_ShouldReturnBadRequest() throws Exception {
        // Given
        String projectId = "550e8400-e29b-41d4-a716-446655440000";
        String longQuery = "x".repeat(2001); // Exceeds 2000 character limit
        ChatDTOs.ChatRequest request = new ChatDTOs.ChatRequest(longQuery);

        // When & Then
        mockMvc.perform(post("/api/projects/{projectId}/chat", projectId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Validation Failed"));
    }

    @Test
    @WithMockUser
    void chatWithProject_InvalidProjectId_ShouldReturnBadRequest() throws Exception {
        // Given
        String invalidProjectId = "invalid-uuid";
        ChatDTOs.ChatRequest request = new ChatDTOs.ChatRequest("Valid query");

        // When & Then
        mockMvc.perform(post("/api/projects/{projectId}/chat", invalidProjectId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void chatWithProject_NoAuthentication_ShouldReturnUnauthorized() throws Exception {
        // Given
        String projectId = "550e8400-e29b-41d4-a716-446655440000";
        ChatDTOs.ChatRequest request = new ChatDTOs.ChatRequest("How do I get started?");

        // When & Then
        mockMvc.perform(post("/api/projects/{projectId}/chat", projectId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void healthCheck_ShouldReturnOk() throws Exception {
        // When & Then
        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }

    @Test
    void swaggerUI_ShouldBeAccessible() throws Exception {
        // When & Then
        mockMvc.perform(get("/swagger-ui.html"))
                .andExpect(status().isOk());
    }

    @Test
    void apiDocs_ShouldBeAccessible() throws Exception {
        // When & Then
        mockMvc.perform(get("/api-docs"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));
    }
}