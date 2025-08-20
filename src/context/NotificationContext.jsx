import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import notificationAPI from '../utils/notificationAPI';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [demoLoaded, setDemoLoaded] = useState(false);

  // Load notifications on component mount
  useEffect(() => {
    if (user) {
      loadNotifications();
      setupRealTimeUpdates();
      
      // Load demo notifications if none exist
      if (!demoLoaded) {
        loadDemoNotifications();
        setDemoLoaded(true);
      }
    }
  }, [user, demoLoaded]);

  // Update unread count whenever notifications change
  useEffect(() => {
    updateUnreadCount();
  }, [notifications]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      
      // Try to load from API first
      try {
        const response = await notificationAPI.getNotifications();
        if (response && response.notifications) {
          setNotifications(response.notifications);
          return;
        }
      } catch (apiError) {
        console.log('API not available, using local state only:', apiError.message);
      }
      
      // If no API or no notifications, start with empty array
      setNotifications([]);
    } catch (error) {
      console.error('Error loading notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const loadDemoNotifications = async () => {
    // Only add demo notifications if there are no existing notifications
    if (notifications.length === 0) {
      const demoNotifications = [
        {
          id: Date.now() - 300000, // 5 minutes ago
          type: 'system',
          title: 'Welcome to CRM System',
          message: 'Your notification system is now active. You\'ll receive notifications for all CRM activities.',
          timestamp: new Date(Date.now() - 300000),
          read: false,
          priority: 'low',
          action: 'view_details',
          data: {}
        },
        {
          id: Date.now() - 600000, // 10 minutes ago
          type: 'task',
          title: 'Task Reminder',
          message: 'Follow up with client John Doe is due today',
          timestamp: new Date(Date.now() - 600000),
          read: false,
          priority: 'high',
          action: 'view_task',
          data: { taskId: 'demo-task-1', clientId: 'demo-client-1' }
        },
        {
          id: Date.now() - 900000, // 15 minutes ago
          type: 'client',
          title: 'New Client Added',
          message: 'New client "Sarah Wilson" has been added to the system',
          timestamp: new Date(Date.now() - 900000),
          read: true,
          priority: 'medium',
          action: 'view_client',
          data: { clientId: 'demo-client-2', clientName: 'Sarah Wilson' }
        },
        {
          id: Date.now() - 1200000, // 20 minutes ago
          type: 'call',
          title: 'Call Completed',
          message: 'Call to +1 (555) 123-4567 completed successfully. Duration: 5m 32s',
          timestamp: new Date(Date.now() - 1200000),
          read: false,
          priority: 'medium',
          action: 'view_call',
          data: { 
            phoneNumber: '+1 (555) 123-4567', 
            clientId: 'demo-client-3', 
            clientName: 'Michael Johnson',
            duration: '5m 32s',
            status: 'completed'
          }
        }
      ];

      setNotifications(demoNotifications);
    }
  };

  const setupRealTimeUpdates = () => {
    // Set up real-time notification updates
    const unsubscribe = notificationAPI.subscribeToNotifications((newUnreadCount) => {
      setUnreadCount(newUnreadCount);
    });

    return unsubscribe;
  };

  const updateUnreadCount = () => {
    const unread = notifications.filter(notification => !notification.read).length;
    setUnreadCount(unread);
  };

  const addNotification = async (notification) => {
    const newNotification = {
      id: Date.now(),
      timestamp: new Date(),
      read: false,
      ...notification
    };

    // Try to save to API first
    try {
      await notificationAPI.createNotification(newNotification);
    } catch (apiError) {
      console.log('API not available, using local state only:', apiError.message);
    }

    setNotifications(prev => [newNotification, ...prev]);
  };

  const markAsRead = async (notificationId) => {
    try {
      // Try to update via API first
      await notificationAPI.markAsRead(notificationId);
    } catch (apiError) {
      console.log('API not available, using local state only:', apiError.message);
    }
    
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAllAsRead = async () => {
    try {
      // Try to update via API first
      await notificationAPI.markAllAsRead();
    } catch (apiError) {
      console.log('API not available, using local state only:', apiError.message);
    }
    
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const deleteNotification = async (notificationId) => {
    try {
      // Try to delete via API first
      await notificationAPI.deleteNotification(notificationId);
    } catch (apiError) {
      console.log('API not available, using local state only:', apiError.message);
    }
    
    setNotifications(prev => 
      prev.filter(notification => notification.id !== notificationId)
    );
  };

  const clearAllNotifications = async () => {
    try {
      // Try to clear via API first
      await notificationAPI.clearAllNotifications();
    } catch (apiError) {
      console.log('API not available, using local state only:', apiError.message);
    }
    
    setNotifications([]);
  };

  // Helper functions for adding specific types of notifications
  const addCallNotification = async (phoneNumber, clientName, clientId) => {
    await addNotification({
      type: 'call',
      title: 'New Incoming Call',
      message: `Incoming call from ${clientName} (${phoneNumber})`,
      priority: 'high',
      action: 'answer_call',
      data: { phoneNumber, clientId }
    });
  };

  const addMessageNotification = async (channel, clientName, clientId) => {
    await addNotification({
      type: 'message',
      title: `${channel.charAt(0).toUpperCase() + channel.slice(1)} Message Received`,
      message: `New message from ${clientName} in ${channel}`,
      priority: 'medium',
      action: 'open_chat',
      data: { channel, clientId }
    });
  };

  const addEmailNotification = async (email, subject, clientId) => {
    await addNotification({
      type: 'email',
      title: 'Email from Client',
      message: `New email from ${email} regarding ${subject}`,
      priority: 'medium',
      action: 'open_email',
      data: { email, subject, clientId }
    });
  };

  const addTaskNotification = async (taskTitle, dueDate, taskId, clientId) => {
    await addNotification({
      type: 'task',
      title: 'Task Reminder',
      message: `${taskTitle} is due ${dueDate}`,
      priority: 'high',
      action: 'view_task',
      data: { taskId, clientId }
    });
  };

  const addSystemNotification = async (title, message, priority = 'low') => {
    await addNotification({
      type: 'system',
      title,
      message,
      priority,
      action: 'view_details',
      data: {}
    });
  };

  const addClientNotification = async (action, clientName, clientId) => {
    let title, message, priority = 'medium';
    
    switch (action) {
      case 'created':
        title = 'New Client Added';
        message = `New client "${clientName}" has been added to the system`;
        break;
      case 'updated':
        title = 'Client Updated';
        message = `Client "${clientName}" information has been updated`;
        break;
      case 'deleted':
        title = 'Client Removed';
        message = `Client "${clientName}" has been removed from the system`;
        priority = 'high';
        break;
      default:
        title = 'Client Activity';
        message = `Activity with client "${clientName}"`;
    }

    await addNotification({
      type: 'client',
      title,
      message,
      priority,
      action: 'view_client',
      data: { clientId, clientName }
    });
  };

  const addAgentNotification = async (action, agentName, agentId) => {
    let title, message, priority = 'medium';
    
    switch (action) {
      case 'online':
        title = 'Agent Online';
        message = `${agentName} is now online`;
        priority = 'low';
        break;
      case 'offline':
        title = 'Agent Offline';
        message = `${agentName} is now offline`;
        priority = 'low';
        break;
      case 'busy':
        title = 'Agent Busy';
        message = `${agentName} is currently busy`;
        priority = 'medium';
        break;
      default:
        title = 'Agent Status';
        message = `Status change for ${agentName}`;
    }

    await addNotification({
      type: 'agent',
      title,
      message,
      priority,
      action: 'view_agent',
      data: { agentId, agentName }
    });
  };

  const addReportNotification = async (reportType, message) => {
    await addNotification({
      type: 'report',
      title: 'New Report Available',
      message: message,
      priority: 'low',
      action: 'view_report',
      data: { reportType }
    });
  };

  const value = {
    notifications,
    unreadCount,
    loading,
    addNotification,
    addCallNotification,
    addMessageNotification,
    addEmailNotification,
    addTaskNotification,
    addSystemNotification,
    addClientNotification,
    addAgentNotification,
    addReportNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    loadNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
