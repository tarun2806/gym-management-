import { useState, useEffect } from 'react';
import { Users, Calendar, TrendingUp, Activity, Plus, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Stats } from '../components';
import { supabase } from '../lib/supabase';

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState({
    members: { count: 0, change: '+0%' },
    classes: { count: 0, change: '+0' },
    revenue: { value: '$0', change: '+0%' },
    equipment: { value: '100%', change: '+0%' }
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // 1. Fetch Members Count
      const { count: membersCount } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true });

      // 2. Fetch Classes Count
      const { count: classesCount } = await supabase
        .from('classes')
        .select('*', { count: 'exact', head: true });

      // 3. Fetch Revenue (Simulated sum from payments)
      const { data: payments } = await supabase
        .from('payments')
        .select('amount');

      const totalRevenue = payments?.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0;

      // 4. Equipment Status
      const { data: equipment } = await supabase
        .from('equipment')
        .select('status');

      const totalEquip = equipment?.length || 0;
      const operationalEquip = equipment?.filter(e => e.status === 'operational').length || 0;
      const equipmentHealth = totalEquip > 0 ? Math.round((operationalEquip / totalEquip) * 100) : 100;

      setStatsData({
        members: { count: membersCount || 0, change: '+5%' }, // Simulated change for now
        classes: { count: classesCount || 0, change: '+2' },
        revenue: { value: `$${totalRevenue.toLocaleString()}`, change: '+10%' },
        equipment: { value: `${equipmentHealth}%`, change: '0%' }
      });

      // Fetch recent activities (simulated from multiple tables)
      // For now, we'll just show the latest members joined
      const { data: recentMembers } = await supabase
        .from('members')
        .select('name, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentMembers) {
        const activities = recentMembers.map((m, i) => ({
          id: i,
          action: 'New member joined',
          member: m.name,
          time: new Date(m.created_at).toLocaleDateString(),
          type: 'member'
        }));
        setRecentActivities(activities);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    {
      title: 'Total Members',
      value: String(statsData.members.count),
      change: statsData.members.change,
      changeType: 'positive' as const,
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      title: 'Active Classes',
      value: String(statsData.classes.count),
      change: statsData.classes.change,
      changeType: 'positive' as const,
      icon: Calendar,
      color: 'bg-green-500',
    },
    {
      title: 'Revenue',
      value: statsData.revenue.value,
      change: statsData.revenue.change,
      changeType: 'positive' as const,
      icon: TrendingUp,
      color: 'bg-purple-500',
    },
    {
      title: 'Equipment Status',
      value: statsData.equipment.value,
      change: statsData.equipment.change,
      changeType: 'positive' as const,
      icon: Activity,
      color: 'bg-orange-500',
    },
  ];

  const quickActions = [
    { name: 'Add Member', icon: Plus, to: '/members', color: 'bg-blue-600 hover:bg-blue-700' },
    { name: 'Schedule Class', icon: Calendar, to: '/classes', color: 'bg-green-600 hover:bg-green-700' },
    { name: 'Assign Trainer', icon: Users, to: '/trainers', color: 'bg-purple-600 hover:bg-purple-700' },
    { name: 'Check Equipment', icon: Activity, to: '/equipment', color: 'bg-orange-600 hover:bg-orange-700' },
  ];

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Real-time overview of your gym.</p>
        </div>
        <div className="text-sm text-gray-500">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </div>
      </div>

      {/* Stats Grid */}
      <Stats
        items={stats.map(stat => ({
          title: stat.title,
          value: stat.value,
          change: stat.change,
          changeType: stat.changeType,
          icon: stat.icon,
          color: stat.color,
          description: 'current status'
        }))}
        columns={4}
      />

      {/* Quick Actions and Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4">
              {quickActions.map((action) => (
                <Link
                  key={action.name}
                  to={action.to}
                  className={`${action.color} text-white rounded-lg p-4 text-center transition-colors duration-200 block`}
                >
                  <action.icon className="h-8 w-8 mx-auto mb-2" />
                  <p className="font-medium">{action.name}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Member Activity</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className={`w-2 h-2 rounded-full mt-2 bg-blue-500`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                      <p className="text-sm text-gray-600">{activity.member}</p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No recent activity found.</p>
              )}
            </div>
            <div className="mt-6">
              <Link to="/members" className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center">
                View all members
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
