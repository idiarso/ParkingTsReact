import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import GateInDashboard from './components/Dashboard';
import AutomatedEntryGate from './components/AutomatedEntryGate';
import { CameraSettings } from './components/CameraSettings';
import { OCRTester } from './components/OCRTester';
import { RecentEntries } from './components/RecentEntries';
import Help from './components/Help/index';
import Profile from './components/Profile/index';
import Settings from './components/Settings/index';
import Navbar from './components/Navbar';

// Create theme instance
const theme = createTheme({
  palette: {
    primary: {
      main: '#2e7d32', // Green color for entry gate
    },
    secondary: {
      main: '#dc004e',
    },
    success: {
      main: '#4caf50',
      light: '#e8f5e9',
    },
    warning: {
      main: '#ff9800',
    },
  },
});

const App: React.FC = () => {
  // Add state for recent entries
  const [recentEntries] = useState<any[]>([]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Navbar />
          <Box component="main" sx={{ flexGrow: 1 }}>
            <Routes>
              <Route path="/" element={<GateInDashboard />} />
              <Route path="/automated" element={<AutomatedEntryGate />} />
              <Route path="/camera-settings" element={<CameraSettings />} />
              <Route path="/ocr-test" element={<OCRTester />} />
              <Route path="/recent-entries" element={<RecentEntries entries={recentEntries} />} />
              <Route path="/help" element={<Help />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
};

export default App; 