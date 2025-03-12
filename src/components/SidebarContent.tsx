import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  DirectionsCar as VehicleIcon,
  Receipt as ReceiptIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import PeopleIcon from '@mui/icons-material/People';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import type { ReactNode } from 'react';

interface MenuItem {
  text: string;
  icon: ReactNode;
  path: string;
}

export const SidebarContent: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);

  const menuItems: MenuItem[] = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Sessions', icon: <ReceiptIcon />, path: '/sessions' },
    { text: 'Vehicles', icon: <VehicleIcon />, path: '/vehicles' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
  ];

  // Only show Users for admin and superadmin
  if (user?.role === 'admin' || user?.role === 'superadmin') {
    menuItems.push({ text: 'User Management', icon: <PeopleIcon />, path: '/users' });
  }

  return (
    <Box>
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" noWrap component="div">
          Menu
        </Typography>
      </Box>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => navigate(item.path)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );
}; 