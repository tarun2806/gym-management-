import MarketingLayout from "./MarketingLayout";

const steps = [
  ["Discover GymPro", "Explore the platform and see how it fits your gym."],
  ["Get your activation key", "Contact us to receive a one-time vendor-issued activation key."],
  ["Create your owner account", "Sign in with Firebase and redeem your key on the registration page."],
  ["Register your gym", "Create your organization and first branch in one step."],
  ["Start your 14-day trial", "Your free trial begins automatically on registration — no card required."],
  [("Configure your gym"), "Add membership plans, branches, trainers, classes and equipment."],
  ["Invite your team & members", "Send secure invitations to staff, trainers and members."],
  ["Run daily operations", "Manage attendance, bookings, payments and member portals."],
  ["Choose an annual plan", "Before your trial ends, pick an annual subscription and pay securely via Razorpay."],
];

export default function HowItWorks() {
  return (
    <MarketingLayout>
      <section className="bg-slate-900 text-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <h1 className="text-4xl font-extrabold">How GymPro works</h1>
          <p className="mt-4 max-w-2xl text-slate-300">From first visit to running your gym — nine simple steps.</p>
        </div>
      </section>
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <ol className="space-y-6">
          {steps.map(([t, d], i) => (
            <li key={t} className="flex gap-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-extrabold text-white">{i + 1}</span>
              <div>
                <h2 className="font-bold">{t}</h2>
                <p className="mt-1 text-sm text-slate-600">{d}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </MarketingLayout>
  );
}
