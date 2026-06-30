package com.neeshai.backend.question;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface UnansweredQuestionRepository extends JpaRepository<UnansweredQuestion, UUID> {

    List<UnansweredQuestion> findByProjectIdAndIsResolvedFalseOrderByCreatedAtDesc(UUID projectId);

    List<UnansweredQuestion> findByProjectIdOrderByCreatedAtDesc(UUID projectId);
}
