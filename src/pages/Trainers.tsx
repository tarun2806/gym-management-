import { useState, useEffect } from 'react';
import { Search, Plus, Star, Mail, Phone, MapPin, Edit, Trash2, Eye, X } from 'lucide-react';
import { Button } from '../components';
import { supabase } from '../lib/supabase';

interface Trainer {
  id: number;
  name: string;
  email: string;
  phone: string;
  specialization: string;
  experience: string;
  rating: number;
  status: string;
  location: string;
  bio: string;
  hourly_rate: number;
}

const Trainers: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);

  const [newTrainer, setNewTrainer] = useState({
    name: '',
    email: '',
    phone: '',
    specialization: 'General Fitness',
    experience: '1 year',
    rating: 5.0,
    status: 'Active',
    location: 'Main Gym',
    bio: '',
    hourly_rate: 50
  });
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    fetchTrainers();
  }, []);

  const fetchTrainers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('trainers')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching trainers:', error);
        setTrainers([]);
      } else {
        setTrainers(data || []);
      }
    } catch (error) {
      console.error('Error fetching trainers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTrainer = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      const { error } = await supabase
        .from('trainers')
        .insert([newTrainer]);

      if (error) throw error;

      setShowAddModal(false);
      setNewTrainer({
        name: '',
        email: '',
        phone: '',
        specialization: 'General Fitness',
        experience: '1 year',
        rating: 5.0,
        status: 'Active',
        location: 'Main Gym',
        bio: '',
        hourly_rate: 50
      });
      fetchTrainers();
    } catch (error: any) {
      console.error('Error adding trainer:', error);
      alert(`Failed to add trainer: ${error.message || 'Please ensure the trainers table exists in Supabase.'}`);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleUpdateTrainer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrainer) return;
    setSubmitLoading(true);
    try {
      const { error } = await supabase
        .from('trainers')
        .update({
          name: selectedTrainer.name,
          email: selectedTrainer.email,
          phone: selectedTrainer.phone,
          specialization: selectedTrainer.specialization,
          experience: selectedTrainer.experience,
          status: selectedTrainer.status,
          location: selectedTrainer.location,
          bio: selectedTrainer.bio,
          hourly_rate: selectedTrainer.hourly_rate
        })
        .eq('id', selectedTrainer.id);

      if (error) throw error;

      setShowEditModal(false);
      fetchTrainers();
    } catch (error: any) {
      console.error('Error updating trainer:', error);
      alert(`Failed to update trainer: ${error.message}`);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteTrainer = async (id: number) => {
    if (!confirm('Are you sure you want to delete this trainer?')) return;
    try {
      const { error } = await supabase.from('trainers').delete().eq('id', id);
      if (error) throw error;
      fetchTrainers();
    } catch (error: any) {
      console.error('Error deleting trainer:', error);
      alert(`Failed to delete trainer: ${error.message}`);
    }
  };

  const openEditModal = (trainer: Trainer) => {
    setSelectedTrainer({ ...trainer });
    setShowEditModal(true);
  };

  const openViewModal = (trainer: Trainer) => {
    setSelectedTrainer(trainer);
    setShowViewModal(true);
  };

  const filteredTrainers = trainers.filter(trainer => {
    const matchesSearch = trainer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trainer.specialization.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || trainer.status.toLowerCase() === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Trainers</h1>
          <p className="text-gray-600">Manage your gym trainers and their specializations</p>
        </div>
        <Button variant="primary" icon={Plus} onClick={() => setShowAddModal(true)}>
          Add Trainer
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search trainers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <select
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Trainers Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading trainers...</div>
      ) : filteredTrainers.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Mail className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">No trainers found. Please add them in Supabase.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTrainers.map((trainer) => (
            <div key={trainer.id} className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-200">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{trainer.name}</h3>
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {trainer.specialization}
                    </span>
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(trainer.status)}`}>
                    {trainer.status}
                  </span>
                </div>

                <div className="flex items-center mb-3">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`h-4 w-4 ${i < Math.floor(trainer.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                    ))}
                  </div>
                  <span className="ml-2 text-sm text-gray-600">{trainer.rating}</span>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{trainer.bio}</p>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center text-sm text-gray-600"><Mail className="h-4 w-4 mr-2" /><span>{trainer.email}</span></div>
                  <div className="flex items-center text-sm text-gray-600"><Phone className="h-4 w-4 mr-2" /><span>{trainer.phone}</span></div>
                  <div className="flex items-center text-sm text-gray-600"><MapPin className="h-4 w-4 mr-2" /><span>{trainer.location}</span></div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-2">
                    <button
                      className="text-blue-600 hover:text-blue-900 p-2"
                      onClick={() => openViewModal(trainer)}
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      className="text-green-600 hover:text-green-900 p-2"
                      onClick={() => openEditModal(trainer)}
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTrainer(trainer.id)}
                      className="text-red-600 hover:text-red-900 p-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="text-sm font-bold text-gray-900">${trainer.hourly_rate}/hr</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Trainer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 relative">
            <button onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 text-gray-400"><X className="h-5 w-5" /></button>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New Trainer</h2>
            <form onSubmit={handleAddTrainer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <input required type="text" className="w-full border p-2 rounded-lg" value={newTrainer.name} onChange={e => setNewTrainer({ ...newTrainer, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input required type="email" className="w-full border p-2 rounded-lg" value={newTrainer.email} onChange={e => setNewTrainer({ ...newTrainer, email: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input type="text" className="w-full border p-2 rounded-lg" value={newTrainer.phone} onChange={e => setNewTrainer({ ...newTrainer, phone: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Specialization</label>
                  <input type="text" className="w-full border p-2 rounded-lg" value={newTrainer.specialization} onChange={e => setNewTrainer({ ...newTrainer, specialization: e.target.value })} />
                </div>
              </div>
              <div className="pt-4 flex space-x-3">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowAddModal(false)}>Cancel</Button>
                <Button type="submit" variant="primary" className="flex-1" loading={submitLoading}>Add Trainer</Button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Edit Trainer Modal */}
      {showEditModal && selectedTrainer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 relative">
            <button onClick={() => setShowEditModal(false)} className="absolute top-4 right-4 text-gray-400"><X className="h-5 w-5" /></button>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Trainer</h2>
            <form onSubmit={handleUpdateTrainer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <input required type="text" className="w-full border p-2 rounded-lg" value={selectedTrainer.name} onChange={e => setSelectedTrainer({ ...selectedTrainer, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Specialization</label>
                <input required type="text" className="w-full border p-2 rounded-lg" value={selectedTrainer.specialization} onChange={e => setSelectedTrainer({ ...selectedTrainer, specialization: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Hourly Rate ($)</label>
                  <input type="number" className="w-full border p-2 rounded-lg" value={selectedTrainer.hourly_rate} onChange={e => setSelectedTrainer({ ...selectedTrainer, hourly_rate: parseInt(e.target.value) })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select className="w-full border p-2 rounded-lg" value={selectedTrainer.status} onChange={e => setSelectedTrainer({ ...selectedTrainer, status: e.target.value })}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Bio</label>
                <textarea className="w-full border p-2 rounded-lg" rows={3} value={selectedTrainer.bio} onChange={e => setSelectedTrainer({ ...selectedTrainer, bio: e.target.value })} />
              </div>
              <div className="pt-4 flex space-x-3">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowEditModal(false)}>Cancel</Button>
                <Button type="submit" variant="primary" className="flex-1" loading={submitLoading}>Save Changes</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Trainer Modal */}
      {showViewModal && selectedTrainer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-8 relative">
            <button onClick={() => setShowViewModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            <div className="text-center mb-6">
              <div className="h-24 w-24 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mx-auto mb-4">
                <Star className="h-10 w-10 fill-current" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">{selectedTrainer.name}</h2>
              <p className="text-blue-600 font-medium">{selectedTrainer.specialization}</p>
            </div>
            <div className="space-y-4 border-t border-gray-100 pt-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">About Trainer</h4>
                <p className="text-sm text-gray-700 leading-relaxed">{selectedTrainer.bio || 'No bio available for this trainer.'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col"><span className="text-gray-500 text-xs text-center">Hourly Rate</span><span className="font-bold text-gray-900 text-center">${selectedTrainer.hourly_rate}/hr</span></div>
                <div className="flex flex-col"><span className="text-gray-500 text-xs text-center">Experience</span><span className="font-bold text-gray-900 text-center">{selectedTrainer.experience}</span></div>
              </div>
              <div className="flex justify-between items-center text-sm pt-2">
                <span className="text-gray-500 flex items-center"><Mail className="h-4 w-4 mr-2" /> {selectedTrainer.email}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(selectedTrainer.status)}`}>{selectedTrainer.status}</span>
              </div>
            </div>
            <div className="mt-8">
              <Button variant="outline" className="w-full" onClick={() => setShowViewModal(false)}>Close Profile</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Trainers;
