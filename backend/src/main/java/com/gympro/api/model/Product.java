package com.gympro.api.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "products")
@Getter @Setter
public class Product {

    @Id @Column(length = 36)
    private String id;

    @Column(name = "organization_id", nullable = false, length = 36)
    private String organizationId;

    @Column(name = "branch_id", length = 36)
    private String branchId;

    @Column(nullable = false)
    private String name;

    private String category;
    private String sku;
    private String description;

    @Column(name = "stock_quantity", nullable = false)
    private Integer stockQuantity = 0;

    @Column(name = "unit_price")
    private BigDecimal unitPrice;

    private String supplier;

    @Column(name = "min_stock", nullable = false)
    private Integer minStock = 0;

    @Column(nullable = false, length = 20)
    private String status = "active";

    @Column(name = "created_at")
    private Instant createdAt;
}
