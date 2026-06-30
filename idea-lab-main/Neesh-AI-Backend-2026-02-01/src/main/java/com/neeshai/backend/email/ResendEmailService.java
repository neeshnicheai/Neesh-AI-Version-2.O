package com.neeshai.backend.email;

import com.resend.Resend;
import com.resend.services.emails.model.CreateEmailOptions;
import com.resend.services.emails.model.CreateEmailResponse;
import com.resend.core.exception.ResendException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class ResendEmailService implements EmailService {

    private static final Logger log = LoggerFactory.getLogger(ResendEmailService.class);

    private final String apiKey;
    private final String fromEmail;
    private final Resend resend;

    public ResendEmailService(@Value("${resend.api.key}") String apiKey,
            @Value("${resend.from.email:onboarding@resend.dev}") String fromEmail) {
        this.apiKey = apiKey;
        this.fromEmail = fromEmail;
        if (apiKey != null && !apiKey.isBlank()) {
            this.resend = new Resend(apiKey);
            log.info("ResendEmailService initialized with API key: {}...",
                    apiKey.substring(0, Math.min(4, apiKey.length())));
        } else {
            this.resend = null;
            log.warn("Resend API key not configured. Emails will NOT be sent.");
        }
    }

    @Override
    public void sendReply(String to, String subject, String body) {
        if (resend == null) {
            log.warn("Skipping email to '{}' because Resend API key is missing.", to);
            return;
        }

        try {
            CreateEmailOptions params = CreateEmailOptions.builder()
                    .from(fromEmail)
                    .to(to)
                    .subject(subject)
                    .html(body.replace("\n", "<br>")) // Simple HTML conversion
                    .build();

            CreateEmailResponse response = resend.emails().send(params);
            log.info("Email sent to '{}' (ID: {})", to, response.getId());
        } catch (ResendException e) {
            log.error("Failed to send email to '{}': {}", to, e.getMessage());
        } catch (Exception e) {
            log.error("Unexpected error sending email to '{}'", to, e);
        }
    }

    @Override
    public void sendOtp(String to, String otp, String subject) {
        if (resend == null) {
            log.warn("Skipping OTP email to '{}' because Resend API key is missing. OTP: {}", to, otp);
            return;
        }

        String htmlBody = """
            <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 24px; background: #ffffff;">
                <div style="text-align: center; margin-bottom: 32px;">
                    <h1 style="color: #1a1a2e; font-size: 24px; font-weight: 700; margin: 0;">Neesh AI</h1>
                </div>
                <div style="background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); border-radius: 16px; padding: 32px; text-align: center; margin-bottom: 24px;">
                    <p style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 0 0 16px;">Your verification code is</p>
                    <div style="background: rgba(255,255,255,0.2); border-radius: 12px; padding: 16px; display: inline-block; letter-spacing: 12px; font-size: 32px; font-weight: 700; color: #ffffff;">
                        %s
                    </div>
                </div>
                <p style="color: #666; font-size: 14px; line-height: 1.6; text-align: center;">
                    This code expires in <strong>10 minutes</strong>. Do not share it with anyone.
                </p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
                <p style="color: #999; font-size: 12px; text-align: center;">
                    If you didn't request this code, you can safely ignore this email.
                </p>
            </div>
            """.formatted(otp);

        try {
            CreateEmailOptions params = CreateEmailOptions.builder()
                    .from(fromEmail)
                    .to(to)
                    .subject(subject)
                    .html(htmlBody)
                    .build();

            CreateEmailResponse response = resend.emails().send(params);
            log.info("OTP email sent to '{}' (ID: {})", to, response.getId());
        } catch (ResendException e) {
            log.error("Failed to send OTP email to '{}': {}", to, e.getMessage());
            throw new RuntimeException("Failed to send OTP email", e);
        } catch (Exception e) {
            log.error("Unexpected error sending OTP email to '{}'", to, e);
            throw new RuntimeException("Failed to send OTP email", e);
        }
    }
}
