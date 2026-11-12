package com.gympro.api.payments;

import com.gympro.api.auth.OrgContextService;
import com.gympro.api.model.OrganizationMembership;
import com.gympro.api.model.Payment;
import com.gympro.api.repository.PaymentRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Member-payment records. Razorpay order/verify/webhook endpoints live in
 * PaymentGatewayController — this controller handles manual/offline payments
 * recorded by staff.
 */
@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentRepository paymentRepository;
    private final OrgContextService orgContext;

    public PaymentController(PaymentRepository paymentRepository, OrgContextService orgContext) {
        this.paymentRepository = paymentRepository;
        this.orgContext = orgContext;
    }

    @GetMapping
    public List<Payment> list(@RequestHeader("X-Org-Id") String orgId,
                              @RequestParam(defaultValue = "0") int page,
                              @RequestParam(defaultValue = "20") int size) {
        orgContext.requireMembership(orgId);
        return paymentRepository
                .findByOrganizationIdOrderByCreatedAtDesc(orgId,
                        PageRequest.of(page, size, Sort.by("createdAt").descending()))
                .getContent();
    }

    @GetMapping("/{id}")
    public Payment get(@RequestHeader("X-Org-Id") String orgId, @PathVariable String id) {
        orgContext.requireMembership(orgId);
        return paymentRepository.findById(id)
                .filter(p -> p.getOrganizationId().equals(orgId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    @PostMapping
    public Payment create(@RequestHeader("X-Org-Id") String orgId,
                          @RequestBody Map<String, Object> body) {
        OrganizationMembership m = orgContext.requireRole(orgId,
                "org_owner", "org_admin", "branch_manager", "staff");
        Payment p = new Payment();
        p.setId(UUID.randomUUID().toString());
        p.setOrganizationId(orgId);
        p.setBranchId(body.get("branch_id") != null ? body.get("branch_id").toString() : m.getBranchId());
        p.setMemberId(str(body, "member_id"));
        p.setAmount(amount(body));
        p.setType(strOr(body, "type", "membership"));
        p.setStatus(strOr(body, "status", "completed"));
        p.setNote(str(body, "note"));
        p.setPlanId(str(body, "plan_id"));
        p.setPlanName(str(body, "plan_name"));
        p.setPeriodStart(date(body, "period_start"));
        p.setPeriodEnd(date(body, "period_end"));
        p.setCreatedAt(Instant.now());
        if (p.getAmount() == null || p.getAmount().signum() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "amount must be positive");
        }
        return paymentRepository.save(p);
    }

    /** Status transitions are restricted — members/staff cannot mark arbitrary states. */
    @PatchMapping("/{id}/status")
    public Payment updateStatus(@RequestHeader("X-Org-Id") String orgId,
                                @PathVariable String id,
                                @RequestBody Map<String, Object> body) {
        orgContext.requireRole(orgId, "org_owner", "org_admin");
        Payment p = paymentRepository.findById(id)
                .filter(x -> x.getOrganizationId().equals(orgId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        String status = str(body, "status");
        if (status == null || !List.of("completed", "pending", "failed", "refunded").contains(status)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "invalid status");
        }
        p.setStatus(status);
        return paymentRepository.save(p);
    }

    private static String str(Map<String, Object> b, String k) {
        Object v = b.get(k);
        return v != null ? v.toString() : null;
    }

    private static String strOr(Map<String, Object> b, String k, String def) {
        String v = str(b, k);
        return v != null && !v.isBlank() ? v : def;
    }

    private static BigDecimal amount(Map<String, Object> b) {
        Object v = b.get("amount");
        if (v == null) return null;
        try {
            return new BigDecimal(v.toString());
        } catch (NumberFormatException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "invalid amount");
        }
    }

    private static LocalDate date(Map<String, Object> b, String k) {
        String v = str(b, k);
        return v != null && !v.isBlank() ? LocalDate.parse(v) : null;
    }
}
