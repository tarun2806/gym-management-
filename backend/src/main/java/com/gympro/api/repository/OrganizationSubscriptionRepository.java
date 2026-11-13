package com.gympro.api.repository;

import com.gympro.api.model.OrganizationSubscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.Lock;
import jakarta.persistence.LockModeType;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface OrganizationSubscriptionRepository extends JpaRepository<OrganizationSubscription, String> {
    Optional<OrganizationSubscription> findByOrganizationId(String organizationId);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from OrganizationSubscription s where s.organizationId = :orgId")
    Optional<OrganizationSubscription> findByOrganizationIdForUpdate(@Param("orgId") String organizationId);
    List<OrganizationSubscription> findByStatus(String status);
    List<OrganizationSubscription> findByTrialEndBeforeAndStatus(Instant trialEnd, String status);
    List<OrganizationSubscription> findBySubscriptionEndBeforeAndStatus(Instant end, String status);
    long countByStatus(String status);
}
