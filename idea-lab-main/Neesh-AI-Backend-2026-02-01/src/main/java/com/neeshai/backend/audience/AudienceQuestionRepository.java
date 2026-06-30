package com.neeshai.backend.audience;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AudienceQuestionRepository extends JpaRepository<AudienceQuestion, UUID> {

    List<AudienceQuestion> findByAudienceMemberIdOrderByAskedAtDesc(UUID audienceMemberId);

    List<AudienceQuestion> findByAudienceMemberIdAndStatus(UUID audienceMemberId, String status);
}
