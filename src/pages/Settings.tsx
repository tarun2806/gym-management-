import React, { useState } from 'react';
import {
    Building2,
    Clock,
    MapPin,
    Phone,
    Mail,
    Globe,
    Save,
    Camera,
    Bell,
    Shield,
    CreditCard,
    Users,
    Palette,
    Sun,
    Moon
} from 'lucide-react';

interface GymSettings {
    general: {
        gymName: string;
        tagline: string;
        email: string;
        phone: string;
        website: string;
        address: string;
        city: string;
        state: string;
        zipCode: string;
    };
    hours: {
        monday: { open: string; close: string; closed: boolean };
        tuesday: { open: string; close: string; closed: boolean };
        wednesday: { open: string; close: string; closed: boolean };
        thursday: { open: string; close: string; closed: boolean };
        friday: { open: string; close: string; closed: boolean };
        saturday: { open: string; close: string; closed: boolean };
        sunday: { open: string; close: string; closed: boolean };
    };
    notifications: {
        emailNotifications: boolean;
        membershipReminders: boolean;
        paymentAlerts: boolean;
        classReminders: boolean;
        marketingEmails: boolean;
    };
    appearance: {
        theme: 'light' | 'dark' | 'system';
        primaryColor: string;
        accentColor: string;
    };
}

const Settings: React.FC = () => {
    const [activeTab, setActiveTab] = useState('general');
    const [isSaving, setIsSaving] = useState(false);

    const [settings, setSettings] = useState<GymSettings>({
        general: {
            gymName: 'GymPro Fitness Center',
            tagline: 'Transform Your Body, Transform Your Life',
            email: 'info@gympro.com',
            phone: '+1 (555) 123-4567',
            website: 'www.gympro.com',
            address: '123 Fitness Street',
            city: 'Los Angeles',
            state: 'California',
            zipCode: '90210',
        },
        hours: {
            monday: { open: '05:00', close: '22:00', closed: false },
            tuesday: { open: '05:00', close: '22:00', closed: false },
            wednesday: { open: '05:00', close: '22:00', closed: false },
            thursday: { open: '05:00', close: '22:00', closed: false },
            friday: { open: '05:00', close: '21:00', closed: false },
            saturday: { open: '06:00', close: '20:00', closed: false },
            sunday: { open: '08:00', close: '18:00', closed: false },
        },
        notifications: {
            emailNotifications: true,
            membershipReminders: true,
            paymentAlerts: true,
            classReminders: true,
            marketingEmails: false,
        },
        appearance: {
            theme: 'light',
            primaryColor: '#3B82F6',
            accentColor: '#8B5CF6',
        },
    });

    const tabs = [
        { id: 'general', label: 'General', icon: Building2 },
        { id: 'hours', label: 'Operating Hours', icon: Clock },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'billing', label: 'Billing', icon: CreditCard },
        { id: 'security', label: 'Security', icon: Shield },
        { id: 'appearance', label: 'Appearance', icon: Palette },
    ];

    const handleSave = async () => {
        setIsSaving(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsSaving(false);
        alert('Settings saved successfully!');
    };

    const updateGeneralSetting = (field: keyof GymSettings['general'], value: string) => {
        setSettings(prev => ({
            ...prev,
            general: { ...prev.general, [field]: value },
        }));
    };

    const updateHours = (day: keyof GymSettings['hours'], field: string, value: string | boolean) => {
        setSettings(prev => ({
            ...prev,
            hours: {
                ...prev.hours,
                [day]: { ...prev.hours[day], [field]: value },
            },
        }));
    };

    const updateNotification = (field: keyof GymSettings['notifications'], value: boolean) => {
        setSettings(prev => ({
            ...prev,
            notifications: { ...prev.notifications, [field]: value },
        }));
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
                    <p className="text-gray-600">Manage your gym's configuration and preferences</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200"
                >
                    <Save className="h-5 w-5" />
                    <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Sidebar Navigation */}
                <div className="lg:w-64 flex-shrink-0">
                    <div className="bg-white rounded-xl shadow border border-gray-200 p-4">
                        <nav className="space-y-1">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${activeTab === tab.id
                                            ? 'bg-blue-50 text-blue-600'
                                            : 'text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    <tab.icon className="h-5 w-5" />
                                    <span className="font-medium">{tab.label}</span>
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1">
                    <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
                        {/* General Settings */}
                        {activeTab === 'general' && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900 mb-4">General Information</h2>
                                    <p className="text-sm text-gray-600 mb-6">Update your gym's basic information and contact details.</p>
                                </div>

                                {/* Gym Logo */}
                                <div className="flex items-center space-x-6 pb-6 border-b border-gray-200">
                                    <div className="h-24 w-24 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-3xl font-bold">
                                        GP
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-gray-900">Gym Logo</h3>
                                        <p className="text-sm text-gray-600 mb-2">JPG, PNG or SVG. Max size 2MB.</p>
                                        <button className="flex items-center space-x-2 text-blue-600 hover:text-blue-700">
                                            <Camera className="h-4 w-4" />
                                            <span>Change Logo</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Gym Name</label>
                                        <div className="relative">
                                            <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                                            <input
                                                type="text"
                                                value={settings.general.gymName}
                                                onChange={(e) => updateGeneralSetting('gymName', e.target.value)}
                                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Tagline</label>
                                        <input
                                            type="text"
                                            value={settings.general.tagline}
                                            onChange={(e) => updateGeneralSetting('tagline', e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                                            <input
                                                type="email"
                                                value={settings.general.email}
                                                onChange={(e) => updateGeneralSetting('email', e.target.value)}
                                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                                            <input
                                                type="tel"
                                                value={settings.general.phone}
                                                onChange={(e) => updateGeneralSetting('phone', e.target.value)}
                                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                                        <div className="relative">
                                            <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                                            <input
                                                type="url"
                                                value={settings.general.website}
                                                onChange={(e) => updateGeneralSetting('website', e.target.value)}
                                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                                            <input
                                                type="text"
                                                value={settings.general.address}
                                                onChange={(e) => updateGeneralSetting('address', e.target.value)}
                                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                                        <input
                                            type="text"
                                            value={settings.general.city}
                                            onChange={(e) => updateGeneralSetting('city', e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                                        <input
                                            type="text"
                                            value={settings.general.state}
                                            onChange={(e) => updateGeneralSetting('state', e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code</label>
                                        <input
                                            type="text"
                                            value={settings.general.zipCode}
                                            onChange={(e) => updateGeneralSetting('zipCode', e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Operating Hours */}
                        {activeTab === 'hours' && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Operating Hours</h2>
                                    <p className="text-sm text-gray-600 mb-6">Set your gym's operating hours for each day of the week.</p>
                                </div>

                                <div className="space-y-4">
                                    {Object.entries(settings.hours).map(([day, hours]) => (
                                        <div key={day} className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0">
                                            <div className="flex items-center space-x-4">
                                                <span className="text-sm font-medium text-gray-900 capitalize w-28">{day}</span>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={!hours.closed}
                                                        onChange={(e) => updateHours(day as keyof GymSettings['hours'], 'closed', !e.target.checked)}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                                    <span className="ml-3 text-sm text-gray-600">{hours.closed ? 'Closed' : 'Open'}</span>
                                                </label>
                                            </div>
                                            {!hours.closed && (
                                                <div className="flex items-center space-x-4">
                                                    <div className="flex items-center space-x-2">
                                                        <input
                                                            type="time"
                                                            value={hours.open}
                                                            onChange={(e) => updateHours(day as keyof GymSettings['hours'], 'open', e.target.value)}
                                                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                        />
                                                        <span className="text-gray-500">to</span>
                                                        <input
                                                            type="time"
                                                            value={hours.close}
                                                            onChange={(e) => updateHours(day as keyof GymSettings['hours'], 'close', e.target.value)}
                                                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                                    <div className="flex items-center space-x-2">
                                        <Clock className="h-5 w-5 text-blue-600" />
                                        <span className="text-sm text-blue-800">
                                            Tip: VIP members have 24/7 access regardless of operating hours.
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Notifications */}
                        {activeTab === 'notifications' && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Notification Preferences</h2>
                                    <p className="text-sm text-gray-600 mb-6">Configure how and when you receive notifications.</p>
                                </div>

                                <div className="space-y-4">
                                    {[
                                        { key: 'emailNotifications', label: 'Email Notifications', description: 'Receive important updates via email' },
                                        { key: 'membershipReminders', label: 'Membership Reminders', description: 'Get notified about expiring memberships' },
                                        { key: 'paymentAlerts', label: 'Payment Alerts', description: 'Receive alerts for failed or pending payments' },
                                        { key: 'classReminders', label: 'Class Reminders', description: 'Notify members about upcoming classes' },
                                        { key: 'marketingEmails', label: 'Marketing Emails', description: 'Receive promotional content and offers' },
                                    ].map((item) => (
                                        <div key={item.key} className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0">
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-900">{item.label}</h4>
                                                <p className="text-sm text-gray-600">{item.description}</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={settings.notifications[item.key as keyof GymSettings['notifications']]}
                                                    onChange={(e) => updateNotification(item.key as keyof GymSettings['notifications'], e.target.checked)}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Billing */}
                        {activeTab === 'billing' && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Billing Settings</h2>
                                    <p className="text-sm text-gray-600 mb-6">Manage your payment methods and billing preferences.</p>
                                </div>

                                <div className="p-6 border border-gray-200 rounded-lg">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-medium text-gray-900">Current Plan</h3>
                                        <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">Pro Plan</span>
                                    </div>
                                    <p className="text-gray-600 mb-4">You are currently on the Pro plan. Upgrade to access more features.</p>
                                    <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors">
                                        Upgrade Plan
                                    </button>
                                </div>

                                <div className="p-6 border border-gray-200 rounded-lg">
                                    <h3 className="font-medium text-gray-900 mb-4">Payment Method</h3>
                                    <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                                        <CreditCard className="h-8 w-8 text-gray-400" />
                                        <div>
                                            <p className="font-medium text-gray-900">•••• •••• •••• 4242</p>
                                            <p className="text-sm text-gray-600">Expires 12/2025</p>
                                        </div>
                                        <button className="ml-auto text-blue-600 hover:text-blue-700">Change</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Security */}
                        {activeTab === 'security' && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Security Settings</h2>
                                    <p className="text-sm text-gray-600 mb-6">Manage your account security and access controls.</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="p-6 border border-gray-200 rounded-lg">
                                        <h3 className="font-medium text-gray-900 mb-2">Change Password</h3>
                                        <p className="text-sm text-gray-600 mb-4">Update your password regularly to keep your account secure.</p>
                                        <button className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg transition-colors">
                                            Change Password
                                        </button>
                                    </div>

                                    <div className="p-6 border border-gray-200 rounded-lg">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="font-medium text-gray-900 mb-2">Two-Factor Authentication</h3>
                                                <p className="text-sm text-gray-600">Add an extra layer of security to your account.</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" className="sr-only peer" />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                            </label>
                                        </div>
                                    </div>

                                    <div className="p-6 border border-gray-200 rounded-lg">
                                        <h3 className="font-medium text-gray-900 mb-2">Active Sessions</h3>
                                        <p className="text-sm text-gray-600 mb-4">Manage devices where you're currently logged in.</p>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                    <span className="text-sm text-gray-900">MacBook Pro - Chrome</span>
                                                    <span className="text-xs text-gray-500">Current session</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Appearance */}
                        {activeTab === 'appearance' && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Appearance</h2>
                                    <p className="text-sm text-gray-600 mb-6">Customize the look and feel of your dashboard.</p>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <h3 className="font-medium text-gray-900 mb-4">Theme</h3>
                                        <div className="grid grid-cols-3 gap-4">
                                            {[
                                                { id: 'light', label: 'Light', icon: Sun },
                                                { id: 'dark', label: 'Dark', icon: Moon },
                                                { id: 'system', label: 'System', icon: Users },
                                            ].map((theme) => (
                                                <button
                                                    key={theme.id}
                                                    onClick={() => setSettings(prev => ({
                                                        ...prev,
                                                        appearance: { ...prev.appearance, theme: theme.id as 'light' | 'dark' | 'system' }
                                                    }))}
                                                    className={`flex flex-col items-center p-4 border-2 rounded-lg transition-colors ${settings.appearance.theme === theme.id
                                                            ? 'border-blue-500 bg-blue-50'
                                                            : 'border-gray-200 hover:border-gray-300'
                                                        }`}
                                                >
                                                    <theme.icon className="h-6 w-6 text-gray-700 mb-2" />
                                                    <span className="text-sm font-medium">{theme.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="font-medium text-gray-900 mb-4">Primary Color</h3>
                                        <div className="flex items-center space-x-4">
                                            <input
                                                type="color"
                                                value={settings.appearance.primaryColor}
                                                onChange={(e) => setSettings(prev => ({
                                                    ...prev,
                                                    appearance: { ...prev.appearance, primaryColor: e.target.value }
                                                }))}
                                                className="w-12 h-12 rounded-lg cursor-pointer"
                                            />
                                            <input
                                                type="text"
                                                value={settings.appearance.primaryColor}
                                                onChange={(e) => setSettings(prev => ({
                                                    ...prev,
                                                    appearance: { ...prev.appearance, primaryColor: e.target.value }
                                                }))}
                                                className="px-4 py-2 border border-gray-300 rounded-lg w-32"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="font-medium text-gray-900 mb-4">Accent Color</h3>
                                        <div className="flex items-center space-x-4">
                                            <input
                                                type="color"
                                                value={settings.appearance.accentColor}
                                                onChange={(e) => setSettings(prev => ({
                                                    ...prev,
                                                    appearance: { ...prev.appearance, accentColor: e.target.value }
                                                }))}
                                                className="w-12 h-12 rounded-lg cursor-pointer"
                                            />
                                            <input
                                                type="text"
                                                value={settings.appearance.accentColor}
                                                onChange={(e) => setSettings(prev => ({
                                                    ...prev,
                                                    appearance: { ...prev.appearance, accentColor: e.target.value }
                                                }))}
                                                className="px-4 py-2 border border-gray-300 rounded-lg w-32"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
