import React, { useState } from 'react';
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';
import {
    TrendingUp,
    TrendingDown,
    Users,
    DollarSign,
    Calendar,
    Download,
    ArrowUpRight,
    ArrowDownRight,
    Activity
} from 'lucide-react';

const Reports: React.FC = () => {
    const [selectedPeriod, setSelectedPeriod] = useState('this-month');

    // Revenue data
    const revenueData = [
        { month: 'Jan', revenue: 32000, members: 180 },
        { month: 'Feb', revenue: 35000, members: 195 },
        { month: 'Mar', revenue: 38000, members: 220 },
        { month: 'Apr', revenue: 40500, members: 235 },
        { month: 'May', revenue: 42000, members: 250 },
        { month: 'Jun', revenue: 41000, members: 245 },
        { month: 'Jul', revenue: 43500, members: 260 },
        { month: 'Aug', revenue: 46000, members: 280 },
        { month: 'Sep', revenue: 44000, members: 275 },
        { month: 'Oct', revenue: 47500, members: 295 },
        { month: 'Nov', revenue: 49000, members: 310 },
        { month: 'Dec', revenue: 52500, members: 330 },
    ];

    // Membership breakdown
    const membershipData = [
        { name: 'Basic', value: 450, color: '#3B82F6' },
        { name: 'Premium', value: 320, color: '#8B5CF6' },
        { name: 'VIP', value: 85, color: '#F59E0B' },
        { name: 'Day Pass', value: 65, color: '#10B981' },
    ];

    // Class attendance data
    const classAttendanceData = [
        { name: 'Yoga', attendance: 450, capacity: 520 },
        { name: 'HIIT', attendance: 380, capacity: 400 },
        { name: 'Strength', attendance: 520, capacity: 600 },
        { name: 'Zumba', attendance: 310, capacity: 350 },
        { name: 'Pilates', attendance: 280, capacity: 320 },
        { name: 'Cardio', attendance: 420, capacity: 480 },
    ];

    // Weekly check-ins
    const weeklyCheckIns = [
        { day: 'Mon', checkIns: 285 },
        { day: 'Tue', checkIns: 312 },
        { day: 'Wed', checkIns: 298 },
        { day: 'Thu', checkIns: 325 },
        { day: 'Fri', checkIns: 287 },
        { day: 'Sat', checkIns: 410 },
        { day: 'Sun', checkIns: 195 },
    ];

    // Trainer performance
    const trainerPerformance = [
        { name: 'Mike Chen', sessions: 85, rating: 4.8, revenue: 6375 },
        { name: 'Sarah Wilson', sessions: 92, rating: 4.9, revenue: 5980 },
        { name: 'David Rodriguez', sessions: 78, rating: 4.7, revenue: 6240 },
        { name: 'Lisa Thompson', sessions: 65, rating: 4.6, revenue: 3575 },
        { name: 'Emma Davis', sessions: 72, rating: 4.8, revenue: 5040 },
    ];

    const stats = [
        {
            title: 'Total Revenue',
            value: '$52,500',
            change: '+12.5%',
            changeType: 'positive',
            icon: DollarSign,
            color: 'bg-green-500',
        },
        {
            title: 'Active Members',
            value: '1,247',
            change: '+8.3%',
            changeType: 'positive',
            icon: Users,
            color: 'bg-blue-500',
        },
        {
            title: 'Avg. Daily Check-ins',
            value: '302',
            change: '+5.2%',
            changeType: 'positive',
            icon: Activity,
            color: 'bg-purple-500',
        },
        {
            title: 'Classes Held',
            value: '156',
            change: '-2.1%',
            changeType: 'negative',
            icon: Calendar,
            color: 'bg-orange-500',
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
                    <p className="text-gray-600">Track your gym's performance and growth</p>
                </div>
                <div className="flex space-x-3">
                    <select
                        value={selectedPeriod}
                        onChange={(e) => setSelectedPeriod(e.target.value)}
                        className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="this-week">This Week</option>
                        <option value="this-month">This Month</option>
                        <option value="this-quarter">This Quarter</option>
                        <option value="this-year">This Year</option>
                    </select>
                    <button className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200">
                        <Download className="h-5 w-5" />
                        <span>Export Report</span>
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                    <div key={index} className="bg-white rounded-xl shadow border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                                <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
                                <p className={`text-sm flex items-center mt-1 ${stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                    {stat.changeType === 'positive' ? (
                                        <ArrowUpRight className="h-4 w-4 mr-1" />
                                    ) : (
                                        <ArrowDownRight className="h-4 w-4 mr-1" />
                                    )}
                                    {stat.change} from last period
                                </p>
                            </div>
                            <div className={`p-3 ${stat.color} rounded-lg`}>
                                <stat.icon className="h-6 w-6 text-white" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Revenue Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-xl shadow border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue & Members Growth</h3>
                    <ResponsiveContainer width="100%" height={350}>
                        <AreaChart data={revenueData}>
                            <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorMembers" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                            <XAxis dataKey="month" stroke="#6B7280" />
                            <YAxis yAxisId="left" stroke="#6B7280" />
                            <YAxis yAxisId="right" orientation="right" stroke="#6B7280" />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#fff',
                                    border: '1px solid #E5E7EB',
                                    borderRadius: '8px'
                                }}
                            />
                            <Legend />
                            <Area
                                yAxisId="left"
                                type="monotone"
                                dataKey="revenue"
                                stroke="#3B82F6"
                                fillOpacity={1}
                                fill="url(#colorRevenue)"
                                name="Revenue ($)"
                            />
                            <Area
                                yAxisId="right"
                                type="monotone"
                                dataKey="members"
                                stroke="#10B981"
                                fillOpacity={1}
                                fill="url(#colorMembers)"
                                name="Active Members"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Membership Breakdown */}
                <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Membership Breakdown</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={membershipData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={90}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {membershipData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2 mt-4">
                        {membershipData.map((item, index) => (
                            <div key={index} className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <div
                                        className="w-3 h-3 rounded-full mr-2"
                                        style={{ backgroundColor: item.color }}
                                    />
                                    <span className="text-sm text-gray-600">{item.name}</span>
                                </div>
                                <span className="text-sm font-medium text-gray-900">{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Class Attendance and Weekly Check-ins */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Class Attendance */}
                <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Class Attendance Rate</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={classAttendanceData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                            <XAxis type="number" stroke="#6B7280" />
                            <YAxis dataKey="name" type="category" stroke="#6B7280" width={80} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#fff',
                                    border: '1px solid #E5E7EB',
                                    borderRadius: '8px'
                                }}
                            />
                            <Legend />
                            <Bar dataKey="attendance" name="Attendance" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                            <Bar dataKey="capacity" name="Capacity" fill="#E5E7EB" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Weekly Check-ins */}
                <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Check-ins</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={weeklyCheckIns}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                            <XAxis dataKey="day" stroke="#6B7280" />
                            <YAxis stroke="#6B7280" />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#fff',
                                    border: '1px solid #E5E7EB',
                                    borderRadius: '8px'
                                }}
                            />
                            <Line
                                type="monotone"
                                dataKey="checkIns"
                                stroke="#8B5CF6"
                                strokeWidth={3}
                                dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 6 }}
                                name="Check-ins"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Trainer Performance */}
            <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Trainer Performance</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Trainer
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Sessions
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Rating
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Revenue Generated
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Performance
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {trainerPerformance.map((trainer, index) => (
                                <tr key={index} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium">
                                                {trainer.name.split(' ').map(n => n[0]).join('')}
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">{trainer.name}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-sm font-medium text-gray-900">{trainer.sessions}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <span className="text-sm font-medium text-gray-900">{trainer.rating}</span>
                                            <span className="ml-1 text-yellow-400">★</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-sm font-medium text-green-600">${trainer.revenue.toLocaleString()}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                                                style={{ width: `${(trainer.sessions / 100) * 100}%` }}
                                            />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Reports;
