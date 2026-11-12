import type { WorkoutCompletion } from '../types';

// Catalogues for workout programming. Kept here so the create form, the detail
// modal and any future backend checks share one source of truth.
export const WORKOUT_OBJECTIVES = [
    'Strength',
    'Hypertrophy',
    'Fat loss',
    'Endurance',
    'General fitness',
] as const;

export const WORKOUT_LEVELS = ['Beginner', 'Intermediate', 'Advanced'] as const;

export const MUSCLE_GROUPS = [
    'Chest',
    'Back',
    'Legs',
    'Shoulders',
    'Arms',
    'Core',
    'Full body',
    'Cardio',
] as const;

export interface CompletionStats {
    total: number;
    lastDate?: string;
    thisWeek: number;
    adherencePct: number;
}

// Pure: derive progress from a plan's completion log. Adherence compares sessions
// completed in the last 28 days against the expected count (days_per_week * 4);
// returns 0 when the plan has no weekly target.
export const computeCompletionStats = (
    completions: WorkoutCompletion[] | undefined,
    daysPerWeek = 0,
): CompletionStats => {
    const list = completions ?? [];
    const dates = list.map((c) => c.date).filter(Boolean).sort();
    const now = Date.now();
    const DAY = 86_400_000;
    const within = (ms: number) => (d: string) => now - new Date(d).getTime() <= ms;
    const thisWeek = list.filter((c) => c.date && within(7 * DAY)(c.date)).length;
    const last28 = list.filter((c) => c.date && within(28 * DAY)(c.date)).length;
    const expected = daysPerWeek > 0 ? daysPerWeek * 4 : 0;
    return {
        total: list.length,
        lastDate: dates[dates.length - 1],
        thisWeek,
        adherencePct: expected ? Math.min(100, Math.round((last28 / expected) * 100)) : 0,
    };
};
