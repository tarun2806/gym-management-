package com.gympro.api.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "equipment")
@Getter @Setter
public class Equipment {

    @Id @Column(length = 36)
    private String id;

    @Column(name = "organization_id", nullable = false, length = 36)
    private String organizationId;

    @Column(name = "branch_id", length = 36)
    private String branchId;

    @Column(nullable = false)
    private String name;

    private String type;
    private String brand;
    private String model;
    private String location;

    @Column(nullable = false, length = 30)
    private String status = "operational";

    @Column(name = "last_maintenance")
    private LocalDate lastMaintenance;

    @Column(name = "next_maintenance")
    private LocalDate nextMaintenance;

    @Column(name = "equipment_condition")
    private String equipmentCondition;

    @Column(name = "serial_number", length = 100)
    private String serialNumber;

    @Column(name = "purchase_date")
    private LocalDate purchaseDate;

    private String warranty;
    private String notes;

    @Column(name = "service_interval_days")
    private Integer serviceIntervalDays;

    @Column(name = "maintenance_log", columnDefinition = "json")
    private String maintenanceLog;

    @Column(name = "created_at")
    private Instant createdAt;
}
