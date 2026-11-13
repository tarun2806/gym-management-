package com.gympro.api.owner;

import com.gympro.api.auth.OrgContextService;
import com.gympro.api.model.*;
import com.gympro.api.platform.PlatformAdminController;
import com.gympro.api.repository.*;
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

/**
 * Secure owner onboarding: activation-key validation then org+branch
 * provisioning. The raw key is never stored — SHA-256 hash lookup only.
 */
@RestController
@RequestMapping("/api/owner")
public class OwnerRegistrationController {

    private final OwnerActivationKeyRepository keyRepository;
    private final OrganizationRepository organizationRepository;
    private final OrganizationMembershipRepository membershipRepository;
    private final BranchRepository branchRepository;
    private final SystemLogRepository logRepository;
    private final OrgContextService orgContext;
    private final ObjectMapper objectMapper;

    public OwnerRegistrationController(OwnerActivationKeyRepository keyRepository,
                                      OrganizationRepository organizationRepository,
                                      OrganizationMembershipRepository membershipRepository,
                                      BranchRepository branchRepository,
                                      SystemLogRepository logRepository,
                                      OrgContextService orgContext,
                                      ObjectMapper objectMapper) {
        this.keyRepository = keyRepository;
        this.organizationRepository = organizationRepository;
        this.membershipRepository = membershipRepository;
        this.branchRepository = branchRepository;
        this.logRepository = logRepository;
        this.orgContext = orgContext;
        this.objectMapper = objectMapper;
    }

    private OwnerActivationKey requireKey(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "activation key required");
        }
        OwnerActivationKey k = keyRepository.findByKeyHash(PlatformAdminController.sha256(raw.trim()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "invalid activation key"));
        Instant now = Instant.now();
        if (k.getRevokedAt() != null) {
            throw new ResponseStatusException(HttpStatus.GONE, "activation key revoked");
        }
        if (k.getRedeemedAt() != null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "activation key already redeemed");
        }
        if (!k.getExpiresAt().isAfter(now)) {
            throw new ResponseStatusException(HttpStatus.GONE, "activation key expired");
        }
        return k;
    }

    /** Step 1: validate the key before showing the registration form. */
    @PostMapping("/validate-key")
    public Map<String, Object> validateKey(@RequestBody Map<String, Object> body) {
        orgContext.principal(); // authenticated
        OwnerActivationKey k = requireKey(String.valueOf(body.getOrDefault("key", "")));
        return Map.of("valid", true, "label", k.getLabel() != null ? k.getLabel() : "");
    }

    /**
     * Step 2: provision org + owner membership + initial branch, then
     * atomically consume the key. Single transaction — any failure rolls back
     * everything including the redemption.
     */
    @PostMapping("/register")
    @Transactional
    public Map<String, Object> register(@RequestBody Map<String, Object> body) {
        AppUserPrincipal p = orgContext.principal();
        OwnerActivationKey k = requireKey(String.valueOf(body.getOrDefault("key", "")));

        String orgName = str(body, "org_name");
        String branchName = str(body, "branch_name");
        if (orgName == null || orgName.isBlank() || branchName == null || branchName.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "org_name and branch_name required");
        }
        String slug = orgName.toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("^-|-$", "");
        if (organizationRepository.findBySlug(slug).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "organization slug already exists");
        }

        // Atomic consume — returns 0 if a concurrent request already redeemed.
        int redeemed = keyRepository.redeem(k.getId(), p.uid(), Instant.now());
        if (redeemed == 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "activation key already redeemed");
        }

        String orgId = UUID.randomUUID().toString();
        Organization o = new Organization();
        o.setId(orgId);
        o.setName(orgName);
        o.setSlug(slug);
        o.setOwnerId(p.uid());
        o.setStatus("active");
        o.setSubscriptionTier("free"); // never trust client-supplied tier
        o.setSettings(settingsJson(body));
        o.setCreatedAt(Instant.now());
        o.setUpdatedAt(Instant.now());
        organizationRepository.save(o);

        OrganizationMembership m = new OrganizationMembership();
        m.setId(p.uid() + ":" + orgId);
        m.setOrganizationId(orgId);
        m.setUserId(p.uid());
        m.setRole("org_owner");
        m.setStatus("active");
        m.setJoinedAt(Instant.now());
        membershipRepository.save(m);

        Branch b = new Branch();
        b.setId(UUID.randomUUID().toString());
        b.setOrganizationId(orgId);
        b.setName(branchName);
        b.setStatus("active");
        b.setCreatedAt(Instant.now());
        branchRepository.save(b);

        audit(orgId, "owner.registration_completed", orgId,
                "org=" + orgName + " branch=" + branchName + " key=" + k.getId());
        return Map.of("organization_id", orgId, "branch_id", b.getId(), "role", "org_owner");
    }

    private void audit(String orgId, String action, String targetId, String detail) {
        SystemLog log = new SystemLog();
        log.setId(UUID.randomUUID().toString());
        log.setOrgId(orgId);
        log.setLevel("info");
        log.setAction(action);
        log.setMessage(detail);
        log.setUserId(orgContext.principal().uid());
        log.setCreatedAt(Instant.now());
        logRepository.save(log);
    }

    private String settingsJson(Map<String, Object> body) {
        try {
            Map<String, Object> s = new java.util.LinkedHashMap<>();
            for (String k : List.of("gym_name", "address", "phone", "open_time", "close_time", "capacity")) {
                if (body.get(k) != null) s.put(k, body.get(k));
            }
            return objectMapper.writeValueAsString(s);
        } catch (Exception e) {
            return null;
        }
    }

    private static String str(Map<String, Object> b, String k) {
        Object v = b.get(k);
        return v != null ? v.toString() : null;
    }
}
