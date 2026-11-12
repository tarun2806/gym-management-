import { Timestamp } from 'firebase/firestore';

type TimestampLike = Timestamp | { seconds: number } | string | number | null | undefined;

// Firestore docs written before this helper store ISO strings; newer writes use
// Timestamps. Normalize to ISO at the read boundary so the rest of the app only
// sees one type.
export function toISO(value: TimestampLike): string {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return new Date(value).toISOString();
    if (value instanceof Timestamp) return value.toDate().toISOString();
    if ('seconds' in value) return new Date(value.seconds * 1000).toISOString();
    return '';
}

const DURATION_DAYS: Record<string, number> = {
    '1 month': 30,
    '3 months': 90,
    '6 months': 180,
    '1 year': 365,
};

export function planDurationDays(duration: string): number {
    return DURATION_DAYS[duration] ?? 30;
}

export function addDays(iso: string, days: number): string {
    const d = new Date(iso || new Date().toISOString());
    d.setDate(d.getDate() + days);
    return d.toISOString();
}

export type ExpiryStatus = 'none' | 'expired' | 'expiring' | 'active';

export function expiryStatus(expiryISO?: string): ExpiryStatus {
    if (!expiryISO) return 'none';
    const now = Date.now();
    const expiry = new Date(expiryISO).getTime();
    if (Number.isNaN(expiry)) return 'none';
    if (expiry < now) return 'expired';
    if (expiry - now < 7 * 24 * 60 * 60 * 1000) return 'expiring';
    return 'active';
}
