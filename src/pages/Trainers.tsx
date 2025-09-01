import React, { useState } from 'react';
import { Search, Plus, Filter, Star, Calendar, Users, Mail, Phone, MapPin, Edit, Trash2, Eye } from 'lucide-react';

const Trainers: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  const trainers = [
    {
      id: 1,
      name: 'Mike Chen',
      email: 'mike.chen@gympro.com',
      phone: '+1 (555) 123-4567',
      specialization: 'HIIT & Strength Training',
      experience: '8 years',
      rating: 4.8,
      status: 'Active',
      classes: ['HIIT Training', 'Strength Training'],
      schedule: 'Mon-Fri, 6AM-8PM',
      location: 'Main Gym',
      bio: 'Certified personal trainer specializing in high-intensity workouts and strength building.',
      certifications: ['NASM CPT', 'CrossFit L2', 'First Aid'],
      hourlyRate: 75,
    },
    {
      id: 2,
      name: 'Sarah Wilson',
      email: 'sarah.wilson@gympro.com',
      phone: '+1 (555) 234-5678',
      specialization: 'Yoga & Pilates',
      experience: '12 years',
      rating: 4.9,
      status: 'Active',
      classes: ['Yoga Flow', 'Pilates'],
      schedule: 'Mon-Sat, 8AM-6PM',
      location: 'Studio A',
      bio: 'Experienced yoga instructor with expertise in flow yoga and mindfulness practices.',
      certifications: ['RYT-500', 'Pilates Mat', 'Meditation'],
      hourlyRate: 65,
    },
    {
      id: 3,
      name: 'David Rodriguez',
      email: 'david.rodriguez@gympro.com',
      phone: '+1 (555) 345-6789',
      specialization: 'Strength & Conditioning',
      experience: '10 years',
      rating: 4.7,
      status: 'Active',
      classes: ['Strength Training', 'Powerlifting'],
      schedule: 'Mon-Fri, 5AM-9PM',
      location: 'Weight Room',
      bio: 'Former competitive powerlifter turned strength coach, specializing in compound movements.',
      certifications: ['CSCS', 'USAW', 'Precision Nutrition'],
      hourlyRate: 80,
    },
    {
      id: 4,
      name: 'Lisa Thompson',
      email: 'lisa.thompson@gympro.com',
      phone: '+1 (555) 456-7890',
      specialization: 'Dance Fitness',
      experience: '6 years',
      rating: 4.6,
      status: 'Active',
      classes: ['Zumba Dance', 'Cardio Dance'],
      schedule: 'Tue-Thu, 6PM-8PM',
      location: 'Studio A',
      bio: 'Energetic dance instructor bringing Latin rhythms and cardio fitness together.',
      certifications: ['Zumba Basic', 'Aerobics', 'Dance'],
      hourlyRate: 55,
    },
    {
      id: 5,
      name: 'Emma Davis',
      email: 'emma.davis@gympro.com',
      phone: '+1 (555) 567-8901',
      specialization: 'Pilates & Core',
      experience: '9 years',
      rating: 4.8,
      status: 'Active',
      classes: ['Pilates', 'Core Training'],
      schedule: 'Mon-Sat, 9AM-5PM',
      location: 'Studio C',
      bio: 'Pilates specialist focusing on core strength, flexibility, and postural alignment.',
      certifications: ['Pilates Mat', 'Reformer', 'Anatomy'],
      hourlyRate: 70,
    },
  ];

  const filteredTrainers = trainers.filter(trainer => {
    const matchesSearch = trainer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trainer.specialization.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trainer.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || trainer.status.toLowerCase() === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      case 'on leave':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSpecializationColor = (spec: string) => {
    const specializations = {
      'hiit': 'bg-red-100 text-red-800',
      'yoga': 'bg-purple-100 text-purple-800',
      'strength': 'bg-blue-100 text-blue-800',
      'dance': 'bg-pink-100 text-pink-800',
      'pilates': 'bg-green-100 text-green-800',
      'cardio': 'bg-orange-100 text-orange-800',
    };
    
    for (const [key, color] of Object.entries(specializations)) {
      if (spec.toLowerCase().includes(key)) return color;
    }
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Trainers</h1>
          <p className="text-gray-600">Manage your gym trainers and their specializations</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200">
          <Plus className="h-5 w-5" />
          <span>Add Trainer</span>
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
                placeholder="Search trainers by name, specialization, or location..."
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
                <option value="on leave">On Leave</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Trainers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTrainers.map((trainer) => (
          <div key={trainer.id} className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-200">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{trainer.name}</h3>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSpecializationColor(trainer.specialization)}`}>
                    {trainer.specialization}
                  </span>
                </div>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(trainer.status)}`}>
                  {trainer.status}
                </span>
              </div>

              {/* Rating */}
              <div className="flex items-center mb-3">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < Math.floor(trainer.rating)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="ml-2 text-sm text-gray-600">{trainer.rating}</span>
                <span className="ml-2 text-sm text-gray-500">({trainer.experience})</span>
              </div>

              {/* Bio */}
              <p className="text-gray-600 text-sm mb-4">{trainer.bio}</p>

              {/* Details */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="h-4 w-4 mr-2" />
                  <span>{trainer.email}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="h-4 w-4 mr-2" />
                  <span>{trainer.phone}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>{trainer.location}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>{trainer.schedule}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Users className="h-4 w-4 mr-2" />
                  <span>{trainer.classes.length} classes</span>
                </div>
              </div>

              {/* Classes */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Classes:</h4>
                <div className="flex flex-wrap gap-1">
                  {trainer.classes.map((cls, index) => (
                    <span key={index} className="inline-flex px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                      {cls}
                    </span>
                  ))}
                </div>
              </div>

              {/* Certifications */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Certifications:</h4>
                <div className="flex flex-wrap gap-1">
                  {trainer.certifications.map((cert, index) => (
                    <span key={index} className="inline-flex px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                      {cert}
                    </span>
                  ))}
                </div>
              </div>

              {/* Rate */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900">${trainer.hourlyRate}</div>
                  <div className="text-sm text-gray-600">per hour</div>
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
                  Schedule
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Trainer Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{trainers.length}</div>
            <div className="text-sm text-gray-600">Total Trainers</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {trainers.filter(t => t.status === 'Active').length}
            </div>
            <div className="text-sm text-gray-600">Active Trainers</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {trainers.reduce((sum, t) => sum + t.classes.length, 0)}
            </div>
            <div className="text-sm text-gray-600">Total Classes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              ${Math.round(trainers.reduce((sum, t) => sum + t.hourlyRate, 0) / trainers.length)}
            </div>
            <div className="text-sm text-gray-600">Avg. Hourly Rate</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Trainers;
