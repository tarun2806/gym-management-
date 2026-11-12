package com.gympro.api.pt;

import com.gympro.api.auth.OrgContextService;
import com.gympro.api.model.OrganizationMembership;
import com.gympro.api.model.PtPackage;
import com.gympro.api.model.PtSession;
import com.gympro.api.repository.PtPackageRepository;
import com.gympro.api.repository.PtSessionRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class PtController {

    private final PtPackageRepository packageRepository;
    private final PtSessionRepository sessionRepository;
    private final OrgContextService orgContext;

    public PtController(PtPackageRepository packageRepository,
                        PtSessionRepository sessionRepository,
                        OrgContextService orgContext) {
        this.packageRepository = packageRepository;
        this.sessionRepository = sessionRepository;
        this.orgContext = orgContext;
    }

    // ─── Packages ────────────────────────────────────────────────────────────

    @GetMapping("/pt-packages")
    public List<PtPackage> listPackages(@RequestHeader("X-Org-Id") String orgId) {
        orgContext.requireMembership(orgId);
        return packageRepository.findByOrganizationId(orgId);
    }

    @PostMapping("/pt-packages")
    public PtPackage createPackage(@RequestHeader("X-Org-Id") String orgId, @RequestBody Map<String, Object> body) {
        OrganizationMembership m = orgContext.requireRole(orgId, "org_owner", "org_admin", "branch_manager");
        PtPackage p = new PtPackage();
        p.setId(UUID.randomUUID().toString());
        p.setOrganizationId(orgId);
        p.setBranchId(body.get("branch_id") != null ? body.get("branch_id").toString() : m.getBranchId());
        p.setName(str(body, "name"));
        p.setDescription(str(body, "description"));
        p.setSessions(intVal(body, "sessions"));
        p.setPrice(dec(body, "price"));
        p.setDurationDays(intVal(body, "duration_days"));
        p.setStatus(strOr(body, "status", "active"));
        p.setCreatedAt(Instant.now());
        if (p.getName() == null || p.getName().isBlank() || p.getPrice() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "name and price are required");
        }
        return packageRepository.save(p);
    }

    @PutMapping("/pt-packages/{id}")
    public PtPackage updatePackage(@RequestHeader("X-Org-Id") String orgId,
                                   @PathVariable String id,
                                   @RequestBody Map<String, Object> body) {
        orgContext.requireRole(orgId, "org_owner", "org_admin", "branch_manager");
        PtPackage p = packageRepository.findById(id)
                .filter(x -> x.getOrganizationId().equals(orgId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (body.containsKey("name")) p.setName(str(body, "name"));
        if (body.containsKey("description")) p.setDescription(str(body, "description"));
        if (body.containsKey("sessions")) p.setSessions(intVal(body, "sessions"));
        if (body.containsKey("price")) p.setPrice(dec(body, "price"));
        if (body.containsKey("duration_days")) p.setDurationDays(intVal(body, "duration_days"));
        if (body.containsKey("status")) p.setStatus(str(body, "status"));
        return packageRepository.save(p);
    }

    // ─── Sessions ────────────────────────────────────────────────────────────

    @GetMapping("/pt-sessions")
    public List<PtSession> listSessions(@RequestHeader("X-Org-Id") String orgId,
                                        @RequestParam(required = false) String date) {
        orgContext.requireMembership(orgId);
        if (date != null) {
            return sessionRepository.findByOrganizationIdAndScheduledDate(orgId, LocalDate.parse(date));
        }
        return sessionRepository.findByOrganizationId(orgId);
    }

    @PostMapping("/pt-sessions")
    public PtSession createSession(@RequestHeader("X-Org-Id") String orgId, @RequestBody Map<String, Object> body) {
        OrganizationMembership m = orgContext.requireRole(orgId,
                "org_owner", "org_admin", "branch_manager", "staff", "trainer");
        PtSession s = new PtSession();
        s.setId(UUID.randomUUID().toString());
        s.setOrganizationId(orgId);
        s.setBranchId(body.get("branch_id") != null ? body.get("branch_id").toString() : m.getBranchId());
        s.setPackageId(str(body, "package_id"));
        s.setMemberId(str(body, "member_id"));
        s.setTrainerId(str(body, "trainer_id"));
        s.setScheduledDate(date(body, "scheduled_date"));
        s.setScheduledTime(str(body, "scheduled_time"));
        s.setNotes(str(body, "notes"));
        s.setStatus("scheduled");
        s.setCreatedAt(Instant.now());
        if (s.getMemberId() == null || s.getTrainerId() == null || s.getScheduledDate() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "member_id, trainer_id, scheduled_date are required");
        }
        return sessionRepository.save(s);
    }

    @PatchMapping("/pt-sessions/{id}/status")
    public PtSession setSessionStatus(@RequestHeader("X-Org-Id") String orgId,
                                      @PathVariable String id,
                                      @RequestBody Map<String, Object> body) {
        orgContext.requireRole(orgId, "org_owner", "org_admin", "branch_manager", "staff", "trainer");
        PtSession s = sessionRepository.findById(id)
                .filter(x -> x.getOrganizationId().equals(orgId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        String status = str(body, "status");
        if (!List.of("scheduled", "completed", "cancelled", "no_show").contains(status)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "invalid status");
        }
        s.setStatus(status);
        if ("completed".equals(status)) s.setCompletedAt(Instant.now());
        return sessionRepository.save(s);
    }

    private static String str(Map<String, Object> b, String k) {
        Object v = b.get(k);
        return v != null ? v.toString() : null;
    }

    private static String strOr(Map<String, Object> b, String k, String def) {
        String v = str(b, k);
        return v != null && !v.isBlank() ? v : def;
    }

    private static Integer intVal(Map<String, Object> b, String k) {
        String v = str(b, k);
        if (v == null || v.isBlank()) return null;
        try {
            return Integer.parseInt(v);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private static BigDecimal dec(Map<String, Object> b, String k) {
        String v = str(b, k);
        if (v == null || v.isBlank()) return null;
        try {
            return new BigDecimal(v);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private static LocalDate date(Map<String, Object> b, String k) {
        String v = str(b, k);
        return v != null && !v.isBlank() ? LocalDate.parse(v) : null;
    }
}
