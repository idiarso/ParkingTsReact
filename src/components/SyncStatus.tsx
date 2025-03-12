import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Badge, Box, Typography } from '@mui/material';
import CloudSyncIcon from '@mui/icons-material/CloudSync';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import { format } from 'date-fns';
import { RootState } from '../store/reducers';
import { setOnlineStatus } from '../store/slices/parkingSessionsSlice';

// Define only the shape of the state we need without importing conflicting interfaces
interface SessionStateProps {
  isOnline: boolean;
  lastSync?: string;
  syncQueue: any[];
}

const SyncStatus: React.FC = () => {
  const dispatch = useDispatch();
  
  // Cast to any first to bypass TypeScript's strictness about property access
  const state = useSelector((state: RootState) => state.parkingSessions) as any;
  
  // Extract only the properties we need
  const isOnline = state.isOnline ?? false;
  const lastSync = state.lastSync ?? null;
  const syncQueue = state.syncQueue ?? [];

  useEffect(() => {
    const handleOnline = () => dispatch(setOnlineStatus(true));
    const handleOffline = () => dispatch(setOnlineStatus(false));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [dispatch]);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <Badge badgeContent={syncQueue.length} color="warning">
        {isOnline ? (
          <CloudSyncIcon color="primary" />
        ) : (
          <CloudOffIcon color="error" />
        )}
      </Badge>
      <Typography variant="body2" color="text.secondary">
        {isOnline ? 'Online' : 'Offline'}
        {lastSync && ` • Last synced ${format(new Date(lastSync), 'HH:mm:ss')}`}
        {syncQueue.length > 0 && ` • ${syncQueue.length} items pending sync`}
      </Typography>
    </Box>
  );
};

export default SyncStatus; 