import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { reportsAPI } from '../utils/api';
import { 
  Users, 
  Settings, 
  ClipboardList, 
  DollarSign,
  TrendingUp,
  Phone,
  MessageCircle,
  MoreHorizontal
} from 'lucide-react';
import PageHeader from '../components/PageHeader';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalClients: { value: 0, change: '0%' },
    activeAgents: { value: 0, change: '0' },
    pendingTasks: { value: 0, overdue: 0 },
    ftdThisMonth: { value: 0, change: '0%' }
  });
  const [recentClients, setRecentClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const data = await reportsAPI.getDashboardStats();
        setStats(data);
        setRecentClients(data.recentClients || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 bg-gray-50">
        <PageHeader title="Dashboard" />
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
      <div className="flex-1 bg-gray-50">
        <PageHeader title="Dashboard" />
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50">
      <PageHeader title="Dashboard" />
      
      {/* Main Content */}
      <div className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Clients</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalClients.value}</p>
                <p className={`text-xs ${stats.totalClients.changeValue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.totalClients.change} from last month
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
                <p className="text-sm font-medium text-gray-600">Active Agents</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeAgents.value}</p>
                <p className="text-xs text-green-600">{stats.activeAgents.change}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Settings className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Tasks</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingTasks.value}</p>
                <p className="text-xs text-gray-600">{stats.pendingTasks.overdue} overdue</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <ClipboardList className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">FTD This Month</p>
                <p className="text-2xl font-bold text-gray-900">{stats.ftdThisMonth.value}</p>
                <p className={`text-xs ${stats.ftdThisMonth.changeValue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.ftdThisMonth.change} conversion
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts and Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Clients */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">Recent Clients</h2>
                <div className="flex items-center space-x-2">
                  <button className="px-3 py-1 text-sm bg-blue-100 text-blue-600 rounded-lg">All</button>
                  <button className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">New Leads</button>
                  <button className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">FTD</button>
                  <button className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded-lg flex items-center">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    Export
                  </button>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">COUNTRY</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CONTACT</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STATUS</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AGENT</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentClients.map((client) => (
                    <tr key={client._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{client.country}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{client.firstName} {client.lastName}</div>
                        <div className="text-sm text-gray-500">{client.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          client.status === 'New Lead' ? 'bg-green-100 text-green-800' :
                          client.status === 'FTD' ? 'bg-blue-100 text-blue-800' :
                          client.status === 'Call Again' ? 'bg-orange-100 text-orange-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {client.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {client.assignedAgent ? `${client.assignedAgent.firstName} ${client.assignedAgent.lastName}` : 'Unassigned'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button className="text-blue-600 hover:text-blue-900">
                            <Phone className="w-4 h-4" />
                          </button>
                          <button className="text-green-600 hover:text-green-900">
                            <MessageCircle className="w-4 h-4" />
                          </button>
                          <button className="text-gray-600 hover:text-gray-900">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Lead Status Overview */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Lead Status Overview</h3>
              <div className="space-y-3">
                {stats.leadStatusOverview && stats.leadStatusOverview.map((status) => (
                  <div key={status._id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-3 ${
                        status._id === 'New Lead' ? 'bg-green-500' :
                        status._id === 'FTD' ? 'bg-blue-500' :
                        status._id === 'Call Again' ? 'bg-orange-500' :
                        status._id === 'No Answer' ? 'bg-red-500' :
                        status._id === 'Not Interested' ? 'bg-gray-500' :
                        status._id === 'Hang Up' ? 'bg-purple-500' :
                        'bg-gray-400'
                      }`}></div>
                      <span className="text-sm text-gray-700">{status._id}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{status.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                  Add New Client
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                  Create Task
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                  Import Data
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                  View Reports
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="text-sm text-gray-500 text-center py-4">
                No recent activity
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
