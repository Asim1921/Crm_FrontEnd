import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import LoginModal from '../components/LoginModal';

const Login = () => {
  const { login, isAuthenticated } = useAuth();
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
        <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Logo</h1>
              <h2 className="text-xl font-bold text-gray-900">Dashboard</h2>
              <span className="bg-orange-100 text-orange-600 text-xs px-2 py-1 rounded-full">
                Administrator
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search clients..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="relative">
                <div className="w-6 h-6 text-gray-600 cursor-pointer"></div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium">JA</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">John Anderson</p>
                  <p className="text-sm text-gray-600">Administrator</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="flex">
          <div className="w-64 bg-white shadow-lg h-screen">
            <div className="p-6 border-b border-gray-200">
              <h1 className="text-xl font-bold text-gray-800">Logo</h1>
            </div>
            <nav className="p-4">
              <ul className="space-y-2">
                <li>
                  <button className="w-full flex items-center px-4 py-3 rounded-lg text-left bg-blue-50 text-blue-600 border border-blue-200">
                    <span className="font-medium">Dashboard</span>
                  </button>
                </li>
                <li>
                  <button className="w-full flex items-center px-4 py-3 rounded-lg text-left text-gray-600 hover:bg-gray-50">
                    <span className="font-medium">Client Management</span>
                  </button>
                </li>
                <li>
                  <button className="w-full flex items-center px-4 py-3 rounded-lg text-left text-gray-600 hover:bg-gray-50">
                    <span className="font-medium">Task Management</span>
                  </button>
                </li>
                <li>
                  <button className="w-full flex items-center px-4 py-3 rounded-lg text-left text-gray-600 hover:bg-gray-50">
                    <span className="font-medium">Communications Hub</span>
                  </button>
                </li>
                <li>
                  <button className="w-full flex items-center px-4 py-3 rounded-lg text-left text-gray-600 hover:bg-gray-50">
                    <span className="font-medium">Reports & Analytics</span>
                  </button>
                </li>
                <li>
                  <button className="w-full flex items-center px-4 py-3 rounded-lg text-left text-gray-600 hover:bg-gray-50">
                    <span className="font-medium">Settings</span>
                    <span className="ml-auto bg-orange-100 text-orange-600 text-xs px-2 py-1 rounded-full">
                      Admin
                    </span>
                  </button>
                </li>
              </ul>
            </nav>
            <div className="p-4 border-t border-gray-200">
              <button className="w-full flex items-center px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50">
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Clients</p>
                    <p className="text-2xl font-bold text-gray-900">12,847</p>
                    <p className="text-xs text-green-600">+12% from last month</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Agents</p>
                    <p className="text-2xl font-bold text-gray-900">47</p>
                    <p className="text-xs text-green-600">+3 new this week</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending Tasks</p>
                    <p className="text-2xl font-bold text-gray-900">284</p>
                    <p className="text-xs text-gray-600">12 overdue</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">FTD This Month</p>
                    <p className="text-2xl font-bold text-gray-900">156</p>
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
