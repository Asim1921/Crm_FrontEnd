const API_BASE_URL = '/api';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// Generic API request function
const apiRequest = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: getAuthHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }

    return data;
  } catch (error) {
    console.error('Telegram API Error:', error);
    throw error;
  }
};

// Telegram API functions
export const telegramAPI = {
  // Send anonymous message via Telegram Bot
  sendAnonymousMessage: async (messageData) => {
    return apiRequest('/telegram/send-anonymous', {
      method: 'POST',
      body: JSON.stringify(messageData)
    });
  },

  // Get bot status and configuration
  getBotStatus: async () => {
    return apiRequest('/telegram/status');
  },

  // Get setup instructions
  getSetupInstructions: async () => {
    return apiRequest('/telegram/setup-instructions');
  },

  // Check if bot is configured and ready
  isBotReady: async () => {
    try {
      const status = await telegramAPI.getBotStatus();
      return status.configured;
    } catch (error) {
      console.error('Error checking bot status:', error);
      return false;
    }
  },

  // Format message for anonymous sending
  formatAnonymousMessage: (client, message, agent) => {
    return {
      clientId: client._id,
      clientName: `${client.firstName} ${client.lastName}`,
      phoneNumber: client.phone.replace(/\D/g, ''),
      message: message,
      agentId: agent._id,
      agentName: `${agent.firstName} ${agent.lastName}`
    };
  },

  // Validate message data
  validateMessageData: (messageData) => {
    const errors = [];
    
    if (!messageData.clientName) {
      errors.push('Client name is required');
    }
    
    if (!messageData.phoneNumber) {
      errors.push('Phone number is required');
    }
    
    if (!messageData.message) {
      errors.push('Message content is required');
    }
    
    if (!messageData.agentName) {
      errors.push('Agent name is required');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // Demo mode for testing (when bot is not configured)
  demoMode: {
    sendAnonymousMessage: async (messageData) => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate success response
      return {
        success: true,
        message: 'Demo: Anonymous Telegram message sent successfully',
        data: {
          clientName: messageData.clientName,
          messagePreview: messageData.message.substring(0, 50) + (messageData.message.length > 50 ? '...' : ''),
          sentAt: new Date(),
          mode: 'anonymous',
          demo: true
        }
      };
    },

    getBotStatus: async () => {
      return {
        configured: false,
        message: 'Demo mode: Telegram Bot not configured',
        setupRequired: true,
        demo: true
      };
    }
  }
};

export default telegramAPI;
