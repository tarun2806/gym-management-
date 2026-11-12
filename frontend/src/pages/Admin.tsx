
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Shield,
  BarChart3,
  Database,
  Eye,
  Edit,
  Trash2,
  Plus,
  X,
  Mail,
  User as UserIcon,
  ShieldCheck,
  ArrowRight,
  ChevronRight,
  Search,
  Terminal,
  History as HistoryIcon,
  Activity as ActivityIcon,
  Building2,
  AlertTriangle
} from 'lucide-react';
import { Button, Card } from '../components';
import { useAuth } from '../contexts/AuthContext';
import { firebaseConfig } from '../lib/firebase';
import { api } from '../lib/api';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import type { User, Role, LegacyRole } from '../types';
import { assignableRoles, mapLegacyRole } from '../lib/permissions';
import { logAudit } from '../lib/audit';
import { exportToJson } from '../utils/export';

const authErrorText = (error: unknown): string => {
  const code = (error as { code?: string })?.code;
  switch (code) {
    case 'auth/email-already-in-use': return 'That email already has an account.';
    case 'auth/invalid-email': return 'That email address is not valid.';
    case 'auth/weak-password': return 'Password must be at least 6 characters.';
    default: return (error as Error)?.message || 'Failed to create user';
  }
};

interface SystemLog {
  id: string;
  created_at: string;
  level: 'info' | 'warning' | 'error';
  message: string;
  user_name: string;
  action: string;
}

const Admin: React.FC = () => {
  const { user, logout, can } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  // Modals
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [isViewUserModalOpen, setIsViewUserModalOpen] = useState(false);

  // Data
  const [users, setUsers] = useState<User[]>([]);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [backupBusy, setBackupBusy] = useState(false);

  // Gym-wide configuration (stored in the shared 'settings' collection)
  const [gymData, setGymData] = useState({
    gymName: '',
    address: '',
    openTime: '05:00',
    closeTime: '23:00',
    capacity: '200',
    website: ''
  });
  const [preferences, setPreferences] = useState({
    language: 'English (US)',
    currency: 'INR (₹)',
    dateFormat: 'DD/MM/YYYY'
  });
  const [gymSaving, setGymSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'staff' as Role | LegacyRole,
  });

  useEffect(() => {
    fetchUsers();
    fetchLogs();
    fetchGymSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const rows = await api<Record<string, unknown>[]>('/api/admin/users');
      setUsers(rows.map(r => ({ id: String(r.id), ...(r as object) }) as User));
    } catch (error) {
      console.error('Sync failure:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const rows = await api<Record<string, unknown>[]>('/api/admin/logs');
      setSystemLogs(rows.map(r => ({
        id: String(r.id),
        created_at: String(r.created_at ?? ''),
        level: (r.level as SystemLog['level']) ?? 'info',
        message: String(r.message ?? ''),
        user_name: String(r.user_name ?? ''),
        action: String(r.action ?? ''),
      })));
    } catch (error) {
      console.error('Log fetch failure:', error);
    }
  };

  const fetchGymSettings = async () => {
    if (!can('settings.gym')) return;
    try {
      const [info, prefs] = await Promise.all([
        api<Record<string, unknown>>('/api/settings/gym_info').catch(() => ({})),
        api<Record<string, unknown>>('/api/settings/app_preferences').catch(() => ({})),
      ]);
      setGymData(prev => ({ ...prev, ...(info as object) }));
      setPreferences(prev => ({ ...prev, ...(prefs as object) }));
    } catch (err) {
      console.error('Gym settings fetch failure:', err);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const provisionAppName = `admin-user-provisioner-${Date.now()}`;
    let provisionerApp = null;
    try {
      setSubmitLoading(true);
      
      // SECURITY: Validate role selection before submission
      const normalizedRole = (formData.role === 'owner' || formData.role === 'admin' || formData.role === 'manager' || formData.role === 'user') 
        ? mapLegacyRole(formData.role as LegacyRole) 
        : formData.role;
      
      const allowedRoles = assignableRoles(user?.role);
      if (!allowedRoles.includes(normalizedRole)) {
        showNotification('Not authorized to create account with this role', 'error');
        return;
      }
      
      // SECURITY: Additional check - only org_owner can create org_owner/org_admin
      if (normalizedRole === 'org_owner' && String(user?.role) !== 'org_owner') {
        showNotification('Only owner can create owner accounts', 'error');
        return;
      }
      
      if (normalizedRole === 'org_admin' && String(user?.role) !== 'org_owner') {
        showNotification('Only owner can create admin accounts', 'error');
        return;
      }
      
      // Provision a real Firebase Auth credential via a secondary app instance so the
      // signed-in admin session is never replaced. Without this, created staff could
      // only ever exist as a Firestore row and could never log in.
      provisionerApp = initializeApp(firebaseConfig, provisionAppName);
      const provisionerAuth = getAuth(provisionerApp);
      const { user: created } = await createUserWithEmailAndPassword(
        provisionerAuth,
        formData.email.trim(),
        formData.password
      );
      await signOut(provisionerAuth);

      // Profile row + org membership with the chosen role.
      await api(`/api/admin/users/${created.uid}`, {
        method: 'PUT',
        body: {
          username: formData.username,
          email: formData.email.trim(),
          email_verified: false,
          status: 'active',
        }
      });
      await api('/api/admin/memberships', {
        method: 'POST',
        body: { user_id: created.uid, role: normalizedRole }
      });

      await logAction('info', `New account created: ${formData.username} (${formData.role})`, user?.username || 'admin', 'user_create');
      setIsUserModalOpen(false);
      setFormData({ username: '', email: '', password: '', role: 'staff' });
      showNotification('Account created — they can now sign in.', 'success');
      fetchUsers();
    } catch (error: unknown) {
      showNotification(authErrorText(error), 'error');
    } finally {
      if (provisionerApp) await deleteApp(provisionerApp).catch(() => { });
      setSubmitLoading(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      setSubmitLoading(true);
      
      // SECURITY: Validate role selection before submission
      const normalizedRole = (formData.role === 'owner' || formData.role === 'admin' || formData.role === 'manager' || formData.role === 'user') 
        ? mapLegacyRole(formData.role as LegacyRole) 
        : formData.role;
      
      const allowedRoles = assignableRoles(user?.role);
      if (!allowedRoles.includes(normalizedRole)) {
        showNotification('Not authorized to assign this role', 'error');
        return;
      }
      
      // SECURITY: Prevent self-promotion to owner
      // @ts-expect-error - Temporary legacy role compatibility
      if (selectedUser.id === user?.id && (normalizedRole === 'org_owner' || normalizedRole === 'owner')) {
        showNotification('Cannot promote yourself to owner', 'error');
        return;
      }
      
      // SECURITY: Check if user is owner (supports both new and legacy roles)
      const userRoleStr = String(user?.role || '');
      const isOwner = userRoleStr === 'org_owner' || userRoleStr === 'owner';
      
      // SECURITY: Only owner can assign owner or admin role
      // Note: Client-side validation only - Firestore rules enforce actual security
      // @ts-expect-error - Temporary legacy role compatibility
      if ((normalizedRole === 'org_owner' || normalizedRole === 'owner' || normalizedRole === 'org_admin' || normalizedRole === 'admin') && !isOwner) {
        showNotification('Only owner can assign owner or admin roles', 'error');
        return;
      }
      
      await api(`/api/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        body: {
          username: formData.username,
          email: formData.email,
        }
      });
      // Role lives on the org membership, not the user row.
      const membershipId = (selectedUser as User & { membership_id?: string }).membership_id;
      if (membershipId && formData.role !== selectedUser.role) {
        await api(`/api/admin/memberships/${membershipId}/role`, {
          method: 'PATCH',
          body: { role: normalizedRole }
        });
      }

      await logAction('info', `Profile updated: ${formData.username} (${formData.role})`, user?.username || 'admin', 'user_update');
      showNotification('User updated successfully', 'success');
      setIsEditUserModalOpen(false);
      fetchUsers();
    } catch (error: unknown) {
      showNotification((error as Error).message || 'Failed to update user', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSaveGym = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!can('settings.gym')) { showNotification('Not authorized to edit gym settings', 'error'); return; }
    setGymSaving(true);
    try {
      await api('/api/settings/gym_info', { method: 'PUT', body: gymData });
      await api('/api/settings/app_preferences', { method: 'PUT', body: preferences });
      await logAction('info', 'Gym configuration updated', user?.username || 'admin', 'settings_update');
      showNotification('Gym settings saved', 'success');
    } catch (error: unknown) {
      showNotification((error as Error).message || 'Failed to save gym settings', 'error');
    } finally {
      setGymSaving(false);
    }
  };

  const getRoleStyle = (role: string) => {
    const styles: Record<string, string> = {
      'org_owner': 'bg-indigo-100 text-indigo-700 border-indigo-200',
      'owner': 'bg-indigo-100 text-indigo-700 border-indigo-200',
      'org_admin': 'bg-blue-100 text-blue-700 border-blue-200',
      'admin': 'bg-blue-100 text-blue-700 border-blue-200',
      'branch_manager': 'bg-emerald-100 text-emerald-700 border-emerald-200',
      'manager': 'bg-emerald-100 text-emerald-700 border-emerald-200',
      'staff': 'bg-amber-100 text-amber-700 border-amber-200',
      'trainer': 'bg-purple-100 text-purple-700 border-purple-200',
      'member': 'bg-slate-100 text-slate-700 border-slate-200',
      'user': 'bg-slate-100 text-slate-700 border-slate-200',
    };
    return styles[role] || styles['member'];
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await api(`/api/admin/users/${id}`, { method: 'DELETE' });
      await logAction('warning', `User deleted ID: ${id}`, user?.username || 'admin', 'user_delete');
      fetchUsers();
    } catch (error: unknown) {
      showNotification((error as Error).message || 'Failed to delete user', 'error');
    }
  };

  const logAction = async (level: string, message: string, userName: string, action: string) => {
    await logAudit(level as 'info' | 'warning' | 'error', message, userName, action);
    fetchLogs();
  };

  const handleBackup = async () => {
    if (backupBusy) return;
    setBackupBusy(true);
    try {
      const endpoints = [
        'members', 'classes', 'trainers', 'equipment',
        'membership-plans', 'payments', 'expenses', 'invoices',
        'attendance/history', 'workout-plans', 'diet-plans',
        'products', 'stock-movements', 'pt-packages', 'pt-sessions'
      ];
      const dumps = await Promise.all(endpoints.map(async (name) => {
        const rows = await api<unknown[]>(`/api/${name}`).catch(() => []);
        return [name, rows] as const;
      }));
      const users = await api<Record<string, unknown>[]>('/api/admin/users').catch(() => []);

      const snapshot = {
        exported_at: new Date().toISOString(),
        exported_by: user?.username || 'admin',
        users,
        ...Object.fromEntries(dumps),
      };

      exportToJson(`gym-backup-${new Date().toISOString().split('T')[0]}.json`, snapshot);
      showNotification('Backup exported successfully', 'success');
      await logAction('info', 'Full data backup exported', user?.username || 'admin', 'data_export');
    } catch (error: unknown) {
      showNotification((error as Error).message || 'Backup failed', 'error');
    } finally {
      setBackupBusy(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const renderDashboard = () => {
    const admins = users.filter(u => u.role === 'org_owner' || u.role === 'org_admin' || u.role === 'owner' || u.role === 'admin').length;
    const managers = users.filter(u => u.role === 'branch_manager' || u.role === 'manager').length;
    const staff = users.filter(u => u.role === 'staff' || u.role === 'trainer' || u.role === 'member' || u.role === 'user').length;
    const errorCount = systemLogs.filter(l => l.level === 'error').length;
    const warningCount = systemLogs.filter(l => l.level === 'warning').length;

    return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {[
          { label: 'Total Accounts', val: users.length, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Admins / Owners', val: admins, icon: ShieldCheck, color: 'text-rose-600', bg: 'bg-rose-50' },
          { label: 'Managers', val: managers, icon: UserIcon, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Staff & Users', val: staff, icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map((stat, i) => (
          <Card key={i} className="rounded-3xl border-0 shadow-xl shadow-slate-200/40 p-6 bg-white group hover:-translate-y-1 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className={`h-10 w-10 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center shadow-inner`}>
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">{stat.val}</h3>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 rounded-[32px] border-0 bg-white shadow-xl shadow-slate-200/40 p-6 sm:p-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Recent Administrative Actions</h3>
              <p className="text-slate-400 font-medium mt-1 text-sm leading-relaxed">Audit trail of privileged operations.</p>
            </div>
            <Button variant="outline" className="rounded-xl px-4 h-10 text-[10px]" icon={HistoryIcon} onClick={() => setActiveTab('logs')}>Audit Logs</Button>
          </div>
          <div className="space-y-4">
            {systemLogs.length === 0 ? (
              <p className="text-sm font-medium text-slate-400 py-6 text-center">No logged actions yet.</p>
            ) : systemLogs.slice(0, 6).map((log) => (
              <div key={log.id} className="flex items-center gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-50 hover:bg-white hover:shadow-lg transition-all duration-300">
                <div className={`h-2.5 w-2.5 rounded-full ${log.level === 'error' ? 'bg-rose-500 shadow-lg shadow-rose-200 animate-pulse' : log.level === 'warning' ? 'bg-amber-500' : 'bg-indigo-500'}`} />
                <div className="flex-1">
                  <p className="text-xs font-bold text-slate-900 leading-tight">{log.message}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                    {new Date(log.created_at).toLocaleTimeString()} • User: {log.user_name} • Action: {log.action}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-300" />
              </div>
            ))}
          </div>
        </Card>

        <Card className="rounded-[32px] border-0 bg-slate-900 text-white p-6 sm:p-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Database className="h-32 w-32" />
          </div>
          <div className="relative z-10">
            <h3 className="text-xl font-black mb-3 flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Admin Tools
            </h3>
            <p className="text-slate-400 font-medium mb-8 leading-relaxed text-sm">Privileged actions and system control.</p>

            <div className="grid grid-cols-1 gap-4">
              {[
                { label: 'Add New Account', icon: Plus, action: () => setIsUserModalOpen(true), color: 'bg-indigo-600 hover:bg-indigo-500' },
                ...(can('settings.gym') ? [{ label: 'Gym Configuration', icon: Building2, action: () => setActiveTab('gym'), color: 'bg-white/10 hover:bg-white/20' }] : []),
                { label: backupBusy ? 'Exporting...' : 'Backup', icon: Database, action: handleBackup, color: 'bg-white/10 hover:bg-white/20' }
              ].map((btn, i) => (
                <button key={i} onClick={btn.action} className={`w-full py-4 rounded-2xl flex items-center justify-between px-6 transition-all active:scale-95 ${btn.color}`}>
                  <div className="flex items-center gap-3">
                    <btn.icon className="h-4 w-4" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">{btn.label}</span>
                  </div>
                  <ArrowRight className="h-4 w-4 opacity-40" />
                </button>
              ))}

              <div className="mt-2 flex items-center gap-3 px-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <AlertTriangle className={`h-4 w-4 ${errorCount > 0 ? 'text-rose-400' : 'text-slate-600'}`} />
                {errorCount} errors • {warningCount} warnings in recent logs
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
    );
  };

  const renderGym = () => (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Gym Configuration</h2>
        <p className="text-slate-500 font-medium mt-1 text-sm">Gym-wide facility details and app defaults. This is system administration, not personal settings.</p>
      </div>

      <form onSubmit={handleSaveGym} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="rounded-[32px] border-0 shadow-xl shadow-slate-200/40 bg-white p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
            <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
              <Building2 className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Facility</h3>
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Gym Name</label>
            <input className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl outline-none font-bold text-sm focus:ring-4 focus:ring-indigo-50" value={gymData.gymName} onChange={e => setGymData({ ...gymData, gymName: e.target.value })} />
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Address</label>
            <input className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl outline-none font-bold text-sm focus:ring-4 focus:ring-indigo-50" value={gymData.address} onChange={e => setGymData({ ...gymData, address: e.target.value })} />
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Website</label>
            <input className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl outline-none font-bold text-sm focus:ring-4 focus:ring-indigo-50" value={gymData.website} onChange={e => setGymData({ ...gymData, website: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Opens</label>
              <input type="time" className="w-full p-3 bg-slate-50 border border-slate-100 rounded-lg outline-none font-bold text-sm" value={gymData.openTime} onChange={e => setGymData({ ...gymData, openTime: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Closes</label>
              <input type="time" className="w-full p-3 bg-slate-50 border border-slate-100 rounded-lg outline-none font-bold text-sm" value={gymData.closeTime} onChange={e => setGymData({ ...gymData, closeTime: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Member Capacity</label>
            <input type="number" className="w-full p-3 bg-slate-50 border border-slate-100 rounded-lg outline-none font-bold text-sm focus:ring-4 focus:ring-indigo-50" value={gymData.capacity} onChange={e => setGymData({ ...gymData, capacity: e.target.value })} />
          </div>
        </Card>

        <Card className="rounded-[32px] border-0 shadow-xl shadow-slate-200/40 bg-white p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
            <div className="h-10 w-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">App Defaults</h3>
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Language</label>
            <select className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl outline-none font-bold text-sm appearance-none cursor-pointer" value={preferences.language} onChange={e => setPreferences({ ...preferences, language: e.target.value })}>
              <option>English (US)</option>
              <option>English (UK)</option>
              <option>Hindi (IN)</option>
              <option>Spanish (ES)</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Currency</label>
            <select className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl outline-none font-bold text-sm appearance-none cursor-pointer" value={preferences.currency} onChange={e => setPreferences({ ...preferences, currency: e.target.value })}>
              <option>INR (₹)</option>
              <option>USD ($)</option>
              <option>EUR (€)</option>
              <option>GBP (£)</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Date Format</label>
            <select className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl outline-none font-bold text-sm appearance-none cursor-pointer" value={preferences.dateFormat} onChange={e => setPreferences({ ...preferences, dateFormat: e.target.value })}>
              <option>DD/MM/YYYY</option>
              <option>MM/DD/YYYY</option>
              <option>YYYY-MM-DD</option>
            </select>
          </div>
          <Button type="submit" variant="primary" loading={gymSaving} className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] mt-4">Save Gym Configuration</Button>
        </Card>
      </form>
    </div>
  );

  const renderUserManagement = () => (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">User List</h2>
          <p className="text-slate-500 font-medium mt-1 text-sm">Manage user roles and permissions.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
            <input
              type="text"
              placeholder="Search by name or email..."
              className="pl-12 pr-6 py-3 bg-white border border-slate-100 rounded-xl focus:ring-4 focus:ring-indigo-50 outline-none w-full sm:w-80 font-bold text-xs shadow-sm transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="primary" className="rounded-xl px-6 h-11" icon={Plus} onClick={() => setIsUserModalOpen(true)}>Add User</Button>
        </div>
      </div>

      <Card className="rounded-[32px] border-0 shadow-2xl shadow-slate-200/40 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100/50">
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Administrator</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Access Role</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-900 font-black text-lg shadow-sm border border-white">
                        {u.username[0]}
                      </div>
                      <div>
                        <p className="font-black text-slate-900 tracking-tight">{u.username}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 mt-0.5">
                          <Mail className="h-3 w-3" /> {u.email || ''}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm ${getRoleStyle((u.role || 'member') as Role | LegacyRole)}`}>
                      {u.role || 'member'}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex justify-end gap-2 translate-x-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                      <button onClick={() => { setSelectedUser(u); setIsViewUserModalOpen(true); }} className="p-2.5 bg-white text-slate-400 hover:text-indigo-600 rounded-lg shadow-sm border border-slate-100 transition-all active:scale-90">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedUser(u);
                          setFormData({ username: u.username, email: u.email || '', password: '', role: (u.role || 'member') as Role | LegacyRole });
                          setIsEditUserModalOpen(true);
                        }}
                        className="p-2.5 bg-white text-slate-400 hover:text-emerald-600 rounded-lg shadow-sm border border-slate-100 transition-all active:scale-90"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDeleteUser(u.id)} className="p-2.5 bg-white text-slate-400 hover:text-rose-600 rounded-lg shadow-sm border border-slate-100 transition-all active:scale-90">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );

  const renderLogs = () => (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Audit Logs</h2>
          <p className="text-slate-500 font-medium mt-1 text-sm">Review system events.</p>
        </div>
        <Button variant="outline" className="rounded-xl px-4 h-11" icon={ActivityIcon} onClick={fetchLogs}>Refresh</Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {systemLogs.map((log) => (
          <div key={log.id} className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/20 hover:border-indigo-100 transition-all">
            <div className="flex items-center gap-6">
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center shadow-inner ${log.level === 'error' ? 'bg-rose-50 text-rose-600' : log.level === 'warning' ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'}`}>
                <Terminal className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${log.level === 'error' ? 'bg-rose-50 text-rose-600 border-rose-100' : log.level === 'warning' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'}`}>
                    {log.level}
                  </span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(log.created_at).toLocaleString()}</span>
                </div>
                <p className="text-sm font-black text-slate-900 mt-2 tracking-tight">{log.message}</p>
              </div>
            </div>
            <div className="mt-4 md:mt-0 px-6 py-2 bg-slate-50 rounded-xl">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Operator</p>
              <p className="text-xs font-bold text-slate-900 mt-0.5">{log.user_name} • {log.action}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-6">
        <div className="h-16 w-16 bg-slate-900 rounded-[28px] flex items-center justify-center animate-bounce shadow-2xl">
          <ShieldCheck className="h-8 w-8 text-white animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 lg:p-12 relative overflow-hidden text-slate-900">
      <div className="max-w-[1400px] mx-auto relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-16">
          <div className="flex items-center gap-6">
            <div className="h-16 w-16 bg-slate-900 text-white rounded-[24px] flex items-center justify-center shadow-2xl relative group">
              <ShieldCheck className="h-8 w-8 transition-transform group-hover:scale-110" />
              <div className="absolute -top-1 -right-1 h-4 w-4 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Admin Portal</h1>
              <p className="text-slate-500 font-medium italic mt-1 italic flex items-center gap-2">
                System Control Center
              </p>
            </div>
          </div>

          <div className="flex items-center p-2 bg-white/80 backdrop-blur-xl border border-white rounded-[28px] shadow-xl shadow-slate-200/50">
            {[
              { id: 'dashboard', icon: BarChart3, label: 'Board' },
              { id: 'users', icon: Users, label: 'Users' },
              ...(can('settings.gym') ? [{ id: 'gym', icon: Building2, label: 'Gym' }] : []),
              { id: 'logs', icon: ActivityIcon, label: 'Logs' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'dashboard' | 'users' | 'gym' | 'logs')}
                className={`flex items-center gap-3 px-8 py-4 rounded-[22px] transition-all duration-300 font-black text-[10px] uppercase tracking-widest ${activeTab === tab.id ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/20' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
              >
                <tab.icon className="h-4 w-4" /> {tab.label}
              </button>
            ))}
          </div>
          <Button variant="outline" className="rounded-2xl px-6 h-14" onClick={handleLogout}>Logout</Button>
        </div>

        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'users' && renderUserManagement()}
        {activeTab === 'gym' && can('settings.gym') && renderGym()}
        {activeTab === 'logs' && renderLogs()}
      </div>

      {/* Modals */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-slate-900/40 text-slate-900">
          <Card className="w-full max-w-lg bg-white rounded-[32px] border-0 shadow-3xl p-10 relative">
            <button onClick={() => setIsUserModalOpen(false)} className="absolute top-8 right-8 p-3 hover:bg-slate-100 rounded-2xl transition-colors text-slate-900">
              <X className="h-6 w-6 text-slate-400" />
            </button>
            <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">New User</h3>
            <p className="text-slate-500 font-medium mb-10 text-sm">Create a new system account.</p>

            <form onSubmit={handleCreateUser} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Username</label>
                <div className="relative">
                  <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm focus:ring-4 focus:ring-indigo-50 transition-all text-slate-900"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm focus:ring-4 focus:ring-indigo-50 transition-all text-slate-900"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Temporary Password</label>
                <div className="relative">
                  <Shield className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="At least 6 characters"
                    className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm focus:ring-4 focus:ring-indigo-50 transition-all text-slate-900"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Role</label>
                <div className="relative">
                  <ShieldCheck className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <select
                    className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm focus:ring-4 focus:ring-indigo-50 transition-all appearance-none cursor-pointer text-slate-900"
                    value={formData.role || 'member'}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as Role | LegacyRole })}
                  >
                    {assignableRoles(user?.role).filter(r => r !== 'member').map(r => (
                      <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>
              <Button type="submit" variant="primary" className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-[10px]" loading={submitLoading}>Create User</Button>
            </form>
          </Card>
        </div>
      )}

      {/* Edit User Modal */}
      {isEditUserModalOpen && selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-slate-900/40 text-slate-900">
          <Card className="w-full max-w-lg bg-white rounded-[32px] border-0 shadow-3xl p-10 relative">
            <button onClick={() => setIsEditUserModalOpen(false)} className="absolute top-8 right-8 p-3 hover:bg-slate-100 rounded-2xl transition-colors text-slate-900">
              <X className="h-6 w-6 text-slate-400" />
            </button>
            <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Edit User</h3>
            <p className="text-slate-500 font-medium mb-10 text-sm">Update account details.</p>

            <form onSubmit={handleUpdateUser} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Username</label>
                <div className="relative">
                  <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm focus:ring-4 focus:ring-indigo-50 transition-all text-slate-900"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm focus:ring-4 focus:ring-indigo-50 transition-all text-slate-900"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Role</label>
                <div className="relative">
                  <ShieldCheck className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <select
                    className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm focus:ring-4 focus:ring-indigo-50 transition-all appearance-none cursor-pointer text-slate-900"
                    value={formData.role || 'member'}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as Role | LegacyRole })}
                  >
                    {assignableRoles(user?.role).filter(r => r !== 'member').map(r => (
                      <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>
              <Button type="submit" variant="primary" className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-[10px]" loading={submitLoading}>Update User</Button>
            </form>
          </Card>
        </div>
      )}

      {/* View User Modal */}
      {isViewUserModalOpen && selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-slate-900/40 text-slate-900">
          <Card className="w-full max-w-lg bg-white rounded-[32px] border-0 shadow-3xl p-10 relative animate-in zoom-in-95 duration-300">
            <button onClick={() => setIsViewUserModalOpen(false)} className="absolute top-8 right-8 p-3 hover:bg-slate-100 rounded-2xl transition-colors text-slate-900">
              <X className="h-6 w-6 text-slate-400" />
            </button>
            <div className="flex items-center gap-6 mb-10">
              <div className="h-20 w-20 rounded-3xl bg-slate-900 text-white flex items-center justify-center text-3xl font-black">
                {selectedUser.username[0]}
              </div>
              <div>
                <h3 className="text-3xl font-black text-slate-900 tracking-tight">{selectedUser.username}</h3>
                <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border mt-2 inline-block ${getRoleStyle((selectedUser.role || 'member') as Role | LegacyRole)}`}>
                  {selectedUser.role || 'member'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 mb-10">
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Email</p>
                <p className="font-bold text-slate-900">{selectedUser.email || 'N/A'}</p>
              </div>
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">User ID</p>
                <p className="font-bold text-slate-900">{selectedUser.id}</p>
              </div>
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Joined</p>
                <p className="font-bold text-slate-900">{new Date(selectedUser.created_at || Date.now()).toLocaleDateString()}</p>
              </div>
            </div>

            <Button variant="outline" className="w-full h-14 rounded-2xl" onClick={() => setIsViewUserModalOpen(false)}>Close</Button>
          </Card>
        </div>
      )}

      {/* Notifications */}
      {notification && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-bottom-10">
          <div className={`px-8 py-4 rounded-2xl shadow-2xl font-black text-xs uppercase tracking-widest border backdrop-blur-xl ${notification.type === 'success' ? 'bg-emerald-500/90 text-white border-emerald-400' : 'bg-rose-500/90 text-white border-rose-400'}`}>
            {notification.message}
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
