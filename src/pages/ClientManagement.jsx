import React, { useState, useEffect, useCallback } from 'react';
import { clientAPI, reportsAPI } from '../utils/api';
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
  Trash2,
  X
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const ClientManagement = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [agentFilter, setAgentFilter] = useState('all');
  const [selectedClients, setSelectedClients] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [assignToAgent, setAssignToAgent] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    current: 1,
    total: 1,
    hasNext: false,
    hasPrev: false
  });
  const [analytics, setAnalytics] = useState({
    clientsByCountry: [],
    leadStatusOverview: [],
    totalClients: 0
  });

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [newClient, setNewClient] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    country: '',
    status: 'New Lead'
  });
  const [importFile, setImportFile] = useState(null);
  const [importLoading, setImportLoading] = useState(false);

  // Agents state
  const [availableAgents, setAvailableAgents] = useState([]);

  // Countries state
  const [availableCountries, setAvailableCountries] = useState([]);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'New Lead':
        return 'bg-green-100 text-green-800';
      case 'FTD':
        return 'bg-blue-100 text-blue-800';
      case 'Call Again':
        return 'bg-orange-100 text-orange-800';
      case 'No Answer':
        return 'bg-red-100 text-red-800';
      case 'Not Interested':
        return 'bg-gray-100 text-gray-800';
      case 'Hang Up':
        return 'bg-purple-100 text-purple-800';
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

  // Fetch clients and analytics data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch clients with 5 records per page
        const params = {
          page: currentPage,
          limit: 5, // Changed from 10 to 5
          ...(debouncedSearchTerm && { search: debouncedSearchTerm }),
          ...(statusFilter !== 'all' && { status: statusFilter }),
          ...(countryFilter !== 'all' && { country: countryFilter }),
          ...(agentFilter !== 'all' && { agent: agentFilter })
        };
        
        const clientsData = await clientAPI.getClients(params);
        setClients(clientsData.clients || []);
        setPagination(clientsData.pagination || {});
        
        // Fetch analytics
        const analyticsData = await reportsAPI.getAnalytics();
        setAnalytics({
          clientsByCountry: analyticsData.clientsByCountry || [],
          leadStatusOverview: analyticsData.leadStatusDistribution || [],
          totalClients: clientsData.pagination?.total || 0
        });
        
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentPage, debouncedSearchTerm, statusFilter, countryFilter, agentFilter]);

  // Fetch available agents and countries
  useEffect(() => {
    const fetchAgentsAndCountries = async () => {
      try {
        const [agents, countries] = await Promise.all([
          clientAPI.getAvailableAgents(),
          clientAPI.getUniqueCountries()
        ]);
        setAvailableAgents(agents);
        setAvailableCountries(countries);
      } catch (err) {
        console.error('Error fetching agents and countries:', err);
      }
    };

    fetchAgentsAndCountries();
  }, []);

  // Handle search input change
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // Handle status filter
  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  // Handle select all checkbox
  const handleSelectAll = (checked) => {
    setSelectAll(checked);
    if (checked) {
      const allClientIds = new Set(clients.map(client => client._id));
      setSelectedClients(allClientIds);
    } else {
      setSelectedClients(new Set());
    }
  };

  // Handle individual client selection
  const handleClientSelect = (clientId, checked) => {
    const newSelectedClients = new Set(selectedClients);
    if (checked) {
      newSelectedClients.add(clientId);
    } else {
      newSelectedClients.delete(clientId);
    }
    setSelectedClients(newSelectedClients);
    setSelectAll(newSelectedClients.size === clients.length);
  };

  // Handle assign clients to agent
  const handleAssignClients = async () => {
    if (selectedClients.size === 0 || !assignToAgent) {
      alert('Please select clients and an agent to assign');
      return;
    }

    try {
      // API call to assign clients
      await clientAPI.assignClients(Array.from(selectedClients), assignToAgent);
      alert('Clients assigned successfully!');
      // Refresh data after assignment
      window.location.reload();
    } catch (err) {
      console.error('Error assigning clients:', err);
      alert('Failed to assign clients: ' + (err.message || 'Unknown error'));
    }
  };

  // Handle export clients
  const handleExportClients = async () => {
    try {
      await clientAPI.exportClients('csv');
    } catch (err) {
      console.error('Error exporting clients:', err);
      alert('Failed to export clients: ' + (err.message || 'Unknown error'));
    }
  };

  // Handle import clients
  const handleImportClients = async () => {
    if (!importFile) {
      alert('Please select a file to import');
      return;
    }

    setImportLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', importFile);
      
      // For now, we'll use a simple CSV parser
      const text = await importFile.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const clientsData = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const client = {};
        headers.forEach((header, index) => {
          client[header] = values[index] || '';
        });
        return client;
      }).filter(client => client.firstName && client.lastName && client.email);

      await clientAPI.importClients(clientsData);
      alert('Clients imported successfully!');
      setShowImportModal(false);
      setImportFile(null);
      window.location.reload();
    } catch (err) {
      console.error('Error importing clients:', err);
      alert('Failed to import clients: ' + (err.message || 'Unknown error'));
    } finally {
      setImportLoading(false);
    }
  };

  // Handle add new client
  const handleAddClient = async () => {
    try {
      await clientAPI.createClient(newClient);
      alert('Client added successfully!');
      setShowAddModal(false);
      setNewClient({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        country: '',
        status: 'New Lead'
      });
      window.location.reload();
    } catch (err) {
      console.error('Error adding client:', err);
      alert('Failed to add client: ' + (err.message || 'Unknown error'));
    }
  };

  // Transform analytics data for charts
  const pieChartData = analytics.clientsByCountry.map((item, index) => ({
    name: item._id,
    value: item.count,
    color: ['#60A5FA', '#34D399', '#FBBF24', '#F87171', '#A78BFA', '#FB7185'][index % 6]
  }));

  const barChartData = [
    { name: 'Mon', value: 120 },
    { name: 'Tue', value: 180 },
    { name: 'Wed', value: 200 },
    { name: 'Thu', value: 150 },
    { name: 'Fri', value: 100 }
  ];

  const leadStatusData = analytics.leadStatusOverview.map((item) => ({
    status: item._id,
    count: item.count,
    color: item._id === 'New Lead' ? 'bg-green-500' :
           item._id === 'FTD' ? 'bg-blue-500' :
           item._id === 'Call Again' ? 'bg-orange-500' :
           item._id === 'No Answer' ? 'bg-red-500' :
           item._id === 'Not Interested' ? 'bg-gray-500' :
           item._id === 'Hang Up' ? 'bg-purple-500' : 'bg-gray-400'
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Top Filter Bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search clients..."
              value={searchTerm}
              onChange={handleSearch}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
            />
          </div>
          <select 
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Countries</option>
            {availableCountries.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
          <select 
            value={agentFilter}
            onChange={(e) => setAgentFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Agents</option>
            <option value="agent1">Agent 1</option>
            <option value="agent2">Agent 2</option>
          </select>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setShowImportModal(true)}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Upload className="w-4 h-4 mr-2" />
            Import Excel
          </button>
          <button 
            onClick={handleExportClients}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Excel
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Client
          </button>
        </div>
      </div>

      {/* Assignment Bar */}
      <div className="flex items-center space-x-4 mb-6 p-4 bg-white rounded-lg shadow-sm">
        <div className="flex items-center space-x-2">
          <input 
            type="checkbox" 
            id="selectAll" 
            checked={selectAll}
            onChange={(e) => handleSelectAll(e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="selectAll" className="text-sm text-gray-700 font-medium">
            Select All
          </label>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-700 font-medium">Assign to:</span>
          <select 
            value={assignToAgent}
            onChange={(e) => setAssignToAgent(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="">Select Agent</option>
            {availableAgents.map((agent) => (
              <option key={agent._id} value={agent._id}>
                {agent.firstName} {agent.lastName}
              </option>
            ))}
          </select>
          <button 
            onClick={handleAssignClients}
            disabled={selectedClients.size === 0 || !assignToAgent}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            Assign ({selectedClients.size})
          </button>
        </div>
      </div>

      {/* Main Client Table */}
      <div className="mb-6">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input 
                      type="checkbox" 
                      checked={selectAll}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CLIENT NAME</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">COUNTRY</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PHONE</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">EMAIL</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ASSIGNED AGENT</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STATUS</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {clients.map((client) => (
                  <tr key={client._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input 
                        type="checkbox" 
                        checked={selectedClients.has(client._id)}
                        onChange={(e) => handleClientSelect(client._id, e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${getAvatarColor(client.firstName + client.lastName)}`}>
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
          <div className="px-6 py-3 border-t border-gray-200 bg-white">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((pagination.current - 1) * 5) + 1} to {Math.min(pagination.current * 5, analytics.totalClients)} of {analytics.totalClients} results
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => setCurrentPage(pagination.current - 1)}
                  disabled={!pagination.hasPrev}
                  className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(5, pagination.total) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button 
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1 text-sm rounded ${
                        pageNum === pagination.current 
                          ? 'bg-blue-600 text-white' 
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button 
                  onClick={() => setCurrentPage(pagination.current + 1)}
                  disabled={!pagination.hasNext}
                  className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row - Below the table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Clients by Country */}
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
                  outerRadius={100}
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

        {/* Engagement Metrics */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Engagement Metrics</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#60A5FA" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Lead Status Overview - Below the charts */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Lead Status Overview</h3>
        {leadStatusData.map((item, index) => (
          <div key={item.status} className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-3 ${item.color}`}></div>
              <span className="text-sm text-gray-700">{item.status}</span>
            </div>
            <span className="text-sm font-medium text-gray-900">{item.count}</span>
          </div>
        ))}
        {/* Status Progress Bar */}
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full" 
              style={{
                width: `${analytics.totalClients > 0 ? (leadStatusData[0]?.count || 0) / analytics.totalClients * 100 : 0}%`
              }}
            ></div>
          </div>
        </div>
      </div>

      {/* Add Client Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Add New Client</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input
                  type="text"
                  value={newClient.firstName}
                  onChange={(e) => setNewClient({...newClient, firstName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input
                  type="text"
                  value={newClient.lastName}
                  onChange={(e) => setNewClient({...newClient, lastName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={newClient.email}
                  onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="text"
                  value={newClient.phone}
                  onChange={(e) => setNewClient({...newClient, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <select
                  value={newClient.country}
                  onChange={(e) => setNewClient({...newClient, country: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Country</option>
                  {availableCountries.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={newClient.status}
                  onChange={(e) => setNewClient({...newClient, status: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="New Lead">New Lead</option>
                  <option value="FTD">FTD</option>
                  <option value="Call Again">Call Again</option>
                  <option value="No Answer">No Answer</option>
                  <option value="Not Interested">Not Interested</option>
                  <option value="Hang Up">Hang Up</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddClient}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Client
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Import Clients</h3>
              <button onClick={() => setShowImportModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CSV File</label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setImportFile(e.target.files[0])}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <p className="text-sm text-gray-600">
                Upload a CSV file with columns: firstName, lastName, email, phone, country, status
              </p>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleImportClients}
                disabled={!importFile || importLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {importLoading ? 'Importing...' : 'Import'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientManagement;