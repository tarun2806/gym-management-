import MarketingLayout from "./MarketingLayout";

export default function About() {
  return (
    <MarketingLayout>
      <section className="bg-ink-900 text-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h1 className="font-display text-4xl font-semibold">About GymPro</h1>
          <p className="mt-4 max-w-2xl text-slate-300">Digital gym management for the people who run gyms.</p>
        </div>
      </section>
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <div className="space-y-10">
          <div>
            <h2 className="text-2xl font-semibold">Our mission</h2>
            <p className="mt-3 leading-relaxed text-slate-600">
              Give every gym — from a single-location neighborhood fitness center to a multi-branch organization —
              one connected platform for members, staff, classes, attendance and payments.
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-semibold">Our vision</h2>
            <p className="mt-3 leading-relaxed text-slate-600">
              A gym management platform where every role has a secure, focused experience, and gym data stays isolated
              and under the owner&apos;s control.
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-semibold">Product philosophy</h2>
            <p className="mt-3 leading-relaxed text-slate-600">
              Security and data ownership come first: role-based access, organization and branch isolation,
              verified payments, and transparent subscription billing. No feature is marketed until it works.
            </p>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
