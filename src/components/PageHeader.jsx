import { Search, Bell, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const PageHeader = ({ title, subtitle }) => {
  const { user } = useAuth();

  return (
    <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            {subtitle && <p className="text-gray-600">{subtitle}</p>}
          </div>
          <span className="bg-orange-100 text-orange-600 text-xs px-2 py-1 rounded-full">
            {user?.role === 'admin' ? 'Administrator' : user?.role === 'tl' ? 'Team Lead' : 'Agent'}
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search clients..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <Bell className="w-6 h-6 text-gray-600 cursor-pointer" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white font-medium">
                {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-500">
                {user?.role === 'admin' ? 'Administrator' : user?.role === 'tl' ? 'Team Lead' : 'Agent'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageHeader;
