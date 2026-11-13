import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useOrganization } from "../../contexts/OrganizationContext";
import { memberPortalService } from "../../lib/services";

const Field = ({ label, value }) => (
  <div className="surface-card p-5">
    <p className="text-sm text-slate-500">{label}</p>
    <p className="text-lg font-semibold text-slate-900">{value || "—"}</p>
  </div>
);

const Section = ({ title, children }) => (
  <div className="surface-card">
    <div className="border-b border-slate-100 px-5 py-3">
      <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
    </div>
    <div className="p-5">{children}</div>
  </div>
);

const Empty = ({ text }) => <p className="text-sm text-gray-400">{text}</p>;

export default function MemberPortal() {
  const { user } = useAuth();
  const { currentOrganization, currentBranch } = useOrganization();
  const [member, setMember] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [payments, setPayments] = useState(null);
  const [invoices, setInvoices] = useState(null);
  const [workouts, setWorkouts] = useState(null);
  const [diets, setDiets] = useState(null);
  const [classes, setClasses] = useState(null);
  const [bookings, setBookings] = useState(null);
  const [bookingBusy, setBookingBusy] = useState(null);
  const [bookingMsg, setBookingMsg] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const m = await memberPortalService.member();
        if (cancelled) return;
        setMember(m);
        const [att, pay, inv, wo, di, cl, bk] = await Promise.allSettled([
          memberPortalService.attendance(0),
          memberPortalService.payments(0),
          memberPortalService.invoices(),
          memberPortalService.workoutPlans(),
          memberPortalService.dietPlans(),
          memberPortalService.classes(),
          memberPortalService.classBookings()
        ]);
        if (cancelled) return;
        if (att.status === "fulfilled") setAttendance(att.value);
        if (pay.status === "fulfilled") setPayments(pay.value);
        if (inv.status === "fulfilled") setInvoices(inv.value);
        if (wo.status === "fulfilled") setWorkouts(wo.value);
        if (di.status === "fulfilled") setDiets(di.value);
        if (cl.status === "fulfilled") setClasses(cl.value);
        if (bk.status === "fulfilled") setBookings(bk.value);
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return <div className="flex h-[40vh] items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-900 border-t-transparent" />
    </div>;
  }

  const bookClass = async (classId) => {
    setBookingBusy(classId);
    setBookingMsg(null);
    try {
      await memberPortalService.bookClass(classId);
      const [cl, bk] = await Promise.all([memberPortalService.classes(), memberPortalService.classBookings()]);
      setClasses(cl); setBookings(bk);
      setBookingMsg({ ok: true, text: "Booked!" });
    } catch (e) {
      setBookingMsg({ ok: false, text: e.message || "Booking failed" });
    } finally {
      setBookingBusy(null);
    }
  };
  const cancelBooking = async (bookingId) => {
    setBookingBusy(bookingId);
    setBookingMsg(null);
    try {
      await memberPortalService.cancelBooking(bookingId);
      setBookings(await memberPortalService.classBookings());
      setClasses(await memberPortalService.classes());
      setBookingMsg({ ok: true, text: "Booking cancelled." });
    } catch (e) {
      setBookingMsg({ ok: false, text: e.message || "Cancel failed" });
    } finally {
      setBookingBusy(null);
    }
  };

  const attItems = attendance?.items ?? [];
  const thisMonth = attItems.filter((a) => {
    const d = a.check_in ? new Date(a.check_in) : null;
    const now = new Date();
    return d && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <h1 className="page-title">Member Portal</h1>
        <p className="mt-1 text-gray-500">
          {currentOrganization?.name ?? "Your gym"}
          {currentBranch?.name ? ` — ${currentBranch.name}` : ""}
        </p>
      </div>
      {error && <div className="rounded-lg bg-red-50 p-4 text-red-700">
        {error.includes("404") || error.includes("no linked")
          ? "No gym membership is linked to your account yet. Ask your gym for an invitation token."
          : error}
      </div>}
      {member && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Name" value={member.name} />
            <Field label="Membership" value={member.membership_type} />
            <Field label="Plan" value={member.plan_name} />
            <Field label="Status" value={member.status} />
            <Field label="Start date" value={member.start_date} />
            <Field label="Expiry date" value={member.expiry_date} />
            <Field label="Phone" value={member.phone} />
            <Field label="Email" value={member.email || user?.email} />
            <Field label="Trainer" value={member.trainer_name ? `${member.trainer_name}${member.trainer_specialization ? ` — ${member.trainer_specialization}` : ""}` : ""} />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border bg-white p-5">
              <p className="text-sm text-gray-500">Visits this month</p>
              <p className="text-2xl font-bold text-gray-900">{attendance ? thisMonth : "—"}</p>
            </div>
            <div className="rounded-xl border bg-white p-5">
              <p className="text-sm text-gray-500">Total visits</p>
              <p className="text-2xl font-bold text-gray-900">{attendance ? attendance.total ?? attItems.length : "—"}</p>
            </div>
            <div className="rounded-xl border bg-white p-5">
              <p className="text-sm text-gray-500">Outstanding invoices</p>
              <p className="text-2xl font-bold text-gray-900">
                {invoices ? invoices.filter((i) => i.status !== "paid").length : "—"}
              </p>
            </div>
          </div>

          <Section title="Recent Attendance">
            {!attendance ? <Empty text="Attendance unavailable." /> : attItems.length === 0 ? <Empty text="No attendance records yet." /> : (
              <ul className="divide-y text-sm">
                {attItems.slice(0, 10).map((a) => (
                  <li key={a.id} className="flex justify-between py-2">
                    <span className="text-gray-700">{a.check_in ? new Date(a.check_in).toLocaleString() : "—"}</span>
                    <span className="text-gray-500">{a.check_out ? `out ${new Date(a.check_out).toLocaleTimeString()}` : "checked in"} · {a.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <div className="grid gap-6 lg:grid-cols-2">
            <Section title="Workout Plan">
              {!workouts ? <Empty text="Workout plans unavailable." /> : workouts.length === 0 ? <Empty text="No workout plan assigned yet." /> : workouts.map((w) => (
                <div key={w.id} className="mb-3 last:mb-0">
                  <p className="font-semibold text-gray-900">{w.name || "Workout plan"}</p>
                  {w.objective && <p className="text-sm text-gray-500">{w.objective}</p>}
                  <p className="text-xs text-gray-400">
                    {[w.level, w.weeks ? `${w.weeks} weeks` : null, w.days_per_week ? `${w.days_per_week} days/week` : null].filter(Boolean).join(" · ")}
                  </p>
                </div>
              ))}
            </Section>
            <Section title="Diet Plan">
              {!diets ? <Empty text="Diet plans unavailable." /> : diets.length === 0 ? <Empty text="No diet plan assigned yet." /> : diets.map((d) => (
                <div key={d.id} className="mb-3 last:mb-0">
                  <p className="font-semibold text-gray-900">{d.date || "Diet plan"}</p>
                  {d.description && <p className="text-sm text-gray-500">{d.description}</p>}
                  <p className="text-xs text-gray-400">
                    {[d.calories ? `${d.calories} kcal` : null, d.diet_preference, d.goals].filter(Boolean).join(" · ")}
                  </p>
                </div>
              ))}
            </Section>
          </div>

          {bookingMsg && <div className={`rounded-lg p-3 text-sm font-semibold ${bookingMsg.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{bookingMsg.text}</div>}

          <div className="grid gap-6 lg:grid-cols-2">
            <Section title="My Bookings">
              {!bookings ? <Empty text="Bookings unavailable." /> : bookings.length === 0 ? <Empty text="No class bookings yet." /> : (
                <ul className="divide-y text-sm">
                  {bookings.map((b) => (
                    <li key={b.id} className="flex items-center justify-between py-2">
                      <div>
                        <p className="font-semibold text-gray-900">{b.class_name || "Class"}</p>
                        <p className="text-xs text-gray-400">
                          {[b.schedule_time, b.instructor, b.booked_date].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                      {b.status === "booked" && <button
                        onClick={() => cancelBooking(b.id)}
                        disabled={bookingBusy === b.id}
                        className="rounded-lg border border-red-200 px-3 py-1 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-40"
                      >Cancel</button>}
                      {b.status !== "booked" && <span className="text-xs text-gray-400">{b.status}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </Section>
            <Section title="Book a Class">
              {!classes ? <Empty text="Class schedule unavailable." /> : classes.length === 0 ? <Empty text="No classes scheduled." /> : (
                <ul className="divide-y text-sm">
                  {classes.map((c) => {
                    const booked = bookings?.some((b) => b.class_id === c.id && b.status === "booked");
                    const full = c.capacity > 0 && (c.enrolled ?? 0) >= c.capacity;
                    return <li key={c.id} className="flex items-center justify-between py-2">
                      <div>
                        <p className="font-semibold text-gray-900">{c.name}</p>
                        <p className="text-xs text-gray-400">
                          {[c.schedule_time, c.instructor, c.room].filter(Boolean).join(" · ")}
                          {c.capacity > 0 ? ` · ${c.enrolled ?? 0}/${c.capacity}` : ""}
                        </p>
                      </div>
                      {booked ? <span className="text-xs font-bold text-green-600">Booked</span> : <button
                        onClick={() => bookClass(c.id)}
                        disabled={bookingBusy === c.id || full}
                        className="rounded-lg bg-slate-900 px-3 py-1 text-xs font-bold text-white hover:bg-slate-700 disabled:opacity-40"
                      >{full ? "Full" : "Book"}</button>}
                    </li>;
                  })}
                </ul>
              )}
            </Section>
          </div>

          <Section title="Payments">
            {!payments ? <Empty text="Payments unavailable." /> : payments.items?.length === 0 ? <Empty text="No payments yet." /> : (
              <ul className="divide-y text-sm">
                {payments.items.map((p) => (
                  <li key={p.id} className="flex justify-between py-2">
                    <span className="text-gray-700">{p.plan_name || p.type || "Payment"}</span>
                    <span className="font-semibold text-gray-900">
                      {p.amount != null ? `${p.amount}` : ""} {p.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="Invoices">
            {!invoices ? <Empty text="Invoices unavailable." /> : invoices.length === 0 ? <Empty text="No invoices yet." /> : (
              <ul className="divide-y text-sm">
                {invoices.map((i) => (
                  <li key={i.id} className="flex justify-between py-2">
                    <span className="text-gray-700">{i.invoice_number || "Invoice"}</span>
                    <span className="text-gray-500">
                      {i.amount != null ? `${i.amount} · ` : ""}{i.status}
                      {i.due_date ? ` · due ${i.due_date}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </>
      )}
    </div>
  );
}
