import { authAPI } from './api';

class SessionManager {
  constructor() {
    this.tokenRefreshTimer = null;
    this.isRefreshing = false;
    this.failedQueue = [];
    this.isInitialized = false;
  }

  // Initialize session management
  init() {
    if (this.isInitialized) {
      console.log('Session manager already initialized');
      return;
    }
    
    const token = localStorage.getItem('token');
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!token || !refreshToken) {
      console.log('No tokens found, skipping session manager initialization');
      return;
    }
    
    console.log('Initializing session manager...');
    this.setupTokenRefresh();
    this.setupStorageListener();
    this.isInitialized = true;
  }

  // Setup automatic token refresh
  setupTokenRefresh() {
    const token = localStorage.getItem('token');
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (token && refreshToken) {
      this.scheduleTokenRefresh();
    }
  }

  // Setup session when tokens become available (called after login)
  setupSession() {
    if (!this.isInitialized) {
      this.init();
    } else {
      this.setupTokenRefresh();
    }
  }

  // Schedule token refresh before expiration
  scheduleTokenRefresh() {
    if (this.tokenRefreshTimer) {
      clearTimeout(this.tokenRefreshTimer);
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiresAt = payload.exp * 1000; // Convert to milliseconds
      const now = Date.now();
      const timeUntilExpiry = expiresAt - now;
      
      // If token is already expired, refresh immediately
      if (timeUntilExpiry <= 0) {
        console.log('Token expired, refreshing immediately');
        this.refreshToken();
        return;
      }
      
      // Refresh token 1 day before expiration (24 hours = 24 * 60 * 60 * 1000 ms)
      const refreshTime = timeUntilExpiry - (24 * 60 * 60 * 1000);
      
      // If token expires in less than 1 day, refresh in 1 hour
      const finalRefreshTime = refreshTime > 0 ? refreshTime : (60 * 60 * 1000);
      
      const hoursUntilRefresh = Math.round(finalRefreshTime / 1000 / 60 / 60);
      const daysUntilExpiry = Math.round(timeUntilExpiry / 1000 / 60 / 60 / 24);
      
      console.log(`Token expires in ${daysUntilExpiry} days, scheduling refresh in ${hoursUntilRefresh} hours`);
      
      this.tokenRefreshTimer = setTimeout(() => {
        this.refreshToken();
      }, finalRefreshTime);
    } catch (error) {
      console.error('Error parsing token:', error);
      // If token parsing fails, clear session
      this.handleTokenRefreshFailure();
    }
  }

  // Refresh token
  async refreshToken() {
    if (this.isRefreshing) {
      console.log('Token refresh already in progress, queuing request');
      return new Promise((resolve, reject) => {
        this.failedQueue.push({ resolve, reject });
      });
    }

    this.isRefreshing = true;
    console.log('Starting token refresh...');
    
    const refreshToken = localStorage.getItem('refreshToken');

    if (!refreshToken) {
      console.error('No refresh token found');
      this.handleTokenRefreshFailure();
      return;
    }

    try {
      const response = await authAPI.refreshToken(refreshToken);
      
      localStorage.setItem('token', response.token);
      localStorage.setItem('refreshToken', response.refreshToken);
      
      // Resolve queued requests
      this.failedQueue.forEach(({ resolve }) => resolve(response.token));
      this.failedQueue = [];
      
      // Schedule next refresh
      this.scheduleTokenRefresh();
      
      console.log('Token refreshed successfully');
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.handleTokenRefreshFailure();
    } finally {
      this.isRefreshing = false;
    }
  }

  // Handle token refresh failure
  handleTokenRefreshFailure() {
    console.log('Handling token refresh failure...');
    
    // Clear all tokens
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    
    // Clear timer
    if (this.tokenRefreshTimer) {
      clearTimeout(this.tokenRefreshTimer);
      this.tokenRefreshTimer = null;
    }
    
    // Reject queued requests
    this.failedQueue.forEach(({ reject }) => reject(new Error('Token refresh failed')));
    this.failedQueue = [];
    
    this.isRefreshing = false;
    
    // Redirect to login
    window.location.href = '/login';
  }

  // Setup storage listener for cross-tab synchronization
  setupStorageListener() {
    window.addEventListener('storage', (event) => {
      if (event.key === 'token' || event.key === 'refreshToken') {
        // Token was updated in another tab
        console.log('Token updated in another tab, rescheduling refresh');
        this.setupTokenRefresh();
      }
    });
  }

  // Check if user is authenticated
  isAuthenticated() {
    const token = localStorage.getItem('token');
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const isValid = payload.exp * 1000 > Date.now();
      console.log('Token validation:', { isValid, expiresAt: new Date(payload.exp * 1000) });
      return isValid;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  }

  // Get token expiration time
  getTokenExpiration() {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return new Date(payload.exp * 1000);
    } catch (error) {
      return null;
    }
  }

  // Clear session
  clearSession() {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    
    if (this.tokenRefreshTimer) {
      clearTimeout(this.tokenRefreshTimer);
      this.tokenRefreshTimer = null;
    }
    
    this.isRefreshing = false;
    this.failedQueue = [];
    this.isInitialized = false;
  }

  // Logout
  async logout() {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await authAPI.logout();
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearSession();
    }
  }
}

// Create singleton instance
const sessionManager = new SessionManager();

export default sessionManager;
