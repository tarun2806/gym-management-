import React, { useState } from 'react';
import { Calendar, Clock, Users, MapPin, Plus, Search, Filter, Edit, Trash2, Eye } from 'lucide-react';

const Classes: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  const classes = [
    {
      id: 1,
      name: 'Yoga Flow',
      instructor: 'Sarah Wilson',
      time: '9:00 AM - 10:00 AM',
      day: 'Monday, Wednesday, Friday',
      capacity: 20,
      enrolled: 18,
      status: 'Active',
      room: 'Studio A',
      type: 'Yoga',
      description: 'A gentle flow yoga class perfect for all levels',
    },
    {
      id: 2,
      name: 'HIIT Training',
      instructor: 'Mike Chen',
      time: '6:00 AM - 7:00 AM',
      day: 'Tuesday, Thursday',
      capacity: 15,
      enrolled: 12,
      status: 'Active',
      room: 'Studio B',
      type: 'Cardio',
      description: 'High-intensity interval training for maximum calorie burn',
    },
    {
      id: 3,
      name: 'Strength Training',
      instructor: 'David Rodriguez',
      time: '5:30 PM - 6:30 PM',
      day: 'Monday, Wednesday, Friday',
      capacity: 25,
      enrolled: 22,
      status: 'Active',
      room: 'Weight Room',
      type: 'Strength',
      description: 'Build muscle and increase strength with compound movements',
    },
    {
      id: 4,
      name: 'Zumba Dance',
      instructor: 'Lisa Thompson',
      time: '7:00 PM - 8:00 PM',
      day: 'Tuesday, Thursday',
      capacity: 30,
      enrolled: 28,
      status: 'Active',
      room: 'Studio A',
      type: 'Dance',
      description: 'Latin-inspired dance fitness class',
    },
    {
      id: 5,
      name: 'Pilates',
      instructor: 'Emma Davis',
      time: '10:30 AM - 11:30 AM',
      day: 'Saturday',
      capacity: 18,
      enrolled: 15,
      status: 'Active',
      room: 'Studio C',
      type: 'Pilates',
      description: 'Core strengthening and flexibility training',
    },
  ];

  const filteredClasses = classes.filter(cls => {
    const matchesSearch = cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cls.instructor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cls.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || cls.status.toLowerCase() === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
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
    switch (type.toLowerCase()) {
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

  const getEnrollmentStatus = (enrolled: number, capacity: number) => {
    const percentage = (enrolled / capacity) * 100;
    if (percentage >= 90) return 'bg-red-100 text-red-800';
    if (percentage >= 75) return 'bg-orange-100 text-orange-800';
    return 'bg-green-100 text-green-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Classes</h1>
          <p className="text-gray-600">Manage your gym classes and schedules</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200">
          <Plus className="h-5 w-5" />
          <span>Schedule Class</span>
        </button>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClasses.map((cls) => (
          <div key={cls.id} className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-200">
            <div className="p-6">
              {/* Header */}
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

              {/* Description */}
              <p className="text-gray-600 text-sm mb-4">{cls.description}</p>

              {/* Details */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Users className="h-4 w-4 mr-2" />
                  <span>{cls.instructor}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>{cls.time}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>{cls.day}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>{cls.room}</span>
                </div>
              </div>

              {/* Enrollment */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600">Enrollment</span>
                  <span className="font-medium">{cls.enrolled}/{cls.capacity}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(cls.enrolled / cls.capacity) * 100}%` }}
                  ></div>
                </div>
                <div className="mt-1">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEnrollmentStatus(cls.enrolled, cls.capacity)}`}>
                    {cls.enrolled >= cls.capacity ? 'Full' : `${Math.round((cls.enrolled / cls.capacity) * 100)}% Full`}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-2">
                  <button className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors duration-200">
                    <Eye className="h-4 w-4" />
                  </button>
                  <button className="text-green-600 hover:text-green-900 p-2 rounded-lg hover:bg-green-50 transition-colors duration-200">
                    <Edit className="h-4 w-4" />
                  </button>
                  <button className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-colors duration-200">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm transition-colors duration-200">
                  Manage
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Class Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{classes.length}</div>
            <div className="text-sm text-gray-600">Total Classes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {classes.filter(c => c.status === 'Active').length}
            </div>
            <div className="text-sm text-gray-600">Active Classes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {classes.reduce((sum, c) => sum + c.enrolled, 0)}
            </div>
            <div className="text-sm text-gray-600">Total Enrolled</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {classes.reduce((sum, c) => sum + c.capacity, 0)}
            </div>
            <div className="text-sm text-gray-600">Total Capacity</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Classes;
