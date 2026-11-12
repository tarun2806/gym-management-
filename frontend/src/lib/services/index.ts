import { api, type ApiScope } from '../api';
import { cached, invalidate } from '../cache';
import type {
    Member,
    Trainer,
    ClassData,
    AttendanceRecord,
    Payment,
    EquipmentItem,
} from '../../types';
import type { Scope, Entity } from './firestore';

/**
 * Domain services — now backed by the Spring Boot REST API (M5 rewire).
 * Exported signatures are unchanged so pages don't need modification.
 * The Firestore implementations remain in ./firestore.ts for reference and
 * for any module not yet ported.
 */

const LIST_TTL_MS = 60_000;
const scopeKey = (prefix: string, scope?: Scope) =>
    `${prefix}:${scope?.orgId ?? 'all'}:${scope?.branchId ?? 'all'}`;
const invalidateAll = (prefix: string) => invalidate(`${prefix}:`);

const asEntity = <T>(row: Record<string, unknown>): Entity<T> =>
    ({ id: String(row.id), ...row }) as Entity<T>;

const toScope = (scope?: Scope): ApiScope | undefined =>
    scope ? { orgId: scope.orgId ?? undefined, branchId: scope.branchId ?? undefined } : undefined;

// ---------------------------------------------------------------------------
// Members
// ---------------------------------------------------------------------------

export const memberService = {
    list: (scope?: Scope) =>
        cached(scopeKey('members', scope), LIST_TTL_MS, async () => {
            const rows = await api<Record<string, unknown>[]>('/api/members', { scope: toScope(scope) });
            return rows.map(asEntity<Member>);
        }),

    listActive: (scope?: Scope) =>
        cached(scopeKey('members:active', scope), LIST_TTL_MS, async () => {
            const rows = await api<Record<string, unknown>[]>('/api/members/active', { scope: toScope(scope) });
            return rows.map(asEntity<Member>);
        }),

    count: async (scope?: Scope) => {
        const rows = await api<Record<string, unknown>[]>('/api/members', { scope: toScope(scope) });
        return rows.length;
    },

    create: async (scope: Scope | undefined, data: Partial<Member>) => {
        const row = await api<Record<string, unknown>>('/api/members', {
            method: 'POST',
            scope: toScope(scope),
            body: {
                join_date: new Date().toISOString().split('T')[0],
                ...data,
            },
        });
        invalidateAll('members');
        return String(row.id);
    },

    update: async (id: string, data: Partial<Member>) => {
        await api(`/api/members/${id}`, { method: 'PUT', body: data });
        invalidateAll('members');
    },

    remove: async (id: string) => {
        await api(`/api/members/${id}`, { method: 'DELETE' });
        invalidateAll('members');
    },
};

// ---------------------------------------------------------------------------
// Trainers
// ---------------------------------------------------------------------------

export const trainerService = {
    list: (scope?: Scope) =>
        cached(scopeKey('trainers', scope), LIST_TTL_MS, async () => {
            const rows = await api<Record<string, unknown>[]>('/api/trainers', { scope: toScope(scope) });
            return rows.map(asEntity<Trainer>);
        }),

    create: async (scope: Scope | undefined, data: Partial<Trainer>) => {
        const row = await api<Record<string, unknown>>('/api/trainers', {
            method: 'POST',
            scope: toScope(scope),
            body: data,
        });
        invalidateAll('trainers');
        return String(row.id);
    },

    update: async (id: string, data: Partial<Trainer>) => {
        await api(`/api/trainers/${id}`, { method: 'PUT', body: data });
        invalidateAll('trainers');
    },

    remove: async (id: string) => {
        await api(`/api/trainers/${id}`, { method: 'DELETE' });
        invalidateAll('trainers');
    },
};

// ---------------------------------------------------------------------------
// Classes
// ---------------------------------------------------------------------------

export const classService = {
    list: (scope?: Scope) =>
        cached(scopeKey('classes', scope), LIST_TTL_MS, async () => {
            const rows = await api<Record<string, unknown>[]>('/api/classes', { scope: toScope(scope) });
            return rows.map(asEntity<ClassData>);
        }),

    create: async (scope: Scope | undefined, data: Partial<ClassData>) => {
        const row = await api<Record<string, unknown>>('/api/classes', {
            method: 'POST',
            scope: toScope(scope),
            body: { enrolled: 0, ...data },
        });
        invalidateAll('classes');
        return String(row.id);
    },

    update: async (id: string, data: Partial<ClassData>) => {
        await api(`/api/classes/${id}`, { method: 'PUT', body: data });
        invalidateAll('classes');
    },

    remove: async (id: string) => {
        await api(`/api/classes/${id}`, { method: 'DELETE' });
        invalidateAll('classes');
    },
};

// ---------------------------------------------------------------------------
// Attendance
// ---------------------------------------------------------------------------

export const attendanceService = {
    /** Records checked in today, newest first. */
    listToday: async (scope?: Scope): Promise<Entity<AttendanceRecord>[]> => {
        const rows = await api<Record<string, unknown>[]>('/api/attendance', {
            scope: toScope(scope),
        });
        return rows.map(asEntity<AttendanceRecord>);
    },

    /** True when the member already has an open (not checked-out) session today. */
    hasOpenSessionToday: async (scope: Scope | undefined, memberId: string): Promise<boolean> => {
        const rows = await attendanceService.listToday(scope);
        return rows.some(r => r.member_id === memberId && !r.check_out);
    },

    /** Check-in via the dedicated endpoint — server enforces the open-session rule. */
    create: async (scope: Scope | undefined, data: Partial<AttendanceRecord>) => {
        const row = await api<Record<string, unknown>>('/api/attendance/check-in', {
            method: 'POST',
            scope: toScope(scope),
            body: data,
        });
        return String(row.id);
    },

    checkOut: (id: string, scope?: Scope) =>
        api(`/api/attendance/${id}/check-out`, { method: 'POST', scope: toScope(scope) }),
};

// ---------------------------------------------------------------------------
// Payments
// ---------------------------------------------------------------------------

export const PAYMENT_PAGE_SIZE = 50;

export const paymentService = {
    list: async (scope?: Scope, pageSize = PAYMENT_PAGE_SIZE) => {
        const rows = await api<Record<string, unknown>[]>(
            `/api/payments?page=0&size=${pageSize}`,
            { scope: toScope(scope) },
        );
        return rows.map(asEntity<Payment>);
    },

    /** Offset-paginated payments. Kept for signature compatibility. */
    listPage: async (
        scope: Scope | undefined,
        _lastDoc: unknown,
        pageSize = PAYMENT_PAGE_SIZE,
    ) => {
        const rows = await paymentService.list(scope, pageSize);
        return {
            rows,
            lastSnapshot: null,
            hasMore: rows.length === pageSize,
        };
    },

    create: async (scope: Scope | undefined, data: Partial<Payment>) => {
        const row = await api<Record<string, unknown>>('/api/payments', {
            method: 'POST',
            scope: toScope(scope),
            body: data,
        });
        return String(row.id);
    },
};

// ---------------------------------------------------------------------------
// Equipment
// ---------------------------------------------------------------------------

export const equipmentService = {
    list: (scope?: Scope) =>
        cached(scopeKey('equipment', scope), LIST_TTL_MS, async () => {
            const rows = await api<Record<string, unknown>[]>('/api/equipment', { scope: toScope(scope) });
            return rows.map(asEntity<EquipmentItem>);
        }),

    create: async (scope: Scope | undefined, data: Partial<EquipmentItem>) => {
        const row = await api<Record<string, unknown>>('/api/equipment', {
            method: 'POST',
            scope: toScope(scope),
            body: data,
        });
        invalidateAll('equipment');
        return String(row.id);
    },

    update: async (id: string, data: Partial<EquipmentItem>) => {
        await api(`/api/equipment/${id}`, { method: 'PUT', body: data });
        invalidateAll('equipment');
    },

    remove: async (id: string) => {
        await api(`/api/equipment/${id}`, { method: 'DELETE' });
        invalidateAll('equipment');
    },
};
