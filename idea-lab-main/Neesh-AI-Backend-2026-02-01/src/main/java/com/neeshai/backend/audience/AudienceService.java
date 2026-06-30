package com.neeshai.backend.audience;

import com.neeshai.backend.email.EmailService;
import com.neeshai.backend.project.ProjectRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class AudienceService {

    private static final Logger log = LoggerFactory.getLogger(AudienceService.class);

    private final AudienceMemberRepository memberRepository;
    private final AudienceQuestionRepository questionRepository;
    private final ProjectRepository projectRepository;
    private final EmailService emailService;

    public AudienceService(AudienceMemberRepository memberRepository,
            AudienceQuestionRepository questionRepository,
            ProjectRepository projectRepository,
            EmailService emailService) {
        this.memberRepository = memberRepository;
        this.questionRepository = questionRepository;
        this.projectRepository = projectRepository;
        this.emailService = emailService;
    }

    /**
     * List all audience members for a project.
     */
    @Transactional(readOnly = true)
    public AudienceDTOs.AudienceMemberListResponse getAudienceMembers(UUID projectId) {
        List<AudienceMember> members = memberRepository.findByProjectIdOrderByLastInteractionAtDesc(projectId);
        List<AudienceDTOs.AudienceMemberSummary> summaries = members.stream()
                .map(AudienceDTOs.AudienceMemberSummary::fromEntity)
                .toList();
        return new AudienceDTOs.AudienceMemberListResponse(summaries, summaries.size());
    }

    /**
     * Get detailed audience member info with all their questions.
     */
    public AudienceDTOs.AudienceMemberDetail getMemberDetail(UUID memberId) {
        AudienceMember member = memberRepository.findById(memberId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Audience member not found"));

        List<AudienceQuestion> questions = questionRepository.findByAudienceMemberIdOrderByAskedAtDesc(memberId);
        return AudienceDTOs.AudienceMemberDetail.fromEntity(member, questions);
    }

    /**
     * Answer a question (Reply & Notify flow).
     */
    @Transactional
    public AudienceDTOs.AnswerQuestionResponse answerQuestion(UUID questionId, String answerText, UUID adminId) {
        if (answerText == null || answerText.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Answer cannot be empty");
        }

        AudienceQuestion question = questionRepository.findById(questionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Question not found"));

        Instant now = Instant.now();

        question.setCustomAdminAnswer(answerText.trim());
        question.setStatus("answered");
        question.setRespondedAt(now);
        if (question.getAnsweredAt() == null) {
            question.setAnsweredAt(now);
        }

        questionRepository.save(question);

        // Update last interaction timestamp on the audience member
        AudienceMember member = question.getAudienceMember();
        member.setLastInteractionAt(now);
        memberRepository.save(member);

        // Email notification stub
        sendEmailNotification(member, question, answerText);

        log.info("Question {} answered by admin {} at {}", questionId, adminId, now);

        return new AudienceDTOs.AnswerQuestionResponse(questionId, "answered", now);
    }

    /**
     * Submit feedback from a public blog viewer (no auth required).
     */
    @Transactional
    public AudienceDTOs.PublicFeedbackResponse submitPublicFeedback(
            UUID projectId, AudienceDTOs.PublicFeedbackRequest request) {

        if (request.name() == null || request.name().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Name is required");
        }
        if (request.email() == null || request.email().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is required");
        }

        // Find the project
        com.neeshai.backend.project.Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found"));

        // Find existing member or create new one
        AudienceMember member = memberRepository
                .findByProjectIdAndEmail(projectId, request.email())
                .orElseGet(() -> {
                    AudienceMember newMember = new AudienceMember(project, request.name(), request.email());
                    return newMember;
                });

        // Update fields
        member.setName(request.name());
        if (request.occupation() != null && !request.occupation().isBlank()) {
            member.setOccupation(request.occupation());
        }
        if (request.feedbackText() != null && !request.feedbackText().isBlank()) {
            member.setFeedbackText(request.feedbackText());
        }
        member.setFeedbackSource("Blog");
        member.setFeedbackSubmittedAt(Instant.now());
        member.setLastInteractionAt(Instant.now());

        memberRepository.save(member);

        // Compute scores after feedback
        computeAndSetScores(member);
        memberRepository.save(member);

        log.info("Public feedback submitted for project {} by {}", projectId, request.email());

        return new AudienceDTOs.PublicFeedbackResponse(member.getId(), "Feedback submitted successfully!");
    }

    /**
     * Record a chatbot interaction as an audience question.
     */
    @Transactional
    public void recordChatInteraction(UUID projectId, AudienceDTOs.ChatInteractionRequest request) {
        if (request.query() == null || request.query().isBlank()) {
            return; // Nothing to save
        }

        String userName = (request.userName() != null && !request.userName().isBlank())
                ? request.userName()
                : "Anonymous";
        String userEmail = (request.userEmail() != null && !request.userEmail().isBlank())
                ? request.userEmail()
                : "anonymous-" + System.currentTimeMillis() + "@chatbot";

        // Find the project
        com.neeshai.backend.project.Project project = projectRepository.findById(projectId)
                .orElse(null);
        if (project == null) {
            log.warn("Cannot record chat interaction: project {} not found", projectId);
            return;
        }

        // Find or create audience member
        AudienceMember member = memberRepository
                .findByProjectIdAndEmail(projectId, userEmail)
                .orElseGet(() -> {
                    AudienceMember newMember = new AudienceMember(project, userName, userEmail);
                    return newMember;
                });

        member.setName(userName);
        member.setLastInteractionAt(Instant.now());
        memberRepository.save(member);

        // Create the question
        AudienceQuestion question = new AudienceQuestion(member, request.query().trim());
        if (request.answer() != null && !request.answer().isBlank()) {
            question.setChatbotAnswer(request.answer().trim());
            question.setStatus("answered");
            question.setAnsweredAt(Instant.now());
        } else {
            question.setStatus("unanswered");
        }
        questionRepository.save(question);

        // Recompute scores
        computeAndSetScores(member);
        memberRepository.save(member);

        log.info("Chat interaction recorded for project {} by {}", projectId, userEmail);
    }

    /**
     * Compute and set confidence + engagement scores on an audience member.
     *
     * confidenceScore (0.0–1.0): How confident we are in persona detection
     * - Has occupation: +0.3
     * - Has feedback: +0.3
     * - Has asked questions: +0.1 per question, max +0.4
     *
     * engagementScore (0–100): How engaged the user is
     * - Each question: +10 points
     * - Submitted feedback: +20 points
     * - Has occupation set: +10 points
     * - Capped at 100
     */
    private void computeAndSetScores(AudienceMember member) {
        long questionCount = questionRepository.findByAudienceMemberIdOrderByAskedAtDesc(member.getId()).size();

        // Confidence score
        double confidence = 0.0;
        if (member.getOccupation() != null && !member.getOccupation().isBlank()) {
            confidence += 0.3;
        }
        if (member.getFeedbackText() != null && !member.getFeedbackText().isBlank()) {
            confidence += 0.3;
        }
        confidence += Math.min(0.4, questionCount * 0.1);
        member.setConfidenceScore(Math.min(1.0, confidence));

        // Engagement score
        double engagement = 0.0;
        engagement += questionCount * 10;
        if (member.getFeedbackText() != null && !member.getFeedbackText().isBlank()) {
            engagement += 20;
        }
        if (member.getOccupation() != null && !member.getOccupation().isBlank()) {
            engagement += 10;
        }
        member.setEngagementScore(Math.min(100.0, engagement));
    }

    /**
     * Send email notification to audience member with the admin's reply.
     * Skips sending for anonymous/chatbot-generated email addresses.
     */
    private void sendEmailNotification(AudienceMember member, AudienceQuestion question, String answer) {
        String email = member.getEmail();

        // Skip anonymous chatbot users who never provided a real email
        if (email == null || email.isBlank() || email.contains("@chatbot")) {
            log.warn("Skipping reply email for user '{}' — no real email provided (email: {})",
                    member.getName(), email);
            return;
        }

        String projectName = member.getProject().getTitle();
        String subject = "Re: Your question about " + projectName;

        String htmlBody = """
            <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 24px; background: #ffffff;">
                <div style="text-align: center; margin-bottom: 32px;">
                    <h1 style="color: #1a1a2e; font-size: 24px; font-weight: 700; margin: 0;">Neesh AI</h1>
                    <p style="color: #666; font-size: 14px; margin: 4px 0 0;">Reply to your question</p>
                </div>

                <p style="color: #333; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
                    Hi <strong>%s</strong>,
                </p>

                <p style="color: #555; font-size: 14px; line-height: 1.6; margin-bottom: 16px;">
                    You asked a question on <strong>%s</strong>, and the project owner has replied:
                </p>

                <div style="background: #f8f9fa; border-left: 4px solid #667eea; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
                    <p style="color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px;">Your Question</p>
                    <p style="color: #333; font-size: 14px; line-height: 1.5; margin: 0;">%s</p>
                </div>

                <div style="background: linear-gradient(135deg, #667eea11, #764ba211); border-left: 4px solid #764ba2; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                    <p style="color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px;">Reply</p>
                    <p style="color: #333; font-size: 14px; line-height: 1.5; margin: 0;">%s</p>
                </div>

                <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
                <p style="color: #999; font-size: 12px; text-align: center;">
                    This email was sent by the <strong>%s</strong> team via Neesh AI.
                </p>
            </div>
            """.formatted(
                member.getName(),
                projectName,
                question.getQuestionText(),
                answer.replace("\n", "<br>"),
                projectName
            );

        try {
            emailService.sendReply(email, subject, htmlBody);
            log.info("Reply email sent to '{}' <{}> for project '{}'", member.getName(), email, projectName);
        } catch (Exception e) {
            log.error("Failed to send reply email to '{}' <{}>: {}", member.getName(), email, e.getMessage());
        }
    }
}

