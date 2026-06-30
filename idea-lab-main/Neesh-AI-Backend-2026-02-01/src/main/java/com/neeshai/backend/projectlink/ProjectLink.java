package com.neeshai.backend.projectlink;

import jakarta.persistence.*;
import java.time.ZonedDateTime;
import java.util.UUID;

@Entity
@Table(name = "project_links", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "source_project_id", "linked_project_id" })
})
public class ProjectLink {

    @Id
    private UUID id;

    @Column(name = "source_project_id", nullable = false)
    private UUID sourceProjectId;

    @Column(name = "linked_project_id", nullable = false)
    private UUID linkedProjectId;

    @Column(name = "link_type", nullable = false, columnDefinition = "TEXT")
    private String linkType; // RESEARCH, USECASE, SOLUTION

    @Column(name = "created_at", columnDefinition = "TIMESTAMP WITH TIME ZONE")
    private ZonedDateTime createdAt;

    public ProjectLink() {
    }

    public ProjectLink(UUID sourceProjectId, UUID linkedProjectId, String linkType) {
        this.sourceProjectId = sourceProjectId;
        this.linkedProjectId = linkedProjectId;
        this.linkType = linkType;
    }

    @PrePersist
    protected void onCreate() {
        if (this.id == null)
            this.id = UUID.randomUUID();
        if (this.createdAt == null)
            this.createdAt = ZonedDateTime.now();
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getSourceProjectId() {
        return sourceProjectId;
    }

    public void setSourceProjectId(UUID sourceProjectId) {
        this.sourceProjectId = sourceProjectId;
    }

    public UUID getLinkedProjectId() {
        return linkedProjectId;
    }

    public void setLinkedProjectId(UUID linkedProjectId) {
        this.linkedProjectId = linkedProjectId;
    }

    public String getLinkType() {
        return linkType;
    }

    public void setLinkType(String linkType) {
        this.linkType = linkType;
    }

    public ZonedDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(ZonedDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
