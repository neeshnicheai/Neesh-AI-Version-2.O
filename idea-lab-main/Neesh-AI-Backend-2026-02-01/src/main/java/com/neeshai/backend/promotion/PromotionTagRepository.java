package com.neeshai.backend.promotion;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PromotionTagRepository extends JpaRepository<PromotionTag, UUID> {

    List<PromotionTag> findByPromotionId(UUID promotionId);

    void deleteByPromotionId(UUID promotionId);

    List<PromotionTag> findByPromotionIdIn(List<UUID> promotionIds);
}
