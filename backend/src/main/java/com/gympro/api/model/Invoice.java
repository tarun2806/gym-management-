package com.gympro.api.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "invoices")
@Getter @Setter
public class Invoice {

    @Id @Column(length = 36)
    private String id;

    @Column(name = "organization_id", nullable = false, length = 36)
    private String organizationId;

    @Column(name = "branch_id", length = 36)
    private String branchId;

    @Column(name = "invoice_number", nullable = false)
    private String invoiceNumber;

    @Column(name = "member_id", nullable = false, length = 36)
    private String memberId;

    @Column(nullable = false)
    private BigDecimal amount;

    @Column(nullable = false, length = 20)
    private String status = "draft";

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(name = "issued_date")
    private LocalDate issuedDate;

    @Column(name = "paid_date")
    private LocalDate paidDate;

    @Column(columnDefinition = "json")
    private String items;

    private BigDecimal subtotal;
    private BigDecimal tax;
    private BigDecimal total;
    private String notes;

    @Column(name = "created_at")
    private Instant createdAt;
}
