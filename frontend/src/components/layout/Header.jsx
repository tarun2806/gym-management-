import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, User, Settings, LogOut, ChevronDown, Menu, ShieldCheck, Inbox, CalendarClock, Wrench } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import {
  fetchNotifications,
  fetchReadIds,
  markNotificationsRead,
  mergeRead
} from "../../lib/notifications";
const Header = ({ onMenuClick }) => {
  const { user, logout, can } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
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
    if (user?.id) void markNotificationsRead([n.id]).catch(() => {
    });
    setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, read: true } : x));
    setShowNotifications(false);
    navigate(n.link);
  };
  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };
  return <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-6 lg:px-8 shrink-0 relative z-50">
            <div className="flex items-center gap-4">
                <button
    onClick={onMenuClick}
    className="lg:hidden h-11 w-11 flex items-center justify-center rounded-[16px] bg-slate-50 text-slate-500 hover:text-slate-900 transition-all border border-slate-100 shadow-sm"
  >
                    <Menu className="h-5 w-5" />
                </button>
                {
    /* Placeholder for Breadcrumbs or Page Title if needed */
  }
            </div>

            <div className="flex items-center gap-4">
                {
    /* Notification Bell */
  }
                <div className="relative">
                    <button
    onClick={() => {
      setShowNotifications(!showNotifications);
      setShowUserMenu(false);
    }}
    className={`h-11 w-11 rounded-[16px] shadow-sm flex items-center justify-center transition-all ${showNotifications ? "bg-indigo-50 text-indigo-600 ring-2 ring-indigo-100" : "bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-white hover:shadow-md"}`}
  >
                        <Bell className="h-5 w-5" />
                        {unreadCount > 0 && <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[9px] font-black rounded-full ring-2 ring-white flex items-center justify-center">
                                {unreadCount > 9 ? "9+" : unreadCount}
                            </span>}
                    </button>

                    {showNotifications && <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowNotifications(false)} />
                            <div className="absolute right-0 mt-3 w-[calc(100vw-32px)] sm:w-80 bg-white rounded-[24px] shadow-2xl shadow-slate-200/50 border border-slate-100 p-2 z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="p-4 border-b border-slate-50 flex items-center justify-between">
                                    <h3 className="font-black text-[11px] uppercase tracking-[0.1em] text-slate-900">Notifications</h3>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">{unreadCount} New</span>
                                </div>
                                {recent.length === 0 ? <div className="py-10 px-4 text-center">
                                        <div className="mx-auto h-11 w-11 rounded-2xl bg-slate-50 text-slate-300 flex items-center justify-center mb-3">
                                            <Inbox className="h-5 w-5" />
                                        </div>
                                        <p className="text-xs font-bold text-slate-500">You're all caught up</p>
                                        <p className="text-[10px] text-slate-400 font-medium mt-1">New alerts will show up here.</p>
                                    </div> : <div className="py-1 max-h-[320px] overflow-y-auto">
                                        {recent.map((n) => {
    const Icon = n.category === "membership" ? CalendarClock : Wrench;
    return <button key={n.id} onClick={() => openAlert(n)} className="w-full text-left flex items-start gap-3 p-3 rounded-2xl hover:bg-slate-50 transition-colors">
                                                    <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${n.severity === "critical" ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"}`}>
                                                        <Icon className="h-4 w-4" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-bold text-slate-900 truncate">{n.title}</p>
                                                        <p className="text-[10px] text-slate-400 font-medium truncate">{n.body}</p>
                                                    </div>
                                                </button>;
  })}
                                    </div>}
                                <button
    onClick={() => {
      navigate("/notifications");
      setShowNotifications(false);
    }}
    className="w-full py-3 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 hover:text-indigo-600 transition-colors border-t border-slate-50 mt-2"
  >
                                    View All Alerts
                                </button>
                            </div>
                        </>}
                </div>

                {
    /* User Profile / AD Icon */
  }
                <div className="relative">
                    <button
    onClick={() => {
      setShowUserMenu(!showUserMenu);
      setShowNotifications(false);
    }}
    className={`h-11 flex items-center gap-3 p-1 rounded-[18px] transition-all ${showUserMenu ? "bg-slate-900 shadow-xl" : "hover:bg-slate-50"}`}
  >
                        <div className={`h-9 w-9 rounded-xl flex items-center justify-center font-black text-[10px] transition-all ${showUserMenu ? "bg-indigo-500 text-white" : "bg-slate-900 text-white"}`}>
                            {user?.username?.substring(0, 2).toUpperCase() || "AD"}
                        </div>
                        <div className="hidden md:block pr-2">
                            <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${showUserMenu ? "text-white rotate-180" : "text-slate-400"}`} />
                        </div>
                    </button>

                    {showUserMenu && <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                            <div className="absolute right-0 mt-3 w-[calc(100vw-32px)] sm:w-64 bg-white rounded-[24px] shadow-2xl shadow-slate-200/50 border border-slate-100 p-2 z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="p-4 border-b border-slate-50 mb-2">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Authenticated Account</p>
                                    <p className="font-black text-slate-900 tracking-tight">{user?.username || "Administrator"}</p>
                                    <p className="text-[10px] font-bold text-slate-400 truncate">{user?.email}</p>
                                    <span className="inline-block mt-2 px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[8px] font-black uppercase tracking-widest">
                                        {user?.role || "user"}
                                    </span>
                                </div>

                                <div className="space-y-1">
                                    <button onClick={() => {
    navigate("/settings");
    setShowUserMenu(false);
  }} className="w-full flex items-center gap-3 px-4 py-3 rounded-[16px] text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all text-xs font-bold">
                                        <User className="h-4 w-4 opacity-50" /> Profile Settings
                                    </button>
                                    {isAdmin && <button onClick={() => {
    navigate("/admin");
    setShowUserMenu(false);
  }} className="w-full flex items-center gap-3 px-4 py-3 rounded-[16px] text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all text-xs font-bold">
                                            <ShieldCheck className="h-4 w-4 opacity-50" /> Admin Panel
                                        </button>}
                                    <button onClick={() => {
    navigate("/settings?tab=notifications");
    setShowUserMenu(false);
  }} className="w-full flex items-center gap-3 px-4 py-3 rounded-[16px] text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all text-xs font-bold">
                                        <Settings className="h-4 w-4 opacity-50" /> Preferences
                                    </button>
                                    <div className="h-px bg-slate-50 my-2 mx-2" />
                                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-[16px] text-rose-500 hover:bg-rose-50 transition-all text-xs font-black uppercase tracking-widest">
                                        <LogOut className="h-4 w-4" /> Secure Logout
                                    </button>
                                </div>
                            </div>
                        </>}
                </div>
            </div>
        </header>;
};
var Header_default = Header;
export {
  Header_default as default
};
