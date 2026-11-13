import MarketingLayout from "./MarketingLayout";

export default function About() {
  return (
    <MarketingLayout>
      <section className="bg-slate-900 text-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <h1 className="text-4xl font-extrabold">About GymPro</h1>
          <p className="mt-4 max-w-2xl text-slate-300">Digital gym management, built for the people who run gyms.</p>
        </div>
      </section>
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <div className="space-y-10">
          <div>
            <h2 className="text-2xl font-extrabold">Our mission</h2>
            <p className="mt-3 text-slate-600">
              Give every gym — from a single-location neighborhood fitness center to a multi-branch organization —
              one connected platform for members, staff, classes, attendance and payments, so owners can focus on
              coaching members instead of paperwork.
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-extrabold">Our vision</h2>
            <p className="mt-3 text-slate-600">
              A gym management platform where every role — owner, manager, staff, trainer and member — has a
              secure, focused experience, and where gym data is always isolated, private and under the owner's control.
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-extrabold">Product philosophy</h2>
            <p className="mt-3 text-slate-600">
              Security and data ownership come first: role-based access, organization and branch isolation,
              verified payments, and transparent subscription billing. No feature is marketed until it works.
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-extrabold">Why digital gym management</h2>
            <p className="mt-3 text-slate-600">
              Paper logs and spreadsheets lose member records, overbook classes and hide revenue. GymPro keeps
              attendance, bookings, plans and payments in one system with a self-service member portal — reducing
              front-desk workload and membership leakage.
            </p>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
