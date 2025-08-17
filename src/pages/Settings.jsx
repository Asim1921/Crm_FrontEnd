import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Phone, 
  Mail, 
  Check, 
  Users, 
  Shield, 
  Database, 
  Lock, 
  Cloud,
  Bell,
  Eye,
  EyeOff
} from 'lucide-react';
import { reportsAPI } from '../utils/api';

const Settings = () => {
  const { user } = useAuth();
  const [systemStats, setSystemStats] = useState({
    totalClients: 0,
    totalUsers: 0,
    totalTasks: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [settings, setSettings] = useState({
    hidePhoneNumbers: true,
    hideEmailAddresses: true,
    enableNotifications: true,
    showSensitiveData: user?.role === 'admin'
  });

  useEffect(() => {
    const fetchSystemStats = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const dashboardData = await reportsAPI.getDashboardStats();
        
        // Calculate system statistics
        setSystemStats({
          totalClients: dashboardData.totalClients?.value || 0,
          totalUsers: dashboardData.activeAgents?.value || 0,
          totalTasks: dashboardData.pendingTasks?.value || 0
        });
      } catch (error) {
        console.error('Error fetching system stats:', error);
        setError('Failed to load system statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchSystemStats();
  }, []);

  const handleSettingChange = (setting) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const getAvatarColor = (name) => {
    const colors = ['bg-blue-500', 'bg-pink-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500'];
    const index = name.length % colors.length;
    return colors[index];
  };

  return (
    <div className="flex-1 bg-gray-50">
      <div className="p-6">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-5 h-5 bg-red-400 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✕</span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Hidden Contact Information Section */}
        <div className="bg-white rounded-xl p-6 mb-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Hidden Contact Information</h2>
            <p className="text-gray-600">Control agent access to sensitive client contact details</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Phone Numbers Card */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <Phone className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Phone Numbers</h3>
                </div>
              </div>
              <div className="flex items-center mb-3">
                <input
                  type="checkbox"
                  checked={settings.hidePhoneNumbers}
                  onChange={() => handleSettingChange('hidePhoneNumbers')}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <label className="ml-2 text-sm text-gray-700">Hidden from Agents</label>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Phone numbers are only visible to administrators and authorized personnel.
              </p>
              <div className="flex items-center text-green-600">
                <Check className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium">Currently Protected</span>
              </div>
            </div>

            {/* Email Addresses Card */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <Mail className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Email Addresses</h3>
                </div>
              </div>
              <div className="flex items-center mb-3">
                <input
                  type="checkbox"
                  checked={settings.hideEmailAddresses}
                  onChange={() => handleSettingChange('hideEmailAddresses')}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <label className="ml-2 text-sm text-gray-700">Hidden from Agents</label>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Email addresses are restricted to admin-level access only.
              </p>
              <div className="flex items-center text-green-600">
                <Check className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium">Currently Protected</span>
              </div>
            </div>

            {/* Access Levels Section */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Access Levels</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <Users className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-sm text-gray-700">Admins: Full Access</span>
                </div>
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                    <Users className="w-4 h-4 text-orange-600" />
                  </div>
                  <span className="text-sm text-gray-700">Managers: Limited Access</span>
                </div>
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
                    <Users className="w-4 h-4 text-red-600" />
                  </div>
                  <span className="text-sm text-gray-700">Agents: No Access</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Secure Database Section */}
        <div className="bg-white rounded-xl p-6 mb-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Secure Database</h2>
            <p className="text-gray-600">Enterprise-grade security for your client records</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Client Records Supported */}
            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Database className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-2">
                {loading ? '...' : systemStats.totalClients.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Client Records</div>
            </div>

            {/* Active Users */}
            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-2">
                {loading ? '...' : systemStats.totalUsers}
              </div>
              <div className="text-sm text-gray-600">Active Users</div>
            </div>

            {/* Pending Tasks */}
            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-6 h-6 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-2">
                {loading ? '...' : systemStats.totalTasks}
              </div>
              <div className="text-sm text-gray-600">Pending Tasks</div>
            </div>
          </div>
        </div>

        {/* Security Features & Compliance Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Security Features */}
          <div className="bg-white rounded-xl p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Security Features</h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <Check className="w-5 h-5 text-green-600 mr-3" />
                <span className="text-gray-700">End-to-end encryption</span>
              </div>
              <div className="flex items-center">
                <Check className="w-5 h-5 text-green-600 mr-3" />
                <span className="text-gray-700">Multi-factor authentication</span>
              </div>
              <div className="flex items-center">
                <Check className="w-5 h-5 text-green-600 mr-3" />
                <span className="text-gray-700">Role-based access control</span>
              </div>
              <div className="flex items-center">
                <Check className="w-5 h-5 text-green-600 mr-3" />
                <span className="text-gray-700">Real-time activity monitoring</span>
              </div>
            </div>
          </div>

          {/* Compliance */}
          <div className="bg-white rounded-xl p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Compliance</h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <Shield className="w-5 h-5 text-blue-600 mr-3" />
                <span className="text-gray-700">GDPR Compliant</span>
              </div>
              <div className="flex items-center">
                <Shield className="w-5 h-5 text-blue-600 mr-3" />
                <span className="text-gray-700">SOC 2 Type II</span>
              </div>
              <div className="flex items-center">
                <Shield className="w-5 h-5 text-blue-600 mr-3" />
                <span className="text-gray-700">ISO 27001 Certified</span>
              </div>
              <div className="flex items-center">
                <Shield className="w-5 h-5 text-blue-600 mr-3" />
                <span className="text-gray-700">HIPAA Compliant</span>
              </div>
            </div>
          </div>
        </div>

        {/* Current User Info */}
        <div className="bg-white rounded-xl p-6 mt-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Current User Settings</h3>
          <div className="flex items-center space-x-4">
            <div className={`w-12 h-12 ${getAvatarColor(user?.firstName || '')} rounded-full flex items-center justify-center`}>
              <span className="text-white font-medium text-lg">
                {getInitials(user?.firstName, user?.lastName)}
              </span>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">
                {user?.firstName} {user?.lastName}
              </h4>
              <p className="text-sm text-gray-600">{user?.email}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role} • {user?.title || 'User'}</p>
            </div>
            <div className="ml-auto">
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <Bell className="w-4 h-4 text-gray-400 mr-2" />
                  <input
                    type="checkbox"
                    checked={settings.enableNotifications}
                    onChange={() => handleSettingChange('enableNotifications')}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label className="ml-2 text-sm text-gray-700">Notifications</label>
                </div>
                {user?.role === 'admin' && (
                  <div className="flex items-center">
                    {settings.showSensitiveData ? (
                      <Eye className="w-4 h-4 text-gray-400 mr-2" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-gray-400 mr-2" />
                    )}
                    <input
                      type="checkbox"
                      checked={settings.showSensitiveData}
                      onChange={() => handleSettingChange('showSensitiveData')}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label className="ml-2 text-sm text-gray-700">Show Sensitive Data</label>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
