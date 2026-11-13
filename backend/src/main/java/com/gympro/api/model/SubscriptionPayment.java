package com.gympro.api.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "subscription_payments")
@Getter @Setter
public class SubscriptionPayment {
    @Id @Column(length = 36) private String id;
    @Column(name = "organization_id", nullable = false, length = 36) private String organizationId;
    @Column(name = "subscription_id", length = 36) private String subscriptionId;
    @Column(name = "plan_id", length = 36) private String planId;
    @Column(nullable = false, precision = 12, scale = 2) private BigDecimal amount;
    @Column(nullable = false, length = 8) private String currency = "INR";
    @Column(nullable = false, length = 20) private String status = "pending";
    @Column(name = "razorpay_order_id", length = 120, unique = true) private String razorpayOrderId;
    @Column(name = "razorpay_payment_id", length = 120, unique = true) private String razorpayPaymentId;
    @Column(nullable = false, length = 30) private String purpose = "subscription";
    @Column(name = "period_start") private Instant periodStart;
    @Column(name = "period_end") private Instant periodEnd;
    @Column(name = "created_at", nullable = false) private Instant createdAt = Instant.now();
}
