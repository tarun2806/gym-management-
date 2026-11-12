const PLAN_DURATIONS = ["1 month", "3 months", "6 months", "1 year"];
const PLAN_STATUSES = ["active", "inactive"];
const isPlanActive = (plan) => plan.status !== "inactive";
const DEFAULT_PLANS = [
  {
    name: "Basic (Bronze)",
    price: 999,
    duration: "1 month",
    features: ["Gym floor access", "Locker access", "1 intro session"],
    status: "active"
  },
  {
    name: "Pro (Silver)",
    price: 2499,
    duration: "3 months",
    features: ["Gym floor access", "Group classes", "Diet plan", "2 PT sessions"],
    status: "active"
  },
  {
    name: "Premium (Gold)",
    price: 7999,
    duration: "1 year",
    features: ["All areas access", "Unlimited group classes", "Custom diet & workout", "Monthly PT", "Guest passes"],
    status: "active"
  }
];
const validatePlan = (input) => {
  const name = (input.name || "").trim();
  if (!name) return { ok: false, error: "Plan name is required." };
  if (name.length > 40) return { ok: false, error: "Plan name must be 40 characters or fewer." };
  const price = typeof input.price === "number" ? input.price : parseFloat(input.price);
  if (!Number.isFinite(price) || price < 0) {
    return { ok: false, error: "Price must be a number of 0 or more." };
  }
  if (!PLAN_DURATIONS.includes(input.duration)) {
    return { ok: false, error: "Choose a valid duration." };
  }
  const features = (input.features || []).map((f) => (f || "").trim()).filter((f) => f !== "");
  if (features.length === 0) {
    return { ok: false, error: "Add at least one feature." };
  }
  return { ok: true, value: { name, price, duration: input.duration, features } };
};
export {
  DEFAULT_PLANS,
  PLAN_DURATIONS,
  PLAN_STATUSES,
  isPlanActive,
  validatePlan
};
