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
  EyeOff,
  Plus,
  X,
  UserPlus
} from 'lucide-react';
import { reportsAPI, userAPI } from '../utils/api';

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

  // User management states (Admin only)
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [createUserForm, setCreateUserForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'agent',
    title: 'Agent',
    phone: ''
  });
  const [createUserLoading, setCreateUserLoading] = useState(false);
  const [createUserError, setCreateUserError] = useState('');
  const [createUserSuccess, setCreateUserSuccess] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);

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

    const fetchUsers = async () => {
      if (user?.role === 'admin') {
        try {
          setUsersLoading(true);
          const users = await userAPI.getUsers();
          setAllUsers(users);
        } catch (error) {
          console.error('Error fetching users:', error);
        } finally {
          setUsersLoading(false);
        }
      }
    };

    fetchSystemStats();
    fetchUsers();
  }, [user?.role]);

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

  // User management functions (Admin only)
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreateUserLoading(true);
    setCreateUserError('');
    setCreateUserSuccess('');

    try {
      await userAPI.createUser(createUserForm);
      setCreateUserSuccess('User created successfully!');
      setCreateUserForm({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: 'agent',
        title: 'Agent',
        phone: ''
      });
      
      // Refresh users list
      const users = await userAPI.getUsers();
      setAllUsers(users);
      
      // Close modal after a short delay
      setTimeout(() => {
        setShowCreateUserModal(false);
        setCreateUserSuccess('');
      }, 2000);
    } catch (error) {
      setCreateUserError(error.message || 'Failed to create user');
    } finally {
      setCreateUserLoading(false);
    }
  };

  const handleCreateUserFormChange = (field, value) => {
    setCreateUserForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const closeCreateUserModal = () => {
    setShowCreateUserModal(false);
    setCreateUserForm({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      role: 'agent',
      title: 'Agent',
      phone: ''
    });
    setCreateUserError('');
    setCreateUserSuccess('');
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

        {/* User Management Section - Admin Only */}
        {user?.role === 'admin' && (
          <div className="bg-white rounded-xl p-6 mt-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">User Management</h2>
                <p className="text-gray-600">Create and manage user accounts for your team</p>
              </div>
              <button
                onClick={() => setShowCreateUserModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>Create User</span>
              </button>
            </div>

            {/* Users List */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">USER</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">EMAIL</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ROLE</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TITLE</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STATUS</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {usersLoading ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-4 text-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                      </td>
                    </tr>
                  ) : allUsers.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    allUsers.map((userItem) => (
                      <tr key={userItem._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className={`w-10 h-10 ${getAvatarColor(userItem.firstName || '')} rounded-full flex items-center justify-center mr-3`}>
                              <span className="text-white font-medium text-sm">
                                {getInitials(userItem.firstName, userItem.lastName)}
                              </span>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {userItem.firstName} {userItem.lastName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {userItem.phone || 'No phone'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {userItem.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            userItem.role === 'admin' ? 'bg-red-100 text-red-800' :
                            userItem.role === 'manager' ? 'bg-orange-100 text-orange-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {userItem.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {userItem.title || 'Agent'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            Active
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

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

      {/* Create User Modal */}
      {showCreateUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Create New User</h2>
              <button onClick={closeCreateUserModal} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Success Message */}
            {createUserSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                <p className="text-green-800 text-sm">{createUserSuccess}</p>
              </div>
            )}

            {/* Error Message */}
            {createUserError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-red-800 text-sm">{createUserError}</p>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    value={createUserForm.firstName}
                    onChange={(e) => handleCreateUserFormChange('firstName', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={createUserForm.lastName}
                    onChange={(e) => handleCreateUserFormChange('lastName', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={createUserForm.email}
                  onChange={(e) => handleCreateUserFormChange('email', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={createUserForm.password}
                  onChange={(e) => handleCreateUserFormChange('password', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  minLength="6"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={createUserForm.role}
                    onChange={(e) => handleCreateUserFormChange('role', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="agent">Agent</option>
                    <option value="manager">Manager</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={createUserForm.title}
                    onChange={(e) => handleCreateUserFormChange('title', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Sales Agent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone (Optional)</label>
                <input
                  type="tel"
                  value={createUserForm.phone}
                  onChange={(e) => handleCreateUserFormChange('phone', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+1234567890"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeCreateUserModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  disabled={createUserLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createUserLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  {createUserLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Create User</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
