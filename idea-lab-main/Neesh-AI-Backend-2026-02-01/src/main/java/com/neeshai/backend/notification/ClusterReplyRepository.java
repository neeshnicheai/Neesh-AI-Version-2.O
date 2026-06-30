package com.neeshai.backend.notification;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ClusterReplyRepository extends JpaRepository<ClusterReply, UUID> {

    List<ClusterReply> findByClusterIdOrderBySentAtDesc(UUID clusterId);
}
