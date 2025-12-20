
import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  CreditCard,
  TrendingUp,
  DollarSign,
  X,
  Filter,
  Wallet,
  Download,
  History,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { Button, Card } from '../components';
import { supabase } from '../lib/supabase';

interface Payment {
  id: number;
  member_id: number;
  amount: number;
  created_at: string;
  type: string;
  status: string;
  member: {
    name: string;
    membership_type: string;
  };
}

const Payments: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [members, setMembers] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form state
  const [newPayment, setNewPayment] = useState({
    member_id: '',
    amount: '',
    type: 'membership',
    status: 'completed'
  });
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    fetchPayments();
    fetchMembers();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('payments')
        .select(`
            *,
            member:members(name, membership_type)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (err) {
      console.error('Error fetching payments:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('id, name')
        .eq('status', 'Active');
      if (error) throw error;
      setMembers(data || []);
    } catch (err) {
      console.error('Error fetching members:', err);
    }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      const { error } = await supabase
        .from('payments')
        .insert([{
          member_id: parseInt(newPayment.member_id),
          amount: parseFloat(newPayment.amount),
          type: newPayment.type,
          status: newPayment.status
        }]);

      if (error) throw error;
      setShowAddModal(false);
      setNewPayment({ member_id: '', amount: '', type: 'membership', status: 'completed' });
      fetchPayments();
    } catch (err: unknown) {
      alert(`Failed to record payment: ${(err as Error).message}`);
    } finally {
      setSubmitLoading(false);
    }
  };

  const filteredPayments = payments.filter(p =>
    p.member?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = [
    { label: 'Revenue', val: `₹${payments.reduce((acc, p) => acc + (p.status === 'completed' ? p.amount : 0), 0).toLocaleString()}`, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Pending', val: `₹${payments.reduce((acc, p) => acc + (p.status === 'pending' ? p.amount : 0), 0).toLocaleString()}`, icon: History, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Members', val: members.length, icon: Wallet, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Growth', val: '+14.2%', icon: TrendingUp, color: 'text-rose-600', bg: 'bg-rose-50' }
  ];

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <ShieldCheck className="h-10 w-10 text-slate-900 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Payments</h1>
          <p className="text-slate-500 font-medium mt-1">Track membership fees and transactions.</p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" className="rounded-xl px-6 h-12" icon={Download}>Export</Button>
          <Button variant="primary" className="rounded-xl px-6 h-12" icon={Plus} onClick={() => setShowAddModal(true)}>Record Payment</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <Card key={i} className="rounded-2xl border-0 shadow-lg shadow-slate-200/40 p-6 bg-white group hover:-translate-y-1 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className={`h-10 w-10 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center shadow-inner`}>
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">{stat.val}</h3>
          </Card>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-6 mt-12">
        <div className="relative group flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          <input
            type="text"
            placeholder="Search by member name or payment type..."
            className="w-full pl-12 pr-6 py-3 bg-white border border-slate-100 rounded-xl focus:ring-4 focus:ring-indigo-50 outline-none font-bold text-xs shadow-sm transition-all text-slate-900"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className="rounded-xl px-6 h-12" icon={Filter}>Filters</Button>
      </div>

      <Card className="rounded-[32px] border-0 shadow-xl shadow-slate-200/40 bg-white overflow-hidden text-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100/50">
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Member</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Amount</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredPayments.map((p) => (
                <tr key={p.id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-900 font-bold text-sm">
                        {p.member?.name[0]}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 leading-tight">{p.member?.name}</p>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{p.member?.membership_type}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-3 w-3 text-slate-400" />
                      <span className="text-xs font-bold text-slate-600 capitalize">{p.type}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className="text-sm font-black text-slate-900">₹{p.amount.toLocaleString()}</span>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${p.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2 group-hover:gap-3 transition-all">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {new Date(p.created_at).toLocaleDateString()}
                      </span>
                      <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-slate-900/40 text-slate-900">
          <Card className="w-full max-w-lg bg-white rounded-3xl border-0 shadow-3xl p-10 relative">
            <button onClick={() => setShowAddModal(false)} className="absolute top-8 right-8 p-3 hover:bg-slate-100 rounded-2xl transition-colors">
              <X className="h-6 w-6 text-slate-400" />
            </button>
            <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Record Payment</h3>
            <p className="text-slate-500 font-medium mb-10 text-sm">Record a new payment transaction.</p>

            <form onSubmit={handleAddPayment} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Member</label>
                <select
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm focus:ring-4 focus:ring-indigo-50 transition-all appearance-none cursor-pointer text-slate-900"
                  value={newPayment.member_id}
                  onChange={(e) => setNewPayment({ ...newPayment, member_id: e.target.value })}
                  required
                >
                  <option value="">Select Member</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Amount (₹)</label>
                  <input
                    type="number"
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm focus:ring-4 focus:ring-indigo-50 transition-all text-slate-900"
                    placeholder="2999"
                    value={newPayment.amount}
                    onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Type</label>
                  <select
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm focus:ring-4 focus:ring-indigo-50 transition-all appearance-none cursor-pointer text-slate-900"
                    value={newPayment.type}
                    onChange={(e) => setNewPayment({ ...newPayment, type: e.target.value })}
                  >
                    <option value="membership">Membership</option>
                    <option value="trainer">Trainer Fee</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status</label>
                <div className="flex gap-4">
                  {['completed', 'pending'].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setNewPayment({ ...newPayment, status: s })}
                      className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-[9px] border transition-all ${newPayment.status === s ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <Button type="submit" variant="primary" className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-[10px]" loading={submitLoading}>Save Payment</Button>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Payments;
