import React from 'react';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListItemButton from '@mui/material/ListItemButton';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import DashboardIcon from '@mui/icons-material/Dashboard';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import TimerIcon from '@mui/icons-material/Timer';
import SettingsIcon from '@mui/icons-material/Settings';
import AssessmentIcon from '@mui/icons-material/Assessment';
import GroupIcon from '@mui/icons-material/Group';
import ReceiptIcon from '@mui/icons-material/Receipt';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import SyncStatus from '../SyncStatus';

type Action = 'create' | 'read' | 'update' | 'delete';

interface MenuItem {
  text: string;
  icon: JSX.Element;
  path: string;
  requiredPermission?: {
    resource: string;
    action: Action;
  };
}

interface MenuGroup {
  title: string;
  items: MenuItem[];
}

const menuGroups: MenuGroup[] = [
  {
    title: 'Overview',
    items: [
      { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    ],
  },
  {
    title: 'Operations',
    items: [
      { 
        text: 'Vehicles', 
        icon: <DirectionsCarIcon />, 
        path: '/vehicles',
        requiredPermission: { resource: 'vehicles', action: 'read' }
      },
      { 
        text: 'Sessions', 
        icon: <TimerIcon />, 
        path: '/sessions',
        requiredPermission: { resource: 'parking-sessions', action: 'read' }
      },
    ],
  },
  {
    title: 'Management',
    items: [
      { 
        text: 'Users', 
        icon: <GroupIcon />, 
        path: '/users',
        requiredPermission: { resource: 'users', action: 'read' }
      },
      { 
        text: 'Invoices', 
        icon: <ReceiptIcon />, 
        path: '/invoices',
        requiredPermission: { resource: 'invoices', action: 'read' }
      },
      { 
        text: 'Reports', 
        icon: <AssessmentIcon />, 
        path: '/reports',
        requiredPermission: { resource: 'reports', action: 'read' }
      },
    ],
  },
  {
    title: 'System',
    items: [
      { 
        text: 'Settings', 
        icon: <SettingsIcon />, 
        path: '/settings',
        requiredPermission: { resource: 'settings', action: 'read' }
      },
    ],
  },
];

export const MainMenu: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasPermission } = useAuth();

  const renderMenuItem = (item: MenuItem) => {
    // Skip rendering if user doesn't have required permission
    if (item.requiredPermission && !hasPermission(item.requiredPermission.resource, item.requiredPermission.action)) {
      return null;
    }

    return (
      <ListItem key={item.path} disablePadding>
        <ListItemButton
          selected={location.pathname === item.path}
          onClick={() => navigate(item.path)}
          sx={{
            borderRadius: 1,
            mx: 1,
            '&.Mui-selected': {
              backgroundColor: 'primary.main',
              color: 'primary.contrastText',
              '&:hover': {
                backgroundColor: 'primary.dark',
              },
              '& .MuiListItemIcon-root': {
                color: 'inherit',
              },
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
          <ListItemText primary={item.text} />
        </ListItemButton>
      </ListItem>
    );
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <List sx={{ flexGrow: 1 }}>
        {menuGroups.map((group, index) => {
          const visibleItems = group.items.filter(item => 
            !item.requiredPermission || hasPermission(item.requiredPermission.resource, item.requiredPermission.action)
          );

          // Don't render empty groups
          if (visibleItems.length === 0) return null;

          return (
            <React.Fragment key={group.title}>
              {index > 0 && <Divider sx={{ my: 1 }} />}
              <Typography
                variant="overline"
                sx={{
                  px: 3,
                  py: 1,
                  color: 'text.secondary',
                  fontWeight: 'bold',
                }}
              >
                {group.title}
              </Typography>
              {visibleItems.map(renderMenuItem)}
            </React.Fragment>
          );
        })}
      </List>
      <Box sx={{ p: 2 }}>
        <SyncStatus />
      </Box>
    </Box>
  );
}; 