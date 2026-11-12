package com.gympro.api.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "payments")
@Getter @Setter
public class Payment {

    @Id @Column(length = 36)
    private String id;

    @Column(name = "organization_id", nullable = false, length = 36)
    private String organizationId;

    @Column(name = "branch_id", length = 36)
    private String branchId;

    @Column(name = "member_id", length = 36)
    private String memberId;

    @Column(nullable = false)
    private BigDecimal amount;

    private String type;

    @Column(nullable = false, length = 20)
    private String status = "completed";

    private String note;

    @Column(name = "plan_id", length = 36)
    private String planId;

    @Column(name = "plan_name")
    private String planName;

    @Column(name = "period_start")
    private LocalDate periodStart;

    @Column(name = "period_end")
    private LocalDate periodEnd;

    @Column(name = "razorpay_order_id", length = 100)
    private String razorpayOrderId;

    @Column(name = "razorpay_payment_id", length = 100)
    private String razorpayPaymentId;

    @Column(name = "created_at")
    private Instant createdAt;
}
