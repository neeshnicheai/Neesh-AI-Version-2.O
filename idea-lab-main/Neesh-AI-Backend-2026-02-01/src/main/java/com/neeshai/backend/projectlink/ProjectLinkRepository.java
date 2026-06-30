package com.neeshai.backend.projectlink;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProjectLinkRepository extends JpaRepository<ProjectLink, UUID> {

    List<ProjectLink> findBySourceProjectId(UUID sourceProjectId);

    List<ProjectLink> findByLinkedProjectId(UUID linkedProjectId);

    Optional<ProjectLink> findBySourceProjectIdAndLinkedProjectId(UUID sourceProjectId, UUID linkedProjectId);

    @Query("SELECT pl.linkedProjectId FROM ProjectLink pl WHERE pl.sourceProjectId = :sourceProjectId")
    List<UUID> findLinkedProjectIdsBySourceProjectId(@Param("sourceProjectId") UUID sourceProjectId);

    @Query("SELECT pl.sourceProjectId FROM ProjectLink pl WHERE pl.linkedProjectId = :linkedProjectId")
    List<UUID> findSourceProjectIdsByLinkedProjectId(@Param("linkedProjectId") UUID linkedProjectId);

    void deleteBySourceProjectIdOrLinkedProjectId(UUID sourceProjectId, UUID linkedProjectId);
}
