import { useAuth } from '../context/AuthContext';
import { Navigate, Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const PrivateRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  // Temporarily bypass authentication check for demo purposes
  // Remove this condition when you want to restore authentication
  if (false) { // Changed from !isAuthenticated to false
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default PrivateRoute;
