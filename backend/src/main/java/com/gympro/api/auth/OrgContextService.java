package com.gympro.api.auth;

import com.gympro.api.model.OrganizationMembership;
import com.gympro.api.repository.BranchRepository;
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
    private final BranchRepository branchRepository;

    public OrgContextService(OrganizationMembershipRepository membershipRepository,
                             BranchRepository branchRepository) {
        this.membershipRepository = membershipRepository;
        this.branchRepository = branchRepository;
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

    /** Roles allowed to read organization-wide management data. */
    public static final String[] BACKOFFICE_ROLES = {
            "platform_admin", "org_owner", "org_admin", "branch_manager", "staff", "trainer"
    };

    /**
     * Require an active membership with a back-office role — i.e. everyone
     * except {@code member}. Used for organization-wide read endpoints
     * (member lists, payments, invoices, payroll, expenses, equipment, …)
     * that a member must never see. Member self-service data is served by
     * the /api/me/* endpoints instead.
     */
    /** Front-desk operations: members, trainers, attendance, classes, equipment/inventory. */
    public static final String[] OPS_ROLES = {
            "platform_admin", "org_owner", "org_admin", "branch_manager", "staff"
    };

    /** Organization finances: payments, invoices, expenses, payroll, revenue. */
    public static final String[] FINANCE_ROLES = {
            "platform_admin", "org_owner", "org_admin"
    };

    /** Workout/diet plan management (mirrors frontend workouts|diet capabilities). */
    public static final String[] PLAN_ROLES = {
            "platform_admin", "org_owner", "org_admin", "branch_manager", "trainer"
    };

    /** Gym configuration (mirrors frontend settings.gym capability). */
    public static final String[] SETTINGS_ROLES = {
            "platform_admin", "org_owner", "org_admin", "branch_manager"
    };

    /** Membership plan catalog management (mirrors frontend plans capability). */
    public static final String[] PLAN_ADMIN_ROLES = {
            "platform_admin", "org_owner", "org_admin", "branch_manager"
    };

    public OrganizationMembership requireBackoffice(String orgId) {
        return requireRole(orgId, BACKOFFICE_ROLES);
    }

    public OrganizationMembership requireOps(String orgId) {
        return requireRole(orgId, OPS_ROLES);
    }

    public OrganizationMembership requireFinance(String orgId) {
        return requireRole(orgId, FINANCE_ROLES);
    }

    public OrganizationMembership requirePlanRoles(String orgId) {
        return requireRole(orgId, PLAN_ROLES);
    }

    public OrganizationMembership requireSettings(String orgId) {
        return requireRole(orgId, SETTINGS_ROLES);
    }

    public OrganizationMembership requirePlanAdmin(String orgId) {
        return requireRole(orgId, PLAN_ADMIN_ROLES);
    }

    /** Require membership with one of the allowed roles. */
    public OrganizationMembership requireRole(String orgId, String... roles) {
        OrganizationMembership m = requireMembership(orgId);
        for (String r : roles) {
            if (r.equals(m.getRole())) return m;
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Insufficient permissions");
    }

    /**
     * Resolves the effective branch for a write. Branch-scoped memberships are
     * pinned to their own branch; org-wide memberships may target any branch
     * that belongs to the organization. Client-supplied branch ids are never
     * trusted without validation.
     */
    public String resolveBranchId(String orgId, OrganizationMembership m, Object requested) {
        String req = requested != null ? requested.toString() : null;
        if (m.getBranchId() != null) {
            if (req != null && !req.equals(m.getBranchId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Branch access denied");
            }
            return m.getBranchId();
        }
        if (req == null) return null;
        boolean valid = branchRepository.findByOrganizationId(orgId).stream()
                .anyMatch(b -> b.getId().equals(req));
        if (!valid) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown branch for organization");
        }
        return req;
    }

    /**
     * Returns the branch id a read must be restricted to, or null for
     * org-wide visibility. Branch-scoped memberships only see their branch;
     * org-wide memberships (null branchId) see the whole organization.
     */
    public String readBranchScope(OrganizationMembership m) {
        return m.getBranchId();
    }

    /** True when the entity's branch is visible to this membership. */
    public boolean canSeeBranch(OrganizationMembership m, String entityBranchId) {
        return m.getBranchId() == null
                || (entityBranchId != null && entityBranchId.equals(m.getBranchId()));
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
