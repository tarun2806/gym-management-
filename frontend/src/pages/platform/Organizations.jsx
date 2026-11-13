import { useEffect, useMemo, useState } from "react";
import { platformService } from "../../lib/services";

const subBadge = (s) => {
  if (!s) return ["No subscription", "bg-slate-100 text-slate-500"];
  const map = {
    TRIALING: ["Trial", "bg-amber-100 text-amber-700"],
    ACTIVE: ["Active", "bg-emerald-100 text-emerald-700"],
    PAST_DUE: ["Past due", "bg-orange-100 text-orange-700"],
    EXPIRED: ["Expired", "bg-red-100 text-red-700"],
    SUSPENDED: ["Suspended", "bg-red-100 text-red-700"],
    CANCELLED: ["Cancelled", "bg-slate-200 text-slate-600"],
  };
  return map[s.status] || [s.status, "bg-slate-100 text-slate-600"];
};

export default function Organizations() {
  const [orgs, setOrgs] = useState(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [detail, setDetail] = useState(null);
  const [err, setErr] = useState(null);

  const load = () => platformService.organizations().then(setOrgs).catch((e) => setErr(e.message));
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => (orgs || []).filter((o) =>
    (!q || (o.name || "").toLowerCase().includes(q.toLowerCase()) || (o.slug || "").includes(q.toLowerCase())) &&
    (!status || o.status === status)
  ), [orgs, q, status]);

  const open = (id) => platformService.organization(id).then(setDetail).catch((e) => setErr(e.message));
  const suspend = async () => {
    const reason = window.prompt("Suspension reason (required):");
    if (reason === null) return;
    try {
      await platformService.suspendOrg(detail.id, reason || "No reason given");
      setDetail(null); load();
    } catch (e) { setErr(e.message); }
  };
  const reactivate = async () => {
    if (!window.confirm("Reactivate this organization?")) return;
    try { await platformService.reactivateOrg(detail.id); setDetail(null); load(); }
    catch (e) { setErr(e.message); }
  };

  if (err) return <div className="rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">{err}</div>;
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">Organizations</h1>
        <div className="flex gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or slug…"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>
      {!orgs ? <p className="mt-6 text-sm text-slate-500">Loading…</p> : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-200 text-left text-xs font-bold uppercase text-slate-400">
              <th className="px-4 py-3">Organization</th><th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Subscription</th><th className="px-4 py-3">Days left</th>
              <th className="px-4 py-3">Created</th><th className="px-4 py-3"></th>
            </tr></thead>
            <tbody>
              {filtered.map((o) => {
                const [label, cls] = subBadge(o.subscription);
                return (
                  <tr key={o.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold">{o.name}<div className="text-xs font-normal text-slate-400">{o.slug}</div></td>
                    <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-bold ${o.status === "suspended" ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>{o.status}</span></td>
                    <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-bold ${cls}`}>{label}</span></td>
                    <td className="px-4 py-3">{o.subscription?.days_remaining ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-500">{o.created_at ? o.created_at.slice(0, 10) : "—"}</td>
                    <td className="px-4 py-3"><button onClick={() => open(o.id)} className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-bold hover:bg-slate-100">View</button></td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No organizations match.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setDetail(null)}>
          <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-extrabold">{detail.name}</h2>
                <p className="text-sm text-slate-500">{detail.slug} · created {detail.created_at?.slice(0, 10)}</p>
              </div>
              <button onClick={() => setDetail(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">✕</button>
            </div>
            <div className="mt-4 flex gap-2">
              {detail.status === "suspended"
                ? <button onClick={reactivate} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white">Reactivate</button>
                : <button onClick={suspend} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white">Suspend</button>}
            </div>
            <Section title="Owners">
              {(detail.owners || []).map((o) => <p key={o.user_id} className="text-sm">{o.user_id} · {o.role}</p>)}
            </Section>
            <Section title="Branches">
              {(detail.branches || []).map((b) => <p key={b.id} className="text-sm">{b.name} · {b.status}</p>)}
            </Section>
            <Section title="Subscription">
              {detail.subscription ? (
                <div className="text-sm">
                  <p>Status: <b>{detail.subscription.status}</b> · Plan: {detail.subscription.plan_snapshot || "—"}</p>
                  <p>Trial: {detail.subscription.trial_start?.slice(0, 10)} → {detail.subscription.trial_end?.slice(0, 10)}</p>
                  <p>Paid: {detail.subscription.subscription_start?.slice(0, 10) || "—"} → {detail.subscription.subscription_end?.slice(0, 10) || "—"}</p>
                  <p>Days remaining: {detail.subscription.days_remaining}</p>
                </div>
              ) : <p className="text-sm text-slate-400">None</p>}
            </Section>
            <Section title="Payments">
              {(detail.payments || []).map((p) => (
                <p key={p.id} className="text-sm">₹{Number(p.amount).toLocaleString("en-IN")} {p.currency} · {p.status} · {p.created_at?.slice(0, 10)}</p>
              ))}
            </Section>
            <Section title="Recent events">
              {(detail.events || []).map((e) => (
                <p key={e.id} className="text-xs text-slate-500">{e.created_at?.slice(0, 16).replace("T", " ")} · {e.event_type} · {e.detail || ""}</p>
              ))}
            </Section>
          </div>
        </div>
      )}
    </div>
  );
}

const Section = ({ title, children }) => (
  <div className="mt-5">
    <h3 className="text-xs font-extrabold uppercase tracking-wide text-slate-400">{title}</h3>
    <div className="mt-2 space-y-1">{children}</div>
  </div>
);
