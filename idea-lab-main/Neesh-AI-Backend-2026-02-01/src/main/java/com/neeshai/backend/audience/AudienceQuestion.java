package com.neeshai.backend.audience;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "audience_questions")
public class AudienceQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "audience_id", nullable = false)
    private AudienceMember audienceMember;

    @Column(name = "question_text", nullable = false, columnDefinition = "TEXT")
    private String questionText;

    @Column(name = "chatbot_answer", columnDefinition = "TEXT")
    private String chatbotAnswer;

    @Column(name = "custom_admin_answer", columnDefinition = "TEXT")
    private String customAdminAnswer;

    @Column(nullable = false)
    private String status = "unanswered"; // "answered" or "unanswered"

    @Column(name = "asked_at")
    private Instant askedAt;

    @Column(name = "answered_at")
    private Instant answeredAt;

    @Column(name = "responded_at")
    private Instant respondedAt;

    public AudienceQuestion() {
    }

    public AudienceQuestion(AudienceMember audienceMember, String questionText) {
        this.audienceMember = audienceMember;
        this.questionText = questionText;
        this.status = "unanswered";
    }

    @PrePersist
    protected void onCreate() {
        if (askedAt == null)
            askedAt = Instant.now();
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public AudienceMember getAudienceMember() {
        return audienceMember;
    }

    public void setAudienceMember(AudienceMember audienceMember) {
        this.audienceMember = audienceMember;
    }

    public String getQuestionText() {
        return questionText;
    }

    public void setQuestionText(String questionText) {
        this.questionText = questionText;
    }

    public String getChatbotAnswer() {
        return chatbotAnswer;
    }

    public void setChatbotAnswer(String chatbotAnswer) {
        this.chatbotAnswer = chatbotAnswer;
    }

    public String getCustomAdminAnswer() {
        return customAdminAnswer;
    }

    public void setCustomAdminAnswer(String customAdminAnswer) {
        this.customAdminAnswer = customAdminAnswer;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Instant getAskedAt() {
        return askedAt;
    }

    public void setAskedAt(Instant askedAt) {
        this.askedAt = askedAt;
    }

    public Instant getAnsweredAt() {
        return answeredAt;
    }

    public void setAnsweredAt(Instant answeredAt) {
        this.answeredAt = answeredAt;
    }

    public Instant getRespondedAt() {
        return respondedAt;
    }

    public void setRespondedAt(Instant respondedAt) {
        this.respondedAt = respondedAt;
    }
}
