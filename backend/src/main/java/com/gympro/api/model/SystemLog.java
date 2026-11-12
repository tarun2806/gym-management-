package com.gympro.api.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.Instant;

@Entity
@Table(name = "system_logs")
@Getter @Setter
public class SystemLog {

    @Id @Column(length = 36)
    private String id;

    private String level;
    private String message;

    @Column(name = "user_name")
    private String userName;

    @Column(name = "user_id", length = 36)
    private String userId;

    private String action;

    @Column(name = "org_id", length = 36)
    private String orgId;

    @Column(name = "branch_id", length = 36)
    private String branchId;

    @Column(name = "target_type")
    private String targetType;

    @Column(name = "target_id", length = 100)
    private String targetId;

    @Column(name = "created_at")
    private Instant createdAt;
}
