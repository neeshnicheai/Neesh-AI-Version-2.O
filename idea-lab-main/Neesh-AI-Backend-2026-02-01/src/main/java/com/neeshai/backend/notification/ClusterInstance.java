package com.neeshai.backend.notification;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "cluster_instances")
public class ClusterInstance {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cluster_id", nullable = false)
    private QuestionCluster cluster;

    @Column(name = "audience_member_id")
    private UUID audienceMemberId; // nullable for anonymous chatbot users

    @Column(name = "original_question", nullable = false, columnDefinition = "TEXT")
    private String originalQuestion;

    @Column(nullable = false)
    private String source = "CHATBOT"; // CHATBOT or FORM

    @Column(name = "user_name")
    private String userName;

    @Column(name = "user_email")
    private String userEmail;

    @Column(name = "user_persona")
    private String userPersona;

    @Column(nullable = false)
    private String status = "UNANSWERED"; // UNANSWERED or ANSWERED

    @Column(name = "asked_at")
    private Instant askedAt;

    @Column(name = "answered_at")
    private Instant answeredAt;

    @Column(name = "answer_content", columnDefinition = "TEXT")
    private String answerContent;

    @Column(name = "answered_by")
    private UUID answeredBy;

    public ClusterInstance() {
    }

    public ClusterInstance(QuestionCluster cluster, String originalQuestion, String source,
            String userName, String userEmail, String userPersona) {
        this.cluster = cluster;
        this.originalQuestion = originalQuestion;
        this.source = source != null ? source : "CHATBOT";
        this.userName = userName;
        this.userEmail = userEmail;
        this.userPersona = userPersona;
        this.status = "UNANSWERED";
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

    public QuestionCluster getCluster() {
        return cluster;
    }

    public void setCluster(QuestionCluster cluster) {
        this.cluster = cluster;
    }

    public UUID getAudienceMemberId() {
        return audienceMemberId;
    }

    public void setAudienceMemberId(UUID audienceMemberId) {
        this.audienceMemberId = audienceMemberId;
    }

    public String getOriginalQuestion() {
        return originalQuestion;
    }

    public void setOriginalQuestion(String originalQuestion) {
        this.originalQuestion = originalQuestion;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getUserEmail() {
        return userEmail;
    }

    public void setUserEmail(String userEmail) {
        this.userEmail = userEmail;
    }

    public String getUserPersona() {
        return userPersona;
    }

    public void setUserPersona(String userPersona) {
        this.userPersona = userPersona;
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

    public String getAnswerContent() {
        return answerContent;
    }

    public void setAnswerContent(String answerContent) {
        this.answerContent = answerContent;
    }

    public UUID getAnsweredBy() {
        return answeredBy;
    }

    public void setAnsweredBy(UUID answeredBy) {
        this.answeredBy = answeredBy;
    }
}
