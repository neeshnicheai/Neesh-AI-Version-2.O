package com.neeshai.backend.admin;

import java.time.ZonedDateTime;
import java.util.List;
import java.util.UUID;

public class AdminDTOs {

    // --- Auth ---
    public record AdminLoginRequest(String username, String password) {}

    public record AdminLoginResponse(String token, String displayName) {}

    // --- Admin Role ---
    public record CreateRoleRequest(String username, String password, String displayName) {}

    public record AdminRoleDTO(UUID id, String username, String displayName, ZonedDateTime createdAt) {
        public static AdminRoleDTO fromEntity(AdminRole role) {
            return new AdminRoleDTO(role.getId(), role.getUsername(), role.getDisplayName(), role.getCreatedAt());
        }
    }

    // --- User Stats ---
    public record AdminUserDTO(
            UUID id,
            String email,
            String name,
            String status,
            String occupation,
            String phone,
            String location,
            String profileImageUrl,
            ZonedDateTime createdAt,
            ZonedDateTime updatedAt,
            long projectCount,
            String subscriptionPlan,
            long promotedBlogCount,
            List<String> promotionTags,
            ZonedDateTime subscriptionExpiresAt
    ) {}

    // --- Coupon ---
    public record CreateCouponRequest(String code, String name, int discountPercentage, ZonedDateTime expiryDate, int maxUses) {}

    public record CouponDTO(UUID id, String code, String name, int discountPercentage, ZonedDateTime expiryDate, int maxUses, int usedCount, boolean active, boolean valid, ZonedDateTime createdAt) {
        public static CouponDTO fromEntity(CouponCode coupon) {
            return new CouponDTO(
                    coupon.getId(), coupon.getCode(), coupon.getName(),
                    coupon.getDiscountPercentage(), coupon.getExpiryDate(),
                    coupon.getMaxUses(), coupon.getUsedCount(), coupon.isActive(),
                    coupon.isValid(), coupon.getCreatedAt()
            );
        }
    }

    public record ValidateCouponRequest(String code) {}

    public record ValidateCouponResponse(boolean valid, int discountPercentage, String message) {}
}
