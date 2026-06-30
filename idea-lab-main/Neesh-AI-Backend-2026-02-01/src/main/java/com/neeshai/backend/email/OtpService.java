package com.neeshai.backend.email;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class OtpService {

    private static final Logger log = LoggerFactory.getLogger(OtpService.class);
    private static final int OTP_LENGTH = 6;
    private static final long OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
    private static final int MAX_RESEND_ATTEMPTS = 5;
    private static final long RESEND_COOLDOWN_MS = 60 * 1000; // 1 minute between resends

    private final SecureRandom secureRandom = new SecureRandom();
    private final ConcurrentHashMap<String, OtpEntry> otpStore = new ConcurrentHashMap<>();
    private final EmailService emailService;

    public OtpService(EmailService emailService) {
        this.emailService = emailService;
    }

    public enum OtpPurpose {
        SIGNUP, FORGOT_PASSWORD
    }

    /**
     * Generate and send a 6-digit OTP to the given email.
     * Returns true if OTP was sent successfully.
     */
    public OtpResult generateAndSend(String email, OtpPurpose purpose) {
        String key = buildKey(email, purpose);

        // Check cooldown — only if previous OTP was successfully sent
        OtpEntry existing = otpStore.get(key);
        if (existing != null) {
            long elapsed = System.currentTimeMillis() - existing.createdAt;
            if (elapsed < RESEND_COOLDOWN_MS) {
                long waitSeconds = (RESEND_COOLDOWN_MS - elapsed) / 1000;
                return OtpResult.error("Please wait " + waitSeconds + " seconds before requesting a new OTP.");
            }
            if (existing.attempts >= MAX_RESEND_ATTEMPTS) {
                return OtpResult.error("Too many OTP requests. Please try again later.");
            }
        }

        // Generate OTP
        String otp = generateOtp();
        int attempts = (existing != null) ? existing.attempts + 1 : 1;

        // Store OTP immediately so it's available for verification
        OtpEntry entry = new OtpEntry(otp, System.currentTimeMillis(), purpose, attempts, true);
        otpStore.put(key, entry);

        log.info("Generated OTP for {} (purpose: {}): {}", email, purpose, otp);

        // Attempt to send via email (best-effort)
        try {
            String subject = purpose == OtpPurpose.SIGNUP
                    ? "Neesh AI - Verify Your Email"
                    : "Neesh AI - Password Reset OTP";
            emailService.sendOtp(email, otp, subject);
            log.info("OTP email sent successfully to {}", email);
        } catch (Exception e) {
            log.warn("Could not send OTP email to {} (OTP is still valid and logged above): {}", email, e.getMessage());
        }

        return OtpResult.success("OTP sent to " + maskEmail(email));
    }

    /**
     * Verify a given OTP against the stored one.
     * Returns true if the OTP is correct and not expired.
     * On success, the OTP is removed from the store.
     */
    public OtpResult verify(String email, String otp, OtpPurpose purpose) {
        String key = buildKey(email, purpose);
        OtpEntry entry = otpStore.get(key);

        if (entry == null) {
            return OtpResult.error("No OTP found. Please request a new one.");
        }

        // Check expiry
        if (System.currentTimeMillis() - entry.createdAt > OTP_EXPIRY_MS) {
            otpStore.remove(key);
            return OtpResult.error("OTP has expired. Please request a new one.");
        }

        // Check purpose
        if (entry.purpose != purpose) {
            return OtpResult.error("Invalid OTP for this operation.");
        }

        // Check value
        if (!entry.otp.equals(otp.trim())) {
            return OtpResult.error("Incorrect OTP. Please try again.");
        }

        // Success – remove OTP
        otpStore.remove(key);
        log.info("OTP verified successfully for {} (purpose: {})", email, purpose);
        return OtpResult.success("OTP verified successfully.");
    }

    /**
     * Verify OTP without removing it (for reset-password flow where we verify then act).
     */
    public boolean verifyWithoutConsuming(String email, String otp, OtpPurpose purpose) {
        String key = buildKey(email, purpose);
        OtpEntry entry = otpStore.get(key);

        if (entry == null) return false;
        if (System.currentTimeMillis() - entry.createdAt > OTP_EXPIRY_MS) return false;
        if (entry.purpose != purpose) return false;
        return entry.otp.equals(otp.trim());
    }

    /**
     * Consume (remove) a verified OTP.
     */
    public void consume(String email, OtpPurpose purpose) {
        otpStore.remove(buildKey(email, purpose));
    }

    private String generateOtp() {
        int otp = secureRandom.nextInt(900000) + 100000; // 100000–999999
        return String.valueOf(otp);
    }

    private String buildKey(String email, OtpPurpose purpose) {
        return email.toLowerCase().trim() + ":" + purpose.name();
    }

    private String maskEmail(String email) {
        int at = email.indexOf('@');
        if (at <= 2) return email;
        return email.substring(0, 2) + "***" + email.substring(at);
    }

    // ──── Inner classes ────

    private static class OtpEntry {
        final String otp;
        final long createdAt;
        final OtpPurpose purpose;
        final int attempts;
        final boolean emailSent;

        OtpEntry(String otp, long createdAt, OtpPurpose purpose, int attempts, boolean emailSent) {
            this.otp = otp;
            this.createdAt = createdAt;
            this.purpose = purpose;
            this.attempts = attempts;
            this.emailSent = emailSent;
        }
    }

    public static class OtpResult {
        private final boolean success;
        private final String message;

        private OtpResult(boolean success, String message) {
            this.success = success;
            this.message = message;
        }

        public static OtpResult success(String message) { return new OtpResult(true, message); }
        public static OtpResult error(String message)   { return new OtpResult(false, message); }

        public boolean isSuccess() { return success; }
        public String getMessage() { return message; }
    }
}
