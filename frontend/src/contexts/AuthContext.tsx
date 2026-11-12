import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { auth } from '../lib/firebase';
import { api } from '../lib/api';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  sendEmailVerification,
} from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';

import type { User, Role } from '../types';
import type { Capability } from '../lib/permissions';
import { ROLE_CAPABILITIES, roleHas, mapLegacyRole } from '../lib/permissions';

export interface AuthResult {
  ok: boolean;
  error?: string;
}

// Turns Firebase's auth/* codes into copy a person can act on.
const authError = (error: unknown): string => {
  const code = (error as { code?: string })?.code;
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'That email and password combination is not valid.';
    case 'auth/invalid-email':
      return 'That email address is not valid.';
    case 'auth/email-already-in-use':
      return 'An account already exists with this email. Try signing in instead.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Contact an administrator.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a minute and try again.';
    case 'auth/network-request-failed':
      return 'Network problem. Check your connection and try again.';
    case 'auth/operation-not-allowed':
      return 'Email sign-in is not enabled for this workspace yet.';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Google sign-in was cancelled.';
    default:
      return 'Something went wrong. Please try again.';
  }
};

const ok: AuthResult = { ok: true };

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string) => Promise<AuthResult>;
  signInWithGoogle: () => Promise<AuthResult>;
  resetPassword: (email: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  can: (capability: Capability) => boolean;
  hasRole: (role: string) => boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Accounts with these status values must not be able to hold a session.
// 'active' and any missing/legacy value remain permitted (fail-open for
// existing data written before status tracking existed).
const DISABLED_STATUSES = new Set(['inactive', 'suspended']);
const isAccountDisabled = (status: unknown): boolean =>
  typeof status === 'string' && DISABLED_STATUSES.has(status);
const DISABLED_MESSAGE =
  'This account has been disabled. Contact an administrator.';
const UNVERIFIED_MESSAGE =
  'Please verify your email address before signing in. Check your inbox for the verification link.';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Map Firebase user to our internal User interface.
  // Returns null when the account is disabled — the caller must sign the
  // user out and surface DISABLED_MESSAGE. Owner is exempt so a misconfigured
  // status field can never lock everyone out of their own gym.
  const mapUser = async (fbUser: FirebaseUser): Promise<User | null> => {
    // POST-MIGRATION: Role is read from Firebase Auth custom claims (trusted, server-side)
    // Fallback to Firestore during migration for backward compatibility
    let role: Role = 'member';
    let username = fbUser.email?.split('@')[0] || 'User';
    let status: unknown;
    let emailVerified: boolean = fbUser.emailVerified;

    try {
      // Backend profile is authoritative: role comes from active org
      // memberships, status/emailVerified from the users table.
      const profile = await api<{
        username?: string; status?: string; email_verified?: boolean; role?: string;
      }>('/api/me/profile');
      if (profile.role && profile.role in ROLE_CAPABILITIES) {
        role = profile.role as Role;
      }
      if (profile.username) username = profile.username;
      status = profile.status;
      emailVerified = profile.email_verified ?? fbUser.emailVerified;
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }

    if (role !== 'org_owner' && isAccountDisabled(status)) {
      return null;
    }

    // Enforce email verification for all roles except owner (owner can verify later)
    if (role !== 'org_owner' && !emailVerified) {
      return null;
    }

    return {
      id: fbUser.uid,
      username: username,
      email: fbUser.email || undefined,
      role: role,
      permissions: ROLE_CAPABILITIES[role]
    };
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const mappedUser = await mapUser(fbUser);
        if (mappedUser === null) {
          // Account was disabled mid-session (or the user was previously
          // signed in with a stale token). Force sign-out so no privileged
          // data can be fetched or written under a revoked identity.
          try { await signOut(auth); } catch { /* ignore */ }
          setUser(null);
          setIsAuthenticated(false);
        } else {
          setUser(mappedUser);
          setIsAuthenticated(true);
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Keep the ID token (and its custom-claim role) fresh while the app is in
  // use. Firebase refreshes automatically, but a forced refresh on focus
  // propagates role/status changes made elsewhere within minutes instead of
  // waiting for the hourly token rotation.
  useEffect(() => {
    let lastRefresh = 0;
    const refreshOnFocus = async () => {
      const current = auth.currentUser;
      if (!current) return;
      const now = Date.now();
      if (now - lastRefresh < 5 * 60 * 1000) return;
      lastRefresh = now;
      try {
        await current.getIdTokenResult(true);
      } catch (error) {
        const code = (error as { code?: string })?.code;
        if (code === 'auth/user-disabled' || code === 'auth/user-token-expired' || code === 'auth/invalid-user-token') {
          try { await signOut(auth); } catch { /* ignore */ }
        }
      }
    };
    window.addEventListener('focus', refreshOnFocus);
    return () => window.removeEventListener('focus', refreshOnFocus);
  }, []);

  const login = async (email: string, password: string): Promise<AuthResult> => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      // Check account status and email verification before handing the session back to the app.
      // onAuthStateChanged also guards this, but doing it here lets us
      // return a friendly error synchronously instead of a redirect flash.
      let profile: { status?: string; role?: string; email_verified?: boolean } | null = null;
      try {
        profile = await api('/api/me/profile');
      } catch { /* backend unreachable — fall back to Firebase claims only */ }
      const status = profile?.status;
      const legacyRole = profile?.role;
      const role: Role | undefined = legacyRole && legacyRole in ROLE_CAPABILITIES
        ? (legacyRole as Role)
        : legacyRole ? mapLegacyRole(legacyRole) : undefined;
      const emailVerified = profile?.email_verified ?? cred.user.emailVerified;
      
      if (role !== 'org_owner' && isAccountDisabled(status)) {
        await signOut(auth);
        return { ok: false, error: DISABLED_MESSAGE };
      }
      
      if (role !== 'org_owner' && !emailVerified) {
        await signOut(auth);
        return { ok: false, error: UNVERIFIED_MESSAGE };
      }
      
      return ok;
    } catch (error) {
      console.error('Login error:', error);
      return { ok: false, error: authError(error) };
    }
  };

  const signUp = async (email: string, password: string): Promise<AuthResult> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Send email verification - user cannot fully access system until verified
      await sendEmailVerification(userCredential.user);
      // Provision the user profile row (idempotent upsert).
      await api('/api/me/profile', {
        method: 'PUT',
        body: { username: email.split('@')[0], email },
      }).catch(() => { /* non-fatal: profile can be created later */ });
      return ok;
    } catch (error) {
      console.error('Sign up error:', error);
      return { ok: false, error: authError(error) };
    }
  };

  const signInWithGoogle = async (): Promise<AuthResult> => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      // Provision profile on first Google sign-in (idempotent upsert).
      await api('/api/me/profile', {
        method: 'PUT',
        body: {
          username: result.user.displayName || result.user.email?.split('@')[0],
          email: result.user.email,
        },
      }).catch(() => { /* non-fatal */ });
      return ok;
    } catch (error) {
      console.error('Google sign in error:', error);
      return { ok: false, error: authError(error) };
    }
  };

  // Deliberately never reveals whether the address is registered.
  const resetPassword = async (email: string): Promise<AuthResult> => {
    try {
      await sendPasswordResetEmail(auth, email);
      return ok;
    } catch (error) {
      const code = (error as { code?: string })?.code;
      if (code === 'auth/user-not-found' || code === 'auth/invalid-email') return ok;
      console.error('Reset password error:', error);
      return { ok: false, error: authError(error) };
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setIsAuthenticated(false);
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    return user.permissions.includes(permission);
  };

  const can = (capability: Capability): boolean =>
    roleHas(user?.role as Role, capability);

  const hasRole = (role: string): boolean => {
    if (!user) return false;
    return user.role === role;
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    signUp,
    signInWithGoogle,
    resetPassword,
    logout,
    hasPermission,
    can,
    hasRole
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
