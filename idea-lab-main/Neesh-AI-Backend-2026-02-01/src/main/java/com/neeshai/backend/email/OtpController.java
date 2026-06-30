package com.neeshai.backend.email;

import com.neeshai.backend.email.OtpService.OtpPurpose;
import com.neeshai.backend.email.OtpService.OtpResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Map;

@RestController
@RequestMapping("/api/public/otp")
public class OtpController {

    private static final Logger log = LoggerFactory.getLogger(OtpController.class);

    private final OtpService otpService;

    @Value("${supabase.url:}")
    private String supabaseUrl;

    @Value("${supabase.service.role.key:}")
    private String supabaseServiceRoleKey;

    public OtpController(OtpService otpService) {
        this.otpService = otpService;
    }

    // ─── DTOs ───

    public record SendOtpRequest(String email, String purpose) {}
    public record VerifyOtpRequest(String email, String otp, String purpose) {}
    public record ResetPasswordRequest(String email, String otp, String newPassword) {}
    public record OtpResponse(boolean success, String message) {}

    // ─── Endpoints ───

    /**
     * Send an OTP to the given email.
     * Purpose: "SIGNUP" or "FORGOT_PASSWORD"
     */
    @PostMapping("/send")
    public ResponseEntity<OtpResponse> sendOtp(@RequestBody SendOtpRequest request) {
        log.info("OTP send request for email: {}, purpose: {}", request.email(), request.purpose());

        if (request.email() == null || request.email().isBlank()) {
            return ResponseEntity.badRequest().body(new OtpResponse(false, "Email is required."));
        }

        OtpPurpose purpose;
        try {
            purpose = OtpPurpose.valueOf(request.purpose().toUpperCase());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new OtpResponse(false, "Invalid purpose. Use SIGNUP or FORGOT_PASSWORD."));
        }

        OtpResult result = otpService.generateAndSend(request.email(), purpose);
        if (result.isSuccess()) {
            return ResponseEntity.ok(new OtpResponse(true, result.getMessage()));
        } else {
            return ResponseEntity.badRequest().body(new OtpResponse(false, result.getMessage()));
        }
    }

    /**
     * Verify an OTP.
     */
    @PostMapping("/verify")
    public ResponseEntity<OtpResponse> verifyOtp(@RequestBody VerifyOtpRequest request) {
        log.info("OTP verify request for email: {}, purpose: {}", request.email(), request.purpose());

        if (request.email() == null || request.otp() == null) {
            return ResponseEntity.badRequest().body(new OtpResponse(false, "Email and OTP are required."));
        }

        OtpPurpose purpose;
        try {
            purpose = OtpPurpose.valueOf(request.purpose().toUpperCase());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new OtpResponse(false, "Invalid purpose."));
        }

        OtpResult result = otpService.verify(request.email(), request.otp(), purpose);
        return ResponseEntity.ok(new OtpResponse(result.isSuccess(), result.getMessage()));
    }

    /**
     * Reset password using OTP verification.
     * Verifies OTP, then calls Supabase Admin API to update the user's password.
     */
    @PostMapping("/reset-password")
    public ResponseEntity<OtpResponse> resetPassword(@RequestBody ResetPasswordRequest request) {
        log.info("Password reset request for email: {}", request.email());

        if (request.email() == null || request.otp() == null || request.newPassword() == null) {
            return ResponseEntity.badRequest()
                    .body(new OtpResponse(false, "Email, OTP, and new password are required."));
        }

        if (request.newPassword().length() < 8) {
            return ResponseEntity.badRequest()
                    .body(new OtpResponse(false, "Password must be at least 8 characters."));
        }

        // Verify OTP first (without consuming — we consume after password update)
        boolean verified = otpService.verifyWithoutConsuming(
                request.email(), request.otp(), OtpPurpose.FORGOT_PASSWORD);
        if (!verified) {
            return ResponseEntity.badRequest()
                    .body(new OtpResponse(false, "Invalid or expired OTP. Please request a new one."));
        }

        // Update password via Supabase Admin API
        try {
            updatePasswordViaSupabase(request.email(), request.newPassword());
            otpService.consume(request.email(), OtpPurpose.FORGOT_PASSWORD);
            return ResponseEntity.ok(new OtpResponse(true, "Password updated successfully."));
        } catch (Exception e) {
            log.error("Failed to update password for {}: {}", request.email(), e.getMessage());
            return ResponseEntity.internalServerError()
                    .body(new OtpResponse(false, "Failed to update password. Please try again."));
        }
    }

    /**
     * Uses Supabase Admin API to update a user's password by email.
     */
    private void updatePasswordViaSupabase(String email, String newPassword) throws Exception {
        if (supabaseUrl == null || supabaseUrl.isBlank() ||
            supabaseServiceRoleKey == null || supabaseServiceRoleKey.isBlank()) {
            throw new IllegalStateException("Supabase URL or service role key is not configured.");
        }

        // Step 1: Find user by email using Supabase Admin API
        HttpClient client = HttpClient.newHttpClient();

        // List users filtered by email
        String listUrl = supabaseUrl + "/auth/v1/admin/users?filter=" +
                java.net.URLEncoder.encode(email, "UTF-8");

        HttpRequest listRequest = HttpRequest.newBuilder()
                .uri(URI.create(listUrl))
                .header("Authorization", "Bearer " + supabaseServiceRoleKey)
                .header("apikey", supabaseServiceRoleKey)
                .GET()
                .build();

        HttpResponse<String> listResponse = client.send(listRequest, HttpResponse.BodyHandlers.ofString());
        log.debug("Supabase list users response: {}", listResponse.body());

        // Parse the user ID from the response
        String responseBody = listResponse.body();

        // Find user ID from the response — simple JSON parsing
        String userId = extractUserIdByEmail(responseBody, email);
        if (userId == null) {
            throw new RuntimeException("User not found with email: " + email);
        }

        // Step 2: Update password
        String updateUrl = supabaseUrl + "/auth/v1/admin/users/" + userId;
        String updateBody = "{\"password\":\"" + escapeJson(newPassword) + "\"}";

        HttpRequest updateRequest = HttpRequest.newBuilder()
                .uri(URI.create(updateUrl))
                .header("Authorization", "Bearer " + supabaseServiceRoleKey)
                .header("apikey", supabaseServiceRoleKey)
                .header("Content-Type", "application/json")
                .PUT(HttpRequest.BodyPublishers.ofString(updateBody))
                .build();

        HttpResponse<String> updateResponse = client.send(updateRequest, HttpResponse.BodyHandlers.ofString());

        if (updateResponse.statusCode() != 200) {
            log.error("Supabase password update failed: {} - {}", updateResponse.statusCode(), updateResponse.body());
            throw new RuntimeException("Failed to update password in Supabase.");
        }

        log.info("Password updated successfully for user: {}", email);
    }

    /**
     * Extract user ID from Supabase admin users list response by matching email.
     */
    private String extractUserIdByEmail(String jsonResponse, String email) {
        // Simple parsing — look for the email and extract the id
        // Response format: {"users":[{"id":"...","email":"..."},...]}
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            com.fasterxml.jackson.databind.JsonNode root = mapper.readTree(jsonResponse);
            com.fasterxml.jackson.databind.JsonNode users = root.has("users") ? root.get("users") : root;

            if (users.isArray()) {
                for (com.fasterxml.jackson.databind.JsonNode user : users) {
                    String userEmail = user.has("email") ? user.get("email").asText() : "";
                    if (email.equalsIgnoreCase(userEmail)) {
                        return user.get("id").asText();
                    }
                }
            }
        } catch (Exception e) {
            log.error("Failed to parse Supabase user list response: {}", e.getMessage());
        }
        return null;
    }

    private String escapeJson(String value) {
        return value.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
