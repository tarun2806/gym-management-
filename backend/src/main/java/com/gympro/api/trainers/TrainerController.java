package com.gympro.api.trainers;

import com.gympro.api.auth.OrgContextService;
import com.gympro.api.model.OrganizationMembership;
import com.gympro.api.model.Trainer;
import com.gympro.api.repository.TrainerRepository;
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
@RequestMapping("/api/trainers")
public class TrainerController {

    private final TrainerRepository trainerRepository;
    private final OrgContextService orgContext;

    public TrainerController(TrainerRepository trainerRepository, OrgContextService orgContext) {
        this.trainerRepository = trainerRepository;
        this.orgContext = orgContext;
    }

    @GetMapping
    public List<Trainer> list(@RequestHeader("X-Org-Id") String orgId) {
        OrganizationMembership m = orgContext.requireOps(orgId);
        String branch = orgContext.readBranchScope(m);
        return branch != null
                ? trainerRepository.findByOrganizationIdAndBranchId(orgId, branch)
                : trainerRepository.findByOrganizationId(orgId);
    }

    @GetMapping("/{id}")
    public Trainer get(@RequestHeader("X-Org-Id") String orgId, @PathVariable String id) {
        OrganizationMembership m = orgContext.requireOps(orgId);
        return trainerRepository.findById(id)
                .filter(t -> t.getOrganizationId().equals(orgId))
                .filter(t -> orgContext.canSeeBranch(m, t.getBranchId()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    @PostMapping
    public Trainer create(@RequestHeader("X-Org-Id") String orgId, @RequestBody Map<String, Object> body) {
        OrganizationMembership m = orgContext.requireRole(orgId, "org_owner", "org_admin", "branch_manager");
        Trainer t = new Trainer();
        t.setId(UUID.randomUUID().toString());
        t.setOrganizationId(orgId);
        t.setBranchId(orgContext.resolveBranchId(orgId, m, body.get("branch_id")));
        t.setName(str(body, "name"));
        t.setEmail(str(body, "email"));
        t.setPhone(str(body, "phone"));
        t.setSpecialization(str(body, "specialization"));
        t.setExperience(str(body, "experience"));
        t.setRating(decimal(body, "rating"));
        t.setHourlyRate(decimal(body, "hourly_rate"));
        t.setStatus(strOr(body, "status", "Active"));
        t.setLocation(str(body, "location"));
        t.setBio(str(body, "bio"));
        t.setCreatedAt(Instant.now());
        if (t.getName() == null || t.getName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "name is required");
        }
        return trainerRepository.save(t);
    }

    @PutMapping("/{id}")
    public Trainer update(@RequestHeader("X-Org-Id") String orgId,
                          @PathVariable String id,
                          @RequestBody Map<String, Object> body) {
        OrganizationMembership m = orgContext.requireRole(orgId, "org_owner", "org_admin", "branch_manager");
        Trainer t = trainerRepository.findById(id)
                .filter(x -> x.getOrganizationId().equals(orgId))
                .filter(x -> orgContext.canSeeBranch(m, x.getBranchId()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        apply(t, body);
        return trainerRepository.save(t);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@RequestHeader("X-Org-Id") String orgId, @PathVariable String id) {
        OrganizationMembership m = orgContext.requireRole(orgId, "org_owner", "org_admin");
        Trainer t = trainerRepository.findById(id)
                .filter(x -> x.getOrganizationId().equals(orgId))
                .filter(x -> orgContext.canSeeBranch(m, x.getBranchId()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        trainerRepository.delete(t);
        return ResponseEntity.noContent().build();
    }

    private void apply(Trainer t, Map<String, Object> body) {
        if (body.containsKey("name")) t.setName(str(body, "name"));
        if (body.containsKey("email")) t.setEmail(str(body, "email"));
        if (body.containsKey("phone")) t.setPhone(str(body, "phone"));
        if (body.containsKey("specialization")) t.setSpecialization(str(body, "specialization"));
        if (body.containsKey("experience")) t.setExperience(str(body, "experience"));
        if (body.containsKey("rating")) t.setRating(decimal(body, "rating"));
        if (body.containsKey("hourly_rate")) t.setHourlyRate(decimal(body, "hourly_rate"));
        if (body.containsKey("status")) t.setStatus(str(body, "status"));
        if (body.containsKey("location")) t.setLocation(str(body, "location"));
        if (body.containsKey("bio")) t.setBio(str(body, "bio"));
    }

    private static String str(Map<String, Object> b, String k) {
        Object v = b.get(k);
        return v != null ? v.toString() : null;
    }

    private static String strOr(Map<String, Object> b, String k, String def) {
        String v = str(b, k);
        return v != null && !v.isBlank() ? v : def;
    }

    private static BigDecimal decimal(Map<String, Object> b, String k) {
        String v = str(b, k);
        if (v == null || v.isBlank()) return null;
        try {
            return new BigDecimal(v);
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
