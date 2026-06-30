package com.neeshai.backend.admin;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface AdminRoleRepository extends JpaRepository<AdminRole, UUID> {
    Optional<AdminRole> findByUsername(String username);
    boolean existsByUsername(String username);
}
