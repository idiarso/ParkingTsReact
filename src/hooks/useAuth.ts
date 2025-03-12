import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { AuthState, LoginCredentials, User, Permission } from '../types/auth';

interface LoginResponse {
  user: User;
  token: string;
  refreshToken: string;
}

interface ApiError {
  message: string;
}

const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,
  error: null
};

export const useAuth = () => {
  const [state, setState] = useState<AuthState>(initialState);

  // Load auth state from localStorage on mount
  useEffect(() => {
    const loadAuthState = () => {
      try {
        const token = localStorage.getItem('token');
        const refreshToken = localStorage.getItem('refreshToken');
        const user = localStorage.getItem('user');

        if (token && user) {
          setState({
            user: JSON.parse(user),
            token,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
        } else {
          setState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error('Failed to load auth state:', error);
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };

    loadAuthState();
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await axios.post<LoginResponse>('/auth/login', credentials);
      const { user, token, refreshToken } = response.data;

      // Store in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));

      // Update axios default headers
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      setState({
        user,
        token,
        refreshToken,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });
    } catch (err: unknown) {
      console.error('Login error:', err);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Login failed'
      }));
      throw err;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setState(initialState);
  }, []);

  const hasPermission = useCallback(
    (resource: string, action: 'create' | 'read' | 'update' | 'delete'): boolean => {
      if (!state.user) return false;

      // Superadmin has all permissions
      if (state.user.role === 'superadmin') return true;

      return state.user.permissions?.some(permission => {
        if (permission.resource === '*') return true;
        if (permission.resource !== resource) return false;
        return permission.actions.includes(action);
      }) || false;
    },
    [state.user]
  );

  const updateUser = useCallback((user: User) => {
    setState(prev => ({ ...prev, user }));
    localStorage.setItem('user', JSON.stringify(user));
  }, []);

  return {
    ...state,
    login,
    logout,
    hasPermission,
    updateUser
  };
};

export default useAuth; 