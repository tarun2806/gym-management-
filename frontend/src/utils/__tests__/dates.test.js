import { describe, it, expect } from "vitest";
import {
  toISO,
  planDurationDays,
  addDays,
  expiryStatus
} from "../dates";
import { Timestamp } from "firebase/firestore";
describe("toISO", () => {
  it("returns empty string for null / undefined", () => {
    expect(toISO(null)).toBe("");
    expect(toISO(void 0)).toBe("");
  });
  it("passes through an ISO string unchanged", () => {
    const iso = "2026-01-15T10:30:00.000Z";
    expect(toISO(iso)).toBe(iso);
  });
  it("converts a numeric timestamp (ms) to ISO", () => {
    const ms = Date.UTC(2026, 0, 15, 10, 30, 0);
    expect(toISO(ms)).toBe("2026-01-15T10:30:00.000Z");
  });
  it("converts a Firestore Timestamp to ISO", () => {
    const ts = new Timestamp(17e8, 0);
    const result = toISO(ts);
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    expect(new Date(result).getUTCFullYear()).toBe(2023);
  });
  it("converts a { seconds } plain object (legacy shape) to ISO", () => {
    const result = toISO({ seconds: 17e8 });
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
describe("planDurationDays", () => {
  it("maps the four known durations to their day counts", () => {
    expect(planDurationDays("1 month")).toBe(30);
    expect(planDurationDays("3 months")).toBe(90);
    expect(planDurationDays("6 months")).toBe(180);
    expect(planDurationDays("1 year")).toBe(365);
  });
  it("falls back to 30 for an unknown duration", () => {
    expect(planDurationDays("weekly")).toBe(30);
    expect(planDurationDays("")).toBe(30);
    expect(planDurationDays(void 0)).toBe(30);
  });
});
describe("addDays", () => {
  it("adds a positive offset to an ISO date", () => {
    const result = addDays("2026-01-15T00:00:00.000Z", 30);
    expect(new Date(result).getUTCDate()).toBe(14);
    expect(new Date(result).getUTCMonth()).toBe(1);
  });
  it("subtracts days when given a negative offset", () => {
    const result = addDays("2026-01-15T00:00:00.000Z", -1);
    expect(new Date(result).getUTCDate()).toBe(14);
    expect(new Date(result).getUTCMonth()).toBe(0);
  });
  it("crosses a year boundary correctly", () => {
    const result = addDays("2026-12-31T00:00:00.000Z", 1);
    expect(new Date(result).getUTCFullYear()).toBe(2027);
    expect(new Date(result).getUTCMonth()).toBe(0);
    expect(new Date(result).getUTCDate()).toBe(1);
  });
  it("handles a date-only ISO string (no time component)", () => {
    const result = addDays("2026-01-01", 3);
    expect(result).toMatch(/^2026-01-0[34]/);
  });
  it('defaults to "now" when given an empty string', () => {
    const before = Date.now();
    const result = addDays("", 0);
    const after = Date.now();
    const ts = new Date(result).getTime();
    expect(ts).toBeGreaterThanOrEqual(before - 1e3);
    expect(ts).toBeLessThanOrEqual(after + 1e3);
  });
});
describe("expiryStatus", () => {
  it('returns "none" for undefined expiry', () => {
    expect(expiryStatus(void 0)).toBe("none");
  });
  it('returns "none" for an unparseable string', () => {
    expect(expiryStatus("not-a-date")).toBe("none");
  });
  it('returns "expired" for a date in the past', () => {
    const past = new Date(Date.now() - 30 * 24 * 60 * 60 * 1e3).toISOString();
    expect(expiryStatus(past)).toBe("expired");
  });
  it('returns "expiring" for a date within the next 7 days (exclusive)', () => {
    const soon = new Date(Date.now() + 3 * 24 * 60 * 60 * 1e3).toISOString();
    expect(expiryStatus(soon)).toBe("expiring");
  });
  it('returns "active" for a date more than 7 days out', () => {
    const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3).toISOString();
    expect(expiryStatus(future)).toBe("active");
  });
  it('boundary: exactly 8 days out is "active"', () => {
    const justOutside = new Date(Date.now() + 8 * 24 * 60 * 60 * 1e3).toISOString();
    expect(expiryStatus(justOutside)).toBe("active");
  });
  it('boundary: exactly 6 days out is "expiring"', () => {
    const justInside = new Date(Date.now() + 6 * 24 * 60 * 60 * 1e3).toISOString();
    expect(expiryStatus(justInside)).toBe("expiring");
  });
});
