import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import GateOutDashboard from './components/Dashboard';

// Create theme instance
const theme = createTheme({
  palette: {
    primary: {
      main: '#d32f2f', // Red color for exit gate
    },
    secondary: {
      main: '#dc004e',
    },
    success: {
      main: '#2e7d32',
    },
  },
});

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/" element={<GateOutDashboard />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
};

export default App; 