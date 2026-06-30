package com.neeshai.backend.admin;

import jakarta.persistence.*;
import java.time.ZonedDateTime;
import java.util.UUID;

@Entity
@Table(name = "coupon_codes")
public class CouponCode {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(nullable = false, unique = true, columnDefinition = "TEXT")
    private String code;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String name;

    @Column(name = "discount_percentage", nullable = false)
    private int discountPercentage;

    @Column(name = "expiry_date", columnDefinition = "TIMESTAMP WITH TIME ZONE")
    private ZonedDateTime expiryDate;

    @Column(name = "max_uses", nullable = false)
    private int maxUses;

    @Column(name = "used_count", nullable = false)
    private int usedCount = 0;

    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "created_at", columnDefinition = "TIMESTAMP WITH TIME ZONE")
    private ZonedDateTime createdAt;

    public CouponCode() {}

    public CouponCode(String code, String name, int discountPercentage, ZonedDateTime expiryDate, int maxUses) {
        this.code = code;
        this.name = name;
        this.discountPercentage = discountPercentage;
        this.expiryDate = expiryDate;
        this.maxUses = maxUses;
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) this.createdAt = ZonedDateTime.now();
        if (this.id == null) this.id = UUID.randomUUID();
    }

    public boolean isValid() {
        return active && usedCount < maxUses && (expiryDate == null || expiryDate.isAfter(ZonedDateTime.now()));
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public int getDiscountPercentage() { return discountPercentage; }
    public void setDiscountPercentage(int discountPercentage) { this.discountPercentage = discountPercentage; }
    public ZonedDateTime getExpiryDate() { return expiryDate; }
    public void setExpiryDate(ZonedDateTime expiryDate) { this.expiryDate = expiryDate; }
    public int getMaxUses() { return maxUses; }
    public void setMaxUses(int maxUses) { this.maxUses = maxUses; }
    public int getUsedCount() { return usedCount; }
    public void setUsedCount(int usedCount) { this.usedCount = usedCount; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public ZonedDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(ZonedDateTime createdAt) { this.createdAt = createdAt; }
}
