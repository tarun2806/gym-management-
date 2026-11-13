package com.gympro.api.org;

import com.gympro.api.auth.OrgContextService;
import com.gympro.api.model.Branch;
import com.gympro.api.model.Organization;
import com.gympro.api.model.OrganizationMembership;
import com.gympro.api.repository.BranchRepository;
import com.gympro.api.repository.OrganizationMembershipRepository;
import com.gympro.api.repository.OrganizationRepository;
import com.gympro.api.repository.UserRepository;
import com.gympro.api.security.AppUserPrincipal;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class OrgController {

    private final OrganizationRepository organizationRepository;
    private final BranchRepository branchRepository;
    private final OrganizationMembershipRepository membershipRepository;
    private final UserRepository userRepository;
    private final OrgContextService orgContext;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public OrgController(OrganizationRepository organizationRepository,
                         BranchRepository branchRepository,
                         OrganizationMembershipRepository membershipRepository,
                         UserRepository userRepository,
                         OrgContextService orgContext) {
        this.organizationRepository = organizationRepository;
        this.branchRepository = branchRepository;
        this.membershipRepository = membershipRepository;
        this.userRepository = userRepository;
        this.orgContext = orgContext;
    }

    /** Orgs the caller belongs to (drives the org switcher). Platform admins see all. */
    @GetMapping("/organizations")
    public List<Organization> myOrganizations() {
        AppUserPrincipal p = orgContext.principal();
        boolean platformAdmin = p.memberships().stream()
                .anyMatch(m -> "platform_admin".equals(m.role()));
        if (platformAdmin) {
            return organizationRepository.findAll();
        }
        List<String> orgIds = p.memberships().stream()
                .map(AppUserPrincipal.OrgMembershipView::organizationId).distinct().toList();
        return organizationRepository.findAllById(orgIds);
    }

    @GetMapping("/organizations/{orgId}/branches")
    public List<Branch> branches(@PathVariable String orgId) {
        orgContext.requireMembership(orgId);
        return branchRepository.findByOrganizationId(orgId);
    }

    @PostMapping("/organizations/{orgId}/branches")
    public Branch createBranch(@PathVariable String orgId, @RequestBody Map<String, Object> body) {
        orgContext.requireRole(orgId, "org_owner", "org_admin");
        Branch b = new Branch();
        b.setId(java.util.UUID.randomUUID().toString());
        b.setOrganizationId(orgId);
        b.setName(String.valueOf(body.getOrDefault("name", "")));
        b.setAddress(body.get("address") != null ? body.get("address").toString() : null);
        b.setManagerId(body.get("manager_id") != null ? body.get("manager_id").toString() : null);
        b.setStatus("active");
        if (b.getName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "name is required");
        }
        return branchRepository.save(b);
    }

    @PutMapping("/organizations/{orgId}/branches/{branchId}")
    public Branch updateBranch(@PathVariable String orgId,
                               @PathVariable String branchId,
                               @RequestBody Map<String, Object> body) {
        orgContext.requireRole(orgId, "org_owner", "org_admin");
        Branch b = branchRepository.findById(branchId)
                .filter(x -> x.getOrganizationId().equals(orgId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (body.containsKey("name")) b.setName(String.valueOf(body.get("name")));
        if (body.containsKey("address")) b.setAddress(str(body, "address"));
        if (body.containsKey("manager_id")) b.setManagerId(str(body, "manager_id"));
        if (body.containsKey("status")) b.setStatus(str(body, "status"));
        if (body.containsKey("phone")) b.setPhone(str(body, "phone"));
        if (body.containsKey("capacity")) b.setCapacity(intVal(body, "capacity"));
        b.setUpdatedAt(Instant.now());
        return branchRepository.save(b);
    }

    @DeleteMapping("/organizations/{orgId}/branches/{branchId}")
    public org.springframework.http.ResponseEntity<Void> deleteBranch(@PathVariable String orgId,
                                                                     @PathVariable String branchId) {
        orgContext.requireRole(orgId, "org_owner", "org_admin");
        Branch b = branchRepository.findById(branchId)
                .filter(x -> x.getOrganizationId().equals(orgId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        branchRepository.delete(b);
        return org.springframework.http.ResponseEntity.noContent().build();
    }

    // ─── Organization CRUD ───────────────────────────────────────────────────

    /** Create an org — platform admins only. Owner onboarding uses /api/owner/register. */
    @PostMapping("/organizations")
    @Transactional
    public Organization createOrganization(@RequestBody Map<String, Object> body) {
        AppUserPrincipal p = orgContext.principal();
        boolean platformAdmin = userRepository.findById(p.uid())
                .map(com.gympro.api.model.User::isPlatformAdmin).orElse(false);
        if (!platformAdmin) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Organization creation requires an owner activation key — use /api/owner/register");
        }
        String name = str(body, "name");
        if (name == null || name.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "name is required");
        }
        String slug = str(body, "slug") != null ? str(body, "slug")
                : name.toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("^-|-$", "");
        if (organizationRepository.findById(slug).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "slug already exists");
        }

        Organization o = new Organization();
        o.setId(UUID.randomUUID().toString());
        o.setName(name);
        o.setSlug(slug);
        o.setOwnerId(p.uid());
        o.setStatus(strOr(body, "status", "active"));
        o.setSubscriptionTier(strOr(body, "subscription_tier", "free"));
        o.setMaxBranches(intVal(body, "max_branches"));
        o.setMaxMembers(intVal(body, "max_members"));
        Map<String, Object> settings = new java.util.LinkedHashMap<>();
        for (String k : List.of("gym_name", "address", "phone", "open_time", "close_time", "capacity")) {
            if (body.get(k) != null) settings.put(k, body.get(k));
        }
        try {
            o.setSettings(objectMapper.writeValueAsString(settings));
        } catch (Exception e) {
            o.setSettings(null);
        }
        o.setCreatedAt(Instant.now());
        o.setUpdatedAt(Instant.now());
        organizationRepository.save(o);

        OrganizationMembership m = new OrganizationMembership();
        m.setId(p.uid() + ":" + o.getId());
        m.setOrganizationId(o.getId());
        m.setUserId(p.uid());
        m.setRole("org_owner");
        m.setStatus("active");
        m.setJoinedAt(Instant.now());
        membershipRepository.save(m);
        return o;
    }

    @PutMapping("/organizations/{orgId}")
    public Organization updateOrganization(@PathVariable String orgId,
                                           @RequestBody Map<String, Object> body) {
        orgContext.requireRole(orgId, "org_owner", "org_admin");
        Organization o = organizationRepository.findById(orgId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (body.containsKey("name")) o.setName(String.valueOf(body.get("name")));
        if (body.containsKey("status")) o.setStatus(str(body, "status"));
        if (body.containsKey("subscription_tier")) o.setSubscriptionTier(str(body, "subscription_tier"));
        if (body.containsKey("max_branches")) o.setMaxBranches(intVal(body, "max_branches"));
        if (body.containsKey("max_members")) o.setMaxMembers(intVal(body, "max_members"));
        if (body.containsKey("settings")) {
            try {
                o.setSettings(objectMapper.writeValueAsString(body.get("settings")));
            } catch (Exception ignored) { }
        }
        // Flat gym_* fields also accepted for convenience.
        Map<String, Object> flat = new java.util.LinkedHashMap<>();
        for (String k : List.of("gym_name", "address", "phone", "open_time", "close_time", "capacity")) {
            if (body.containsKey(k)) flat.put(k, body.get(k));
        }
        if (!flat.isEmpty()) {
            try {
                com.fasterxml.jackson.databind.JsonNode existing = o.getSettings() != null
                        ? objectMapper.readTree(o.getSettings()) : objectMapper.createObjectNode();
                com.fasterxml.jackson.databind.node.ObjectNode node =
                        existing instanceof com.fasterxml.jackson.databind.node.ObjectNode on ? on
                                : objectMapper.createObjectNode();
                flat.forEach((k, v) -> node.set(k, objectMapper.valueToTree(v)));
                o.setSettings(objectMapper.writeValueAsString(node));
            } catch (Exception ignored) { }
        }
        o.setUpdatedAt(Instant.now());
        return organizationRepository.save(o);
    }

    /** Platform admin or org owner may delete (cascades handled at app level). */
    @DeleteMapping("/organizations/{orgId}")
    @Transactional
    public org.springframework.http.ResponseEntity<Void> deleteOrganization(@PathVariable String orgId) {
        AppUserPrincipal p = orgContext.principal();
        boolean platformAdmin = p.memberships().stream().anyMatch(m -> "platform_admin".equals(m.role()));
        boolean owner = p.memberships().stream()
                .anyMatch(m -> m.organizationId().equals(orgId) && "org_owner".equals(m.role()));
        if (!platformAdmin && !owner) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the owner or platform admin can delete");
        }
        organizationRepository.findById(orgId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        membershipRepository.findByOrganizationId(orgId).forEach(membershipRepository::delete);
        branchRepository.findByOrganizationId(orgId).forEach(branchRepository::delete);
        organizationRepository.deleteById(orgId);
        return org.springframework.http.ResponseEntity.noContent().build();
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
}
