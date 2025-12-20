
import { useState, useEffect } from 'react';
import { Edit, Trash2, Eye, Phone, X, Mail, Shield, ShieldCheck, UserPlus, Filter, Download } from 'lucide-react';
import { Button, SearchInput, Card } from '../components';
import { supabase } from '../lib/supabase';

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
    } catch (error: unknown) {
      const err = error as { message?: string };
      console.error('Error adding member:', err);
      alert(`Failed to add member: ${err.message || 'Please try again.'}`);
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
    } catch (error: unknown) {
      const err = error as { message?: string };
      console.error('Error updating member:', err);
      alert(`Failed to update member: ${err.message || 'Error occurred'}`);
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
    } catch (error: unknown) {
      const err = error as { message?: string };
      console.error('Error deleting member:', err);
      alert(`Failed to delete member: ${err.message || 'Error occurred'}`);
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
        return 'bg-green-100 text-green-700 ring-1 ring-green-200';
      case 'inactive':
        return 'bg-red-100 text-red-700 ring-1 ring-red-200';
      case 'pending':
        return 'bg-amber-100 text-amber-700 ring-1 ring-amber-200';
      default:
        return 'bg-slate-100 text-slate-700 ring-1 ring-slate-200';
    }
  };

  const getMembershipStyle = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'premium':
        return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      case 'vip':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      {/* Header Block */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Members</h1>
          <p className="text-slate-500 mt-1 text-sm sm:text-base">View and manage all members.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-xl border-slate-200 px-4 h-10 text-sm" icon={Download}>
            Export
          </Button>
          <Button variant="primary" className="rounded-xl bg-slate-900 hover:bg-slate-800 px-6 h-10 border-0 shadow-md text-sm" icon={UserPlus} onClick={() => setShowAddModal(true)}>
            Add New
          </Button>
        </div>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: members.length },
          { label: 'Active', value: members.filter(m => m.status === 'Active').length },
          { label: 'Premium', value: members.filter(m => m.membership_type === 'Premium').length },
          { label: 'Pending', value: members.filter(m => m.status === 'Pending').length },
        ].map((stat) => (
          <Card key={stat.label} className="p-4 rounded-2xl border-slate-100 shadow-lg shadow-slate-200/40">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{stat.value}</h3>
          </Card>
        ))}
      </div>

      <SearchInput
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Search members..."
        filters={[
          { value: 'all', label: 'All Status' },
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' },
          { value: 'pending', label: 'Pending' }
        ]}
        selectedFilter={selectedFilter}
        onFilterChange={setSelectedFilter}
        className="rounded-2xl border-slate-100 shadow-lg shadow-slate-200/30 py-2"
      />

      {/* Main Table */}
      <Card className="rounded-2xl border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden bg-white">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-3"></div>
            <p className="text-slate-500 font-bold text-sm">Loading members...</p>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="p-12 text-center">
            <div className="h-14 w-14 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Filter className="h-6 w-6 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">No members found</h3>
            <p className="text-slate-500 mt-1 text-sm">Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Member</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Plan</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredMembers.map((member) => (
                  <tr key={member.id} className="group hover:bg-slate-50/50 transition-all duration-300">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-base shadow-md">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{member.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="flex items-center text-[10px] text-slate-400">
                              <Mail className="h-2.5 w-2.5 mr-1" /> {member.email}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex px-3 py-1 rounded-lg text-[10px] font-bold border ${getMembershipStyle(member.membership_type)}`}>
                        {member.membership_type}
                      </div>
                      <p className="text-[9px] text-slate-400 mt-1 font-bold italic">
                        Joined {member.join_date ? new Date(member.join_date).toLocaleDateString() : 'N/A'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${getStatusColor(member.status)}`}>
                        <div className={`h-1 w-1 rounded-full mr-1.5 ${member.status === 'Active' ? 'bg-green-500' : member.status === 'Pending' ? 'bg-amber-500' : 'bg-red-500'}`} />
                        {member.status}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 bg-white text-slate-400 hover:text-blue-600 rounded-lg shadow-sm border border-slate-100 hover:border-blue-100 transition-all" onClick={() => openViewModal(member)}>
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="p-2 bg-white text-slate-400 hover:text-green-600 rounded-lg shadow-sm border border-slate-100 hover:border-green-100 transition-all" onClick={() => openEditModal(member)}>
                          <Edit className="h-4 w-4" />
                        </button>
                        <button className="p-2 bg-white text-slate-400 hover:text-red-600 rounded-lg shadow-sm border border-slate-100 hover:border-red-100 transition-all" onClick={() => handleDeleteMember(member.id)}>
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
      </Card>

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/10 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <Card className="max-w-lg w-full p-0 rounded-2xl border-0 shadow-2xl bg-white overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 md:p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Add Member</h2>
                  <p className="text-slate-500 mt-1 text-sm">Enter details to create a new member.</p>
                </div>
                <button onClick={() => setShowAddModal(false)} className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleAddMember} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 ml-1">Full Name</label>
                    <input
                      type="text"
                      required
                      className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-50 outline-none text-sm transition-all"
                      value={newMember.name}
                      onChange={e => setNewMember({ ...newMember, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 ml-1">Email</label>
                    <input
                      type="email"
                      className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-50 outline-none text-sm transition-all"
                      value={newMember.email}
                      onChange={e => setNewMember({ ...newMember, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 ml-1">Phone</label>
                    <input
                      type="tel"
                      className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-50 outline-none text-sm transition-all"
                      value={newMember.phone}
                      onChange={e => setNewMember({ ...newMember, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 ml-1">Plan</label>
                    <select
                      className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-50 outline-none text-sm transition-all appearance-none"
                      value={newMember.membership_type}
                      onChange={e => setNewMember({ ...newMember, membership_type: e.target.value })}
                    >
                      <option value="Basic">Basic</option>
                      <option value="Premium">Premium</option>
                      <option value="VIP">VIP</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 flex gap-3 border-t border-slate-50">
                  <Button type="button" variant="outline" className="flex-1 rounded-xl py-3 text-sm h-10" onClick={() => setShowAddModal(false)}>Cancel</Button>
                  <Button type="submit" variant="primary" className="flex-1 rounded-xl py-3 bg-slate-900 border-0 text-sm h-10" loading={submitLoading}>Add Member</Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}

      {/* Edit Member Modal */}
      {showEditModal && selectedMember && (
        <div className="fixed inset-0 bg-slate-900/10 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <Card className="max-w-lg w-full p-0 rounded-2xl border-0 shadow-2xl bg-white overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 md:p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Edit Member</h2>
                  <p className="text-slate-500 mt-1 text-sm">Update member details.</p>
                </div>
                <button onClick={() => setShowEditModal(false)} className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateMember} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 ml-1">Full Name</label>
                    <input
                      type="text"
                      required
                      className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-50 outline-none text-sm transition-all"
                      value={selectedMember.name}
                      onChange={e => setSelectedMember({ ...selectedMember, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 ml-1">Email</label>
                    <input
                      type="email"
                      className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-50 outline-none text-sm transition-all"
                      value={selectedMember.email}
                      onChange={e => setSelectedMember({ ...selectedMember, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 ml-1">Phone</label>
                    <input
                      type="tel"
                      className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-50 outline-none text-sm transition-all"
                      value={selectedMember.phone}
                      onChange={e => setSelectedMember({ ...selectedMember, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 ml-1">Plan</label>
                    <select
                      className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-50 outline-none text-sm transition-all appearance-none"
                      value={selectedMember.membership_type}
                      onChange={e => setSelectedMember({ ...selectedMember, membership_type: e.target.value })}
                    >
                      <option value="Basic">Basic</option>
                      <option value="Premium">Premium</option>
                      <option value="VIP">VIP</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 ml-1">Status</label>
                    <select
                      className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-50 outline-none text-sm transition-all appearance-none"
                      value={selectedMember.status}
                      onChange={e => setSelectedMember({ ...selectedMember, status: e.target.value })}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Pending">Pending</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 flex gap-3 border-t border-slate-50">
                  <Button type="button" variant="outline" className="flex-1 rounded-xl py-3 text-sm h-10" onClick={() => setShowEditModal(false)}>Cancel</Button>
                  <Button type="submit" variant="primary" className="flex-1 rounded-xl py-3 bg-slate-900 border-0 text-sm h-10" loading={submitLoading}>Save Changes</Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}

      {/* View Member Modal */}
      {showViewModal && selectedMember && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <Card className="max-w-xl w-full p-0 rounded-3xl border-0 shadow-2xl bg-white overflow-hidden animate-in slide-in-from-bottom-4 duration-400">
            <div className="relative h-32 bg-gradient-to-r from-blue-600 to-indigo-700">
              <button onClick={() => setShowViewModal(false)} className="absolute top-4 right-4 p-2 bg-white/20 text-white hover:bg-white/40 rounded-full backdrop-blur-md transition-colors">
                <X className="h-4 w-4" />
              </button>
              <div className="absolute -bottom-12 left-8 h-24 w-24 rounded-2xl bg-white p-1.5 shadow-xl">
                <div className="h-full w-full rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-3xl font-black">
                  {selectedMember.name[0]}
                </div>
              </div>
            </div>

            <div className="pt-14 px-8 pb-8">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">{selectedMember.name}</h2>
                  <p className="text-slate-500 font-bold mt-1 uppercase tracking-widest text-[10px]">{selectedMember.membership_type} Member</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${getStatusColor(selectedMember.status)}`}>
                  {selectedMember.status}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mt-8 border-t border-slate-50 pt-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Email</p>
                      <p className="text-xs font-bold text-slate-900">{selectedMember.email || 'None'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                      <Phone className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Phone</p>
                      <p className="text-xs font-bold text-slate-900">{selectedMember.phone || 'None'}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Trainer</p>
                      <p className="text-xs font-bold text-slate-900">{selectedMember.trainer || 'Unassigned'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                      <Shield className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Joined</p>
                      <p className="text-xs font-bold text-slate-900">{selectedMember.join_date ? new Date(selectedMember.join_date).toLocaleDateString() : 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-50 flex gap-3">
                <Button variant="outline" className="flex-1 rounded-xl py-3 text-sm h-10" onClick={() => setShowViewModal(false)}>Close</Button>
                <Button variant="primary" className="flex-1 rounded-xl py-3 bg-slate-900 border-0 text-sm h-10" onClick={() => { setShowViewModal(false); openEditModal(selectedMember); }}>Edit</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Members;

