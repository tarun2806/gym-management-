package com.gympro.api.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "expenses")
@Getter @Setter
public class Expense {

    @Id @Column(length = 36)
    private String id;

    @Column(name = "organization_id", nullable = false, length = 36)
    private String organizationId;

    @Column(name = "branch_id", length = 36)
    private String branchId;

    private String category;
    private String description;

    @Column(nullable = false)
    private BigDecimal amount;

    private LocalDate date;

    @Column(name = "payment_method")
    private String paymentMethod;

    private String vendor;

    @Column(name = "receipt_url")
    private String receiptUrl;

    @Column(nullable = false, length = 20)
    private String status = "pending";

    @Column(name = "approved_by", length = 36)
    private String approvedBy;

    @Column(name = "approved_at")
    private Instant approvedAt;

    @Column(name = "created_at")
    private Instant createdAt;
}
