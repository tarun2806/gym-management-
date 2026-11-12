package com.gympro.api.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "pt_sessions")
@Getter @Setter
public class PtSession {

    @Id @Column(length = 36)
    private String id;

    @Column(name = "organization_id", nullable = false, length = 36)
    private String organizationId;

    @Column(name = "branch_id", length = 36)
    private String branchId;

    @Column(name = "package_id", length = 36)
    private String packageId;

    @Column(name = "member_id", nullable = false, length = 36)
    private String memberId;

    @Column(name = "trainer_id", nullable = false, length = 36)
    private String trainerId;

    @Column(name = "scheduled_date", nullable = false)
    private LocalDate scheduledDate;

    @Column(name = "scheduled_time")
    private String scheduledTime;

    @Column(nullable = false, length = 20)
    private String status = "scheduled";

    private String notes;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "created_at")
    private Instant createdAt;
}
