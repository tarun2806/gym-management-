import MarketingLayout from "./MarketingLayout";

const roles = [
  ["Gym owners", "See the whole business: revenue, membership growth, attendance and branch performance from one dashboard."],
  ["Organization admins", "Manage members, plans, classes and staff across the organization while keeping control of settings."],
  ["Branch managers", "Run your branch day-to-day — attendance, classes and members — without seeing other branches' data."],
  ["Staff", "Check members in, manage bookings and handle front-desk tasks with the permissions you need."],
  ["Trainers", "Work from assigned members, workout and diet plans, and class information — not finance or platform admin."],
  ["Members", "A simple portal: attendance, class bookings, workout and diet plans, and personal payment history."],
];

export default function Solutions() {
  return (
    <MarketingLayout>
      <section className="bg-ink-900 text-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h1 className="font-display text-4xl font-semibold">Solutions for every role</h1>
          <p className="mt-4 max-w-2xl text-slate-300">Each role gets a focused experience. Permissions are enforced on the server.</p>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {roles.map(([t, d]) => (
            <div key={t} className="surface-card p-6">
              <h2 className="font-semibold">{t}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{d}</p>
            </div>
          ))}
        </div>
      </section>
    </MarketingLayout>
  );
}
