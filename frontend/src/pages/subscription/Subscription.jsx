import { useEffect, useState, useCallback } from "react";
import { subscriptionService } from "../../lib/services";
import { useOrganization } from "../../contexts/OrganizationContext";
import { resolveOrgRole } from "../../lib/permissions";
import { useAuth } from "../../contexts/AuthContext";

const STATUS_STYLE = {
  TRIALING: ["Free trial", "bg-amber-100 text-amber-700"],
  ACTIVE: ["Active", "bg-emerald-100 text-emerald-700"],
  PAST_DUE: ["Past due", "bg-orange-100 text-orange-700"],
  EXPIRED: ["Expired", "bg-red-100 text-red-700"],
  SUSPENDED: ["Suspended", "bg-red-100 text-red-700"],
  CANCELLED: ["Cancelled", "bg-slate-200 text-slate-600"],
  NONE: ["No subscription", "bg-slate-100 text-slate-500"],
};

function loadRazorpay() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve(window.Razorpay);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(window.Razorpay);
    s.onerror = () => reject(new Error("Could not load payment gateway"));
    document.body.appendChild(s);
  });
}

export default function Subscription() {
  const [sub, setSub] = useState(null);
  const [plans, setPlans] = useState([]);
  const [err, setErr] = useState(null);
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(false);

  const { user } = useAuth();
  const { memberships, currentOrganization, isLoading: orgLoading } = useOrganization();
  const orgRole = resolveOrgRole(memberships, currentOrganization?.id, user?.role);
  const isOwner = orgRole === "org_owner";

  const refresh = useCallback(async () => {
    try {
      const [s, p] = await Promise.all([subscriptionService.mine(), subscriptionService.plans()]);
      setSub(s); setPlans(p || []); setErr(null);
    } catch (e) { setErr(e.message); }
  }, []);
  useEffect(() => { if (isOwner) refresh(); }, [refresh, isOwner]);

  const checkout = async (planId) => {
    if (busy) return;
    setBusy(true); setErr(null); setNotice(null);
    try {
      const order = await subscriptionService.checkout(planId);
      const Razorpay = await loadRazorpay();
      const rzp = new Razorpay({
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "",
        order_id: order.order_id,
        amount: Math.round(Number(order.amount) * 100),
        currency: order.currency || "INR",
        name: "GymPro",
        description: "Annual subscription",
        handler: async (resp) => {
          try {
            await subscriptionService.verify({
              razorpay_order_id: resp.razorpay_order_id,
              razorpay_payment_id: resp.razorpay_payment_id,
              razorpay_signature: resp.razorpay_signature,
            });
            setNotice("Payment verified — subscription activated.");
            await refresh();
          } catch (e) {
            setErr("Payment received but verification failed: " + e.message);
          } finally { setBusy(false); }
        },
        modal: { ondismiss: () => { setBusy(false); setNotice("Payment cancelled."); } },
        theme: { color: "#0f172a" },
      });
      rzp.on("payment.failed", () => { setBusy(false); setErr("Payment failed. Please try again."); });
      rzp.open();
    } catch (e) {
      setBusy(false);
      setErr(e.message || "Checkout failed");
    }
  };

  if (orgLoading) return <p className="text-sm text-slate-500">Loading…</p>;
  if (!isOwner) return (
    <div className="mx-auto max-w-2xl rounded-xl border border-slate-200 bg-white p-8 text-center">
      <h1 className="text-xl font-extrabold">Subscription management</h1>
      <p className="mt-2 text-sm text-slate-500">Only the organization owner can view or manage the gym's subscription. If you are the owner, make sure you have selected the correct organization.</p>
    </div>
  );
  if (!sub && !err) return <p className="text-sm text-slate-500">Loading subscription…</p>;
  const [label, cls] = STATUS_STYLE[sub?.status] || [sub?.status || "—", "bg-slate-100 text-slate-500"];
  const trialDays = sub?.days_remaining;
  const showTrialBanner = sub?.status === "TRIALING" && trialDays != null && trialDays >= 0;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Subscription</h1>
        <p className="mt-1 text-sm text-slate-500">Your gym's GymPro plan and billing.</p>
      </div>

      {err && <div className="rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">{err}</div>}
      {notice && <div className="rounded-xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">{notice}</div>}

      {showTrialBanner && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="font-bold text-amber-800">
            Your GymPro free trial {trialDays === 0 ? "expires today" : `expires in ${trialDays} day${trialDays === 1 ? "" : "s"}`}.
          </p>
          <p className="mt-1 text-sm text-amber-700">
            Trial ends {sub.trial_end?.slice(0, 10)}. Choose an annual plan below to keep full access.
          </p>
        </div>
      )}
      {sub?.status === "EXPIRED" && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="font-bold text-red-700">Your subscription has expired.</p>
          <p className="mt-1 text-sm text-red-600">Management features are paused. Renew below to restore full access — your data is safe.</p>
        </div>
      )}

      {sub && (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Current plan</p>
              <p className="mt-1 text-lg font-extrabold">{sub.plan_snapshot || "—"}</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${cls}`}>{label}</span>
          </div>
          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <p><span className="text-slate-400">Trial:</span> {sub.trial_start?.slice(0, 10) || "—"} → {sub.trial_end?.slice(0, 10) || "—"}</p>
            <p><span className="text-slate-400">Paid period:</span> {sub.subscription_start?.slice(0, 10) || "—"} → {sub.subscription_end?.slice(0, 10) || "—"}</p>
            <p><span className="text-slate-400">Days remaining:</span> {sub.days_remaining >= 0 ? sub.days_remaining : "—"}</p>
            <p><span className="text-slate-400">Next renewal:</span> {sub.next_renewal_date?.slice(0, 10) || "—"}</p>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-extrabold">Annual plans</h2>
        {plans.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No plans available right now — contact support.</p>
        ) : (
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            {plans.map((p) => (
              <div key={p.id} className="rounded-xl border border-slate-200 bg-white p-5">
                <h3 className="font-extrabold">{p.name}</h3>
                <p className="mt-1 text-2xl font-extrabold">₹{Number(p.annual_price).toLocaleString("en-IN")}<span className="text-sm font-semibold text-slate-400">/year</span></p>
                <p className="mt-1 text-xs text-slate-400">{p.currency} · {p.duration_days ?? 365} days</p>
                <button
                  onClick={() => checkout(p.id)}
                  disabled={busy}
                  className="mt-4 w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-700 disabled:opacity-50">
                  {busy ? "Processing…" : sub?.status === "EXPIRED" || sub?.status === "TRIALING" ? "Subscribe" : "Renew"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {sub?.payments?.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-extrabold">Payment history</h2>
          <ul className="mt-3 divide-y text-sm">
            {sub.payments.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-2">
                <span>₹{Number(p.amount).toLocaleString("en-IN")} {p.currency} · {p.purpose}</span>
                <span className="text-slate-400">{p.status} · {p.created_at?.slice(0, 10)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
