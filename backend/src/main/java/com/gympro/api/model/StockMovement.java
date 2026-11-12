package com.gympro.api.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "stock_movements")
@Getter @Setter
public class StockMovement {

    @Id @Column(length = 36)
    private String id;

    @Column(name = "organization_id", nullable = false, length = 36)
    private String organizationId;

    @Column(name = "branch_id", length = 36)
    private String branchId;

    @Column(name = "product_id", nullable = false, length = 36)
    private String productId;

    @Column(nullable = false, length = 20)
    private String type;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "unit_cost")
    private BigDecimal unitCost;

    private String reason;

    @Column(name = "from_branch_id", length = 36)
    private String fromBranchId;

    @Column(name = "to_branch_id", length = 36)
    private String toBranchId;

    @Column(name = "performed_by", length = 36)
    private String performedBy;

    private Instant date;

    @Column(name = "created_at")
    private Instant createdAt;
}
