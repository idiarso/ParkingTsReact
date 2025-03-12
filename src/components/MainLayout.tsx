import React, { useState, MouseEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip,
} from '@mui/material';
import type { DrawerProps, MenuProps, MenuItemProps, IconButtonProps } from '@mui/material';
import { Theme, useTheme, styled } from '@mui/material/styles';
import { SxProps } from '@mui/system';
import useMediaQuery from '@mui/material/useMediaQuery';
import Avatar from '@mui/material/Avatar';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  DirectionsCar as VehicleIcon,
  Receipt as ReceiptIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import PeopleIcon from '@mui/icons-material/People';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import { logout } from '../store/slices/authSlice';
import { RootState } from '../store';
import { ChangePasswordDialog } from './ChangePasswordDialog';
import { SidebarContent } from './SidebarContent';
import { useAppDispatch } from '../store';

const drawerWidth = 240;

interface MainLayoutProps {
  children: React.ReactNode;
}

interface StyledMenuProps extends MenuProps {
  anchorOrigin?: {
    vertical: 'top' | 'bottom';
    horizontal: 'left' | 'right';
  };
  transformOrigin?: {
    vertical: 'top' | 'bottom';
    horizontal: 'left' | 'right';
  };
}

const StyledMenu = styled((props: StyledMenuProps) => (
  <Menu {...props} />
))(({ theme }) => ({
  '& .MuiPaper-root': {
    overflow: 'visible',
    filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
    marginTop: theme.spacing(1.5),
    '& .MuiAvatar-root': {
      width: 32,
      height: 32,
      marginLeft: -0.5,
      marginRight: 1,
    },
  },
}));

interface StyledMenuItemProps extends MenuItemProps {
  onClick?: () => void;
}

const StyledMenuItem = styled((props: StyledMenuItemProps) => (
  <MenuItem {...props} />
))(({ theme }) => ({
  '&:hover': {
    backgroundColor: '#f5f5f5',
  },
  '& .MuiListItemIcon-root': {
    minWidth: 36,
  },
}));

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const user = useSelector((state: RootState) => state.auth.user);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountMenuAnchor, setAccountMenuAnchor] = useState<null | HTMLElement>(null);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleAccountMenuOpen = (event: MouseEvent<HTMLElement>) => {
    setAccountMenuAnchor(event.currentTarget);
  };

  const handleAccountMenuClose = () => {
    setAccountMenuAnchor(null);
  };

  const handleChangePassword = () => {
    handleAccountMenuClose();
    setChangePasswordOpen(true);
  };

  const handleLogout = () => {
    handleAccountMenuClose();
    void dispatch(logout());
    navigate('/login');
  };

  const drawerSx: SxProps<Theme> = {
    width: { sm: drawerWidth },
    flexShrink: { sm: 0 },
    '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
  };

  const menuItems = [
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
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Parking Management System
          </Typography>
          
          {user && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Tooltip title="Account settings">
                <span>
                  <IconButton
                    onClick={handleAccountMenuOpen as unknown as () => void}
                    color="inherit"
                    size="large"
                    edge="end"
                  >
                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                      {user.name.charAt(0)}
                    </Avatar>
                  </IconButton>
                </span>
              </Tooltip>
              <Typography variant="body2" sx={{ ml: 1, display: { xs: 'none', md: 'block' } }}>
                {user.name}
              </Typography>
            </Box>
          )}
          
          <StyledMenu
            anchorEl={accountMenuAnchor}
            open={Boolean(accountMenuAnchor)}
            onClose={handleAccountMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <StyledMenuItem onClick={() => {
              handleAccountMenuClose();
              navigate('/profile');
            }}>
              <ListItemIcon>
                <AccountCircleIcon fontSize="small" />
              </ListItemIcon>
              <Typography variant="body1">My Profile</Typography>
            </StyledMenuItem>
            <StyledMenuItem onClick={handleChangePassword}>
              <ListItemIcon>
                <AccountCircleIcon fontSize="small" />
              </ListItemIcon>
              <Typography variant="body1">Change Password</Typography>
            </StyledMenuItem>
            <Divider />
            <StyledMenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              <Typography variant="body1">Logout</Typography>
            </StyledMenuItem>
          </StyledMenu>
        </Toolbar>
      </AppBar>
      
      <Box
        sx={drawerSx}
        aria-label="navigation drawer"
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          <SidebarContent />
        </Drawer>
        
        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          <SidebarContent />
        </Drawer>
      </Box>
      
      <Box
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: '64px',
        }}
      >
        <Toolbar /> {/* Spacer to push content below app bar */}
        {children}
      </Box>
      
      <ChangePasswordDialog 
        open={changePasswordOpen} 
        onClose={() => setChangePasswordOpen(false)} 
      />
    </Box>
  );
}; 