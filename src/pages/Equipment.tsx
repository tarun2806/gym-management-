import { useState, useEffect } from 'react';
import { Search, Plus, MapPin, Edit, Trash2, Eye, Wrench, X } from 'lucide-react';
import { Button } from '../components';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<EquipmentItem | null>(null);

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
        .order('name', { ascending: true });

      if (error) throw error;
      setEquipment(data || []);
    } catch (error) {
      console.error('Error fetching equipment:', error);
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
    } catch (error: any) {
      console.error('Error adding equipment:', error);
      alert(`Failed to add equipment: ${error.message || 'Please try again.'}`);
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
        .update({
          name: selectedItem.name,
          type: selectedItem.type,
          brand: selectedItem.brand,
          model: selectedItem.model,
          location: selectedItem.location,
          status: selectedItem.status,
          condition: selectedItem.condition,
          serial_number: selectedItem.serial_number,
          notes: selectedItem.notes
        })
        .eq('id', selectedItem.id);

      if (error) throw error;

      setShowEditModal(false);
      fetchEquipment();
    } catch (error: any) {
      console.error('Error updating equipment:', error);
      alert(`Failed to update equipment: ${error.message}`);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteEquipment = async (id: number) => {
    if (!confirm('Are you sure you want to delete this equipment?')) return;
    try {
      const { error } = await supabase.from('equipment').delete().eq('id', id);
      if (error) throw error;
      fetchEquipment();
    } catch (error: any) {
      console.error('Error deleting equipment:', error);
      alert(`Failed to delete equipment: ${error.message}`);
    }
  };

  const openEditModal = (item: EquipmentItem) => {
    setSelectedItem({ ...item });
    setShowEditModal(true);
  };

  const openViewModal = (item: EquipmentItem) => {
    setSelectedItem(item);
    setShowViewModal(true);
  };

  const filteredEquipment = equipment.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.type && item.type.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.location && item.location.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFilter = selectedFilter === 'all' || (item.status && item.status.toLowerCase().includes(selectedFilter));
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'operational':
        return 'bg-green-100 text-green-800';
      case 'maintenance required':
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      case 'out of service':
      case 'broken':
        return 'bg-red-100 text-red-800';
      case 'replacement needed':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };



  const getTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'cardio':
        return 'bg-red-100 text-red-800';
      case 'strength':
        return 'bg-blue-100 text-blue-800';
      case 'accessories':
        return 'bg-purple-100 text-purple-800';
      case 'machines':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getMaintenanceStatus = (nextMaintenance?: string) => {
    if (!nextMaintenance) return { color: 'bg-gray-100 text-gray-800', text: 'Not scheduled' };
    const nextDate = new Date(nextMaintenance);
    const today = new Date();
    const daysUntil = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 3600 * 24));

    if (daysUntil < 0) return { color: 'bg-red-100 text-red-800', text: 'Overdue' };
    if (daysUntil <= 30) return { color: 'bg-yellow-100 text-yellow-800', text: `${daysUntil} days` };
    return { color: 'bg-green-100 text-green-800', text: `${daysUntil} days` };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Equipment</h1>
          <p className="text-gray-600">Manage your gym equipment and maintenance schedules</p>
        </div>
        <Button variant="primary" icon={Plus} onClick={() => setShowAddModal(true)}>
          Add Equipment
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search equipment by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
          <select
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="all">All Status</option>
            <option value="operational">Operational</option>
            <option value="maintenance">Maintenance</option>
            <option value="broken">Broken</option>
          </select>
        </div>
      </div>

      {/* Equipment Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading equipment...</div>
      ) : filteredEquipment.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Wrench className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">No equipment found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEquipment.map((item) => {
            const maintenanceStatus = getMaintenanceStatus(item.next_maintenance);
            return (
              <div key={item.id} className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-200">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{item.name}</h3>
                      <div className="flex space-x-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(item.type)}`}>
                          {item.type}
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="font-medium w-20">Brand:</span>
                      <span>{item.brand || 'N/A'}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="font-medium w-20">Location:</span>
                      <span className="flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        {item.location || 'Not specified'}
                      </span>
                    </div>
                  </div>

                  {/* Maintenance Info */}
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Maintenance Schedule</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last:</span>
                        <span>{item.last_maintenance ? new Date(item.last_maintenance).toLocaleDateString() : 'Never'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Next Due:</span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${maintenanceStatus.color}`}>
                          {maintenanceStatus.text}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex items-center space-x-2">
                      <button
                        className="text-blue-600 hover:text-blue-900 p-2"
                        onClick={() => openViewModal(item)}
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        className="text-green-600 hover:text-green-900 p-2"
                        onClick={() => openEditModal(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteEquipment(item.id)}
                        className="text-red-600 hover:text-red-900 p-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => openViewModal(item)}>Details</Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Equipment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 relative">
            <button onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 text-gray-400"><X className="h-5 w-5" /></button>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New Equipment</h2>
            <form onSubmit={handleAddEquipment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Equipment Name</label>
                <input required type="text" className="w-full border p-2 rounded-lg" value={newEquipment.name} onChange={e => setNewEquipment({ ...newEquipment, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <select className="w-full border p-2 rounded-lg" value={newEquipment.type} onChange={e => setNewEquipment({ ...newEquipment, type: e.target.value })}>
                    <option value="Cardio">Cardio</option>
                    <option value="Strength">Strength</option>
                    <option value="Machines">Machines</option>
                    <option value="Accessories">Accessories</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Brand</label>
                  <input type="text" className="w-full border p-2 rounded-lg" value={newEquipment.brand} onChange={e => setNewEquipment({ ...newEquipment, brand: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Location</label>
                  <input type="text" className="w-full border p-2 rounded-lg" value={newEquipment.location} onChange={e => setNewEquipment({ ...newEquipment, location: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select className="w-full border p-2 rounded-lg" value={newEquipment.status} onChange={e => setNewEquipment({ ...newEquipment, status: e.target.value })}>
                    <option value="operational">Operational</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="broken">Broken</option>
                  </select>
                </div>
              </div>
              <div className="pt-4 flex space-x-3">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowAddModal(false)}>Cancel</Button>
                <Button type="submit" variant="primary" className="flex-1" loading={submitLoading}>Add Equipment</Button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Edit Equipment Modal */}
      {showEditModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 relative">
            <button onClick={() => setShowEditModal(false)} className="absolute top-4 right-4 text-gray-400"><X className="h-5 w-5" /></button>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Equipment</h2>
            <form onSubmit={handleUpdateEquipment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input required type="text" className="w-full border p-2 rounded-lg" value={selectedItem.name} onChange={e => setSelectedItem({ ...selectedItem, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <select className="w-full border p-2 rounded-lg" value={selectedItem.type} onChange={e => setSelectedItem({ ...selectedItem, type: e.target.value })}>
                    <option value="Cardio">Cardio</option>
                    <option value="Strength">Strength</option>
                    <option value="Machines">Machines</option>
                    <option value="Accessories">Accessories</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select className="w-full border p-2 rounded-lg" value={selectedItem.status} onChange={e => setSelectedItem({ ...selectedItem, status: e.target.value })}>
                    <option value="operational">Operational</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="broken">Broken</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <input type="text" className="w-full border p-2 rounded-lg" value={selectedItem.location} onChange={e => setSelectedItem({ ...selectedItem, location: e.target.value })} />
              </div>
              <div className="pt-4 flex space-x-3">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowEditModal(false)}>Cancel</Button>
                <Button type="submit" variant="primary" className="flex-1" loading={submitLoading}>Save Changes</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Equipment Modal */}
      {showViewModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-8 relative">
            <button onClick={() => setShowViewModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            <div className="flex items-center mb-6">
              <div className="h-16 w-16 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center mr-4">
                <Wrench className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedItem.name}</h2>
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${getTypeColor(selectedItem.type)}`}>{selectedItem.type}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-y-4 gap-x-8 border-t border-gray-100 pt-6">
              <div><span className="text-sm text-gray-500 block">Brand / Model</span><p className="font-medium">{selectedItem.brand} {selectedItem.model}</p></div>
              <div><span className="text-sm text-gray-500 block">Status</span><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(selectedItem.status)}`}>{selectedItem.status}</span></div>
              <div><span className="text-sm text-gray-500 block">Location</span><p className="font-medium underline decoration-blue-200">{selectedItem.location || 'Not Set'}</p></div>
              <div><span className="text-sm text-gray-500 block">Last Maintained</span><p className="font-medium">{selectedItem.last_maintenance ? new Date(selectedItem.last_maintenance).toLocaleDateString() : 'Never'}</p></div>
              <div><span className="text-sm text-gray-500 block">Condition</span><p className="font-medium">{selectedItem.condition}</p></div>
              <div><span className="text-sm text-gray-500 block">Serial Number</span><p className="font-medium text-xs font-mono">{selectedItem.serial_number || 'N/A'}</p></div>
            </div>

            <div className="mt-6 bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Technical Notes</h4>
              <p className="text-sm text-gray-600 italic">"{selectedItem.notes || 'No maintenance notes or technical specifications recorded for this unit.'}"</p>
            </div>

            <div className="mt-8">
              <Button variant="primary" className="w-full" onClick={() => setShowViewModal(false)}>Close Specifications</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Equipment;
