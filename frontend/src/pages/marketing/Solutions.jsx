import MarketingLayout from "./MarketingLayout";

const roles = [
  ["Gym owners", "See the whole business: revenue, membership growth, attendance trends and branch performance from one dashboard."],
  ["Organization admins", "Manage members, plans, classes and staff across the organization while keeping control of settings."],
  ["Branch managers", "Run your branch day-to-day — attendance, classes, members and payments — without seeing other branches' data."],
  ["Staff", "Check members in, manage bookings and handle front-desk tasks with exactly the permissions you need."],
  ["Trainers", "Access workout and diet plan tools and personal-training sessions assigned to you."],
  ["Members", "Your own portal: attendance history, class bookings, workout and diet plans, payments and invoices — no gym staff needed."],
];

export default function Solutions() {
  return (
    <MarketingLayout>
      <section className="bg-slate-900 text-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <h1 className="text-4xl font-extrabold">Solutions for every role</h1>
          <p className="mt-4 max-w-2xl text-slate-300">GymPro is not one-size-fits-all — each role gets its own experience and permissions.</p>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {roles.map(([t, d]) => (
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
