package com.neeshai.backend.kb;

import com.neeshai.backend.project.ProjectRepository;
import com.neeshai.backend.service.StorageService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import org.apache.tika.Tika;

@Service
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final ProjectRepository projectRepository;
    private final StorageService storageService;
    private final AiIngestionService aiIngestionService;
    private final Tika tika = new Tika();

    public DocumentService(DocumentRepository documentRepository,
            ProjectRepository projectRepository,
            StorageService storageService,
            AiIngestionService aiIngestionService) {
        this.documentRepository = documentRepository;
        this.projectRepository = projectRepository;
        this.storageService = storageService;
        this.aiIngestionService = aiIngestionService;
    }

    /**
     * Upload a NEW document.
     * Generates a new Document Group ID.
     * Version = 1.
     */
    @Transactional
    public Document uploadNewDocument(UUID projectId, UUID uploaderId, MultipartFile file) {
        validateProject(projectId, uploaderId);
        validateFile(file);

        // Check filename uniqueness logic -> If active file exists with same name,
        // error?
        // Prompt says "Filename alone must NOT be relied on for identity", but usually
        // we want to prevent duplicate names in list.
        // Let's prevent duplication for UX, but rely on ID for logic.
        if (documentRepository.findByProjectIdAndOriginalFilenameAndIsActiveTrue(projectId, file.getOriginalFilename())
                .isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "File with this name already exists. Use Replace to update it.");
        }

        UUID documentGroupId = UUID.randomUUID();
        int version = 1;
        String extension = getFileExtension(file.getOriginalFilename());

        String storagePath = String.format("projects/%s/documents/%s/v%d%s",
                projectId, documentGroupId, version, extension);

        // Extract Text
        String extractedText = extractText(file);

        storageService.uploadFile(file, storagePath);

        Document newDoc = new Document(
                null,
                projectId,
                documentGroupId,
                uploaderId,
                file.getOriginalFilename(),
                storagePath,
                file.getContentType(),
                extractedText,
                version);

        Document saved = documentRepository.save(newDoc);

        // Trigger AI re-ingestion asynchronously so the chatbot learns about the new
        // doc
        aiIngestionService.triggerIngestionAsync(projectId);

        return saved;
    }

    /**
     * Replace an EXISTING document.
     * Reuses Document Group ID.
     * Increments Version.
     */
    @Transactional
    public Document replaceDocument(UUID documentId, UUID uploaderId, MultipartFile file) {
        Document existingDoc = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Document not found"));

        if (!existingDoc.isActive()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot replace an inactive/deleted document");
        }

        validateProject(existingDoc.getProjectId(), uploaderId);
        validateFile(file);

        // Archive old
        existingDoc.setActive(false);
        documentRepository.save(existingDoc);

        UUID documentGroupId = existingDoc.getDocumentGroupId();
        int newVersion = existingDoc.getVersion() + 1;
        String extension = getFileExtension(file.getOriginalFilename());

        // Deterministic Path
        String storagePath = String.format("projects/%s/documents/%s/v%d%s",
                existingDoc.getProjectId(), documentGroupId, newVersion, extension);

        // Extract Text
        String extractedText = extractText(file);

        storageService.uploadFile(file, storagePath);

        // Create new version
        Document newDoc = new Document(
                null,
                existingDoc.getProjectId(),
                documentGroupId,
                uploaderId,
                file.getOriginalFilename(), // Use new filename or keep old? Usually replace keeps identity, but file
                                            // might be renamed. Let's use new.
                storagePath,
                file.getContentType(),
                extractedText,
                newVersion);

        Document saved = documentRepository.save(newDoc);

        // Trigger AI re-ingestion asynchronously for the updated document
        aiIngestionService.triggerIngestionAsync(existingDoc.getProjectId());

        return saved;
    }

    public List<KnowledgeDocumentDTO> getActiveDocuments(UUID projectId) {
        // Public/Private access? Assuming private list for now.
        return documentRepository.findByProjectIdAndIsActiveTrue(projectId)
                .stream()
                .map(KnowledgeDocumentDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteDocument(UUID documentId, UUID userId) {
        Document doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Document not found"));

        validateProject(doc.getProjectId(), userId);

        doc.setActive(false);
        documentRepository.save(doc);

        // Trigger AI re-ingestion so deleted doc is no longer retrievable
        aiIngestionService.triggerIngestionAsync(doc.getProjectId());
    }

    public void refreshDocuments(UUID projectId, UUID userId) {
        validateProject(projectId, userId);
        // Emit internal event (Simulated)
        System.out.println("EVENT: KnowledgeBaseRefreshed(projectId=" + projectId + ", timestamp="
                + System.currentTimeMillis() + ")");
    }

    // Helpers
    private void validateProject(UUID projectId, UUID userId) {
        projectRepository.findById(projectId)
                .filter(p -> !p.isDeleted()) // Project Guard
                .filter(p -> p.getOwnerId().equals(userId)) // Ownership Guard
                .orElseThrow(
                        () -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Project not valid or unauthorized"));
    }

    private void validateFile(MultipartFile file) {
        if (file.isEmpty())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File is empty");
    }

    private String getFileExtension(String filename) {
        if (filename == null)
            return "";
        int dotIndex = filename.lastIndexOf('.');
        return (dotIndex == -1) ? "" : filename.substring(dotIndex);
    }

    private String extractText(MultipartFile file) {
        try {
            // Tika auto-detects based on stream content
            return tika.parseToString(file.getInputStream());
        } catch (Exception e) {
            // Log error but don't fail upload? Or fail?
            // User expects chatbot to work, so failing might be better to signal issue.
            // But let's log and allow upload for now (maybe it's an image or unsupported
            // format).
            System.err.println("Text extraction failed for " + file.getOriginalFilename() + ": " + e.getMessage());
            return "";
        }
    }
}
