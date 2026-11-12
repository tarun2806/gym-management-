package com.gympro.api.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.Instant;

@Entity
@Table(name = "branches")
@Getter @Setter
public class Branch {

    @Id @Column(length = 36)
    private String id;

    @Column(name = "organization_id", nullable = false, length = 36)
    private String organizationId;

    @Column(nullable = false)
    private String name;

    private String address;

    @Column(name = "manager_id", length = 36)
    private String managerId;

    @Column(nullable = false, length = 20)
    private String status = "active";

    private String phone;
    private Integer capacity;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;
}
