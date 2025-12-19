import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, Phone, X } from 'lucide-react';
import { Button, SearchInput } from '../components';
import { supabase } from '../lib/supabase';

// Define Member interface matches Supabase schema
interface Member {
  id: number;
  name: string;
  email: string;
  phone: string;
  membership_type: string;
  status: string;
  join_date: string;
  last_visit: string;
  trainer: string;
}

const Members: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  // Add/Edit Member Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    phone: '',
    membership_type: 'Basic',
    status: 'Active',
    trainer: ''
  });
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching members:', error);
      } else {
        setMembers(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      const { error } = await supabase
        .from('members')
        .insert([newMember]);

      if (error) throw error;

      setShowAddModal(false);
      setNewMember({
        name: '',
        email: '',
        phone: '',
        membership_type: 'Basic',
        status: 'Active',
        trainer: ''
      });
      fetchMembers();
    } catch (error: any) {
      console.error('Error adding member:', error);
      alert(`Failed to add member: ${error.message || 'Please try again.'}`);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    setSubmitLoading(true);
    try {
      const { error } = await supabase
        .from('members')
        .update({
          name: selectedMember.name,
          email: selectedMember.email,
          phone: selectedMember.phone,
          membership_type: selectedMember.membership_type,
          status: selectedMember.status,
          trainer: selectedMember.trainer
        })
        .eq('id', selectedMember.id);

      if (error) throw error;

      setShowEditModal(false);
      fetchMembers();
    } catch (error: any) {
      console.error('Error updating member:', error);
      alert(`Failed to update member: ${error.message}`);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteMember = async (id: number) => {
    if (!confirm('Are you sure you want to delete this member?')) return;
    try {
      const { error } = await supabase.from('members').delete().eq('id', id);
      if (error) throw error;
      fetchMembers();
    } catch (err: any) {
      console.error('Error deleting member:', err);
      alert(`Failed to delete member: ${err.message}`);
    }
  };

  const openEditModal = (member: Member) => {
    setSelectedMember({ ...member });
    setShowEditModal(true);
  };

  const openViewModal = (member: Member) => {
    setSelectedMember(member);
    setShowViewModal(true);
  };


  const filteredMembers = members.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.email && member.email.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFilter = selectedFilter === 'all' || member.status.toLowerCase() === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getMembershipColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'premium':
        return 'bg-purple-100 text-purple-800';
      case 'basic':
        return 'bg-blue-100 text-blue-800';
      case 'vip':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Members</h1>
          <p className="text-gray-600">Manage your gym members.</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="primary" icon={Plus} onClick={() => setShowAddModal(true)}>
            Add Member
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <SearchInput
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Search members by name or email..."
        filters={[
          { value: 'all', label: 'All Status' },
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' },
          { value: 'pending', label: 'Pending' }
        ]}
        selectedFilter={selectedFilter}
        onFilterChange={setSelectedFilter}
      />

      {/* Members Table */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading members...</div>
        ) : filteredMembers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No members found. Add some in your database!</div>
        ) : (
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
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Join Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Visit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trainer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{member.name}</div>
                          <div className="text-sm text-gray-500">{member.email}</div>
                          {member.phone && (
                            <div className="text-sm text-gray-500 flex items-center mt-1">
                              <Phone className="h-3 w-3 mr-1" />
                              {member.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getMembershipColor(member.membership_type)}`}>
                        {member.membership_type || 'Basic'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(member.status)}`}>
                        {member.status || 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {member.join_date ? new Date(member.join_date).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {member.last_visit ? new Date(member.last_visit).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {member.trainer || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          className="text-blue-600 hover:text-blue-900 p-1"
                          onClick={() => openViewModal(member)}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          className="text-green-600 hover:text-green-900 p-1"
                          onClick={() => openEditModal(member)}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          className="text-red-600 hover:text-red-900 p-1"
                          onClick={() => handleDeleteMember(member.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New Member</h2>
            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                  value={newMember.name}
                  onChange={e => setNewMember({ ...newMember, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                  value={newMember.email}
                  onChange={e => setNewMember({ ...newMember, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                  value={newMember.phone}
                  onChange={e => setNewMember({ ...newMember, phone: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Membership</label>
                  <select
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                    value={newMember.membership_type}
                    onChange={e => setNewMember({ ...newMember, membership_type: e.target.value })}
                  >
                    <option value="Basic">Basic</option>
                    <option value="Premium">Premium</option>
                    <option value="VIP">VIP</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                    value={newMember.status}
                    onChange={e => setNewMember({ ...newMember, status: e.target.value })}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
              </div>
              <div className="pt-4 flex space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1"
                  loading={submitLoading}
                >
                  Add Member
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Edit Member Modal */}
      {showEditModal && selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 relative">
            <button onClick={() => setShowEditModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Member</h2>
            <form onSubmit={handleUpdateMember} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input type="text" required className="w-full rounded-lg border-gray-300 p-2 border" value={selectedMember.name} onChange={e => setSelectedMember({ ...selectedMember, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" className="w-full rounded-lg border-gray-300 p-2 border" value={selectedMember.email} onChange={e => setSelectedMember({ ...selectedMember, email: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input type="tel" className="w-full rounded-lg border-gray-300 p-2 border" value={selectedMember.phone} onChange={e => setSelectedMember({ ...selectedMember, phone: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Membership</label>
                  <select className="w-full rounded-lg border-gray-300 p-2 border" value={selectedMember.membership_type} onChange={e => setSelectedMember({ ...selectedMember, membership_type: e.target.value })}>
                    <option value="Basic">Basic</option>
                    <option value="Premium">Premium</option>
                    <option value="VIP">VIP</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select className="w-full rounded-lg border-gray-300 p-2 border" value={selectedMember.status} onChange={e => setSelectedMember({ ...selectedMember, status: e.target.value })}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="pt-4 flex space-x-3">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowEditModal(false)}>Cancel</Button>
                <Button type="submit" variant="primary" className="flex-1" loading={submitLoading}>Save Changes</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Member Modal */}
      {showViewModal && selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-8 relative">
            <button onClick={() => setShowViewModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            <div className="text-center mb-6">
              <div className="h-24 w-24 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl font-bold">{selectedMember.name.split(' ').map(n => n[0]).join('')}</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">{selectedMember.name}</h2>
              <p className="text-gray-500">{selectedMember.membership_type} Member</p>
            </div>
            <div className="space-y-4 border-t border-gray-100 pt-6">
              <div className="flex justify-between"><span className="text-gray-500">Email:</span><span className="font-medium">{selectedMember.email || '-'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Phone:</span><span className="font-medium">{selectedMember.phone || '-'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Join Date:</span><span className="font-medium">{selectedMember.join_date ? new Date(selectedMember.join_date).toLocaleDateString() : '-'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Status:</span><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(selectedMember.status)}`}>{selectedMember.status}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Last Visit:</span><span className="font-medium">{selectedMember.last_visit ? new Date(selectedMember.last_visit).toLocaleDateString() : 'Never'}</span></div>
            </div>
            <div className="mt-8">
              <Button variant="outline" className="w-full" onClick={() => setShowViewModal(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Members;
