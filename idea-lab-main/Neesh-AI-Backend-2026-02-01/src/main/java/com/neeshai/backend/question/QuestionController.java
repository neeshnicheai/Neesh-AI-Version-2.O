package com.neeshai.backend.question;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api")
public class QuestionController {

    private final QuestionService questionService;

    public QuestionController(QuestionService questionService) {
        this.questionService = questionService;
    }

    private UUID getUserIdFromJwt(Jwt jwt) {
        return UUID.fromString(jwt.getSubject());
    }

    // Get unanswered questions (Authenticated)
    @GetMapping("/projects/{projectId}/questions/unanswered")
    public ResponseEntity<QuestionDTOs.QuestionListResponse> getUnansweredQuestions(@PathVariable UUID projectId) {
        return ResponseEntity.ok(questionService.getUnansweredQuestions(projectId));
    }

    // Mark as resolved (Authenticated)
    @PutMapping("/questions/{questionId}/resolve")
    public ResponseEntity<Void> resolveQuestion(
            @PathVariable UUID questionId,
            @AuthenticationPrincipal Jwt jwt) {
        UUID userId = getUserIdFromJwt(jwt);
        questionService.markAsResolved(questionId, userId);
        return ResponseEntity.ok().build();
    }

    // Report unanswered question (Public - for Chatbot)
    @PostMapping("/public/projects/{projectId}/questions/report")
    public ResponseEntity<QuestionDTOs.QuestionResponse> reportQuestion(
            @PathVariable UUID projectId,
            @RequestBody QuestionDTOs.CreateQuestionRequest request) {
        return ResponseEntity.ok(questionService.reportUnansweredQuestion(
                projectId, request.question(), request.userName(),
                request.userEmail(), request.persona(), request.source()));
    }
}
