import React, { useState } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Card, 
  CardContent, 
  Typography, 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import socketService from '../services/socketService';

interface VehicleExitData {
  licensePlate: string;
  duration: number;  // in minutes
  fee: number;       // in currency units
  exitTime: string;
}

const ExitGate: React.FC = () => {
  const [licensePlate, setLicensePlate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exitData, setExitData] = useState<VehicleExitData | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!licensePlate.trim()) {
      setError('Please enter a license plate number');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would call an API to get exit details
      // For demo purposes, we'll create mock data
      const mockExitData: VehicleExitData = {
        licensePlate: licensePlate.toUpperCase(),
        duration: Math.floor(Math.random() * 120) + 30, // 30-150 minutes
        fee: Math.floor(Math.random() * 200) + 50, // $50-$250
        exitTime: new Date().toISOString()
      };
      
      // Notify about vehicle exit through socket
      socketService.notifyVehicleExit({
        ticketId: `TK-${Date.now()}`, // Generate a mock ticket ID
        licensePlate: mockExitData.licensePlate,
        exitTime: mockExitData.exitTime,
        fee: mockExitData.fee
      });
      
      setExitData(mockExitData);
      setDialogOpen(true);
      
      // Reset form after processing
      setLicensePlate('');
    } catch (err) {
      setError('Failed to process exit. Please try again.');
      console.error('Exit processing error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    // Simulate gate opening
    socketService.updateGateStatus('exit-gate-1', 'open');
    
    // After 5 seconds, close the gate
    setTimeout(() => {
      socketService.updateGateStatus('exit-gate-1', 'closed');
    }, 5000);
  };

  return (
    <Card sx={{ maxWidth: 600, width: '100%' }}>
      <CardContent>
        <Typography variant="h5" component="h2" gutterBottom>
          Process Vehicle Exit
        </Typography>
        
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label="License Plate Number"
            variant="outlined"
            value={licensePlate}
            onChange={(e) => setLicensePlate(e.target.value)}
            disabled={loading}
            error={!!error}
            helperText={error}
            sx={{ mb: 2 }}
          />
          
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            disabled={loading}
            sx={{ mt: 2 }}
          >
            {loading ? 'Processing...' : 'Process Exit'}
          </Button>
        </Box>
      </CardContent>
      
      <Dialog open={dialogOpen} onClose={handleCloseDialog}>
        <DialogTitle>Exit Processed Successfully</DialogTitle>
        <DialogContent>
          {exitData && (
            <Box sx={{ my: 2 }}>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>License Plate:</strong> {exitData.licensePlate}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Duration:</strong> {exitData.duration} minutes
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Fee:</strong> ${exitData.fee.toFixed(2)}
              </Typography>
              <Typography variant="body1">
                <strong>Exit Time:</strong> {new Date(exitData.exitTime).toLocaleString()}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            Open Gate
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default ExitGate; 