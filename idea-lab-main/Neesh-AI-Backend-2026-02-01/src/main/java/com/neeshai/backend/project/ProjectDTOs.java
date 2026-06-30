package com.neeshai.backend.project;

import java.time.ZonedDateTime;
import java.util.UUID;

public class ProjectDTOs {

    public record CreateProjectRequest(
            String title,
            String oneLineSummary,
            String introduction,
            String description) {
    }

    public record UpdateProjectRequest(
            String title,
            String oneLineSummary,
            String introduction,
            String description,
            String status) {
    }

    // PRIVATE DTO (Owner access)
    public record PrivateProjectDTO(
            UUID id,
            String title,
            String slug,
            String oneLineSummary,
            String introduction,
            String description,
            String status,
            ZonedDateTime createdAt,
            ZonedDateTime updatedAt) {
        public static PrivateProjectDTO fromEntity(Project project) {
            return new PrivateProjectDTO(
                    project.getId(),
                    project.getTitle(),
                    project.getSlug(),
                    project.getOneLineSummary(),
                    project.getIntroduction(),
                    project.getDescription(),
                    project.getStatus(),
                    project.getCreatedAt(),
                    project.getUpdatedAt());
        }
    }

    // PUBLIC DTO (Public access - Restricted fields)
    public record PublicProjectDTO(
            String title,
            String slug,
            String oneLineSummary,
            String introduction,
            String description,
            ZonedDateTime updatedAt) {
        public static PublicProjectDTO fromEntity(Project project) {
            return new PublicProjectDTO(
                    project.getTitle(),
                    project.getSlug(),
                    project.getOneLineSummary(),
                    project.getIntroduction(),
                    project.getDescription(),
                    project.getUpdatedAt());
        }
    }
}
