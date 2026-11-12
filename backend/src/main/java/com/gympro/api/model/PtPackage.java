package com.gympro.api.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "pt_packages")
@Getter @Setter
public class PtPackage {

    @Id @Column(length = 36)
    private String id;

    @Column(name = "organization_id", nullable = false, length = 36)
    private String organizationId;

    @Column(name = "branch_id", length = 36)
    private String branchId;

    @Column(nullable = false)
    private String name;

    private String description;

    @Column(nullable = false)
    private Integer sessions;

    @Column(nullable = false)
    private BigDecimal price;

    @Column(name = "duration_days")
    private Integer durationDays;

    @Column(nullable = false, length = 20)
    private String status = "active";

    @Column(name = "created_at")
    private Instant createdAt;
}
