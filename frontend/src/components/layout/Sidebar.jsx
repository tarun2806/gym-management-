import { NavLink, useLocation, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useOrganization } from "../../contexts/OrganizationContext";
import { resolveOrgRole } from "../../lib/permissions";
import {
  Users,
  Calendar,
  Dumbbell,
  Activity,
  CreditCard,
  BarChart,
  Clipboard,
  Shield,
  LayoutDashboard,
  UserCheck,
  Utensils,
  Target as TargetIcon,
  Settings as SettingsIcon,
  X,
  LogOut,
  Building2,
  GitBranch,
  Package,
  Receipt,
  Wallet,
  Landmark,
  Bell
} from "lucide-react";

const SIDEBAR_GROUPS = [
  {
    label: "Overview",
    items: [{ name: "Dashboard", href: "/", icon: LayoutDashboard, cap: "dashboard" }]
  },
  {
    label: "Operations",
    items: [
      { name: "Members", href: "/members", icon: Users, cap: "members.view" },
      { name: "Classes", href: "/classes", icon: Calendar, cap: "classes" },
      { name: "Attendance", href: "/attendance", icon: UserCheck, cap: "attendance" },
      { name: "Trainers", href: "/trainers", icon: Dumbbell, cap: "trainers.view" },
      { name: "Personal training", href: "/personal-training", icon: Dumbbell, cap: "trainers.view" },
      { name: "Workouts", href: "/workouts", icon: TargetIcon, cap: "workouts" },
      { name: "Diet plans", href: "/diet-plans", icon: Utensils, cap: "diet" },
      { name: "Equipment", href: "/equipment", icon: Activity, cap: "equipment.view" },
      { name: "Inventory", href: "/inventory", icon: Package, cap: "equipment.view" }
    ]
  },
  {
    label: "Finance",
    items: [
      { name: "Payments", href: "/payments", icon: CreditCard, cap: "payments" },
      { name: "Billing", href: "/billing", icon: Receipt, cap: "payments" },
      { name: "Expenses", href: "/expenses", icon: Wallet, cap: "reports" },
      { name: "Payroll", href: "/payroll", icon: Landmark, cap: "admin" }
    ]
  },
  {
    label: "Administration",
    items: [
      { name: "Plans", href: "/plans", icon: Clipboard, cap: "plans" },
      { name: "Reports", href: "/reports", icon: BarChart, cap: "reports" },
      { name: "Organizations", href: "/organizations", icon: Building2, cap: "organizations.view" },
      { name: "Branches", href: "/branches", icon: GitBranch, cap: "branches.view" },
      { name: "Admin", href: "/admin", icon: Shield, cap: "admin" }
    ]
  }
];

const itemClass = (active) =>
  `flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
    active ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"
  }`;

const Sidebar = ({ onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { hasPermission, memberships, currentOrganization } = useOrganization();
  const fallback = user?.platformAdmin ? "platform_admin" : user?.role;
  const orgRole = resolveOrgRole(memberships, currentOrganization?.id, fallback);
  const handleLogout = async () => {
    await logout();
    navigate("/login");
    if (onClose) onClose();
  };
  const visibleGroups = SIDEBAR_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => hasPermission(item.cap) && !(orgRole === "member" && item.cap === "dashboard"))
  })).filter((group) => group.items.length > 0);

  return (
    <div className="relative flex h-full w-64 flex-col border-r border-white/10 bg-ink-900 text-white">
      <div className="relative z-10 flex h-16 items-center justify-between border-b border-white/10 px-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-700 font-display text-sm font-bold">
            GP
          </div>
          <div>
            <p className="font-display text-[15px] font-semibold leading-none">GymPro</p>
            <p className="mt-1 text-[11px] font-medium capitalize text-slate-500">{orgRole?.replaceAll("_", " ") || "Signed in"}</p>
          </div>
        </div>
        <button onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-white/5 hover:text-white lg:hidden" aria-label="Close menu">
          <X className="h-4 w-4" />
        </button>
      </div>

      <nav className="relative z-10 flex-1 space-y-5 overflow-y-auto px-3 py-5 scrollbar-thin">
        {visibleGroups.map((group) => (
          <div key={group.label}>
            <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{group.label}</p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <NavLink key={item.href} to={item.href} onClick={onClose} className={itemClass(isActive)}>
                    <item.icon className="h-4 w-4 shrink-0 opacity-80" />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
        <div>
          <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Account</p>
          <div className="space-y-0.5">
            {user?.platformAdmin && (
              <Link to="/platform" onClick={onClose} className={itemClass(location.pathname.startsWith("/platform"))}>
                <Shield className="h-4 w-4 shrink-0 opacity-80" />
                Platform
              </Link>
            )}
            {orgRole === "org_owner" && (
              <NavLink to="/subscription" onClick={onClose} className={itemClass(location.pathname === "/subscription")}>
                <CreditCard className="h-4 w-4 shrink-0 opacity-80" />
                Subscription
              </NavLink>
            )}
            {hasPermission("dashboard") && orgRole !== "member" && (
              <NavLink to="/notifications" onClick={onClose} className={itemClass(location.pathname === "/notifications")}>
                <Bell className="h-4 w-4 shrink-0 opacity-80" />
                Notifications
              </NavLink>
            )}
            <NavLink to="/settings" onClick={onClose} className={itemClass(location.pathname === "/settings")}>
              <SettingsIcon className="h-4 w-4 shrink-0 opacity-80" />
              Settings
            </NavLink>
          </div>
        </div>
      </nav>

      <div className="relative z-10 border-t border-white/10 p-3">
        <div className="mb-2 flex items-center gap-3 rounded-xl px-2 py-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-xs font-semibold">
            {user?.username?.substring(0, 2).toUpperCase() || "GP"}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{user?.username || "Guest"}</p>
            <p className="truncate text-xs text-slate-500">{currentOrganization?.name || user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm font-medium text-slate-300 hover:bg-white/5"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
