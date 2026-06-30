package com.neeshai.backend.util;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * AES-256-GCM encryption utility for securely storing API keys.
 * The IV is prepended to the ciphertext and stored together as a Base64 string.
 */
public class EncryptionUtil {

    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int GCM_TAG_LENGTH = 128; // bits
    private static final int IV_LENGTH = 12; // bytes (recommended for GCM)

    /**
     * Encrypt plaintext using AES-256-GCM.
     * 
     * @param plainText the text to encrypt
     * @param base64Key a Base64-encoded 256-bit (32-byte) secret key
     * @return Base64-encoded string containing IV + ciphertext
     */
    public static String encrypt(String plainText, String base64Key) throws Exception {
        SecretKey key = decodeKey(base64Key);

        byte[] iv = new byte[IV_LENGTH];
        new SecureRandom().nextBytes(iv);

        Cipher cipher = Cipher.getInstance(ALGORITHM);
        GCMParameterSpec spec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
        cipher.init(Cipher.ENCRYPT_MODE, key, spec);

        byte[] cipherText = cipher.doFinal(plainText.getBytes("UTF-8"));

        // Prepend IV to ciphertext
        byte[] combined = new byte[IV_LENGTH + cipherText.length];
        System.arraycopy(iv, 0, combined, 0, IV_LENGTH);
        System.arraycopy(cipherText, 0, combined, IV_LENGTH, cipherText.length);

        return Base64.getEncoder().encodeToString(combined);
    }

    /**
     * Decrypt ciphertext that was encrypted with AES-256-GCM.
     * 
     * @param encryptedText Base64-encoded string containing IV + ciphertext
     * @param base64Key     a Base64-encoded 256-bit (32-byte) secret key
     * @return the original plaintext
     */
    public static String decrypt(String encryptedText, String base64Key) throws Exception {
        SecretKey key = decodeKey(base64Key);
        byte[] combined = Base64.getDecoder().decode(encryptedText);

        byte[] iv = new byte[IV_LENGTH];
        System.arraycopy(combined, 0, iv, 0, IV_LENGTH);

        byte[] cipherText = new byte[combined.length - IV_LENGTH];
        System.arraycopy(combined, IV_LENGTH, cipherText, 0, cipherText.length);

        Cipher cipher = Cipher.getInstance(ALGORITHM);
        GCMParameterSpec spec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
        cipher.init(Cipher.DECRYPT_MODE, key, spec);

        byte[] plainText = cipher.doFinal(cipherText);
        return new String(plainText, "UTF-8");
    }

    /**
     * Generate a random 256-bit key encoded as Base64.
     * Call this once to generate API_KEY_ENCRYPTION_SECRET for your .env file.
     */
    public static String generateKey() {
        byte[] keyBytes = new byte[32];
        new SecureRandom().nextBytes(keyBytes);
        return Base64.getEncoder().encodeToString(keyBytes);
    }

    private static SecretKey decodeKey(String base64Key) {
        byte[] keyBytes = Base64.getDecoder().decode(base64Key);
        if (keyBytes.length != 32) {
            throw new IllegalArgumentException("Encryption key must be 256 bits (32 bytes). Got: " + keyBytes.length);
        }
        return new SecretKeySpec(keyBytes, "AES");
    }
}
