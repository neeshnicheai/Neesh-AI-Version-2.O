package com.neeshai.backend.kb;

import jakarta.persistence.*;
import java.time.ZonedDateTime;
import java.util.UUID;

@Entity
@Table(name = "documents")
public class Document {

    @Id
    private UUID id;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "document_group_id", nullable = false)
    private UUID documentGroupId;

    @Column(name = "uploaded_by", nullable = false)
    private UUID uploadedBy;

    @Column(name = "original_filename", nullable = false, columnDefinition = "TEXT")
    private String originalFilename;

    @Column(name = "storage_path", nullable = false, columnDefinition = "TEXT")
    private String storagePath;

    @Column(name = "mime_type", nullable = false, columnDefinition = "TEXT")
    private String mimeType;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(nullable = false)
    private int version;

    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    @Column(name = "created_at", columnDefinition = "TIMESTAMP WITH TIME ZONE")
    private ZonedDateTime createdAt;

    @Column(name = "updated_at", columnDefinition = "TIMESTAMP WITH TIME ZONE")
    private ZonedDateTime updatedAt;

    public Document() {
    }

    public Document(UUID id, UUID projectId, UUID documentGroupId, UUID uploadedBy, String originalFilename,
            String storagePath, String mimeType, String content, int version) {
        this.id = id;
        this.projectId = projectId;
        this.documentGroupId = documentGroupId;
        this.uploadedBy = uploadedBy;
        this.originalFilename = originalFilename;
        this.storagePath = storagePath;
        this.mimeType = mimeType;
        this.content = content;
        this.version = version;
        this.isActive = true;
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null)
            this.createdAt = ZonedDateTime.now();
        if (this.updatedAt == null)
            this.updatedAt = ZonedDateTime.now();
        if (this.id == null)
            this.id = UUID.randomUUID();
        if (this.documentGroupId == null)
            this.documentGroupId = UUID.randomUUID(); // Fallback
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = ZonedDateTime.now();
    }

    // Getters
    public UUID getId() {
        return id;
    }

    public UUID getProjectId() {
        return projectId;
    }

    public UUID getDocumentGroupId() {
        return documentGroupId;
    }

    public UUID getUploadedBy() {
        return uploadedBy;
    }

    public String getOriginalFilename() {
        return originalFilename;
    }

    public String getStoragePath() {
        return storagePath;
    }

    public String getMimeType() {
        return mimeType;
    }

    public String getContent() {
        return content;
    }

    public int getVersion() {
        return version;
    }

    public boolean isActive() {
        return isActive;
    }

    public ZonedDateTime getCreatedAt() {
        return createdAt;
    }

    public ZonedDateTime getUpdatedAt() {
        return updatedAt;
    }

    // Setters
    public void setId(UUID id) {
        this.id = id;
    }

    public void setProjectId(UUID projectId) {
        this.projectId = projectId;
    }

    public void setDocumentGroupId(UUID documentGroupId) {
        this.documentGroupId = documentGroupId;
    }

    public void setUploadedBy(UUID uploadedBy) {
        this.uploadedBy = uploadedBy;
    }

    public void setOriginalFilename(String originalFilename) {
        this.originalFilename = originalFilename;
    }

    public void setStoragePath(String storagePath) {
        this.storagePath = storagePath;
    }

    public void setMimeType(String mimeType) {
        this.mimeType = mimeType;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public void setVersion(int version) {
        this.version = version;
    }

    public void setActive(boolean active) {
        isActive = active;
    }

    public void setCreatedAt(ZonedDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public void setUpdatedAt(ZonedDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
