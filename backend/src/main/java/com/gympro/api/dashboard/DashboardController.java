package com.gympro.api.dashboard;

import com.gympro.api.auth.OrgContextService;
import com.gympro.api.repository.*;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;

/**
 * Dashboard aggregates — server-side counts/sums so the frontend never
 * downloads whole collections (replaces the Firestore getCountFromServer
 * pattern with plain SQL aggregates).
 */
@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final MemberRepository memberRepository;
    private final TrainerRepository trainerRepository;
    private final GymClassRepository classRepository;
    private final AttendanceRepository attendanceRepository;
    private final PaymentRepository paymentRepository;
    private final EquipmentRepository equipmentRepository;
    private final OrgContextService orgContext;

    public DashboardController(MemberRepository memberRepository,
                               TrainerRepository trainerRepository,
                               GymClassRepository classRepository,
                               AttendanceRepository attendanceRepository,
                               PaymentRepository paymentRepository,
                               EquipmentRepository equipmentRepository,
                               OrgContextService orgContext) {
        this.memberRepository = memberRepository;
        this.trainerRepository = trainerRepository;
        this.classRepository = classRepository;
        this.attendanceRepository = attendanceRepository;
        this.paymentRepository = paymentRepository;
        this.equipmentRepository = equipmentRepository;
        this.orgContext = orgContext;
    }

    @GetMapping
    public Map<String, Object> summary(@RequestHeader("X-Org-Id") String orgId) {
        orgContext.requireMembership(orgId);
        LocalDate today = LocalDate.now();
        LocalDateTime dayStart = today.atStartOfDay();
        LocalDateTime dayEnd = today.plusDays(1).atStartOfDay();

        long totalMembers = memberRepository.countByOrganizationId(orgId);
        long activeMembers = memberRepository
                .findByOrganizationIdAndStatus(orgId, "Active").size();
        long trainers = trainerRepository.findByOrganizationId(orgId).size();
        long classes = classRepository.findByOrganizationId(orgId).size();
        long attendanceToday = attendanceRepository
                .findInRange(orgId, dayStart, dayEnd).size();
        long equipment = equipmentRepository.findByOrganizationId(orgId).size();

        LocalDate monthStart = today.withDayOfMonth(1);
        var payments = paymentRepository
                .findByOrganizationIdOrderByCreatedAtDesc(orgId,
                        org.springframework.data.domain.PageRequest.of(0, 1000))
                .getContent();
        java.math.BigDecimal monthRevenue = payments.stream()
                .filter(p -> p.getCreatedAt() != null
                        && !p.getCreatedAt().isBefore(monthStart.atStartOfDay().atZone(java.time.ZoneId.systemDefault()).toInstant())
                        && "completed".equals(p.getStatus()))
                .map(p -> p.getAmount() != null ? p.getAmount() : java.math.BigDecimal.ZERO)
                .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);

        return Map.of(
                "total_members", totalMembers,
                "active_members", activeMembers,
                "trainers", trainers,
                "classes", classes,
                "attendance_today", attendanceToday,
                "equipment", equipment,
                "monthly_revenue", monthRevenue);
    }
}
