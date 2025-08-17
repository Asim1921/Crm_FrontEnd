import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, HelpCircle, ChevronDown } from 'lucide-react';

const Header = ({ title }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const getAvatarColor = (name) => {
    const colors = ['bg-blue-500', 'bg-pink-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500'];
    const index = name.length % colors.length;
    return colors[index];
  };

  const handleProfileClick = () => {
    navigate('/profile');
  };

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
          <span className="bg-blue-100 text-blue-600 text-sm px-3 py-1 rounded-full font-medium">
            {user?.role === 'admin' ? 'Administrator' : 'Agent'}
          </span>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search clients..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
            />
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Bell className="w-5 h-5 text-gray-600 cursor-pointer" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
            </div>
            
            <HelpCircle className="w-5 h-5 text-gray-600 cursor-pointer" />
            
            <div className="flex items-center space-x-3">
              <div 
                className="flex items-center space-x-3 cursor-pointer hover:bg-gray-100 p-2 rounded-lg transition-colors"
                onClick={handleProfileClick}
              >
                {user?.profilePicture ? (
                  <img 
                    src={user.profilePicture} 
                    alt={`${user.firstName} ${user.lastName}`}
                    className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-sm"
                  />
                ) : (
                  <div className={`w-8 h-8 ${getAvatarColor(user?.firstName || '')} rounded-full flex items-center justify-center border-2 border-white shadow-sm`}>
                    <span className="text-white font-medium text-sm">
                      {getInitials(user?.firstName, user?.lastName)}
                    </span>
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-800">
                    {user?.firstName} {user?.lastName}
                  </span>
                  <span className="text-xs text-gray-500">
                    {user?.role === 'admin' ? 'Administrator' : 'Agent'}
                  </span>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
