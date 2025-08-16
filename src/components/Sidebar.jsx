import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  CheckSquare, 
  MessageCircle, 
  BarChart3, 
  Settings, 
  LogOut,
  User
} from 'lucide-react';
import LogoutModal from './LogoutModal';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const menuItems = [
    { 
      name: 'Dashboard', 
      icon: LayoutDashboard, 
      path: '/dashboard' 
    },
    { 
      name: 'Client Management', 
      icon: Users, 
      path: '/clients' 
    },
    { 
      name: 'Task Management', 
      icon: CheckSquare, 
      path: '/tasks' 
    },
    { 
      name: 'Communications Hub', 
      icon: MessageCircle, 
      path: '/communications' 
    },
    { 
      name: 'Reports & Analytics', 
      icon: BarChart3, 
      path: '/reports' 
    },
    { 
      name: 'Settings', 
      icon: Settings, 
      path: '/settings' 
    },
    { 
      name: 'Profile', 
      icon: User, 
      path: '/profile' 
    }
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
    setShowLogoutModal(false);
  };

  return (
    <>
      <div className="w-64 bg-white shadow-lg h-screen flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-800">Logo</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <li key={item.name}>
                  <button
                    onClick={() => navigate(item.path)}
                    className={`w-full flex items-center px-4 py-3 rounded-lg text-left transition-colors ${
                      isActive 
                        ? 'bg-blue-50 text-blue-600 border border-blue-200' 
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    <span className="font-medium">{item.name}</span>
                    {item.name === 'Settings' && user?.role === 'admin' && (
                      <span className="ml-auto bg-orange-100 text-orange-600 text-xs px-2 py-1 rounded-full">
                        Admin
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full flex items-center px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>

      {/* Logout Modal */}
      <LogoutModal 
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onLogout={handleLogout}
        user={user}
      />
    </>
  );
};

export default Sidebar;
