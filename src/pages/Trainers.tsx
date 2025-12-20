
import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Mail,
  Star,
  Trash2,
  X,
  User,
  Award,
  Briefcase,
  Zap,
  MapPin,
  Smartphone,
  Shield,
  Eye,
  Edit,
  Target
} from 'lucide-react';
import { Button, Card } from '../components';
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
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  // Form state for new trainer
  const [newTrainer, setNewTrainer] = useState({
    name: '',
    email: '',
    phone: '',
    specialization: 'General Fitness',
    experience: '1 Year',
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
        .order('name');
      if (error) throw error;
      setTrainers(data || []);
    } catch (err) {
      console.error('Error fetching trainers:', err);
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
        experience: '1 Year',
        rating: 5.0,
        status: 'Active',
        location: 'Main Gym',
        bio: '',
        hourly_rate: 50
      });
      fetchTrainers();
    } catch (err) {
      console.error(err);
      alert('Failed to add trainer');
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
    } catch (err) {
      console.error(err);
      alert('Failed to update trainer');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteTrainer = async (id: number) => {
    if (!confirm('Are you sure you want to remove this elite professional?')) return;
    try {
      const { error } = await supabase
        .from('trainers')
        .delete()
        .eq('id', id);
      if (error) throw error;
      fetchTrainers();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredTrainers = trainers.filter(trainer => {
    const matchesSearch = trainer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trainer.specialization.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || trainer.status.toLowerCase() === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const openEditModal = (trainer: Trainer) => {
    setSelectedTrainer({ ...trainer });
    setShowEditModal(true);
  };

  const openViewModal = (trainer: Trainer) => {
    setSelectedTrainer(trainer);
    setShowViewModal(true);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      {/* Header Block */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Trainers</h1>
          <p className="text-slate-500 mt-1 text-base">Manage your gym's training staff.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-xl border-slate-200 px-4 h-10 text-sm" icon={Shield}>
            Logs
          </Button>
          <Button variant="primary" className="rounded-xl bg-slate-900 hover:bg-black px-6 h-10 border-0 shadow-md text-sm" icon={Plus} onClick={() => setShowAddModal(true)}>
            Add Trainer
          </Button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-300 h-4 w-4 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            placeholder="Search trainers..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-100 rounded-xl shadow-lg shadow-slate-50 focus:ring-4 focus:ring-blue-50 outline-none transition-all font-bold text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          value={selectedFilter}
          onChange={(e) => setSelectedFilter(e.target.value)}
          className="h-11 px-4 bg-white border border-slate-100 rounded-xl shadow-md outline-none font-bold text-slate-500 cursor-pointer appearance-none min-w-[140px] text-sm"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Trainer Grid */}
      {loading ? (
        <div className="p-12 text-center">
          <div className="animate-spin h-8 w-8 border-4 border-slate-900 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-500 font-bold text-sm">Loading trainers...</p>
        </div>
      ) : filteredTrainers.length === 0 ? (
        <Card className="rounded-2xl border-slate-100 p-12 text-center shadow-lg shadow-slate-200/40">
          <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-200">
            <User className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-black text-slate-900">No Trainers Found</h3>
          <p className="text-slate-500 mt-1 text-sm">No trainers match your search.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTrainers.map((trainer) => (
            <Card key={trainer.id} className="rounded-2xl border-0 shadow-xl shadow-slate-200/40 hover:shadow-indigo-100 transition-all duration-300 group overflow-hidden bg-white">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div className="relative">
                    <div className="h-16 w-16 rounded-xl bg-slate-100 flex items-center justify-center font-black text-xl text-slate-400 overflow-hidden shadow-inner">
                      {trainer.name[0]}
                    </div>
                    <div className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-lg border-2 border-white flex items-center justify-center ${trainer.status.toLowerCase() === 'active' ? 'bg-emerald-400' : 'bg-slate-300'}`}>
                      <Shield className="h-2 w-2 text-white" />
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => openViewModal(trainer)} className="p-2 bg-slate-50 text-slate-400 hover:text-blue-600 rounded-lg transition-all">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button onClick={() => openEditModal(trainer)} className="p-2 bg-slate-50 text-slate-400 hover:text-emerald-600 rounded-lg transition-all">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDeleteTrainer(trainer.id)} className="p-2 bg-slate-50 text-slate-400 hover:text-rose-600 rounded-lg transition-all">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">{trainer.name}</h3>
                  <div className="inline-flex items-center px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-blue-100">
                    <Zap className="h-2.5 w-2.5 mr-1.5" />
                    {trainer.specialization}
                  </div>
                  <p className="text-slate-500 text-xs font-medium leading-relaxed italic line-clamp-2">
                    "{trainer.bio || 'No bio provided.'}"
                  </p>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 group-hover:bg-white transition-colors">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Exp</p>
                    <p className="text-xs font-black text-slate-900">{trainer.experience}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 group-hover:bg-white transition-colors">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Rating</p>
                    <div className="flex items-center text-xs font-black text-slate-900">
                      {trainer.rating} <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400 ml-1" />
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-50 flex gap-3">
                  <a href={`tel:${trainer.phone}`} className="flex-1 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center hover:scale-105 transition-transform">
                    <Smartphone className="h-4 w-4" />
                  </a>
                  <a href={`mailto:${trainer.email}`} className="flex-1 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:scale-105 transition-transform shadow-md shadow-blue-50">
                    <Mail className="h-4 w-4" />
                  </a>
                  <div className="flex-1 flex items-center justify-center font-black text-slate-900 text-sm">
                    ${trainer.hourly_rate}<span className="text-[9px] text-slate-400 ml-1">/hr</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Trainer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/10 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <Card className="max-w-2xl w-full p-0 rounded-2xl border-0 shadow-2xl bg-white overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex flex-col md:flex-row">
              <div className="md:w-1/3 bg-slate-900 p-8 text-white flex flex-col justify-between">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">Add Trainer</h2>
                  <p className="text-slate-400 mt-4 text-sm">Enter details to add a new trainer.</p>
                </div>
              </div>

              <div className="flex-1 p-8 md:p-10 relative">
                <button onClick={() => setShowAddModal(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 transition-colors">
                  <X className="h-5 w-5" />
                </button>

                <form onSubmit={handleAddTrainer} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Name</label>
                      <input
                        type="text"
                        required
                        className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-blue-50 outline-none text-sm transition-all"
                        placeholder="Name..."
                        value={newTrainer.name}
                        onChange={(e) => setNewTrainer({ ...newTrainer, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email</label>
                      <input
                        type="email"
                        required
                        className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-blue-50 outline-none text-sm transition-all"
                        placeholder="email@example.com"
                        value={newTrainer.email}
                        onChange={(e) => setNewTrainer({ ...newTrainer, email: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Specialization</label>
                      <input
                        type="text"
                        className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-blue-50 outline-none text-sm"
                        placeholder="Specialty..."
                        value={newTrainer.specialization}
                        onChange={(e) => setNewTrainer({ ...newTrainer, specialization: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Experience</label>
                      <input
                        type="text"
                        className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-blue-50 outline-none text-sm"
                        placeholder="Years..."
                        value={newTrainer.experience}
                        onChange={(e) => setNewTrainer({ ...newTrainer, experience: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Rate ($)</label>
                      <input
                        type="number"
                        className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-blue-50 outline-none text-sm"
                        value={newTrainer.hourly_rate}
                        onChange={(e) => setNewTrainer({ ...newTrainer, hourly_rate: parseInt(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Location</label>
                      <input
                        type="text"
                        className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-blue-50 outline-none text-sm"
                        placeholder="Room..."
                        value={newTrainer.location}
                        onChange={(e) => setNewTrainer({ ...newTrainer, location: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Bio</label>
                    <textarea
                      className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-blue-50 outline-none text-sm min-h-[80px]"
                      value={newTrainer.bio}
                      onChange={(e) => setNewTrainer({ ...newTrainer, bio: e.target.value })}
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button type="button" variant="outline" className="flex-1 rounded-xl py-3 text-xs" onClick={() => setShowAddModal(false)}>Cancel</Button>
                    <Button type="submit" variant="primary" className="flex-2 rounded-xl py-3 bg-slate-900 border-0 shadow-lg text-xs" loading={submitLoading}>Add Trainer</Button>
                  </div>
                </form>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Edit Trainer Modal */}
      {showEditModal && selectedTrainer && (
        <div className="fixed inset-0 bg-slate-900/10 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <Card className="max-w-xl w-full p-8 rounded-2xl border-0 shadow-2xl bg-white overflow-hidden animate-in zoom-in-95 duration-200 relative">
            <button onClick={() => setShowEditModal(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 transition-colors">
              <X className="h-5 w-5" />
            </button>

            <div className="mb-8 text-center">
              <h2 className="text-2xl font-bold text-slate-900">Edit Trainer</h2>
              <p className="text-slate-500 mt-1 text-sm italic">{selectedTrainer.name}</p>
            </div>

            <form onSubmit={handleUpdateTrainer} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Name</label>
                  <input type="text" className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-blue-50 text-sm outline-none" value={selectedTrainer.name} onChange={e => setSelectedTrainer({ ...selectedTrainer, name: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Specialization</label>
                  <input type="text" className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-blue-50 text-sm outline-none" value={selectedTrainer.specialization} onChange={e => setSelectedTrainer({ ...selectedTrainer, specialization: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Rate ($)</label>
                  <input type="number" className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-blue-50 text-sm outline-none" value={selectedTrainer.hourly_rate} onChange={e => setSelectedTrainer({ ...selectedTrainer, hourly_rate: parseInt(e.target.value) })} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Status</label>
                  <select className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-blue-50 text-sm outline-none" value={selectedTrainer.status} onChange={e => setSelectedTrainer({ ...selectedTrainer, status: e.target.value })}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Bio</label>
                <textarea className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-blue-50 text-sm outline-none min-h-[80px]" value={selectedTrainer.bio} onChange={e => setSelectedTrainer({ ...selectedTrainer, bio: e.target.value })} />
              </div>

              <div className="flex gap-3 pt-6">
                <Button type="button" variant="outline" className="flex-1 rounded-xl py-3 text-xs" onClick={() => setShowEditModal(false)}>Cancel</Button>
                <Button type="submit" variant="primary" className="flex-2 rounded-xl py-3 bg-blue-600 text-xs shadow-lg" loading={submitLoading}>Save Changes</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* View Trainer Modal */}
      {showViewModal && selectedTrainer && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <Card className="max-w-lg w-full p-0 rounded-2xl border-0 shadow-2xl bg-white overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 relative">
              <button onClick={() => setShowViewModal(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 transition-colors">
                <X className="h-5 w-5" />
              </button>

              <div className="text-center mb-8">
                <div className="h-20 w-20 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4 shadow-inner overflow-hidden">
                  <div className="text-3xl font-black text-slate-300">{selectedTrainer.name[0]}</div>
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">{selectedTrainer.name}</h2>
                <p className="text-blue-600 font-bold uppercase tracking-widest text-[9px] mt-2 flex items-center justify-center">
                  <Award className="h-3.5 w-3.5 mr-1.5" />
                  {selectedTrainer.specialization}
                </p>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center">
                      <Briefcase className="h-3 w-3 mr-1.5" /> Experience
                    </p>
                    <p className="text-sm font-black text-slate-900">{selectedTrainer.experience}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center">
                      <Target className="h-3 w-3 mr-1.5" /> Rating
                    </p>
                    <p className="text-sm font-black text-slate-900 flex items-center">
                      {selectedTrainer.rating} <Star className="h-3 w-3 fill-amber-400 text-amber-400 ml-1.5" />
                    </p>
                  </div>
                </div>

                <div className="p-6 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 text-center">Bio</p>
                  <p className="text-slate-600 text-sm leading-relaxed italic text-center">
                    "{selectedTrainer.bio || 'No bio provided.'}"
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center gap-3 text-xs font-bold text-slate-500 bg-white p-3 rounded-xl border border-slate-50">
                    <Mail className="h-4 w-4 text-blue-500" />
                    {selectedTrainer.email}
                  </div>
                  <div className="flex items-center gap-3 text-xs font-bold text-slate-500 bg-white p-3 rounded-xl border border-slate-50">
                    <MapPin className="h-4 w-4 text-rose-500" />
                    {selectedTrainer.location}
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <Button variant="primary" className="w-full rounded-xl py-3 bg-slate-900 font-black uppercase tracking-widest text-[10px]" onClick={() => setShowViewModal(false)}>
                  Close
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Trainers;
