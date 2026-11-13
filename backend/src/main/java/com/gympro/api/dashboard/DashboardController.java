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
        com.gympro.api.model.OrganizationMembership m = orgContext.requireRole(orgId,
                "platform_admin", "org_owner", "org_admin", "branch_manager", "staff", "trainer");
        String branch = orgContext.readBranchScope(m);
        LocalDate today = LocalDate.now();
        LocalDateTime dayStart = today.atStartOfDay();
        LocalDateTime dayEnd = today.plusDays(1).atStartOfDay();

        long totalMembers;
        long activeMembers;
        long trainers;
        long classes;
        long attendanceToday;
        long equipment;
        if (branch != null) {
            totalMembers = memberRepository.countByOrganizationIdAndBranchId(orgId, branch);
            activeMembers = memberRepository
                    .findByOrganizationIdAndBranchIdAndStatus(orgId, branch, "Active").size();
            trainers = trainerRepository.findByOrganizationIdAndBranchId(orgId, branch).size();
            classes = classRepository.findByOrganizationIdAndBranchId(orgId, branch).size();
            attendanceToday = attendanceRepository
                    .findInRange(orgId, dayStart, dayEnd).stream()
                    .filter(a -> branch.equals(a.getBranchId())).count();
            equipment = equipmentRepository.findByOrganizationIdAndBranchId(orgId, branch).size();
        } else {
            totalMembers = memberRepository.countByOrganizationId(orgId);
            activeMembers = memberRepository
                    .findByOrganizationIdAndStatus(orgId, "Active").size();
            trainers = trainerRepository.findByOrganizationId(orgId).size();
            classes = classRepository.findByOrganizationId(orgId).size();
            attendanceToday = attendanceRepository
                    .findInRange(orgId, dayStart, dayEnd).size();
            equipment = equipmentRepository.findByOrganizationId(orgId).size();
        }

        java.util.Map<String, Object> out = new java.util.LinkedHashMap<>();
        out.put("total_members", totalMembers);
        out.put("active_members", activeMembers);
        out.put("trainers", trainers);
        out.put("classes", classes);
        out.put("attendance_today", attendanceToday);
        out.put("equipment", equipment);
        // Revenue is finance data — owner/admin only, matching the
        // payments/payroll/expenses endpoints.
        if (java.util.Arrays.asList(OrgContextService.FINANCE_ROLES).contains(m.getRole())) {
            LocalDate monthStart = today.withDayOfMonth(1);
            var payments = paymentRepository
                    .findByOrganizationIdOrderByCreatedAtDesc(orgId,
                            org.springframework.data.domain.PageRequest.of(0, 1000))
                    .getContent().stream()
                    .filter(p -> branch == null || branch.equals(p.getBranchId()))
                    .toList();
            java.math.BigDecimal monthRevenue = payments.stream()
                    .filter(p -> p.getCreatedAt() != null
                            && !p.getCreatedAt().isBefore(monthStart.atStartOfDay().atZone(java.time.ZoneId.systemDefault()).toInstant())
                            && "completed".equals(p.getStatus()))
                    .map(p -> p.getAmount() != null ? p.getAmount() : java.math.BigDecimal.ZERO)
                    .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);
            out.put("monthly_revenue", monthRevenue);
        }
        return out;
    }
}
