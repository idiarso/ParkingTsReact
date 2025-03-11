import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Container } from '@mui/material';
import TestPage from './pages/TestPage';
import socketService from './services/socketService';
import { GateInScreen } from './components/GateInScreen';

const App: React.FC = () => {
  // Initialize socket connection when the app loads
  useEffect(() => {
    // Connect to the socket server
    socketService.connect();

    // Cleanup on component unmount
    return () => {
      socketService.disconnect();
    };
  }, []);

  return (
    <Router>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Gate Entry System
          </Typography>
          <Button 
            color="inherit" 
            component={Link as any} 
            to="/"
          >
            Home
          </Button>
          <Button 
            color="inherit" 
            component={Link as any} 
            to="/test"
          >
            Test OCR
          </Button>
        </Toolbar>
      </AppBar>

      <Container>
        <Routes>
          <Route path="/" element={<GateInScreen />} />
          <Route path="/test" element={<TestPage />} />
        </Routes>
      </Container>
    </Router>
  );
};

export default App; 