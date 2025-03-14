import React, { useEffect, useState } from 'react';
import { Alert, Collapse, Box, Button, Typography } from '@mui/material';
import SyncIcon from '@mui/icons-material/Sync';
import socketService from '../services/socketService';

interface OfflineStatusBannerProps {
  onRetry?: () => void;
}

const OfflineStatusBanner: React.FC<OfflineStatusBannerProps> = ({ onRetry }) => {
  const [isConnected, setIsConnected] = useState<boolean>(socketService.isConnected());
  const [pendingEvents, setPendingEvents] = useState<number>(0);
  const [offlineDuration, setOfflineDuration] = useState<number>(0);
  const [offlineSince, setOfflineSince] = useState<Date | null>(null);
  const [showBanner, setShowBanner] = useState<boolean>(false);
  
  useEffect(() => {
    // Register connection change handler
    socketService.onConnectionChange((connected) => {
      setIsConnected(connected);
      
      if (!connected && !offlineSince) {
        // Just went offline
        setOfflineSince(new Date());
        setShowBanner(true);
      } else if (connected) {
        // Just came back online
        setOfflineSince(null);
        
        // Keep banner visible for a short time to show "reconnected" message
        setTimeout(() => {
          setShowBanner(false);
        }, 5000);
      }
    });
    
    // Check for pending offline events
    const checkPendingEvents = () => {
      try {
        const storedEvents = JSON.parse(localStorage.getItem('offlineEvents') || '[]');
        setPendingEvents(storedEvents.length);
        
        // Update duration if offline
        if (offlineSince) {
          const durationMs = new Date().getTime() - offlineSince.getTime();
          setOfflineDuration(Math.floor(durationMs / 1000));
        }
      } catch (error) {
        console.error('Error checking pending events:', error);
      }
    };
    
    // Check immediately and set up interval
    checkPendingEvents();
    const intervalId = setInterval(checkPendingEvents, 1000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [offlineSince]);
  
  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds} detik`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} menit ${seconds % 60} detik`;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours} jam ${minutes} menit`;
  };
  
  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      // Default retry behavior: reconnect socket
      socketService.reconnect();
    }
  };
  
  // Don't show banner if offline less than 5 seconds to avoid flickering
  const shouldShow = showBanner && (!isConnected || (isConnected && offlineDuration > 5) || pendingEvents > 0);
  
  return (
    <Collapse in={shouldShow}>
      <Alert 
        severity={isConnected ? "success" : "warning"}
        sx={{ 
          mb: 2,
          '& .MuiAlert-message': { 
            width: '100%',
          }
        }}
        action={
          !isConnected ? (
            <Button 
              color="inherit" 
              size="small" 
              onClick={handleRetry}
              startIcon={<SyncIcon />}
            >
              Coba Hubungkan
            </Button>
          ) : null
        }
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <Typography variant="body2">
            {!isConnected ? (
              <>
                <strong>Sistem Offline</strong> - {offlineDuration > 0 ? `Terputus selama ${formatDuration(offlineDuration)}` : 'Mencoba menghubungkan...'}
                {pendingEvents > 0 ? ` | ${pendingEvents} transaksi tertunda` : ''}
              </>
            ) : (
              <>
                <strong>Terhubung Kembali</strong> - Sistem online setelah {formatDuration(offlineDuration)}
                {pendingEvents > 0 ? ` | Menyinkronkan ${pendingEvents} transaksi tertunda` : ''}
              </>
            )}
          </Typography>
        </Box>
      </Alert>
    </Collapse>
  );
};

export default OfflineStatusBanner; 