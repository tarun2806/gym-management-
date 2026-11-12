/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import { api } from '../lib/api';
import type { Organization, Branch, OrganizationMembership } from '../types';
import type { Capability } from '../lib/permissions';
import { roleHas } from '../lib/permissions';
import { clearCache } from '../lib/cache';
import { useAuth } from './AuthContext';

interface OrganizationContextType {
  currentOrganization: Organization | null;
  currentBranch: Branch | null;
  organizations: Organization[];
  branches: Branch[];
  memberships: OrganizationMembership[];
  setCurrentOrganization: (org: Organization | null) => void;
  setCurrentBranch: (branch: Branch | null) => void;
  isLoading: boolean;
  hasPermission: (permission: string) => boolean;
  switchOrganization: (orgId: string) => void;
  switchBranch: (branchId: string) => void;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

const orgStorageKey = (uid: string) => `gympro:org:${uid}`;
const branchStorageKey = (uid: string, orgId: string) => `gympro:branch:${uid}:${orgId}`;

const readStored = (key: string): string | null => {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const writeStored = (key: string, value: string | null) => {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    // Storage unavailable (private mode) — selection just won't persist.
  }
};

// API rows use organization_id; frontend types use org_id. settings arrives
// as a JSON string column — parse it into the typed object.
export const mapOrg = (row: Record<string, unknown>): Organization => {
  const { settings, ...rest } = row;
  let parsed: Organization['settings'];
  if (typeof settings === 'string') {
    try { parsed = JSON.parse(settings); } catch { parsed = undefined; }
  } else {
    parsed = settings as Organization['settings'];
  }
  return { ...(rest as Omit<Organization, 'settings'>), settings: parsed } as Organization;
};

export const mapBranch = (row: Record<string, unknown>): Branch => {
  const { organization_id, ...rest } = row;
  return { ...(rest as Omit<Branch, 'org_id'>), org_id: String(organization_id ?? '') } as Branch;
};

const mapMembership = (row: Record<string, unknown>): OrganizationMembership => {
  const { organization_id, ...rest } = row;
  return { ...(rest as Omit<OrganizationMembership, 'org_id'>), org_id: String(organization_id ?? '') } as OrganizationMembership;
};

export const OrganizationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, isLoading: authLoading, can } = useAuth();

  const [currentOrganization, setCurrentOrganizationState] = useState<Organization | null>(null);
  const [currentBranch, setCurrentBranchState] = useState<Branch | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [memberships, setMemberships] = useState<OrganizationMembership[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Guards against out-of-order async loads when the user switches accounts.
  const loadSeq = useRef(0);

  const resetTenantState = useCallback(() => {
    setCurrentOrganizationState(null);
    setCurrentBranchState(null);
    setOrganizations([]);
    setBranches([]);
    setMemberships([]);
    clearCache();
  }, []);

  const loadBranchesForOrg = useCallback(async (orgId: string) => {
    try {
      const rows = await api<Record<string, unknown>[]>(`/api/organizations/${orgId}/branches`, {
        scope: { orgId },
      });
      const mapped = rows.map(mapBranch);
      mapped.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      setBranches(mapped);
    } catch (err) {
      console.error('Error fetching branches:', err);
      setBranches([]);
    }
  }, []);

  const loadMemberships = useCallback(async (): Promise<OrganizationMembership[]> => {
    const rows = await api<Record<string, unknown>[]>('/api/me/memberships');
    return rows.map(mapMembership);
  }, []);

  const selectOrganization = useCallback((org: Organization | null, opts?: { persist?: boolean }) => {
    if (!user) return;
    setCurrentOrganizationState(org);
    setCurrentBranchState(null);
    setBranches([]);
    // Tenant-scoped caches must never survive an org switch.
    clearCache();
    if (opts?.persist !== false) {
      writeStored(orgStorageKey(user.id), org?.id ?? null);
      writeStored(branchStorageKey(user.id, org?.id ?? ''), null);
    }
    if (org) {
      void loadBranchesForOrg(org.id);
    }
  }, [user, loadBranchesForOrg]);

  // Load memberships + organizations whenever the signed-in user changes.
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

        const active = rows.filter(m => m.status !== 'suspended' && m.status !== 'pending');
        setMemberships(active);

        const orgRows = await api<Record<string, unknown>[]>('/api/organizations');
        if (cancelled || seq !== loadSeq.current) return;

        const orgs = orgRows
          .map(mapOrg)
          .filter(o => o.status !== 'suspended');

        if (cancelled || seq !== loadSeq.current) return;

        setOrganizations(orgs);

        // Restore the stored selection, falling back to the first org.
        const storedOrgId = readStored(orgStorageKey(uid));
        const initial = orgs.find(o => o.id === storedOrgId) ?? orgs[0] ?? null;
        setCurrentOrganizationState(initial);
        setCurrentBranchState(null);
        setBranches([]);
        if (initial) {
          void loadBranchesForOrg(initial.id);
        }
      } catch (err) {
        console.error('Error loading organization context:', err);
        if (!cancelled) resetTenantState();
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, isAuthenticated]);

  // Multi-tab consistency: when another tab changes the stored org/branch
  // selection, follow it here.
  useEffect(() => {
    if (!user) return;
    const onStorage = (e: StorageEvent) => {
      if (e.key !== orgStorageKey(user.id)) return;
      const orgId = e.newValue;
      const org = organizations.find(o => o.id === orgId) ?? null;
      if ((currentOrganization?.id ?? null) === orgId) return;
      selectOrganization(org, { persist: false });
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [user, organizations, currentOrganization, selectOrganization]);

  // Refresh memberships when the window regains focus so role/status changes
  // made elsewhere take effect without a full reload. Throttled to once a minute.
  const lastMembershipRefresh = useRef(0);
  useEffect(() => {
    if (!user) return;
    const onFocus = () => {
      const now = Date.now();
      if (now - lastMembershipRefresh.current < 60_000) return;
      lastMembershipRefresh.current = now;
      void loadMemberships()
        .then(rows => {
          setMemberships(rows.filter(m => m.status !== 'suspended' && m.status !== 'pending'));
        })
        .catch(() => { /* offline or auth failure — keep last known state */ });
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [user]);

  const setCurrentOrganization = useCallback((org: Organization | null) => {
    selectOrganization(org);
  }, [selectOrganization]);

  const setCurrentBranch = useCallback((branch: Branch | null) => {
    if (!user) return;
    setCurrentBranchState(branch);
    if (currentOrganization) {
      writeStored(branchStorageKey(user.id, currentOrganization.id), branch?.id ?? null);
    }
    // Branch switches must not leak cached branch-scoped data either.
    clearCache();
  }, [user, currentOrganization]);

  // Restore persisted branch once branches for the current org have loaded.
  useEffect(() => {
    if (!user || !currentOrganization || branches.length === 0 || currentBranch) return;
    const stored = readStored(branchStorageKey(user.id, currentOrganization.id));
    const match = branches.find(b => b.id === stored);
    if (match) setCurrentBranchState(match);
  }, [user, currentOrganization, branches, currentBranch]);

  const hasPermission = useCallback((permission: string): boolean => {
    // Prefer the membership role inside the active organization; fall back to
    // the account-level role when no org context exists yet.
    const membership = memberships.find(m => m.org_id === currentOrganization?.id);
    const role = membership?.role;
    if (role) return roleHas(role, permission as Capability);
    return can(permission as Capability);
  }, [memberships, currentOrganization, can]);

  const switchOrganization = useCallback((orgId: string) => {
    const org = organizations.find(o => o.id === orgId);
    if (org) selectOrganization(org);
  }, [organizations, selectOrganization]);

  const switchBranch = useCallback((branchId: string) => {
    const branch = branches.find(b => b.id === branchId);
    if (branch) setCurrentBranch(branch);
  }, [branches, setCurrentBranch]);

  const value: OrganizationContextType = {
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
    switchBranch,
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
};

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrganization must be used within OrganizationProvider');
  }
  return context;
};
