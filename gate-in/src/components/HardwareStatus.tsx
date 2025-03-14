import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  CircularProgress
} from '@mui/material';
import {
  Print,
  CameraAlt,
  DirectionsWalk,
  SettingsInputComponent,
  CheckCircle,
  Error as ErrorIcon
} from '@mui/icons-material';
import { hardwareService, type HardwareStatus } from '../services/hardwareService';

interface StatusIndicatorProps {
  label: string;
  status: boolean;
  icon: React.ReactNode;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ label, status, icon }) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 1,
      p: 1,
      borderRadius: 1,
      bgcolor: status ? 'success.light' : 'error.light',
      color: status ? 'success.dark' : 'error.dark',
    }}
  >
    {icon}
    <Typography variant="body2">{label}</Typography>
    {status ? (
      <CheckCircle fontSize="small" color="success" />
    ) : (
      <ErrorIcon fontSize="small" color="error" />
    )}
  </Box>
);

const HardwareStatus: React.FC = () => {
  const [status, setStatus] = useState<HardwareStatus>(hardwareService.getStatus());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Subscribe to hardware status changes
    const unsubscribe = hardwareService.onStatusChange(setStatus);
    setIsLoading(false);

    return () => {
      unsubscribe();
    };
  }, []);

  const handlePushButtonClick = () => {
    hardwareService.simulatePushButton();
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Hardware Status
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <StatusIndicator
            label="Printer"
            status={status.printer}
            icon={<Print />}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatusIndicator
            label="Camera"
            status={status.camera}
            icon={<CameraAlt />}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatusIndicator
            label="Loop Detector"
            status={status.loopDetector}
            icon={<DirectionsWalk />}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatusIndicator
            label="Push Button"
            status={status.pushButton}
            icon={<SettingsInputComponent />}
          />
        </Grid>
      </Grid>

      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
        <Button
          variant="contained"
          onClick={handlePushButtonClick}
          disabled={status.pushButton}
        >
          Simulate Push Button
        </Button>
      </Box>
    </Paper>
  );
};

export default HardwareStatus; 