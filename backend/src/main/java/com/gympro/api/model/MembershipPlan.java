package com.gympro.api.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "membership_plans")
@Getter @Setter
public class MembershipPlan {

    @Id @Column(length = 36)
    private String id;

    @Column(name = "organization_id", nullable = false, length = 36)
    private String organizationId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private BigDecimal price;

    private String duration;

    @Column(columnDefinition = "json")
    private String features;

    @Column(nullable = false, length = 20)
    private String status = "active";

    @Column(name = "created_at")
    private Instant createdAt;
}
