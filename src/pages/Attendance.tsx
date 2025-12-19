
import React, { useState, useEffect } from 'react';
import {
    Users,
    Search,
    LogIn,
    LogOut,
    Clock,
    Calendar as CalendarIcon,
    CheckCircle,
    X,
    Plus
} from 'lucide-react';
import { Button } from '../components';
import { supabase } from '../lib/supabase';

interface AttendanceRecord {
    id: number;
    member_id: number;
    check_in: string;
    check_out: string | null;
    status: string;
    member: {
        name: string;
        membership_type: string;
        phone: string;
    };
}

interface Member {
    id: number;
    name: string;
    membership_type: string;
}

const Attendance: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [members, setMembers] = useState<Member[]>([]);
    const [searchMember, setSearchMember] = useState('');
    const [showCheckInModal, setShowCheckInModal] = useState(false);
    const [selectedMemberId, setSelectedMemberId] = useState<string>('');
    const [submitLoading, setSubmitLoading] = useState(false);

    useEffect(() => {
        fetchTodayAttendance();
        fetchMembers();
    }, []);

    const fetchTodayAttendance = async () => {
        try {
            setLoading(true);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const { data, error } = await supabase
                .from('attendance')
                .select(`
          *,
          member:members(name, membership_type, phone)
        `)
                .gte('check_in', today.toISOString())
                .order('check_in', { ascending: false });

            if (error) throw error;
            setRecords(data || []);
        } catch (error) {
            console.error('Error fetching attendance:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMembers = async () => {
        try {
            const { data, error } = await supabase
                .from('members')
                .select('id, name, membership_type')
                .eq('status', 'Active');

            if (error) throw error;
            setMembers(data || []);
        } catch (error) {
            console.error('Error fetching members:', error);
        }
    };

    const handleCheckIn = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMemberId) return;

        setSubmitLoading(true);
        try {
            // Check if already checked in today and not checked out
            const { data: existing } = await supabase
                .from('attendance')
                .select('id')
                .eq('member_id', selectedMemberId)
                .is('check_out', null)
                .gte('check_in', new Date().toISOString().split('T')[0])
                .maybeSingle();

            if (existing) {
                alert('Member is already checked in!');
                return;
            }

            const { error } = await supabase
                .from('attendance')
                .insert([{
                    member_id: parseInt(selectedMemberId),
                    status: 'present'
                }]);

            if (error) throw error;

            setShowCheckInModal(false);
            setSelectedMemberId('');
            fetchTodayAttendance();
        } catch (error: any) {
            alert(`Check-in failed: ${error.message}`);
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleCheckOut = async (id: number) => {
        try {
            const { error } = await supabase
                .from('attendance')
                .update({ check_out: new Date().toISOString() })
                .eq('id', id);

            if (error) throw error;
            fetchTodayAttendance();
        } catch (error: any) {
            alert(`Check-out failed: ${error.message}`);
        }
    };

    const filteredRecords = records.filter(record =>
        record.member.name.toLowerCase().includes(searchMember.toLowerCase())
    );

    const stats = {
        present: records.length,
        active: records.filter(r => !r.check_out).length,
        completed: records.filter(r => r.check_out).length
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Attendance</h1>
                    <p className="text-gray-600">Daily check-in and check-out management</p>
                </div>
                <Button variant="primary" icon={Plus} onClick={() => setShowCheckInModal(true)}>
                    New Check-in
                </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Present Today</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.present}</h3>
                        </div>
                        <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                            <Users className="h-6 w-6" />
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Currently Inside</p>
                            <h3 className="text-2xl font-bold text-green-600 mt-1">{stats.active}</h3>
                        </div>
                        <div className="h-12 w-12 bg-green-50 text-green-600 rounded-lg flex items-center justify-center">
                            <LogIn className="h-6 w-6" />
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Checked Out</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.completed}</h3>
                        </div>
                        <div className="h-12 w-12 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center">
                            <LogOut className="h-6 w-6" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Search and List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <input
                            type="text"
                            placeholder="Search today's attendance..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={searchMember}
                            onChange={(e) => setSearchMember(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                </div>

                {loading ? (
                    <div className="p-12 text-center text-gray-500">Loading attendance data...</div>
                ) : filteredRecords.length === 0 ? (
                    <div className="p-12 text-center">
                        <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 font-medium">No check-ins recorded yet today.</p>
                        <Button
                            variant="outline"
                            className="mt-4"
                            onClick={() => setShowCheckInModal(true)}
                        >
                            Check in First Member
                        </Button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Member</th>
                                    <th className="px-6 py-4">Membership</th>
                                    <th className="px-6 py-4">Check-in</th>
                                    <th className="px-6 py-4">Check-out</th>
                                    <th className="px-6 py-4">Duration</th>
                                    <th className="px-6 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredRecords.map((record) => {
                                    const checkInTime = new Date(record.check_in);
                                    const checkOutTime = record.check_out ? new Date(record.check_out) : null;

                                    // Calculate duration
                                    let duration = '-';
                                    if (checkOutTime) {
                                        const diff = Math.floor((checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60));
                                        duration = `${Math.floor(diff / 60)}h ${diff % 60}m`;
                                    }

                                    return (
                                        <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900">{record.member.name}</div>
                                                <div className="text-xs text-gray-500">{record.member.phone}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-1 text-xs font-medium bg-blue-50 text-blue-600 rounded-full italic">
                                                    {record.member.membership_type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {checkInTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {checkOutTime ? checkOutTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (
                                                    <span className="flex items-center text-green-600 font-medium">
                                                        <span className="h-1.5 w-1.5 bg-green-600 rounded-full mr-2 animate-pulse" />
                                                        Active
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {duration}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {!record.check_out && (
                                                    <button
                                                        onClick={() => handleCheckOut(record.id)}
                                                        className="text-orange-600 hover:text-orange-900 text-sm font-semibold flex items-center justify-end ml-auto group"
                                                    >
                                                        <LogOut className="h-4 w-4 mr-1 group-hover:translate-x-1 transition-transform" />
                                                        Check Out
                                                    </button>
                                                )}
                                                {record.check_out && (
                                                    <span className="text-gray-400 flex items-center justify-end">
                                                        <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                                                        Session Ended
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Check-in Modal */}
            {showCheckInModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl relative translate-y-0 transition-transform">
                        <button
                            onClick={() => setShowCheckInModal(false)}
                            className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 bg-gray-50 rounded-full p-1"
                        >
                            <X className="h-5 w-5" />
                        </button>
                        <div className="text-center mb-8">
                            <div className="h-16 w-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <LogIn className="h-8 w-8" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">Member Check-in</h2>
                            <p className="text-gray-500 mt-1">Select a member to log their arrival</p>
                        </div>

                        <form onSubmit={handleCheckIn} className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Search Member</label>
                                <select
                                    required
                                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none bg-gray-50/50"
                                    value={selectedMemberId}
                                    onChange={(e) => setSelectedMemberId(e.target.value)}
                                >
                                    <option value="">Choose a member...</option>
                                    {members.map(m => (
                                        <option key={m.id} value={m.id}>{m.name} ({m.membership_type})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="pt-4 flex gap-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1 rounded-xl py-3"
                                    onClick={() => setShowCheckInModal(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    className="flex-1 rounded-xl py-3 shadow-lg shadow-blue-200"
                                    loading={submitLoading}
                                >
                                    Check In Now
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Attendance;
