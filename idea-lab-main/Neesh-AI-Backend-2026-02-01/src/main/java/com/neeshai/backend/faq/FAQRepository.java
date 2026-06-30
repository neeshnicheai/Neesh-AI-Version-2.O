package com.neeshai.backend.faq;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface FAQRepository extends JpaRepository<FAQ, UUID> {

    List<FAQ> findByProjectIdAndIsActiveTrueOrderByDisplayOrderAsc(UUID projectId);

    List<FAQ> findByProjectIdOrderByDisplayOrderAsc(UUID projectId);

    int countByProjectIdAndIsActiveTrue(UUID projectId);
}
