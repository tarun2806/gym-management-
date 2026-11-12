package com.gympro.api.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "diet_plans")
@Getter @Setter
public class DietPlan {

    @Id @Column(length = 36)
    private String id;

    @Column(name = "organization_id", nullable = false, length = 36)
    private String organizationId;

    @Column(name = "member_id", length = 36)
    private String memberId;

    private LocalDate date;
    private Integer calories;

    @Column(columnDefinition = "json")
    private String macros;

    private String goals;
    private String description;

    @Column(columnDefinition = "json")
    private String meals;

    @Column(name = "diet_preference")
    private String dietPreference;

    @Column(name = "created_at")
    private Instant createdAt;
}
