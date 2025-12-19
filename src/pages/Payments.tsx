
import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Search,
  Plus,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  X,
  User,
  History,
  ArrowUpRight
} from 'lucide-react';
import { Button } from '../components';
import { supabase } from '../lib/supabase';

interface Payment {
  id: number;
  amount: number;
  member_id: number;
  type: string;
  status: string;
  created_at: string;
  member: {
    name: string;
    membership_type: string;
  };
}

interface Member {
  id: number;
  name: string;
  membership_type: string;
}

const Payments: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Form State
  const [newPayment, setNewPayment] = useState({
    member_id: '',
    amount: '',
    type: 'membership',
    status: 'completed'
  });

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
    } catch (error) {
      console.error('Error fetching payments:', error);
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
    } catch (error: any) {
      alert(`Payment recording failed: ${error.message}`);
    } finally {
      setSubmitLoading(false);
    }
  };

  const filteredPayments = payments.filter(p =>
    p.member.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    totalRevenue: payments.reduce((acc, p) => acc + (p.status === 'completed' ? p.amount : 0), 0),
    pendingAmount: payments.reduce((acc, p) => acc + (p.status === 'pending' ? p.amount : 0), 0),
    recentCount: payments.filter(p => {
      const date = new Date(p.created_at);
      const today = new Date();
      return date.getDate() === today.getDate() && date.getMonth() === today.getMonth();
    }).length
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payments & Billing</h1>
          <p className="text-gray-600">Track subscriptions and daily transactions</p>
        </div>
        <Button variant="primary" icon={Plus} onClick={() => setShowAddModal(true)}>
          New Payment
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <h3 className="text-2xl font-bold text-gray-900">${stats.totalRevenue.toLocaleString()}</h3>
            </div>
            <div className="ml-auto flex items-center text-green-500 text-xs font-bold">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              +12%
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <History className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Today's Collections</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.recentCount} Payments</h3>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 bg-yellow-50 text-yellow-600 rounded-xl flex items-center justify-center">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Pending Payments</p>
              <h3 className="text-2xl font-bold text-gray-900">${stats.pendingAmount.toLocaleString()}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center">
            <History className="h-5 w-5 mr-2 text-blue-600" />
            Recent Transactions
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search member name..."
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full sm:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 text-xs font-bold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Transaction ID</th>
                <th className="px-6 py-4">Member</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">Loading transactions...</td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">No transactions found.</td>
                </tr>
              ) : filteredPayments.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-mono text-gray-400">#PAY-{p.id}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center mr-3">
                        <User className="h-4 w-4 text-slate-500" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{p.member.name}</p>
                        <p className="text-xs text-gray-500">{p.member.membership_type}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-gray-900">${p.amount}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-medium text-gray-500 capitalize">{p.type.replace('_', ' ')}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getStatusColor(p.status)}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(p.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Payment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="text-center mb-8">
              <div className="h-16 w-16 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <DollarSign className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Record Payment</h2>
              <p className="text-gray-500 mt-1">Add a new transaction to the logs</p>
            </div>

            <form onSubmit={handleAddPayment} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Member</label>
                <select
                  required
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 outline-none bg-gray-50"
                  value={newPayment.member_id}
                  onChange={(e) => setNewPayment({ ...newPayment, member_id: e.target.value })}
                >
                  <option value="">Select Member...</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.membership_type})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Amount ($)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    required
                    type="number"
                    className="w-full pl-9 p-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 outline-none bg-gray-50"
                    placeholder="0.00"
                    value={newPayment.amount}
                    onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Type</label>
                  <select
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 outline-none bg-gray-50"
                    value={newPayment.type}
                    onChange={(e) => setNewPayment({ ...newPayment, type: e.target.value })}
                  >
                    <option value="membership">Membership</option>
                    <option value="personal_training">PT Sessions</option>
                    <option value="product">Product Sale</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Status</label>
                  <select
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 outline-none bg-gray-50"
                    value={newPayment.status}
                    onChange={(e) => setNewPayment({ ...newPayment, status: e.target.value })}
                  >
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              </div>

              <div className="pt-6 flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 rounded-2xl py-3"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1 rounded-2xl py-3 shadow-lg shadow-blue-200"
                  loading={submitLoading}
                >
                  Confirm Payment
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;
