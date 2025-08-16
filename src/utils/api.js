const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Define the request function first
const request = async (endpoint, options = {}) => {
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
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }

    return data;
  } catch (error) {
    throw error;
  }
};

// Now define the api object
const api = {
  request,

  // Auth
  login: (credentials) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  }),

  getMe: () => request('/auth/me'),

  // Clients
  getClients: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return request(`/clients?${queryString}`);
  },

  createClient: (clientData) => request('/clients', {
    method: 'POST',
    body: JSON.stringify(clientData),
  }),

  updateClient: (id, clientData) => request(`/clients/${id}`, {
    method: 'PUT',
    body: JSON.stringify(clientData),
  }),

  getClientById: (id) => request(`/clients/${id}`),

  // Tasks
  getTasks: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return request(`/tasks?${queryString}`);
  },

  createTask: (taskData) => request('/tasks', {
    method: 'POST',
    body: JSON.stringify(taskData),
  }),

  updateTask: (id, taskData) => request(`/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(taskData),
  }),

  // Reports
  getDashboardStats: () => request('/reports/dashboard'),
  getAnalytics: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return request(`/reports/analytics?${queryString}`);
  },
};

export default api;
