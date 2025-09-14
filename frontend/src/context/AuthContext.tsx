import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import toast from 'react-hot-toast';
import { User, AuthContextType, LoginData, RegisterData } from '../types';
import { authApi } from '../utils/api';
import { getFromStorage, setToStorage, removeFromStorage } from '../utils/helpers';
import { AUTH_CONFIG, SUCCESS_MESSAGES, ERROR_MESSAGES } from '../utils/constants';

// Auth state interface
interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isInitialized: boolean;
}

// Auth actions
type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: { user: User; token: string } }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'INITIALIZE'; payload: { user: User | null; token: string | null } };

// Initial state
const initialState: AuthState = {
  user: null,
  token: null,
  isLoading: false,
  isInitialized: false,
};

// Auth reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'SET_USER':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isLoading: false,
        isInitialized: true,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isLoading: false,
        isInitialized: true,
      };
    case 'INITIALIZE':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isInitialized: true,
        isLoading: false,
      };
    default:
      return state;
  }
};

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider props
interface AuthProviderProps {
  children: ReactNode;
}

// Auth provider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = getFromStorage<string | null>(AUTH_CONFIG.tokenKey, null);
        const userData = getFromStorage<User | null>(AUTH_CONFIG.userKey, null);

        if (token && userData) {
          // Verify token with server
          try {
            const user = await authApi.getMe();
            dispatch({
              type: 'INITIALIZE',
              payload: { user, token },
            });
          } catch (error) {
            // Token is invalid, clear storage
            removeFromStorage(AUTH_CONFIG.tokenKey);
            removeFromStorage(AUTH_CONFIG.userKey);
            dispatch({
              type: 'INITIALIZE',
              payload: { user: null, token: null },
            });
          }
        } else {
          dispatch({
            type: 'INITIALIZE',
            payload: { user: null, token: null },
          });
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        dispatch({
          type: 'INITIALIZE',
          payload: { user: null, token: null },
        });
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (email: string, password: string): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const response = await authApi.login({ email, password });
      
      if (response.success) {
        // Store auth data
        setToStorage(AUTH_CONFIG.tokenKey, response.token);
        setToStorage(AUTH_CONFIG.userKey, response.user);

        dispatch({
          type: 'SET_USER',
          payload: { user: response.user, token: response.token },
        });

        toast.success(SUCCESS_MESSAGES.LOGIN_SUCCESS);
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error: any) {
      dispatch({ type: 'SET_LOADING', payload: false });
      
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          ERROR_MESSAGES.GENERIC_ERROR;
      
      toast.error(errorMessage);
      throw error;
    }
  };

  // Register function
  const register = async (data: RegisterData): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const response = await authApi.register(data);
      
      if (response.success) {
        // Store auth data
        setToStorage(AUTH_CONFIG.tokenKey, response.token);
        setToStorage(AUTH_CONFIG.userKey, response.user);

        dispatch({
          type: 'SET_USER',
          payload: { user: response.user, token: response.token },
        });

        toast.success(SUCCESS_MESSAGES.REGISTER_SUCCESS);
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error: any) {
      dispatch({ type: 'SET_LOADING', payload: false });
      
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          ERROR_MESSAGES.GENERIC_ERROR;
      
      toast.error(errorMessage);
      throw error;
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      // Call logout API (mainly for server-side cleanup if needed)
      if (state.token) {
        await authApi.logout();
      }
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('Logout API error:', error);
    } finally {
      // Clear local storage
      removeFromStorage(AUTH_CONFIG.tokenKey);
      removeFromStorage(AUTH_CONFIG.userKey);

      dispatch({ type: 'LOGOUT' });
      toast.success(SUCCESS_MESSAGES.LOGOUT_SUCCESS);
    }
  };

  // Update user function
  const updateUser = (user: User): void => {
    setToStorage(AUTH_CONFIG.userKey, user);
    dispatch({ type: 'UPDATE_USER', payload: user });
  };

  // Computed values
  const isAuthenticated = !!state.user && !!state.token;
  const isAdmin = state.user?.role === 'admin';
  const isStudent = state.user?.role === 'student';

  // Context value
  const value: AuthContextType = {
    user: state.user,
    token: state.token,
    isLoading: state.isLoading,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated,
    isAdmin,
    isStudent,
  };

  // Don't render children until auth is initialized
  if (!state.isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default AuthContext;
