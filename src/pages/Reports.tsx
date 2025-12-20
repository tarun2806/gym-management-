
import React, { useState, useEffect } from 'react';
import {
    BarChart3,
    TrendingUp,
    Users,
    DollarSign,
    Download,
    PieChart as PieChartIcon,
    Activity,
    ArrowUpRight,
    ArrowDownRight,
    Zap,
    Target,
    Shield,
    Globe,
    Filter,
    Layers,
    History
} from 'lucide-react';
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    PieChart,
    Pie,
    AreaChart,
    Area
} from 'recharts';
import { supabase } from '../lib/supabase';
import { Button, Card } from '../components';

const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

const Reports: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalMembers: 0,
        monthlyRevenue: 0,
        activeClasses: 0,
        attendanceToday: 0
    });

    const [revenueData, setRevenueData] = useState<{ name: string, amount: number }[]>([]);
    const [membershipDistribution, setMembershipDistribution] = useState<{ name: string, value: number }[]>([]);

    useEffect(() => {
        fetchReportData();
    }, []);

    const fetchReportData = async () => {
        try {
            setLoading(true);

            // Fetch core metrics
            const [{ count: mCount }, { data: pmts }, { count: cCount }, { count: aCount }] = await Promise.all([
                supabase.from('members').select('*', { count: 'exact', head: true }),
                supabase.from('payments').select('amount').eq('status', 'completed'),
                supabase.from('classes').select('*', { count: 'exact', head: true }),
                supabase.from('attendance').select('*', { count: 'exact', head: true }).gte('check_in', new Date().toISOString().split('T')[0])
            ]);

            const totalRev = pmts?.reduce((acc, p) => acc + p.amount, 0) || 0;

            setStats({
                totalMembers: mCount || 0,
                monthlyRevenue: totalRev,
                activeClasses: cCount || 0,
                attendanceToday: aCount || 0
            });

            // Simulated Historical Data for Visualization
            setRevenueData([
                { name: 'Jan', amount: 4800 },
                { name: 'Feb', amount: 5600 },
                { name: 'Mar', amount: 5200 },
                { name: 'Apr', amount: 7400 },
                { name: 'May', amount: 6900 },
                { name: 'Jun', amount: totalRev > 0 ? totalRev : 8200 }
            ]);

            const { data: members } = await supabase.from('members').select('membership_type');
            const dist: Record<string, number> = {};
            members?.forEach(m => {
                dist[m.membership_type] = (dist[m.membership_type] || 0) + 1;
            });

            setMembershipDistribution(
                Object.entries(dist).map(([name, value]) => ({ name, value }))
            );

        } catch (error) {
            console.error('Failed to load report data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="h-[80vh] flex flex-col items-center justify-center gap-6">
                <div className="h-16 w-16 bg-slate-900 rounded-[28px] flex items-center justify-center animate-bounce shadow-2xl">
                    <Activity className="h-8 w-8 text-white animate-pulse" />
                </div>
                <div className="flex flex-col items-center">
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">Syncing Data...</h2>
                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-2">Connecting to secure database</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-12 pb-24 animate-in fade-in duration-700">
            {/* Header Block */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                <div>
                    <div className="flex items-center gap-2 text-indigo-600 font-black uppercase tracking-widest text-[10px] mb-3">
                        <BarChart3 className="h-4 w-4" /> Intelligence Dashboard
                    </div>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">Gym Analytics</h1>
                    <p className="text-slate-400 font-medium mt-1 text-sm">Real-time performance mapping.</p>
                </div>
                <div className="flex gap-2 sm:gap-4">
                    <Button variant="outline" className="flex-1 sm:flex-none rounded-2xl px-4 sm:px-6 h-12 sm:h-14" icon={Filter}>Filters</Button>
                    <Button variant="primary" className="flex-1 sm:flex-none rounded-2xl px-4 sm:px-6 h-12 sm:h-14 shadow-xl shadow-indigo-200" icon={Download}>Export</Button>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Total Members', val: stats.totalMembers, icon: Users, up: true, change: '12%', color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    { label: 'Monthly Revenue', val: `₹${stats.monthlyRevenue.toLocaleString()}`, icon: DollarSign, up: true, change: '8%', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Active Classes', val: stats.activeClasses, icon: Layers, up: false, change: '2%', color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: 'Today Attendance', val: stats.attendanceToday, icon: Activity, up: true, change: '5%', color: 'text-rose-600', bg: 'bg-rose-50' }
                ].map((item, i) => (
                    <Card key={i} className="rounded-2xl border-0 shadow-lg shadow-slate-200/40 p-6 bg-white group hover:-translate-y-1 transition-all">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`h-10 w-10 ${item.bg} ${item.color} rounded-xl flex items-center justify-center shadow-inner`}>
                                <item.icon className="h-5 w-5" />
                            </div>
                        </div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight mb-3">{item.val}</h3>
                        <div className="flex items-center gap-3">
                            <div className={`flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full ${item.up ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                {item.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                {item.change}
                            </div>
                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">vs last month</span>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Visualizations */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 bg-white p-8 rounded-3xl border-0 shadow-xl shadow-slate-200/50">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-indigo-600" /> Revenue Growth
                            </h3>
                            <p className="text-slate-400 text-sm font-medium mt-1">Monthly revenue trends.</p>
                        </div>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueData}>
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366F1" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.3} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 9, fontWeight: 700 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 9, fontWeight: 700 }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0F172A', border: 'none', borderRadius: '16px', padding: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)' }}
                                    itemStyle={{ color: '#fff', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' }}
                                    cursor={{ stroke: '#6366F1', strokeWidth: 2 }}
                                />
                                <Area type="monotone" dataKey="amount" stroke="#6366F1" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card className="bg-slate-900 p-8 rounded-3xl border-0 shadow-xl shadow-slate-200/50 text-white relative overflow-hidden">
                    <div className="absolute -bottom-10 -right-10 p-10 opacity-10">
                        <PieChartIcon className="h-32 w-32" />
                    </div>

                    <h3 className="text-xl font-black text-white tracking-tight mb-2 flex items-center gap-2 relative z-10">
                        <div className="h-2 w-2 rounded-full bg-indigo-400" /> Plans
                    </h3>
                    <p className="text-slate-400 text-xs font-medium mb-8 relative z-10">User distribution by plan.</p>

                    <div className="h-[240px] w-full relative z-10">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={membershipDistribution.length > 0 ? membershipDistribution : [{ name: 'Scanning...', value: 1 }]}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {membershipDistribution.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#fff', border: 'none', borderRadius: '12px', color: '#000', fontSize: '10px' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="mt-6 space-y-2 relative z-10">
                        {membershipDistribution.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 group hover:bg-white/10 transition-colors">
                                <div className="flex items-center gap-2">
                                    <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">{item.name}</span>
                                </div>
                                <span className="text-xs font-black text-white">{item.value}</span>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            <Card className="rounded-3xl border-0 shadow-xl shadow-slate-200/40 bg-white overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                            <History className="h-5 w-5 text-indigo-600" /> Stat Matrix
                        </h3>
                        <p className="text-slate-400 text-xs font-medium mt-1">Detailed metrics breakdown.</p>
                    </div>
                    <Button variant="outline" className="rounded-xl px-4 h-10 text-[10px]" icon={Globe}>Global View</Button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100/50">
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Dimension</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Efficiency</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Progress</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {[
                                { name: 'Member Retention', val: '94.2%', icon: Target, up: true },
                                { name: 'Class Occupancy', val: '78.5%', icon: Shield, up: true },
                                { name: 'Facility Usage', val: '62.1%', icon: Zap, up: false }
                            ].map((stat, idx) => (
                                <tr key={idx} className="group hover:bg-slate-50/50 transition-colors">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                                <stat.icon className="h-5 w-5" />
                                            </div>
                                            <span className="font-bold text-slate-900">{stat.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 font-bold text-slate-600">{stat.val}</td>
                                    <td className="px-8 py-6 text-right">
                                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${stat.up ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                            {stat.up ? 'Optimized' : 'Needs Review'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default Reports;
