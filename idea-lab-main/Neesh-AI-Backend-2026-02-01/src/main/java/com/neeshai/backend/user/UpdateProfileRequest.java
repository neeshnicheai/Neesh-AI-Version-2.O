package com.neeshai.backend.user;

public record UpdateProfileRequest(
        String name,
        String occupation,
        String profileImageUrl,
        String bio,
        String phone,
        String location) {
}
