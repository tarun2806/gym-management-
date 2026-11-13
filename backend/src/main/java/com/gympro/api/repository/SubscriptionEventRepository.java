package com.gympro.api.repository;

import com.gympro.api.model.SubscriptionEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SubscriptionEventRepository extends JpaRepository<SubscriptionEvent, String> {
    List<SubscriptionEvent> findByOrganizationIdOrderByCreatedAtDesc(String organizationId);
}
