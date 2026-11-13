import MarketingLayout from "./MarketingLayout";

const modules = [
  ["Member management", "Create and update member records, track membership plans, status and expiry dates. Owners and admins can invite members via secure one-time links; members get their own portal."],
  ["Membership plans", "Define membership types and pricing, assign plans to members, and track expiries and renewals."],
  ["Attendance", "Staff check members in and out, review attendance history, and members see their own attendance in the portal."],
  ["Classes & booking", "Schedule classes with capacity limits. Members browse the schedule and book or cancel their own spots; staff manage the roster."],
  ["Trainers & personal training", "Manage trainer profiles, personal-training packages and sessions."],
  ["Workout & diet plans", "Create and assign workout and diet plans to members; trainers manage assignments for their clients."],
  ["Equipment & inventory", "Track gym equipment status and product stock with movement history."],
  ["Payments, invoices & payroll", "Record member payments, issue invoices, track expenses and payroll. Online checkout via Razorpay is supported for member payments."],
  ["Dashboard analytics", "Owners and managers see live counts: members, classes, attendance, revenue and equipment status."],
  ["Organizations & branches", "Run multiple branches under one organization with isolated data and branch-scoped roles."],
  ["Role-based access", "Seven roles — platform admin, owner, org admin, branch manager, staff, trainer, member — each with its own permissions."],
];

export default function Features() {
  return (
    <MarketingLayout>
      <section className="bg-slate-900 text-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <h1 className="text-4xl font-extrabold">Features</h1>
          <p className="mt-4 max-w-2xl text-slate-300">Every module below is implemented and running in the GymPro application today.</p>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map(([t, d]) => (
            <div key={t} className="rounded-2xl border border-slate-200 p-6">
              <h2 className="font-bold">{t}</h2>
              <p className="mt-2 text-sm text-slate-600">{d}</p>
            </div>
          ))}
        </div>
      </section>
    </MarketingLayout>
  );
}
