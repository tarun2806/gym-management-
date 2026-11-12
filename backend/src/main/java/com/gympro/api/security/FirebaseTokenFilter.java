package com.gympro.api.security;

import com.gympro.api.model.OrganizationMembership;
import com.gympro.api.repository.OrganizationMembershipRepository;
import com.google.firebase.auth.FirebaseToken;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Verifies the Firebase ID token on every request and builds the principal
 * with org memberships resolved from MySQL (authoritative source — custom
 * claims may be stale).
 */
@Component
public class FirebaseTokenFilter extends OncePerRequestFilter {

    private final FirebaseAuthProvider authProvider;
    private final OrganizationMembershipRepository membershipRepository;

    public FirebaseTokenFilter(FirebaseAuthProvider authProvider,
                               OrganizationMembershipRepository membershipRepository) {
        this.authProvider = authProvider;
        this.membershipRepository = membershipRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            FirebaseToken token = authProvider.verify(header.substring(7));
            if (token != null) {
                String uid = token.getUid();
                String email = token.getEmail();

                List<AppUserPrincipal.OrgMembershipView> memberships =
                        membershipRepository.findByUserIdAndStatus(uid, "active")
                                .stream()
                                .map(m -> new AppUserPrincipal.OrgMembershipView(
                                        m.getOrganizationId(), m.getBranchId(), m.getRole(), m.getStatus()))
                                .toList();

                String claimRole = FirebaseAuthProvider.roleClaim(token);
                AppUserPrincipal principal = new AppUserPrincipal(uid, email, memberships);

                UsernamePasswordAuthenticationToken auth =
                        new UsernamePasswordAuthenticationToken(
                                principal, null,
                                List.of(new SimpleGrantedAuthority("ROLE_" + (claimRole != null ? claimRole : "member"))));
                SecurityContextHolder.getContext().setAuthentication(auth);
            }
        }
        chain.doFilter(request, response);
    }
}
