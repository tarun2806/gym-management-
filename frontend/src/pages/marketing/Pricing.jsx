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
      <section className="bg-slate-900 text-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <h1 className="text-4xl font-extrabold">Pricing</h1>
          <p className="mt-4 max-w-2xl text-slate-300">
            14-day free trial · Annual subscriptions · INR via Razorpay.
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        {error ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
            Live plan pricing is temporarily unavailable. Please{" "}
            <Link to="/contact" className="font-bold underline">contact us</Link> for current annual plans.
          </div>
        ) : plans === null ? (
          <p className="text-sm text-slate-500">Loading plans…</p>
        ) : plans.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 p-6 text-sm text-slate-600">
            No published plans yet —{" "}
            <Link to="/contact" className="font-bold text-emerald-600 underline">contact us</Link> to discuss annual pricing.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((p) => (
              <div key={p.id} className="rounded-2xl border border-slate-200 p-6">
                <h2 className="text-xl font-extrabold">{p.name}</h2>
                {p.description && <p className="mt-1 text-sm text-slate-500">{p.description}</p>}
                <p className="mt-4 text-3xl font-extrabold">
                  ₹{Number(p.annual_price).toLocaleString("en-IN")}
                  <span className="text-sm font-semibold text-slate-400"> / year</span>
                </p>
                <p className="mt-1 text-xs text-slate-400">{p.currency} · billed annually · {p.duration_days ?? 365} days</p>
                {p.features && <p className="mt-3 text-sm text-slate-600">{p.features}</p>}
              </div>
            ))}
          </div>
        )}
        <div className="mt-10 rounded-2xl bg-slate-50 p-6 text-sm text-slate-600">
          <p className="font-bold text-slate-900">How to get started</p>
          <p className="mt-2">
            Gym owner registration requires a valid vendor-issued activation key.{" "}
            <Link to="/contact" className="font-bold text-emerald-600 underline">Contact us</Link> to request one, or{" "}
            <Link to="/login" className="font-bold text-emerald-600 underline">sign in</Link> if you already have an account.
          </p>
        </div>
      </section>
    </MarketingLayout>
  );
}
