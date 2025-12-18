import React, { useState } from 'react';
import { 
  CreditCard, 
  DollarSign, 
  Calendar, 
  Search, 
  Filter, 
  Download, 
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Receipt,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

interface Payment {
  id: number;
  memberId: number;
  memberName: string;
  email: string;
  plan: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed' | 'refunded';
  paymentMethod: string;
  date: string;
  dueDate: string;
  invoiceNumber: string;
}

const Payments: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('this-month');

  const payments: Payment[] = [
    {
      id: 1,
      memberId: 1,
      memberName: 'Sarah Johnson',
      email: 'sarah.johnson@email.com',
      plan: 'Premium Monthly',
      amount: 79.99,
      status: 'paid',
      paymentMethod: 'Credit Card',
      date: '2024-12-15',
      dueDate: '2024-12-15',
      invoiceNumber: 'INV-2024-001',
    },
    {
      id: 2,
      memberId: 2,
      memberName: 'John Smith',
      email: 'john.smith@email.com',
      plan: 'Basic Monthly',
      amount: 39.99,
      status: 'paid',
      paymentMethod: 'Debit Card',
      date: '2024-12-14',
      dueDate: '2024-12-14',
      invoiceNumber: 'INV-2024-002',
    },
    {
      id: 3,
      memberId: 3,
      memberName: 'Emily Davis',
      email: 'emily.davis@email.com',
      plan: 'Premium Annual',
      amount: 799.99,
      status: 'pending',
      paymentMethod: 'Bank Transfer',
      date: '',
      dueDate: '2024-12-20',
      invoiceNumber: 'INV-2024-003',
    },
    {
      id: 4,
      memberId: 4,
      memberName: 'Michael Brown',
      email: 'michael.brown@email.com',
      plan: 'Basic Monthly',
      amount: 39.99,
      status: 'failed',
      paymentMethod: 'Credit Card',
      date: '2024-12-10',
      dueDate: '2024-12-10',
      invoiceNumber: 'INV-2024-004',
    },
    {
      id: 5,
      memberId: 5,
      memberName: 'Lisa Wilson',
      email: 'lisa.wilson@email.com',
      plan: 'VIP Annual',
      amount: 1499.99,
      status: 'paid',
      paymentMethod: 'Credit Card',
      date: '2024-12-12',
      dueDate: '2024-12-12',
      invoiceNumber: 'INV-2024-005',
    },
    {
      id: 6,
      memberId: 6,
      memberName: 'Alex Turner',
      email: 'alex.turner@email.com',
      plan: 'Premium Monthly',
      amount: 79.99,
      status: 'refunded',
      paymentMethod: 'Credit Card',
      date: '2024-12-08',
      dueDate: '2024-12-08',
      invoiceNumber: 'INV-2024-006',
    },
  ];

  const stats = {
    totalRevenue: payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0),
    pendingPayments: payments.filter(p => p.status === 'pending').length,
    failedPayments: payments.filter(p => p.status === 'failed').length,
    avgPayment: payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0) / 
                payments.filter(p => p.status === 'paid').length || 0,
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || payment.status === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'refunded':
        return <ArrowDownRight className="h-4 w-4 text-purple-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payments & Billing</h1>
          <p className="text-gray-600">Track membership payments and manage invoices</p>
        </div>
        <div className="flex space-x-3">
          <button className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200">
            <Download className="h-5 w-5" />
            <span>Export</span>
          </button>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200">
            <Plus className="h-5 w-5" />
            <span>Record Payment</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
              <h3 className="text-2xl font-bold text-gray-900">${stats.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
              <p className="text-sm text-green-600 flex items-center mt-1">
                <ArrowUpRight className="h-4 w-4 mr-1" />
                +12.5% from last month
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Pending Payments</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.pendingPayments}</h3>
              <p className="text-sm text-yellow-600 flex items-center mt-1">
                <Clock className="h-4 w-4 mr-1" />
                Awaiting payment
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Failed Payments</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.failedPayments}</h3>
              <p className="text-sm text-red-600 flex items-center mt-1">
                <XCircle className="h-4 w-4 mr-1" />
                Needs attention
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Average Payment</p>
              <h3 className="text-2xl font-bold text-gray-900">${stats.avgPayment.toFixed(2)}</h3>
              <p className="text-sm text-blue-600 flex items-center mt-1">
                <TrendingUp className="h-4 w-4 mr-1" />
                Per transaction
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <CreditCard className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search by member name, email, or invoice number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-gray-400" />
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="today">Today</option>
                <option value="this-week">This Week</option>
                <option value="this-month">This Month</option>
                <option value="this-year">This Year</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Receipt className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-blue-600">{payment.invoiceNumber}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{payment.memberName}</div>
                      <div className="text-sm text-gray-500">{payment.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{payment.plan}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-semibold text-gray-900">
                      ${payment.amount.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                      {getStatusIcon(payment.status)}
                      <span className="ml-1 capitalize">{payment.status}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <CreditCard className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{payment.paymentMethod}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {payment.date ? new Date(payment.date).toLocaleDateString() : '-'}
                    </div>
                    <div className="text-xs text-gray-500">
                      Due: {new Date(payment.dueDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button className="text-blue-600 hover:text-blue-900 p-1">
                        View
                      </button>
                      {payment.status === 'pending' && (
                        <button className="text-green-600 hover:text-green-900 p-1">
                          Mark Paid
                        </button>
                      )}
                      {payment.status === 'failed' && (
                        <button className="text-orange-600 hover:text-orange-900 p-1">
                          Retry
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredPayments.length}</span> of{' '}
              <span className="font-medium">{payments.length}</span> results
            </div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
              <button className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                Previous
              </button>
              <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-blue-50 text-sm font-medium text-blue-600">
                1
              </button>
              <button className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                Next
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payments;
