package com.neeshai.backend.user;

import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public ResponseEntity<UserDTO> getCurrentUser(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        UUID userId = UUID.fromString(principal.getName());
        return userService.getUser(userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/me")
    public ResponseEntity<UserDTO> updateProfile(Principal principal,
            @RequestBody UpdateProfileRequest request) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        UUID userId = UUID.fromString(principal.getName());
        return userService.updateProfile(userId, request)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ─── Subscription Endpoints ───

    @GetMapping("/subscription")
    public ResponseEntity<Map<String, Object>> getSubscription(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        UUID userId = UUID.fromString(principal.getName());
        return ResponseEntity.ok(userService.getSubscriptionInfo(userId));
    }

    @PutMapping("/subscription/upgrade")
    public ResponseEntity<?> upgradeToPro(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        UUID userId = UUID.fromString(principal.getName());
        String email = null;
        String name = null;
        if (principal instanceof JwtAuthenticationToken jwtToken) {
            Jwt jwt = jwtToken.getToken();
            email = jwt.getClaimAsString("email");
            name = jwt.getClaimAsString("name");
            if (name == null && jwt.hasClaim("user_metadata")) {
                var metadata = jwt.getClaimAsMap("user_metadata");
                if (metadata != null) {
                    name = (String) metadata.getOrDefault("name", metadata.get("full_name"));
                }
            }
        }
        try {
            UserDTO updated = userService.upgradeToPro(userId, email, name);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/branding")
    public ResponseEntity<?> updateBranding(Principal principal,
            @RequestBody Map<String, String> request) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        UUID userId = UUID.fromString(principal.getName());
        try {
            UserDTO updated = userService.updateBranding(
                    userId,
                    request.get("customLogoUrl"),
                    request.get("customBrandingText"));
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
