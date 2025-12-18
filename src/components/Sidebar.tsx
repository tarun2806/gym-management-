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
    Target,
    LogOut,
    Utensils
} from 'lucide-react';

interface SidebarProps {
    onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout, user } = useAuth();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const navigation = [
        { name: 'Dashboard', href: '/', icon: LayoutDashboard },
        { name: 'Members', href: '/members', icon: Users },
        { name: 'Classes', href: '/classes', icon: Calendar },
        { name: 'Attendance', href: '/attendance', icon: UserCheck },
        { name: 'Trainers', href: '/trainers', icon: Dumbbell },
        { name: 'Workouts', href: '/workouts', icon: Target },
        { name: 'Diet Plans', href: '/diet-plans', icon: Utensils },
        { name: 'Equipment', href: '/equipment', icon: Activity },
        { name: 'Membership Plans', href: '/plans', icon: Clipboard },
        { name: 'Payments', href: '/payments', icon: CreditCard },
        { name: 'Reports', href: '/reports', icon: BarChart },
        { name: 'Admin', href: '/admin', icon: Shield },
        { name: 'Settings', href: '/settings', icon: SettingsIcon },
    ];

    return (
        <div className="h-full flex flex-col bg-slate-900 text-white w-64">
            {/* Logo */}
            <div className="flex items-center justify-between h-16 px-4 bg-slate-950">
                <div className="flex items-center space-x-2">
                    <div className="p-2 bg-blue-600 rounded-lg">
                        <Dumbbell className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        GymPro
                    </span>
                </div>
                <button
                    onClick={onClose}
                    className="lg:hidden p-1 text-gray-400 hover:text-white rounded-md"
                >
                    <X className="h-6 w-6" />
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1 scrollbar-thin scrollbar-thumb-slate-700">
                {navigation.map((item) => {

                    const isActive = location.pathname === item.href;
                    return (
                        <NavLink
                            key={item.name}
                            to={item.href}
                            onClick={onClose}
                            className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 group ${isActive
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                }`}
                        >
                            <item.icon className={`h-5 w-5 mr-3 transition-colors ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-white'
                                }`} />
                            {item.name}
                            {isActive && (
                                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            )}
                        </NavLink>
                    );
                })}
            </nav>

            {/* User Profile / Footer */}
            <div className="p-4 bg-slate-950 border-t border-slate-800">
                <div className="flex items-center space-x-3 mb-4">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 p-[2px]">
                        <div className="h-full w-full rounded-full bg-slate-950 flex items-center justify-center">
                            <span className="font-bold text-white">
                                {user?.username?.substring(0, 2).toUpperCase() || 'AD'}
                            </span>
                        </div>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                            {user?.username || 'Admin User'}
                        </p>
                        <p className="text-xs text-slate-400 truncate">
                            {user?.email || 'admin@gympro.com'}
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-slate-700 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
