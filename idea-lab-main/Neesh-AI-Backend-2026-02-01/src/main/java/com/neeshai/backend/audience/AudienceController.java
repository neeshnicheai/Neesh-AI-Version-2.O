package com.neeshai.backend.audience;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api")
public class AudienceController {

    private final AudienceService audienceService;

    public AudienceController(AudienceService audienceService) {
        this.audienceService = audienceService;
    }

    private UUID getUserIdFromJwt(Jwt jwt) {
        return UUID.fromString(jwt.getSubject());
    }

    /**
     * GET /api/projects/{projectId}/audience
     * List all audience members for a project.
     */
    @GetMapping("/projects/{projectId}/audience")
    public ResponseEntity<AudienceDTOs.AudienceMemberListResponse> getAudienceMembers(
            @PathVariable UUID projectId,
            @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(audienceService.getAudienceMembers(projectId));
    }

    /**
     * GET /api/audience/{memberId}
     * Get detailed audience member profile with questions.
     */
    @GetMapping("/audience/{memberId}")
    public ResponseEntity<AudienceDTOs.AudienceMemberDetail> getMemberDetail(
            @PathVariable UUID memberId,
            @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(audienceService.getMemberDetail(memberId));
    }

    /**
     * PUT /api/audience/questions/{questionId}/answer
     * Answer a question (Reply & Notify).
     */
    @PutMapping("/audience/questions/{questionId}/answer")
    public ResponseEntity<AudienceDTOs.AnswerQuestionResponse> answerQuestion(
            @PathVariable UUID questionId,
            @RequestBody AudienceDTOs.AnswerQuestionRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        UUID adminId = getUserIdFromJwt(jwt);
        return ResponseEntity.ok(audienceService.answerQuestion(questionId, request.answer(), adminId));
    }
}
