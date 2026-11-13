import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, User, Settings, LogOut, ChevronDown, Menu, ShieldCheck, Inbox, CalendarClock, Wrench } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useOrganization } from "../../contexts/OrganizationContext";
import { resolveOrgRole } from "../../lib/permissions";
import {
  fetchNotifications,
  fetchReadIds,
  markNotificationsRead,
  mergeRead
} from "../../lib/notifications";

const Header = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const {
    hasPermission: can,
    organizations,
    currentOrganization,
    setCurrentOrganization,
    branches,
    currentBranch,
    setCurrentBranch,
    memberships
  } = useOrganization();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const fallback = user?.platformAdmin ? "platform_admin" : user?.role;
  const orgRole = resolveOrgRole(memberships, currentOrganization?.id, fallback);
  const isAdmin = can("admin");
  const canMembership = can("members.view");
  const canEquipment = can("equipment.view");
  const [notifications, setNotifications] = useState([]);
  const unreadCount = notifications.filter((n) => !n.read).length;
  const recent = notifications.filter((n) => !n.read).slice(0, 5);

  useEffect(() => {
    let active = true;
    const loadNotifs = async () => {
      if (!user?.id || !(canMembership || canEquipment)) {
        setNotifications([]);
        return;
      }
      try {
        const [notifs, readIds] = await Promise.all([
          fetchNotifications({ membership: canMembership, equipment: canEquipment }),
          fetchReadIds()
        ]);
        if (active) setNotifications(mergeRead(notifs, readIds).all);
      } catch {
        if (active) setNotifications([]);
      }
    };
    loadNotifs();
    return () => {
      active = false;
    };
  }, [user?.id, canMembership, canEquipment]);

  const openAlert = (n) => {
    if (user?.id) void markNotificationsRead([n.id]).catch(() => {});
    setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, read: true } : x));
    setShowNotifications(false);
    navigate(n.link);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="relative z-50 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 lg:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={onMenuClick}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        {organizations.length > 1 && (
          <label className="hidden min-w-0 sm:block">
            <span className="sr-only">Organization</span>
            <select
              className="max-w-[180px] truncate rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800"
              value={currentOrganization?.id || ""}
              onChange={(e) => {
                const org = organizations.find((o) => o.id === e.target.value);
                if (org) setCurrentOrganization(org);
              }}
            >
              {organizations.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          </label>
        )}
        {branches.length > 1 && (
          <label className="hidden min-w-0 md:block">
            <span className="sr-only">Branch</span>
            <select
              className="max-w-[160px] truncate rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800"
              value={currentBranch?.id || ""}
              onChange={(e) => {
                const branch = branches.find((b) => b.id === e.target.value) || null;
                setCurrentBranch(branch);
              }}
            >
              <option value="">All branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </label>
        )}
        {currentOrganization && organizations.length <= 1 && (
          <p className="hidden truncate text-sm font-medium text-slate-600 sm:block">{currentOrganization.name}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowUserMenu(false);
            }}
            className={`relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 ${showNotifications ? "bg-brand-50 text-brand-700" : "text-slate-500 hover:bg-slate-50"}`}
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
          {showNotifications && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowNotifications(false)} />
              <div className="absolute right-0 z-20 mt-2 w-[calc(100vw-32px)] rounded-2xl border border-slate-200 bg-white p-2 shadow-card sm:w-80">
                <div className="flex items-center justify-between border-b border-slate-100 p-3">
                  <h3 className="text-sm font-semibold">Notifications</h3>
                  <span className="text-xs text-slate-400">{unreadCount} new</span>
                </div>
                {recent.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <Inbox className="mx-auto mb-2 h-5 w-5 text-slate-300" />
                    <p className="text-sm font-medium text-slate-500">You&apos;re all caught up</p>
                  </div>
                ) : (
                  <div className="max-h-[320px] overflow-y-auto py-1">
                    {recent.map((n) => {
                      const Icon = n.category === "membership" ? CalendarClock : Wrench;
                      return (
                        <button key={n.id} onClick={() => openAlert(n)} className="flex w-full items-start gap-3 rounded-xl p-3 text-left hover:bg-slate-50">
                          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${n.severity === "critical" ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-slate-900">{n.title}</p>
                            <p className="truncate text-xs text-slate-500">{n.body}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
                <button
                  onClick={() => {
                    navigate("/notifications");
                    setShowNotifications(false);
                  }}
                  className="w-full border-t border-slate-100 py-2.5 text-xs font-semibold text-slate-500 hover:text-brand-700"
                >
                  View all alerts
                </button>
              </div>
            </>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowNotifications(false);
            }}
            className={`flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-1.5 ${showUserMenu ? "bg-slate-900 text-white" : "hover:bg-slate-50"}`}
          >
            <div className={`flex h-7 w-7 items-center justify-center rounded-lg text-[11px] font-semibold ${showUserMenu ? "bg-brand-600 text-white" : "bg-ink-900 text-white"}`}>
              {user?.username?.substring(0, 2).toUpperCase() || "GP"}
            </div>
            <ChevronDown className={`mr-1 h-4 w-4 ${showUserMenu ? "text-white" : "text-slate-400"}`} />
          </button>
          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
              <div className="absolute right-0 z-20 mt-2 w-[calc(100vw-32px)] rounded-2xl border border-slate-200 bg-white p-2 shadow-card sm:w-64">
                <div className="border-b border-slate-100 p-3">
                  <p className="font-semibold text-slate-900">{user?.username || "Account"}</p>
                  <p className="truncate text-xs text-slate-500">{user?.email}</p>
                  <span className="mt-2 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium capitalize text-slate-600">
                    {(orgRole || user?.role || "member").replaceAll("_", " ")}
                  </span>
                </div>
                <div className="space-y-0.5 pt-1">
                  <button onClick={() => { navigate("/settings"); setShowUserMenu(false); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                    <User className="h-4 w-4 text-slate-400" /> Profile
                  </button>
                  {isAdmin && (
                    <button onClick={() => { navigate("/admin"); setShowUserMenu(false); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                      <ShieldCheck className="h-4 w-4 text-slate-400" /> Admin
                    </button>
                  )}
                  <button onClick={() => { navigate("/settings?tab=notifications"); setShowUserMenu(false); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                    <Settings className="h-4 w-4 text-slate-400" /> Preferences
                  </button>
                  <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50">
                    <LogOut className="h-4 w-4" /> Log out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
