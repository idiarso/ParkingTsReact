import React, { useState, useRef } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Alert,
  IconButton
} from '@mui/material';
import { QrCode, CameraAlt, SettingsBackupRestore } from '@mui/icons-material';

interface BarcodeScannerProps {
  onScan: (ticketId: string) => Promise<void>;
  isProcessing: boolean;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan, isProcessing }) => {
  const [ticketId, setTicketId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [scanMode, setScanMode] = useState<'manual' | 'camera'>('manual');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus on the input field when manual entry mode is selected
  React.useEffect(() => {
    if (scanMode === 'manual' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [scanMode]);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketId.trim()) {
      setError('Please enter a ticket ID');
      return;
    }

    setError(null);
    try {
      await onScan(ticketId);
      // Clear the input field after successful scan
      setTicketId('');
    } catch (err) {
      setError('Failed to process ticket. Please try again.');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTicketId(e.target.value);
    setError(null);
  };

  // Handle barcode scanner input (many barcode scanners automatically add Enter key)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && ticketId.trim()) {
      handleManualSubmit(e as unknown as React.FormEvent);
    }
  };

  const toggleScanMode = () => {
    setScanMode(prev => prev === 'manual' ? 'camera' : 'manual');
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
        <QrCode color="primary" sx={{ mr: 1 }} />
        <Typography variant="h6">Ticket Scanner</Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {scanMode === 'manual' ? (
        <Box component="form" onSubmit={handleManualSubmit}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs>
              <TextField
                ref={inputRef}
                fullWidth
                label="Scan or Enter Ticket ID"
                variant="outlined"
                value={ticketId}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                disabled={isProcessing}
                autoFocus
                placeholder="YYYYMMDD-HHMMSS-XXXX"
                helperText="Use a barcode scanner or manually enter the ticket ID"
              />
            </Grid>
            <Grid item>
              <Button
                variant="contained"
                color="primary"
                type="submit"
                disabled={isProcessing || !ticketId.trim()}
                startIcon={isProcessing ? <CircularProgress size={20} color="inherit" /> : undefined}
              >
                {isProcessing ? 'Processing...' : 'Submit'}
              </Button>
            </Grid>
            <Grid item>
              <IconButton
                color="secondary"
                onClick={toggleScanMode}
                disabled={isProcessing}
                title="Switch to camera scanner"
              >
                <CameraAlt />
              </IconButton>
            </Grid>
          </Grid>
        </Box>
      ) : (
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Position the QR code in front of the camera
          </Typography>
          
          {/* Here you would implement a camera-based QR code scanner */}
          {/* For now, we'll just show a placeholder */}
          <Box 
            sx={{ 
              width: '100%', 
              height: 240, 
              bgcolor: '#f5f5f5', 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              border: '1px dashed #ccc',
              borderRadius: 1,
              mb: 2
            }}
          >
            <Typography color="textSecondary">
              Camera scanner would go here
              <br />
              (Not implemented in this demo)
            </Typography>
          </Box>
          
          <Button
            variant="outlined"
            startIcon={<SettingsBackupRestore />}
            onClick={toggleScanMode}
            sx={{ mt: 1 }}
          >
            Switch to Manual Entry
          </Button>
        </Box>
      )}
      
      <Typography variant="body2" color="textSecondary" sx={{ mt: 2, fontSize: '0.75rem' }}>
        Note: Most barcode scanners work like keyboards and will automatically submit after scanning
      </Typography>
    </Paper>
  );
};

export default BarcodeScanner; 