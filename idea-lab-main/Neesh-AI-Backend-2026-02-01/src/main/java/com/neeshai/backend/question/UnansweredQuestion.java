package com.neeshai.backend.question;

import com.neeshai.backend.project.Project;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "unanswered_questions")
public class UnansweredQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(nullable = false, length = 1000)
    private String question;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "is_resolved")
    private boolean isResolved = false;

    // Optional: context or visitor info if needed later

    public UnansweredQuestion() {
    }

    public UnansweredQuestion(Project project, String question) {
        this.project = project;
        this.question = question;
        this.isResolved = false;
    }

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
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

    public String getQuestion() {
        return question;
    }

    public void setQuestion(String question) {
        this.question = question;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public boolean isResolved() {
        return isResolved;
    }

    public void setResolved(boolean resolved) {
        isResolved = resolved;
    }
}
