package com.neeshai.backend.kb;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.ZonedDateTime;
import java.util.UUID;

public record KnowledgeDocumentDTO(
        @JsonProperty("id") UUID id,
        @JsonProperty("document_group_id") UUID documentGroupId,
        @JsonProperty("project_id") UUID projectId,
        @JsonProperty("original_filename") String filename,
        @JsonProperty("mime_type") String mimeType,
        @JsonProperty("version") int version,
        @JsonProperty("created_at") ZonedDateTime uploadedAt) {

    public static KnowledgeDocumentDTO fromEntity(Document doc) {
        return new KnowledgeDocumentDTO(
                doc.getId(),
                doc.getDocumentGroupId(),
                doc.getProjectId(),
                doc.getOriginalFilename(),
                doc.getMimeType(),
                doc.getVersion(),
                doc.getCreatedAt());
    }
}
