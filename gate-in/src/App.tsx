import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import GateInDashboard from './components/Dashboard';
import AutomatedEntryGate from './components/AutomatedEntryGate';
import TicketGenerator from './components/TicketGenerator';
import Navbar from './components/Navbar';
import { CameraSettings } from './components/CameraSettings';
import { OCRTester } from './components/OCRTester';

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
              <Route path="/ticket" element={<TicketGenerator />} />
              <Route path="/camera-settings" element={<CameraSettings />} />
              <Route path="/ocr-test" element={<OCRTester />} />
            </Routes>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
};

export default App; 