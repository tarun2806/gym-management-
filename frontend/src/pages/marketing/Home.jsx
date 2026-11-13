import { Link } from "react-router-dom";
import MarketingLayout from "./MarketingLayout";

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

const roles = ["Gym Owners", "Org Admins", "Branch Managers", "Staff", "Trainers", "Members"];

const faqs = [
  ["How do I start?", "GymPro onboarding is handled by our team. After approval you receive a one-time activation key, create your owner account, register your gym and first branch — your 14-day free trial starts automatically."],
  ["Is there a free trial?", "Yes — every new gym gets a 14-day free trial when the owner registers. No credit card required to start."],
  ["How does billing work?", "Subscriptions are annual only, billed in INR through Razorpay. You can upgrade or renew anytime before your trial or subscription expires."],
  ["Can I manage multiple branches?", "Yes. Organizations can have multiple branches, and branch managers see only their own branch's data."],
  ["Do my members need accounts?", "Members can receive a secure invitation link, create a login and access their own portal — attendance, bookings, plans, payments and invoices."],
];

export default function Home() {
  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="bg-slate-900 text-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
          <p className="text-sm font-bold uppercase tracking-widest text-emerald-400">Gym management, simplified</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
            Run Your Gym. Not the Paperwork.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-slate-300">
            Manage your gym operations, members, trainers, attendance, memberships and payments from one connected platform.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/login" className="rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-slate-900 hover:bg-emerald-400">
              Start Your 14-Day Free Trial
            </Link>
            <Link to="/features" className="rounded-xl border border-slate-600 px-6 py-3 text-sm font-bold text-white hover:bg-slate-800">
              Explore Features
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <h2 className="text-3xl font-extrabold">Everything your gym needs</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map(([t, d]) => (
            <div key={t} className="rounded-2xl border border-slate-200 p-6">
              <h3 className="font-bold">{t}</h3>
              <p className="mt-2 text-sm text-slate-600">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Feature highlights */}
      <section className="bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <h2 className="text-3xl font-extrabold">Built for daily gym operations</h2>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {highlights.map((h) => (
              <li key={h} className="flex items-start gap-3 rounded-xl bg-white p-4 text-sm font-medium text-slate-700 shadow-sm">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">✓</span>
                {h}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Roles */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <h2 className="text-3xl font-extrabold">One platform, every role</h2>
        <div className="mt-6 flex flex-wrap gap-3">
          {roles.map((r) => (
            <span key={r} className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">{r}</span>
          ))}
        </div>
        <Link to="/solutions" className="mt-6 inline-block text-sm font-bold text-emerald-600 hover:underline">See role-specific solutions →</Link>
      </section>

      {/* Subscription intro */}
      <section className="bg-slate-900 text-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <h2 className="text-3xl font-extrabold">Simple annual pricing</h2>
          <p className="mt-4 max-w-2xl text-slate-300">
            Every gym starts with a 14-day free trial. When you're ready, choose an annual plan — billed yearly in INR via Razorpay.
          </p>
          <Link to="/pricing" className="mt-6 inline-block rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-slate-900 hover:bg-emerald-400">
            View Pricing
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <h2 className="text-3xl font-extrabold">Frequently asked questions</h2>
        <div className="mt-8 space-y-4">
          {faqs.map(([q, a]) => (
            <details key={q} className="group rounded-xl border border-slate-200 p-5">
              <summary className="cursor-pointer font-bold marker:text-emerald-600">{q}</summary>
              <p className="mt-3 text-sm text-slate-600">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-emerald-600">
        <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6">
          <h2 className="text-3xl font-extrabold text-white">Ready to run a better gym?</h2>
          <p className="mt-3 text-emerald-50">Start your 14-day free trial today.</p>
          <Link to="/login" className="mt-6 inline-block rounded-xl bg-slate-900 px-8 py-3 text-sm font-bold text-white hover:bg-slate-700">
            Get Started
          </Link>
        </div>
      </section>
    </MarketingLayout>
  );
}
