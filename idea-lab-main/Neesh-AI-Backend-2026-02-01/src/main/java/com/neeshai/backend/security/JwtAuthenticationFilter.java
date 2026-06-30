package com.neeshai.backend.security;

import com.neeshai.backend.user.UserService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.io.IOException;
import java.util.UUID;
import java.util.UUID;
import java.util.Map;

public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    private final String jwtSecret;
    private final UserService userService;

    public JwtAuthenticationFilter(UserService userService, String jwtSecret) {
        this.userService = userService;
        this.jwtSecret = jwtSecret;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        // Check if the user is authenticated by Spring Security's OAuth2 Resource
        // Server
        var authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication != null
                && authentication.getPrincipal() instanceof Jwt) {
            Jwt jwt = (Jwt) authentication
                    .getPrincipal();

            try {
                String userIdStr = jwt.getSubject();
                UUID userId = UUID.fromString(userIdStr);
                String email = jwt.getClaimAsString("email");

                // Check for name in claims or metadata
                String name = jwt.getClaimAsString("name");
                if (name == null && jwt.hasClaim("user_metadata")) {
                    var metadata = jwt.getClaimAsMap("user_metadata");
                    if (metadata != null) {
                        name = (String) metadata.getOrDefault("name", metadata.get("full_name"));
                    }
                }

                // Sync user to database
                userService.syncUser(userId, email, name);
                log.info("Successfully synced user from JWT: {} ({})", userId, email);

            } catch (Exception e) {
                // Log warning but don't fail the request, proceed as authenticated
                log.error("Failed to sync user from JWT: {}", e.getMessage(), e);
            }
        }

        filterChain.doFilter(request, response);
    }
}
