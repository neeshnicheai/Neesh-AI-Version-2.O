package com.neeshai.backend.user;

import com.neeshai.backend.project.ProjectRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Propagation;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.time.ZonedDateTime;

@Service
public class UserService {

    private static final Logger log = LoggerFactory.getLogger(UserService.class);
    private static final int FREE_PROJECT_LIMIT = 5;
    private static final Set<String> PERMANENT_PRO_EMAILS = Set.of(
            "aabhishekg031@gmail.com"
    );

    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;

    public UserService(UserRepository userRepository, ProjectRepository projectRepository) {
        this.userRepository = userRepository;
        this.projectRepository = projectRepository;
    }

    /**
     * Idempotent sync of user from JWT claims.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void syncUser(UUID id, String email, String name) {
        try {
            userRepository.upsertUser(id, email, name);
            log.debug("User sync successful (upsert) for: {}", email);
        } catch (Exception e) {
            log.error("Error in syncUser: {}", e.getMessage(), e);
        }
    }

    @Transactional
    public Optional<UserDTO> getUser(UUID id) {
        return userRepository.findById(id).map(user -> {
            boolean isPermanentPro = user.getEmail() != null && PERMANENT_PRO_EMAILS.contains(user.getEmail().toLowerCase());
            if (isPermanentPro) {
                if (!"PRO".equalsIgnoreCase(user.getSubscriptionPlan())) {
                    user.setSubscriptionPlan("PRO");
                    user.setSubscriptionExpiresAt(null);
                    user = userRepository.save(user);
                }
            } else {
                checkAndDowngradeIfExpired(user);
            }
            return UserDTO.fromEntity(user);
        });
    }

    @Transactional
    public Optional<UserDTO> updateProfile(UUID userId, UpdateProfileRequest request) {
        return userRepository.findById(userId).map(user -> {
            if (request.name() != null) {
                user.setName(request.name());
            }
            if (request.occupation() != null) {
                user.setOccupation(request.occupation());
            }
            if (request.profileImageUrl() != null) {
                user.setProfileImageUrl(request.profileImageUrl());
            }
            if (request.bio() != null) {
                user.setBio(request.bio());
            }
            if (request.phone() != null) {
                user.setPhone(request.phone());
            }
            if (request.location() != null) {
                user.setLocation(request.location());
            }
            User saved = userRepository.save(user);
            log.info("Profile updated for user: {}", userId);
            return UserDTO.fromEntity(saved);
        });
    }

    /**
     * Get subscription info for a user.
     */
    public Map<String, Object> getSubscriptionInfo(UUID userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return Map.of("plan", "FREE", "projectCount", 0L, "maxProjects", FREE_PROJECT_LIMIT, "canCreateProject", true);
        }

        // Permanent Pro users always get PRO, skip expiry check
        boolean isPermanentPro = user.getEmail() != null && PERMANENT_PRO_EMAILS.contains(user.getEmail().toLowerCase());
        if (isPermanentPro) {
            // Ensure the DB always reflects PRO for this user
            if (!"PRO".equalsIgnoreCase(user.getSubscriptionPlan())) {
                user.setSubscriptionPlan("PRO");
                user.setSubscriptionExpiresAt(null);
                userRepository.save(user);
            }
        } else {
            // Auto-downgrade if subscription has expired
            checkAndDowngradeIfExpired(user);
        }

        String plan = user.getSubscriptionPlan() != null ? user.getSubscriptionPlan() : "FREE";
        long projectCount = projectRepository.findByOwnerId(userId).size();
        int maxProjects = "FREE".equalsIgnoreCase(plan) ? FREE_PROJECT_LIMIT : -1; // -1 = unlimited
        boolean canCreate = !"FREE".equalsIgnoreCase(plan) || projectCount < FREE_PROJECT_LIMIT;

        java.util.HashMap<String, Object> result = new java.util.HashMap<>();
        result.put("plan", plan);
        result.put("projectCount", projectCount);
        result.put("maxProjects", maxProjects);
        result.put("canCreateProject", canCreate);
        result.put("customLogoUrl", user.getCustomLogoUrl() != null ? user.getCustomLogoUrl() : "");
        result.put("customBrandingText", user.getCustomBrandingText() != null ? user.getCustomBrandingText() : "");
        result.put("subscriptionExpiresAt", user.getSubscriptionExpiresAt());
        return result;
    }

    /**
     * Upgrade user to Pro plan.
     * If the user row doesn't exist yet (new sign-up race condition), create a
     * minimal record first using the JWT claims so the upgrade never fails with "User not found".
     */
    @Transactional
    public UserDTO upgradeToPro(UUID userId, String email, String name) {
        User user = userRepository.findById(userId).orElseGet(() -> {
            log.warn("User {} not found during upgradeToPro — upserting from JWT claims", userId);
            String safeEmail = (email != null && !email.isBlank()) ? email : userId + "@unknown.invalid";
            userRepository.upsertUser(userId, safeEmail, name);
            return userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("User not found after upsert"));
        });
        user.setSubscriptionPlan("PRO");
        user.setSubscriptionExpiresAt(ZonedDateTime.now().plusDays(30));
        User saved = userRepository.save(user);
        log.info("User {} upgraded to PRO, expires at {}", userId, saved.getSubscriptionExpiresAt());
        return UserDTO.fromEntity(saved);
    }

    /**
     * Checks if a PRO user's subscription has expired and downgrades them to FREE if so.
     */
    @Transactional
    public void checkAndDowngradeIfExpired(User user) {
        // Never downgrade permanent Pro users
        if (user.getEmail() != null && PERMANENT_PRO_EMAILS.contains(user.getEmail().toLowerCase())) {
            return;
        }
        String plan = user.getSubscriptionPlan();
        if (plan != null && !"FREE".equalsIgnoreCase(plan) && user.getSubscriptionExpiresAt() != null) {
            if (ZonedDateTime.now().isAfter(user.getSubscriptionExpiresAt())) {
                log.info("Subscription expired for user {}. Downgrading to FREE.", user.getId());
                user.setSubscriptionPlan("FREE");
                user.setSubscriptionExpiresAt(null);
                userRepository.save(user);
            }
        }
    }

    /**
     * Update branding for Pro users (white-label).
     */
    @Transactional
    public UserDTO updateBranding(UUID userId, String customLogoUrl, String customBrandingText) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        String plan = user.getSubscriptionPlan();
        if (plan == null || "FREE".equalsIgnoreCase(plan)) {
            throw new IllegalArgumentException("Branding customization is only available for Pro users.");
        }

        if (customLogoUrl != null) {
            user.setCustomLogoUrl(customLogoUrl);
        }
        if (customBrandingText != null) {
            user.setCustomBrandingText(customBrandingText);
        }
        User saved = userRepository.save(user);
        log.info("Branding updated for user: {}", userId);
        return UserDTO.fromEntity(saved);
    }
}

