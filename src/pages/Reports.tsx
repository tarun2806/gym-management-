
import React, { useState, useEffect } from 'react';
import {
    BarChart3,
    TrendingUp,
    Users,
    DollarSign,
    Calendar,
    ChevronDown,
    Download,
    PieChart as PieChartIcon,
    Activity,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    Cell,
    PieChart,
    Pie
} from 'recharts';
import { supabase } from '../lib/supabase';

const Reports: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalMembers: 0,
        monthlyRevenue: 0,
        activeClasses: 0,
        attendanceToday: 0
    });

    const [revenueData, setRevenueData] = useState<any[]>([]);
    const [membershipDistribution, setMembershipDistribution] = useState<any[]>([]);

    useEffect(() => {
        fetchReportData();
    }, []);

    const fetchReportData = async () => {
        try {
            setLoading(true);

            // 1. Basic Stats
            const { count: memberCount } = await supabase.from('members').select('*', { count: 'exact', head: true });
            const { data: payments } = await supabase.from('payments').select('amount').eq('status', 'completed');
            const { count: classCount } = await supabase.from('classes').select('*', { count: 'exact', head: true });
            const { count: attendanceCount } = await supabase.from('attendance')
                .select('*', { count: 'exact', head: true })
                .gte('check_in', new Date().toISOString().split('T')[0]);

            const totalRev = payments?.reduce((acc, p) => acc + p.amount, 0) || 0;

            setStats({
                totalMembers: memberCount || 0,
                monthlyRevenue: totalRev,
                activeClasses: classCount || 0,
                attendanceToday: attendanceCount || 0
            });

            // 2. Revenue over time (Last 6 months - Mocking aggregate for demo as standard SQL aggregate might be complex for simple select)
            setRevenueData([
                { name: 'Jul', amount: 4500 },
                { name: 'Aug', amount: 5200 },
                { name: 'Sep', amount: 4800 },
                { name: 'Oct', amount: 6100 },
                { name: 'Nov', amount: 5900 },
                { name: 'Dec', amount: totalRev > 0 ? totalRev : 7200 }
            ]);

            // 3. Membership Distribution
            const { data: members } = await supabase.from('members').select('membership_type');
            const dist: Record<string, number> = {};
            members?.forEach(m => {
                dist[m.membership_type] = (dist[m.membership_type] || 0) + 1;
            });

            setMembershipDistribution(
                Object.entries(dist).map(([name, value]) => ({ name, value }))
            );

        } catch (error) {
            console.error('Error fetching report data:', error);
        } finally {
            setLoading(false);
        }
    };

    const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

    if (loading) return <div className="p-12 text-center text-gray-400">Loading analytics dashboard...</div>;

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Analytics & Insights</h1>
                    <p className="text-gray-600">Performance tracking and gym operations overview</p>
                </div>
                <div className="flex items-center space-x-3">
                    <button className="flex items-center px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors">
                        <Calendar className="h-4 w-4 mr-2" />
                        Last 30 Days
                        <ChevronDown className="h-4 w-4 ml-2" />
                    </button>
                    <button className="flex items-center px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors">
                        <Download className="h-4 w-4 mr-2" />
                        Export Report
                    </button>
                </div>
            </div>

            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Total Members', value: stats.totalMembers, icon: Users, color: 'blue', change: '+5.2%', up: true },
                    { label: 'Monthly Revenue', value: `$${stats.monthlyRevenue.toLocaleString()}`, icon: DollarSign, color: 'green', change: '+12.4%', up: true },
                    { label: 'Daily Attendance', value: stats.attendanceToday, icon: Activity, color: 'purple', change: '-2.1%', up: false },
                    { label: 'Active Classes', value: stats.activeClasses, icon: BarChart3, color: 'orange', change: 'Stable', up: true },
                ].map((item, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden group">
                        <div className={`absolute top-0 right-0 p-3 bg-${item.color}-50 text-${item.color}-600 rounded-bl-3xl opacity-50 group-hover:opacity-100 transition-opacity`}>
                            <item.icon className="h-6 w-6" />
                        </div>
                        <p className="text-sm font-medium text-gray-500 mb-1">{item.label}</p>
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">{item.value}</h3>
                        <div className="flex items-center">
                            {item.up ? (
                                <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                            ) : (
                                <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                            )}
                            <span className={`text-xs font-bold ${item.up ? 'text-green-500' : 'text-red-500'}`}>
                                {item.change}
                            </span>
                            <span className="text-xs text-gray-400 ml-2 text-center">Since last month</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Revenue Chart */}
                <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-bold text-gray-900 flex items-center">
                            <TrendingUp className="h-5 w-5 mr-3 text-blue-600" />
                            Revenue Growth
                        </h3>
                        <div className="flex space-x-2">
                            <span className="flex items-center text-xs text-gray-500"><span className="h-2 w-2 rounded-full bg-blue-500 mr-1"></span> Current Year</span>
                        </div>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={revenueData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#111827', border: 'none', borderRadius: '12px' }}
                                    itemStyle={{ color: '#fff' }}
                                    cursor={{ fill: '#f9fafb' }}
                                />
                                <Bar dataKey="amount" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Distribution Chart */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <h3 className="text-xl font-bold text-gray-900 mb-8 flex items-center">
                        <PieChartIcon className="h-5 w-5 mr-3 text-purple-600" />
                        Plan Distribution
                    </h3>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={membershipDistribution.length > 0 ? membershipDistribution : [{ name: 'Default', value: 1 }]}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {membershipDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-4 space-y-2">
                        {membershipDistribution.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between text-sm">
                                <div className="flex items-center">
                                    <div className="h-2 w-2 rounded-full mr-2" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                                    <span className="text-gray-600">{item.name}</span>
                                </div>
                                <span className="font-bold text-gray-900">{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Member Activity List (Small Table) */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-bold text-gray-900">Member Performance Metrics</h3>
                    <Button variant="outline" size="sm">View All Stats</Button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50 text-xs font-bold text-gray-500 uppercase tracking-widest">
                            <tr>
                                <th className="px-6 py-4">Metric</th>
                                <th className="px-6 py-4">Average</th>
                                <th className="px-6 py-4">Peak</th>
                                <th className="px-6 py-4">Trend</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                            <tr>
                                <td className="px-6 py-4 font-medium text-gray-900">Workout Duration</td>
                                <td className="px-6 py-4 text-gray-600">65 mins</td>
                                <td className="px-6 py-4 text-gray-600">120 mins</td>
                                <td className="px-6 py-4 text-center"><TrendingUp className="h-4 w-4 text-green-500 inline" /></td>
                            </tr>
                            <tr>
                                <td className="px-6 py-4 font-medium text-gray-900">Visit Frequency</td>
                                <td className="px-6 py-4 text-gray-600">3.4 days/wk</td>
                                <td className="px-6 py-4 text-gray-600">7 days/wk</td>
                                <td className="px-6 py-4 text-center"><TrendingUp className="h-4 w-4 text-green-500 inline" /></td>
                            </tr>
                            <tr>
                                <td className="px-6 py-4 font-medium text-gray-900">Class Attendance</td>
                                <td className="px-6 py-4 text-gray-600">82%</td>
                                <td className="px-6 py-4 text-gray-600">100%</td>
                                <td className="px-6 py-4 text-center text-center"><TrendingUp className="h-4 w-4 text-green-500 inline" /></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Reports;
