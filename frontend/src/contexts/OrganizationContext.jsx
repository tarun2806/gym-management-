import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { api } from "../lib/api";
import { roleHas, resolveOrgRole } from "../lib/permissions";
import { clearCache } from "../lib/cache";
import { useAuth } from "./AuthContext";
const OrganizationContext = createContext(void 0);
const orgStorageKey = (uid) => `gympro:org:${uid}`;
const branchStorageKey = (uid, orgId) => `gympro:branch:${uid}:${orgId}`;
const readStored = (key) => {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};
const writeStored = (key, value) => {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
  }
};
const mapOrg = (row) => {
  const { settings, ...rest } = row;
  let parsed;
  if (typeof settings === "string") {
    try {
      parsed = JSON.parse(settings);
    } catch {
      parsed = void 0;
    }
  } else {
    parsed = settings;
  }
  return { ...rest, settings: parsed };
};
const mapBranch = (row) => {
  const { organization_id, ...rest } = row;
  return { ...rest, org_id: String(organization_id ?? "") };
};
const mapMembership = (row) => {
  const { organization_id, ...rest } = row;
  return { ...rest, org_id: String(organization_id ?? "") };
};
const OrganizationProvider = ({ children }) => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [currentOrganization, setCurrentOrganizationState] = useState(null);
  const [currentBranch, setCurrentBranchState] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [branches, setBranches] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const loadSeq = useRef(0);
  const resetTenantState = useCallback(() => {
    setCurrentOrganizationState(null);
    setCurrentBranchState(null);
    setOrganizations([]);
    setBranches([]);
    setMemberships([]);
    clearCache();
  }, []);
  const loadBranchesForOrg = useCallback(async (orgId) => {
    try {
      const rows = await api(`/api/organizations/${orgId}/branches`, {
        scope: { orgId }
      });
      const mapped = rows.map(mapBranch);
      mapped.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      setBranches(mapped);
    } catch (err) {
      console.error("Error fetching branches:", err);
      setBranches([]);
    }
  }, []);
  const loadMemberships = useCallback(async () => {
    const rows = await api("/api/me/memberships");
    return rows.map(mapMembership);
  }, []);
  const selectOrganization = useCallback((org, opts) => {
    if (!user) return;
    setCurrentOrganizationState(org);
    setCurrentBranchState(null);
    setBranches([]);
    clearCache();
    if (opts?.persist !== false) {
      writeStored(orgStorageKey(user.id), org?.id ?? null);
      writeStored(branchStorageKey(user.id, org?.id ?? ""), null);
    }
    if (org) {
      void loadBranchesForOrg(org.id);
    }
  }, [user, loadBranchesForOrg]);
  useEffect(() => {
    const seq = ++loadSeq.current;
    if (!isAuthenticated || !user) {
      resetTenantState();
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      try {
        const uid = user.id;
        const rows = await loadMemberships();
        if (cancelled || seq !== loadSeq.current) return;
        const active = rows.filter((m) => m.status !== "suspended" && m.status !== "pending");
        setMemberships(active);
        const orgRows = await api("/api/organizations");
        if (cancelled || seq !== loadSeq.current) return;
        const orgs = orgRows.map(mapOrg).filter((o) => o.status !== "suspended");
        if (cancelled || seq !== loadSeq.current) return;
        setOrganizations(orgs);
        const storedOrgId = readStored(orgStorageKey(uid));
        const initial = orgs.find((o) => o.id === storedOrgId) ?? orgs[0] ?? null;
        setCurrentOrganizationState(initial);
        setCurrentBranchState(null);
        setBranches([]);
        if (initial) {
          void loadBranchesForOrg(initial.id);
        }
      } catch (err) {
        console.error("Error loading organization context:", err);
        if (!cancelled) resetTenantState();
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [user?.id, isAuthenticated]);
  useEffect(() => {
    if (!user) return;
    const onStorage = (e) => {
      if (e.key !== orgStorageKey(user.id)) return;
      const orgId = e.newValue;
      const org = organizations.find((o) => o.id === orgId) ?? null;
      if ((currentOrganization?.id ?? null) === orgId) return;
      selectOrganization(org, { persist: false });
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [user, organizations, currentOrganization, selectOrganization]);
  const lastMembershipRefresh = useRef(0);
  useEffect(() => {
    if (!user) return;
    const onFocus = () => {
      const now = Date.now();
      if (now - lastMembershipRefresh.current < 6e4) return;
      lastMembershipRefresh.current = now;
      void loadMemberships().then((rows) => {
        setMemberships(rows.filter((m) => m.status !== "suspended" && m.status !== "pending"));
      }).catch(() => {
      });
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [user]);
  const setCurrentOrganization = useCallback((org) => {
    selectOrganization(org);
  }, [selectOrganization]);
  const setCurrentBranch = useCallback((branch) => {
    if (!user) return;
    setCurrentBranchState(branch);
    if (currentOrganization) {
      writeStored(branchStorageKey(user.id, currentOrganization.id), branch?.id ?? null);
    }
    clearCache();
  }, [user, currentOrganization]);
  useEffect(() => {
    if (!user || !currentOrganization || branches.length === 0 || currentBranch) return;
    const stored = readStored(branchStorageKey(user.id, currentOrganization.id));
    const match = branches.find((b) => b.id === stored);
    if (match) setCurrentBranchState(match);
  }, [user, currentOrganization, branches, currentBranch]);
  const hasPermission = useCallback((permission) => {
    // Role comes from the selected org's membership only. The global
    // highest-privilege role is never used — except platform_admin, whose
    // authority is platform-level rather than org-scoped.
    const role = resolveOrgRole(memberships, currentOrganization?.id, user?.role);
    return roleHas(role, permission);
  }, [memberships, currentOrganization, user]);
  const switchOrganization = useCallback((orgId) => {
    const org = organizations.find((o) => o.id === orgId);
    if (org) selectOrganization(org);
  }, [organizations, selectOrganization]);
  const switchBranch = useCallback((branchId) => {
    const branch = branches.find((b) => b.id === branchId);
    if (branch) setCurrentBranch(branch);
  }, [branches, setCurrentBranch]);
  const value = {
    currentOrganization,
    currentBranch,
    organizations,
    branches,
    memberships,
    setCurrentOrganization,
    setCurrentBranch,
    isLoading: isLoading || authLoading,
    hasPermission,
    switchOrganization,
    switchBranch
  };
  return <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>;
};
const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error("useOrganization must be used within OrganizationProvider");
  }
  return context;
};
export {
  OrganizationProvider,
  mapBranch,
  mapOrg,
  useOrganization
};
