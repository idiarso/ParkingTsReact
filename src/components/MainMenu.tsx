import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import Menu from '@mui/material/Menu';
import { styled, alpha } from '@mui/material/styles';
import type { PopoverProps } from '@mui/material/Popover';
import type { Theme } from '@mui/material/styles';
import AccountCircle from '@mui/icons-material/AccountCircle';
import Settings from '@mui/icons-material/Settings';
import Logout from '@mui/icons-material/Logout';
import { logout } from '../store/slices/authSlice';
import type { ReactNode } from 'react';

const StyledMenuItem = styled(MenuItem)(({ theme }: { theme: Theme }) => ({
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.04),
  },
}));

interface MainMenuProps {
  anchorEl: HTMLElement | null;
  onClose: () => void;
}

interface MenuOption {
  text: string;
  icon: ReactNode;
  onClick: () => void;
  divider?: boolean;
}

export const MainMenu: React.FC<MainMenuProps> = ({ anchorEl, onClose }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const open = Boolean(anchorEl);

  const handleLogout = () => {
    dispatch(logout());
    onClose();
  };

  const menuOptions: MenuOption[] = [
    {
      text: 'Profile',
      icon: <AccountCircle />,
      onClick: () => {
        navigate('/profile');
        onClose();
      },
    },
    {
      text: 'Settings',
      icon: <Settings />,
      onClick: () => {
        navigate('/settings');
        onClose();
      },
      divider: true,
    },
    {
      text: 'Logout',
      icon: <Logout />,
      onClick: handleLogout,
    },
  ];

  const anchorOrigin: PopoverProps['anchorOrigin'] = {
    vertical: 'bottom',
    horizontal: 'right',
  };

  const transformOrigin: PopoverProps['transformOrigin'] = {
    vertical: 'top',
    horizontal: 'right',
  };

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      anchorOrigin={anchorOrigin}
      transformOrigin={transformOrigin}
      sx={{
        '& .MuiPaper-root': {
          overflow: 'visible',
          filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
          mt: 1.5,
          '& .MuiAvatar-root': {
            width: 32,
            height: 32,
            ml: -0.5,
            mr: 1,
          },
        },
      }}
    >
      {menuOptions.map((option) => (
        <React.Fragment key={option.text}>
          <StyledMenuItem onClick={option.onClick}>
            <ListItemIcon>{option.icon}</ListItemIcon>
            <ListItemText primary={option.text} />
          </StyledMenuItem>
          {option.divider && <Divider />}
        </React.Fragment>
      ))}
    </Menu>
  );
}; 