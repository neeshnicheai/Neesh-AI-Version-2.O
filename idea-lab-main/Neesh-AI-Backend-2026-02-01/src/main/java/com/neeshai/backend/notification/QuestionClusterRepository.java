package com.neeshai.backend.notification;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface QuestionClusterRepository extends JpaRepository<QuestionCluster, UUID> {

    List<QuestionCluster> findByProjectIdAndStatusOrderByPriorityScoreDesc(UUID projectId, String status);

    List<QuestionCluster> findByProjectIdAndStatusNotOrderByPriorityScoreDesc(UUID projectId, String excludeStatus);

    List<QuestionCluster> findByProjectIdOrderByPriorityScoreDesc(UUID projectId);

    @Query("SELECT c FROM QuestionCluster c WHERE c.project.id = :projectId AND c.normalizedQuestion = :normalized")
    QuestionCluster findByProjectIdAndNormalizedQuestion(@Param("projectId") UUID projectId,
            @Param("normalized") String normalized);

    @Query("SELECT c FROM QuestionCluster c WHERE c.project.id = :projectId AND c.status IN ('UNANSWERED', 'PARTIALLY_ANSWERED')")
    List<QuestionCluster> findUnansweredByProjectId(@Param("projectId") UUID projectId);

    @Query("SELECT COUNT(c) FROM QuestionCluster c WHERE c.project.id = :projectId AND c.status IN ('UNANSWERED', 'PARTIALLY_ANSWERED')")
    long countUnansweredByProjectId(@Param("projectId") UUID projectId);
}
