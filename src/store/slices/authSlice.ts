import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
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

// Initial state
const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: localStorage.getItem('token'),
  loading: false,
  error: null
};

// Async actions
export const login = createAsyncThunk<
  LoginResponse,
  { username: string; password: string },
  { rejectValue: string }
>(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await axios.post<LoginResponse>(`${API_BASE_URL}/auth/login`, credentials);
      const { token, user } = response.data;
      
      // Save token to localStorage
      localStorage.setItem('token', token);
      
      // Set auth header for future requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      return { token, user };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to login');
    }
  }
);

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
      
      axios.defaults.headers.common['Authorization'] = `Bearer ${auth.token}`;
      const response = await axios.get<User>(`${API_BASE_URL}/auth/me`);
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
      
      axios.defaults.headers.common['Authorization'] = `Bearer ${auth.token}`;
      await axios.post(`${API_BASE_URL}/auth/change-password`, passwordData);
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
      
      axios.defaults.headers.common['Authorization'] = `Bearer ${auth.token}`;
      const response = await axios.put<User>(`${API_BASE_URL}/auth/profile`, profileData);
      
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update profile');
    }
  }
);

// Slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      delete axios.defaults.headers.common['Authorization'];
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      localStorage.setItem('user', JSON.stringify(action.payload));
    }
  },
  extraReducers: (builder) => {
    // Login
    builder.addCase(login.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(login.fulfilled, (state, action) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.token = action.payload.token;
      state.user = action.payload.user;
    });
    builder.addCase(login.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || 'Failed to login';
    });
    
    // Fetch current user
    builder.addCase(fetchCurrentUser.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchCurrentUser.fulfilled, (state, action) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.user = action.payload;
    });
    builder.addCase(fetchCurrentUser.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || 'Failed to fetch user';
      
      // If token is invalid, logout
      if (action.payload === 'Invalid or expired token') {
        state.isAuthenticated = false;
        state.token = null;
        state.user = null;
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
      }
    });
    
    // Change password - we don't modify auth state directly,
    // just track loading and error states
    builder.addCase(changePassword.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(changePassword.fulfilled, (state) => {
      state.loading = false;
    });
    builder.addCase(changePassword.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || 'Failed to change password';
    });

    // Update user profile
    builder.addCase(updateUserProfile.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateUserProfile.fulfilled, (state, action) => {
      state.loading = false;
      state.user = action.payload;
      localStorage.setItem('user', JSON.stringify(action.payload));
    });
    builder.addCase(updateUserProfile.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || 'Failed to update profile';
    });
  }
});

export const { logout, clearError, setUser } = authSlice.actions;
export default authSlice.reducer; 