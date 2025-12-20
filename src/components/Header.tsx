
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, User, Settings, LogOut, ChevronDown, Menu } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
    onMenuClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [showNotifications, setShowNotifications] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);

    // Dummy notifications
    const [notifications] = useState([
        { id: 1, title: 'New Member', text: 'Sarah Jenkins joined the Gold Plan.', time: '2m ago', unread: true },
        { id: 2, title: 'System Update', text: 'GymPro OS updated to v1.2.4 successfully.', time: '1h ago', unread: false },
        { id: 3, title: 'Maintenance Alert', text: 'Treadmill #4 is scheduled for service tomorrow.', time: '2h ago', unread: true },
    ]);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-6 lg:px-8 shrink-0 relative z-50">
            <div className="flex items-center gap-4">
                <button
                    onClick={onMenuClick}
                    className="lg:hidden h-11 w-11 flex items-center justify-center rounded-[16px] bg-slate-50 text-slate-500 hover:text-slate-900 transition-all border border-slate-100 shadow-sm"
                >
                    <Menu className="h-5 w-5" />
                </button>
                {/* Placeholder for Breadcrumbs or Page Title if needed */}
            </div>

            <div className="flex items-center gap-4">
                {/* Notification Bell */}
                <div className="relative">
                    <button
                        onClick={() => { setShowNotifications(!showNotifications); setShowUserMenu(false); }}
                        className={`h-11 w-11 rounded-[16px] shadow-sm flex items-center justify-center transition-all ${showNotifications ? 'bg-indigo-50 text-indigo-600 ring-2 ring-indigo-100' : 'bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-white hover:shadow-md'
                            }`}
                    >
                        <Bell className="h-5 w-5" />
                        {notifications.some(n => n.unread) && (
                            <span className="absolute top-3 right-3 h-2 w-2 bg-rose-500 rounded-full ring-2 ring-white animate-pulse" />
                        )}
                    </button>

                    {showNotifications && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowNotifications(false)} />
                            <div className="absolute right-0 mt-3 w-[calc(100vw-32px)] sm:w-80 bg-white rounded-[24px] shadow-2xl shadow-slate-200/50 border border-slate-100 p-2 z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="p-4 border-b border-slate-50 flex items-center justify-between">
                                    <h3 className="font-black text-[11px] uppercase tracking-[0.1em] text-slate-900">Notifications</h3>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">3 New</span>
                                </div>
                                <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                                    {notifications.map((n) => (
                                        <div key={n.id} className="p-4 hover:bg-slate-50 rounded-[18px] transition-colors cursor-pointer group mb-1">
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className={`text-xs font-bold ${n.unread ? 'text-slate-900' : 'text-slate-500'}`}>{n.title}</h4>
                                                <span className="text-[9px] font-bold text-slate-300">{n.time}</span>
                                            </div>
                                            <p className="text-[11px] text-slate-500 leading-relaxed font-medium">{n.text}</p>
                                        </div>
                                    ))}
                                </div>
                                <button className="w-full py-3 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 hover:text-indigo-600 transition-colors border-t border-slate-50 mt-2">
                                    View All Alerts
                                </button>
                            </div>
                        </>
                    )}
                </div>

                {/* User Profile / AD Icon */}
                <div className="relative">
                    <button
                        onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false); }}
                        className={`h-11 flex items-center gap-3 p-1 rounded-[18px] transition-all ${showUserMenu ? 'bg-slate-900 shadow-xl' : 'hover:bg-slate-50'
                            }`}
                    >
                        <div className={`h-9 w-9 rounded-xl flex items-center justify-center font-black text-[10px] transition-all ${showUserMenu ? 'bg-indigo-500 text-white' : 'bg-slate-900 text-white'
                            }`}>
                            {user?.username?.substring(0, 2).toUpperCase() || 'AD'}
                        </div>
                        <div className="hidden md:block pr-2">
                            <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${showUserMenu ? 'text-white rotate-180' : 'text-slate-400'
                                }`} />
                        </div>
                    </button>

                    {showUserMenu && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                            <div className="absolute right-0 mt-3 w-[calc(100vw-32px)] sm:w-64 bg-white rounded-[24px] shadow-2xl shadow-slate-200/50 border border-slate-100 p-2 z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="p-4 border-b border-slate-50 mb-2">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Authenticated Account</p>
                                    <p className="font-black text-slate-900 tracking-tight">{user?.username || 'Administrator'}</p>
                                    <p className="text-[10px] font-bold text-slate-400 truncate">{user?.email}</p>
                                </div>

                                <div className="space-y-1">
                                    <button onClick={() => { navigate('/settings'); setShowUserMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-[16px] text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all text-xs font-bold">
                                        <User className="h-4 w-4 opacity-50" /> Profile Settings
                                    </button>
                                    <button onClick={() => { navigate('/admin'); setShowUserMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-[16px] text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all text-xs font-bold">
                                        <Settings className="h-4 w-4 opacity-50" /> Admin Panel
                                    </button>
                                    <div className="h-px bg-slate-50 my-2 mx-2" />
                                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-[16px] text-rose-500 hover:bg-rose-50 transition-all text-xs font-black uppercase tracking-widest">
                                        <LogOut className="h-4 w-4" /> Secure Logout
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
