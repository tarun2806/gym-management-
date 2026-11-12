package com.gympro.api.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.Instant;

@Entity
@Table(name = "notifications")
@Getter @Setter
public class Notification {

    @Id @Column(length = 36)
    private String id;

    @Column(name = "user_id", nullable = false, length = 36)
    private String userId;

    @Column(name = "organization_id", length = 36)
    private String organizationId;

    private String type;
    private String title;
    private String body;

    @Column(columnDefinition = "json")
    private String payload;

    @Column(name = "read_flag", nullable = false)
    private Boolean readFlag = false;

    @Column(name = "created_at")
    private Instant createdAt;
}
