package com.neeshai.backend.admin;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface CouponCodeRepository extends JpaRepository<CouponCode, UUID> {
    Optional<CouponCode> findByCode(String code);
    Optional<CouponCode> findByCodeIgnoreCase(String code);
    boolean existsByCode(String code);
}
