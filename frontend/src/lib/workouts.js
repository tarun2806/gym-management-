const WORKOUT_OBJECTIVES = [
  "Strength",
  "Hypertrophy",
  "Fat loss",
  "Endurance",
  "General fitness"
];
const WORKOUT_LEVELS = ["Beginner", "Intermediate", "Advanced"];
const MUSCLE_GROUPS = [
  "Chest",
  "Back",
  "Legs",
  "Shoulders",
  "Arms",
  "Core",
  "Full body",
  "Cardio"
];
const computeCompletionStats = (completions, daysPerWeek = 0) => {
  const list = completions ?? [];
  const dates = list.map((c) => c.date).filter(Boolean).sort();
  const now = Date.now();
  const DAY = 864e5;
  const within = (ms) => (d) => now - new Date(d).getTime() <= ms;
  const thisWeek = list.filter((c) => c.date && within(7 * DAY)(c.date)).length;
  const last28 = list.filter((c) => c.date && within(28 * DAY)(c.date)).length;
  const expected = daysPerWeek > 0 ? daysPerWeek * 4 : 0;
  return {
    total: list.length,
    lastDate: dates[dates.length - 1],
    thisWeek,
    adherencePct: expected ? Math.min(100, Math.round(last28 / expected * 100)) : 0
  };
};
export {
  MUSCLE_GROUPS,
  WORKOUT_LEVELS,
  WORKOUT_OBJECTIVES,
  computeCompletionStats
};
