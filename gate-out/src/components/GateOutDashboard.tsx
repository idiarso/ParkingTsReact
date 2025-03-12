import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Paper, Alert, Grid } from '@mui/material';
import { DirectionsCarFilledOutlined } from '@mui/icons-material';
import BarcodeScanner from './BarcodeScanner';
import PaymentProcessor from './PaymentProcessor';
import dbService from '../services/dbService';
import socketService from '../services/socketService';
import { VehicleEntry } from '../services/paymentService';

const GateOutDashboard: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [vehicleEntry, setVehicleEntry] = useState<VehicleEntry | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize services
  useEffect(() => {
    // Initialize database
    dbService.init();
    
    // Connect to socket server
    socketService.connect();
    
    // Set up socket connection listener
    socketService.onConnectionChange(setIsConnected);
    
    // Cleanup on component unmount
    return () => {
      socketService.disconnect();
    };
  }, []);

  // Handler for ticket scanning
  const handleTicketScan = async (ticketId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Find the vehicle entry by ticket ID
      const entry = await dbService.findByTicketId(ticketId);
      
      if (!entry) {
        setError(`Ticket ID ${ticketId} not found. Please try again.`);
        setVehicleEntry(null);
        return;
      }
      
      // Check if the vehicle has already exited
      if (entry.exitTime) {
        setError(`This ticket (${ticketId}) has already been processed. Vehicle exited at ${new Date(entry.exitTime).toLocaleString()}`);
        setVehicleEntry(null);
        return;
      }
      
      setVehicleEntry(entry);
    } catch (err) {
      console.error('Error processing ticket:', err);
      setError('Failed to process ticket. Please try again.');
      setVehicleEntry(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Handler to reset the state for a new ticket
  const handleReset = () => {
    setVehicleEntry(null);
    setError(null);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <DirectionsCarFilledOutlined color="primary" sx={{ fontSize: 48, mb: 1 }} />
        <Typography variant="h4" gutterBottom>
          Gate-Out Payment Station
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Scan parking ticket to process vehicle exit and payment
        </Typography>
        
        {!isConnected && (
          <Alert severity="warning" sx={{ mt: 2, mx: 'auto', maxWidth: 600 }}>
            Not connected to server. Some features may be limited.
          </Alert>
        )}
      </Box>
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <BarcodeScanner 
            onScan={handleTicketScan} 
            isProcessing={isLoading} 
          />
        </Grid>
        
        <Grid item xs={12}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          <PaymentProcessor 
            vehicleEntry={vehicleEntry}
            onReset={handleReset}
            isLoading={isLoading}
          />
        </Grid>
      </Grid>
    </Container>
  );
};

export default GateOutDashboard; 