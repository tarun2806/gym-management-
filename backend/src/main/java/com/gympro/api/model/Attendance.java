package com.gympro.api.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.Instant;
import java.time.LocalDateTime;

@Entity
@Table(name = "attendance")
@Getter @Setter
public class Attendance {

    @Id @Column(length = 36)
    private String id;

    @Column(name = "organization_id", nullable = false, length = 36)
    private String organizationId;

    @Column(name = "branch_id", length = 36)
    private String branchId;

    @Column(name = "member_id", nullable = false, length = 36)
    private String memberId;

    @Column(name = "check_in", nullable = false)
    private LocalDateTime checkIn;

    @Column(name = "check_out")
    private LocalDateTime checkOut;

    @Column(nullable = false, length = 20)
    private String status = "present";

    @Column(name = "member_name")
    private String memberName;

    @Column(name = "member_type")
    private String memberType;

    @Column(name = "created_at")
    private Instant createdAt;
}
