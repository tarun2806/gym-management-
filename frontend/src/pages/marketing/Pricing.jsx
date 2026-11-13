import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import MarketingLayout from "./MarketingLayout";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8090";

export default function Pricing() {
  const [plans, setPlans] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/api/subscription/plans`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setPlans)
      .catch(() => setError(true));
  }, []);

  return (
    <MarketingLayout>
      <section className="bg-ink-900 text-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h1 className="font-display text-4xl font-semibold">Pricing</h1>
          <p className="mt-4 max-w-2xl text-slate-300">
            14-day free trial · Annual subscriptions · INR via Razorpay.
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        {error ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
            Live plan pricing is temporarily unavailable. Please{" "}
            <Link to="/contact" className="font-semibold underline">contact us</Link> for current annual plans.
          </div>
        ) : plans === null ? (
          <p className="text-sm text-slate-500">Loading plans…</p>
        ) : plans.length === 0 ? (
          <div className="surface-card p-6 text-sm text-slate-600">
            No published plans yet —{" "}
            <Link to="/contact" className="font-semibold text-brand-700 underline">contact us</Link> to discuss annual pricing.
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((p) => (
              <div key={p.id} className="surface-card p-6">
                <h2 className="text-xl font-semibold">{p.name}</h2>
                {p.description && <p className="mt-1 text-sm text-slate-500">{p.description}</p>}
                <p className="mt-4 font-display text-3xl font-semibold">
                  ₹{Number(p.annual_price).toLocaleString("en-IN")}
                  <span className="text-sm font-medium text-slate-400"> / year</span>
                </p>
                <p className="mt-1 text-xs text-slate-400">{p.currency} · billed annually · {p.duration_days ?? 365} days</p>
                {p.features && <p className="mt-3 text-sm text-slate-600">{p.features}</p>}
                <Link to="/login" className="mt-6 inline-flex rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600">
                  Start 14-day trial
                </Link>
              </div>
            ))}
          </div>
        )}
        <div className="mt-10 rounded-2xl bg-slate-50 p-6 text-sm text-slate-600">
          <p className="font-semibold text-slate-900">How to get started</p>
          <p className="mt-2">
            Gym owner registration requires a valid vendor-issued activation key.{" "}
            <Link to="/contact" className="font-semibold text-brand-700 underline">Contact us</Link> to request one, or{" "}
            <Link to="/login" className="font-semibold text-brand-700 underline">sign in</Link> if you already have an account.
          </p>
        </div>
      </section>
    </MarketingLayout>
  );
}
