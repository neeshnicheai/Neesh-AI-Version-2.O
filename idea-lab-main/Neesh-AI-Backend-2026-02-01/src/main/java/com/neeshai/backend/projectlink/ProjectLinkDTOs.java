package com.neeshai.backend.projectlink;

import java.time.ZonedDateTime;
import java.util.UUID;

public class ProjectLinkDTOs {

    public record CreateLinkRequest(
            UUID linkedProjectId,
            String linkType) {
    }

    public record LinkedProjectDTO(
            UUID linkId,
            UUID projectId,
            String projectTitle,
            String projectSummary,
            String linkType,
            ZonedDateTime createdAt) {
    }
}
