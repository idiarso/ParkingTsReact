import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from './store';
import { initSocket } from './services/socketService';
import { setUser } from './store/slices/authSlice';

// Components
import { MainLayout } from './components/MainLayout';
import { ProtectedRoute } from './components/ProtectedRoute';

// Pages
import Dashboard from './pages/Dashboard';
import Sessions from './pages/Sessions';
import Vehicles from './pages/Vehicles';
import Settings from './pages/Settings';
import UserManagement from './pages/UserManagement';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Forbidden from './pages/Forbidden';

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  // Initialize socket connection
  useEffect(() => {
    const socket = initSocket();
    return () => {
      socket.disconnect();
    };
  }, []);

  // Check for existing user session
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        dispatch(setUser(userData));
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('user');
      }
    }
  }, [dispatch]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} />
          <Route path="/forbidden" element={<Forbidden />} />
          
          {/* Redirect root to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" />} />
          
          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Dashboard />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/sessions"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Sessions />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/vehicles"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Vehicles />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Settings />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/users"
            element={
              <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
                <MainLayout>
                  <UserManagement />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Profile />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          
          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
