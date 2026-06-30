package com.neeshai.backend.promotion;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BlogPromotionRepository extends JpaRepository<BlogPromotion, UUID> {

    List<BlogPromotion> findByUserIdAndStatus(UUID userId, String status);

    List<BlogPromotion> findByUserId(UUID userId);

    Optional<BlogPromotion> findByBlogId(UUID blogId);

    Optional<BlogPromotion> findByBlogIdAndStatus(UUID blogId, String status);

    long countByUserId(UUID userId);

    /**
     * Find promotions that share tags with the given promotion, excluding itself.
     * Returns promotions ordered by number of matching tags (most overlap first).
     */
    @Query(value = """
        SELECT bp.* FROM blog_promotions bp
        WHERE bp.status = 'ACTIVE'
        AND bp.id != :promotionId
        AND bp.id IN (
            SELECT pt2.promotion_id FROM promotion_tags pt2
            WHERE pt2.tag IN (
                SELECT pt1.tag FROM promotion_tags pt1

                WHERE pt1.promotion_id = :promotionId
            )
        )
        ORDER BY (
            SELECT COUNT(*) FROM promotion_tags pt3
            WHERE pt3.promotion_id = bp.id
            AND pt3.tag IN (
                SELECT pt4.tag FROM promotion_tags pt4
                WHERE pt4.promotion_id = :promotionId
            )
        ) DESC
        LIMIT :maxResults
        """, nativeQuery = true)
    List<BlogPromotion> findSimilarPromotions(@Param("promotionId") UUID promotionId, @Param("maxResults") int maxResults);
}
