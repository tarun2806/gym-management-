package com.gympro.api;

import com.gympro.api.model.User;
import com.gympro.api.repository.OrganizationMembershipRepository;
import com.gympro.api.repository.UserRepository;
import com.gympro.api.security.FirebaseAuthProvider;
import com.gympro.api.security.FirebaseTokenFilter;
import com.google.firebase.auth.FirebaseToken;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class EmailVerificationSyncTest {

    private UserRepository userRepo;
    private FirebaseTokenFilter filter;

    @BeforeEach
    void setUp() {
        userRepo = mock(UserRepository.class);
        filter = new FirebaseTokenFilter(mock(FirebaseAuthProvider.class),
                mock(OrganizationMembershipRepository.class), userRepo);
    }

    private FirebaseToken token(Map<String, Object> claims) {
        FirebaseToken t = mock(FirebaseToken.class);
        when(t.getClaims()).thenReturn(claims);
        return t;
    }

    private User existing(boolean verified, String email) {
        User u = new User();
        u.setId("uid1"); u.setEmail(email); u.setEmailVerified(verified); u.setStatus("active");
        return u;
    }

    @Test void firebaseVerifiedSyncsStaleMysqlFalse() {
        when(userRepo.findById("uid1")).thenReturn(Optional.of(existing(false, "a@b.c")));
        filter.syncUserFromToken("uid1", "a@b.c", token(Map.of("email_verified", true)));
        verify(userRepo).save(argThat((User u) -> u.isEmailVerified()));
    }

    @Test void firebaseUnverifiedDoesNotVerify() {
        when(userRepo.findById("uid1")).thenReturn(Optional.of(existing(false, "a@b.c")));
        filter.syncUserFromToken("uid1", "a@b.c", token(Map.of("email_verified", false)));
        verify(userRepo, never()).save(any());
    }

    @Test void verifiedAccountNeverDowngradedByFalseClaim() {
        when(userRepo.findById("uid1")).thenReturn(Optional.of(existing(true, "a@b.c")));
        filter.syncUserFromToken("uid1", "a@b.c", token(Map.of("email_verified", false)));
        verify(userRepo, never()).save(any());
    }

    @Test void emailChangeSetsVerificationFromToken() {
        when(userRepo.findById("uid1")).thenReturn(Optional.of(existing(true, "old@b.c")));
        filter.syncUserFromToken("uid1", "new@b.c", token(Map.of("email_verified", false)));
        verify(userRepo).save(argThat((User u) -> "new@b.c".equals(u.getEmail()) && !u.isEmailVerified()));
    }

    @Test void emailChangeWithVerifiedClaimStaysVerified() {
        when(userRepo.findById("uid1")).thenReturn(Optional.of(existing(false, "old@b.c")));
        filter.syncUserFromToken("uid1", "new@b.c", token(Map.of("email_verified", true)));
        verify(userRepo).save(argThat((User u) -> u.isEmailVerified()));
    }

    @Test void newUserRowCreatedWithVerifiedState() {
        when(userRepo.findById("uid-new")).thenReturn(Optional.empty());
        filter.syncUserFromToken("uid-new", "n@b.c", token(Map.of("email_verified", true)));
        verify(userRepo).save(argThat((User u) -> "uid-new".equals(u.getId()) && u.isEmailVerified()));
    }

    @Test void blankUidIgnored() {
        filter.syncUserFromToken("", "a@b.c", token(Map.of()));
        verifyNoInteractions(userRepo);
    }

    @Test void stringTrueClaimAccepted() {
        when(userRepo.findById("uid1")).thenReturn(Optional.of(existing(false, "a@b.c")));
        filter.syncUserFromToken("uid1", "a@b.c", token(Map.of("email_verified", "true")));
        verify(userRepo).save(argThat((User u) -> u.isEmailVerified()));
    }
}
