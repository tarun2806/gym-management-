import { Users, Calendar, TrendingUp, Activity, Plus, ArrowRight } from 'lucide-react';
import { Stats } from '../components';

const Dashboard: React.FC = () => {
  const stats = [
    {
      title: 'Total Members',
      value: '1,247',
      change: '+12%',
      changeType: 'positive' as const,
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      title: 'Active Classes',
      value: '24',
      change: '+3',
      changeType: 'positive' as const,
      icon: Calendar,
      color: 'bg-green-500',
    },
    {
      title: 'Revenue',
      value: '$45,230',
      change: '+8.2%',
      changeType: 'positive' as const,
      icon: TrendingUp,
      color: 'bg-purple-500',
    },
    {
      title: 'Equipment Status',
      value: '98%',
      change: '+2%',
      changeType: 'positive' as const,
      icon: Activity,
      color: 'bg-orange-500',
    },
  ];

  const recentActivities = [
    { id: 1, action: 'New member registration', member: 'Sarah Johnson', time: '2 minutes ago', type: 'member' },
    { id: 2, action: 'Class completed', member: 'Yoga Flow', time: '15 minutes ago', type: 'class' },
    { id: 3, action: 'Equipment maintenance', member: 'Treadmill #3', time: '1 hour ago', type: 'equipment' },
    { id: 4, action: 'Trainer assigned', member: 'Mike Chen', time: '2 hours ago', type: 'trainer' },
    { id: 5, action: 'Payment received', member: 'John Smith', time: '3 hours ago', type: 'payment' },
  ];

  const quickActions = [
    { name: 'Add Member', icon: Plus, href: '/members', color: 'bg-blue-600 hover:bg-blue-700' },
    { name: 'Schedule Class', icon: Calendar, href: '/classes', color: 'bg-green-600 hover:bg-green-700' },
    { name: 'Assign Trainer', icon: Users, href: '/trainers', color: 'bg-purple-600 hover:bg-purple-700' },
    { name: 'Check Equipment', icon: Activity, href: '/equipment', color: 'bg-orange-600 hover:bg-orange-700' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's what's happening with your gym today.</p>
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
          description: 'from last month'
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
                <a
                  key={action.name}
                  href={action.href}
                  className={`${action.color} text-white rounded-lg p-4 text-center transition-colors duration-200`}
                >
                  <action.icon className="h-8 w-8 mx-auto mb-2" />
                  <p className="font-medium">{action.name}</p>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Activities</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    activity.type === 'member' ? 'bg-blue-500' :
                    activity.type === 'class' ? 'bg-green-500' :
                    activity.type === 'equipment' ? 'bg-orange-500' :
                    activity.type === 'trainer' ? 'bg-purple-500' : 'bg-gray-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                    <p className="text-sm text-gray-600">{activity.member}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <a href="#" className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center">
                View all activities
                <ArrowRight className="ml-1 h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Classes */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Upcoming Classes</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">Yoga Flow</h4>
                <span className="text-sm text-green-600 bg-green-100 px-2 py-1 rounded-full">Today</span>
              </div>
              <p className="text-sm text-gray-600">Sarah Wilson</p>
              <p className="text-sm text-gray-500">9:00 AM - 10:00 AM</p>
              <p className="text-sm text-gray-500">12/20 participants</p>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">HIIT Training</h4>
                <span className="text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded-full">Tomorrow</span>
              </div>
              <p className="text-sm text-gray-600">Mike Chen</p>
              <p className="text-sm text-gray-500">6:00 AM - 7:00 AM</p>
              <p className="text-sm text-gray-500">8/15 participants</p>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">Strength Training</h4>
                <span className="text-sm text-purple-600 bg-purple-100 px-2 py-1 rounded-full">Tomorrow</span>
              </div>
              <p className="text-sm text-gray-600">David Rodriguez</p>
              <p className="text-sm text-gray-500">5:30 PM - 6:30 PM</p>
              <p className="text-sm text-gray-500">10/20 participants</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
