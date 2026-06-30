package com.neeshai.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

/**
 * Real Supabase Storage implementation
 *
 * This service uploads files to Supabase Storage using the Storage API.
 * Files are stored in a bucket with proper path organization.
 */
@Service
public class SupabaseStorageService implements StorageService {

    private static final Logger log = LoggerFactory.getLogger(SupabaseStorageService.class);

    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.service.role.key}")
    private String serviceRoleKey;

    @Value("${supabase.storage.bucket:documents}")
    private String bucketName;

    private final RestTemplate restTemplate;

    public SupabaseStorageService() {
        this.restTemplate = new RestTemplate();
    }

    @Override
    public String uploadFile(MultipartFile file, String destinationPath) {
        try {
            log.info("Uploading file {} to Supabase Storage at path: {}", file.getOriginalFilename(), destinationPath);

            // Validate inputs
            if (file.isEmpty()) {
                throw new IllegalArgumentException("File is empty");
            }

            if (destinationPath == null || destinationPath.trim().isEmpty()) {
                throw new IllegalArgumentException("Destination path is required");
            }

            // Clean the destination path (remove leading slash if present)
            String cleanPath = destinationPath.startsWith("/") ? destinationPath.substring(1) : destinationPath;

            // Create bucket if it doesn't exist (idempotent operation)
            ensureBucketExists();

            // Upload file to Supabase Storage
            String uploadUrl = String.format("%s/storage/v1/object/%s/%s", supabaseUrl, bucketName, cleanPath);

            // Prepare headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);
            headers.setBearerAuth(serviceRoleKey);
            headers.set("apikey", serviceRoleKey);

            // Create multipart request
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();

            // Create a ByteArrayResource with filename
            ByteArrayResource fileResource = new ByteArrayResource(file.getBytes()) {
                @Override
                public String getFilename() {
                    return file.getOriginalFilename();
                }
            };

            body.add("file", fileResource);

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

            // Make the upload request
            ResponseEntity<Map> response = restTemplate.exchange(
                uploadUrl,
                HttpMethod.POST,
                requestEntity,
                Map.class
            );

            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("Successfully uploaded {} to Supabase Storage", file.getOriginalFilename());
                return destinationPath;
            } else {
                log.error("Failed to upload file. Status: {}, Body: {}", response.getStatusCode(), response.getBody());
                throw new RuntimeException("Upload failed with status: " + response.getStatusCode());
            }

        } catch (IOException e) {
            log.error("IO error while uploading file: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to read file content", e);
        } catch (Exception e) {
            log.error("Failed to upload file to Supabase Storage: {}", e.getMessage(), e);
            throw new RuntimeException("File upload failed", e);
        }
    }

    /**
     * Ensure the storage bucket exists (idempotent operation)
     */
    private void ensureBucketExists() {
        try {
            String bucketsUrl = String.format("%s/storage/v1/bucket", supabaseUrl);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(serviceRoleKey);
            headers.set("apikey", serviceRoleKey);

            // Check if bucket exists first
            ResponseEntity<Map[]> listResponse = restTemplate.exchange(
                bucketsUrl,
                HttpMethod.GET,
                new HttpEntity<>(headers),
                Map[].class
            );

            if (listResponse.getStatusCode().is2xxSuccessful() && listResponse.getBody() != null) {
                for (Map bucket : listResponse.getBody()) {
                    if (bucketName.equals(bucket.get("name"))) {
                        log.debug("Bucket '{}' already exists", bucketName);
                        return;
                    }
                }
            }

            // Create bucket if it doesn't exist
            Map<String, Object> bucketData = Map.of(
                "name", bucketName,
                "public", false,
                "file_size_limit", 52428800, // 50MB limit
                "allowed_mime_types", new String[]{
                    "application/pdf",
                    "text/plain",
                    "text/markdown",
                    "application/msword",
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    "text/csv",
                    "application/vnd.ms-excel",
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                }
            );

            ResponseEntity<Map> createResponse = restTemplate.exchange(
                bucketsUrl,
                HttpMethod.POST,
                new HttpEntity<>(bucketData, headers),
                Map.class
            );

            if (createResponse.getStatusCode().is2xxSuccessful()) {
                log.info("Created Supabase Storage bucket: {}", bucketName);
            } else {
                log.warn("Failed to create bucket (may already exist): {}", createResponse.getStatusCode());
            }

        } catch (Exception e) {
            log.warn("Failed to ensure bucket exists (continuing anyway): {}", e.getMessage());
            // Don't fail the upload if bucket creation fails - bucket might already exist
        }
    }

    /**
     * Generate a public URL for a stored file
     */
    public String getPublicUrl(String filePath) {
        String cleanPath = filePath.startsWith("/") ? filePath.substring(1) : filePath;
        return String.format("%s/storage/v1/object/public/%s/%s", supabaseUrl, bucketName, cleanPath);
    }

    /**
     * Generate a signed URL for a private file
     */
    public String getSignedUrl(String filePath, int expiresInSeconds) {
        try {
            String cleanPath = filePath.startsWith("/") ? filePath.substring(1) : filePath;
            String signUrl = String.format("%s/storage/v1/object/sign/%s/%s", supabaseUrl, bucketName, cleanPath);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(serviceRoleKey);
            headers.set("apikey", serviceRoleKey);

            Map<String, Object> signData = Map.of("expiresIn", expiresInSeconds);

            ResponseEntity<Map> response = restTemplate.exchange(
                signUrl,
                HttpMethod.POST,
                new HttpEntity<>(signData, headers),
                Map.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                String signedToken = (String) response.getBody().get("signedToken");
                return String.format("%s/storage/v1/object/sign/%s/%s?token=%s", supabaseUrl, bucketName, cleanPath, signedToken);
            } else {
                throw new RuntimeException("Failed to generate signed URL");
            }

        } catch (Exception e) {
            log.error("Failed to generate signed URL for {}: {}", filePath, e.getMessage());
            throw new RuntimeException("Failed to generate signed URL", e);
        }
    }

    /**
     * Delete a file from storage
     */
    public boolean deleteFile(String filePath) {
        try {
            String cleanPath = filePath.startsWith("/") ? filePath.substring(1) : filePath;
            String deleteUrl = String.format("%s/storage/v1/object/%s/%s", supabaseUrl, bucketName, cleanPath);

            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(serviceRoleKey);
            headers.set("apikey", serviceRoleKey);

            ResponseEntity<Map> response = restTemplate.exchange(
                deleteUrl,
                HttpMethod.DELETE,
                new HttpEntity<>(headers),
                Map.class
            );

            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("Successfully deleted file: {}", filePath);
                return true;
            } else {
                log.warn("Failed to delete file: {}, Status: {}", filePath, response.getStatusCode());
                return false;
            }

        } catch (Exception e) {
            log.error("Error deleting file {}: {}", filePath, e.getMessage());
            return false;
        }
    }
}