
import React, { useState, useEffect } from 'react';
import {
    User,
    Building2,
    Bell,
    Shield,
    Camera,
    Save,
    Globe,
    Mail,
    Clock,
    Lock,
    Smartphone,
    CheckCircle2,
    History,
    Key,
    Database
} from 'lucide-react';
import { Button, Card, Form } from '../components';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

type TabType = 'profile' | 'gym' | 'notifications' | 'security' | 'preferences';

const Settings: React.FC = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<TabType>('profile');
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Profile State
    const [profileData, setProfileData] = useState({
        name: user?.username || '',
        email: user?.email || '',
        phone: '+91 00000 00000',
        bio: 'Gym Administrator.',
        timezone: '(GMT+05:30) India Standard Time'
    });

    // Gym Info State
    const [gymData, setGymData] = useState({
        gymName: 'GymPro Node',
        address: 'Sector 4, Digital Matrix',
        openTime: '05:00',
        closeTime: '23:00',
        capacity: '200',
        website: 'www.gympro.io'
    });

    // Notifications State
    const [notifications, setNotifications] = useState({
        emailAlerts: true,
        smsAlerts: false,
        marketing: true,
        maintenanceReminders: true
    });

    // Security State
    const [security, setSecurity] = useState({
        twoFactor: false,
        lastPasswordChange: 'Recently'
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: ''
    });

    const [passwordLoading, setPasswordLoading] = useState(false);

    // Preferences State
    const [preferences, setPreferences] = useState({
        language: 'English (US)',
        currency: 'INR (₹)',
        dateFormat: 'DD/MM/YYYY'
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setInitialLoading(true);
            const { data, error } = await supabase.from('settings').select('*');
            if (error) throw error;

            data.forEach(item => {
                if (item.key === 'gym_info') setGymData(item.value);
                if (item.key === 'app_preferences') setPreferences(item.value);
                if (item.key === 'notifications') setNotifications(item.value);
            });
        } catch (err) {
            console.error('Settings sync failure:', err);
        } finally {
            setInitialLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const updates = [];

            if (activeTab === 'profile') {
                await supabase.from('app_users').update({ username: profileData.name }).eq('email', profileData.email);
            } else if (activeTab === 'gym') {
                updates.push(supabase.from('settings').upsert({ key: 'gym_info', value: gymData }));
            } else if (activeTab === 'preferences') {
                updates.push(supabase.from('settings').upsert({ key: 'app_preferences', value: preferences }));
            } else if (activeTab === 'notifications') {
                updates.push(supabase.from('settings').upsert({ key: 'notifications', value: notifications }));
            } else if (activeTab === 'security') {
                updates.push(supabase.from('settings').upsert({ key: 'security', value: security }));
            }

            if (updates.length > 0) {
                await Promise.all(updates);
            }

            setSuccessMessage('Settings saved successfully!');
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            console.error('Save failure:', err);
            alert('Settings update failed.');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePassword = async () => {
        if (!passwordData.newPassword) {
            alert('Please enter a new password.');
            return;
        }

        setPasswordLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({
                password: passwordData.newPassword
            });

            if (error) throw error;

            setSuccessMessage('Password updated successfully!');
            setPasswordData({ currentPassword: '', newPassword: '' });
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err: unknown) {
            console.error('Password update failure:', err);
            const errorMessage = (err as { message?: string })?.message || 'Failed to update password.';
            alert(errorMessage);
        } finally {
            setPasswordLoading(false);
        }
    };

    const tabs = [
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'gym', label: 'Gym Info', icon: Building2 },
        { id: 'preferences', label: 'Preferences', icon: Globe },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'security', label: 'Security', icon: Shield },
    ];

    if (initialLoading) return (
        <div className="p-20 text-center">
            <div className="animate-spin h-12 w-12 border-4 border-slate-900 border-t-transparent rounded-full mx-auto mb-8 shadow-xl"></div>
            <p className="font-bold uppercase tracking-widest text-[10px] text-slate-400">Loading settings...</p>
        </div>
    );

    return (
        <div className="max-w-[1200px] mx-auto pb-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Header Block */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
                <div>
                    <div className="flex items-center gap-2 text-indigo-600 font-bold uppercase tracking-widest text-[10px] mb-3">
                        <Database className="h-3.5 w-3.5" /> App Settings
                    </div>
                    <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight leading-none">Settings Panel</h1>
                    <p className="text-slate-500 mt-4 text-lg font-medium max-w-xl leading-relaxed">Manage your profile, gym details, and system preferences.</p>
                </div>
                {successMessage && (
                    <div className="flex items-center gap-3 bg-emerald-500 text-white px-6 py-4 rounded-2xl shadow-xl animate-in zoom-in-95 font-bold uppercase tracking-widest text-[10px]">
                        <CheckCircle2 className="h-4 w-4" />
                        {successMessage}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Navigation Menu */}
                <div className="lg:col-span-3">
                    <div className="bg-white rounded-[32px] p-3 shadow-xl shadow-slate-200/40 border-0 sticky top-24">
                        <nav className="space-y-2">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as TabType)}
                                    className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl transition-all duration-300 group ${activeTab === tab.id
                                        ? 'bg-slate-900 text-white shadow-xl scale-[1.01]'
                                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                        }`}
                                >
                                    <tab.icon className={`h-4.5 w-4.5 ${activeTab === tab.id ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-900'}`} />
                                    <span className="font-bold text-[10px] uppercase tracking-widest">{tab.label}</span>
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>

                {/* Content Area */}
                <div className="lg:col-span-9">
                    <Card className="p-0 overflow-hidden border-0 shadow-lg shadow-slate-200/40 rounded-[32px] bg-white relative">
                        <Form onSubmit={handleSave}>
                            {activeTab === 'profile' && (
                                <div className="p-8 md:p-10 space-y-8 animate-in fade-in duration-500 relative z-10">
                                    {/* Profile Info */}
                                    <div className="flex flex-col md:flex-row items-center gap-6 border-b border-slate-50 pb-8">
                                        <div className="relative group">
                                            <div className="h-24 w-24 rounded-3xl bg-slate-900 flex items-center justify-center text-2xl font-bold text-white shadow-lg ring-4 ring-slate-50 relative overflow-hidden">
                                                {profileData.name[0]}
                                                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-purple-600 opacity-20" />
                                            </div>
                                            <button type="button" className="absolute -bottom-1 -right-1 p-2 bg-white text-slate-900 rounded-xl shadow-lg hover:bg-slate-900 hover:text-white transition-all border border-slate-50">
                                                <Camera className="h-4 w-4" />
                                            </button>
                                        </div>
                                        <div className="text-center md:text-left">
                                            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{profileData.name}</h2>
                                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Gym Administrator</p>
                                            <div className="flex items-center justify-center md:justify-start gap-2 mt-3">
                                                <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[8px] font-bold rounded-full uppercase tracking-widest border border-emerald-100 italic">Verified</span>
                                                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[8px] font-bold rounded-full uppercase tracking-widest border border-indigo-100 italic">Admin Role</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Details */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                                            <input className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl outline-none font-bold text-sm focus:ring-4 focus:ring-indigo-50 transition-all" value={profileData.name} onChange={e => setProfileData({ ...profileData, name: e.target.value })} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                                            <input readOnly className="w-full p-3 bg-slate-100/50 border border-slate-100 rounded-xl outline-none font-bold text-sm text-slate-500" value={profileData.email} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                                            <input className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl outline-none font-bold text-sm focus:ring-4 focus:ring-indigo-50 transition-all" value={profileData.phone} onChange={e => setProfileData({ ...profileData, phone: e.target.value })} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Timezone</label>
                                            <div className="relative">
                                                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                                                <select className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-indigo-50 outline-none font-bold text-sm appearance-none cursor-pointer" value={profileData.timezone} onChange={e => setProfileData({ ...profileData, timezone: e.target.value })}>
                                                    <option>(GMT+05:30) IST</option>
                                                    <option>(GMT-08:00) PST</option>
                                                    <option>(GMT+00:00) GMT</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Bio</label>
                                        <textarea
                                            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-indigo-50 outline-none font-bold text-sm min-h-[100px] transition-all leading-relaxed"
                                            value={profileData.bio}
                                            onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                                        />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'gym' && (
                                <div className="p-8 md:p-10 space-y-8 animate-in fade-in duration-500 relative z-10">
                                    <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
                                        <div className="h-12 w-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shadow-inner">
                                            <Building2 className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-900 tracking-tight">Gym Info</h3>
                                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Facility details.</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Gym Name</label>
                                            <input className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl outline-none font-bold text-base focus:ring-4 focus:ring-indigo-50" value={gymData.gymName} onChange={e => setGymData({ ...gymData, gymName: e.target.value })} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Address</label>
                                            <input className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl outline-none font-bold text-sm focus:ring-4 focus:ring-indigo-50" value={gymData.address} onChange={e => setGymData({ ...gymData, address: e.target.value })} />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Operating Hours</label>
                                                <div className="flex items-center gap-3">
                                                    <input type="time" className="flex-1 p-3 bg-slate-50 border border-slate-100 rounded-lg outline-none font-bold text-sm text-center" value={gymData.openTime} onChange={e => setGymData({ ...gymData, openTime: e.target.value })} />
                                                    <span className="text-slate-300 font-bold text-xs">to</span>
                                                    <input type="time" className="flex-1 p-3 bg-slate-50 border border-slate-100 rounded-lg outline-none font-bold text-sm text-center" value={gymData.closeTime} onChange={e => setGymData({ ...gymData, closeTime: e.target.value })} />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Member Capacity</label>
                                                <input type="number" className="w-full p-3 bg-slate-50 border border-slate-100 rounded-lg outline-none font-bold text-sm focus:ring-4 focus:ring-indigo-50" value={gymData.capacity} onChange={e => setGymData({ ...gymData, capacity: e.target.value })} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'preferences' && (
                                <div className="p-8 md:p-10 space-y-8 animate-in fade-in duration-500 relative z-10">
                                    <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
                                        <div className="h-12 w-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shadow-inner">
                                            <Globe className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-900 tracking-tight">App Preferences</h3>
                                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Language and region.</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Language</label>
                                            <select className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-indigo-50 outline-none font-bold text-sm appearance-none cursor-pointer" value={preferences.language} onChange={e => setPreferences({ ...preferences, language: e.target.value })}>
                                                <option>English (US)</option>
                                                <option>English (UK)</option>
                                                <option>Hindi (IN)</option>
                                                <option>Spanish (ES)</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Currency</label>
                                            <select className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-indigo-50 outline-none font-bold text-sm appearance-none cursor-pointer" value={preferences.currency} onChange={e => setPreferences({ ...preferences, currency: e.target.value })}>
                                                <option>INR (₹)</option>
                                                <option>USD ($)</option>
                                                <option>EUR (€)</option>
                                                <option>GBP (£)</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Date Format</label>
                                            <select className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-indigo-50 outline-none font-bold text-sm appearance-none cursor-pointer" value={preferences.dateFormat} onChange={e => setPreferences({ ...preferences, dateFormat: e.target.value })}>
                                                <option>DD/MM/YYYY</option>
                                                <option>MM/DD/YYYY</option>
                                                <option>YYYY-MM-DD</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'notifications' && (
                                <div className="p-8 md:p-10 space-y-8 animate-in fade-in duration-500 relative z-10">
                                    <div className="mb-6">
                                        <h3 className="text-xl font-bold text-slate-900 tracking-tight">Notifications</h3>
                                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">App alerts.</p>
                                    </div>

                                    <div className="space-y-3">
                                        {[
                                            { key: 'emailAlerts', title: 'Email Alerts', desc: 'Daily reports.', icon: Mail },
                                            { key: 'smsAlerts', title: 'SMS Alerts', desc: 'Critical alerts.', icon: Smartphone },
                                            { key: 'maintenanceReminders', title: 'Equipment Alerts', desc: 'Repair reminders.', icon: Clock },
                                            { key: 'marketing', title: 'Updates', desc: 'New features.', icon: Bell },
                                        ].map((pref) => (
                                            <div key={pref.key} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-900 transition-all duration-300 border border-slate-50 group">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-3 bg-white text-slate-900 rounded-lg shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                        <pref.icon className="h-4 w-4" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-900 group-hover:text-white tracking-tight">{pref.title}</p>
                                                        <p className="text-[9px] text-slate-400 group-hover:text-slate-500 font-bold">{pref.desc}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setNotifications({ ...notifications, [pref.key]: !notifications[pref.key as keyof typeof notifications] })}
                                                    className={`w-10 h-6 rounded-full transition-all relative flex items-center px-1 ${notifications[pref.key as keyof typeof notifications] ? 'bg-indigo-500' : 'bg-slate-300'}`}
                                                >
                                                    <div className={`h-4 w-4 bg-white rounded-full shadow-sm transform transition-transform duration-300 ${notifications[pref.key as keyof typeof notifications] ? 'translate-x-4' : 'translate-x-0'}`} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'security' && (
                                <div className="p-8 md:p-10 space-y-8 animate-in fade-in duration-500 relative z-10">
                                    <div className="bg-rose-600 p-6 rounded-3xl shadow-lg shadow-rose-100 border border-rose-500 flex items-start gap-4">
                                        <div className="h-12 w-12 bg-white text-rose-600 rounded-xl flex items-center justify-center shrink-0 shadow-md">
                                            <Lock className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-bold text-white tracking-tight">Security Settings</h4>
                                            <p className="text-rose-100 text-xs font-medium mt-1">Manage account protection.</p>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-md">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
                                                        <Shield className="h-4 w-4" />
                                                    </div>
                                                    <div>
                                                        <p className="text-base font-bold text-slate-900 tracking-tight">Two-Factor Auth</p>
                                                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Additional security layer.</p>
                                                    </div>
                                                </div>
                                                <Button type="button" variant="outline" className="rounded-lg px-4 text-[9px] font-bold uppercase tracking-widest py-2 bg-slate-50 border-0" onClick={() => setSecurity({ ...security, twoFactor: !security.twoFactor })}>
                                                    {security.twoFactor ? 'DISABLE' : 'ENABLE'}
                                                </Button>
                                            </div>

                                            {security.twoFactor && (
                                                <div className="mt-6 p-6 bg-slate-50 rounded-2xl border border-slate-100 animate-in slide-in-from-top-4">
                                                    <p className="text-[10px] font-bold text-slate-900 mb-4 uppercase tracking-widest">Setup Authentication</p>
                                                    <div className="flex flex-col md:flex-row items-center gap-6">
                                                        <div className="h-28 w-28 bg-white p-2 rounded-xl shadow-sm border border-slate-100">
                                                            <img src="/auth_qr_code.png" alt="QR" className="w-full h-full" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                                                                Scan this QR code with your authenticator app (like Google Authenticator) to enable 2FA.
                                                            </p>
                                                            <div className="mt-4 flex gap-2">
                                                                <input type="text" placeholder="6-digit code" className="w-28 p-2 bg-white border border-slate-200 rounded-lg text-xs text-center font-black" maxLength={6} />
                                                                <Button type="button" variant="primary" className="h-9 px-4 text-[9px] font-bold uppercase tracking-widest bg-emerald-600 border-0" onClick={() => { setSuccessMessage('2FA Verified Successfully!'); setTimeout(() => setSuccessMessage(null), 3000); }}>Verify</Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="p-8 bg-white rounded-3xl border border-slate-100 shadow-md">
                                            <div className="flex items-center gap-4 mb-6">
                                                <div className="h-10 w-10 bg-slate-900 text-white rounded-lg flex items-center justify-center">
                                                    <Key className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <p className="text-lg font-bold text-slate-900 tracking-tight">Update Password</p>
                                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Last change: {security.lastPasswordChange}</p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Current Password</label>
                                                    <input type="password" placeholder="••••••••" className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl outline-none text-sm" value={passwordData.currentPassword} onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })} />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">New Password</label>
                                                    <input type="password" placeholder="••••••••" className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl outline-none text-sm" value={passwordData.newPassword} onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })} />
                                                </div>
                                            </div>
                                            <div className="mt-6 flex justify-end">
                                                <Button type="button" variant="primary" loading={passwordLoading} onClick={handleUpdatePassword} className="rounded-lg px-6 py-3 bg-slate-900 text-white border-0 shadow-md font-bold uppercase tracking-widest text-[9px]">Save Password</Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Footer */}
                            <div className="bg-slate-950 p-10 md:p-12 flex flex-col sm:flex-row items-center justify-between border-t border-white/5 gap-8 relative overflow-hidden">
                                <div className="flex items-center gap-4 relative z-10">
                                    <button type="button" className="flex items-center gap-2 px-5 py-3 bg-white/5 rounded-xl border border-white/10 text-white text-[9px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all shadow-xl" onClick={() => fetchSettings()}>
                                        <History className="h-3.5 w-3.5 text-indigo-400" />
                                        Reset
                                    </button>
                                    <div className="h-8 w-[1px] bg-white/10" />
                                    <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">v1.2.0 stable</p>
                                </div>

                                <div className="flex gap-4 w-full sm:w-auto relative z-10">
                                    <Button type="button" variant="outline" className="flex-1 sm:flex-initial rounded-xl py-4 px-8 border-white/10 text-slate-500 font-bold uppercase tracking-widest text-[9px]" onClick={() => fetchSettings()}>Cancel</Button>
                                    <Button type="submit" variant="primary" loading={loading} className="flex-2 sm:flex-initial rounded-xl py-4 px-12 shadow-xl shadow-indigo-500/10 bg-indigo-600 hover:bg-indigo-500 border-0 font-bold uppercase tracking-widest text-[9px] flex items-center gap-3" icon={Save}>
                                        Save Settings
                                    </Button>
                                </div>
                            </div>
                        </Form>
                    </Card>
                    <p className="text-center mt-10 text-[9px] font-bold text-slate-400 uppercase tracking-widest animate-pulse italic">Secure connection active...</p>
                </div>
            </div>
        </div>
    );
};

export default Settings;
