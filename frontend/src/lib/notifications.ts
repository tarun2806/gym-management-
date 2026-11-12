import { api } from './api';
import { memberService, equipmentService } from './services';
import { toISO, expiryStatus } from '../utils/dates';

const DAY_MS = 24 * 60 * 60 * 1000;

export type NotifCategory = 'membership' | 'equipment';
export type NotifSeverity = 'warning' | 'critical';

export interface AppNotification {
    /** Stable key so read-state survives reloads (member:{id}, equip:{id}). */
    id: string;
    category: NotifCategory;
    title: string;
    body: string;
    link: string;
    severity: NotifSeverity;
    /** Epoch ms used to sort most-urgent/recent first. */
    sort_ts: number;
}

export interface NotifQueryOpts {
    membership: boolean;
    equipment: boolean;
}

export interface WithRead extends AppNotification {
    read: boolean;
}

/**
 * Derives alerts from live API data (org-scoped via the persisted tenant
 * headers). Nothing is authored — only read state is persisted server-side.
 * Categories the caller can't see are simply not queried.
 */
export const fetchNotifications = async (
    opts: NotifQueryOpts
): Promise<AppNotification[]> => {
    const weekAhead = Date.now() + 7 * DAY_MS;

    const membershipTask = async (): Promise<AppNotification[]> => {
        try {
            const members = await memberService.list();
            return members
                .map((m) => {
                    const expiry = toISO(m.expiry_date);
                    return { id: m.id, name: m.name || 'Unknown', expiry, status: m.status || '' };
                })
                .filter((m) => m.status === 'Active' && m.expiry && new Date(m.expiry).getTime() <= weekAhead)
                .map((m) => {
                    const st = expiryStatus(m.expiry);
                    if (st !== 'expired' && st !== 'expiring') return null;
                    const ts = new Date(m.expiry).getTime();
                    const days = Math.max(0, Math.ceil((ts - Date.now()) / DAY_MS));
                    return {
                        id: `member:${m.id}`,
                        category: 'membership' as NotifCategory,
                        title: st === 'expired'
                            ? `${m.name}'s membership expired`
                            : `${m.name}'s membership expires soon`,
                        body: st === 'expired'
                            ? `Lapsed on ${new Date(m.expiry).toLocaleDateString()}.`
                            : `${days <= 1 ? 'Today' : `${days} days left`} — renew to keep access.`,
                        link: '/members',
                        severity: st === 'expired' ? 'critical' as NotifSeverity : 'warning' as NotifSeverity,
                        sort_ts: ts,
                    };
                })
                .filter((n): n is AppNotification => n !== null);
        } catch (err) {
            console.error('Notification fetch failed (membership):', err);
            return [];
        }
    };

    const equipmentTask = async (): Promise<AppNotification[]> => {
        try {
            const items = await equipmentService.list();
            const now = Date.now();
            return items
                .map((e) => ({
                    id: e.id,
                    name: e.name || 'Unnamed item',
                    status: e.status || '',
                    next: toISO(e.next_maintenance),
                }))
                .filter((e) => e.status !== 'operational' || (e.next && new Date(e.next).getTime() < now))
                .map((e) => {
                    const overdueMaint = !!e.next && new Date(e.next).getTime() < now;
                    const critical = e.status === 'broken';
                    const ts = overdueMaint ? new Date(e.next).getTime() : now;
                    return {
                        id: `equip:${e.id}`,
                        category: 'equipment' as NotifCategory,
                        title: `${e.name} needs attention`,
                        body: critical
                            ? 'Reported broken — remove from service and log a repair.'
                            : e.status === 'maintenance'
                                ? 'Currently under maintenance.'
                                : overdueMaint
                                    ? `Scheduled maintenance was due ${new Date(e.next).toLocaleDateString()}.`
                                    : 'Not marked operational.',
                        link: '/equipment',
                        severity: critical ? 'critical' as NotifSeverity : 'warning' as NotifSeverity,
                        sort_ts: ts,
                    };
                });
        } catch (err) {
            console.error('Notification fetch failed (equipment):', err);
            return [];
        }
    };

    const tasks: Array<Promise<AppNotification[]>> = [];
    if (opts.membership) tasks.push(membershipTask());
    if (opts.equipment) tasks.push(equipmentTask());
    if (tasks.length === 0) return [];

    const groups = await Promise.all(tasks);
    return groups
        .flat()
        .sort((a, b) => b.sort_ts - a.sort_ts);
};

interface NotificationStateResponse {
    readIds?: unknown;
}

/** The caller's persisted read ids (empty when state is missing). */
export const fetchReadIds = async (): Promise<string[]> => {
    try {
        const res = await api<NotificationStateResponse>('/api/me/notification-state');
        return Array.isArray(res?.readIds) ? res.readIds.map(String) : [];
    } catch (err) {
        console.error('Notification read-state fetch failed:', err);
        return [];
    }
};

/** Marks the given ids read on the caller's server-side notification state. */
export const markNotificationsRead = async (ids: string[]): Promise<void> => {
    const toMark = ids.filter(Boolean);
    if (toMark.length === 0) return;
    await api('/api/me/notification-state/read', {
        method: 'POST',
        body: { ids: toMark },
    });
};

/** Combines alerts with read ids for consistent use in Header and the page. */
export const mergeRead = (
    notifs: AppNotification[],
    readIds: string[]
): { all: WithRead[]; unreadCount: number } => {
    const set = new Set(readIds);
    const all = notifs.map((n) => ({ ...n, read: set.has(n.id) }));
    return { all, unreadCount: all.filter((n) => !n.read).length };
};
