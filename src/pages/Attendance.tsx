
import React, { useState, useEffect } from 'react';
import {
    Users,
    Search,
    LogIn,
    Clock,
    Calendar as CalendarIcon,
    CheckCircle,
    X,
    Activity,
    UserCheck,
    History
} from 'lucide-react';
import { Button, Card } from '../components';
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
    member: members(name, membership_type, phone)
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
        } catch (error: unknown) {
            const err = error as { message?: string };
            alert(`Check -in failed: ${err.message || 'Error occurred'} `);
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
        } catch (error: unknown) {
            const err = error as { message?: string };
            alert(`Check - out failed: ${err.message || 'Error occurred'} `);
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
        <div className="space-y-6 pb-12 animate-in fade-in duration-500">
            {/* Header Block */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Attendance</h1>
                    <p className="text-slate-500 mt-1 text-sm sm:text-base">Monitor entries and exits.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="rounded-xl border-slate-200 px-4 h-10 text-sm" icon={History}>
                        History
                    </Button>
                    <Button variant="primary" className="rounded-xl bg-blue-600 hover:bg-blue-700 px-6 h-10 border-0 shadow-md text-sm" icon={LogIn} onClick={() => setShowCheckInModal(true)}>
                        New Entry
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: "Total Entries", value: stats.present, icon: Users, color: "blue" },
                    { label: "Present", value: stats.active, icon: Activity, color: "green", secondary: true },
                    { label: "Completed", value: stats.completed, icon: UserCheck, color: "indigo" },
                ].map((stat) => (
                    <Card key={stat.label} className="p-6 rounded-2xl border-slate-100 shadow-lg shadow-slate-200/40 relative overflow-hidden group">
                        <div className={`absolute top - 0 right - 0 w - 24 h - 24 bg - ${stat.color} -50 rounded - bl - [80px] - mr - 6 - mt - 6 opacity - 50 group - hover: scale - 105 transition - transform`} />
                        <div className="flex items-center justify-between relative z-10">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                                <h3 className={`text - 2xl font - black mt - 1 ${stat.secondary ? 'text-green-600' : 'text-slate-900'} `}>{stat.value}</h3>
                            </div>
                            <div className={`h - 12 w - 12 bg - ${stat.color} -50 text - ${stat.color} -600 rounded - xl flex items - center justify - center`}>
                                <stat.icon className="h-6 w-6" />
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Main Content Area */}
            <Card className="rounded-2xl border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden bg-white">
                <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-300 h-4 w-4" />
                        <input
                            type="text"
                            placeholder="Search present members..."
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-blue-50 outline-none transition-all text-sm font-medium"
                            value={searchMember}
                            onChange={(e) => setSearchMember(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center px-4 py-2 bg-slate-50 rounded-xl text-slate-500 font-bold text-xs">
                        <CalendarIcon className="h-3.5 w-3.5 mr-2" />
                        {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                    </div>
                </div>

                {loading ? (
                    <div className="p-12 text-center">
                        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-3"></div>
                        <p className="text-slate-500 font-bold text-sm">Loading records...</p>
                    </div>
                ) : filteredRecords.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Clock className="h-8 w-8 text-slate-300" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900">No Records Today</h3>
                        <p className="text-slate-500 mt-1 text-sm">No check-ins recorded for today yet.</p>
                        <Button variant="primary" className="mt-6 rounded-xl bg-slate-900 border-0 px-6 h-10 text-sm" onClick={() => setShowCheckInModal(true)}>
                            Log First Entry
                        </Button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Member</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Entry/Exit</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Duration</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredRecords.map((record) => {
                                    const checkInTime = new Date(record.check_in);
                                    const checkOutTime = record.check_out ? new Date(record.check_out) : null;

                                    let duration = '-';
                                    if (checkOutTime) {
                                        const diff = Math.floor((checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60));
                                        duration = `${Math.floor(diff / 60)}h ${diff % 60} m`;
                                    }

                                    return (
                                        <tr key={record.id} className="group hover:bg-slate-50 transition-all duration-300">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-xs">
                                                        {record.member.name[0]}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-900 text-xs">{record.member.name}</div>
                                                        <div className="text-[10px] text-slate-500">{record.member.membership_type}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div>
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">In</p>
                                                        <p className="text-[11px] font-bold text-slate-900 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                                                            {checkInTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Out</p>
                                                        {checkOutTime ? (
                                                            <p className="text-[11px] font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                                                {checkOutTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </p>
                                                        ) : (
                                                            <div className="flex items-center text-green-600 font-bold text-[9px] uppercase tracking-widest bg-green-50 px-2 py-0.5 rounded border border-green-100">
                                                                <span className="h-1.5 w-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse" />
                                                                Inside
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center text-[11px] font-bold text-slate-600 bg-slate-50 w-fit px-3 py-1 rounded-lg border border-slate-100">
                                                    <Clock className="h-3 w-3 mr-1.5 text-slate-400" />
                                                    {duration === '-' ? 'Active' : duration}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {!record.check_out ? (
                                                    <button
                                                        onClick={() => handleCheckOut(record.id)}
                                                        className="px-4 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all duration-300 shadow-sm"
                                                    >
                                                        Check-out
                                                    </button>
                                                ) : (
                                                    <div className="inline-flex items-center text-slate-400 font-bold bg-slate-50 px-3 py-1 rounded-lg text-[9px] uppercase tracking-widest">
                                                        <CheckCircle className="h-3 w-3 mr-1.5 text-green-500" />
                                                        Done
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* Check-in Modal */}
            {showCheckInModal && (
                <div className="fixed inset-0 bg-slate-900/10 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
                    <Card className="max-w-md w-full p-8 rounded-2xl border-0 shadow-2xl bg-white overflow-hidden animate-in zoom-in-95 duration-200 relative">
                        <button onClick={() => setShowCheckInModal(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 transition-colors">
                            <X className="h-5 w-5" />
                        </button>

                        <div className="mb-8 text-center">
                            <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <LogIn className="h-8 w-8" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900">Check-in</h2>
                            <p className="text-slate-500 mt-1 text-sm">Confirm member entry.</p>
                        </div>

                        <form onSubmit={handleCheckIn} className="space-y-6">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Member Name</label>
                                <select
                                    required
                                    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-blue-50 outline-none font-bold text-sm transition-all appearance-none cursor-pointer"
                                    value={selectedMemberId}
                                    onChange={(e) => setSelectedMemberId(e.target.value)}
                                >
                                    <option value="">Select a member...</option>
                                    {members.map(m => (
                                        <option key={m.id} value={m.id}>{m.name} — {m.membership_type}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Button type="button" variant="outline" className="flex-1 rounded-xl py-3 text-xs" onClick={() => setShowCheckInModal(false)}>Cancel</Button>
                                <Button type="submit" variant="primary" className="flex-2 rounded-xl py-3 bg-blue-600 border-0 shadow-lg shadow-blue-100 text-xs" loading={submitLoading}>Check-in</Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default Attendance;
