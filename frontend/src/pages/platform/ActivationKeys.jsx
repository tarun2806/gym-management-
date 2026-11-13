import { useEffect, useState } from "react";
import { platformService } from "../../lib/services";

export default function ActivationKeys() {
  const [keys, setKeys] = useState(null);
  const [rawKey, setRawKey] = useState(null);
  const [label, setLabel] = useState("");
  const [err, setErr] = useState(null);
  const [msg, setMsg] = useState(null);

  const load = () => platformService.activationKeys().then(setKeys).catch((e) => setErr(e.message));
  useEffect(() => { load(); }, []);

  const create = async () => {
    setErr(null); setMsg(null);
    try {
      const res = await platformService.createActivationKey(label || undefined);
      setRawKey(res.raw_key || res.key || res.token);
      setLabel(""); load();
    } catch (e) { setErr(e.message); }
  };
  const revoke = async (id) => {
    if (!window.confirm("Revoke this activation key?")) return;
    try { await platformService.revokeActivationKey(id); load(); }
    catch (e) { setErr(e.message); }
  };

  if (!keys) return <p className="text-sm text-slate-500">Loading…</p>;
  return (
    <div>
      <h1 className="text-2xl font-extrabold">Activation Keys</h1>
      <p className="mt-1 text-sm text-slate-500">One-time keys that let a new gym owner register their organization.</p>
      {err && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{err}</p>}
      {msg && <p className="mt-3 rounded-lg bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">{msg}</p>}

      {rawKey && (
        <div className="mt-4 rounded-xl border-2 border-amber-300 bg-amber-50 p-4">
          <p className="text-sm font-bold text-amber-800">Copy this key now — it will never be shown again:</p>
          <div className="mt-2 flex items-center gap-2">
            <code className="flex-1 rounded-lg bg-white px-3 py-2 text-sm">{rawKey}</code>
            <button onClick={() => { navigator.clipboard.writeText(rawKey); setMsg("Copied."); }} className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white">Copy</button>
            <button onClick={() => setRawKey(null)} className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-500">Done</button>
          </div>
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Label (e.g. Acme Gym)"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <button onClick={create} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white">Generate key</button>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-slate-200 text-left text-xs font-bold uppercase text-slate-400">
            <th className="px-4 py-3">Label</th><th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Expires</th><th className="px-4 py-3">Redeemed</th><th className="px-4 py-3"></th>
          </tr></thead>
          <tbody>
            {keys.map((k) => {
              const status = k.revoked_at ? "Revoked" : k.redeemed_at ? "Redeemed" : new Date(k.expires_at) < new Date() ? "Expired" : "Active";
              return (
                <tr key={k.id} className="border-b border-slate-100">
                  <td className="px-4 py-3 font-semibold">{k.label || "—"}</td>
                  <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-bold ${status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"}`}>{status}</span></td>
                  <td className="px-4 py-3 text-slate-500">{k.expires_at?.slice(0, 10)}</td>
                  <td className="px-4 py-3 text-slate-500">{k.redeemed_at?.slice(0, 10) || "—"}</td>
                  <td className="px-4 py-3">{status === "Active" && <button onClick={() => revoke(k.id)} className="rounded-lg border border-red-200 px-3 py-1 text-xs font-bold text-red-600 hover:bg-red-50">Revoke</button>}</td>
                </tr>
              );
            })}
            {keys.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">No keys yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
