import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Download, 
  Upload,
  Phone,
  MessageCircle,
  Mail,
  MoreVertical,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const ClientManagement = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Pending':
        return 'bg-orange-100 text-orange-800';
      case 'Inactive':
        return 'bg-red-100 text-red-800';
      case 'Unassigned':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const getAvatarColor = (name) => {
    const colors = ['bg-blue-500', 'bg-pink-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500'];
    const index = name.length % colors.length;
    return colors[index];
  };

  // Mock client data matching the screenshot
  const mockClients = [
    {
      _id: '1',
      firstName: 'Jessica',
      lastName: 'Martinez',
      email: 'jessica.martinez@email.com',
      phone: '+1 (555) 123-4567',
      country: 'United States',
      status: 'Active',
      assignedAgent: { firstName: 'Michael', lastName: 'Chen' }
    },
    {
      _id: '2',
      firstName: 'Robert',
      lastName: 'Thompson',
      email: 'robert.thompson@email.com',
      phone: '+1 (416) 789-9123',
      country: 'Canada',
      status: 'Pending',
      assignedAgent: { firstName: 'Emma', lastName: 'Rodriguez' }
    },
    {
      _id: '3',
      firstName: 'Amanda',
      lastName: 'Chen',
      email: 'amanda.chen@email.com',
      phone: '+61 2 8878 5432',
      country: 'Australia',
      status: 'Active',
      assignedAgent: { firstName: 'David', lastName: 'Kim' }
    },
    {
      _id: '4',
      firstName: 'James',
      lastName: 'Wilson',
      email: 'james.wilson@email.com',
      phone: '+44 20 7123 4567',
      country: 'United Kingdom',
      status: 'Inactive',
      assignedAgent: { firstName: 'Lisa', lastName: 'Thompson' }
    },
    {
      _id: '5',
      firstName: 'Maria',
      lastName: 'Rodriguez',
      email: 'maria.rodriguez@email.com',
      phone: '+1 (555) 456-7890',
      country: 'United States',
      status: 'Unassigned',
      assignedAgent: null
    }
  ];

  // Data for charts
  const pieChartData = [
    { name: 'United States', value: 40, color: '#3B82F6' },
    { name: 'Canada', value: 25, color: '#10B981' },
    { name: 'Australia', value: 20, color: '#F59E0B' },
    { name: 'United Kingdom', value: 15, color: '#EF4444' }
  ];

  const barChartData = [
    { name: 'Mon', value: 120 },
    { name: 'Tue', value: 190 },
    { name: 'Wed', value: 150 },
    { name: 'Thu', value: 80 },
    { name: 'Fri', value: 70 }
  ];

  const leadStatusData = [
    { status: 'New Lead', count: 127, color: 'bg-green-500' },
    { status: 'Call Again', count: 89, color: 'bg-orange-500' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex-1">
        <div className="p-6">
          {/* Action Bar */}
          <div className="bg-white rounded-lg p-4 mb-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search clients..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>All Countries</option>
                  <option>United States</option>
                  <option>Canada</option>
                  <option>Australia</option>
                  <option>United Kingdom</option>
                </select>
                <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>All Agents</option>
                </select>
                <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Assign to</option>
                </select>
                <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Select Agent</option>
                </select>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  APPLY
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <button className="flex items-center px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors">
                  <Upload className="w-4 h-4 mr-1" />
                  Import Excel
                </button>
                <button className="flex items-center px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors">
                  <Download className="w-4 h-4 mr-1" />
                  Export Excel
                </button>
                <button className="flex items-center px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors">
                  <Plus className="w-4 h-4 mr-1" />
                  Add Client
                </button>
              </div>
            </div>
          </div>

          {/* Client Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input type="checkbox" className="rounded" />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CLIENT NAME</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">COUNTRY</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">PHONE</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">EMAIL</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ASSIGNED AGENT</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">STATUS</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {mockClients.map((client) => (
                    <tr key={client._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <input type="checkbox" className="rounded" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${getAvatarColor(client.firstName)}`}>
                            {getInitials(client.firstName, client.lastName)}
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {client.firstName} {client.lastName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{client.country}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{client.phone}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{client.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {client.assignedAgent ? `${client.assignedAgent.firstName} ${client.assignedAgent.lastName}` : 'Unassigned'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(client.status)}`}>
                          {client.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button className="text-gray-400 hover:text-gray-600">
                            <Phone className="w-4 h-4" />
                          </button>
                          <button className="text-gray-400 hover:text-gray-600">
                            <MessageCircle className="w-4 h-4" />
                          </button>
                          <button className="text-gray-400 hover:text-gray-600">
                            <Mail className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
              <div className="text-sm text-gray-700">
                Showing 1 to 5 of 47 results
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Previous</span>
                <button className="w-8 h-8 bg-blue-600 text-white rounded flex items-center justify-center text-sm">1</button>
                <button className="w-8 h-8 text-gray-500 hover:bg-gray-100 rounded flex items-center justify-center text-sm">2</button>
                <button className="w-8 h-8 text-gray-500 hover:bg-gray-100 rounded flex items-center justify-center text-sm">3</button>
                <span className="text-sm text-gray-500">Next</span>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Clients by Country Pie Chart */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Clients by Country</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Engagement Metrics Bar Chart */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Engagement Metrics</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Lead Status Overview */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Lead Status Overview</h3>
            <div className="space-y-4">
              {leadStatusData.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                    <span className="text-sm font-medium text-gray-900">{item.status}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientManagement;