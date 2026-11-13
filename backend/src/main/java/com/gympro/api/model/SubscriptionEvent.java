package com.gympro.api.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.Instant;

@Entity
@Table(name = "subscription_events")
@Getter @Setter
public class SubscriptionEvent {
    @Id @Column(length = 36) private String id;
    @Column(name = "organization_id", nullable = false, length = 36) private String organizationId;
    @Column(name = "subscription_id", length = 36) private String subscriptionId;
    @Column(name = "event_type", nullable = false, length = 40) private String eventType;
    @Column(name = "actor_id", length = 36) private String actorId;
    @Column(length = 500) private String detail;
    @Column(name = "created_at", nullable = false) private Instant createdAt = Instant.now();
}
