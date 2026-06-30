package com.neeshai.backend.user;

import java.time.ZonedDateTime;
import java.util.UUID;

public record UserDTO(
        UUID id,
        String email,
        String name,
        String status,
        String occupation,
        String profileImageUrl,
        String bio,
        String phone,
        String location,
        String subscriptionPlan,
        String customLogoUrl,
        String customBrandingText,
        ZonedDateTime createdAt,
        ZonedDateTime updatedAt,
        ZonedDateTime subscriptionExpiresAt) {
    public static UserDTO fromEntity(User user) {
        return new UserDTO(
                user.getId(),
                user.getEmail(),
                user.getName(),
                user.getStatus(),
                user.getOccupation(),
                user.getProfileImageUrl(),
                user.getBio(),
                user.getPhone(),
                user.getLocation(),
                user.getSubscriptionPlan() != null ? user.getSubscriptionPlan() : "FREE",
                user.getCustomLogoUrl(),
                user.getCustomBrandingText(),
                user.getCreatedAt(),
                user.getUpdatedAt(),
                user.getSubscriptionExpiresAt());
    }
}
