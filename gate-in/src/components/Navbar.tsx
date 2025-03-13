import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
  ListItemText,
  Box,
  Badge,
  Avatar
} from '@mui/material';
import {
  Menu as MenuIcon,
  DirectionsCar,
  PhotoCamera,
  Settings,
  ExitToApp,
  Person,
  Help,
  Receipt,
  DeveloperBoard
} from '@mui/icons-material';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [userAnchorEl, setUserAnchorEl] = useState<null | HTMLElement>(null);
  
  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleUserMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setUserAnchorEl(event.currentTarget);
  };
  
  const handleClose = () => {
    setAnchorEl(null);
  };
  
  const handleUserMenuClose = () => {
    setUserAnchorEl(null);
  };
  
  const handleNavigate = (route: string) => {
    navigate(route);
    handleClose();
  };
  
  const handleLogout = () => {
    // Implement logout logic here
    console.log('Logging out');
    handleUserMenuClose();
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <IconButton
          edge="start"
          color="inherit"
          aria-label="menu"
          onClick={handleMenuClick}
        >
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Gate-In System
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="body2" sx={{ mr: 2 }}>
            Gate: Main Entrance
          </Typography>
          <IconButton color="inherit" onClick={handleUserMenuClick}>
            <Badge color="secondary" variant="dot">
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                <Person />
              </Avatar>
            </Badge>
          </IconButton>
        </Box>
        
        {/* Main Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
        >
          <MenuItem onClick={() => handleNavigate('/')}>
            <ListItemIcon>
              <DirectionsCar fontSize="small" />
            </ListItemIcon>
            <ListItemText>Dashboard</ListItemText>
          </MenuItem>
          
          <MenuItem onClick={() => handleNavigate('/automated')}>
            <ListItemIcon>
              <DirectionsCar fontSize="small" />
            </ListItemIcon>
            <ListItemText>Process Vehicle Entry</ListItemText>
          </MenuItem>
          
          <Divider />
          
          <MenuItem onClick={() => handleNavigate('/camera-settings')}>
            <ListItemIcon>
              <PhotoCamera fontSize="small" />
            </ListItemIcon>
            <ListItemText>Camera Settings</ListItemText>
          </MenuItem>
          
          <MenuItem onClick={() => handleNavigate('/ocr-test')}>
            <ListItemIcon>
              <DeveloperBoard fontSize="small" />
            </ListItemIcon>
            <ListItemText>OCR Testing</ListItemText>
          </MenuItem>
          
          <Divider />
          
          <MenuItem onClick={() => handleNavigate('/recent-entries')}>
            <ListItemIcon>
              <Receipt fontSize="small" />
            </ListItemIcon>
            <ListItemText>Recent Entries</ListItemText>
          </MenuItem>
          
          <MenuItem onClick={() => handleNavigate('/help')}>
            <ListItemIcon>
              <Help fontSize="small" />
            </ListItemIcon>
            <ListItemText>Help</ListItemText>
          </MenuItem>
        </Menu>
        
        {/* User Menu */}
        <Menu
          anchorEl={userAnchorEl}
          open={Boolean(userAnchorEl)}
          onClose={handleUserMenuClose}
        >
          <MenuItem onClick={() => handleNavigate('/profile')}>
            <ListItemIcon>
              <Person fontSize="small" />
            </ListItemIcon>
            <ListItemText>Profile</ListItemText>
          </MenuItem>
          
          <MenuItem onClick={() => handleNavigate('/settings')}>
            <ListItemIcon>
              <Settings fontSize="small" />
            </ListItemIcon>
            <ListItemText>Settings</ListItemText>
          </MenuItem>
          
          <Divider />
          
          <MenuItem onClick={handleLogout}>
            <ListItemIcon>
              <ExitToApp fontSize="small" />
            </ListItemIcon>
            <ListItemText>Logout</ListItemText>
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar; 