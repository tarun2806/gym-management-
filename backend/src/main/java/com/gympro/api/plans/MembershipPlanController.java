package com.gympro.api.plans;

import com.gympro.api.auth.OrgContextService;
import com.gympro.api.model.MembershipPlan;
import com.gympro.api.model.OrganizationMembership;
import com.gympro.api.repository.MembershipPlanRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/membership-plans")
public class MembershipPlanController {

    private final MembershipPlanRepository planRepository;
    private final OrgContextService orgContext;

    public MembershipPlanController(MembershipPlanRepository planRepository, OrgContextService orgContext) {
        this.planRepository = planRepository;
        this.orgContext = orgContext;
    }

    @GetMapping
    public List<MembershipPlan> list(@RequestHeader("X-Org-Id") String orgId) {
        orgContext.requirePlanAdmin(orgId);
        return planRepository.findByOrganizationId(orgId);
    }

    @PostMapping
    public MembershipPlan create(@RequestHeader("X-Org-Id") String orgId, @RequestBody Map<String, Object> body) {
        orgContext.requireRole(orgId, "org_owner", "org_admin");
        MembershipPlan p = new MembershipPlan();
        p.setId(UUID.randomUUID().toString());
        p.setOrganizationId(orgId);
        p.setName(str(body, "name"));
        p.setPrice(price(body));
        p.setDuration(str(body, "duration"));
        p.setFeatures(str(body, "features"));
        p.setStatus(strOr(body, "status", "active"));
        p.setCreatedAt(Instant.now());
        if (p.getName() == null || p.getName().isBlank() || p.getPrice() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "name and price are required");
        }
        return planRepository.save(p);
    }

    @PutMapping("/{id}")
    public MembershipPlan update(@RequestHeader("X-Org-Id") String orgId,
                                 @PathVariable String id,
                                 @RequestBody Map<String, Object> body) {
        orgContext.requireRole(orgId, "org_owner", "org_admin");
        MembershipPlan p = planRepository.findById(id)
                .filter(x -> x.getOrganizationId().equals(orgId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (body.containsKey("name")) p.setName(str(body, "name"));
        if (body.containsKey("price")) p.setPrice(price(body));
        if (body.containsKey("duration")) p.setDuration(str(body, "duration"));
        if (body.containsKey("features")) p.setFeatures(str(body, "features"));
        if (body.containsKey("status")) p.setStatus(str(body, "status"));
        return planRepository.save(p);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@RequestHeader("X-Org-Id") String orgId, @PathVariable String id) {
        orgContext.requireRole(orgId, "org_owner", "org_admin");
        MembershipPlan p = planRepository.findById(id)
                .filter(x -> x.getOrganizationId().equals(orgId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        planRepository.delete(p);
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

    private static BigDecimal price(Map<String, Object> b) {
        String v = str(b, "price");
        if (v == null || v.isBlank()) return null;
        try {
            return new BigDecimal(v);
        } catch (NumberFormatException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "invalid price");
        }
    }
}
