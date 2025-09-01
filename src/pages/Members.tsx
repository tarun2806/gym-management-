import { useState } from 'react';
import { Plus, MoreVertical, Edit, Trash2, Eye, Phone } from 'lucide-react';
import { Button, SearchInput } from '../components';

const Members: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  // Form state for future use
  // const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  // const [formData, setFormData] = useState({
  //   name: '',
  //   email: '',
  //   phone: '',
  //   membershipType: 'Basic',
  //   trainer: '',
  // });

  const [members, setMembers] = useState([
    {
      id: 1,
      name: 'Sarah Johnson',
      email: 'sarah.johnson@email.com',
      phone: '+1 (555) 123-4567',
      membershipType: 'Premium',
      status: 'Active',
      joinDate: '2024-01-15',
      lastVisit: '2024-12-19',
      trainer: 'Mike Chen',
    },
    {
      id: 2,
      name: 'John Smith',
      email: 'john.smith@email.com',
      phone: '+1 (555) 234-5678',
      membershipType: 'Basic',
      status: 'Active',
      joinDate: '2024-02-20',
      lastVisit: '2024-12-18',
      trainer: 'David Rodriguez',
    },
    {
      id: 3,
      name: 'Emily Davis',
      email: 'emily.davis@email.com',
      phone: '+1 (555) 345-6789',
      membershipType: 'Premium',
      status: 'Inactive',
      joinDate: '2024-03-10',
      lastVisit: '2024-11-25',
      trainer: 'Sarah Wilson',
    },
    {
      id: 4,
      name: 'Michael Brown',
      email: 'michael.brown@email.com',
      phone: '+1 (555) 456-7890',
      membershipType: 'Basic',
      status: 'Active',
      joinDate: '2024-04-05',
      lastVisit: '2024-12-19',
      trainer: 'Mike Chen',
    },
    {
      id: 5,
      name: 'Lisa Wilson',
      email: 'lisa.wilson@email.com',
      phone: '+1 (555) 567-8901',
      membershipType: 'Premium',
      status: 'Active',
      joinDate: '2024-01-30',
      lastVisit: '2024-12-17',
      trainer: 'David Rodriguez',
    },
  ]);

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || member.status.toLowerCase() === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getMembershipColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'premium':
        return 'bg-purple-100 text-purple-800';
      case 'basic':
        return 'bg-blue-100 text-blue-800';
      case 'vip':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Form handlers for future use
  // const handleAddMember = (e: React.FormEvent) => {
  //   e.preventDefault();
  //   // Here you would typically send the data to your backend
  //   console.log('Adding member:', formData);
  //   setIsAddModalOpen(false);
  //   setFormData({
  //     name: '',
  //     email: '',
  //     phone: '',
  //     membershipType: 'Basic',
  //     trainer: '',
  //   });
  // };

  // const handleInputChange = (field: string, value: string) => {
  //   setFormData(prev => ({ ...prev, [field]: value }));
  // };

  const generateRandomMember = () => {
    const firstNames = ['Alex', 'Jordan', 'Sam', 'Taylor', 'Casey', 'Morgan', 'Riley', 'Quinn', 'Avery', 'Blake'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
    const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com'];
    const membershipTypes = ['Basic', 'Premium', 'VIP'];
    const trainers = ['Mike Chen', 'Sarah Wilson', 'David Rodriguez', 'Lisa Thompson', 'Emma Davis'];
    
    const randomFirstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const randomLastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const randomDomain = domains[Math.floor(Math.random() * domains.length)];
    const randomMembershipType = membershipTypes[Math.floor(Math.random() * membershipTypes.length)];
    const randomTrainer = trainers[Math.floor(Math.random() * trainers.length)];
    
    // Generate random phone number
    const areaCode = Math.floor(Math.random() * 900) + 100;
    const prefix = Math.floor(Math.random() * 900) + 100;
    const lineNumber = Math.floor(Math.random() * 9000) + 1000;
    const randomPhone = `+1 (${areaCode}) ${prefix}-${lineNumber}`;
    
    // Generate random join date (within last 2 years)
    const randomJoinDate = new Date();
    randomJoinDate.setDate(randomJoinDate.getDate() - Math.floor(Math.random() * 730));
    
    // Generate random last visit (within last 30 days)
    const randomLastVisit = new Date();
    randomLastVisit.setDate(randomLastVisit.getDate() - Math.floor(Math.random() * 30));
    
    const randomMember = {
      id: members.length + 1,
      name: `${randomFirstName} ${randomLastName}`,
      email: `${randomFirstName.toLowerCase()}.${randomLastName.toLowerCase()}@${randomDomain}`,
      phone: randomPhone,
      membershipType: randomMembershipType,
      status: 'Active',
      joinDate: randomJoinDate.toISOString().split('T')[0],
      lastVisit: randomLastVisit.toISOString().split('T')[0],
      trainer: randomTrainer,
    };
    
    // Add to members array (in a real app, this would go to a database)
    setMembers(prevMembers => [...prevMembers, randomMember]);
    
    // Force re-render by updating state
    setSearchTerm('');
    setSelectedFilter('all');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Members</h1>
          <p className="text-gray-600">Manage your gym members and their information</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={generateRandomMember}>
            🎲 Generate Random
          </Button>
          <Button variant="primary" icon={Plus} onClick={() => alert('Add Member functionality coming soon!')}>
            Add Member
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <SearchInput
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Search members by name or email..."
        filters={[
          { value: 'all', label: 'All Status' },
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' },
          { value: 'pending', label: 'Pending' }
        ]}
        selectedFilter={selectedFilter}
        onFilterChange={setSelectedFilter}
      />

      {/* Members Table */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Membership
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Join Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Visit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trainer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMembers.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-700">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{member.name}</div>
                        <div className="text-sm text-gray-500">{member.email}</div>
                        <div className="text-sm text-gray-500 flex items-center mt-1">
                          <Phone className="h-3 w-3 mr-1" />
                          {member.phone}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getMembershipColor(member.membershipType)}`}>
                      {member.membershipType}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(member.status)}`}>
                      {member.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(member.joinDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(member.lastVisit).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {member.trainer}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button className="text-blue-600 hover:text-blue-900 p-1">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="text-green-600 hover:text-green-900 p-1">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-900 p-1">
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <button className="text-gray-600 hover:text-gray-900 p-1">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 flex justify-between sm:hidden">
              <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                Previous
              </button>
              <button className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredMembers.length}</span> of{' '}
                  <span className="font-medium">{members.length}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                    Previous
                  </button>
                  <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                    1
                  </button>
                  <button className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Members;
