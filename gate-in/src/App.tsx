import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import GateInDashboard from './components/Dashboard';

// Create theme instance
const theme = createTheme({
  palette: {
    primary: {
      main: '#2e7d32', // Green color for entry gate
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/" element={<GateInDashboard />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
};

export default App; 