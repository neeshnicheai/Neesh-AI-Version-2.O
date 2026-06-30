package com.neeshai.backend.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {

    @Modifying
    @org.springframework.transaction.annotation.Transactional
    @Query(value = "INSERT INTO users (id, email, name, status, created_at, updated_at) " +
            "VALUES (:id, :email, :name, 'ACTIVE', NOW(), NOW()) " +
            "ON CONFLICT (id) DO UPDATE SET " +
            "email = EXCLUDED.email, " +
            "name = EXCLUDED.name, " +
            "updated_at = NOW() " +
            "WHERE users.email != EXCLUDED.email OR (users.name IS NULL AND EXCLUDED.name IS NOT NULL) OR (users.name != EXCLUDED.name)", nativeQuery = true)
    void upsertUser(@Param("id") UUID id, @Param("email") String email, @Param("name") String name);
}
