import { API_CONFIG, getApiUrl, getAuthHeaders } from '../config/api.js';

// Generic API request function
const apiRequest = async (endpoint, options = {}) => {
  try {
    const response = await fetch(getApiUrl(endpoint), {
      ...options,
      headers: getAuthHeaders(),
    });

    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      // Handle non-JSON responses (like HTML error pages)
      console.error('Failed to parse JSON response:', parseError);
      console.error('Response status:', response.status);
      console.error('Response headers:', Object.fromEntries(response.headers.entries()));
      
      // Try to get response text for debugging
      const responseText = await response.text();
      console.error('Response text:', responseText.substring(0, 200) + '...');
      
      if (response.status === 429) {
        throw new Error('Too many requests. Please wait a moment and try again.');
      } else if (response.status >= 500) {
        throw new Error('Server error. Please try again later.');
      } else if (response.status === 404) {
        throw new Error('API endpoint not found. Please check your configuration.');
      } else {
        throw new Error(`Invalid response from server (${response.status}). Expected JSON but received: ${responseText.substring(0, 50)}...`);
      }
    }

    if (!response.ok) {
      // Handle rate limiting specifically
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After') || '15';
        throw new Error(`Rate limit exceeded. Please wait ${retryAfter} minutes before trying again.`);
      }
      
      throw new Error(data.message || data.error || 'API request failed');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Auth API calls
export const authAPI = {
  login: async (credentials) => {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  },

  getMe: async () => {
    return apiRequest('/auth/me');
  },

  refreshToken: async (refreshToken) => {
    return apiRequest('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken })
    });
  },

  logout: async () => {
    return apiRequest('/auth/logout', {
      method: 'POST'
    });
  }
};

// Client API calls
export const clientAPI = {
  getClients: async (params = {}) => {
    return apiRequest(`/clients${params ? `?${new URLSearchParams(params)}` : ''}`);
  },

  getClientById: async (id) => {
    return apiRequest(`/clients/${id}`);
  },

  getUniqueCountries: async () => {
    return apiRequest('/clients/countries');
  },

  getAvailableAgents: async () => {
    return apiRequest('/clients/agents');
  },

  createClient: async (clientData) => {
    return apiRequest('/clients', {
      method: 'POST',
      body: JSON.stringify(clientData)
    });
  },

  updateClient: async (id, clientData) => {
    return apiRequest(`/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(clientData)
    });
  },

  deleteClient: async (id) => {
    return apiRequest(`/clients/${id}`, {
      method: 'DELETE'
    });
  },

  assignClients: async (clientIds, agentId) => {
    return apiRequest('/clients/assign', {
      method: 'PUT',
      body: JSON.stringify({ clientIds, agentId })
    });
  },

  deleteClients: async (clientIds) => {
    return apiRequest('/clients/bulk-delete', {
      method: 'DELETE',
      body: JSON.stringify({ clientIds })
    });
  },

  exportClients: async (format = 'csv', clientIds = null) => {
    let url = '/api/clients/export?format=' + format;
    if (clientIds && clientIds.length > 0) {
      url += '&clientIds=' + clientIds.join(',');
    }
    
    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Export failed');
    }
    
    if (format === 'csv') {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'clients.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      return { message: 'Export successful' };
    } else {
      return response.json();
    }
  },

  importClients: async (clientsData) => {
    return apiRequest('/clients/import', {
      method: 'POST',
      body: JSON.stringify({ clients: clientsData })
    });
  },

  searchClients: async (query) => {
    return apiRequest(`/clients/search?q=${encodeURIComponent(query)}`);
  },

  addNote: async (clientId, content) => {
    return apiRequest(`/clients/${clientId}/notes`, {
      method: 'POST',
      body: JSON.stringify({ content })
    });
  },

  deleteNote: async (clientId, noteId) => {
    return apiRequest(`/clients/${clientId}/notes/${noteId}`, {
      method: 'DELETE'
    });
  }
};

// Task API calls
export const taskAPI = {
  getTasks: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/tasks${queryString ? `?${queryString}` : ''}`);
  },

  getTaskById: async (id) => {
    return apiRequest(`/tasks/${id}`);
  },

  createTask: async (taskData) => {
    return apiRequest('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData)
    });
  },

  updateTask: async (id, taskData) => {
    return apiRequest(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(taskData)
    });
  },

  deleteTask: async (id) => {
    return apiRequest(`/tasks/${id}`, {
      method: 'DELETE'
    });
  }
};

// Reports API calls
export const reportsAPI = {
  getDashboardStats: async () => {
    return apiRequest('/reports/dashboard');
  },

  getAnalytics: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/reports/analytics${queryString ? `?${queryString}` : ''}`);
  },

  getLeadStatusOverview: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/reports/lead-status-overview${queryString ? `?${queryString}` : ''}`);
  },

  getUserStats: async () => {
    return apiRequest('/reports/users');
  }
};

// User API calls
export const userAPI = {
  getProfile: async () => {
    return apiRequest('/users/profile');
  },

  getUserStats: async () => {
    return apiRequest('/users/stats');
  },

  updateProfile: async (userData) => {
    return apiRequest('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  },

  uploadProfilePicture: async (profilePicture) => {
    return apiRequest('/users/profile-picture', {
      method: 'POST',
      body: JSON.stringify({ profilePicture })
    });
  },

  changePassword: async (passwordData) => {
    return apiRequest('/users/change-password', {
      method: 'PUT',
      body: JSON.stringify(passwordData)
    });
  },

  createUser: async (userData) => {
    return apiRequest('/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },

  getUsers: async () => {
    return apiRequest('/users');
  },

  updateUser: async (userId, userData) => {
    return apiRequest(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  },

  deleteUser: async (userId) => {
    return apiRequest(`/users/${userId}`, {
      method: 'DELETE'
    });
  }
};

// Communication API calls
export const communicationAPI = {
  getStats: async () => {
    return apiRequest('/communications/stats');
  },

  getAnalytics: async () => {
    return apiRequest('/communications/analytics');
  },

  getActiveAgents: async () => {
    return apiRequest('/communications/agents');
  },

  getHistory: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/communications/history${queryString ? `?${queryString}` : ''}`);
  },

  initiateCall: async (callData) => {
    return apiRequest('/communications/call', {
      method: 'POST',
      body: JSON.stringify(callData)
    });
  },

  sendMessage: async (messageData) => {
    return apiRequest('/communications/message', {
      method: 'POST',
      body: JSON.stringify(messageData)
    });
  },

  sendEmail: async (emailData) => {
    return apiRequest('/communications/email', {
      method: 'POST',
      body: JSON.stringify(emailData)
    });
  }
};

// CLICK2CALL API calls
export const twilioAPI = {
  // Initialize Twilio
  initialize: async () => {
    try {
      const response = await apiRequest('/twilio/initialize', {
        method: 'POST'
      });
      return response;
    } catch (error) {
      console.error('Twilio initialization error:', error);
      return { success: false, error: error.message };
    }
  },

  // Get account info
  getAccountInfo: async () => {
    try {
      const response = await apiRequest('/twilio/account-info');
      return response;
    } catch (error) {
      console.error('Twilio account info error:', error);
      return { success: false, error: error.message };
    }
  },

  // Make a call
  makeCall: async (callData) => {
    try {
      const response = await apiRequest('/twilio/call', {
        method: 'POST',
        body: JSON.stringify(callData)
      });
      return response;
    } catch (error) {
      console.error('Twilio call error:', error);
      return { success: false, error: error.message };
    }
  },

  // End a call
  endCall: async (callSid) => {
    try {
      const response = await apiRequest('/twilio/end-call', {
        method: 'POST',
        body: JSON.stringify({ callSid })
      });
      return response;
    } catch (error) {
      console.error('Twilio end call error:', error);
      return { success: false, error: error.message };
    }
  }
};

// Call Statistics API
export const callStatsAPI = {
  // Track call button click
  trackCallClick: async () => {
    return apiRequest('/call-stats/track', {
      method: 'POST'
    });
  },

  // Get current user's call statistics
  getUserCallStats: async (days = 7) => {
    return apiRequest(`/call-stats/user?days=${days}`);
  },

  // Get today's call statistics for all users (Admin only)
  getTodayCallStats: async () => {
    return apiRequest('/call-stats/today');
  },

  // Get call statistics for all users (Admin only)
  getAllCallStats: async (days = 7) => {
    return apiRequest(`/call-stats/all?days=${days}`);
  }
};

// Export default for convenience
export default {
  auth: authAPI,
  clients: clientAPI,
  tasks: taskAPI,
  reports: reportsAPI,
  users: userAPI,
  communications: communicationAPI,
  callStats: callStatsAPI,
  twilio: twilioAPI
};
