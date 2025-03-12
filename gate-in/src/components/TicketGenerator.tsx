import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Paper,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogActions,
  Grid
} from '@mui/material';
import { 
  ConfirmationNumber, 
  Print, 
  CheckCircle, 
  DirectionsCar 
} from '@mui/icons-material';
import { v4 as uuidv4 } from 'uuid';
import socketService from '../services/socketService';
import dbService, { VehicleEntry } from '../services/dbService';

// Helper function to replace date-fns
const formatDate = (date: Date, formatString: string): string => {
  // Simple implementation to replace date-fns format function
  const pad = (num: number) => num.toString().padStart(2, '0');
  
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  
  // Basic format replacements
  return formatString
    .replace('yyyy', year.toString())
    .replace('MM', month)
    .replace('dd', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
};

// QR code component (mock)
const QRCode = ({ data }: { data: string }) => (
  <Box 
    sx={{ 
      width: 150, 
      height: 150, 
      bgcolor: '#f5f5f5', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      border: '1px solid #ddd',
      mx: 'auto',
      mb: 2
    }}
  >
    <Typography variant="caption" align="center">
      QR Code for:<br />{data}
    </Typography>
  </Box>
);

const TicketGenerator: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [ticket, setTicket] = useState<VehicleEntry | null>(null);
  const [showTicket, setShowTicket] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateTicket = async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      // Generate ticket ID (format: YYYYMMDD-HHMMSS-XXXX)
      const now = new Date();
      const datePart = formatDate(now, 'yyyyMMdd');
      const timePart = formatDate(now, 'HHmmss');
      const randomPart = Math.floor(1000 + Math.random() * 9000);
      const ticketId = `${datePart}-${timePart}-${randomPart}`;
      
      // Create a new entry with a temporary license plate
      // In a real system, this would be blank until the camera captures the plate
      const tempPlate = `TEMP-${randomPart}`;
      
      const newEntry: Omit<VehicleEntry, 'id'> = {
        ticketId,
        licensePlate: tempPlate,
        vehicleType: 'UNKNOWN', // Will be updated when plate is detected
        entryTime: now.getTime(),
        processed: false
      };
      
      // Save to database
      const savedEntry = await dbService.addVehicleEntry(newEntry);
      
      // Notify socket server about new ticket
      socketService.notifyVehicleEntry({
        ticketId,
        licensePlate: tempPlate,
        vehicleType: 'UNKNOWN',
        entryTime: now.toISOString()
      });
      
      // Update gate status (simulate gate opening)
      socketService.updateGateStatus('gate-in', 'open');
      
      // After a delay, close the gate
      setTimeout(() => {
        socketService.updateGateStatus('gate-in', 'closed');
      }, 5000);
      
      // Set ticket for display
      setTicket(savedEntry);
      setShowTicket(true);
      
    } catch (err) {
      console.error('Error generating ticket:', err);
      setError('Failed to generate ticket. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handlePrintTicket = () => {
    // In a real system, this would send the ticket to a printer
    console.log('Printing ticket:', ticket);
    
    // Simulate printing delay
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setShowTicket(false);
    }, 2000);
  };
  
  const handleCloseTicket = () => {
    setShowTicket(false);
  };

  return (
    <Paper elevation={3} sx={{ p: 3, maxWidth: 600, mx: 'auto', mt: 4 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <DirectionsCar sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
        <Typography variant="h4" gutterBottom>
          Welcome to Parking System
        </Typography>
        <Typography variant="body1" color="textSecondary" paragraph>
          Press the button below to get your parking ticket
        </Typography>
        
        <Button
          variant="contained"
          color="primary"
          size="large"
          startIcon={<ConfirmationNumber />}
          onClick={handleGenerateTicket}
          disabled={isGenerating}
          sx={{ 
            py: 2, 
            px: 4, 
            fontSize: '1.2rem',
            borderRadius: '50px',
            boxShadow: 3
          }}
        >
          {isGenerating ? (
            <>
              <CircularProgress size={24} color="inherit" sx={{ mr: 1 }} />
              Processing...
            </>
          ) : (
            'Get Ticket'
          )}
        </Button>
        
        {error && (
          <Typography color="error" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}
      </Box>
      
      {/* Ticket Dialog */}
      <Dialog 
        open={showTicket} 
        onClose={handleCloseTicket}
        maxWidth="sm"
        fullWidth
      >
        <DialogContent>
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <CheckCircle color="success" sx={{ fontSize: 48, mb: 1 }} />
            <Typography variant="h5" gutterBottom>
              Your Ticket is Ready
            </Typography>
          </Box>
          
          <Card variant="outlined" sx={{ mb: 3, p: 2, bgcolor: '#f9f9f9' }}>
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sx={{ textAlign: 'center' }}>
                  <QRCode data={ticket?.ticketId || ''} />
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="h6" align="center" gutterBottom>
                    Ticket ID: {ticket?.ticketId}
                  </Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Entry Date:
                  </Typography>
                  <Typography variant="body1">
                    {ticket ? formatDate(new Date(ticket.entryTime), 'yyyy-MM-dd') : ''}
                  </Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Entry Time:
                  </Typography>
                  <Typography variant="body1">
                    {ticket ? formatDate(new Date(ticket.entryTime), 'HH:mm:ss') : ''}
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="caption" color="textSecondary" align="center" sx={{ display: 'block', mt: 2 }}>
                    Please keep this ticket until you exit the parking area.
                    Present this ticket at the exit gate for payment.
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </DialogContent>
        
        <DialogActions sx={{ p: 2, justifyContent: 'center' }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Print />}
            onClick={handlePrintTicket}
            disabled={isGenerating}
            fullWidth
          >
            {isGenerating ? (
              <>
                <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                Printing...
              </>
            ) : (
              'Print Ticket'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default TicketGenerator; 