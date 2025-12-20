
import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  MapPin,
  Edit,
  Trash2,
  Eye,
  Wrench,
  X,
  Activity,
  AlertTriangle,
  Zap,
  History,
  CheckCircle2,
  Clock,
  Settings
} from 'lucide-react';
import { Button, Card } from '../components';
import { supabase } from '../lib/supabase';

interface EquipmentItem {
  id: number;
  name: string;
  type: string;
  brand: string;
  model: string;
  location: string;
  status: string;
  last_maintenance: string;
  next_maintenance?: string;
  condition: string;
  serial_number: string;
  purchase_date: string;
  warranty: string;
  notes: string;
}

const Equipment: React.FC = () => {
  const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<EquipmentItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  // Form state for new equipment
  const [newEquipment, setNewEquipment] = useState({
    name: '',
    type: 'Cardio',
    brand: '',
    model: '',
    location: '',
    status: 'operational',
    condition: 'Excellent',
    serial_number: '',
    purchase_date: new Date().toISOString().split('T')[0],
    warranty: '',
    notes: ''
  });
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    fetchEquipment();
  }, []);

  const fetchEquipment = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('equipment')
        .select('*')
        .order('name');
      if (error) throw error;
      setEquipment(data || []);
    } catch (err) {
      console.error('Error fetching equipment:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      const { error } = await supabase
        .from('equipment')
        .insert([newEquipment]);

      if (error) throw error;
      setShowAddModal(false);
      setNewEquipment({
        name: '',
        type: 'Cardio',
        brand: '',
        model: '',
        location: '',
        status: 'operational',
        condition: 'Excellent',
        serial_number: '',
        purchase_date: new Date().toISOString().split('T')[0],
        warranty: '',
        notes: ''
      });
      fetchEquipment();
    } catch (err: unknown) {
      alert(`Failed to add equipment: ${(err as Error).message}`);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleUpdateEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    setSubmitLoading(true);
    try {
      const { error } = await supabase
        .from('equipment')
        .update(selectedItem)
        .eq('id', selectedItem.id);

      if (error) throw error;
      setShowEditModal(false);
      fetchEquipment();
    } catch (err: unknown) {
      alert(`Failed to update equipment: ${(err as Error).message}`);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteEquipment = async (id: number) => {
    if (!confirm('Are you sure you want to delete this equipment?')) return;
    try {
      const { error } = await supabase
        .from('equipment')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchEquipment();
    } catch (err: unknown) {
      alert(`Failed to delete equipment: ${(err as Error).message}`);
    }
  };

  const getMaintenanceStatus = (nextDate: string | undefined) => {
    if (!nextDate) return { label: 'Scheduled', color: 'text-slate-400', icon: Clock };
    const today = new Date();
    const maint = new Date(nextDate);
    const diffDays = Math.ceil((maint.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { label: 'Overdue', color: 'text-rose-600', icon: AlertTriangle };
    if (diffDays < 7) return { label: 'Upcoming', color: 'text-amber-600', icon: Zap };
    return { label: 'Good', color: 'text-emerald-600', icon: CheckCircle2 };
  };

  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case 'operational': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'maintenance': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'broken': return 'bg-rose-50 text-rose-700 border-rose-100';
      default: return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  const filteredEquipment = equipment.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.brand || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.model || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || item.status === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Equipment</h1>
          <p className="text-slate-500 font-medium mt-1">Manage gym inventory and maintenance.</p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" className="rounded-xl px-4 h-11 text-[10px]" icon={History}>Logs</Button>
          <Button variant="primary" className="rounded-xl px-6 h-11" icon={Plus} onClick={() => setShowAddModal(true)}>Add Equipment</Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-430 group-focus-within:text-indigo-500 transition-colors" />
          <input
            type="text"
            placeholder="Search by name, brand, or model..."
            className="w-full pl-12 pr-6 py-3 bg-white border border-slate-100 rounded-xl focus:ring-4 focus:ring-indigo-50 outline-none font-bold text-xs shadow-sm transition-all text-slate-900"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          value={selectedFilter}
          onChange={(e) => setSelectedFilter(e.target.value)}
          className="h-11 px-6 bg-white border border-slate-100 rounded-xl focus:ring-4 focus:ring-indigo-50 outline-none font-bold text-xs text-slate-500 cursor-pointer appearance-none min-w-[160px] shadow-sm"
        >
          <option value="all">All Status</option>
          <option value="operational">Operational</option>
          <option value="maintenance">Maintenance</option>
          <option value="broken">Broken</option>
        </select>
      </div>

      {loading ? (
        <div className="h-[40vh] flex flex-col items-center justify-center gap-4">
          <Activity className="h-10 w-10 text-slate-300 animate-pulse" />
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Loading equipment...</p>
        </div>
      ) : filteredEquipment.length === 0 ? (
        <Card className="rounded-3xl border-slate-100 p-20 text-center shadow-xl shadow-slate-200/40 bg-white">
          <Wrench className="h-12 w-12 text-slate-100 mx-auto mb-6" />
          <h3 className="text-xl font-black text-slate-900">No Equipment Found</h3>
          <p className="text-slate-400 mt-2 font-medium text-sm">No items match your current search or filter.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {filteredEquipment.map((item) => {
            const maint = getMaintenanceStatus(item.next_maintenance);
            const MaintIcon = maint.icon;

            return (
              <Card key={item.id} className="rounded-3xl border-0 shadow-lg shadow-slate-200/50 hover:shadow-indigo-100 transition-all group overflow-hidden bg-white">
                <div className="p-8">
                  <div className="flex justify-between items-start mb-6">
                    <div className="h-12 w-12 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Wrench className="h-6 w-6 text-indigo-400" />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setSelectedItem(item); setShowViewModal(true); }} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"><Eye className="h-4 w-4" /></button>
                      <button onClick={() => { setSelectedItem({ ...item }); setShowEditModal(true); }} className="p-2 text-slate-400 hover:text-emerald-600 transition-colors"><Edit className="h-4 w-4" /></button>
                      <button onClick={() => handleDeleteEquipment(item.id)} className="p-2 text-slate-400 hover:text-rose-600 transition-colors"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusStyle(item.status)}`}>
                        {item.status}
                      </span>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.type}</span>
                    </div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight leading-tight">{item.name}</h3>
                    <div className="flex items-center text-slate-400 text-xs font-bold">
                      <MapPin className="h-3 w-3 mr-2 text-slate-300" />
                      {item.location || 'Central Area'}
                    </div>
                  </div>

                  <div className="mt-8 p-4 bg-slate-50 rounded-2xl group-hover:bg-indigo-50/50 transition-colors">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</span>
                      <div className={`flex items-center text-[9px] font-black ${maint.color} uppercase tracking-widest`}>
                        <MaintIcon className="h-3 w-3 mr-1" />
                        {maint.label}
                      </div>
                    </div>
                    <div className="h-1 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${maint.color.replace('text', 'bg')}`} style={{ width: item.status === 'operational' ? '100%' : '30%' }} />
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest block">Brand</span>
                      <span className="text-xs font-bold text-slate-900">{item.brand} {item.model}</span>
                    </div>
                    <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                      <Settings className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-slate-900/40 text-slate-900">
          <Card className="w-full max-w-2xl bg-white rounded-3xl border-0 shadow-3xl p-10 relative">
            <button onClick={() => setShowAddModal(false)} className="absolute top-8 right-8 p-3 hover:bg-slate-100 rounded-2xl transition-colors">
              <X className="h-6 w-6 text-slate-400" />
            </button>
            <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Add Equipment</h3>
            <p className="text-slate-500 font-medium mb-10 text-sm">Register a new piece of hardware.</p>

            <form onSubmit={handleAddEquipment} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Name</label>
                  <input
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none font-bold text-sm focus:ring-4 focus:ring-indigo-50 transition-all text-slate-900"
                    placeholder="Treadmill X1"
                    value={newEquipment.name}
                    onChange={(e) => setNewEquipment({ ...newEquipment, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Type</label>
                  <select
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none font-bold text-sm focus:ring-4 focus:ring-indigo-50 transition-all appearance-none cursor-pointer text-slate-900"
                    value={newEquipment.type}
                    onChange={(e) => setNewEquipment({ ...newEquipment, type: e.target.value })}
                  >
                    <option value="Cardio">Cardio</option>
                    <option value="Strength">Strength</option>
                    <option value="Weights">Weights</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Brand</label>
                  <input
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none font-bold text-sm focus:ring-4 focus:ring-indigo-50 transition-all text-slate-900"
                    placeholder="Technogym"
                    value={newEquipment.brand}
                    onChange={(e) => setNewEquipment({ ...newEquipment, brand: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Location</label>
                  <input
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none font-bold text-sm focus:ring-4 focus:ring-indigo-50 transition-all text-slate-900"
                    placeholder="Area A"
                    value={newEquipment.location}
                    onChange={(e) => setNewEquipment({ ...newEquipment, location: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Purchase Date</label>
                  <input
                    type="date"
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none font-bold text-sm focus:ring-4 focus:ring-indigo-50 transition-all text-slate-900"
                    value={newEquipment.purchase_date}
                    onChange={(e) => setNewEquipment({ ...newEquipment, purchase_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status</label>
                  <select
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none font-bold text-sm focus:ring-4 focus:ring-indigo-50 transition-all appearance-none cursor-pointer text-slate-900"
                    value={newEquipment.status}
                    onChange={(e) => setNewEquipment({ ...newEquipment, status: e.target.value })}
                  >
                    <option value="operational">Operational</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="broken">Broken</option>
                  </select>
                </div>
              </div>
              <Button type="submit" variant="primary" className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-[10px]" loading={submitLoading}>Save Equipment</Button>
            </form>
          </Card>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-slate-900/40 text-slate-900">
          <Card className="w-full max-w-lg bg-white rounded-3xl border-0 shadow-3xl p-10 relative">
            <button onClick={() => setShowViewModal(false)} className="absolute top-8 right-8 p-3 hover:bg-slate-100 rounded-2xl transition-colors">
              <X className="h-6 w-6 text-slate-400" />
            </button>
            <div className="flex items-center gap-6 mb-10">
              <div className="h-16 w-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center text-2xl font-black">
                <Wrench className="h-8 w-8 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{selectedItem.name}</h3>
                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border mt-2 inline-block ${getStatusStyle(selectedItem.status)}`}>
                  {selectedItem.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-10">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Brand</p>
                <p className="font-bold text-sm text-slate-900">{selectedItem.brand || 'N/A'}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Model</p>
                <p className="font-bold text-sm text-slate-900">{selectedItem.model || 'N/A'}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Type</p>
                <p className="font-bold text-sm text-slate-900">{selectedItem.type}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Location</p>
                <p className="font-bold text-sm text-slate-900">{selectedItem.location}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 col-span-2">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Notes</p>
                <p className="font-bold text-xs text-slate-900">{selectedItem.notes || 'No extra notes recorded.'}</p>
              </div>
            </div>

            <Button variant="outline" className="w-full h-12 rounded-xl" onClick={() => setShowViewModal(false)}>Close</Button>
          </Card>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-slate-900/40 text-slate-900">
          <Card className="w-full max-w-2xl bg-white rounded-3xl border-0 shadow-3xl p-10 relative">
            <button onClick={() => setShowEditModal(false)} className="absolute top-8 right-8 p-3 hover:bg-slate-100 rounded-2xl transition-colors">
              <X className="h-6 w-6 text-slate-400" />
            </button>
            <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Edit Equipment</h3>
            <p className="text-slate-500 font-medium mb-10 text-sm">Update hardware details.</p>

            <form onSubmit={handleUpdateEquipment} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Name</label>
                  <input
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none font-bold text-sm focus:ring-4 focus:ring-indigo-50 transition-all text-slate-900"
                    value={selectedItem.name}
                    onChange={(e) => setSelectedItem({ ...selectedItem, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status</label>
                  <select
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none font-bold text-sm focus:ring-4 focus:ring-indigo-50 transition-all appearance-none cursor-pointer text-slate-900"
                    value={selectedItem.status}
                    onChange={(e) => setSelectedItem({ ...selectedItem, status: e.target.value })}
                  >
                    <option value="operational">Operational</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="broken">Broken</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Location</label>
                  <input
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none font-bold text-sm focus:ring-4 focus:ring-indigo-50 transition-all text-slate-900"
                    value={selectedItem.location}
                    onChange={(e) => setSelectedItem({ ...selectedItem, location: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Condition</label>
                  <select
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none font-bold text-sm focus:ring-4 focus:ring-indigo-50 transition-all appearance-none cursor-pointer text-slate-900"
                    value={selectedItem.condition}
                    onChange={(e) => setSelectedItem({ ...selectedItem, condition: e.target.value })}
                  >
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
                  </select>
                </div>
              </div>
              <Button type="submit" variant="primary" className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-[10px]" loading={submitLoading}>Update Equipment</Button>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Equipment;
