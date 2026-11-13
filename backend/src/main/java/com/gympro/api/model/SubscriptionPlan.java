package com.gympro.api.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "subscription_plans")
@Getter @Setter
public class SubscriptionPlan {
    @Id @Column(length = 36) private String id;
    @Column(nullable = false, length = 120) private String name;
    @Column(columnDefinition = "TEXT") private String description;
    @Column(name = "annual_price", nullable = false, precision = 12, scale = 2) private BigDecimal annualPrice;
    @Column(nullable = false, length = 8) private String currency = "INR";
    @Column(name = "billing_interval", nullable = false, length = 20) private String billingInterval = "YEARLY";
    @Column(name = "duration_days", nullable = false) private Integer durationDays = 365;
    @Column(name = "trial_eligible", nullable = false) private Boolean trialEligible = true;
    @Column(columnDefinition = "TEXT") private String features;
    @Column(nullable = false, length = 20) private String status = "active";
    @Column(name = "created_at", nullable = false) private Instant createdAt = Instant.now();
    @Column(name = "updated_at", nullable = false) private Instant updatedAt = Instant.now();
}
