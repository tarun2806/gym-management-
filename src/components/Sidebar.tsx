
import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
    Users,
    Calendar,
    Dumbbell,
    Activity,
    CreditCard,
    BarChart,
    Settings as SettingsIcon,
    Clipboard,
    Shield,
    LayoutDashboard,
    X,
    UserCheck,
    Utensils,
    Zap,
    Target as TargetIcon,
    LogOut
} from 'lucide-react';

interface SidebarProps {
    onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
        if (onClose) onClose();
    };

    const navigation = [
        { name: 'Dashboard', href: '/', icon: LayoutDashboard, color: 'text-indigo-400' },
        { name: 'Members', href: '/members', icon: Users, color: 'text-emerald-400' },
        { name: 'Classes', href: '/classes', icon: Calendar, color: 'text-rose-400' },
        { name: 'Attendance', href: '/attendance', icon: UserCheck, color: 'text-amber-400' },
        { name: 'Trainers', href: '/trainers', icon: Dumbbell, color: 'text-blue-400' },
        { name: 'Workouts', href: '/workouts', icon: TargetIcon, color: 'text-purple-400' },
        { name: 'Diet Plans', href: '/diet-plans', icon: Utensils, color: 'text-orange-400' },
        { name: 'Equipment', href: '/equipment', icon: Activity, color: 'text-cyan-400' },
        { name: 'Plans', href: '/plans', icon: Clipboard, color: 'text-pink-400' },
        { name: 'Payments', href: '/payments', icon: CreditCard, color: 'text-green-400' },
        { name: 'Reports', href: '/reports', icon: BarChart, color: 'text-yellow-400' },
        { name: 'Admin', href: '/admin', icon: Shield, color: 'text-red-400' },
        { name: 'Settings', href: '/settings', icon: SettingsIcon, color: 'text-slate-400' },
    ];

    return (
        <div className="h-full flex flex-col bg-slate-950 text-white w-64 border-r border-white/5 relative">
            {/* Glossy Backdrop */}
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-slate-950 opacity-50 pointer-events-none" />

            {/* Logo Section */}
            <div className="flex items-center justify-between h-20 px-6 relative z-10 border-b border-white/5">
                <div className="flex items-center space-x-3">
                    <div className="h-9 w-9 bg-indigo-600 rounded-[12px] flex items-center justify-center shadow-2xl relative group overflow-hidden">
                        <Zap className="h-4 w-4 text-white group-hover:scale-125 transition-transform duration-500" />
                    </div>
                    <div>
                        <span className="text-lg font-black tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                            GYMPRO
                        </span>
                        <div className="flex items-center gap-1 mt-0.5">
                            <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[7px] font-black tracking-[0.2em] text-slate-500 uppercase">Online</span>
                        </div>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="lg:hidden p-2 text-slate-500 hover:text-white bg-white/5 rounded-xl transition-all"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            {/* Navigation Menu */}
            <nav className="flex-1 overflow-y-auto pt-6 pb-3 px-3 space-y-1 relative z-10">
                {navigation.map((item) => {
                    const isActive = location.pathname === item.href;
                    return (
                        <NavLink
                            key={item.name}
                            to={item.href}
                            onClick={onClose}
                            className={`flex items-center px-4 py-3 rounded-[18px] text-[11px] font-bold uppercase tracking-[0.05em] transition-all duration-300 group relative overflow-hidden ${isActive
                                ? 'bg-white/10 text-white shadow-xl shadow-black/50 border border-white/5'
                                : 'text-slate-500 hover:bg-white/5 hover:text-slate-200 border border-transparent'
                                }`}
                        >
                            {/* Active Indicator Bar */}
                            {isActive && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 bg-indigo-500 rounded-r-full shadow-lg" />
                            )}

                            <item.icon className={`h-3.5 w-3.5 mr-3 transition-all duration-500 ${isActive ? 'scale-110 ' + item.color : 'text-slate-600 group-hover:text-slate-300'
                                }`} />

                            <span className="relative z-10">{item.name}</span>

                            {isActive && (
                                <div className="ml-auto relative z-10">
                                    <div className="h-1 w-1 rounded-full bg-indigo-500 animate-ping" />
                                </div>
                            )}
                        </NavLink>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="p-4 relative z-10 border-t border-white/5 bg-black/20">
                <div className="p-4 bg-white/5 rounded-[24px] border border-white/5 mb-4 group hover:bg-white/[0.08] transition-all duration-500">
                    <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-[16px] bg-slate-800 p-0.5 shadow-2xl relative overflow-hidden">
                            <div className="h-full w-full rounded-[14px] bg-slate-900 flex items-center justify-center relative z-10">
                                <span className="font-black text-[10px] text-indigo-400">
                                    {user?.username?.substring(0, 2).toUpperCase() || 'AD'}
                                </span>
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-black text-white truncate tracking-widest uppercase">
                                {user?.username || 'Guest'}
                            </p>
                            <p className="text-[8px] font-bold text-slate-500 truncate tracking-widest uppercase mt-0.5">
                                {user?.role || 'User'}
                            </p>
                        </div>
                    </div>
                </div>
                {/* Logout Button for Mobile/Convenience */}
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-[18px] text-[10px] font-black uppercase tracking-[0.1em] text-red-500 hover:bg-red-500 hover:text-white transition-all active:scale-95 group"
                >
                    <LogOut className="h-3.5 w-3.5 group-hover:rotate-12 transition-transform" />
                    <span>Secure Logout</span>
                </button>
                <p className="text-[7px] font-bold text-slate-700 text-center mt-4 uppercase tracking-[0.3em]">GymPro Admin v1.0</p>
            </div>
        </div>
    );
};

export default Sidebar;
