import React, { useState } from 'react';
import {
    UserCheck,
    UserX,
    Clock,
    Search,
    Calendar,
    TrendingUp,
    Users,
    Activity,
    LogIn,
    LogOut,
    CheckCircle,
    XCircle
} from 'lucide-react';

interface CheckInRecord {
    id: number;
    memberId: number;
    memberName: string;
    membershipType: string;
    checkInTime: string;
    checkOutTime: string | null;
    duration: string | null;
    status: 'checked-in' | 'checked-out';
}

const Attendance: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [quickSearchMember, setQuickSearchMember] = useState('');

    const [checkInRecords, setCheckInRecords] = useState<CheckInRecord[]>([
        {
            id: 1,
            memberId: 1,
            memberName: 'Sarah Johnson',
            membershipType: 'Premium',
            checkInTime: '06:30 AM',
            checkOutTime: '08:15 AM',
            duration: '1h 45m',
            status: 'checked-out',
        },
        {
            id: 2,
            memberId: 2,
            memberName: 'John Smith',
            membershipType: 'Basic',
            checkInTime: '07:00 AM',
            checkOutTime: null,
            duration: null,
            status: 'checked-in',
        },
        {
            id: 3,
            memberId: 3,
            memberName: 'Emily Davis',
            membershipType: 'VIP',
            checkInTime: '07:15 AM',
            checkOutTime: null,
            duration: null,
            status: 'checked-in',
        },
        {
            id: 4,
            memberId: 4,
            memberName: 'Michael Brown',
            membershipType: 'Basic',
            checkInTime: '06:00 AM',
            checkOutTime: '07:30 AM',
            duration: '1h 30m',
            status: 'checked-out',
        },
        {
            id: 5,
            memberId: 5,
            memberName: 'Lisa Wilson',
            membershipType: 'Premium',
            checkInTime: '07:45 AM',
            checkOutTime: null,
            duration: null,
            status: 'checked-in',
        },
        {
            id: 6,
            memberId: 6,
            memberName: 'Alex Turner',
            membershipType: 'VIP',
            checkInTime: '05:30 AM',
            checkOutTime: '07:00 AM',
            duration: '1h 30m',
            status: 'checked-out',
        },
    ]);

    // Available members for quick check-in
    const availableMembers = [
        { id: 7, name: 'David Lee', membershipType: 'Premium' },
        { id: 8, name: 'Jessica Martinez', membershipType: 'Basic' },
        { id: 9, name: 'Ryan Taylor', membershipType: 'VIP' },
        { id: 10, name: 'Amanda White', membershipType: 'Premium' },
    ];

    const stats = {
        currentlyIn: checkInRecords.filter(r => r.status === 'checked-in').length,
        totalToday: checkInRecords.length,
        avgDuration: '1h 35m',
        peakHour: '7:00 AM - 8:00 AM',
    };

    const filteredRecords = checkInRecords.filter(record =>
        record.memberName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredAvailableMembers = availableMembers.filter(member =>
        member.name.toLowerCase().includes(quickSearchMember.toLowerCase())
    );

    const handleQuickCheckIn = (memberId: number, memberName: string, membershipType: string) => {
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

        const newRecord: CheckInRecord = {
            id: Date.now(),
            memberId,
            memberName,
            membershipType,
            checkInTime: timeString,
            checkOutTime: null,
            duration: null,
            status: 'checked-in',
        };

        setCheckInRecords([newRecord, ...checkInRecords]);
        setQuickSearchMember('');
    };

    const handleCheckOut = (recordId: number) => {
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

        setCheckInRecords(checkInRecords.map(record => {
            if (record.id === recordId) {
                return {
                    ...record,
                    checkOutTime: timeString,
                    duration: '1h 15m', // In real app, calculate actual duration
                    status: 'checked-out' as const,
                };
            }
            return record;
        }));
    };

    const getMembershipColor = (type: string) => {
        switch (type.toLowerCase()) {
            case 'premium':
                return 'bg-purple-100 text-purple-800';
            case 'basic':
                return 'bg-blue-100 text-blue-800';
            case 'vip':
                return 'bg-amber-100 text-amber-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Attendance Tracking</h1>
                    <p className="text-gray-600">Monitor member check-ins and gym traffic</p>
                </div>
                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                        <Calendar className="h-5 w-5 text-gray-400" />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Currently In Gym</p>
                            <h3 className="text-3xl font-bold text-green-600">{stats.currentlyIn}</h3>
                        </div>
                        <div className="p-3 bg-green-100 rounded-lg">
                            <Users className="h-6 w-6 text-green-600" />
                        </div>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-green-600">
                        <Activity className="h-4 w-4 mr-1 animate-pulse" />
                        <span>Active now</span>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Total Check-ins Today</p>
                            <h3 className="text-3xl font-bold text-blue-600">{stats.totalToday}</h3>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <UserCheck className="h-6 w-6 text-blue-600" />
                        </div>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-blue-600">
                        <TrendingUp className="h-4 w-4 mr-1" />
                        <span>+15% vs yesterday</span>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Avg. Visit Duration</p>
                            <h3 className="text-3xl font-bold text-purple-600">{stats.avgDuration}</h3>
                        </div>
                        <div className="p-3 bg-purple-100 rounded-lg">
                            <Clock className="h-6 w-6 text-purple-600" />
                        </div>
                    </div>
                    <div className="mt-2 text-sm text-gray-500">
                        Per member session
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Peak Hour</p>
                            <h3 className="text-xl font-bold text-orange-600">{stats.peakHour}</h3>
                        </div>
                        <div className="p-3 bg-orange-100 rounded-lg">
                            <TrendingUp className="h-6 w-6 text-orange-600" />
                        </div>
                    </div>
                    <div className="mt-2 text-sm text-gray-500">
                        Most busy time
                    </div>
                </div>
            </div>

            {/* Quick Check-in Section */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
                <h3 className="text-xl font-bold mb-4 flex items-center">
                    <LogIn className="h-6 w-6 mr-2" />
                    Quick Check-in
                </h3>
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                            <input
                                type="text"
                                placeholder="Search member by name or scan membership card..."
                                value={quickSearchMember}
                                onChange={(e) => setQuickSearchMember(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-white/20 bg-white/10 backdrop-blur rounded-lg text-white placeholder-white/60 focus:ring-2 focus:ring-white/50 focus:border-transparent"
                            />
                        </div>
                        {quickSearchMember && (
                            <div className="mt-2 bg-white rounded-lg shadow-lg overflow-hidden max-h-60 overflow-y-auto">
                                {filteredAvailableMembers.map((member) => (
                                    <button
                                        key={member.id}
                                        onClick={() => handleQuickCheckIn(member.id, member.name, member.membershipType)}
                                        className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between border-b border-gray-100 last:border-0"
                                    >
                                        <div className="flex items-center">
                                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium mr-3">
                                                {member.name.split(' ').map(n => n[0]).join('')}
                                            </div>
                                            <div>
                                                <p className="text-gray-900 font-medium">{member.name}</p>
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${getMembershipColor(member.membershipType)}`}>
                                                    {member.membershipType}
                                                </span>
                                            </div>
                                        </div>
                                        <LogIn className="h-5 w-5 text-green-600" />
                                    </button>
                                ))}
                                {filteredAvailableMembers.length === 0 && (
                                    <div className="px-4 py-3 text-gray-500 text-center">
                                        No members found
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Currently Checked-in Members */}
            <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <Activity className="h-5 w-5 mr-2 text-green-600" />
                        Currently in Gym
                    </h3>
                    <span className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">
                        {stats.currentlyIn} members
                    </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                    {checkInRecords.filter(r => r.status === 'checked-in').map((record) => (
                        <div key={record.id} className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                            <div className="flex items-center">
                                <div className="h-12 w-12 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center text-white font-medium mr-4">
                                    {record.memberName.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">{record.memberName}</p>
                                    <div className="flex items-center space-x-2">
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${getMembershipColor(record.membershipType)}`}>
                                            {record.membershipType}
                                        </span>
                                        <span className="text-sm text-gray-500">in at {record.checkInTime}</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => handleCheckOut(record.id)}
                                className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                                title="Check Out"
                            >
                                <LogOut className="h-5 w-5" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Today's Activity Log */}
            <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Today's Activity Log</h3>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Member
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Membership
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Check-in Time
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Check-out Time
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Duration
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredRecords.map((record) => (
                                <tr key={record.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium">
                                                {record.memberName.split(' ').map(n => n[0]).join('')}
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">{record.memberName}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getMembershipColor(record.membershipType)}`}>
                                            {record.membershipType}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center text-sm text-gray-900">
                                            <LogIn className="h-4 w-4 text-green-600 mr-2" />
                                            {record.checkInTime}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {record.checkOutTime ? (
                                            <div className="flex items-center text-sm text-gray-900">
                                                <LogOut className="h-4 w-4 text-red-600 mr-2" />
                                                {record.checkOutTime}
                                            </div>
                                        ) : (
                                            <span className="text-sm text-gray-400">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-sm text-gray-900">{record.duration || '-'}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {record.status === 'checked-in' ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                <CheckCircle className="h-3 w-3 mr-1" />
                                                In Gym
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                <XCircle className="h-3 w-3 mr-1" />
                                                Checked Out
                                            </span>
                                        )}
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

export default Attendance;
