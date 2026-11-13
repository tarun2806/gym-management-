package com.gympro.api.security;

import com.gympro.api.model.OrganizationMembership;
import com.gympro.api.model.User;
import com.gympro.api.repository.OrganizationMembershipRepository;
import com.gympro.api.repository.UserRepository;
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
    private final UserRepository userRepository;

    public FirebaseTokenFilter(FirebaseAuthProvider authProvider,
                               OrganizationMembershipRepository membershipRepository,
                               UserRepository userRepository) {
        this.authProvider = authProvider;
        this.membershipRepository = membershipRepository;
        this.userRepository = userRepository;
    }

    /**
     * Sync email + verification state from the verified Firebase token claims
     * into the MySQL users row. Firebase is authoritative — stale or
     * client-supplied values can never downgrade or forge verification.
     */
    public void syncUserFromToken(String uid, String email, FirebaseToken token) {
        if (uid == null || uid.isBlank()) return;
        Object claim = token.getClaims().get("email_verified");
        boolean verified = Boolean.TRUE.equals(claim) || "true".equals(String.valueOf(claim));
        User u = userRepository.findById(uid).orElseGet(() -> {
            User n = new User();
            n.setId(uid);
            n.setCreatedAt(java.time.Instant.now());
            return n;
        });
        boolean changed = false;
        if (email != null && !email.isBlank() && !email.equalsIgnoreCase(u.getEmail())) {
            // Email changed in Firebase → require re-verification for the new address.
            u.setEmail(email);
            u.setEmailVerified(verified);
            changed = true;
        } else if (verified && !u.isEmailVerified()) {
            u.setEmailVerified(true);
            changed = true;
        }
        // Never downgrade verified=true from a stale/forged token claim of false.
        if (changed) userRepository.save(u);
        promotePlatformAdminIfListed(u, email);
    }

    /**
     * Bootstrap platform admins from the server-side PLATFORM_ADMIN_EMAILS
     * allow-list. Matches only the verified Firebase token email; never demotes.
     */
    private void promotePlatformAdminIfListed(User u, String firebaseEmail) {
        if (u.isPlatformAdmin() || firebaseEmail == null || firebaseEmail.isBlank()) return;
        String admins = System.getenv("PLATFORM_ADMIN_EMAILS");
        if (admins == null || admins.isBlank()) return;
        for (String a : admins.split(",")) {
            if (a.trim().equalsIgnoreCase(firebaseEmail.trim())) {
                u.setPlatformAdmin(true);
                userRepository.save(u);
                return;
            }
        }
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
                syncUserFromToken(uid, email, token);

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
