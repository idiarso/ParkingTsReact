import React from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box,
  Switch,
  FormControlLabel,
  Tabs,
  Tab
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  DirectionsCar, 
  AutoFixHigh, 
  ConfirmationNumber, 
  Dashboard 
} from '@mui/icons-material';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    navigate(newValue);
  };

  return (
    <AppBar position="static" color="primary">
      <Toolbar>
        <DirectionsCar sx={{ mr: 1 }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1, display: { xs: 'none', sm: 'block' } }}>
          Gate-In System
        </Typography>
        
        <Box sx={{ width: '100%', maxWidth: 500, mx: 'auto' }}>
          <Tabs 
            value={path} 
            onChange={handleChange} 
            indicatorColor="secondary"
            textColor="inherit"
            variant="fullWidth"
            aria-label="gate-in navigation tabs"
          >
            <Tab 
              icon={<Dashboard />} 
              label="Dashboard" 
              value="/" 
            />
            <Tab 
              icon={<AutoFixHigh />} 
              label="Automated" 
              value="/automated" 
            />
            <Tab 
              icon={<ConfirmationNumber />} 
              label="Ticket" 
              value="/ticket" 
            />
          </Tabs>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar; 