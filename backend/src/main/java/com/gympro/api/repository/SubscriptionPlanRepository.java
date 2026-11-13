package com.gympro.api.repository;

import com.gympro.api.model.SubscriptionPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface SubscriptionPlanRepository extends JpaRepository<SubscriptionPlan, String> {
    List<SubscriptionPlan> findByStatus(String status);
    List<SubscriptionPlan> findAllByOrderByCreatedAtDesc();
    Optional<SubscriptionPlan> findFirstByStatusOrderByCreatedAtAsc(String status);
}
