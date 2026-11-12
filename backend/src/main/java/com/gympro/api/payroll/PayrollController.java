package com.gympro.api.payroll;

import com.gympro.api.auth.OrgContextService;
import com.gympro.api.model.OrganizationMembership;
import com.gympro.api.model.PayrollEntry;
import com.gympro.api.repository.PayrollEntryRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/payroll")
public class PayrollController {

    private final PayrollEntryRepository payrollRepository;
    private final OrgContextService orgContext;

    public PayrollController(PayrollEntryRepository payrollRepository, OrgContextService orgContext) {
        this.payrollRepository = payrollRepository;
        this.orgContext = orgContext;
    }

    @GetMapping
    public List<PayrollEntry> list(@RequestHeader("X-Org-Id") String orgId) {
        orgContext.requireMembership(orgId);
        return payrollRepository.findByOrganizationId(orgId);
    }

    /**
     * Create a payroll entry. The unique (employee_id, period_start, period_end)
     * constraint makes double-processing impossible at the DB level.
     */
    @PostMapping
    @Transactional
    public PayrollEntry create(@RequestHeader("X-Org-Id") String orgId, @RequestBody Map<String, Object> body) {
        orgContext.requireRole(orgId, "org_owner", "org_admin");
        LocalDate start = date(body, "period_start");
        LocalDate end = date(body, "period_end");
        String employeeId = str(body, "employee_id");
        if (start == null || end == null || employeeId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "employee_id, period_start, period_end required");
        }
        if (payrollRepository.findByEmployeeIdAndPeriodStartAndPeriodEnd(employeeId, start, end).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Payroll already exists for this period");
        }

        PayrollEntry e = new PayrollEntry();
        e.setId(UUID.randomUUID().toString());
        e.setOrganizationId(orgId);
        e.setBranchId(body.get("branch_id") != null ? body.get("branch_id").toString() : null);
        e.setEmployeeId(employeeId);
        e.setEmployeeName(str(body, "employee_name"));
        e.setEmployeeType(strOr(body, "employee_type", "staff"));
        e.setPeriodStart(start);
        e.setPeriodEnd(end);
        e.setBaseSalary(dec(body, "base_salary"));
        e.setCommission(dec(body, "commission"));
        e.setBonuses(dec(body, "bonuses"));
        e.setDeductions(dec(body, "deductions"));
        e.setNetPay(e.getBaseSalary().add(e.getCommission()).add(e.getBonuses()).subtract(e.getDeductions()));
        e.setStatus("draft");
        e.setCreatedAt(Instant.now());
        try {
            return payrollRepository.save(e);
        } catch (DataIntegrityViolationException ex) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Payroll already exists for this period");
        }
    }

    /** Mark processed/paid — owner/admin only; paid entries are immutable. */
    @PatchMapping("/{id}/status")
    public PayrollEntry setStatus(@RequestHeader("X-Org-Id") String orgId,
                                  @PathVariable String id,
                                  @RequestBody Map<String, Object> body) {
        orgContext.requireRole(orgId, "org_owner", "org_admin");
        PayrollEntry e = payrollRepository.findById(id)
                .filter(x -> x.getOrganizationId().equals(orgId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if ("paid".equals(e.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Payroll already paid");
        }
        String status = str(body, "status");
        if (!List.of("processed", "paid").contains(status)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "invalid status");
        }
        e.setStatus(status);
        if ("processed".equals(status)) e.setProcessedAt(Instant.now());
        if ("paid".equals(status)) e.setPaidAt(Instant.now());
        return payrollRepository.save(e);
    }

    private static String str(Map<String, Object> b, String k) {
        Object v = b.get(k);
        return v != null ? v.toString() : null;
    }

    private static String strOr(Map<String, Object> b, String k, String def) {
        String v = str(b, k);
        return v != null && !v.isBlank() ? v : def;
    }

    private static BigDecimal dec(Map<String, Object> b, String k) {
        String v = str(b, k);
        if (v == null || v.isBlank()) return BigDecimal.ZERO;
        try {
            return new BigDecimal(v);
        } catch (NumberFormatException e) {
            return BigDecimal.ZERO;
        }
    }

    private static LocalDate date(Map<String, Object> b, String k) {
        String v = str(b, k);
        return v != null && !v.isBlank() ? LocalDate.parse(v) : null;
    }
}
