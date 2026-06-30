package com.neeshai.backend.promotion;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "promotion_tags")
public class PromotionTag {

    @Id
    private UUID id;

    @Column(name = "promotion_id", nullable = false)
    private UUID promotionId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String tag;

    public PromotionTag() {}

    public PromotionTag(UUID promotionId, String tag) {
        this.id = UUID.randomUUID();
        this.promotionId = promotionId;
        this.tag = tag.toLowerCase().trim();
    }

    @PrePersist
    protected void onCreate() {
        if (this.id == null) this.id = UUID.randomUUID();
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getPromotionId() { return promotionId; }
    public void setPromotionId(UUID promotionId) { this.promotionId = promotionId; }

    public String getTag() { return tag; }
    public void setTag(String tag) { this.tag = tag; }
}
