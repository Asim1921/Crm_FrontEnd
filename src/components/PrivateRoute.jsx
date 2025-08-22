import { useAuth } from '../context/AuthContext';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import LogoutModal from './LogoutModal';

const PrivateRoute = () => {
  const { isAuthenticated, loading, logout, user } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setSidebarOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

  // Get page title based on current route
  const getPageTitle = () => {
    const path = location.pathname;
    switch (path) {
      case '/dashboard':
        return 'Dashboard';
      case '/clients':
        return 'Client Management';
      case '/tasks':
        return 'Task Management';
      case '/communications':
        return 'Communications Hub';
      case '/reports':
        return 'Reports & Analytics';
      case '/settings':
        return 'Settings';
      case '/profile':
        return 'Profile';
      default:
        return 'Dashboard';
    }
  };

  const handleLogout = () => {
    logout();
    setShowLogoutModal(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && isMobile && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out`}>
        <Sidebar onLogoutClick={() => setShowLogoutModal(true)} />
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden w-full lg:w-auto">
        <Header title={getPageTitle()} onMenuClick={() => setSidebarOpen(true)} isMobile={isMobile} />
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </div>

      {/* Logout Modal - Rendered at the top level */}
      <LogoutModal 
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onLogout={handleLogout}
        user={user}
      />
    </div>
  );
};

export default PrivateRoute;
