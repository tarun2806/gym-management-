package com.gympro.api.auth;

import com.gympro.api.model.OrganizationMembership;
import com.gympro.api.model.User;
import com.gympro.api.repository.OrganizationMembershipRepository;
import com.gympro.api.repository.UserRepository;
import com.gympro.api.security.AppUserPrincipal;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class MeController {

    private final OrganizationMembershipRepository membershipRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public MeController(OrganizationMembershipRepository membershipRepository,
                        UserRepository userRepository) {
        this.membershipRepository = membershipRepository;
        this.userRepository = userRepository;
    }

    @GetMapping("/health")
    public Map<String, Object> health() {
        return Map.of("status", "ok");
    }

    /** Full membership rows for the caller — drives the org/branch context. */
    @GetMapping("/me/memberships")
    public List<OrganizationMembership> memberships() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof AppUserPrincipal p)) {
            return List.of();
        }
        return membershipRepository.findByUserId(p.uid());
    }

    /** Read-state for derived notifications (replaces users/{uid}.notificationState). */
    @GetMapping("/me/notification-state")
    public Map<String, Object> notificationState() {
        AppUserPrincipal p = principal();
        return userRepository.findById(p.uid())
                .map(u -> {
                    try {
                        JsonNode state = u.getNotificationState() != null
                                ? objectMapper.readTree(u.getNotificationState()) : objectMapper.createObjectNode();
                        JsonNode readIds = state.path("readIds");
                        return Map.<String, Object>of("readIds",
                                readIds.isArray() ? readIds : objectMapper.createArrayNode());
                    } catch (Exception e) {
                        return Map.<String, Object>of("readIds", objectMapper.createArrayNode());
                    }
                })
                .orElse(Map.of("readIds", List.of()));
    }

    /** Merge read ids into the caller's notification state (union, deduped). */
    @PostMapping("/me/notification-state/read")
    public Map<String, Object> markNotificationsRead(@RequestBody Map<String, Object> body) {
        AppUserPrincipal p = principal();
        User user = userRepository.findById(p.uid()).orElse(null);
        if (user == null) return Map.of("readIds", List.of());

        try {
            ObjectNode state = user.getNotificationState() != null
                    ? (ObjectNode) objectMapper.readTree(user.getNotificationState())
                    : objectMapper.createObjectNode();
            ArrayNode readIds = state.withArray("readIds");

            java.util.Set<String> seen = new java.util.LinkedHashSet<>();
            readIds.forEach(n -> seen.add(n.asText()));
            Object incoming = body.get("ids");
            if (incoming instanceof List<?> list) {
                list.forEach(v -> { if (v != null) seen.add(v.toString()); });
            }
            readIds.removeAll();
            seen.forEach(readIds::add);
            state.put("updatedAt", java.time.Instant.now().toString());

            user.setNotificationState(objectMapper.writeValueAsString(state));
            userRepository.save(user);
            return Map.of("readIds", readIds);
        } catch (Exception e) {
            return Map.of("error", "failed to update read state");
        }
    }

    /** Personal settings blob (profile fields + notification prefs). */
    @GetMapping("/me/preferences")
    public Map<String, Object> preferences() {
        AppUserPrincipal p = principal();
        return userRepository.findById(p.uid())
                .map(u -> {
                    try {
                        return u.getPreferences() != null
                                ? objectMapper.readValue(u.getPreferences(), Map.class)
                                : Map.<String, Object>of();
                    } catch (Exception e) {
                        return Map.<String, Object>of();
                    }
                })
                .orElse(Map.of());
    }

    /** Merge a partial preferences patch into the caller's settings. */
    @PutMapping("/me/preferences")
    public Map<String, Object> updatePreferences(@RequestBody Map<String, Object> patch) {
        AppUserPrincipal p = principal();
        User user = userRepository.findById(p.uid()).orElse(null);
        if (user == null) return Map.of("error", "user not found");
        try {
            ObjectNode merged = user.getPreferences() != null
                    ? (ObjectNode) objectMapper.readTree(user.getPreferences())
                    : objectMapper.createObjectNode();
            patch.forEach((k, v) -> {
                if (v == null) merged.remove(k);
                else merged.set(k, objectMapper.valueToTree(v));
            });
            user.setPreferences(objectMapper.writeValueAsString(merged));
            userRepository.save(user);
            return objectMapper.convertValue(merged, Map.class);
        } catch (Exception e) {
            return Map.of("error", "failed to save preferences");
        }
    }

    /** Returns the authenticated principal — used to verify the auth chain. */
    @GetMapping("/me")
    public ResponseEntity<?> me() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof AppUserPrincipal p)) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(Map.of(
                "uid", p.uid(),
                "email", p.email() != null ? p.email() : "",
                "memberships", p.memberships().stream()
                        .map(m -> Map.of(
                                "organization_id", m.organizationId(),
                                "branch_id", m.branchId() != null ? m.branchId() : "",
                                "role", m.role()))
                        .toList()));
    }

    /**
     * Full self profile: user row + highest-privilege org membership role.
     * Replaces the Firestore users/{uid} document reads in AuthContext.
     */
    @GetMapping("/me/profile")
    public Map<String, Object> profile() {
        AppUserPrincipal p = principal();
        User u = userRepository.findById(p.uid()).orElse(null);
        List<OrganizationMembership> memberships = membershipRepository.findByUserId(p.uid());
        String role = memberships.stream()
                .filter(m -> "active".equals(m.getStatus()))
                .map(OrganizationMembership::getRole)
                .max((a, b) -> Integer.compare(rank(a), rank(b)))
                .orElse(null);
        Map<String, Object> out = new java.util.LinkedHashMap<>();
        out.put("id", p.uid());
        out.put("email", p.email() != null ? p.email() : (u != null ? u.getEmail() : ""));
        out.put("username", u != null && u.getUsername() != null ? u.getUsername() : "");
        out.put("status", u != null ? u.getStatus() : "active");
        out.put("email_verified", u != null ? u.isEmailVerified() : false);
        out.put("role", role);
        return out;
    }

    /** Self-service profile upsert (signup / Google first-login provisioning). */
    @PutMapping("/me/profile")
    public Map<String, Object> upsertProfile(@RequestBody Map<String, Object> body) {
        AppUserPrincipal p = principal();
        User u = userRepository.findById(p.uid()).orElseGet(() -> {
            User n = new User();
            n.setId(p.uid());
            n.setEmail(p.email() != null ? p.email() : "");
            n.setCreatedAt(java.time.Instant.now());
            return n;
        });
        if (body.get("username") != null) u.setUsername(String.valueOf(body.get("username")));
        if (body.get("email") != null && !String.valueOf(body.get("email")).isBlank()) {
            u.setEmail(String.valueOf(body.get("email")));
        }
        userRepository.save(u);
        return profile();
    }

    private static int rank(String role) {
        return switch (role == null ? "" : role) {
            case "platform_admin" -> 7;
            case "org_owner" -> 6;
            case "org_admin" -> 5;
            case "branch_manager" -> 4;
            case "staff" -> 3;
            case "trainer" -> 2;
            case "member" -> 1;
            default -> 0;
        };
    }

    private AppUserPrincipal principal() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof AppUserPrincipal p)) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.UNAUTHORIZED);
        }
        return p;
    }
}
