
import React, { useState, useEffect } from 'react';
import {
  Users,
  Calendar,
  Activity,
  Plus,
  ArrowRight,
  Layout,
  DollarSign,
  Box
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '../components';
import { supabase } from '../lib/supabase';

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState({
    members: { count: 0, change: '+5%' },
    classes: { count: 0, change: '+2' },
    revenue: { value: '$0', change: '+12%' },
    equipment: { value: '100%', change: '0%' }
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetchDashboardData();
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch real counts from Supabase
      const [{ count: mCount }, { count: cCount }, { data: pmts }, { data: equip }] = await Promise.all([
        supabase.from('members').select('*', { count: 'exact', head: true }),
        supabase.from('classes').select('*', { count: 'exact', head: true }),
        supabase.from('payments').select('amount'),
        supabase.from('equipment').select('status')
      ]);

      const rev = pmts?.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0;
      const operationalEquip = equip?.filter(e => e.status === 'operational').length || 0;
      const eHealth = (equip?.length || 0) > 0 ? Math.round((operationalEquip / (equip?.length || 1)) * 100) : 100;

      setStatsData({
        members: { count: mCount || 0, change: '+5.2%' },
        classes: { count: cCount || 0, change: '+2' },
        revenue: { value: `$${rev.toLocaleString()}`, change: '+12.4%' },
        equipment: { value: `${eHealth}%`, change: 'Optimal' }
      });

      const { data: recentMembers } = await supabase
        .from('members')
        .select('name, created_at, status')
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentMembers) {
        setRecentActivities(recentMembers.map((m, i) => ({
          id: i,
          action: 'New member alignment',
          member: m.name,
          time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: m.status
        })));
      }
    } catch (error) {
      console.error('Core sync failure:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const quickActions = [
    { name: 'Add Member', icon: Plus, to: '/members', color: 'from-blue-600 to-indigo-600' },
    { name: 'Classes', icon: Calendar, to: '/classes', color: 'from-emerald-500 to-teal-600' },
    { name: 'Trainers', icon: Users, to: '/trainers', color: 'from-purple-600 to-fuchsia-600' },
    { name: 'Equipment', icon: Activity, to: '/equipment', color: 'from-amber-500 to-orange-600' },
  ];

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="p-8 text-center">
          <div className="animate-spin h-12 w-12 border-4 border-slate-900 border-t-transparent rounded-full mx-auto mb-6 shadow-xl"></div>
          <p className="font-bold uppercase tracking-widest text-[10px] text-slate-400">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-bold uppercase tracking-widest text-[10px] mb-3">
            System Online
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight leading-none">{getGreeting()}</h1>
          <p className="text-slate-500 mt-4 text-lg font-medium max-w-lg">Everything is running smoothly today.</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="p-3 bg-white rounded-[24px] shadow-lg shadow-slate-100 flex items-center gap-3">
            <div className="h-10 w-10 bg-slate-900 rounded-xl flex items-center justify-center text-white">
              <Calendar className="h-5 w-5" />
            </div>
            <div className="pr-3">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Today</p>
              <p className="text-xs font-bold text-slate-900">{currentTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <Card className="rounded-2xl border-0 shadow-lg shadow-slate-200/40 p-6 bg-white group hover:-translate-y-1 transition-all duration-300">
          <div className="flex justify-between items-start mb-4">
            <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
              <Users className="h-5 w-5" />
            </div>
            <span className="text-emerald-500 font-bold text-[9px] bg-emerald-50 px-2 py-0.5 rounded-full">{statsData.members.change}</span>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Members</p>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">{statsData.members.count}</h3>
        </Card>

        <Card className="rounded-2xl border-0 shadow-lg shadow-slate-200/40 p-6 bg-white group hover:-translate-y-1 transition-all duration-300">
          <div className="flex justify-between items-start mb-4">
            <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
              <Layout className="h-5 w-5" />
            </div>
            <span className="text-emerald-500 font-bold text-[9px] bg-emerald-50 px-2 py-0.5 rounded-full">{statsData.classes.change} new</span>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Active Classes</p>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">{statsData.classes.count}</h3>
        </Card>

        <Card className="rounded-2xl border-0 shadow-lg shadow-slate-200/40 p-6 bg-white group hover:-translate-y-1 transition-all duration-300">
          <div className="flex justify-between items-start mb-4">
            <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
              <DollarSign className="h-5 w-5" />
            </div>
            <span className="text-emerald-500 font-bold text-[9px] bg-emerald-50 px-2 py-0.5 rounded-full">{statsData.revenue.change}</span>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Revenue</p>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">{statsData.revenue.value}</h3>
        </Card>

        <Card className="rounded-2xl border-0 shadow-lg shadow-slate-200/40 p-6 bg-white group hover:-translate-y-1 transition-all duration-300">
          <div className="flex justify-between items-start mb-4">
            <div className="h-10 w-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-colors duration-300">
              <Box className="h-5 w-5" />
            </div>
            <span className="text-slate-500 font-bold text-[9px] bg-slate-50 px-2 py-0.5 rounded-full">Ok</span>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Equipment</p>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">{statsData.equipment.value}</h3>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <Card className="lg:col-span-2 rounded-[32px] border-0 shadow-xl shadow-slate-200/40 bg-white overflow-hidden p-8">
          <div className="mb-6">
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Quick Tasks</h3>
            <p className="text-slate-500 text-xs font-medium mt-1">Management shortcuts.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quickActions.map((action) => (
              <Link
                key={action.name}
                to={action.to}
                className={`group relative h-24 rounded-2xl overflow-hidden shadow-md transition-all duration-300 hover:scale-[1.01] active:scale-95`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-90 group-hover:opacity-100 transition-opacity`} />
                <div className="relative z-10 h-full p-5 flex flex-col justify-between text-white">
                  <div className="h-7 w-7 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center">
                    <action.icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-black tracking-tight">{action.name}</p>
                    <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="rounded-[32px] border-0 shadow-xl shadow-slate-200/40 bg-slate-900 text-white p-8 relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-lg font-black text-white tracking-tight mb-2 flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" /> Latest Updates
            </h3>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-6 leading-relaxed">Recent account alerts</p>

            <div className="space-y-5">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="relative pl-5 group cursor-default">
                  <div className={`absolute left-0 top-1.5 h-1.5 w-1.5 rounded-full shadow-lg ${activity.status === 'Active' ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                  <div className="absolute left-[2.5px] top-4 h-full w-[0.5px] bg-white/5" />

                  <div className="space-y-0.5">
                    <div className="flex items-center justify-between">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Enrollment</p>
                      <span className="text-[8px] font-bold text-slate-600">{activity.time}</span>
                    </div>
                    <p className="text-xs font-bold text-white truncate">{activity.member}</p>
                  </div>
                </div>
              ))}
            </div>

            <Link to="/members" className="mt-8 group flex items-center justify-center p-3.5 bg-white/5 hover:bg-white/10 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all border border-white/5">
              View All <ArrowRight className="h-3 w-3 ml-2 group-hover:translate-x-2 transition-transform" />
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
