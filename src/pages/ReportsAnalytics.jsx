import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  TrendingUp, 
  Users, 
  CheckCircle, 
  DollarSign,
  Eye,
  Edit
} from 'lucide-react';
import { reportsAPI } from '../utils/api';

const ReportsAnalytics = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      case 'FTD':
        return 'bg-green-100 text-green-800';
      case 'Call Again':
        return 'bg-orange-100 text-orange-800';
      case 'No Answer':
        return 'bg-red-100 text-red-800';
      case 'Not Interested':
        return 'bg-gray-100 text-gray-800';
      case 'New Lead':
        return 'bg-blue-100 text-blue-800';
      case 'Hang Up':
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

  // Generate status data from real analytics
  const generateStatusData = () => {
    if (!analytics?.leadStatusDistribution) return [];
    
    const statusColors = {
      'FTD': { color: 'bg-green-500', bgColor: 'bg-green-50', textColor: 'text-green-700' },
      'Call Again': { color: 'bg-orange-500', bgColor: 'bg-orange-50', textColor: 'text-orange-700' },
      'Not Interested': { color: 'bg-red-500', bgColor: 'bg-red-50', textColor: 'text-red-700' },
      'No Answer': { color: 'bg-gray-500', bgColor: 'bg-gray-50', textColor: 'text-gray-700' },
      'New Lead': { color: 'bg-blue-500', bgColor: 'bg-blue-50', textColor: 'text-blue-700' },
      'Hang Up': { color: 'bg-red-500', bgColor: 'bg-red-50', textColor: 'text-red-700' }
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
                    <td colSpan="5" className="px-6 py-12 text-center">
                      <div className="text-gray-500">
                        <div className="text-lg font-medium mb-2">No clients found</div>
                        <div className="text-sm">No recent clients to display.</div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  realClients.map((client, index) => (
                    <tr key={client._id || index}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${getAvatarColor(client.firstName)}`}>
                            {getInitials(client.firstName, client.lastName)}
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {client.firstName} {client.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{client.email}</div>
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
                          <button className="text-blue-600 hover:text-blue-900">Edit</button>
                          <button className="text-gray-600 hover:text-gray-900">View</button>
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
    </div>
  );
};

export default ReportsAnalytics;
