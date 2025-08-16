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
import PageHeader from '../components/PageHeader';
import api from '../utils/api';

const ReportsAnalytics = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const data = await api.getAnalytics();
        setAnalytics(data);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Interested':
        return 'bg-green-100 text-green-800';
      case 'Call Again':
        return 'bg-orange-100 text-orange-800';
      case 'No Answer':
        return 'bg-red-100 text-red-800';
      case 'Not Interested':
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

  // Bar chart data for Lead Status Distribution (days of the week)
  const weeklyData = [
    { day: 'Mon', leads: 120 },
    { day: 'Tue', leads: 200 },
    { day: 'Wed', leads: 150 },
    { day: 'Thu', leads: 80 },
    { day: 'Fri', leads: 70 }
  ];

  // Status summary data with proper styling
  const statusData = [
    { status: 'Not Interested', count: 423, color: 'bg-red-500', bgColor: 'bg-red-50', textColor: 'text-red-700' },
    { status: 'Call Again', count: 387, color: 'bg-orange-500', bgColor: 'bg-orange-50', textColor: 'text-orange-700' },
    { status: 'Interested', count: 342, color: 'bg-green-500', bgColor: 'bg-green-50', textColor: 'text-green-700' },
    { status: 'No Answer', count: 95, color: 'bg-gray-500', bgColor: 'bg-gray-50', textColor: 'text-gray-700' }
  ];

  // Mock client data
  const mockClients = [
    {
      _id: '1',
      firstName: 'John',
      lastName: 'Smith',
      email: 'john@company.com',
      status: 'Interested',
      lastContact: '2 hours ago',
      value: 12500
    },
    {
      _id: '2',
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah@company.com',
      status: 'Call Again',
      lastContact: '1 day ago',
      value: 8500
    }
  ];

  return (
    <div className="flex-1 bg-gray-50">
      <PageHeader title="Reports & Analytics" subtitle="Comprehensive insights and performance metrics" />
      
      <div className="p-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Leads</p>
                <p className="text-2xl font-bold text-gray-900">1,247</p>
                <p className="text-xs text-green-600">+12.5% vs last month</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Clients</p>
                <p className="text-2xl font-bold text-gray-900">342</p>
                <p className="text-xs text-green-600">+8.2% vs last month</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-bold text-gray-900">27.4%</p>
                <p className="text-xs text-red-600">-2.1% vs last month</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Revenue</p>
                <p className="text-2xl font-bold text-gray-900">$89.2K</p>
                <p className="text-xs text-green-600">+15.3% vs last month</p>
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
                    className="w-12 bg-blue-400 rounded-t"
                    style={{ height: `${(data.leads / 200) * 160}px` }}
                  ></div>
                  <span className="text-xs text-gray-500 mt-2">{data.day}</span>
                </div>
              ))}
            </div>
            
            {/* Y-axis labels */}
            <div className="flex justify-between text-xs text-gray-500 px-4">
              <span>0</span>
              <span>50</span>
              <span>100</span>
              <span>150</span>
              <span>200</span>
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
            <h3 className="text-lg font-semibold text-gray-900">Total Client Summary</h3>
            <p className="text-sm text-gray-600">Comprehensive overview of all leads and clients</p>
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
                    LAST CONTACT
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    VALUE
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ACTIONS
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {mockClients.map((client, index) => (
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
                      {client.lastContact}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ${client.value.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button className="text-blue-600 hover:text-blue-900">Edit</button>
                        <button className="text-gray-600 hover:text-gray-900">View</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsAnalytics;
