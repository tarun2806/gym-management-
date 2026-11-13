import { createContext, useContext, useState, useEffect } from "react";
import { auth } from "../lib/firebase";
import { api } from "../lib/api";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  sendEmailVerification
} from "firebase/auth";
import { ROLE_CAPABILITIES, roleHas, mapLegacyRole } from "../lib/permissions";
const authError = (error) => {
  const code = error?.code;
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "That email and password combination is not valid.";
    case "auth/invalid-email":
      return "That email address is not valid.";
    case "auth/email-already-in-use":
      return "An account already exists with this email. Try signing in instead.";
    case "auth/weak-password":
      return "Password must be at least 6 characters.";
    case "auth/user-disabled":
      return "This account has been disabled. Contact an administrator.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a minute and try again.";
    case "auth/network-request-failed":
      return "Network problem. Check your connection and try again.";
    case "auth/operation-not-allowed":
      return "Email sign-in is not enabled for this workspace yet.";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "Google sign-in was cancelled.";
    default:
      return "Something went wrong. Please try again.";
  }
};
const ok = { ok: true };
const AuthContext = createContext(void 0);
const DISABLED_STATUSES = /* @__PURE__ */ new Set(["inactive", "suspended"]);
const isAccountDisabled = (status) => typeof status === "string" && DISABLED_STATUSES.has(status);
const DISABLED_MESSAGE = "This account has been disabled. Contact an administrator.";
const UNVERIFIED_MESSAGE = "Please verify your email address before signing in. Check your inbox for the verification link.";
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const mapUser = async (fbUser) => {
    // Refresh Firebase's authoritative state — the user may have just
    // clicked the verification link in another tab.
    try { await fbUser.reload(); } catch { /* offline — use cached claims */ }
    let role = "member";
    let username = fbUser.email?.split("@")[0] || "User";
    let status;
    let emailVerified = fbUser.emailVerified;
    let memberships = [];
    try {
      const profile = await api("/api/me/profile");
      if (profile.role && profile.role in ROLE_CAPABILITIES) {
        role = profile.role;
      }
      if (profile.username) username = profile.username;
      status = profile.status;
      // Firebase ID token claims are authoritative; MySQL mirrors them via
      // FirebaseTokenFilter.syncUserFromToken. Never let a stale profile
      // value override a freshly-verified Firebase user.
      emailVerified = fbUser.emailVerified || profile.email_verified === true;
      memberships = Array.isArray(profile.memberships) ? profile.memberships : [];
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
    if (role !== "org_owner" && isAccountDisabled(status)) {
      return null;
    }
    if (!emailVerified) {
      return null;
    }
    return {
      id: fbUser.uid,
      username,
      email: fbUser.email || void 0,
      role,
      permissions: ROLE_CAPABILITIES[role],
      memberships
    };
  };
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const mappedUser = await mapUser(fbUser);
        if (mappedUser === null) {
          try {
            await signOut(auth);
          } catch {
          }
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
  useEffect(() => {
    let lastRefresh = 0;
    const refreshOnFocus = async () => {
      const current = auth.currentUser;
      if (!current) return;
      const now = Date.now();
      if (now - lastRefresh < 5 * 60 * 1e3) return;
      lastRefresh = now;
      try {
        await current.getIdTokenResult(true);
      } catch (error) {
        const code = error?.code;
        if (code === "auth/user-disabled" || code === "auth/user-token-expired" || code === "auth/invalid-user-token") {
          try {
            await signOut(auth);
          } catch {
          }
        }
      }
    };
    window.addEventListener("focus", refreshOnFocus);
    return () => window.removeEventListener("focus", refreshOnFocus);
  }, []);
  const login = async (email, password) => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      try { await cred.user.reload(); } catch { /* use cached claims */ }
      let profile = null;
      try {
        profile = await api("/api/me/profile");
      } catch {
      }
      const status = profile?.status;
      const legacyRole = profile?.role;
      const role = legacyRole && legacyRole in ROLE_CAPABILITIES ? legacyRole : legacyRole ? mapLegacyRole(legacyRole) : void 0;
      const emailVerified = cred.user.emailVerified || profile?.email_verified === true;
      if (role !== "org_owner" && isAccountDisabled(status)) {
        await signOut(auth);
        return { ok: false, error: DISABLED_MESSAGE };
      }
      if (!emailVerified) {
        await signOut(auth);
        return { ok: false, error: UNVERIFIED_MESSAGE };
      }
      return ok;
    } catch (error) {
      console.error("Login error:", error);
      return { ok: false, error: authError(error) };
    }
  };
  const signUp = async (email, password) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(userCredential.user);
      await api("/api/me/profile", {
        method: "PUT",
        body: { username: email.split("@")[0], email }
      }).catch(() => {
      });
      return ok;
    } catch (error) {
      console.error("Sign up error:", error);
      return { ok: false, error: authError(error) };
    }
  };
  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await api("/api/me/profile", {
        method: "PUT",
        body: {
          username: result.user.displayName || result.user.email?.split("@")[0],
          email: result.user.email
        }
      }).catch(() => {
      });
      return ok;
    } catch (error) {
      console.error("Google sign in error:", error);
      return { ok: false, error: authError(error) };
    }
  };
  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return ok;
    } catch (error) {
      const code = error?.code;
      if (code === "auth/user-not-found" || code === "auth/invalid-email") return ok;
      console.error("Reset password error:", error);
      return { ok: false, error: authError(error) };
    }
  };
  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setIsAuthenticated(false);
  };
  const hasPermission = (permission) => {
    if (!user) return false;
    return user.permissions.includes(permission);
  };
  const can = (capability) => roleHas(user?.role, capability);
  const hasRole = (role) => {
    if (!user) return false;
    return user.role === role;
  };
  // Re-check Firebase's authoritative verification state (user returns from
  // the email link) and refresh profile + auth state.
  const refreshVerification = async () => {
    const fbUser = auth.currentUser;
    if (!fbUser) return { ok: false, error: "Not signed in." };
    try {
      await fbUser.reload();
      await fbUser.getIdToken(true);
      const mapped = await mapUser(fbUser);
      if (mapped) {
        setUser(mapped);
        setIsAuthenticated(true);
        return { ok: true, verified: fbUser.emailVerified };
      }
      return { ok: false, verified: false };
    } catch (error) {
      return { ok: false, error: authError(error) };
    }
  };
  const resendVerification = async () => {
    const fbUser = auth.currentUser;
    if (!fbUser) return { ok: false, error: "Not signed in." };
    try {
      await sendEmailVerification(fbUser);
      return ok;
    } catch (error) {
      return { ok: false, error: authError(error) };
    }
  };
  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    signUp,
    signInWithGoogle,
    resetPassword,
    refreshVerification,
    resendVerification,
    logout,
    hasPermission,
    can,
    hasRole
  };
  return <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>;
};
const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === void 0) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
export {
  AuthProvider,
  useAuth
};
