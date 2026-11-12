package com.gympro.api.security;

import java.util.List;

/**
 * Authenticated principal: Firebase uid plus resolved org memberships.
 * Role claims on the token take precedence; memberships come from MySQL.
 */
public record AppUserPrincipal(
        String uid,
        String email,
        List<OrgMembershipView> memberships
) {
    public record OrgMembershipView(
            String organizationId,
            String branchId,
            String role,
            String status
    ) {}
}
