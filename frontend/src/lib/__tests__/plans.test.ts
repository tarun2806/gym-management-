import { describe, it, expect } from 'vitest';
import {
  validatePlan,
  isPlanActive,
  PLAN_DURATIONS,
  PLAN_STATUSES,
  DEFAULT_PLANS,
  type PlanInput,
} from '../plans';

const validInput: PlanInput = {
  name: 'Standard',
  price: 1500,
  duration: '3 months',
  features: ['Gym floor', 'Locker'],
};

describe('validatePlan — happy path', () => {
  it('accepts a fully valid payload and returns normalized fields', () => {
    const result = validatePlan(validInput);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.name).toBe('Standard');
      expect(result.value.price).toBe(1500);
      expect(result.value.duration).toBe('3 months');
      expect(result.value.features).toEqual(['Gym floor', 'Locker']);
    }
  });

  it('accepts every duration listed in PLAN_DURATIONS', () => {
    for (const duration of PLAN_DURATIONS) {
      const result = validatePlan({ ...validInput, duration });
      expect(result.ok, `duration="${duration}"`).toBe(true);
    }
  });

  it('trims the plan name and rejects whitespace-only names', () => {
    const result = validatePlan({ ...validInput, name: '   Padded   ' });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.name).toBe('Padded');
  });

  it('parses a stringified numeric price', () => {
    const result = validatePlan({ ...validInput, price: '2499.50' });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.price).toBeCloseTo(2499.5);
  });

  it('accepts price of exactly 0 (free trial plans)', () => {
    const result = validatePlan({ ...validInput, price: 0 });
    expect(result.ok).toBe(true);
  });

  it('trims feature strings and drops empty entries', () => {
    const result = validatePlan({
      ...validInput,
      features: ['  Gym floor  ', '', '  ', 'Locker'],
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.features).toEqual(['Gym floor', 'Locker']);
  });
});

describe('validatePlan — rejections', () => {
  it('rejects an empty name', () => {
    const result = validatePlan({ ...validInput, name: '' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/required/i);
  });

  it('rejects a whitespace-only name', () => {
    const result = validatePlan({ ...validInput, name: '    ' });
    expect(result.ok).toBe(false);
  });

  it('rejects a name longer than 40 characters', () => {
    const result = validatePlan({ ...validInput, name: 'x'.repeat(41) });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/40 characters/);
  });

  it('rejects a non-numeric price', () => {
    const result = validatePlan({ ...validInput, price: 'free' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/number/i);
  });

  it('rejects a negative price', () => {
    const result = validatePlan({ ...validInput, price: -1 });
    expect(result.ok).toBe(false);
  });

  it('rejects an unknown duration', () => {
    const result = validatePlan({ ...validInput, duration: 'fortnight' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/valid duration/i);
  });

  it('rejects when features array is empty', () => {
    const result = validatePlan({ ...validInput, features: [] });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/at least one feature/i);
  });

  it('rejects when every feature is whitespace and gets filtered out', () => {
    const result = validatePlan({ ...validInput, features: ['', '   ', '\t'] });
    expect(result.ok).toBe(false);
  });
});

describe('isPlanActive', () => {
  it('returns true for status="active"', () => {
    expect(isPlanActive({ status: 'active' })).toBe(true);
  });

  it('returns false for status="inactive"', () => {
    expect(isPlanActive({ status: 'inactive' })).toBe(false);
  });

  it('treats unknown / legacy status strings as active (fail-open for reads)', () => {
    // Documents are typed with free-form `status`, so a legacy blank/'Active'
    // value should NOT hide a plan from the assign-member dropdown.
    expect(isPlanActive({ status: 'Active' })).toBe(true);
    expect(isPlanActive({ status: '' })).toBe(true);
    expect(isPlanActive({ status: 'archived' })).toBe(true);
  });
});

describe('catalogue constants', () => {
  it('PLAN_DURATIONS is the exact set validatePlan will accept', () => {
    expect(PLAN_DURATIONS).toEqual(['1 month', '3 months', '6 months', '1 year']);
  });

  it('PLAN_STATUSES exposes exactly active and inactive', () => {
    expect(PLAN_STATUSES).toEqual(['active', 'inactive']);
  });

  it('DEFAULT_PLANS entries all pass isPlanActive', () => {
    for (const plan of DEFAULT_PLANS) {
      expect(isPlanActive(plan)).toBe(true);
    }
  });

  it('DEFAULT_PLANS entries all have valid durations', () => {
    for (const plan of DEFAULT_PLANS) {
      expect(PLAN_DURATIONS).toContain(plan.duration);
    }
  });

  it('DEFAULT_PLANS prices are positive numbers', () => {
    for (const plan of DEFAULT_PLANS) {
      expect(typeof plan.price).toBe('number');
      expect(plan.price).toBeGreaterThan(0);
    }
  });
});
