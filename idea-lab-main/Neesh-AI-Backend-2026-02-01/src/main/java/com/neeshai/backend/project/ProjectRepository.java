package com.neeshai.backend.project;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProjectRepository extends JpaRepository<Project, UUID> {

    // @SQLRestriction ensures these only return non-deleted
    List<Project> findByOwnerId(UUID ownerId);

    Optional<Project> findBySlug(String slug);

    boolean existsBySlug(String slug);

    // Native query to check existence including soft-deleted rows (to enforce
    // global uniqueness)
    @Query(value = "SELECT COUNT(*) > 0 FROM projects WHERE slug = :slug", nativeQuery = true)
    boolean existsBySlugInDb(@Param("slug") String slug);
}
