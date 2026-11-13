import { NavLink, Outlet, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { Navigate } from "react-router-dom";

const NAV = [
  ["/platform", "Overview", true],
  ["/platform/organizations", "Organizations"],
  ["/platform/plans", "Subscription Plans"],
  ["/platform/activation-keys", "Activation Keys"],
];

export default function PlatformLayout() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="flex h-screen items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-900 border-t-transparent" /></div>;
  if (!user?.platformAdmin) return <Navigate to="/" replace />;
  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="w-60 shrink-0 border-r border-slate-200 bg-white">
        <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-sm font-extrabold text-white">G</span>
          <div>
            <p className="text-sm font-extrabold">GymPro</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Platform Admin</p>
          </div>
        </div>
        <nav className="p-3">
          {NAV.map(([to, label, end]) => (
            <NavLink key={to} to={to} end={!!end}
              className={({ isActive }) => `mb-1 block rounded-lg px-3 py-2 text-sm font-semibold ${isActive ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}>
              {label}
            </NavLink>
          ))}
          <div className="mt-4 border-t border-slate-200 pt-3">
            <Link to="/" className="block rounded-lg px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100">← Back to app</Link>
          </div>
        </nav>
      </aside>
      <main className="flex-1 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
