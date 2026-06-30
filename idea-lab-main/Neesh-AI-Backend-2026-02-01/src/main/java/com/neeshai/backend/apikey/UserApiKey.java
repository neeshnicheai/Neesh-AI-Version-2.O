package com.neeshai.backend.apikey;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Column;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.UniqueConstraint;
import java.time.ZonedDateTime;
import java.util.UUID;

@Entity
@Table(name = "user_api_keys", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "user_id", "provider" })
})
public class UserApiKey {

    @Id
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String provider; // OPENROUTER, OPENAI, CLAUDE, GEMINI

    @Column(name = "encrypted_api_key", nullable = false, columnDefinition = "TEXT")
    private String encryptedApiKey;

    @Column(name = "created_at", columnDefinition = "TIMESTAMP WITH TIME ZONE")
    private ZonedDateTime createdAt;

    @Column(name = "updated_at", columnDefinition = "TIMESTAMP WITH TIME ZONE")
    private ZonedDateTime updatedAt;

    public UserApiKey() {
    }

    public UserApiKey(UUID userId, String provider, String encryptedApiKey) {
        this.id = UUID.randomUUID();
        this.userId = userId;
        this.provider = provider;
        this.encryptedApiKey = encryptedApiKey;
    }

    @PrePersist
    protected void onCreate() {
        if (this.id == null)
            this.id = UUID.randomUUID();
        if (this.createdAt == null)
            this.createdAt = ZonedDateTime.now();
        if (this.updatedAt == null)
            this.updatedAt = ZonedDateTime.now();
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

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public String getProvider() {
        return provider;
    }

    public void setProvider(String provider) {
        this.provider = provider;
    }

    public String getEncryptedApiKey() {
        return encryptedApiKey;
    }

    public void setEncryptedApiKey(String encryptedApiKey) {
        this.encryptedApiKey = encryptedApiKey;
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
}
