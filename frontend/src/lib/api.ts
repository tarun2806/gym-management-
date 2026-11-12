import { auth } from './firebase';

/**
 * REST client for the Spring Boot API (gympro-api).
 *
 * - Auth: Firebase ID token (retained during migration — same accounts).
 * - Tenant context: X-Org-Id / X-Branch-Id headers from the caller's Scope,
 *   matching how OrganizationContext already tracks the active org.
 * - Field naming: the API serializes snake_case, matching frontend types.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8090';

export interface ApiScope {
    orgId?: string;
    branchId?: string;
}

export class ApiError extends Error {
    status: number;

    constructor(status: number, message: string) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
    }
}

async function token(): Promise<string | null> {
    const user = auth.currentUser;
    return user ? user.getIdToken() : null;
}

/** Resolve tenant headers: explicit scope wins, else the persisted active org. */
function tenantHeaders(scope?: ApiScope): Record<string, string> {
    const headers: Record<string, string> = {};
    let orgId: string | null | undefined = scope?.orgId;
    if (!orgId && auth.currentUser) {
        try {
            orgId = window.localStorage.getItem(`gympro:org:${auth.currentUser.uid}`);
        } catch { /* storage unavailable */ }
    }
    if (orgId) headers['X-Org-Id'] = orgId;
    const branchId = scope?.branchId ?? undefined;
    if (branchId) headers['X-Branch-Id'] = branchId;
    return headers;
}

export async function api<T = unknown>(
    path: string,
    options: {
        method?: string;
        body?: unknown;
        scope?: ApiScope;
    } = {},
): Promise<T> {
    const { method = 'GET', body, scope } = options;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };

    const t = await token();
    if (t) headers['Authorization'] = `Bearer ${t}`;
    Object.assign(headers, tenantHeaders(scope));

    const res = await fetch(`${API_BASE}${path}`, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
        let message = `API ${res.status}`;
        try {
            const err = await res.json();
            if (err?.message) message = err.message;
        } catch {
            /* non-JSON error body */
        }
        throw new ApiError(res.status, message);
    }

    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
}
