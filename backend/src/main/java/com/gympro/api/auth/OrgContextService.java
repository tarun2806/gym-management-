package com.gympro.api.auth;

import com.gympro.api.model.OrganizationMembership;
import com.gympro.api.repository.OrganizationMembershipRepository;
import com.gympro.api.security.AppUserPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

/**
 * Resolves the caller's org/branch context from the X-Org-Id / X-Branch-Id
 * headers and enforces membership-based authorization for every business API.
 * This is the server-side equivalent of the Firestore rules' org checks.
 */
@Service
public class OrgContextService {

    private final OrganizationMembershipRepository membershipRepository;

    public OrgContextService(OrganizationMembershipRepository membershipRepository) {
        this.membershipRepository = membershipRepository;
    }

    public AppUserPrincipal principal() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof AppUserPrincipal p)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        return p;
    }

    /** Active membership for the requested org, or 403. */
    public OrganizationMembership requireMembership(String orgId) {
        AppUserPrincipal p = principal();
        return p.memberships().stream()
                .filter(m -> m.organizationId().equals(orgId) && "active".equals(m.status()))
                .findFirst()
                .map(m -> toEntity(m, orgId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Not a member of this organization"));
    }

    /** Require membership with one of the allowed roles. */
    public OrganizationMembership requireRole(String orgId, String... roles) {
        OrganizationMembership m = requireMembership(orgId);
        for (String r : roles) {
            if (r.equals(m.getRole())) return m;
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Insufficient permissions");
    }

    private OrganizationMembership toEntity(AppUserPrincipal.OrgMembershipView v, String orgId) {
        OrganizationMembership m = new OrganizationMembership();
        m.setOrganizationId(v.organizationId());
        m.setBranchId(v.branchId());
        m.setRole(v.role());
        m.setStatus(v.status());
        m.setUserId(principal().uid());
        return m;
    }
}
