import { useState, useEffect } from 'react';
import { Calendar, Clock, Users, MapPin, Plus, Search, Filter, Edit, Trash2, Eye, X } from 'lucide-react';
import { Button } from '../components';
import { supabase } from '../lib/supabase';

interface ClassData {
  id: number;
  name: string;
  instructor: string;
  schedule_time: string;
  capacity: number;
  enrolled: number;
  status: string;
  room: string;
  type: string;
  description: string;
}

const Classes: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);

  const [newClass, setNewClass] = useState({
    name: '',
    instructor: '',
    schedule_time: '',
    capacity: 20,
    enrolled: 0,
    status: 'Active',
    room: '',
    type: 'Cardio',
    description: ''
  });
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .order('schedule_time', { ascending: true });

      if (error) throw error;
      setClasses(data || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      const { error } = await supabase
        .from('classes')
        .insert([newClass]);

      if (error) throw error;

      setShowAddModal(false);
      setNewClass({
        name: '',
        instructor: '',
        schedule_time: '',
        capacity: 20,
        enrolled: 0,
        status: 'Active',
        room: '',
        type: 'Cardio',
        description: ''
      });
      fetchClasses();
    } catch (error: any) {
      console.error('Error adding class:', error);
      alert(`Failed to add class: ${error.message || 'Please try again.'}`);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleUpdateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass) return;
    setSubmitLoading(true);
    try {
      const { error } = await supabase
        .from('classes')
        .update({
          name: selectedClass.name,
          instructor: selectedClass.instructor,
          schedule_time: selectedClass.schedule_time,
          capacity: selectedClass.capacity,
          room: selectedClass.room,
          type: selectedClass.type,
          status: selectedClass.status,
          description: selectedClass.description
        })
        .eq('id', selectedClass.id);

      if (error) throw error;

      setShowEditModal(false);
      fetchClasses();
    } catch (error: any) {
      console.error('Error updating class:', error);
      alert(`Failed to update class: ${error.message}`);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteClass = async (id: number) => {
    if (!confirm('Are you sure you want to delete this class?')) return;
    try {
      const { error } = await supabase.from('classes').delete().eq('id', id);
      if (error) throw error;
      fetchClasses();
    } catch (error: any) {
      console.error('Error deleting class:', error);
      alert(`Failed to delete class: ${error.message}`);
    }
  };

  const openEditModal = (cls: ClassData) => {
    setSelectedClass({ ...cls });
    setShowEditModal(true);
  };

  const openViewModal = (cls: ClassData) => {
    setSelectedClass(cls);
    setShowViewModal(true);
  };

  const filteredClasses = classes.filter(cls => {
    const matchesSearch = cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.instructor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || cls.status.toLowerCase() === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      case 'full':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'yoga':
        return 'bg-purple-100 text-purple-800';
      case 'cardio':
        return 'bg-red-100 text-red-800';
      case 'strength':
        return 'bg-blue-100 text-blue-800';
      case 'dance':
        return 'bg-pink-100 text-pink-800';
      case 'pilates':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };



  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Classes</h1>
          <p className="text-gray-600">Manage your gym classes and schedules</p>
        </div>
        <Button variant="primary" icon={Plus} onClick={() => setShowAddModal(true)}>
          Schedule Class
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
                placeholder="Search classes by name, instructor, or type..."
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
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="full">Full</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Classes Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading classes...</div>
      ) : filteredClasses.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">No classes found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClasses.map((cls) => (
            <div key={cls.id} className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-200">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{cls.name}</h3>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(cls.type)}`}>
                      {cls.type}
                    </span>
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(cls.status)}`}>
                    {cls.status}
                  </span>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{cls.description}</p>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="h-4 w-4 mr-2" />
                    <span>{cls.instructor}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>{cls.schedule_time ? new Date(cls.schedule_time).toLocaleString() : 'Not set'}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span>{cls.room || 'TBA'}</span>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600">Enrollment</span>
                    <span className="font-medium">{cls.enrolled}/{cls.capacity}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${cls.capacity > 0 ? (cls.enrolled / cls.capacity) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-2">
                    <button
                      className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50"
                      onClick={() => openViewModal(cls)}
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      className="text-green-600 hover:text-green-900 p-2 rounded-lg hover:bg-green-50"
                      onClick={() => openEditModal(cls)}
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteClass(cls.id)}
                      className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm">
                    Manage
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Class Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 relative">
            <button onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 text-gray-400"><X className="h-5 w-5" /></button>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Schedule New Class</h2>
            <form onSubmit={handleAddClass} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Class Name</label>
                <input required type="text" className="w-full border p-2 rounded-lg" value={newClass.name} onChange={e => setNewClass({ ...newClass, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Instructor</label>
                  <input required type="text" className="w-full border p-2 rounded-lg" value={newClass.instructor} onChange={e => setNewClass({ ...newClass, instructor: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <select className="w-full border p-2 rounded-lg" value={newClass.type} onChange={e => setNewClass({ ...newClass, type: e.target.value })}>
                    <option value="Cardio">Cardio</option>
                    <option value="Yoga">Yoga</option>
                    <option value="Strength">Strength</option>
                    <option value="Dance">Dance</option>
                    <option value="Pilates">Pilates</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Schedule Time</label>
                <input type="datetime-local" className="w-full border p-2 rounded-lg" value={newClass.schedule_time} onChange={e => setNewClass({ ...newClass, schedule_time: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Room</label>
                  <input type="text" className="w-full border p-2 rounded-lg" value={newClass.room} onChange={e => setNewClass({ ...newClass, room: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Capacity</label>
                  <input type="number" className="w-full border p-2 rounded-lg" value={newClass.capacity} onChange={e => setNewClass({ ...newClass, capacity: parseInt(e.target.value) })} />
                </div>
              </div>
              <div className="pt-4 flex space-x-3">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowAddModal(false)}>Cancel</Button>
                <Button type="submit" variant="primary" className="flex-1" loading={submitLoading}>Add Class</Button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Edit Class Modal */}
      {showEditModal && selectedClass && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 relative">
            <button onClick={() => setShowEditModal(false)} className="absolute top-4 right-4 text-gray-400"><X className="h-5 w-5" /></button>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Class</h2>
            <form onSubmit={handleUpdateClass} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Class Name</label>
                <input required type="text" className="w-full border p-2 rounded-lg" value={selectedClass.name} onChange={e => setSelectedClass({ ...selectedClass, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Instructor</label>
                  <input required type="text" className="w-full border p-2 rounded-lg" value={selectedClass.instructor} onChange={e => setSelectedClass({ ...selectedClass, instructor: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <select className="w-full border p-2 rounded-lg" value={selectedClass.type} onChange={e => setSelectedClass({ ...selectedClass, type: e.target.value })}>
                    <option value="Cardio">Cardio</option>
                    <option value="Yoga">Yoga</option>
                    <option value="Strength">Strength</option>
                    <option value="Dance">Dance</option>
                    <option value="Pilates">Pilates</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Schedule Time</label>
                <input type="datetime-local" className="w-full border p-2 rounded-lg" value={selectedClass.schedule_time ? selectedClass.schedule_time.slice(0, 16) : ''} onChange={e => setSelectedClass({ ...selectedClass, schedule_time: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Room</label>
                  <input type="text" className="w-full border p-2 rounded-lg" value={selectedClass.room} onChange={e => setSelectedClass({ ...selectedClass, room: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Capacity</label>
                  <input type="number" className="w-full border p-2 rounded-lg" value={selectedClass.capacity} onChange={e => setSelectedClass({ ...selectedClass, capacity: parseInt(e.target.value) })} />
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

      {/* View Class Modal */}
      {showViewModal && selectedClass && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-8 relative">
            <button onClick={() => setShowViewModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            <div className="mb-6">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mb-2 ${getTypeColor(selectedClass.type)}`}>{selectedClass.type}</span>
              <h2 className="text-3xl font-bold text-gray-900">{selectedClass.name}</h2>
              <p className="text-gray-500 mt-2">{selectedClass.description || 'No description provided for this class.'}</p>
            </div>
            <div className="grid grid-cols-2 gap-6 border-t border-gray-100 pt-6">
              <div>
                <label className="block text-sm text-gray-500">Instructor</label>
                <p className="font-semibold text-gray-900">{selectedClass.instructor}</p>
              </div>
              <div>
                <label className="block text-sm text-gray-500">Schedule</label>
                <p className="font-semibold text-gray-900">{selectedClass.schedule_time ? new Date(selectedClass.schedule_time).toLocaleString() : 'TBA'}</p>
              </div>
              <div>
                <label className="block text-sm text-gray-500">Location</label>
                <p className="font-semibold text-gray-900">{selectedClass.room || 'Room TBA'}</p>
              </div>
              <div>
                <label className="block text-sm text-gray-500">Status</label>
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(selectedClass.status)}`}>{selectedClass.status}</span>
              </div>
            </div>
            <div className="mt-8 pt-6 border-t border-gray-100">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-500">Class Enrollment</span>
                <span className="text-sm font-medium">{selectedClass.enrolled} / {selectedClass.capacity} Spots Filled</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div className="bg-blue-600 h-3 rounded-full" style={{ width: `${(selectedClass.enrolled / selectedClass.capacity) * 100}%` }}></div>
              </div>
            </div>
            <div className="mt-8">
              <Button variant="outline" className="w-full" onClick={() => setShowViewModal(false)}>Close Details</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Classes;
