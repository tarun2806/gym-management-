package com.gympro.api.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "trainers")
@Getter @Setter
public class Trainer {

    @Id @Column(length = 36)
    private String id;

    @Column(name = "organization_id", nullable = false, length = 36)
    private String organizationId;

    @Column(name = "branch_id", length = 36)
    private String branchId;

    @Column(nullable = false)
    private String name;

    private String email;
    private String phone;
    private String specialization;
    private String experience;
    private BigDecimal rating;

    @Column(nullable = false, length = 20)
    private String status = "Active";

    private String location;
    private String bio;

    @Column(name = "hourly_rate")
    private BigDecimal hourlyRate;

    @Column(name = "created_at")
    private Instant createdAt;
}
