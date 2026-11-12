package com.gympro.api.billing;

import com.gympro.api.auth.OrgContextService;
import com.gympro.api.model.Invoice;
import com.gympro.api.model.OrganizationMembership;
import com.gympro.api.repository.InvoiceRepository;
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
@RequestMapping("/api/invoices")
public class InvoiceController {

    private final InvoiceRepository invoiceRepository;
    private final OrgContextService orgContext;

    public InvoiceController(InvoiceRepository invoiceRepository, OrgContextService orgContext) {
        this.invoiceRepository = invoiceRepository;
        this.orgContext = orgContext;
    }

    @GetMapping
    public List<Invoice> list(@RequestHeader("X-Org-Id") String orgId) {
        orgContext.requireMembership(orgId);
        return invoiceRepository.findByOrganizationId(orgId);
    }

    @PostMapping
    public Invoice create(@RequestHeader("X-Org-Id") String orgId, @RequestBody Map<String, Object> body) {
        OrganizationMembership m = orgContext.requireRole(orgId, "org_owner", "org_admin", "branch_manager", "staff");
        String number = str(body, "invoice_number");
        if (number == null || number.isBlank()) {
            number = "INV-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        }
        if (invoiceRepository.findByOrganizationIdAndInvoiceNumber(orgId, number).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Invoice number already exists");
        }
        Invoice i = new Invoice();
        i.setId(UUID.randomUUID().toString());
        i.setOrganizationId(orgId);
        i.setBranchId(body.get("branch_id") != null ? body.get("branch_id").toString() : m.getBranchId());
        i.setInvoiceNumber(number);
        i.setMemberId(str(body, "member_id"));
        i.setAmount(amount(body));
        i.setStatus(strOr(body, "status", "draft"));
        i.setDueDate(date(body, "due_date"));
        i.setIssuedDate(date(body, "issued_date"));
        i.setItems(str(body, "items"));
        i.setSubtotal(dec(body, "subtotal"));
        i.setTax(dec(body, "tax"));
        i.setTotal(dec(body, "total"));
        i.setNotes(str(body, "notes"));
        i.setCreatedAt(Instant.now());
        return invoiceRepository.save(i);
    }

    @PatchMapping("/{id}/status")
    public Invoice setStatus(@RequestHeader("X-Org-Id") String orgId,
                             @PathVariable String id,
                             @RequestBody Map<String, Object> body) {
        orgContext.requireRole(orgId, "org_owner", "org_admin", "branch_manager", "staff");
        Invoice i = invoiceRepository.findById(id)
                .filter(x -> x.getOrganizationId().equals(orgId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        String status = str(body, "status");
        if (!List.of("draft", "sent", "paid", "overdue", "voided").contains(status)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "invalid status");
        }
        i.setStatus(status);
        if ("paid".equals(status)) i.setPaidDate(LocalDate.now());
        return invoiceRepository.save(i);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@RequestHeader("X-Org-Id") String orgId, @PathVariable String id) {
        orgContext.requireRole(orgId, "org_owner", "org_admin");
        Invoice i = invoiceRepository.findById(id)
                .filter(x -> x.getOrganizationId().equals(orgId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if ("paid".equals(i.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Cannot delete a paid invoice");
        }
        invoiceRepository.delete(i);
        return ResponseEntity.noContent().build();
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
        String v = str(b, "amount");
        if (v == null || v.isBlank()) return BigDecimal.ZERO;
        try {
            return new BigDecimal(v);
        } catch (NumberFormatException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "invalid amount");
        }
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
