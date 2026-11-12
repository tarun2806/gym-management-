package com.gympro.api.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "class_bookings")
@Getter @Setter
public class ClassBooking {

    @Id @Column(length = 36)
    private String id;

    @Column(name = "organization_id", nullable = false, length = 36)
    private String organizationId;

    @Column(name = "class_id", nullable = false, length = 36)
    private String classId;

    @Column(name = "member_id", nullable = false, length = 36)
    private String memberId;

    @Column(name = "booked_at")
    private Instant bookedAt;

    @Column(nullable = false, length = 20)
    private String status = "booked";

    @Column(name = "cancelled_at")
    private Instant cancelledAt;

    @Column(name = "booked_date")
    private LocalDate bookedDate;
}
