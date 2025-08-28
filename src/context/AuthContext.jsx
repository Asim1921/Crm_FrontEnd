import { createContext, useContext, useReducer, useEffect } from 'react';
import sessionManager from '../utils/sessionManager';

const AuthContext = createContext();

const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  refreshToken: localStorage.getItem('refreshToken'),
  isAuthenticated: false,
  loading: true
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      localStorage.setItem('token', action.payload.token);
      localStorage.setItem('refreshToken', action.payload.refreshToken);
      
      // Setup session manager after storing tokens
      sessionManager.setupSession();
      
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        refreshToken: action.payload.refreshToken,
        isAuthenticated: true,
        loading: false
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload
      };
    case 'LOGIN_FAIL':
    case 'LOGOUT':
      sessionManager.clearSession();
      return {
        ...state,
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        loading: false
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const loadUser = async () => {
      if (state.token) {
        try {
          console.log('Loading user with token:', state.token.substring(0, 20) + '...');
          const response = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${state.token}`
            }
          });
          
          if (response.ok) {
            const user = await response.json();
            console.log('User loaded successfully:', user.email);
            dispatch({
              type: 'LOGIN_SUCCESS',
              payload: { 
                user, 
                token: state.token,
                refreshToken: state.refreshToken 
              }
            });
          } else {
            console.error('Failed to load user, status:', response.status);
            dispatch({ type: 'LOGOUT' });
          }
        } catch (error) {
          console.error('Error loading user:', error);
          dispatch({ type: 'LOGOUT' });
        }
      } else {
        console.log('No token found, setting loading to false');
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    loadUser();
  }, [state.token]);

  // Initialize session manager only once
  useEffect(() => {
    sessionManager.init();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: {
            user: {
              _id: data._id,
              firstName: data.firstName,
              lastName: data.lastName,
              email: data.email,
              role: data.role
            },
            token: data.token,
            refreshToken: data.refreshToken
          }
        });
        
        // Setup session manager after successful login
        sessionManager.setupSession();
        
        return { success: true };
      } else {
        throw new Error(data.message || 'Login failed');
      }
    } catch (error) {
      throw new Error(error.message || 'Network error');
    }
  };

  const logout = async () => {
    try {
      await sessionManager.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      dispatch({ type: 'LOGOUT' });
    }
  };

  const updateUser = (userData) => {
    dispatch({ type: 'UPDATE_USER', payload: userData });
  };

  return (
    <AuthContext.Provider value={{
      user: state.user,
      token: state.token,
      isAuthenticated: state.isAuthenticated,
      loading: state.loading,
      login,
      logout,
      updateUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
