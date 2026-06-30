package com.neeshai.backend.audience;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AudienceMemberRepository extends JpaRepository<AudienceMember, UUID> {

    List<AudienceMember> findByProjectIdOrderByLastInteractionAtDesc(UUID projectId);

    List<AudienceMember> findByProjectIdAndOccupation(UUID projectId, String occupation);

    Optional<AudienceMember> findByProjectIdAndEmail(UUID projectId, String email);
}
