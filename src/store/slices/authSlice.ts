import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axiosInstance from '../../utils/axios';
import { API_BASE_URL } from '../../config/api';

// Types
interface User {
  id: string;
  name: string;
  username: string;
  role: string;
  lastLogin?: {
    timestamp: string;
    ip: string;
  };
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

interface LoginResponse {
  token: string;
  user: User;
}

// Helper function to handle error messages
const getErrorMessage = (error: unknown, defaultMessage: string): string => {
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }
  return defaultMessage;
};

// Helper function to initialize auth state from localStorage
const initializeAuthState = (): AuthState => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  let user = null;
  
  try {
    if (userStr) {
      user = JSON.parse(userStr);
    }
  } catch (error) {
    console.error('Error parsing stored user:', error);
    localStorage.removeItem('user');
  }

  return {
    isAuthenticated: Boolean(token && user),
    user,
    token,
    loading: false,
    error: null,
  };
};

// Async thunks
export const login = createAsyncThunk<LoginResponse, { username: string; password: string }>(
  'auth/login',
  async (credentials) => {
    const response = await axiosInstance.post<LoginResponse>(
      `${API_BASE_URL}/auth/login`,
      credentials
    );
    
    const { token, user } = response.data;
    
    // Store in localStorage
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    return response.data;
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  try {
    await axiosInstance.post(`${API_BASE_URL}/auth/logout`);
  } finally {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
});

export const fetchCurrentUser = createAsyncThunk<
  User,
  void,
  { state: { auth: AuthState }; rejectValue: string }
>(
  'auth/fetchCurrentUser',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      
      if (!auth.token) {
        return rejectWithValue('No authentication token found');
      }
      
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${auth.token}`;
      const response = await axiosInstance.get<User>(`${API_BASE_URL}/auth/me`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch user');
    }
  }
);

export const changePassword = createAsyncThunk<
  void,
  { currentPassword: string; newPassword: string },
  { state: { auth: AuthState }; rejectValue: string }
>(
  'auth/changePassword',
  async (passwordData, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      
      if (!auth.token) {
        return rejectWithValue('Not authenticated');
      }
      
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${auth.token}`;
      await axiosInstance.post(`${API_BASE_URL}/auth/change-password`, passwordData);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to change password');
    }
  }
);

export const updateUserProfile = createAsyncThunk<
  User,
  { name: string },
  { state: { auth: AuthState }; rejectValue: string }
>(
  'auth/updateUserProfile',
  async (profileData, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      
      if (!auth.token || !auth.user) {
        return rejectWithValue('Not authenticated');
      }
      
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${auth.token}`;
      const response = await axiosInstance.put<User>(`${API_BASE_URL}/auth/profile`, profileData);
      
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update profile');
    }
  }
);

// Slice
const authSlice = createSlice({
  name: 'auth',
  initialState: initializeAuthState(),
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action: PayloadAction<LoginResponse>) => {
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.loading = false;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = getErrorMessage(action.error, 'Login failed');
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.loading = false;
        state.error = null;
      })
      // Fetch current user
      .addCase(fetchCurrentUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.loading = false;
        state.error = getErrorMessage(action.error, 'Failed to fetch user');
        
        // If token is invalid, logout
        if (action.payload === 'Invalid or expired token') {
          state.isAuthenticated = false;
          state.token = null;
          state.user = null;
          localStorage.removeItem('token');
          delete axiosInstance.defaults.headers.common['Authorization'];
        }
      })
      // Change password
      .addCase(changePassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.loading = false;
        state.error = getErrorMessage(action.error, 'Failed to change password');
      })
      // Update profile
      .addCase(updateUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        localStorage.setItem('user', JSON.stringify(action.payload));
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = getErrorMessage(action.error, 'Failed to update profile');
      });
  },
});

export const { clearError, setError } = authSlice.actions;
export default authSlice.reducer; 