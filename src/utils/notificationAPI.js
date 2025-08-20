const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class NotificationAPI {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Get all notifications for the current user
  async getNotifications(limit = 50, offset = 0) {
    try {
      // For demo purposes, return simulated notifications
      const demoNotifications = [
        {
          _id: '1',
          type: 'call',
          title: 'Call Completed',
          message: 'Call to +1 (555) 123-4567 completed successfully',
          timestamp: new Date(Date.now() - 300000), // 5 minutes ago
          read: false,
          priority: 'medium'
        },
        {
          _id: '2',
          type: 'message',
          title: 'WhatsApp Message Sent',
          message: 'Message sent to John Doe via WhatsApp',
          timestamp: new Date(Date.now() - 600000), // 10 minutes ago
          read: false,
          priority: 'low'
        },
        {
          _id: '3',
          type: 'email',
          title: 'Email Delivered',
          message: 'Welcome email sent to sarah@example.com',
          timestamp: new Date(Date.now() - 900000), // 15 minutes ago
          read: true,
          priority: 'low'
        }
      ];
      
      return {
        success: true,
        notifications: demoNotifications.slice(offset, offset + limit),
        total: demoNotifications.length,
        limit,
        offset
      };
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  // Get unread notifications count
  async getUnreadCount() {
    try {
      // For demo purposes, return simulated unread count
      return {
        success: true,
        unreadCount: 2
      };
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }
  }

  // Mark a notification as read
  async markAsRead(notificationId) {
    try {
      // For demo purposes, simulate success
      console.log(`Marking notification ${notificationId} as read`);
      return { success: true };
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read
  async markAllAsRead() {
    try {
      // For demo purposes, simulate success
      console.log('Marking all notifications as read');
      return { success: true };
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Delete a notification
  async deleteNotification(notificationId) {
    try {
      // For demo purposes, simulate success
      console.log(`Deleting notification ${notificationId}`);
      return { success: true };
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  // Clear all notifications
  async clearAllNotifications() {
    try {
      // For demo purposes, simulate success
      console.log('Clearing all notifications');
      return { success: true };
    } catch (error) {
      console.error('Error clearing all notifications:', error);
      throw error;
    }
  }

  // Create a new notification
  async createNotification(notificationData) {
    try {
      // For demo purposes, simulate success
      console.log('Creating notification:', notificationData);
      return { 
        success: true, 
        notification: {
          _id: Math.random().toString(36).substr(2, 9),
          ...notificationData,
          timestamp: new Date()
        }
      };
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Get notification settings for the current user
  async getNotificationSettings() {
    return this.request('/notifications/settings');
  }

  // Update notification settings
  async updateNotificationSettings(settings) {
    return this.request('/notifications/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  // Subscribe to real-time notifications (WebSocket)
  subscribeToNotifications(callback) {
    // In a real implementation, this would set up WebSocket connection
    // For now, we'll simulate with polling
    const interval = setInterval(async () => {
      try {
        const unreadCount = await this.getUnreadCount();
        if (unreadCount.success) {
          callback(unreadCount);
        }
      } catch (error) {
        console.error('Error polling notifications:', error);
      }
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(interval);
  }

  // Helper methods for creating specific types of notifications
  async createCallNotification(phoneNumber, clientName, clientId) {
    return this.createNotification({
      type: 'call',
      title: 'New Incoming Call',
      message: `Incoming call from ${clientName} (${phoneNumber})`,
      priority: 'high',
      action: 'answer_call',
      data: { phoneNumber, clientId },
    });
  }

  async createMessageNotification(channel, clientName, clientId) {
    return this.createNotification({
      type: 'message',
      title: `${channel.charAt(0).toUpperCase() + channel.slice(1)} Message Received`,
      message: `New message from ${clientName} in ${channel}`,
      priority: 'medium',
      action: 'open_chat',
      data: { channel, clientId },
    });
  }

  async createEmailNotification(email, subject, clientId) {
    return this.createNotification({
      type: 'email',
      title: 'Email from Client',
      message: `New email from ${email} regarding ${subject}`,
      priority: 'medium',
      action: 'open_email',
      data: { email, subject, clientId },
    });
  }

  async createTaskNotification(taskTitle, dueDate, taskId, clientId) {
    return this.createNotification({
      type: 'task',
      title: 'Task Reminder',
      message: `${taskTitle} is due ${dueDate}`,
      priority: 'high',
      action: 'view_task',
      data: { taskId, clientId },
    });
  }

  async createSystemNotification(title, message, priority = 'low') {
    return this.createNotification({
      type: 'system',
      title,
      message,
      priority,
      action: 'view_details',
      data: {},
    });
  }
}

export default new NotificationAPI();
