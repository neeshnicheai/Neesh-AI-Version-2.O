package com.neeshai.backend.kb;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.security.Principal;
import java.util.List;
import java.util.UUID;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api/documents")
public class DocumentController {

    private static final Logger log = LoggerFactory.getLogger(DocumentController.class);
    private final DocumentService documentService;

    public DocumentController(DocumentService documentService) {
        this.documentService = documentService;
    }

    private UUID getUserIdFromJwt(Jwt jwt) {
        try {
            return UUID.fromString(jwt.getSubject());
        } catch (IllegalArgumentException e) {
            log.error("Failed to parse UUID from JWT subject: {}", jwt.getSubject());
            throw e;
        }
    }

    // Upload New
    @PostMapping("/project/{projectId}")
    public ResponseEntity<KnowledgeDocumentDTO> uploadNew(
            @PathVariable UUID projectId,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal Jwt jwt) {
        UUID userId = getUserIdFromJwt(jwt);
        Document doc = documentService.uploadNewDocument(projectId, userId, file);
        return ResponseEntity.ok(KnowledgeDocumentDTO.fromEntity(doc));
    }

    // Replace Existing
    @PutMapping("/{documentId}/replace")
    public ResponseEntity<KnowledgeDocumentDTO> replaceExisting(
            @PathVariable UUID documentId,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal Jwt jwt) {
        UUID userId = getUserIdFromJwt(jwt);
        Document doc = documentService.replaceDocument(documentId, userId, file);
        return ResponseEntity.ok(KnowledgeDocumentDTO.fromEntity(doc));
    }

    // List
    @GetMapping("/project/{projectId}")
    public ResponseEntity<List<KnowledgeDocumentDTO>> listDocuments(
            @PathVariable UUID projectId,
            @AuthenticationPrincipal Jwt jwt) {
        // Just keeping signature consistent, logic unchanged for now
        return ResponseEntity.ok(documentService.getActiveDocuments(projectId));
    }

    @DeleteMapping("/{documentId}")
    public ResponseEntity<Void> deleteDocument(
            @PathVariable UUID documentId,
            @AuthenticationPrincipal Jwt jwt) {
        UUID userId = getUserIdFromJwt(jwt);
        documentService.deleteDocument(documentId, userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/project/{projectId}/refresh")
    public ResponseEntity<Void> refreshDocuments(
            @PathVariable UUID projectId,
            @AuthenticationPrincipal Jwt jwt) {
        UUID userId = getUserIdFromJwt(jwt);
        documentService.refreshDocuments(projectId, userId);
        return ResponseEntity.ok().build();
    }
}
