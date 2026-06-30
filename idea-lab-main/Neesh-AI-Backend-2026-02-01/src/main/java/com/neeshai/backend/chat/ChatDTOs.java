package com.neeshai.backend.chat;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Data Transfer Objects for Chat API endpoints
 */
public class ChatDTOs {

    /**
     * Request for chatting with a project
     */
    @Schema(description = "Chat request for a project")
    public record ChatRequest(
            @NotBlank(message = "Query is required and cannot be empty")
            @Size(min = 1, max = 2000, message = "Query must be between 1 and 2000 characters")
            @Schema(description = "The user's question or query",
                    example = "How do I get started with your API?",
                    maxLength = 2000)
            String query
    ) {}

    /**
     * Response from chat endpoint
     */
    @Schema(description = "Chat response from AI")
    public record ChatResponse(
            @Schema(description = "The AI-generated response", example = "To get started with our API, you need to...")
            String answer,

            @Schema(description = "Confidence level of the response", example = "HIGH")
            String confidence,

            @Schema(description = "Sources used to generate the response")
            java.util.List<String> sources,

            @Schema(description = "Unique identifier for this conversation", example = "conv-123")
            String conversationId
    ) {}

    /**
     * Error response for failed chat requests
     */
    @Schema(description = "Error response")
    public record ChatErrorResponse(
            @Schema(description = "Error message", example = "Invalid query provided")
            String error,

            @Schema(description = "HTTP status code", example = "400")
            int status,

            @Schema(description = "Timestamp of the error", example = "2026-05-14T12:00:00Z")
            String timestamp
    ) {}

    /**
     * Request for reporting chat quality feedback
     */
    @Schema(description = "Feedback on chat response quality")
    public record ChatFeedbackRequest(
            @NotBlank(message = "Feedback type is required")
            @Schema(description = "Type of feedback", allowableValues = {"POSITIVE", "NEGATIVE"})
            String feedbackType,

            @Size(max = 500, message = "Comment cannot exceed 500 characters")
            @Schema(description = "Optional comment about the response", maxLength = 500)
            String comment
    ) {}
}