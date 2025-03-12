import { useCallback, useEffect, useState } from 'react';
import { AuthState, LoginCredentials, User, Permission } from '../types/auth';

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
      // Replace with your actual API call
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      const { user, token, refreshToken } = data;

      // Store in localStorage if rememberMe is true
      if (credentials.rememberMe) {
        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(user));
      }

      setState({
        user,
        token,
        refreshToken,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Login failed'
      }));
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setState(initialState);
  }, []);

  const hasPermission = useCallback(
    (resource: string, action: 'create' | 'read' | 'update' | 'delete'): boolean => {
      if (!state.user) return false;

      // Superadmin has all permissions
      if (state.user.role === 'superadmin') return true;

      return state.user.permissions.some(permission => {
        if (permission.resource === '*') return true;
        if (permission.resource !== resource) return false;
        return permission.actions.includes(action);
      });
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