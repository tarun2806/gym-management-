package com.gympro.api.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.Instant;

@Entity
@Table(name = "workout_plans")
@Getter @Setter
public class WorkoutPlan {

    @Id @Column(length = 36)
    private String id;

    @Column(name = "organization_id", nullable = false, length = 36)
    private String organizationId;

    @Column(name = "member_id", length = 36)
    private String memberId;

    @Column(name = "trainer_id", length = 36)
    private String trainerId;

    @Column(nullable = false)
    private String name;

    private String description;
    private String objective;
    private String level;
    private Integer weeks;

    @Column(name = "days_per_week")
    private Integer daysPerWeek;

    @Column(columnDefinition = "json")
    private String exercises;

    @Column(columnDefinition = "json")
    private String completions;

    @Column(name = "created_at")
    private Instant createdAt;
}
