package com.gympro.api.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.Instant;

@Entity
@Table(name = "organization_subscriptions")
@Getter @Setter
public class OrganizationSubscription {
    @Id @Column(length = 36) private String id;
    @Column(name = "organization_id", nullable = false, length = 36, unique = true) private String organizationId;
    @Column(name = "plan_id", length = 36) private String planId;
    @Column(name = "plan_snapshot", length = 500) private String planSnapshot;
    @Column(nullable = false, length = 20) private String status = "TRIALING";
    @Column(name = "trial_start") private Instant trialStart;
    @Column(name = "trial_end") private Instant trialEnd;
    @Column(name = "subscription_start") private Instant subscriptionStart;
    @Column(name = "subscription_end") private Instant subscriptionEnd;
    @Column(name = "next_renewal_date") private Instant nextRenewalDate;
    @Column(name = "cancelled_at") private Instant cancelledAt;
    @Column(name = "cancel_reason", length = 255) private String cancelReason;
    @Column(name = "created_at", nullable = false) private Instant createdAt = Instant.now();
    @Column(name = "updated_at", nullable = false) private Instant updatedAt = Instant.now();
}
