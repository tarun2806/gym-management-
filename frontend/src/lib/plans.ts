import type { MembershipPlan } from '../types';

// Single source of truth for membership-plan lifecycle rules.
// `status` is stored as a free string on the doc (so legacy/blank docs keep
// reading), but the app only ever assigns 'active' | 'inactive'.

export type PlanStatus = 'active' | 'inactive';

export const PLAN_DURATIONS = ['1 month', '3 months', '6 months', '1 year'] as const;

export const PLAN_STATUSES: PlanStatus[] = ['active', 'inactive'];

/** A plan is assignable to new/renewed memberships unless explicitly inactive. */
export const isPlanActive = (plan: Pick<MembershipPlan, 'status'>): boolean =>
    plan.status !== 'inactive';

/**
 * Standard tiers seeded on first use. Prices are in ₹ to match the plans UI.
 * Note: org_id is required but will be set dynamically during plan creation.
 */
export const DEFAULT_PLANS: Array<Omit<MembershipPlan, 'id' | 'org_id'>> = [
    {
        name: 'Basic (Bronze)',
        price: 999,
        duration: '1 month',
        features: ['Gym floor access', 'Locker access', '1 intro session'],
        status: 'active',
    },
    {
        name: 'Pro (Silver)',
        price: 2499,
        duration: '3 months',
        features: ['Gym floor access', 'Group classes', 'Diet plan', '2 PT sessions'],
        status: 'active',
    },
    {
        name: 'Premium (Gold)',
        price: 7999,
        duration: '1 year',
        features: ['All areas access', 'Unlimited group classes', 'Custom diet & workout', 'Monthly PT', 'Guest passes'],
        status: 'active',
    },
];

export interface PlanInput {
    name: string;
    price: number | string;
    duration: string;
    features: string[];
}

/**
 * Validates a create/update payload. Returns the trimmed/normalized plan fields
 * on success, or a human-readable error message on failure.
 */
export const validatePlan = (
    input: PlanInput
): { ok: true; value: { name: string; price: number; duration: string; features: string[] } }
    | { ok: false; error: string } => {
    const name = (input.name || '').trim();
    if (!name) return { ok: false, error: 'Plan name is required.' };
    if (name.length > 40) return { ok: false, error: 'Plan name must be 40 characters or fewer.' };

    const price = typeof input.price === 'number' ? input.price : parseFloat(input.price);
    if (!Number.isFinite(price) || price < 0) {
        return { ok: false, error: 'Price must be a number of 0 or more.' };
    }

    if (!PLAN_DURATIONS.includes(input.duration as typeof PLAN_DURATIONS[number])) {
        return { ok: false, error: 'Choose a valid duration.' };
    }

    const features = (input.features || []).map((f) => (f || '').trim()).filter((f) => f !== '');
    if (features.length === 0) {
        return { ok: false, error: 'Add at least one feature.' };
    }

    return { ok: true, value: { name, price, duration: input.duration, features } };
};
