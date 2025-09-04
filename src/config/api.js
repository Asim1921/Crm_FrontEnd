// Centralized API configuration
export const API_CONFIG = {
  // Environment-based API base URL
  BASE_URL: '/api',  // Use relative URL since both frontend and backend are on same domain
  
  // Default headers
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json'
  },
  
  // Timeout configuration
  TIMEOUT: 10000, // 10 seconds
  
  // Retry configuration
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000 // 1 second
};

// Helper function to get full API URL
export const getApiUrl = (endpoint) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Helper function to get auth headers
export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    ...API_CONFIG.DEFAULT_HEADERS,
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};
