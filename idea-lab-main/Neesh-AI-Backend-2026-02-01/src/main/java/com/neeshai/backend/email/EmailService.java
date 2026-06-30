package com.neeshai.backend.email;

public interface EmailService {
    void sendReply(String to, String subject, String body);
    void sendOtp(String to, String otp, String subject);
}
