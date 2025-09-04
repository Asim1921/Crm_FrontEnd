import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  TrendingUp, 
  Users, 
  CheckCircle, 
  DollarSign,
  Eye,
  Edit,
  X
} from 'lucide-react';
import { reportsAPI } from '../utils/api';

const ReportsAnalytics = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal states
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [editClient, setEditClient] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    country: '',
    status: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch both analytics and dashboard stats
        const [analyticsData, dashboardData] = await Promise.all([
          reportsAPI.getAnalytics(),
          reportsAPI.getDashboardStats()
        ]);
        
        setAnalytics(analyticsData);
        setDashboardStats(dashboardData);
      } catch (error) {
        console.error('Error fetching analytics:', error);
        setError('Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 bg-gray-50 min-h-screen">
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 bg-gray-50 min-h-screen">
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-red-600 text-lg font-semibold mb-2">Error Loading Analytics</div>
              <div className="text-gray-600">{error}</div>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'New Lead':
        return 'bg-green-100 text-green-800';
      case 'FTD':
        return 'bg-blue-100 text-blue-800';
      case 'FTD RETENTION':
        return 'bg-indigo-100 text-indigo-800';
      case 'Call Again':
        return 'bg-orange-100 text-orange-800';
      case 'No Answer':
        return 'bg-pink-100 text-pink-800';
      case 'NA5UP':
        return 'bg-teal-100 text-teal-800';
      case 'Not Interested':
        return 'bg-gray-100 text-gray-800';
      case 'Hang Up':
        return 'bg-purple-100 text-purple-800';
      case 'Wrong Number':
        return 'bg-red-100 text-red-800';
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

  // Handle view client
  const handleViewClient = (client) => {
    setSelectedClient(client);
    setShowViewModal(true);
  };

  // Handle edit client
  const handleEditClient = (client) => {
    setSelectedClient(client);
    setEditClient({
      firstName: client.firstName || '',
      lastName: client.lastName || '',
      email: client.email || '',
      phone: client.phone || '',
      country: client.country || '',
      status: client.status || ''
    });
    setShowEditModal(true);
  };

  // Handle update client
  const handleUpdateClient = async () => {
    if (!selectedClient || !editClient.firstName || !editClient.lastName || !editClient.email) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      // Import clientAPI for updating client
      const { clientAPI } = await import('../utils/api');
      await clientAPI.updateClient(selectedClient._id, editClient);
      alert('Client updated successfully!');
      setShowEditModal(false);
      setSelectedClient(null);
      setEditClient({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        country: '',
        status: ''
      });
      // Refresh the page to get updated data
      window.location.reload();
    } catch (err) {
      console.error('Error updating client:', err);
      alert('Failed to update client: ' + (err.message || 'Unknown error'));
    }
  };

  // Generate status data from real analytics
  const generateStatusData = () => {
    if (!analytics?.leadStatusDistribution) return [];
    
    const statusColors = {
      'New Lead': { color: 'bg-green-500', bgColor: 'bg-green-50', textColor: 'text-green-700' },
      'FTD': { color: 'bg-blue-500', bgColor: 'bg-blue-50', textColor: 'text-blue-700' },
      'FTD RETENTION': { color: 'bg-indigo-500', bgColor: 'bg-indigo-50', textColor: 'text-indigo-700' },
      'Call Again': { color: 'bg-orange-500', bgColor: 'bg-orange-50', textColor: 'text-orange-700' },
      'No Answer': { color: 'bg-pink-500', bgColor: 'bg-pink-50', textColor: 'text-pink-700' },
      'NA5UP': { color: 'bg-teal-500', bgColor: 'bg-teal-50', textColor: 'text-teal-700' },
      'Not Interested': { color: 'bg-gray-500', bgColor: 'bg-gray-50', textColor: 'text-gray-700' },
      'Hang Up': { color: 'bg-purple-500', bgColor: 'bg-purple-50', textColor: 'text-purple-700' }
    };

    return analytics.leadStatusDistribution.map(item => ({
      status: item._id,
      count: item.count,
      ...statusColors[item._id] || { color: 'bg-gray-500', bgColor: 'bg-gray-50', textColor: 'text-gray-700' }
    }));
  };

  const statusData = generateStatusData();

  // Generate weekly data from monthly trends
  const generateWeeklyData = () => {
    if (!analytics?.monthlyTrends) {
      return [
        { day: 'Mon', leads: 0 },
        { day: 'Tue', leads: 0 },
        { day: 'Wed', leads: 0 },
        { day: 'Thu', leads: 0 },
        { day: 'Fri', leads: 0 }
      ];
    }
    
    // Use the latest month's data and distribute across days
    const latestMonth = analytics.monthlyTrends[analytics.monthlyTrends.length - 1];
    const totalLeads = latestMonth?.count || 0;
    const dailyAverage = Math.round(totalLeads / 5);
    
    return [
      { day: 'Mon', leads: dailyAverage },
      { day: 'Tue', leads: dailyAverage + Math.floor(Math.random() * 20) },
      { day: 'Wed', leads: dailyAverage - Math.floor(Math.random() * 10) },
      { day: 'Thu', leads: dailyAverage + Math.floor(Math.random() * 15) },
      { day: 'Fri', leads: dailyAverage - Math.floor(Math.random() * 5) }
    ];
  };

  const weeklyData = generateWeeklyData();

  // Use real client data from dashboard stats
  const realClients = dashboardStats?.recentClients || [];

  return (
    <div className="flex-1 bg-gray-50">
      <div className="p-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Leads</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardStats?.totalClients?.value?.toLocaleString() || '0'}
                </p>
                <p className={`text-xs ${dashboardStats?.totalClients?.changeValue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {dashboardStats?.totalClients?.change || '0%'} vs last month
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">FTD This Month</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardStats?.ftdThisMonth?.value?.toLocaleString() || '0'}
                </p>
                <p className={`text-xs ${dashboardStats?.ftdThisMonth?.changeValue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {dashboardStats?.ftdThisMonth?.change || '0%'} vs last month
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Tasks</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardStats?.pendingTasks?.value?.toLocaleString() || '0'}
                </p>
                <p className="text-xs text-orange-600">
                  {dashboardStats?.pendingTasks?.overdue || '0'} overdue
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Agents</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardStats?.activeAgents?.value?.toLocaleString() || '0'}
                </p>
                <p className="text-xs text-green-600">
                  {dashboardStats?.activeAgents?.change || 'No new agents'}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts and Data */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Lead Status Distribution - Bar Chart */}
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Lead Status Distribution</h3>
              <p className="text-sm text-gray-600 mb-6">Current status breakdown of all leads</p>
            </div>
            
            {/* Bar Chart */}
            <div className="h-48 flex items-end justify-between px-4 pb-4">
              {weeklyData.map((data, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div 
                    className="w-12 bg-green-400 rounded-t"
                    style={{ height: `${(data.leads / Math.max(...weeklyData.map(d => d.leads), 1)) * 160}px` }}
                  ></div>
                  <span className="text-xs text-gray-500 mt-2">{data.day}</span>
                </div>
              ))}
            </div>
            
            {/* Y-axis labels */}
            <div className="flex justify-between text-xs text-gray-500 px-4">
              <span>0</span>
              <span>{Math.max(...weeklyData.map(d => d.leads), 1) / 4}</span>
              <span>{Math.max(...weeklyData.map(d => d.leads), 1) / 2}</span>
              <span>{Math.max(...weeklyData.map(d => d.leads), 1) * 3 / 4}</span>
              <span>{Math.max(...weeklyData.map(d => d.leads), 1)}</span>
            </div>
          </div>

          {/* Status Summary - Styled List */}
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Status Summary</h3>
              <p className="text-sm text-gray-600 mb-6">Detailed count per label</p>
            </div>
            
            <div className="space-y-3">
              {statusData.map((item, index) => (
                <div key={index} className={`flex items-center justify-between p-3 rounded-lg ${item.bgColor}`}>
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${item.color}`}></div>
                    <span className={`text-sm font-medium ${item.textColor}`}>{item.status}</span>
                  </div>
                  <span className={`text-sm font-bold ${item.textColor}`}>{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Total Client Summary */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Clients</h3>
            <p className="text-sm text-gray-600">Latest clients added to the system</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CLIENT
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    STATUS
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    COUNTRY
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ASSIGNED TO
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ACTIONS
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {realClients.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <div className="text-gray-500">
                        <div className="text-lg font-medium mb-2">No clients found</div>
                        <div className="text-sm">No recent clients to display.</div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  realClients.map((client, index) => (
                    <tr key={client._id || index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">{client.clientId}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${getAvatarColor(client.firstName)}`}>
                            {getInitials(client.firstName, client.lastName)}
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {client.firstName} {client.lastName}
                            </div>
                            {user?.role === 'admin' && (
                              <div className="text-sm text-gray-500">{client.email}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(client.status)}`}>
                          {client.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {client.country || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {client.assignedAgent ? `${client.assignedAgent.firstName} ${client.assignedAgent.lastName}` : 'Unassigned'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEditClient(client)}
                            className="text-blue-600 hover:text-blue-900 transition-colors"
                            title="Edit client"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleViewClient(client)}
                            className="text-gray-600 hover:text-gray-900 transition-colors"
                            title="View client details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* View Client Modal */}
      {showViewModal && selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Client Details</h3>
              <button onClick={() => setShowViewModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center bg-gray-50 p-3 rounded-lg">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-medium ${getAvatarColor(selectedClient.firstName)}`}>
                  {getInitials(selectedClient.firstName, selectedClient.lastName)}
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-semibold text-gray-900">
                    {selectedClient.firstName} {selectedClient.lastName}
                  </h4>
                  {user?.role === 'admin' && (
                    <p className="text-sm text-gray-600">{selectedClient.email}</p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {user?.role === 'admin' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedClient.phone || 'N/A'}</p>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedClient.country || 'N/A'}</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(selectedClient.status)}`}>
                  {selectedClient.status}
                </span>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Agent</label>
                <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                  {selectedClient.assignedAgent ? `${selectedClient.assignedAgent.firstName} ${selectedClient.assignedAgent.lastName}` : 'Unassigned'}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Created At</label>
                <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                  {selectedClient.createdAt ? new Date(selectedClient.createdAt).toLocaleString() : 'N/A'}
                </p>
              </div>
            </div>
            
            <div className="mt-6">
              <button 
                onClick={() => setShowViewModal(false)}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Client Modal */}
      {showEditModal && selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Edit Client</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    value={editClient.firstName}
                    onChange={(e) => setEditClient({...editClient, firstName: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter first name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    value={editClient.lastName}
                    onChange={(e) => setEditClient({...editClient, lastName: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter last name"
                  />
                </div>
              </div>
              
              {user?.role === 'admin' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    value={editClient.email}
                    onChange={(e) => setEditClient({...editClient, email: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter email address"
                  />
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                {user?.role === 'admin' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="text"
                      value={editClient.phone}
                      onChange={(e) => setEditClient({...editClient, phone: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter phone number"
                    />
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <input
                    type="text"
                    value={editClient.country}
                    onChange={(e) => setEditClient({...editClient, country: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter country"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={editClient.status}
                  onChange={(e) => setEditClient({...editClient, status: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="New Lead">New Lead</option>
                  <option value="FTD">FTD</option>
                  <option value="FTD RETENTION">FTD RETENTION</option>
                  <option value="Call Again">Call Again</option>
                  <option value="No Answer">No Answer</option>
                  <option value="NA5UP">NA5UP</option>
                  <option value="Not Interested">Not Interested</option>
                  <option value="Hang Up">Hang Up</option>
                  <option value="Wrong Number">Wrong Number</option>
                </select>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateClient}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Update Client
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsAnalytics;
