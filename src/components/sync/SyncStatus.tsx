import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Badge from '@mui/material/Badge';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import SyncIcon from '@mui/icons-material/Sync';
import ErrorIcon from '@mui/icons-material/Error';
import RefreshIcon from '@mui/icons-material/Refresh';
import syncService from '../../services/syncService';

export interface SyncQueue {
  id: string;
  type: string;
  timestamp: number;
}

interface SyncStatusProps {
  isOnline: boolean;
  failedSyncs: SyncQueue[];
}

const SyncStatus: React.FC<SyncStatusProps> = ({ isOnline, failedSyncs }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [syncInProgress, setSyncInProgress] = useState(false);

  const handleForceSyncAll = async () => {
    if (!isOnline) return;
    setSyncInProgress(true);
    try {
      await Promise.all(failedSyncs.map((sync) => syncService.retrySync(sync.id)));
    } finally {
      setSyncInProgress(false);
    }
  };

  const handleRetrySync = async (syncId: string) => {
    if (!isOnline) return;
    setSyncInProgress(true);
    try {
      await syncService.retrySync(syncId);
    } finally {
      setSyncInProgress(false);
    }
  };

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <IconButton
          onClick={() => setDialogOpen(true)}
          color={failedSyncs.length > 0 ? 'error' : 'default'}
        >
          <Badge badgeContent={failedSyncs.length} color="error">
            {isOnline ? <SyncIcon /> : <ErrorIcon />}
          </Badge>
        </IconButton>
        <Typography variant="body2" sx={{ color: isOnline ? 'text.secondary' : 'error.main' }}>
          {isOnline ? 'Online' : 'Offline'}
        </Typography>
      </Box>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Failed Syncs</DialogTitle>
        <DialogContent>
          {!isOnline && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              You are currently offline. Please check your internet connection.
            </Alert>
          )}

          {failedSyncs.length > 0 && (
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={handleForceSyncAll}
              disabled={syncInProgress || !isOnline}
              fullWidth
              sx={{ mb: 2 }}
            >
              Force Sync All
            </Button>
          )}

          {failedSyncs.length > 0 ? (
            <List>
              {failedSyncs.map((sync) => (
                <ListItem key={sync.id}>
                  <ListItemText
                    primary={sync.type}
                    secondary={`Failed at: ${new Date(sync.timestamp).toLocaleString()}`}
                  />
                  <ListItemSecondaryAction>
                    <Button
                      size="small"
                      onClick={() => handleRetrySync(sync.id)}
                      disabled={!isOnline}
                    >
                      Retry
                    </Button>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center' }}>
              No failed syncs
            </Typography>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SyncStatus; 