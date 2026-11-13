import { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";

const NAV = [
  ["/", "Home"],
  ["/features", "Features"],
  ["/how-it-works", "How It Works"],
  ["/solutions", "Solutions"],
  ["/pricing", "Pricing"],
  ["/about", "About"],
  ["/contact", "Contact"],
];

export default function MarketingLayout({ children }) {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2 text-xl font-extrabold tracking-tight">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white">G</span>
            GymPro
          </Link>
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
            {NAV.map(([to, label]) => (
              <NavLink key={to} to={to} end={to === "/"}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm font-semibold ${isActive ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:text-slate-900"}`}>
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="hidden items-center gap-2 lg:flex">
            <Link to="/login" className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
              Login
            </Link>
            <Link to="/login" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-700">
              Get Started
            </Link>
          </div>
          <button
            className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 lg:hidden"
            aria-label="Toggle menu" aria-expanded={open}
            onClick={() => setOpen(!open)}>
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              {open ? <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>
        {open && (
          <nav className="border-t border-slate-200 bg-white px-4 py-3 lg:hidden" aria-label="Mobile">
            {NAV.map(([to, label]) => (
              <NavLink key={to} to={to} end={to === "/"} onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `block rounded-lg px-3 py-2.5 text-sm font-semibold ${isActive ? "bg-slate-100" : "text-slate-600"}`}>
                {label}
              </NavLink>
            ))}
            <div className="mt-2 flex gap-2 border-t border-slate-200 pt-3">
              <Link to="/login" onClick={() => setOpen(false)} className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-center text-sm font-semibold">Login</Link>
              <Link to="/login" onClick={() => setOpen(false)} className="flex-1 rounded-lg bg-slate-900 px-4 py-2 text-center text-sm font-bold text-white">Get Started</Link>
            </div>
          </nav>
        )}
      </header>

      <main>{children}</main>

      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
          <div>
            <p className="text-lg font-extrabold">GymPro</p>
            <p className="mt-2 text-sm text-slate-500">Run your gym. Not the paperwork.</p>
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-slate-400">Product</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li><Link className="hover:text-slate-900" to="/features">Features</Link></li>
              <li><Link className="hover:text-slate-900" to="/how-it-works">How It Works</Link></li>
              <li><Link className="hover:text-slate-900" to="/pricing">Pricing</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-slate-400">Company</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li><Link className="hover:text-slate-900" to="/about">About</Link></li>
              <li><Link className="hover:text-slate-900" to="/solutions">Solutions</Link></li>
              <li><Link className="hover:text-slate-900" to="/contact">Contact</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-slate-400">Account</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li><Link className="hover:text-slate-900" to="/login">Login</Link></li>
              <li><Link className="hover:text-slate-900" to="/login">Get Started</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-200 py-4 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} GymPro. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
