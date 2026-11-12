package com.gympro.api.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.Instant;
import java.time.LocalDateTime;

@Entity
@Table(name = "classes")
@Getter @Setter
public class GymClass {

    @Id @Column(length = 36)
    private String id;

    @Column(name = "organization_id", nullable = false, length = 36)
    private String organizationId;

    @Column(name = "branch_id", length = 36)
    private String branchId;

    @Column(nullable = false)
    private String name;

    private String instructor;

    @Column(name = "schedule_time")
    private String scheduleTime;

    @Column(nullable = false)
    private Integer capacity = 0;

    @Column(nullable = false)
    private Integer enrolled = 0;

    @Column(nullable = false, length = 20)
    private String status = "Active";

    private String room;

    @Column(name = "`type`")
    private String type;

    private String description;

    @Column(name = "created_at")
    private Instant createdAt;
}
