
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Settings,
  Shield,
  BarChart3,
  Activity,
  Database,
  FileText,
  Bell,
  Eye,
  Edit,
  Trash2,
  Plus,
  X,
  Mail,
  User as UserIcon
} from 'lucide-react';
import { Button, Card, Stats, SearchInput } from '../components';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { User } from '../types';

interface SystemLog {
  id: number;
  created_at: string;
  level: 'info' | 'warning' | 'error';
  message: string;
  user_name: string;
  action: string;
}

const Admin: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  // Modals
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isViewUserModalOpen, setIsViewUserModalOpen] = useState(false);

  // Data
  const [users, setUsers] = useState<User[]>([]);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [submitLoading, setSubmitLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    role: 'staff' as User['role'],
  });

  useEffect(() => {
    fetchUsers();
    fetchLogs();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('system_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setSystemLogs(data || []);
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      const { error } = await supabase
        .from('app_users')
        .insert([{
          username: formData.username,
          email: formData.email,
          role: formData.role,
          status: 'active',
          permissions: formData.role === 'owner' || formData.role === 'admin' ? ['all'] : ['members']
        }]);

      if (error) throw error;

      await logAction('info', `New user added: ${formData.username}`, user?.username || 'admin', 'user_add');

      setIsUserModalOpen(false);
      setFormData({ username: '', email: '', role: 'staff' });
      fetchUsers();
    } catch (error: unknown) {
      const err = error as { message: string };
      showNotification(err.message, 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setSubmitLoading(true);
    try {
      const { error } = await supabase
        .from('app_users')
        .update({
          username: formData.username,
          email: formData.email,
          role: formData.role
        })
        .eq('id', selectedUser.id);

      if (error) throw error;

      await logAction('info', `User profile updated: ${formData.username}`, user?.username || 'admin', 'user_update');
      showNotification('User updated successfully', 'success');
      setIsEditUserModalOpen(false);
      fetchUsers();
    } catch (error: unknown) {
      const err = error as { message: string };
      showNotification(err.message, 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleDeleteUser = async (id: string | number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      const { error } = await supabase.from('app_users').delete().eq('id', id);
      if (error) throw error;
      await logAction('warning', `User deleted with ID: ${id}`, user?.username || 'admin', 'user_delete');
      fetchUsers();
    } catch (error: unknown) {
      const err = error as { message: string };
      showNotification(err.message, 'error');
    }
  };

  const logAction = async (level: string, message: string, userName: string, action: string) => {
    try {
      await supabase.from('system_logs').insert([{ level, message, user_name: userName, action }]);
      fetchLogs();
    } catch (err) {
      console.error('Logging failed:', err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-amber-100 text-amber-800 border border-amber-200';
      case 'admin': return 'bg-red-100 text-red-800';
      case 'manager': return 'bg-purple-100 text-purple-800';
      case 'staff': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || u.role === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const adminStats = [
    { title: 'Total Users', value: users.length, change: '+2', changeType: 'positive' as const, icon: Users, color: 'bg-blue-500' },
    { title: 'System Logs', value: systemLogs.length, change: 'Recent', changeType: 'neutral' as const, icon: FileText, color: 'bg-green-500' },
    { title: 'Security Score', value: '98%', change: '+1%', changeType: 'positive' as const, icon: Shield, color: 'bg-purple-500' },
    { title: 'Database', value: 'Operational', change: 'Live', changeType: 'positive' as const, icon: Database, color: 'bg-orange-500' }
  ];

  const renderDashboard = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">System Overview</h2>
        <Stats items={adminStats} columns={4} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Recent System Activity</h3>
            <Button variant="outline" size="sm" onClick={() => setActiveTab('logs')}>View All Logs</Button>
          </div>
          <div className="space-y-4">
            {systemLogs.slice(0, 5).map((log) => (
              <div key={log.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-2xl">
                <div className={`mt-1 h-3 w-3 rounded-full flex-shrink-0 ${log.level === 'error' ? 'bg-red-500 animate-pulse' :
                  log.level === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                  }`} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 leading-tight">{log.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(log.created_at).toLocaleString()} • {log.user_name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Immediate Actions</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => setIsUserModalOpen(true)} className="flex flex-col items-center justify-center p-6 bg-blue-50 rounded-2xl group hover:bg-blue-600 transition-all duration-300">
              <Plus className="h-6 w-6 text-blue-600 group-hover:text-white mb-2" />
              <span className="text-sm font-bold text-blue-900 group-hover:text-white">Add User</span>
            </button>
            <button onClick={() => setIsSettingsModalOpen(true)} className="flex flex-col items-center justify-center p-6 bg-purple-50 rounded-2xl group hover:bg-purple-600 transition-all duration-300">
              <Settings className="h-6 w-6 text-purple-600 group-hover:text-white mb-2" />
              <span className="text-sm font-bold text-purple-900 group-hover:text-white">Settings</span>
            </button>
            <button className="flex flex-col items-center justify-center p-6 bg-green-50 rounded-2xl group hover:bg-green-600 transition-all duration-300">
              <Database className="h-6 w-6 text-green-600 group-hover:text-white mb-2" />
              <span className="text-sm font-bold text-green-900 group-hover:text-white">DB Backup</span>
            </button>
            <button onClick={() => setActiveTab('security')} className="flex flex-col items-center justify-center p-6 bg-red-50 rounded-2xl group hover:bg-red-600 transition-all duration-300">
              <Shield className="h-6 w-6 text-red-600 group-hover:text-white mb-2" />
              <span className="text-sm font-bold text-red-900 group-hover:text-white">Security</span>
            </button>
          </div>
        </Card>
      </div>
    </div>
  );

  const renderUserManagement = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
        <Button variant="primary" icon={Plus} onClick={() => setIsUserModalOpen(true)}>
          New Administrator
        </Button>
      </div>

      <SearchInput
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Filter by name or email..."
        filters={[
          { value: 'all', label: 'All Roles' },
          { value: 'owner', label: 'Owners' },
          { value: 'admin', label: 'Admins' },
          { value: 'manager', label: 'Managers' },
          { value: 'staff', label: 'Staff' }
        ]}
        selectedFilter={selectedFilter}
        onFilterChange={setSelectedFilter}
      />

      <Card className="overflow-hidden border-0 shadow-xl">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">User</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Role</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Last Login</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">Loading user database...</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">No users match your criteria.</td></tr>
              ) : filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 bg-slate-100 text-slate-500 rounded-2xl flex items-center justify-center mr-3 font-bold">
                        {u.username[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-900">{u.username}</div>
                        <div className="text-xs text-gray-500">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg ${getRoleColor(u.role)}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(u.status || 'inactive')}`}>
                      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current"></span>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Active Session'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <button onClick={() => { setSelectedUser(u); setIsViewUserModalOpen(true) }} className="p-2 text-gray-400 hover:text-blue-600 bg-gray-50 rounded-xl transition-all">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button onClick={() => { setSelectedUser(u); setFormData({ username: u.username, email: u.email || '', role: u.role }); setIsEditUserModalOpen(true) }} className="p-2 text-gray-400 hover:text-green-600 bg-gray-50 rounded-xl transition-all">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDeleteUser(u.id)} className="p-2 text-gray-400 hover:text-red-600 bg-gray-50 rounded-xl transition-all">
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

      {notification && (
        <div className={`fixed bottom-8 right-8 px-6 py-4 rounded-2xl shadow-2xl z-[60] flex items-center space-x-3 animate-in slide-in-from-right-8 duration-300 ${notification.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
          }`}>
          <Shield className="h-5 w-5" />
          <span className="font-bold text-sm">{notification.message}</span>
        </div>
      )}
    </div>
  );

  const renderSystemLogs = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Security Audit Logs</h2>
        <Button variant="outline" size="sm" icon={FileText}>Export CSV</Button>
      </div>

      <Card className="p-4 bg-slate-900 border-0 shadow-2xl">
        <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
          {systemLogs.map((log) => (
            <div key={log.id} className="flex items-center space-x-4 p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors">
              <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-lg shrink-0 ${log.level === 'error' ? 'bg-red-500 text-white' :
                log.level === 'warning' ? 'bg-yellow-500 text-black' : 'bg-blue-500 text-white'
                }`}>
                {log.level}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-100 font-medium truncate">{log.message}</p>
                <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest font-bold">
                  {new Date(log.created_at).toLocaleString()} | ADMIN: {log.user_name} | OP: {log.action}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6 animate-in zoom-in-95 duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">System Preferences</h2>
        <Button variant="primary" onClick={() => setIsSettingsModalOpen(true)}>Save All Changes</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="p-8">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
            <Settings className="h-5 w-5 mr-3 text-blue-600" />
            Core Configuration
          </h3>
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Organization Name</label>
              <input readOnly value="GymPro Management System" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Support Contact</label>
              <input readOnly value="support@gympro.com" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold outline-none" />
            </div>
          </div>
        </Card>

        <Card className="p-8">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
            <Shield className="h-5 w-5 mr-3 text-red-600" />
            Access Control
          </h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-2xl">
              <div>
                <h4 className="text-sm font-bold text-green-900 font-bold">2-Factor Authentication</h4>
                <p className="text-xs text-green-700">Enforced for all admin roles</p>
              </div>
              <div className="h-6 w-12 bg-green-500 rounded-full relative shadow-inner">
                <div className="absolute right-1 top-1 h-4 w-4 bg-white rounded-full"></div>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-100 rounded-2xl opacity-50">
              <div>
                <h4 className="text-sm font-bold text-slate-700">IP Whitelisting</h4>
                <p className="text-xs text-slate-500">Feature not available in Free tier</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );

  const renderSecurity = () => (
    <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
      <h2 className="text-2xl font-bold text-gray-900">Global Security Shield</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
        <Card className="p-10 border-t-4 border-green-500">
          <Shield className="h-16 w-16 text-green-600 mx-auto mb-6" />
          <h3 className="text-lg font-bold text-gray-900">Infrastructure</h3>
          <p className="text-3xl font-extrabold text-green-600 mt-2">OPTIMAL</p>
          <p className="text-xs text-gray-500 mt-4 font-bold uppercase tracking-widest">Database protected by RLS</p>
        </Card>

        <Card className="p-10 border-t-4 border-blue-500">
          <Activity className="h-16 w-16 text-blue-600 mx-auto mb-6" />
          <h3 className="text-lg font-bold text-gray-900">Traffic Monitoring</h3>
          <p className="text-3xl font-extrabold text-blue-600 mt-2">12 ACTIVE</p>
          <p className="text-xs text-gray-500 mt-4 font-bold uppercase tracking-widest">Zero suspicious packets</p>
        </Card>

        <Card className="p-10 border-t-4 border-amber-500">
          <Bell className="h-16 w-16 text-amber-600 mx-auto mb-6" />
          <h3 className="text-lg font-bold text-gray-900">System Alerts</h3>
          <p className="text-3xl font-extrabold text-amber-600 mt-2">2 REVIEW</p>
          <p className="text-xs text-gray-500 mt-4 font-bold uppercase tracking-widest">Minor config warnings</p>
        </Card>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return renderDashboard();
      case 'users': return renderUserManagement();
      case 'logs': return renderSystemLogs();
      case 'settings': return renderSettings();
      case 'security': return renderSecurity();
      default: return renderDashboard();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Premium Header */}
      <div className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-2xl">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-gray-900 tracking-tight leading-none">Command Center</h1>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Admin OS v2.4.0</p>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-gray-900">tarunshiva28</p>
              <p className="text-[10px] text-green-500 font-bold uppercase tracking-widest">Super Admin</p>
            </div>
            <button onClick={handleLogout} className="px-6 py-2.5 bg-gray-100 hover:bg-red-50 text-gray-700 hover:text-red-600 rounded-xl text-xs font-bold transition-all">Logout Session</button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Navigation Tabs */}
        <div className="flex space-x-2 bg-white/50 p-2 rounded-2xl border border-gray-100 mb-10 w-fit">
          {[
            { id: 'dashboard', label: 'Overview', icon: BarChart3 },
            { id: 'users', label: 'User Hub', icon: Users },
            { id: 'logs', label: 'Audit Logs', icon: FileText },
            { id: 'settings', label: 'Config', icon: Settings },
            { id: 'security', label: 'Firewall', icon: Shield }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-6 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id
                ? 'bg-slate-900 text-white shadow-xl shadow-slate-200'
                : 'text-gray-500 hover:bg-white hover:text-gray-900'
                }`}
            >
              <tab.icon className="h-4 w-4 mr-3" />
              {tab.label}
            </button>
          ))}
        </div>

        {renderContent()}
      </div>

      {/* Add User Modal */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl relative">
            <button onClick={() => setIsUserModalOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button>
            <div className="text-center mb-8">
              <div className="h-16 w-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <UserIcon className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">New Administrator</h3>
              <p className="text-sm text-gray-500 mt-1">Assign roles and dashboard access</p>
            </div>

            <form onSubmit={handleAddUser} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Login Username</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input required placeholder="eg. manager_john" className="w-full pl-10 p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Corporate Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input required type="email" placeholder="john@gympro.com" className="w-full pl-10 p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">System Role</label>
                <select className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold outline-none" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value as User['role'] })}>
                  <option value="owner">System Owner</option>
                  <option value="admin">Administrator</option>
                  <option value="manager">Manager</option>
                  <option value="staff">Staff Member</option>
                </select>
              </div>
              <div className="pt-4 grid grid-cols-2 gap-4">
                <Button type="button" variant="outline" className="rounded-2xl py-4" onClick={() => setIsUserModalOpen(false)}>Abort</Button>
                <Button type="submit" variant="primary" className="rounded-2xl py-4 shadow-xl shadow-blue-200" loading={submitLoading}>Provision User</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {isEditUserModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl relative">
            <button onClick={() => setIsEditUserModalOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button>
            <div className="text-center mb-8">
              <div className="h-16 w-16 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Edit className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Modify Account</h3>
              <p className="text-sm text-gray-500 mt-1">Update administrative privileges</p>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Username</label>
                <input required className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Email</label>
                <input required type="email" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Role</label>
                <select className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold outline-none" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value as User['role'] })}>
                  <option value="owner">Owner</option>
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="staff">Staff</option>
                </select>
              </div>
              <div className="pt-4 grid grid-cols-2 gap-4">
                <Button type="button" variant="outline" className="rounded-2xl py-4" onClick={() => setIsEditUserModalOpen(false)}>Cancel</Button>
                <Button type="submit" variant="primary" className="rounded-2xl py-4 shadow-xl shadow-green-200" loading={submitLoading}>Save Profile</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View User Modal */}
      {isViewUserModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="max-w-md w-full p-10 relative bg-white border-0 shadow-2xl rounded-[40px]">
            <button onClick={() => setIsViewUserModalOpen(false)} className="absolute top-8 right-8 text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button>
            <div className="text-center">
              <div className="h-24 w-24 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-[32px] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-blue-500/20">
                <UserIcon className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-extrabold text-gray-900">{selectedUser.username}</h3>
              <p className="text-sm font-bold text-gray-400 mt-1 uppercase tracking-widest">{selectedUser.role} Account</p>

              <div className="mt-10 grid grid-cols-1 gap-4 text-left">
                <div className="p-4 bg-gray-50 rounded-2xl">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email Address</p>
                  <p className="text-sm font-bold text-gray-900 mt-1">{selectedUser.email}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Account Status</p>
                  <p className="text-sm font-bold text-green-600 mt-1 capitalize">{selectedUser.status}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Permissions</p>
                  <p className="text-sm font-bold text-gray-900 mt-1">{selectedUser.permissions.join(', ') || 'No special permissions'}</p>
                </div>
              </div>

              <Button variant="outline" className="w-full mt-10 rounded-2xl py-4 text-gray-400" onClick={() => setIsViewUserModalOpen(false)}>Close Profile</Button>
            </div>
          </Card>
        </div>
      )}
      {/* Settings Modal */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl relative">
            <button onClick={() => setIsSettingsModalOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button>
            <div className="text-center mb-8">
              <div className="h-16 w-16 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Settings className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">System Config</h3>
              <p className="text-sm text-gray-500 mt-1">Update global system parameters</p>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-gray-600 bg-gray-50 p-4 rounded-xl border border-dashed border-gray-200">
                System settings are currently managed via the database configuration. Any changes here will be applied across the entire GymPro network.
              </p>
              <div className="pt-4 grid grid-cols-1 gap-4">
                <Button variant="primary" className="rounded-2xl py-4 shadow-xl shadow-purple-200" onClick={() => {
                  showNotification('Global settings updated', 'success');
                  setIsSettingsModalOpen(false);
                }}>Synchronize Config</Button>
                <Button variant="outline" className="rounded-2xl py-4" onClick={() => setIsSettingsModalOpen(false)}>Close</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
