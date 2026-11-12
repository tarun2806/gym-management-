import React, { useState, useEffect, useCallback } from 'react';
import { Plus, MapPin, Edit, Trash2, X, Users, CheckCircle, Building2 } from 'lucide-react';
import { Button, Card } from '../components';
import { useToast } from '../components/Toast';
import { useAuth } from '../contexts/AuthContext';
import { useOrganization } from '../contexts/OrganizationContext';
import { api } from '../lib/api';
import { logAudit } from '../lib/audit';
import { mapBranch } from '../contexts/OrganizationContext';
import type { Branch } from '../types';

const Branches: React.FC = () => {
  const { notify } = useToast();
  const { user, can } = useAuth();
  const { currentOrganization, currentBranch, setCurrentBranch } = useOrganization();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);

  const [newBranch, setNewBranch] = useState({
    name: '',
    address: '',
    phone: '',
    capacity: 50,
    status: 'active' as 'active' | 'suspended',
    manager_id: ''
  });
  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchBranches = useCallback(async () => {
    if (!currentOrganization) return;
    try {
      setLoading(true);
      const rows = await api<Record<string, unknown>[]>(
        `/api/organizations/${currentOrganization.id}/branches`,
        { scope: { orgId: currentOrganization.id } }
      );
      setBranches(rows.map(mapBranch));
    } catch (err) {
      console.error('Error fetching branches:', err);
    } finally {
      setLoading(false);
    }
  }, [currentOrganization]);

  useEffect(() => {
    if (currentOrganization) {
      fetchBranches();
    }
  }, [currentOrganization, fetchBranches]);

  const handleAddBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrganization) {
      notify('Please select an organization first', 'error');
      return;
    }
    setSubmitLoading(true);
    try {
      await api(`/api/organizations/${currentOrganization.id}/branches`, {
        method: 'POST',
        scope: { orgId: currentOrganization.id },
        body: newBranch
      });

      setShowAddModal(false);
      setNewBranch({
        name: '',
        address: '',
        phone: '',
        capacity: 50,
        status: 'active',
        manager_id: ''
      });
      fetchBranches();
      notify('Branch created', 'success');
    } catch (err: unknown) {
      notify(`Failed to create branch: ${(err as Error).message}`, 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleUpdateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBranch) return;
    setSubmitLoading(true);
    try {
      await api(`/api/organizations/${currentOrganization?.id}/branches/${selectedBranch.id}`, {
        method: 'PUT',
        scope: { orgId: currentOrganization?.id },
        body: {
          name: selectedBranch.name,
          address: selectedBranch.address,
          phone: selectedBranch.phone,
          capacity: selectedBranch.capacity,
          status: selectedBranch.status,
          manager_id: selectedBranch.manager_id,
        }
      });

      setShowEditModal(false);
      fetchBranches();
      notify('Branch updated', 'success');
    } catch (err: unknown) {
      notify(`Failed to update branch: ${(err as Error).message}`, 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteBranch = async (id: string) => {
    if (!confirm('Are you sure you want to delete this branch?')) return;
    try {
      await api(`/api/organizations/${currentOrganization?.id}/branches/${id}`, {
        method: 'DELETE',
        scope: { orgId: currentOrganization?.id },
      });
      await logAudit('warning', `Branch deleted: ID ${id}`, user?.username || 'admin', 'branch_delete');
      fetchBranches();
      notify('Branch deleted', 'success');
    } catch (err: unknown) {
      notify(`Failed to delete branch: ${(err as Error).message}`, 'error');
    }
  };

  const handleSwitchBranch = (branch: Branch) => {
    setCurrentBranch(branch);
    notify(`Switched to ${branch.name}`, 'success');
  };

  if (!currentOrganization) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Building2 className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 font-bold">Please select an organization first</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-slate-900 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Branches</h1>
          <p className="text-slate-500 mt-1 text-sm sm:text-base">Manage branches for {currentOrganization.name}.</p>
        </div>
        {can('branches.create') && (
          <Button variant="primary" className="rounded-xl bg-slate-900 hover:bg-black px-6 h-10 border-0 shadow-md text-sm" icon={Plus} onClick={() => setShowAddModal(true)}>
            Add Branch
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {branches.map((branch) => (
          <Card key={branch.id} className={`rounded-2xl border-0 shadow-xl shadow-slate-200/40 bg-white overflow-hidden ${currentBranch?.id === branch.id ? 'ring-2 ring-indigo-500' : ''}`}>
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="h-12 w-12 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-lg">
                  <MapPin className="h-6 w-6" />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleSwitchBranch(branch)} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors" title="Switch to this branch">
                    <CheckCircle className="h-4 w-4" />
                  </button>
                  {can('branches.manage') && (
                    <>
                      <button onClick={() => { setSelectedBranch(branch); setShowEditModal(true); }} className="p-2 text-slate-400 hover:text-emerald-600 transition-colors">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDeleteBranch(branch.id)} className="p-2 text-slate-400 hover:text-rose-600 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <h3 className="text-xl font-black text-slate-900 tracking-tight">{branch.name}</h3>
              <p className="text-slate-500 text-xs font-medium mt-1">{branch.address}</p>

              <div className="mt-4 space-y-2">
                <div className="flex items-center text-xs text-slate-600">
                  <Users className="h-3 w-3 mr-2" />
                  Capacity: {branch.capacity}
                </div>
                {branch.phone && (
                  <div className="flex items-center text-xs text-slate-600">
                    Capacity: {branch.phone}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center">
                <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                  branch.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                }`}>
                  {branch.status}
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/10 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <Card className="max-w-lg w-full p-0 rounded-2xl border-0 shadow-2xl bg-white overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 md:p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Add Branch</h2>
                  <p className="text-slate-500 mt-1 text-sm">Create a new branch.</p>
                </div>
                <button onClick={() => setShowAddModal(false)} className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleAddBranch} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 ml-1">Branch Name</label>
                  <input
                    type="text"
                    required
                    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-50 outline-none text-sm transition-all"
                    value={newBranch.name}
                    onChange={e => setNewBranch({ ...newBranch, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 ml-1">Address</label>
                  <input
                    type="text"
                    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-50 outline-none text-sm transition-all"
                    value={newBranch.address}
                    onChange={e => setNewBranch({ ...newBranch, address: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 ml-1">Phone</label>
                    <input
                      type="tel"
                      className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-50 outline-none text-sm transition-all"
                      value={newBranch.phone}
                      onChange={e => setNewBranch({ ...newBranch, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 ml-1">Capacity</label>
                    <input
                      type="number"
                      className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-50 outline-none text-sm transition-all"
                      value={newBranch.capacity}
                      onChange={e => setNewBranch({ ...newBranch, capacity: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 ml-1">Status</label>
                  <select
                    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-50 outline-none text-sm transition-all appearance-none"
                    value={newBranch.status}
                    onChange={e => setNewBranch({ ...newBranch, status: e.target.value as 'active' | 'suspended' })}
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>

                <div className="pt-4 flex gap-3 border-t border-slate-50">
                  <Button type="button" variant="outline" className="flex-1 rounded-xl py-3 text-sm h-10" onClick={() => setShowAddModal(false)}>Cancel</Button>
                  <Button type="submit" variant="primary" className="flex-1 rounded-xl py-3 bg-slate-900 border-0 text-sm h-10" loading={submitLoading}>Create</Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}

      {showEditModal && selectedBranch && (
        <div className="fixed inset-0 bg-slate-900/10 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <Card className="max-w-lg w-full p-0 rounded-2xl border-0 shadow-2xl bg-white overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 md:p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Edit Branch</h2>
                  <p className="text-slate-500 mt-1 text-sm">{selectedBranch.name}</p>
                </div>
                <button onClick={() => setShowEditModal(false)} className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateBranch} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 ml-1">Branch Name</label>
                  <input
                    type="text"
                    required
                    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-50 outline-none text-sm transition-all"
                    value={selectedBranch.name}
                    onChange={e => setSelectedBranch({ ...selectedBranch, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 ml-1">Address</label>
                  <input
                    type="text"
                    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-50 outline-none text-sm transition-all"
                    value={selectedBranch.address}
                    onChange={e => setSelectedBranch({ ...selectedBranch, address: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 ml-1">Phone</label>
                    <input
                      type="tel"
                      className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-50 outline-none text-sm transition-all"
                      value={selectedBranch.phone || ''}
                      onChange={e => setSelectedBranch({ ...selectedBranch, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 ml-1">Capacity</label>
                    <input
                      type="number"
                      className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-50 outline-none text-sm transition-all"
                      value={selectedBranch.capacity}
                      onChange={e => setSelectedBranch({ ...selectedBranch, capacity: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 ml-1">Status</label>
                  <select
                    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-50 outline-none text-sm transition-all appearance-none"
                    value={selectedBranch.status}
                    onChange={e => setSelectedBranch({ ...selectedBranch, status: e.target.value as 'active' | 'suspended' })}
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>

                <div className="pt-4 flex gap-3 border-t border-slate-50">
                  <Button type="button" variant="outline" className="flex-1 rounded-xl py-3 text-sm h-10" onClick={() => setShowEditModal(false)}>Cancel</Button>
                  <Button type="submit" variant="primary" className="flex-1 rounded-xl py-3 bg-slate-900 border-0 text-sm h-10" loading={submitLoading}>Save</Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Branches;
