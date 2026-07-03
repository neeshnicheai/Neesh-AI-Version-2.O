package com.neeshai.backend.project;

import jakarta.persistence.*;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

import java.time.ZonedDateTime;
import java.util.UUID;

@Entity
@Table(name = "projects")
@SQLDelete(sql = "UPDATE projects SET deleted = true WHERE id = ?")
// @Where(clause = "deleted = false") // IMPORTANT: This filters globally for
// JPA queries
// Note: In newer Hibernate versions @Where is deprecated in favor of
// @SQLRestriction,
// using @Where for compatibility widely supported in Spring Boot 3.2.x
// (Hibernate 6.x) too, but @SQLRestriction is preferred.
// Let's use @SQLRestriction to be modern/safe.
@org.hibernate.annotations.SQLRestriction("deleted = false OR deleted IS NULL")
public class Project {

    @Id
    private UUID id;

    @Column(name = "owner_id", nullable = false)
    private UUID ownerId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String title;

    @Column(nullable = false, unique = true, columnDefinition = "TEXT")
    private String slug;

    @Column(name = "one_line_summary", columnDefinition = "TEXT")
    private String oneLineSummary;

    @Column(columnDefinition = "TEXT")
    private String introduction;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String status;

    @Column(nullable = false)
    private boolean deleted = false;

    @Column(name = "created_at", columnDefinition = "TIMESTAMP WITH TIME ZONE")
    private ZonedDateTime createdAt;

    @Column(name = "updated_at", columnDefinition = "TIMESTAMP WITH TIME ZONE")
    private ZonedDateTime updatedAt;

    @Column(columnDefinition = "TEXT")
    private String industry;

    @Column(name = "startup_stage", columnDefinition = "TEXT")
    private String startupStage;

    @Column(name = "validation_answers", columnDefinition = "TEXT")
    private String validationAnswers;

    @Column(name = "validation_report", columnDefinition = "TEXT")
    private String validationReport;

    @Column(name = "onboarding_completed")
    private Boolean onboardingCompleted = false;

    public Project() {
    }

    public Project(UUID id, UUID ownerId, String title, String slug) {
        this.id = id;
        this.ownerId = ownerId;
        this.title = title;
        this.slug = slug;
        this.status = "DRAFT";
        this.deleted = false;
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null)
            this.createdAt = ZonedDateTime.now();
        if (this.updatedAt == null)
            this.updatedAt = ZonedDateTime.now();
        if (this.status == null)
            this.status = "DRAFT";
        if (this.id == null)
            this.id = UUID.randomUUID();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = ZonedDateTime.now();
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getOwnerId() {
        return ownerId;
    }

    public void setOwnerId(UUID ownerId) {
        this.ownerId = ownerId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getSlug() {
        return slug;
    }

    public void setSlug(String slug) {
        this.slug = slug;
    }

    public String getOneLineSummary() {
        return oneLineSummary;
    }

    public void setOneLineSummary(String oneLineSummary) {
        this.oneLineSummary = oneLineSummary;
    }

    public String getIntroduction() {
        return introduction;
    }

    public void setIntroduction(String introduction) {
        this.introduction = introduction;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public boolean isDeleted() {
        return deleted;
    }

    public void setDeleted(boolean deleted) {
        this.deleted = deleted;
    }

    public ZonedDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(ZonedDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public ZonedDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(ZonedDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public String getIndustry() {
        return industry;
    }

    public void setIndustry(String industry) {
        this.industry = industry;
    }

    public String getStartupStage() {
        return startupStage;
    }

    public void setStartupStage(String startupStage) {
        this.startupStage = startupStage;
    }

    public String getValidationAnswers() {
        return validationAnswers;
    }

    public void setValidationAnswers(String validationAnswers) {
        this.validationAnswers = validationAnswers;
    }

    public String getValidationReport() {
        return validationReport;
    }

    public void setValidationReport(String validationReport) {
        this.validationReport = validationReport;
    }

    public Boolean getOnboardingCompleted() {
        return onboardingCompleted;
    }

    public void setOnboardingCompleted(Boolean onboardingCompleted) {
        this.onboardingCompleted = onboardingCompleted;
    }
}
