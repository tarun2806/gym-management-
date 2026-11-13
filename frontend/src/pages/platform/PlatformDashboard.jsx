import { useEffect, useState } from "react";
import { platformService } from "../../lib/services";

const fmtMoney = (v) => `₹${Number(v ?? 0).toLocaleString("en-IN")}`;

export default function PlatformDashboard() {
  const [m, setM] = useState(null);
  const [err, setErr] = useState(null);
  useEffect(() => {
    platformService.metrics().then(setM).catch((e) => setErr(e.message));
  }, []);

  if (err) return <div className="rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">{err}</div>;
  if (!m) return <p className="text-sm text-slate-500">Loading metrics…</p>;

  const cards = [
    ["Total organizations", m.total_organizations],
    ["Active", m.active_organizations],
    ["Suspended", m.suspended_organizations],
    ["Trialing", m.trialing],
    ["Active subscriptions", m.active_subscriptions],
    ["Expired", m.expired_subscriptions],
    ["Trials ending ≤7d", m.trials_expiring_soon],
    ["Renewals due ≤7d", m.renewals_due_soon],
    ["Gym owners", m.total_gym_owners],
    ["Verified revenue", fmtMoney(m.verified_revenue)],
  ];
  return (
    <div>
      <h1 className="page-title">Platform Overview</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map(([label, val]) => (
          <div key={label} className="surface-card p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
            <p className="mt-1 text-2xl font-semibold">{val}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
