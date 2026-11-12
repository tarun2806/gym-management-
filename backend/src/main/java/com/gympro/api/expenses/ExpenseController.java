package com.gympro.api.expenses;

import com.gympro.api.auth.OrgContextService;
import com.gympro.api.model.Expense;
import com.gympro.api.model.OrganizationMembership;
import com.gympro.api.repository.ExpenseRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/expenses")
public class ExpenseController {

    private final ExpenseRepository expenseRepository;
    private final OrgContextService orgContext;

    public ExpenseController(ExpenseRepository expenseRepository, OrgContextService orgContext) {
        this.expenseRepository = expenseRepository;
        this.orgContext = orgContext;
    }

    @GetMapping
    public List<Expense> list(@RequestHeader("X-Org-Id") String orgId) {
        OrganizationMembership m = orgContext.requireMembership(orgId);
        String branch = orgContext.readBranchScope(m);
        return branch != null
                ? expenseRepository.findByOrganizationIdAndBranchId(orgId, branch)
                : expenseRepository.findByOrganizationId(orgId);
    }

    @PostMapping
    public Expense create(@RequestHeader("X-Org-Id") String orgId, @RequestBody Map<String, Object> body) {
        OrganizationMembership m = orgContext.requireRole(orgId, "org_owner", "org_admin", "branch_manager", "staff");
        Expense e = new Expense();
        e.setId(UUID.randomUUID().toString());
        e.setOrganizationId(orgId);
        e.setBranchId(orgContext.resolveBranchId(orgId, m, body.get("branch_id")));
        e.setCategory(str(body, "category"));
        e.setDescription(str(body, "description"));
        e.setAmount(amount(body));
        e.setDate(date(body, "date"));
        e.setPaymentMethod(str(body, "payment_method"));
        e.setVendor(str(body, "vendor"));
        e.setReceiptUrl(str(body, "receipt_url"));
        e.setStatus("pending");
        e.setCreatedAt(Instant.now());
        if (e.getAmount() == null || e.getAmount().signum() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "amount must be positive");
        }
        return expenseRepository.save(e);
    }

    /** Approve/reject — owner/admin only, records who approved. */
    @PatchMapping("/{id}/status")
    public Expense setStatus(@RequestHeader("X-Org-Id") String orgId,
                             @PathVariable String id,
                             @RequestBody Map<String, Object> body) {
        OrganizationMembership m = orgContext.requireRole(orgId, "org_owner", "org_admin");
        Expense e = expenseRepository.findById(id)
                .filter(x -> x.getOrganizationId().equals(orgId))
                .filter(x -> orgContext.canSeeBranch(m, x.getBranchId()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        String status = str(body, "status");
        if (!List.of("approved", "rejected", "pending").contains(status)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "invalid status");
        }
        e.setStatus(status);
        if ("approved".equals(status)) {
            e.setApprovedBy(orgContext.principal().uid());
            e.setApprovedAt(Instant.now());
        }
        return expenseRepository.save(e);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@RequestHeader("X-Org-Id") String orgId, @PathVariable String id) {
        OrganizationMembership m = orgContext.requireRole(orgId, "org_owner", "org_admin");
        Expense e = expenseRepository.findById(id)
                .filter(x -> x.getOrganizationId().equals(orgId))
                .filter(x -> orgContext.canSeeBranch(m, x.getBranchId()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        expenseRepository.delete(e);
        return ResponseEntity.noContent().build();
    }

    private static String str(Map<String, Object> b, String k) {
        Object v = b.get(k);
        return v != null ? v.toString() : null;
    }

    private static BigDecimal amount(Map<String, Object> b) {
        String v = str(b, "amount");
        if (v == null || v.isBlank()) return null;
        try {
            return new BigDecimal(v);
        } catch (NumberFormatException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "invalid amount");
        }
    }

    private static LocalDate date(Map<String, Object> b, String k) {
        String v = str(b, k);
        return v != null && !v.isBlank() ? LocalDate.parse(v) : null;
    }
}
