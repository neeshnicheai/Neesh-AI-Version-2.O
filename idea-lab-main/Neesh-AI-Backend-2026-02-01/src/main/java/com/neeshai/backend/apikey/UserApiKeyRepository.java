package com.neeshai.backend.apikey;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserApiKeyRepository extends JpaRepository<UserApiKey, UUID> {

    List<UserApiKey> findByUserId(UUID userId);

    Optional<UserApiKey> findByUserIdAndProvider(UUID userId, String provider);

    void deleteByUserIdAndProvider(UUID userId, String provider);
}
