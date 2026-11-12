import { Timestamp } from "firebase/firestore";
function toISO(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number") return new Date(value).toISOString();
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if ("seconds" in value) return new Date(value.seconds * 1e3).toISOString();
  return "";
}
const DURATION_DAYS = {
  "1 month": 30,
  "3 months": 90,
  "6 months": 180,
  "1 year": 365
};
function planDurationDays(duration) {
  return DURATION_DAYS[duration] ?? 30;
}
function addDays(iso, days) {
  const d = new Date(iso || (/* @__PURE__ */ new Date()).toISOString());
  d.setDate(d.getDate() + days);
  return d.toISOString();
}
function expiryStatus(expiryISO) {
  if (!expiryISO) return "none";
  const now = Date.now();
  const expiry = new Date(expiryISO).getTime();
  if (Number.isNaN(expiry)) return "none";
  if (expiry < now) return "expired";
  if (expiry - now < 7 * 24 * 60 * 60 * 1e3) return "expiring";
  return "active";
}
export {
  addDays,
  expiryStatus,
  planDurationDays,
  toISO
};
