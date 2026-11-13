import { useEffect, useState } from "react";
import { platformService } from "../../lib/services";

const empty = { name: "", description: "", annual_price: "", currency: "INR", duration_days: 365, trial_eligible: true, features: "", status: "active" };

export default function Plans() {
  const [plans, setPlans] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [err, setErr] = useState(null);
  const [msg, setMsg] = useState(null);

  const load = () => platformService.plans().then(setPlans).catch((e) => setErr(e.message));
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing("new"); setForm(empty); setErr(null); };
  const openEdit = (p) => {
    setEditing(p.id);
    setForm({ name: p.name, description: p.description || "", annual_price: p.annual_price, currency: p.currency || "INR", duration_days: p.duration_days ?? 365, trial_eligible: p.trial_eligible !== false, features: p.features || "", status: p.status || "active" });
  };

  const save = async () => {
    setErr(null); setMsg(null);
    try {
      if (editing === "new") await platformService.createPlan(form);
      else await platformService.updatePlan(editing, form);
      setEditing(null); setMsg("Saved. Price changes apply to new subscriptions only — existing subscriptions keep their snapshot."); load();
    } catch (e) { setErr(e.message); }
  };

  if (!plans) return <p className="text-sm text-slate-500">Loading…</p>;
  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Subscription Plans</h1>
        <button onClick={openNew} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white">New plan</button>
      </div>
      {msg && <p className="mt-3 rounded-lg bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">{msg}</p>}
      {err && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{err}</p>}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((p) => (
          <div key={p.id} className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-start justify-between">
              <h2 className="font-extrabold">{p.name}</h2>
              <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${p.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"}`}>{p.status}</span>
            </div>
            <p className="mt-2 text-2xl font-extrabold">₹{Number(p.annual_price).toLocaleString("en-IN")}<span className="text-sm font-semibold text-slate-400">/yr</span></p>
            <p className="mt-1 text-xs text-slate-400">{p.currency} · {p.billing_interval} · {p.duration_days} days{p.trial_eligible ? " · trial eligible" : ""}</p>
            {p.description && <p className="mt-2 text-sm text-slate-500">{p.description}</p>}
            <button onClick={() => openEdit(p)} className="mt-4 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold hover:bg-slate-50">Edit</button>
          </div>
        ))}
        {plans.length === 0 && <p className="text-sm text-slate-400">No plans yet — create the first annual plan.</p>}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setEditing(null)}>
          <div className="w-full max-w-lg rounded-2xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-extrabold">{editing === "new" ? "New plan" : "Edit plan"}</h2>
            <div className="mt-4 space-y-3">
              <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Plan name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Annual price (INR)" type="number" min="0" value={form.annual_price} onChange={(e) => setForm({ ...form, annual_price: e.target.value })} />
                <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Duration days" type="number" value={form.duration_days} onChange={(e) => setForm({ ...form, duration_days: e.target.value })} />
              </div>
              <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Features (comma separated)" value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} />
              <select className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.trial_eligible} onChange={(e) => setForm({ ...form, trial_eligible: e.target.checked })} /> Trial eligible</label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-500">Cancel</button>
              <button onClick={save} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
