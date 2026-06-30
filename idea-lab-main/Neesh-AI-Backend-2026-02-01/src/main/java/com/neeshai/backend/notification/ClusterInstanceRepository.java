package com.neeshai.backend.notification;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ClusterInstanceRepository extends JpaRepository<ClusterInstance, UUID> {

    List<ClusterInstance> findByClusterIdOrderByAskedAtDesc(UUID clusterId);

    List<ClusterInstance> findByClusterIdAndStatus(UUID clusterId, String status);

    @Query("SELECT COUNT(ci) FROM ClusterInstance ci WHERE ci.cluster.id = :clusterId AND ci.status = 'ANSWERED'")
    long countAnsweredByClusterId(@Param("clusterId") UUID clusterId);

    @Query("SELECT COUNT(ci) FROM ClusterInstance ci WHERE ci.cluster.id = :clusterId")
    long countByClusterId(@Param("clusterId") UUID clusterId);
}
