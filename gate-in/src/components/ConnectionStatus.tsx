import React, { useEffect, useState } from 'react';
import { Box, Chip, Tooltip, Badge, Menu, MenuItem, ListItemText, ListItemIcon } from '@mui/material';
import WifiIcon from '@mui/icons-material/Wifi';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import CloudIcon from '@mui/icons-material/Cloud';
import RefreshIcon from '@mui/icons-material/Refresh';
import socketService from '../services/socketService';

interface ConnectionStatusProps {
  showLabel?: boolean;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ showLabel = true }) => {
  const [isConnected, setIsConnected] = useState<boolean>(socketService.isConnected());
  const [pendingEvents, setPendingEvents] = useState<number>(0);
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(
    localStorage.getItem('OFFLINE_MODE') === 'true'
  );
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  
  useEffect(() => {
    // Register connection change handler
    socketService.onConnectionChange((connected) => {
      setIsConnected(connected);
    });
    
    // Check for pending offline events
    const checkPendingEvents = () => {
      try {
        const storedEvents = JSON.parse(localStorage.getItem('offlineEvents') || '[]');
        setPendingEvents(storedEvents.length);
      } catch (error) {
        console.error('Error checking pending events:', error);
      }
    };
    
    // Check immediately and set up interval
    checkPendingEvents();
    const intervalId = setInterval(checkPendingEvents, 5000);
    
    return () => {
      // No need to unsubscribe if method doesn't return unsubscribe function
      clearInterval(intervalId);
    };
  }, []);

  // Fungsi untuk mengubah mode offline
  const toggleOfflineMode = (enabled: boolean) => {
    socketService.setOfflineMode(enabled);
    setIsOfflineMode(enabled);
    handleMenuClose();
  };

  // Handler untuk membuka menu
  const handleChipClick = (event: React.MouseEvent<HTMLDivElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };

  // Handler untuk menutup menu
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  // Coba koneksi ulang
  const handleReconnect = () => {
    socketService.reconnect();
    handleMenuClose();
  };
  
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center' }}>
      <Tooltip title={
        isOfflineMode
          ? "Mode Offline (semua data disimpan lokal)"
          : isConnected 
            ? "Server terhubung" 
            : `Server tidak terhubung${pendingEvents > 0 ? ` (${pendingEvents} event tertunda)` : ''}`
      }>
        <Badge badgeContent={pendingEvents > 0 ? pendingEvents : 0} color="error" 
          sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem' } }}
        >
          <Chip
            icon={isOfflineMode ? <CloudOffIcon /> : (isConnected ? <WifiIcon /> : <WifiOffIcon />)}
            label={showLabel ? (isOfflineMode ? "Offline Mode" : (isConnected ? "Online" : "Offline")) : ""}
            color={isOfflineMode ? "warning" : (isConnected ? "success" : "error")}
            size="small"
            variant={pendingEvents > 0 ? "outlined" : "filled"}
            sx={{
              minWidth: showLabel ? 'auto' : '32px',
              height: '24px',
              '& .MuiChip-icon': { 
                marginLeft: showLabel ? 'auto' : '0', 
                marginRight: showLabel ? 'auto' : '0' 
              },
              cursor: 'pointer'
            }}
            onClick={handleChipClick}
          />
        </Badge>
      </Tooltip>

      {/* Menu untuk opsi koneksi */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={() => toggleOfflineMode(!isOfflineMode)}>
          <ListItemIcon>
            {isOfflineMode ? <CloudIcon fontSize="small" /> : <CloudOffIcon fontSize="small" />}
          </ListItemIcon>
          <ListItemText>
            {isOfflineMode ? "Nonaktifkan Mode Offline" : "Aktifkan Mode Offline"}
          </ListItemText>
        </MenuItem>
        
        {!isOfflineMode && (
          <MenuItem onClick={handleReconnect}>
            <ListItemIcon>
              <RefreshIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Coba Sambungkan Ulang</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
};

export default ConnectionStatus; 