import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  computeCompletionStats,
  WORKOUT_OBJECTIVES,
  WORKOUT_LEVELS,
  MUSCLE_GROUPS
} from "../workouts";
const NOW = Date.UTC(2026, 5, 15, 12, 0, 0);
const DAY = 864e5;
const daysAgo = (n) => new Date(NOW - n * DAY).toISOString();
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});
afterEach(() => {
  vi.useRealTimers();
});
describe("computeCompletionStats \u2014 empty input", () => {
  it("returns zeros when completions is undefined", () => {
    expect(computeCompletionStats(void 0)).toEqual({
      total: 0,
      lastDate: void 0,
      thisWeek: 0,
      adherencePct: 0
    });
  });
  it("returns zeros when completions is an empty array", () => {
    expect(computeCompletionStats([])).toMatchObject({
      total: 0,
      thisWeek: 0,
      adherencePct: 0
    });
  });
  it("returns adherence 0 when daysPerWeek is 0 (no weekly target)", () => {
    const list = [
      { id: "1", date: daysAgo(1) },
      { id: "2", date: daysAgo(3) }
    ];
    expect(computeCompletionStats(list, 0).adherencePct).toBe(0);
  });
});
describe("computeCompletionStats \u2014 total & lastDate", () => {
  it("reports the raw list length as total", () => {
    const list = [
      { id: "1", date: daysAgo(30) },
      { id: "2", date: daysAgo(10) },
      { id: "3", date: daysAgo(1) }
    ];
    expect(computeCompletionStats(list, 3).total).toBe(3);
  });
  it("lastDate is the most recent completion (sorted ascending)", () => {
    const a = daysAgo(20);
    const b = daysAgo(5);
    const c = daysAgo(1);
    const list = [
      { id: "1", date: b },
      { id: "2", date: c },
      { id: "3", date: a }
    ];
    expect(computeCompletionStats(list, 3).lastDate).toBe(c);
  });
  it("skips completions with an empty date when picking lastDate", () => {
    const list = [
      { id: "1", date: "" },
      { id: "2", date: daysAgo(2) },
      { id: "3", date: "" }
    ];
    expect(computeCompletionStats(list, 3).lastDate).toBe(daysAgo(2));
  });
});
describe("computeCompletionStats \u2014 thisWeek (7-day window)", () => {
  it("counts only completions within the last 7 days", () => {
    const list = [
      { id: "1", date: daysAgo(1) },
      { id: "2", date: daysAgo(3) },
      { id: "3", date: daysAgo(6) },
      { id: "4", date: daysAgo(8) },
      // outside
      { id: "5", date: daysAgo(20) }
      // outside
    ];
    expect(computeCompletionStats(list, 3).thisWeek).toBe(3);
  });
  it("boundary: exactly 7 days ago is inside the window", () => {
    const list = [{ id: "1", date: daysAgo(7) }];
    expect(computeCompletionStats(list, 3).thisWeek).toBe(1);
  });
});
describe("computeCompletionStats \u2014 adherence (28-day window)", () => {
  it("computes percentage = last28 / (daysPerWeek * 4), capped at 100", () => {
    const list = [
      { id: "1", date: daysAgo(1) },
      { id: "2", date: daysAgo(3) },
      { id: "3", date: daysAgo(5) },
      { id: "4", date: daysAgo(7) },
      { id: "5", date: daysAgo(10) },
      { id: "6", date: daysAgo(14) },
      { id: "7", date: daysAgo(35) }
      // outside 28-day window
    ];
    expect(computeCompletionStats(list, 3).adherencePct).toBe(50);
  });
  it("caps adherence at 100 when the member exceeds the target", () => {
    const list = Array.from({ length: 20 }, (_, i) => ({
      id: `c${i}`,
      date: daysAgo(i)
      // 20 within the last ~3 weeks
    }));
    expect(computeCompletionStats(list, 3).adherencePct).toBe(100);
  });
  it("ignores completions older than 28 days in the adherence numerator", () => {
    const list = [
      { id: "1", date: daysAgo(30) },
      { id: "2", date: daysAgo(45) },
      { id: "3", date: daysAgo(60) }
    ];
    expect(computeCompletionStats(list, 1).adherencePct).toBe(0);
  });
  it("rounds to the nearest whole percent", () => {
    const list = [{ id: "1", date: daysAgo(2) }];
    expect(computeCompletionStats(list, 1).adherencePct).toBe(25);
  });
});
describe("workout catalogues", () => {
  it("WORKOUT_OBJECTIVES exposes the five canonical programme goals", () => {
    expect(WORKOUT_OBJECTIVES).toEqual([
      "Strength",
      "Hypertrophy",
      "Fat loss",
      "Endurance",
      "General fitness"
    ]);
  });
  it("WORKOUT_LEVELS goes beginner \u2192 intermediate \u2192 advanced", () => {
    expect(WORKOUT_LEVELS).toEqual(["Beginner", "Intermediate", "Advanced"]);
  });
  it("MUSCLE_GROUPS covers every major area the workout form offers", () => {
    expect(MUSCLE_GROUPS).toEqual([
      "Chest",
      "Back",
      "Legs",
      "Shoulders",
      "Arms",
      "Core",
      "Full body",
      "Cardio"
    ]);
  });
  it("catalogue arrays are non-empty and contain unique values", () => {
    for (const arr of [WORKOUT_OBJECTIVES, WORKOUT_LEVELS, MUSCLE_GROUPS]) {
      expect(arr.length).toBeGreaterThan(0);
      expect(new Set(arr).size).toBe(arr.length);
    }
  });
});
