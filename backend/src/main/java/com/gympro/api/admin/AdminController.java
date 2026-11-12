package com.gympro.api.admin;

import com.gympro.api.auth.OrgContextService;
import com.gympro.api.model.OrganizationMembership;
import com.gympro.api.model.User;
import com.gympro.api.repository.OrganizationMembershipRepository;
import com.gympro.api.model.SystemLog;
import com.gympro.api.repository.SystemLogRepository;
import com.gympro.api.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Org-scoped user/member administration. Membership role changes go through
 * organization_memberships (the authoritative source) — never self-service.
 */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final UserRepository userRepository;
    private final OrganizationMembershipRepository membershipRepository;
    private final SystemLogRepository systemLogRepository;
    private final OrgContextService orgContext;

    public AdminController(UserRepository userRepository,
                           OrganizationMembershipRepository membershipRepository,
                           SystemLogRepository systemLogRepository,
                           OrgContextService orgContext) {
        this.userRepository = userRepository;
        this.membershipRepository = membershipRepository;
        this.systemLogRepository = systemLogRepository;
        this.orgContext = orgContext;
    }

    /** List memberships (staff roster) for the org — owner/admin/manager. */
    @GetMapping("/memberships")
    public List<OrganizationMembership> memberships(@RequestHeader("X-Org-Id") String orgId) {
        orgContext.requireRole(orgId, "org_owner", "org_admin", "branch_manager");
        return membershipRepository.findByOrganizationId(orgId);
    }

    /** Change a member's org role — owner only for elevated roles. */
    @PatchMapping("/memberships/{membershipId}/role")
    public OrganizationMembership setRole(@RequestHeader("X-Org-Id") String orgId,
                                          @PathVariable String membershipId,
                                          @RequestBody Map<String, Object> body) {
        String newRole = String.valueOf(body.getOrDefault("role", ""));
        boolean elevated = List.of("org_owner", "org_admin").contains(newRole);
        orgContext.requireRole(orgId, elevated ? new String[]{"org_owner"} : new String[]{"org_owner", "org_admin"});

        OrganizationMembership m = membershipRepository.findById(membershipId)
                .filter(x -> x.getOrganizationId().equals(orgId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        m.setRole(newRole);
        return membershipRepository.save(m);
    }

    /** Suspend/reactivate a membership — owner/admin. */
    @PatchMapping("/memberships/{membershipId}/status")
    public OrganizationMembership setStatus(@RequestHeader("X-Org-Id") String orgId,
                                            @PathVariable String membershipId,
                                            @RequestBody Map<String, Object> body) {
        orgContext.requireRole(orgId, "org_owner", "org_admin");
        OrganizationMembership m = membershipRepository.findById(membershipId)
                .filter(x -> x.getOrganizationId().equals(orgId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        String status = String.valueOf(body.getOrDefault("status", ""));
        if (!List.of("active", "suspended", "pending").contains(status)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "invalid status");
        }
        m.setStatus(status);
        return membershipRepository.save(m);
    }

    /** User profile lookup — owner/admin only. */
    @GetMapping("/users/{userId}")
    public User user(@RequestHeader("X-Org-Id") String orgId, @PathVariable String userId) {
        orgContext.requireRole(orgId, "org_owner", "org_admin");
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    /** All users in the org with their membership role — admin roster. */
    @GetMapping("/users")
    public List<Map<String, Object>> users(@RequestHeader("X-Org-Id") String orgId) {
        orgContext.requireRole(orgId, "org_owner", "org_admin");
        List<OrganizationMembership> memberships = membershipRepository.findByOrganizationId(orgId);
        Map<String, OrganizationMembership> byUser = memberships.stream()
                .collect(java.util.stream.Collectors.toMap(
                        OrganizationMembership::getUserId, m -> m, (a, b) -> a));
        return userRepository.findAllById(byUser.keySet()).stream()
                .map(u -> {
                    Map<String, Object> row = new java.util.LinkedHashMap<>();
                    row.put("id", u.getId());
                    row.put("email", u.getEmail());
                    row.put("username", u.getUsername());
                    row.put("status", u.getStatus());
                    row.put("email_verified", u.isEmailVerified());
                    row.put("created_at", u.getCreatedAt());
                    OrganizationMembership m = byUser.get(u.getId());
                    if (m != null) {
                        row.put("role", m.getRole());
                        row.put("membership_id", m.getId());
                        row.put("membership_status", m.getStatus());
                    }
                    return row;
                })
                .toList();
    }

    /** Attach a user to the org with a role (after Firebase Auth creation). */
    @PostMapping("/memberships")
    public OrganizationMembership addMember(@RequestHeader("X-Org-Id") String orgId,
                                            @RequestBody Map<String, Object> body) {
        OrganizationMembership caller = orgContext.requireRole(orgId, "org_owner", "org_admin");
        String userId = str(body, "user_id");
        String role = strOr(body, "role", "staff");
        if (userId == null || userId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "user_id is required");
        }
        // Only owners may grant elevated roles.
        if (List.of("org_owner", "org_admin").contains(role) && !"org_owner".equals(caller.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the owner can assign elevated roles");
        }
        userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "user not found"));
        OrganizationMembership m = new OrganizationMembership();
        m.setId(userId + ":" + orgId);
        m.setOrganizationId(orgId);
        m.setUserId(userId);
        m.setBranchId(str(body, "branch_id"));
        m.setRole(role);
        m.setStatus("active");
        m.setJoinedAt(Instant.now());
        m.setInvitedBy(caller.getUserId());
        return membershipRepository.save(m);
    }

    /** Upsert a user profile (called after Firebase Auth account creation). */
    @PutMapping("/users/{userId}")
    public User upsertUser(@RequestHeader("X-Org-Id") String orgId,
                           @PathVariable String userId,
                           @RequestBody Map<String, Object> body) {
        orgContext.requireRole(orgId, "org_owner", "org_admin");
        User u = userRepository.findById(userId).orElseGet(() -> {
            User n = new User();
            n.setId(userId);
            n.setCreatedAt(Instant.now());
            return n;
        });
        if (body.get("email") != null) u.setEmail(String.valueOf(body.get("email")));
        if (body.get("username") != null) u.setUsername(String.valueOf(body.get("username")));
        if (body.get("email_verified") != null) u.setEmailVerified(Boolean.parseBoolean(body.get("email_verified").toString()));
        if (body.get("status") != null) u.setStatus(str(body, "status"));
        if (body.get("preferences") != null) {
            try {
                u.setPreferences(new com.fasterxml.jackson.databind.ObjectMapper()
                        .writeValueAsString(body.get("preferences")));
            } catch (Exception ignored) { }
        }
        return userRepository.save(u);
    }

    /** Suspend/reactivate a user account. */
    @PatchMapping("/users/{userId}/status")
    public User setUserStatus(@RequestHeader("X-Org-Id") String orgId,
                              @PathVariable String userId,
                              @RequestBody Map<String, Object> body) {
        orgContext.requireRole(orgId, "org_owner", "org_admin");
        User u = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        String status = str(body, "status");
        if (!List.of("active", "inactive", "suspended").contains(status)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "invalid status");
        }
        u.setStatus(status);
        return userRepository.save(u);
    }

    /** Delete a user + their memberships in this org (Firebase Auth deletion stays client-side). */
    @DeleteMapping("/users/{userId}")
    @Transactional
    public org.springframework.http.ResponseEntity<Void> deleteUser(@RequestHeader("X-Org-Id") String orgId,
                                                                   @PathVariable String userId) {
        orgContext.requireRole(orgId, "org_owner", "org_admin");
        membershipRepository.findByOrganizationId(orgId).stream()
                .filter(m -> m.getUserId().equals(userId))
                .forEach(membershipRepository::delete);
        userRepository.deleteById(userId);
        return org.springframework.http.ResponseEntity.noContent().build();
    }

    /** Recent system log entries for the org (admin audit view). */
    @GetMapping("/logs")
    public List<SystemLog> logs(@RequestHeader("X-Org-Id") String orgId) {
        orgContext.requireRole(orgId, "org_owner", "org_admin");
        return systemLogRepository.findTop50ByOrderByCreatedAtDesc();
    }

    /** Append an audit entry — any org member may log their own actions. */
    @PostMapping("/logs")
    public SystemLog addLog(@RequestHeader("X-Org-Id") String orgId,
                            @RequestBody Map<String, Object> body) {
        orgContext.requireMembership(orgId);
        SystemLog l = new SystemLog();
        l.setId(UUID.randomUUID().toString());
        l.setLevel(strOr(body, "level", "info"));
        l.setMessage(str(body, "message"));
        l.setUserName(str(body, "user_name"));
        l.setUserId(orgContext.principal().uid());
        l.setAction(str(body, "action"));
        l.setOrgId(orgId);
        l.setCreatedAt(Instant.now());
        return systemLogRepository.save(l);
    }

    private static String str(Map<String, Object> b, String k) {
        Object v = b.get(k);
        return v != null ? v.toString() : null;
    }

    private static String strOr(Map<String, Object> b, String k, String def) {
        String v = str(b, k);
        return v != null && !v.isBlank() ? v : def;
    }
}
