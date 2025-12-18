import { useState } from 'react';
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
  Plus
} from 'lucide-react';
import { Button, Card, Stats, SearchInput, Modal, Form, FormField } from '../components';
import { useAuth } from '../contexts/AuthContext';

interface User {
  id: number;
  username: string;
  email: string;
  role: 'owner' | 'admin' | 'manager' | 'staff' | 'user';
  status: 'active' | 'inactive' | 'suspended';
  lastLogin: string;
  permissions: string[];
}

interface SystemLog {
  id: number;
  timestamp: string;
  level: 'info' | 'warning' | 'error';
  message: string;
  user: string;
  action: string;
}

const Admin: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  const [users, setUsers] = useState<User[]>([
    {
      id: 0,
      username: 'owner',
      email: 'owner@gympro.com',
      role: 'owner',
      status: 'active',
      lastLogin: '2024-12-19T11:00:00',
      permissions: ['all']
    },
    {
      id: 1,
      username: 'admin',
      email: 'admin@gympro.com',
      role: 'admin',
      status: 'active',
      lastLogin: '2024-12-19T10:30:00',
      permissions: ['all']
    },
    {
      id: 2,
      username: 'manager1',
      email: 'manager1@gympro.com',
      role: 'manager',
      status: 'active',
      lastLogin: '2024-12-19T09:15:00',
      permissions: ['members', 'classes', 'trainers', 'equipment']
    },
    {
      id: 3,
      username: 'staff1',
      email: 'staff1@gympro.com',
      role: 'staff',
      status: 'active',
      lastLogin: '2024-12-19T08:45:00',
      permissions: ['members', 'classes']
    }
  ]);

  const [systemLogs] = useState<SystemLog[]>([
    {
      id: 1,
      timestamp: '2024-12-19T10:30:00',
      level: 'info',
      message: 'User admin logged in successfully',
      user: 'admin',
      action: 'login'
    },
    {
      id: 2,
      timestamp: '2024-12-19T10:25:00',
      level: 'info',
      message: 'New member added: John Doe',
      user: 'manager1',
      action: 'member_add'
    },
    {
      id: 3,
      timestamp: '2024-12-19T10:20:00',
      level: 'warning',
      message: 'Equipment maintenance due: Treadmill #2',
      user: 'system',
      action: 'maintenance_alert'
    }
  ]);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    role: 'staff',
    permissions: [] as string[]
  });

  const adminStats = [
    {
      title: 'Total Users',
      value: users.length,
      change: '+2',
      changeType: 'positive' as const,
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      title: 'Active Sessions',
      value: '12',
      change: '+3',
      changeType: 'positive' as const,
      icon: Activity,
      color: 'bg-green-500'
    },
    {
      title: 'System Health',
      value: '98%',
      change: '+1%',
      changeType: 'positive' as const,
      icon: BarChart3,
      color: 'bg-purple-500'
    },
    {
      title: 'Storage Used',
      value: '2.4 GB',
      change: '+0.2 GB',
      changeType: 'neutral' as const,
      icon: Database,
      color: 'bg-orange-500'
    }
  ];

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'logs', label: 'System Logs', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'security', label: 'Security', icon: Shield }
  ];

  const roles = [
    { value: 'owner', label: 'Owner' },
    { value: 'admin', label: 'Administrator' },
    { value: 'manager', label: 'Manager' },
    { value: 'staff', label: 'Staff' },
    { value: 'user', label: 'User' }
  ];

  // Permissions array for future use
  // const permissions = [
  //   { value: 'members', label: 'Manage Members' },
  //   { value: 'classes', label: 'Manage Classes' },
  //   { value: 'trainers', label: 'Manage Trainers' },
  //   { value: 'equipment', label: 'Manage Equipment' },
  //   { value: 'reports', label: 'View Reports' },
  //   { value: 'settings', label: 'System Settings' }
  // ];

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    const newUser: User = {
      id: users.length + 1,
      username: formData.username,
      email: formData.email,
      role: formData.role as User['role'],
      status: 'active',
      lastLogin: new Date().toISOString(),
      permissions: formData.permissions
    };
    setUsers(prev => [...prev, newUser]);
    setIsUserModalOpen(false);
    setFormData({
      username: '',
      email: '',
      role: 'staff',
      permissions: []
    });
  };

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
      case 'user': return 'bg-gray-100 text-gray-800';
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

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'info': return 'bg-blue-100 text-blue-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">System Overview</h2>
        <Stats items={adminStats} columns={4} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
            <Button variant="outline" size="sm">View All</Button>
          </div>
          <div className="space-y-3">
            {systemLogs.slice(0, 5).map((log) => (
              <div key={log.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className={`w-2 h-2 rounded-full ${log.level === 'error' ? 'bg-red-500' :
                  log.level === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                  }`} />
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{log.message}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(log.timestamp).toLocaleString()} by {log.user}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" size="sm" icon={Plus}>
              Add User
            </Button>
            <Button variant="outline" size="sm" icon={Settings}>
              Settings
            </Button>
            <Button variant="outline" size="sm" icon={Database}>
              Backup
            </Button>
            <Button variant="outline" size="sm" icon={Shield}>
              Security
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );

  const renderUserManagement = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
        <Button variant="primary" icon={Plus} onClick={() => setIsUserModalOpen(true)}>
          Add User
        </Button>
      </div>

      <SearchInput
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Search users by username or email..."
        filters={[
          { value: 'all', label: 'All Roles' },
          { value: 'owner', label: 'Owners' },
          { value: 'admin', label: 'Administrators' },
          { value: 'manager', label: 'Managers' },
          { value: 'staff', label: 'Staff' },
          { value: 'user', label: 'Users' }
        ]}
        selectedFilter={selectedFilter}
        onFilterChange={setSelectedFilter}
      />

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{user.username}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.status)}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(user.lastLogin).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button className="text-blue-600 hover:text-blue-900 p-1">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="text-green-600 hover:text-green-900 p-1">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-900 p-1">
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

  const renderSystemLogs = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">System Logs</h2>
        <Button variant="outline" size="sm">Export Logs</Button>
      </div>

      <Card>
        <div className="space-y-3">
          {systemLogs.map((log) => (
            <div key={log.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getLogLevelColor(log.level)}`}>
                {log.level.toUpperCase()}
              </span>
              <div className="flex-1">
                <p className="text-sm text-gray-900">{log.message}</p>
                <p className="text-xs text-gray-500">
                  {new Date(log.timestamp).toLocaleString()} | User: {log.user} | Action: {log.action}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">System Settings</h2>
        <Button variant="primary" onClick={() => setIsSettingsModalOpen(true)}>
          Edit Settings
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-medium text-gray-900 mb-4">General Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Website Name</label>
              <p className="text-sm text-gray-600">GymPro Management System</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Contact Email</label>
              <p className="text-sm text-gray-600">admin@gympro.com</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Timezone</label>
              <p className="text-sm text-gray-600">UTC-5 (Eastern Time)</p>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Security Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Session Timeout</label>
              <p className="text-sm text-gray-600">30 minutes</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password Policy</label>
              <p className="text-sm text-gray-600">Minimum 8 characters, mixed case</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Two-Factor Auth</label>
              <p className="text-sm text-gray-600">Enabled for admins</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );

  const renderSecurity = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Security Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="text-center">
            <Shield className="h-12 w-12 text-green-600 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900">System Status</h3>
            <p className="text-2xl font-bold text-green-600">Secure</p>
            <p className="text-sm text-gray-600">All systems operational</p>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <Activity className="h-12 w-12 text-blue-600 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900">Active Sessions</h3>
            <p className="text-2xl font-bold text-blue-600">12</p>
            <p className="text-sm text-gray-600">Current users online</p>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <Bell className="h-12 w-12 text-yellow-600 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900">Alerts</h3>
            <p className="text-2xl font-bold text-yellow-600">2</p>
            <p className="text-sm text-gray-600">Requires attention</p>
          </div>
        </Card>
      </div>

      <Card>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Security Events</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">Failed login attempt</p>
                <p className="text-xs text-gray-600">IP: 192.168.1.100 | User: unknown</p>
              </div>
            </div>
            <span className="text-xs text-gray-500">2 minutes ago</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">Permission change</p>
                <p className="text-xs text-gray-600">User: manager1 | Role: staff → manager</p>
              </div>
            </div>
            <span className="text-xs text-gray-500">1 hour ago</span>
          </div>
        </div>
      </Card>
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">Admin Panel</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user?.username}</span>
              <Button variant="outline" size="sm" onClick={handleLogout}>Logout</Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <tab.icon className="h-4 w-4 inline mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        {renderContent()}
      </div>

      {/* Add User Modal */}
      <Modal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        title="Add New User"
        size="md"
      >
        <Form onSubmit={handleAddUser}>
          <FormField
            label="Username"
            name="username"
            value={formData.username}
            onChange={(value) => handleInputChange('username', value as string)}
            placeholder="Enter username"
            required
          />
          <FormField
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={(value) => handleInputChange('email', value as string)}
            placeholder="Enter email"
            required
          />
          <FormField
            label="Role"
            name="role"
            type="select"
            value={formData.role}
            onChange={(value) => handleInputChange('role', value as string)}
            options={roles}
            required
          />
          <div className="mt-6 flex justify-end space-x-3">
            <Button variant="outline" onClick={() => setIsUserModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Add User
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Settings Modal */}
      <Modal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        title="Edit System Settings"
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-gray-600">Settings configuration form would go here...</p>
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => setIsSettingsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary">
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Admin;
