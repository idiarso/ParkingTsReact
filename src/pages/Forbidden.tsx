import React from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Box, Typography, Button, Paper } from '@mui/material';
import { logout } from '../store/slices/authSlice';
import { AppDispatch } from '../store';

const Forbidden: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  
  const handleLogout = () => {
    dispatch(logout());
  };
  
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: 3,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          padding: 4,
          maxWidth: 500,
          width: '100%',
          textAlign: 'center',
          borderRadius: 2,
        }}
      >
        <Typography variant="h1" color="error" sx={{ fontSize: 80, fontWeight: 'bold' }}>
          403
        </Typography>
        
        <Typography variant="h5" color="text.primary" gutterBottom>
          Access Forbidden
        </Typography>
        
        <Typography variant="body1" color="text.secondary" paragraph>
          You don't have permission to access this page. Please contact your administrator if you believe this is an error.
        </Typography>
        
        <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Button
            component={Link}
            to="/"
            variant="contained"
            color="primary"
            fullWidth
          >
            Go to Dashboard
          </Button>
          
          <Button
            variant="outlined"
            color="error"
            onClick={handleLogout}
            fullWidth
          >
            Logout
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default Forbidden; 