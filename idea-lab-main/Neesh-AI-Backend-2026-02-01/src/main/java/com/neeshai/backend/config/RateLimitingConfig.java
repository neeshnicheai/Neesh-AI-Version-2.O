package com.neeshai.backend.config;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.servlet.HandlerInterceptor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Duration;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Rate limiting configuration to protect public endpoints
 *
 * Implements token bucket algorithm using Bucket4j
 * Limits requests per IP address to prevent abuse
 */
@Configuration
public class RateLimitingConfig implements WebMvcConfigurer {

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new RateLimitInterceptor())
                .addPathPatterns("/api/public/**");
    }

    public static class RateLimitInterceptor implements HandlerInterceptor {
        private static final Logger log = LoggerFactory.getLogger(RateLimitInterceptor.class);

        // Different rate limits for different endpoint types
        private static final int CHAT_REQUESTS_PER_MINUTE = 10;
        private static final int GENERAL_REQUESTS_PER_MINUTE = 30;

        // Store buckets per IP address
        private final ConcurrentHashMap<String, Bucket> buckets = new ConcurrentHashMap<>();

        @Override
        public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
            String clientIp = getClientIpAddress(request);
            String path = request.getRequestURI();

            // Determine rate limit based on endpoint type
            int requestsPerMinute = isChatEndpoint(path) ? CHAT_REQUESTS_PER_MINUTE : GENERAL_REQUESTS_PER_MINUTE;

            // Get or create bucket for this IP
            Bucket bucket = buckets.computeIfAbsent(clientIp, ip -> createNewBucket(requestsPerMinute));

            if (bucket.tryConsume(1)) {
                // Request allowed
                log.debug("Rate limit OK for IP {} on path {}", clientIp, path);
                return true;
            } else {
                // Rate limit exceeded
                log.warn("Rate limit exceeded for IP {} on path {} (limit: {} req/min)",
                        clientIp, path, requestsPerMinute);

                response.setStatus(429);
                response.setContentType("application/json");
                response.getWriter().write("{\"error\": \"Rate limit exceeded. Please try again later.\", \"retryAfter\": 60}");
                return false;
            }
        }

        private Bucket createNewBucket(int requestsPerMinute) {
            // Create bucket with capacity = requests per minute
            // Refill at rate of requests per minute over 60 seconds
            Bandwidth limit = Bandwidth.classic(requestsPerMinute, Refill.intervally(requestsPerMinute, Duration.ofMinutes(1)));
            return Bucket.builder()
                    .addLimit(limit)
                    .build();
        }

        private boolean isChatEndpoint(String path) {
            return path.contains("/chat") || path.contains("/questions");
        }

        private String getClientIpAddress(HttpServletRequest request) {
            // Check for IP from various headers (for proxy/load balancer scenarios)
            String xForwardedFor = request.getHeader("X-Forwarded-For");
            if (xForwardedFor != null && !xForwardedFor.isEmpty() && !"unknown".equalsIgnoreCase(xForwardedFor)) {
                return xForwardedFor.split(",")[0].trim();
            }

            String xRealIp = request.getHeader("X-Real-IP");
            if (xRealIp != null && !xRealIp.isEmpty() && !"unknown".equalsIgnoreCase(xRealIp)) {
                return xRealIp;
            }

            return request.getRemoteAddr();
        }
    }
}