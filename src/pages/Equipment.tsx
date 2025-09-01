import React, { useState } from 'react';
import { Search, Plus, Filter, AlertTriangle, Clock, MapPin, Edit, Trash2, Eye, Wrench } from 'lucide-react';

const Equipment: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  const equipment = [
    {
      id: 1,
      name: 'Treadmill #1',
      type: 'Cardio',
      brand: 'Life Fitness',
      model: 'T5',
      location: 'Cardio Area',
      status: 'Operational',
      lastMaintenance: '2024-11-15',
      nextMaintenance: '2025-02-15',
      condition: 'Excellent',
      serialNumber: 'LF-T5-001',
      purchaseDate: '2023-01-15',
      warranty: '2026-01-15',
      notes: 'Regular maintenance performed, working perfectly',
    },
    {
      id: 2,
      name: 'Treadmill #2',
      type: 'Cardio',
      brand: 'Life Fitness',
      model: 'T5',
      location: 'Cardio Area',
      status: 'Maintenance Required',
      lastMaintenance: '2024-10-20',
      nextMaintenance: '2024-12-20',
      condition: 'Good',
      serialNumber: 'LF-T5-002',
      purchaseDate: '2023-01-15',
      warranty: '2026-01-15',
      notes: 'Belt showing signs of wear, needs replacement soon',
    },
    {
      id: 3,
      name: 'Elliptical #1',
      type: 'Cardio',
      brand: 'Precor',
      model: 'EFX 835',
      location: 'Cardio Area',
      status: 'Operational',
      lastMaintenance: '2024-11-10',
      nextMaintenance: '2025-02-10',
      condition: 'Excellent',
      serialNumber: 'PC-EFX-001',
      purchaseDate: '2023-03-20',
      warranty: '2026-03-20',
      notes: 'Smooth operation, no issues reported',
    },
    {
      id: 4,
      name: 'Bench Press',
      type: 'Strength',
      brand: 'Hammer Strength',
      model: 'HS-BP-001',
      location: 'Weight Room',
      status: 'Operational',
      lastMaintenance: '2024-11-01',
      nextMaintenance: '2025-02-01',
      condition: 'Excellent',
      serialNumber: 'HS-BP-001',
      purchaseDate: '2022-08-10',
      warranty: '2025-08-10',
      notes: 'Sturdy construction, handles heavy weights well',
    },
    {
      id: 5,
      name: 'Dumbbell Set (5-50 lbs)',
      type: 'Strength',
      brand: 'Rogue Fitness',
      model: 'DB-SET-001',
      location: 'Weight Room',
      status: 'Operational',
      lastMaintenance: '2024-11-05',
      nextMaintenance: '2025-02-05',
      condition: 'Good',
      serialNumber: 'RG-DB-001',
      purchaseDate: '2022-06-15',
      warranty: '2025-06-15',
      notes: 'Some weights showing minor wear, still functional',
    },
    {
      id: 6,
      name: 'Yoga Mats',
      type: 'Accessories',
      brand: 'Manduka',
      model: 'PRO',
      location: 'Studio A',
      status: 'Replacement Needed',
      lastMaintenance: '2024-09-15',
      nextMaintenance: '2024-12-15',
      condition: 'Fair',
      serialNumber: 'MK-MAT-001',
      purchaseDate: '2022-12-01',
      warranty: '2025-12-01',
      notes: 'Several mats showing significant wear, recommend replacement',
    },
  ];

  const filteredEquipment = equipment.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || item.status.toLowerCase().includes(selectedFilter);
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'operational':
        return 'bg-green-100 text-green-800';
      case 'maintenance required':
        return 'bg-yellow-100 text-yellow-800';
      case 'out of service':
        return 'bg-red-100 text-red-800';
      case 'replacement needed':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'excellent':
        return 'bg-green-100 text-green-800';
      case 'good':
        return 'bg-blue-100 text-blue-800';
      case 'fair':
        return 'bg-yellow-100 text-yellow-800';
      case 'poor':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
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

  const getMaintenanceStatus = (nextMaintenance: string) => {
    const nextDate = new Date(nextMaintenance);
    const today = new Date();
    const daysUntil = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
    
    if (daysUntil < 0) return { color: 'bg-red-100 text-red-800', text: 'Overdue' };
    if (daysUntil <= 30) return { color: 'bg-yellow-100 text-yellow-800', text: `${daysUntil} days` };
    return { color: 'bg-green-100 text-green-800', text: `${daysUntil} days` };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Equipment</h1>
          <p className="text-gray-600">Manage your gym equipment and maintenance schedules</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200">
          <Plus className="h-5 w-5" />
          <span>Add Equipment</span>
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
                placeholder="Search equipment by name, type, or location..."
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
                <option value="operational">Operational</option>
                <option value="maintenance">Maintenance Required</option>
                <option value="out of service">Out of Service</option>
                <option value="replacement">Replacement Needed</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Equipment Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEquipment.map((item) => {
          const maintenanceStatus = getMaintenanceStatus(item.nextMaintenance);
          return (
            <div key={item.id} className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-200">
              <div className="p-6">
                {/* Header */}
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
                  <div className="text-right">
                    <div className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getConditionColor(item.condition)}`}>
                      {item.condition}
                    </div>
                  </div>
                </div>

                {/* Equipment Details */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="font-medium w-20">Brand:</span>
                    <span>{item.brand}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="font-medium w-20">Model:</span>
                    <span>{item.model}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="font-medium w-20">Location:</span>
                    <span className="flex items-center">
                      <MapPin className="h-3 w-3 mr-1" />
                      {item.location}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="font-medium w-20">Serial #:</span>
                    <span className="font-mono text-xs">{item.serialNumber}</span>
                  </div>
                </div>

                {/* Maintenance Info */}
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Maintenance Schedule</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last:</span>
                      <span>{new Date(item.lastMaintenance).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Next:</span>
                      <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {new Date(item.nextMaintenance).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${maintenanceStatus.color}`}>
                        {maintenanceStatus.text}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Purchase Info */}
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Purchase Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Purchased:</span>
                      <span>{new Date(item.purchaseDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Warranty:</span>
                      <span>{new Date(item.warranty).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {item.notes && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900 mb-1">Notes</h4>
                    <p className="text-sm text-gray-700">{item.notes}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-2">
                    <button className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors duration-200">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="text-green-600 hover:text-green-900 p-2 rounded-lg hover:bg-green-50 transition-colors duration-200">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button className="text-orange-600 hover:text-orange-900 p-2 rounded-lg hover:bg-orange-50 transition-colors duration-200">
                      <Wrench className="h-4 w-4" />
                    </button>
                    <button className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-colors duration-200">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm transition-colors duration-200">
                    Details
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Equipment Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{equipment.length}</div>
            <div className="text-sm text-gray-600">Total Equipment</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {equipment.filter(e => e.status === 'Operational').length}
            </div>
            <div className="text-sm text-gray-600">Operational</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {equipment.filter(e => e.status.includes('Maintenance') || e.status.includes('Replacement')).length}
            </div>
            <div className="text-sm text-gray-600">Needs Attention</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {equipment.filter(e => {
                const nextDate = new Date(e.nextMaintenance);
                const today = new Date();
                return nextDate < today;
              }).length}
            </div>
            <div className="text-sm text-gray-600">Maintenance Overdue</div>
          </div>
        </div>
      </div>

      {/* Maintenance Alerts */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Maintenance Alerts</h3>
        <div className="space-y-3">
          {equipment
            .filter(e => {
              const nextDate = new Date(e.nextMaintenance);
              const today = new Date();
              const daysUntil = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
              return daysUntil <= 30;
            })
            .map((item) => {
              const maintenanceStatus = getMaintenanceStatus(item.nextMaintenance);
              return (
                <div key={item.id} className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-600">
                        Maintenance due: {new Date(item.nextMaintenance).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${maintenanceStatus.color}`}>
                      {maintenanceStatus.text}
                    </span>
                    <button className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded-lg text-sm transition-colors duration-200">
                      Schedule
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};

export default Equipment;
