package com.neeshai.backend.apikey;

import com.neeshai.backend.util.EncryptionUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class UserApiKeyService {

    private static final Logger logger = LoggerFactory.getLogger(UserApiKeyService.class);

    private final UserApiKeyRepository repository;

    @Value("${api.key.encryption.secret}")
    private String encryptionSecret;

    public UserApiKeyService(UserApiKeyRepository repository) {
        this.repository = repository;
    }

    /**
     * Save or update an API key for a user + provider combination.
     */
    @Transactional
    public void saveApiKey(UUID userId, String provider, String rawApiKey) {
        provider = provider.toUpperCase();

        try {
            String encrypted = EncryptionUtil.encrypt(rawApiKey, encryptionSecret);

            Optional<UserApiKey> existing = repository.findByUserIdAndProvider(userId, provider);
            if (existing.isPresent()) {
                UserApiKey key = existing.get();
                key.setEncryptedApiKey(encrypted);
                repository.save(key);
                logger.info("Updated API key for user {} provider {}", userId, provider);
            } else {
                UserApiKey key = new UserApiKey(userId, provider, encrypted);
                repository.save(key);
                logger.info("Saved new API key for user {} provider {}", userId, provider);
            }
        } catch (Exception e) {
            logger.error("Failed to encrypt/save API key for user {}: {}", userId, e.getMessage());
            throw new RuntimeException("Failed to save API key", e);
        }
    }

    /**
     * Get decrypted API key for a specific provider.
     */
    public String getDecryptedApiKey(UUID userId, String provider) {
        provider = provider.toUpperCase();
        Optional<UserApiKey> apiKey = repository.findByUserIdAndProvider(userId, provider);
        if (apiKey.isEmpty()) {
            return null;
        }
        try {
            return EncryptionUtil.decrypt(apiKey.get().getEncryptedApiKey(), encryptionSecret);
        } catch (Exception e) {
            logger.error("Failed to decrypt API key for user {} provider {}: {}", userId, provider, e.getMessage());
            throw new RuntimeException("Failed to decrypt API key", e);
        }
    }

    /**
     * Get the user's active provider configuration (first found).
     * Returns a Map with "provider" and "apiKey" (decrypted), or null if none.
     */
    public Map<String, String> getActiveConfig(UUID userId) {
        List<UserApiKey> keys = repository.findByUserId(userId);
        if (keys.isEmpty()) {
            return null;
        }
        // Return the most recently updated key
        UserApiKey latest = keys.stream()
                .max(Comparator.comparing(k -> k.getUpdatedAt() != null ? k.getUpdatedAt() : k.getCreatedAt()))
                .orElse(keys.get(0));

        try {
            String decrypted = EncryptionUtil.decrypt(latest.getEncryptedApiKey(), encryptionSecret);
            Map<String, String> config = new HashMap<>();
            config.put("provider", latest.getProvider());
            config.put("apiKey", decrypted);
            return config;
        } catch (Exception e) {
            logger.error("Failed to decrypt active API key for user {}: {}", userId, e.getMessage());
            return null;
        }
    }

    /**
     * Get list of saved providers for a user (no keys returned).
     */
    public List<Map<String, String>> getSavedProviders(UUID userId) {
        List<UserApiKey> keys = repository.findByUserId(userId);
        List<Map<String, String>> result = new ArrayList<>();
        for (UserApiKey key : keys) {
            Map<String, String> entry = new HashMap<>();
            entry.put("provider", key.getProvider());
            entry.put("createdAt", key.getCreatedAt() != null ? key.getCreatedAt().toString() : "");
            entry.put("updatedAt", key.getUpdatedAt() != null ? key.getUpdatedAt().toString() : "");
            result.add(entry);
        }
        return result;
    }

    /**
     * Delete an API key for a specific provider.
     */
    @Transactional
    public void deleteApiKey(UUID userId, String provider) {
        provider = provider.toUpperCase();
        repository.deleteByUserIdAndProvider(userId, provider);
        logger.info("Deleted API key for user {} provider {}", userId, provider);
    }
}
