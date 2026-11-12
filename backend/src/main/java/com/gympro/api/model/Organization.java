package com.gympro.api.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.Instant;

@Entity
@Table(name = "organizations")
@Getter @Setter
public class Organization {

    @Id @Column(length = 36)
    private String id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String slug;

    @Column(name = "owner_id", nullable = false, length = 36)
    private String ownerId;

    @Column(nullable = false, length = 20)
    private String status = "pending";

    @Column(name = "subscription_tier", nullable = false, length = 20)
    private String subscriptionTier = "free";

    @Column(name = "max_branches")
    private Integer maxBranches;

    @Column(name = "max_members")
    private Integer maxMembers;

    @Column(columnDefinition = "json")
    private String settings;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;
}
