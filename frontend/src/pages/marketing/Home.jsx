import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import MarketingLayout from "./MarketingLayout";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8090";

const benefits = [
  ["Members & plans", "Track members, membership types, expiry dates and renewals in one place."],
  ["Attendance & classes", "Check members in, schedule classes and let members book their own spots."],
  ["Staff & trainers", "Role-based access for owners, admins, managers, staff, trainers and members."],
  ["Payments & billing", "Record payments, invoices, expenses and payroll with Razorpay checkout."],
];

const highlights = [
  "Member management with invitations and self-service portal",
  "Attendance check-in and history",
  "Class scheduling with member self-booking",
  "Trainer and personal-training management",
  "Workout and diet plan assignment",
  "Equipment and inventory tracking",
  "Payments, invoices, expenses and payroll",
  "Multi-branch organizations with isolated data",
];

const steps = [
  ["Request an activation key", "GymPro onboarding is issued by the platform vendor."],
  ["Create your gym", "Validate the key, register the owner account, and add your first branch."],
  ["Start a 14-day trial", "Trial begins automatically — no card required to start."],
];

const faqs = [
  ["How do I start?", "After approval you receive a one-time activation key, create your owner account, register your gym and first branch — your 14-day free trial starts automatically."],
  ["Is there a free trial?", "Yes — every new gym gets a 14-day free trial when the owner registers. No credit card required to start."],
  ["How does billing work?", "Subscriptions are annual only, billed in INR through Razorpay. You can upgrade or renew anytime before your trial or subscription expires."],
  ["Can I manage multiple branches?", "Yes. Organizations can have multiple branches, and branch managers see only their own branch's data."],
  ["Do my members need accounts?", "Members can receive a secure invitation, create a login and access their own portal — attendance, bookings, plans and personal payments."],
];

export default function Home() {
  const [plans, setPlans] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/subscription/plans`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setPlans)
      .catch(() => setPlans([]));
  }, []);

  return (
    <MarketingLayout>
      <section className="relative overflow-hidden bg-ink-900 text-white">
        <div className="pointer-events-none absolute inset-0 bg-grid-faint bg-grid opacity-40" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-500">Gym management SaaS</p>
          <h1 className="mt-4 max-w-3xl font-display text-4xl font-semibold leading-[1.1] sm:text-5xl lg:text-[3.5rem]">
            Run your gym. Not the paperwork.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
            GymPro is a multi-tenant platform for independent gyms: members, trainers, classes, attendance and billing — with organization and branch isolation built in.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/login" className="rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-500">
              Start Your 14-Day Free Trial
            </Link>
            <Link to="/features" className="rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-white hover:bg-white/5">
              Explore Features
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="font-display text-2xl font-semibold sm:text-3xl">A workspace built for the floor</h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-500">The product UI is the operations dashboard your staff actually log into — not a mockup.</p>
        <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-card">
          <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-4 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
            <span className="ml-3 text-xs font-medium text-slate-400">GymPro · Owner dashboard</span>
          </div>
          <div className="grid gap-3 p-4 sm:grid-cols-3">
            {["Members", "Today’s check-ins", "Active classes"].map((label) => (
              <div key={label} className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
                <p className="mt-2 h-7 w-16 rounded bg-slate-100" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <h2 className="font-display text-2xl font-semibold sm:text-3xl">Everything your gym needs</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map(([t, d]) => (
            <div key={t} className="surface-card p-6">
              <h3 className="font-semibold">{t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="font-display text-2xl font-semibold sm:text-3xl">Built for daily gym operations</h2>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {highlights.map((h) => (
              <li key={h} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-700">✓</span>
                {h}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="font-display text-2xl font-semibold sm:text-3xl">How it works</h2>
        <ol className="mt-8 grid gap-5 md:grid-cols-3">
          {steps.map(([t, d], i) => (
            <li key={t} className="surface-card p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">Step {i + 1}</p>
              <h3 className="mt-2 font-semibold">{t}</h3>
              <p className="mt-2 text-sm text-slate-600">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-semibold sm:text-3xl">Annual pricing</h2>
              <p className="mt-2 text-sm text-slate-500">Live catalog from the GymPro API. 14-day trial included on registration.</p>
            </div>
            <Link to="/pricing" className="hidden text-sm font-semibold text-brand-700 sm:inline">View pricing</Link>
          </div>
          <div className="mt-8">
            {plans === null ? (
              <p className="text-sm text-slate-500">Loading plans…</p>
            ) : plans.length === 0 ? (
              <p className="text-sm text-slate-500">Published plans appear here when the catalog is available. <Link className="font-semibold text-brand-700" to="/contact">Contact us</Link> for current annual pricing.</p>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {plans.slice(0, 3).map((p) => (
                  <div key={p.id} className="surface-card p-6">
                    <h3 className="font-semibold">{p.name}</h3>
                    <p className="mt-3 font-display text-3xl font-semibold">
                      ₹{Number(p.annual_price).toLocaleString("en-IN")}
                      <span className="text-sm font-medium text-slate-400"> / year</span>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="font-display text-2xl font-semibold sm:text-3xl">Access, isolation and payments</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {[
            ["Role-based access", "Owners, staff, trainers and members each see only the data their role allows. The API enforces this independently of the UI."],
            ["Organization isolation", "Every gym is a tenant. Branch managers stay inside their assigned branch unless given broader access."],
            ["Verified checkout", "Annual subscriptions are created server-side and confirmed with Razorpay signatures before activation."],
          ].map(([t, d]) => (
            <div key={t} className="surface-card p-6">
              <h3 className="font-semibold">{t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-50">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <h2 className="font-display text-2xl font-semibold">Questions</h2>
          <dl className="mt-8 space-y-6">
            {faqs.map(([q, a]) => (
              <div key={q}>
                <dt className="font-semibold">{q}</dt>
                <dd className="mt-1 text-sm leading-relaxed text-slate-600">{a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="bg-ink-900 text-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="font-display text-3xl font-semibold">Ready to run your gym on GymPro?</h2>
          <p className="mt-3 max-w-xl text-slate-300">Create an owner account with a valid activation key and your 14-day trial starts automatically.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/login" className="rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-500">Get Started</Link>
            <Link to="/contact" className="rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold hover:bg-white/5">Contact us</Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
