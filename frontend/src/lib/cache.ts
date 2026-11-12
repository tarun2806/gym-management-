/**
 * Small in-memory TTL cache for reference data (plans, branches, org
 * settings). Keys MUST include the tenant scope (e.g. `plans:org_123`) so
 * entries never leak across organizations. The whole cache is cleared on
 * organization/user switch — see OrganizationContext.
 *
 * Deliberately not persisted: sessionStorage persistence of tenant data is a
 * leak vector, and Firestore's own persistence already covers offline reads.
 */

interface CacheEntry {
    value: unknown;
    expiresAt: number;
}

const store = new Map<string, CacheEntry>();
const MAX_ENTRIES = 200;

export async function cached<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
    const hit = store.get(key);
    if (hit && hit.expiresAt > Date.now()) {
        return hit.value as T;
    }
    const value = await fetcher();
    if (store.size >= MAX_ENTRIES) {
        // Drop expired entries first, then oldest remaining.
        const now = Date.now();
        for (const [k, v] of store) {
            if (v.expiresAt <= now) store.delete(k);
        }
        if (store.size >= MAX_ENTRIES) {
            const oldest = store.keys().next().value;
            if (oldest !== undefined) store.delete(oldest);
        }
    }
    store.set(key, { value, expiresAt: Date.now() + ttlMs });
    return value;
}

export function invalidate(prefix: string): void {
    for (const key of store.keys()) {
        if (key.startsWith(prefix)) store.delete(key);
    }
}

export function clearCache(): void {
    store.clear();
}
