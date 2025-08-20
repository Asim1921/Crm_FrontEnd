import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import LoginModal from '../components/LoginModal';

const Login = () => {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      setShowModal(true);
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async (formData) => {
    try {
      await login(formData.username, formData.password);
      navigate('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Background Dashboard (faded) */}
      <div className="opacity-30">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200 px-4 lg:px-6 py-3 lg:py-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <h1 className="text-lg lg:text-2xl font-bold text-gray-900">Logo</h1>
              <h2 className="text-base lg:text-xl font-bold text-gray-900">Dashboard</h2>
              <span className="bg-orange-100 text-orange-600 text-xs px-2 py-1 rounded-full w-fit">
                {user?.role === 'admin' ? 'Administrator' : 'Agent'}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search clients..."
                  className="w-full sm:w-auto pl-10 pr-4 py-2 text-sm lg:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="relative">
                <div className="w-6 h-6 text-gray-600 cursor-pointer"></div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 lg:w-10 lg:h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-sm lg:text-base">
                    {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm lg:text-base">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs lg:text-sm text-gray-600">
                    {user?.role === 'admin' ? 'Administrator' : 'Agent'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="flex">
          <div className="w-48 lg:w-64 bg-white shadow-lg h-screen">
            <div className="p-4 lg:p-6 border-b border-gray-200">
              <h1 className="text-lg lg:text-xl font-bold text-gray-800">Logo</h1>
            </div>
            <nav className="p-3 lg:p-4">
              <ul className="space-y-2">
                <li>
                  <button className="w-full flex items-center px-3 lg:px-4 py-2 lg:py-3 rounded-lg text-left bg-blue-50 text-blue-600 border border-blue-200 text-sm lg:text-base">
                    <span className="font-medium">Dashboard</span>
                  </button>
                </li>
                <li>
                  <button className="w-full flex items-center px-3 lg:px-4 py-2 lg:py-3 rounded-lg text-left text-gray-600 hover:bg-gray-50 text-sm lg:text-base">
                    <span className="font-medium">Client Management</span>
                  </button>
                </li>
                <li>
                  <button className="w-full flex items-center px-3 lg:px-4 py-2 lg:py-3 rounded-lg text-left text-gray-600 hover:bg-gray-50 text-sm lg:text-base">
                    <span className="font-medium">Task Management</span>
                  </button>
                </li>
                <li>
                  <button className="w-full flex items-center px-3 lg:px-4 py-2 lg:py-3 rounded-lg text-left text-gray-600 hover:bg-gray-50 text-sm lg:text-base">
                    <span className="font-medium">Communications Hub</span>
                  </button>
                </li>
                <li>
                  <button className="w-full flex items-center px-3 lg:px-4 py-2 lg:py-3 rounded-lg text-left text-gray-600 hover:bg-gray-50 text-sm lg:text-base">
                    <span className="font-medium">Reports & Analytics</span>
                  </button>
                </li>
                <li>
                  <button className="w-full flex items-center px-3 lg:px-4 py-2 lg:py-3 rounded-lg text-left text-gray-600 hover:bg-gray-50 text-sm lg:text-base">
                    <span className="font-medium">Settings</span>
                    <span className="ml-auto bg-orange-100 text-orange-600 text-xs px-2 py-1 rounded-full">
                      Admin
                    </span>
                  </button>
                </li>
              </ul>
            </nav>
            <div className="p-3 lg:p-4 border-t border-gray-200">
              <button className="w-full flex items-center px-3 lg:px-4 py-2 lg:py-3 rounded-lg text-gray-600 hover:bg-gray-50 text-sm lg:text-base">
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-4 lg:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
              <div className="bg-white rounded-xl p-4 lg:p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs lg:text-sm font-medium text-gray-600">Total Clients</p>
                    <p className="text-xl lg:text-2xl font-bold text-gray-900">12,847</p>
                    <p className="text-xs text-green-600">+12% from last month</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 lg:p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs lg:text-sm font-medium text-gray-600">Active Agents</p>
                    <p className="text-xl lg:text-2xl font-bold text-gray-900">47</p>
                    <p className="text-xs text-green-600">+3 new this week</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 lg:p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs lg:text-sm font-medium text-gray-600">Pending Tasks</p>
                    <p className="text-xl lg:text-2xl font-bold text-gray-900">284</p>
                    <p className="text-xs text-gray-600">12 overdue</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 lg:p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs lg:text-sm font-medium text-gray-600">FTD This Month</p>
                    <p className="text-xl lg:text-2xl font-bold text-gray-900">156</p>
                    <p className="text-xs text-green-600">+8% conversion</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Login Modal */}
      <LoginModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        onLogin={handleLogin} 
      />
    </div>
  );
};

export default Login;
