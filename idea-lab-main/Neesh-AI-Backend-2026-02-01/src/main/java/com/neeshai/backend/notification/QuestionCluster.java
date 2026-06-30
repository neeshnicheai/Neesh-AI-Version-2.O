package com.neeshai.backend.notification;

import com.neeshai.backend.project.Project;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "question_clusters")
public class QuestionCluster {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(name = "canonical_question", nullable = false, columnDefinition = "TEXT")
    private String canonicalQuestion;

    @Column(name = "normalized_question", nullable = false, columnDefinition = "TEXT")
    private String normalizedQuestion;

    @Column(nullable = false)
    private String status = "UNANSWERED"; // UNANSWERED, PARTIALLY_ANSWERED, ANSWERED, MONITORING, RESOLVED

    @Column(name = "total_ask_count")
    private int totalAskCount = 0;

    @Column(name = "persona_summary", columnDefinition = "TEXT")
    private String personaSummary; // JSON: {"developer":3,"marketer":2}

    @Column(name = "priority_score")
    private double priorityScore = 0.0;

    @Column(name = "first_asked_at")
    private Instant firstAskedAt;

    @Column(name = "last_asked_at")
    private Instant lastAskedAt;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @OneToMany(mappedBy = "cluster", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ClusterInstance> instances = new ArrayList<>();

    @OneToMany(mappedBy = "cluster", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ClusterReply> replies = new ArrayList<>();

    public QuestionCluster() {
    }

    public QuestionCluster(Project project, String canonicalQuestion, String normalizedQuestion) {
        this.project = project;
        this.canonicalQuestion = canonicalQuestion;
        this.normalizedQuestion = normalizedQuestion;
        this.status = "UNANSWERED";
        this.totalAskCount = 0;
    }

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        if (createdAt == null)
            createdAt = now;
        if (updatedAt == null)
            updatedAt = now;
        if (firstAskedAt == null)
            firstAskedAt = now;
        if (lastAskedAt == null)
            lastAskedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
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

    public String getCanonicalQuestion() {
        return canonicalQuestion;
    }

    public void setCanonicalQuestion(String canonicalQuestion) {
        this.canonicalQuestion = canonicalQuestion;
    }

    public String getNormalizedQuestion() {
        return normalizedQuestion;
    }

    public void setNormalizedQuestion(String normalizedQuestion) {
        this.normalizedQuestion = normalizedQuestion;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public int getTotalAskCount() {
        return totalAskCount;
    }

    public void setTotalAskCount(int totalAskCount) {
        this.totalAskCount = totalAskCount;
    }

    public String getPersonaSummary() {
        return personaSummary;
    }

    public void setPersonaSummary(String personaSummary) {
        this.personaSummary = personaSummary;
    }

    public double getPriorityScore() {
        return priorityScore;
    }

    public void setPriorityScore(double priorityScore) {
        this.priorityScore = priorityScore;
    }

    public Instant getFirstAskedAt() {
        return firstAskedAt;
    }

    public void setFirstAskedAt(Instant firstAskedAt) {
        this.firstAskedAt = firstAskedAt;
    }

    public Instant getLastAskedAt() {
        return lastAskedAt;
    }

    public void setLastAskedAt(Instant lastAskedAt) {
        this.lastAskedAt = lastAskedAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public List<ClusterInstance> getInstances() {
        return instances;
    }

    public void setInstances(List<ClusterInstance> instances) {
        this.instances = instances;
    }

    public List<ClusterReply> getReplies() {
        return replies;
    }

    public void setReplies(List<ClusterReply> replies) {
        this.replies = replies;
    }
}
