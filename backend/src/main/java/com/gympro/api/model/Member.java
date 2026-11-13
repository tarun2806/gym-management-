package com.gympro.api.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "members")
@Getter @Setter
public class Member {

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

    @Column(name = "membership_type")
    private String membershipType;

    @Column(nullable = false, length = 20)
    private String status = "Active";

    @Column(name = "join_date")
    private LocalDate joinDate;

    @Column(name = "last_visit")
    private Instant lastVisit;

    @Column(name = "trainer_id", length = 36)
    private String trainerId;

    @Column(name = "plan_id", length = 36)
    private String planId;

    @Column(name = "plan_name")
    private String planName;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    @Column(name = "user_id", length = 36)
    private String userId;

    @Column(name = "created_at")
    private Instant createdAt;

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
}
