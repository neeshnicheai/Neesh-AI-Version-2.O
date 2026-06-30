package com.neeshai.backend.audience;

import com.neeshai.backend.project.Project;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "audience_members")
public class AudienceMember {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String email;

    @Column
    private String occupation;

    @Column(name = "persona_type")
    private String personaType; // developer, marketer, investor, designer, entrepreneur, researcher, other

    @Column(name = "confidence_score")
    private Double confidenceScore;

    @Column(name = "engagement_score")
    private Double engagementScore;

    @Column(name = "feedback_text", columnDefinition = "TEXT")
    private String feedbackText;

    @Column(name = "feedback_source")
    private String feedbackSource; // Blog, Form, Chatbot

    @Column(name = "feedback_submitted_at")
    private Instant feedbackSubmittedAt;

    @Column(name = "first_interaction_at")
    private Instant firstInteractionAt;

    @Column(name = "last_interaction_at")
    private Instant lastInteractionAt;

    @OneToMany(mappedBy = "audienceMember", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<AudienceQuestion> questions = new ArrayList<>();

    public AudienceMember() {
    }

    public AudienceMember(Project project, String name, String email) {
        this.project = project;
        this.name = name;
        this.email = email;
    }

    @PrePersist
    protected void onCreate() {
        if (firstInteractionAt == null)
            firstInteractionAt = Instant.now();
        if (lastInteractionAt == null)
            lastInteractionAt = Instant.now();
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public Project getProject() {
        return project;
    }

    public void setProject(Project project) {
        this.project = project;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getOccupation() {
        return occupation;
    }

    public void setOccupation(String occupation) {
        this.occupation = occupation;
    }

    public String getPersonaType() {
        return personaType;
    }

    public void setPersonaType(String personaType) {
        this.personaType = personaType;
    }

    public Double getConfidenceScore() {
        return confidenceScore;
    }

    public void setConfidenceScore(Double confidenceScore) {
        this.confidenceScore = confidenceScore;
    }

    public Double getEngagementScore() {
        return engagementScore;
    }

    public void setEngagementScore(Double engagementScore) {
        this.engagementScore = engagementScore;
    }

    public String getFeedbackText() {
        return feedbackText;
    }

    public void setFeedbackText(String feedbackText) {
        this.feedbackText = feedbackText;
    }

    public String getFeedbackSource() {
        return feedbackSource;
    }

    public void setFeedbackSource(String feedbackSource) {
        this.feedbackSource = feedbackSource;
    }

    public Instant getFeedbackSubmittedAt() {
        return feedbackSubmittedAt;
    }

    public void setFeedbackSubmittedAt(Instant feedbackSubmittedAt) {
        this.feedbackSubmittedAt = feedbackSubmittedAt;
    }

    public Instant getFirstInteractionAt() {
        return firstInteractionAt;
    }

    public void setFirstInteractionAt(Instant firstInteractionAt) {
        this.firstInteractionAt = firstInteractionAt;
    }

    public Instant getLastInteractionAt() {
        return lastInteractionAt;
    }

    public void setLastInteractionAt(Instant lastInteractionAt) {
        this.lastInteractionAt = lastInteractionAt;
    }

    public List<AudienceQuestion> getQuestions() {
        return questions;
    }

    public void setQuestions(List<AudienceQuestion> questions) {
        this.questions = questions;
    }
}
