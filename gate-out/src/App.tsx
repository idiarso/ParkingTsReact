import React from 'react';
import { ThemeProvider, CssBaseline, Box } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import GateOutDashboard from './components/GateOutDashboard';

// Create theme instance
const theme = createTheme({
  palette: {
    primary: {
      main: '#d32f2f', // Red color for exit gate
    },
    secondary: {
      main: '#1976d2',
    },
    success: {
      main: '#4caf50',
      light: '#e8f5e9',
    },
    error: {
      main: '#f44336',
    },
    warning: {
      main: '#ff9800',
    },
    info: {
      main: '#2196f3',
    },
  },
});

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Box component="main" sx={{ flexGrow: 1 }}>
          <GateOutDashboard />
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default App; 