import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  CheckSquare, 
  MessageCircle, 
  BarChart3, 
  Settings, 
  LogOut,
  User,
  ExternalLink,
  FileCheck
} from 'lucide-react';
import logo from '../logo.png';

const Sidebar = ({ onLogoutClick }) => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Context menu state
  const [contextMenu, setContextMenu] = useState({ show: false, x: 0, y: 0 });
  const contextMenuRef = useRef(null);

  // Handle right-click on Client Management button
  const handleContextMenu = (e, item) => {
    if (item.name === 'Client Management') {
      e.preventDefault();
      setContextMenu({
        show: true,
        x: e.clientX,
        y: e.clientY
      });
    }
  };

  // Handle opening in new tab
  const handleOpenInNewTab = () => {
    window.open('/clients', '_blank');
    setContextMenu({ show: false, x: 0, y: 0 });
  };

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target)) {
        setContextMenu({ show: false, x: 0, y: 0 });
      }
    };

    if (contextMenu.show) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [contextMenu.show]);

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
      name: 'Personal KYC', 
      icon: FileCheck, 
      path: '/kyc' 
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

  return (
    <div className="w-48 lg:w-64 bg-white shadow-lg h-screen flex flex-col">
      {/* Logo */}
      <div className="p-4 lg:p-6 border-b border-gray-200">
        <div className="flex items-center justify-center">
          <img 
            src={logo} 
            alt="CRM Logo" 
            className="h-8 lg:h-12 w-auto object-contain"
          />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 lg:p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <li key={item.name}>
                <button
                  onClick={() => navigate(item.path)}
                  onContextMenu={(e) => handleContextMenu(e, item)}
                  className={`w-full flex items-center px-3 lg:px-4 py-2 lg:py-3 rounded-lg text-left transition-colors text-sm lg:text-base ${
                    isActive 
                      ? 'bg-blue-50 text-blue-600 border border-blue-200' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4 lg:w-5 lg:h-5 mr-2 lg:mr-3" />
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
      <div className="p-3 lg:p-4 border-t border-gray-200">
        <button
          onClick={onLogoutClick}
          className="w-full flex items-center px-3 lg:px-4 py-2 lg:py-3 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors text-sm lg:text-base"
        >
          <LogOut className="w-4 h-4 lg:w-5 lg:h-5 mr-2 lg:mr-3" />
          <span className="font-medium">Logout</span>
        </button>
      </div>

      {/* Context Menu */}
      {contextMenu.show && (
        <div
          ref={contextMenuRef}
          className="fixed bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 min-w-[160px]"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
        >
          <button
            onClick={handleOpenInNewTab}
            className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Open in New Tab
          </button>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
