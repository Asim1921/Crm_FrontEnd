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

  exportClients: async (format = 'csv') => {
    const response = await fetch('/api/clients/export?format=' + format, {
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

// Twilio API calls
export const twilioAPI = {
  makeCall: async (callData) => {
    return apiRequest('/twilio/call', {
      method: 'POST',
      body: JSON.stringify(callData)
    });
  },

  endCall: async (callSid) => {
    return apiRequest('/twilio/end-call', {
      method: 'POST',
      body: JSON.stringify({ callSid })
    });
  },

  getCallStatus: async (callSid) => {
    return apiRequest(`/twilio/call-status/${callSid}`);
  },

  getRecentCalls: async (limit = 10) => {
    return apiRequest(`/twilio/recent-calls?limit=${limit}`);
  },

  getAccountInfo: async () => {
    return apiRequest('/twilio/account-info');
  }
};

// Export default for convenience
export default {
  auth: authAPI,
  clients: clientAPI,
  tasks: taskAPI,
  reports: reportsAPI,
  users: userAPI,
  communications: communicationAPI
};
