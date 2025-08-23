import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useSearch } from '../context/SearchContext';
import { useNavigate } from 'react-router-dom';
import { clientAPI } from '../utils/api';
import { 
  Search, 
  Bell, 
  HelpCircle, 
  ChevronDown, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  Clock,
  Phone,
  MessageCircle,
  Mail,
  Users,
  Settings,
  Trash2,
  User,
  FileText,
  TrendingUp,
  Menu
} from 'lucide-react';
import logo from '../logo.png';

const Header = ({ title, onMenuClick, isMobile }) => {
  const { user } = useAuth();
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification, 
    clearAllNotifications 
  } = useNotifications();
  const { 
    headerSearchQuery, 
    headerSearchResults, 
    isHeaderSearching, 
    updateHeaderSearch, 
    clearHeaderSearch, 
    setHeaderResults, 
    setHeaderSearching 
  } = useSearch();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const notificationRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    // Close notifications when clicking outside
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleNotificationClick = (notification) => {
    // Mark as read
    markAsRead(notification.id);

    // Handle different notification actions
    switch (notification.action) {
      case 'answer_call':
        // Navigate to communications hub with call focus
        navigate('/communications', { state: { focusCall: notification.data } });
        break;
      case 'open_chat':
        // Navigate to communications hub with chat focus
        navigate('/communications', { state: { focusChat: notification.data } });
        break;
      case 'open_email':
        // Navigate to communications hub with email focus
        navigate('/communications', { state: { focusEmail: notification.data } });
        break;
      case 'view_task':
        // Navigate to task management
        navigate('/tasks', { state: { taskId: notification.data.taskId } });
        break;
      case 'view_agent':
        // Navigate to agent management or show agent details
        navigate('/communications', { state: { agentId: notification.data.agentId } });
        break;
      case 'view_client':
        // Navigate to client profile
        navigate(`/clients/${notification.data.clientId}`);
        break;
      case 'view_report':
        // Navigate to reports
        navigate('/reports', { state: { reportType: notification.data.reportType } });
        break;
      case 'view_call':
        // Navigate to communications hub with call focus
        navigate('/communications', { state: { focusCall: notification.data } });
        break;
      case 'view_details':
        // Show details modal or navigate to settings
        navigate('/settings', { state: { maintenanceId: notification.data.maintenanceId } });
        break;
      default:
        break;
    }

    setShowNotifications(false);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'call':
        return <Phone className="w-4 h-4 text-green-600" />;
      case 'message':
        return <MessageCircle className="w-4 h-4 text-blue-600" />;
      case 'email':
        return <Mail className="w-4 h-4 text-orange-600" />;
      case 'task':
        return <CheckCircle className="w-4 h-4 text-purple-600" />;
      case 'agent':
        return <Users className="w-4 h-4 text-indigo-600" />;
      case 'client':
        return <User className="w-4 h-4 text-teal-600" />;
      case 'report':
        return <FileText className="w-4 h-4 text-cyan-600" />;
      case 'system':
        return <Settings className="w-4 h-4 text-gray-600" />;
      default:
        return <Info className="w-4 h-4 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500';
      case 'medium':
        return 'border-l-yellow-500';
      case 'low':
        return 'border-l-green-500';
      default:
        return 'border-l-gray-500';
    }
  };

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return timestamp.toLocaleDateString();
  };

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

  // Search functionality
  const handleSearch = async (query) => {
    updateHeaderSearch(query);
    
    if (query.trim().length >= 2) {
      setHeaderSearching(true);
      try {
        const response = await clientAPI.searchClients(query);
        setHeaderResults(response);
        setShowSearchDropdown(true);
      } catch (error) {
        console.error('Error searching clients:', error);
        setHeaderResults([]);
      } finally {
        setHeaderSearching(false);
      }
    } else {
      setHeaderResults([]);
      setShowSearchDropdown(false);
    }
  };

  const handleClientClick = (client) => {
    clearHeaderSearch();
    setShowSearchDropdown(false);
    navigate(`/clients/${client._id}`);
  };

  const handleSearchFocus = () => {
    if (headerSearchQuery.trim().length >= 2 && headerSearchResults.length > 0) {
      setShowSearchDropdown(true);
    }
  };

  const handleSearchBlur = () => {
    // Delay hiding dropdown to allow for clicks
    setTimeout(() => {
      setShowSearchDropdown(false);
    }, 200);
  };

  return (
    <div className="bg-white border-b border-gray-200 px-4 lg:px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 lg:space-x-4">
          {/* Mobile menu button */}
          {isMobile && (
            <button
              onClick={onMenuClick}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors lg:hidden"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
          )}
          
          <div className="flex items-center space-x-3">
            <img 
              src={logo} 
              alt="CRM Logo" 
              className="h-8 lg:h-10 w-auto object-contain"
            />
            <div className="flex flex-col">
              <h1 className="text-lg lg:text-xl font-bold text-gray-800">{title}</h1>
              <span className="bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full font-medium">
            {user?.role === 'admin' ? 'Administrator' : 'Agent'}
          </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 lg:space-x-4">
          {/* Search bar - visible on all screens */}
          <div className="relative" ref={searchRef}>
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <input
                type="text"
                placeholder="Search by name, ID, or email..."
                value={headerSearchQuery}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-48 lg:w-64"
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={handleSearchFocus}
                onBlur={handleSearchBlur}
              />
            
            {/* Search Dropdown */}
            {showSearchDropdown && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-96 overflow-y-auto">
                {isHeaderSearching ? (
                  <div className="p-4 text-center text-gray-500">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-sm">Searching...</p>
                  </div>
                ) : headerSearchResults.length > 0 ? (
                  <div className="py-2">
                    {headerSearchResults.map((client) => (
                      <div
                        key={client._id}
                        onClick={() => handleClientClick(client)}
                        className="flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {client.firstName?.charAt(0)}{client.lastName?.charAt(0)}
                          </span>
                        </div>
                        <div className="ml-3 flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {client.firstName} {client.lastName}
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            ID: {client.clientId}
                          </p>
                          {user?.role === 'admin' && (
                            <p className="text-sm text-gray-500 truncate">
                              {client.email}
                            </p>
                          )}
                          <div className="flex items-center mt-1">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              client.status === 'New Lead' ? 'bg-green-100 text-green-800' :
                              client.status === 'FTD' ? 'bg-blue-100 text-blue-800' :
                              client.status === 'Call Again' ? 'bg-orange-100 text-orange-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {client.status}
                            </span>
                            {client.country && (
                              <span className="ml-2 text-xs text-gray-500">
                                • {client.country}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : headerSearchQuery.trim().length >= 2 ? (
                  <div className="p-4 text-center text-gray-500">
                    <p className="text-sm">No clients found</p>
                  </div>
                ) : null}
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2 lg:space-x-3">
            {/* Notification Bell */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Bell className="w-4 h-4 lg:w-5 lg:h-5 text-gray-600" />
                {unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 lg:w-5 lg:h-5 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-medium">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  </div>
                )}
              </button>

                             {/* Notification Dropdown */}
               {showNotifications && (
                 <div className="absolute right-0 mt-2 w-80 lg:w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                      <div className="flex items-center space-x-2">
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Mark all read
                          </button>
                        )}
                        {notifications.length > 0 && (
                          <button
                            onClick={clearAllNotifications}
                            className="text-sm text-red-600 hover:text-red-800 font-medium"
                          >
                            Clear all
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center">
                        <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No notifications</p>
                        <p className="text-xs text-gray-400 mt-1">Notifications will appear here as you use the system</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors border-l-4 ${getPriorityColor(notification.priority)} ${
                              !notification.read ? 'bg-blue-50' : ''
                            }`}
                            onClick={() => handleNotificationClick(notification)}
                          >
                            <div className="flex items-start space-x-3">
                              <div className="flex-shrink-0 mt-1">
                                {getNotificationIcon(notification.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <p className={`text-sm font-medium ${
                                    !notification.read ? 'text-gray-900' : 'text-gray-700'
                                  }`}>
                                    {notification.title}
                                  </p>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-xs text-gray-500">
                                      {formatTimestamp(notification.timestamp)}
                                    </span>
                                    {!notification.read && (
                                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    )}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        deleteNotification(notification.id);
                                      }}
                                      className="text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">
                                  {notification.message}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {notifications.length > 0 && (
                    <div className="p-3 border-t border-gray-200 bg-gray-50">
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>{unreadCount} unread</span>
                        <span>{notifications.length} total</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <HelpCircle className="w-4 h-4 lg:w-5 lg:h-5 text-gray-600 cursor-pointer" />
            
            <div className="flex items-center space-x-2 lg:space-x-3">
              <div 
                className="flex items-center space-x-2 lg:space-x-3 cursor-pointer hover:bg-gray-100 p-2 rounded-lg transition-colors"
                onClick={handleProfileClick}
              >
                {user?.profilePicture ? (
                  <img 
                    src={user.profilePicture} 
                    alt={`${user.firstName} ${user.lastName}`}
                    className="w-7 h-7 lg:w-8 lg:h-8 rounded-full object-cover border-2 border-white shadow-sm"
                  />
                ) : (
                  <div className={`w-7 h-7 lg:w-8 lg:h-8 ${getAvatarColor(user?.firstName || '')} rounded-full flex items-center justify-center border-2 border-white shadow-sm`}>
                    <span className="text-white font-medium text-xs lg:text-sm">
                      {getInitials(user?.firstName, user?.lastName)}
                    </span>
                  </div>
                )}
                <div className="flex flex-col hidden sm:block">
                  <span className="text-xs lg:text-sm font-medium text-gray-800">
                    {user?.firstName} {user?.lastName}
                  </span>
                  <span className="text-xs text-gray-500">
                    {user?.role === 'admin' ? 'Administrator' : 'Agent'}
                  </span>
                </div>
                <ChevronDown className="w-3 h-3 lg:w-4 lg:h-4 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
