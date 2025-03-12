import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  Card,
  CardContent,
  Divider,
  Chip,
  CircularProgress,
  Alert,
  AlertTitle,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CardMedia,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  DirectionsCar,
  AccessTime,
  Payment,
  Print,
  CheckCircle,
  Receipt,
  KeyboardReturn,
  ZoomIn,
  PhotoCamera
} from '@mui/icons-material';
import paymentService, { VehicleEntry } from '../services/paymentService';
import socketService from '../services/socketService';

interface PaymentProcessorProps {
  vehicleEntry: VehicleEntry | null;
  onReset: () => void;
  isLoading: boolean;
}

const PaymentProcessor: React.FC<PaymentProcessorProps> = ({
  vehicleEntry,
  onReset,
  isLoading
}) => {
  const [showReceipt, setShowReceipt] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showImageDialog, setShowImageDialog] = useState(false);
  
  // Calculate exit time and fee
  const exitTime = Date.now();
  const fee = vehicleEntry ? paymentService.calculateParkingFee(vehicleEntry, exitTime) : 0;
  const duration = vehicleEntry ? paymentService.calculateDuration(vehicleEntry, exitTime) : '';
  
  const handleProcessPayment = async () => {
    if (!vehicleEntry) return;
    
    setIsProcessingPayment(true);
    setError(null);
    
    try {
      // In a real system, this would process the payment through a payment gateway
      // For this demo, we'll just simulate a successful payment
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update vehicle entry with exit time and fee
      const updatedEntry = {
        ...vehicleEntry,
        exitTime,
        fee
      };
      
      // In a real system, update the database with exit time and fee
      // await dbService.updateVehicleEntry(updatedEntry);
      
      // Notify gate via socket to open
      socketService.updateGateStatus('gate-out', 'open');
      
      // After a delay, close the gate
      setTimeout(() => {
        socketService.updateGateStatus('gate-out', 'closed');
      }, 5000);
      
      setPaymentComplete(true);
    } catch (err) {
      console.error('Payment processing error:', err);
      setError('Failed to process payment. Please try again.');
    } finally {
      setIsProcessingPayment(false);
    }
  };
  
  const handlePrintReceipt = () => {
    setIsPrinting(true);
    
    // Simulate printing process
    setTimeout(() => {
      setIsPrinting(false);
      setShowReceipt(true);
    }, 1500);
  };
  
  const handleCloseReceipt = () => {
    setShowReceipt(false);
    if (paymentComplete) {
      onReset(); // Reset for the next customer only if payment is complete
    }
  };

  // Add a new function to handle image preview
  const handleImagePreview = () => {
    setShowImageDialog(true);
  };

  const handleCloseImageDialog = () => {
    setShowImageDialog(false);
  };

  if (isLoading) {
    return (
      <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress size={40} sx={{ mb: 2 }} />
        <Typography variant="h6">
          Loading vehicle information...
        </Typography>
      </Paper>
    );
  }

  if (!vehicleEntry) {
    return (
      <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="textSecondary">
          Scan a ticket to process payment
        </Typography>
      </Paper>
    );
  }

  if (paymentComplete) {
    return (
      <Paper elevation={3} sx={{ p: 3 }}>
        <Alert 
          severity="success" 
          icon={<CheckCircle fontSize="inherit" />}
          sx={{ mb: 3 }}
        >
          <AlertTitle>Payment Successful</AlertTitle>
          The barrier gate has been opened. Please print a receipt for the customer.
        </Alert>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
          <Button
            variant="outlined"
            startIcon={<KeyboardReturn />}
            onClick={onReset}
          >
            Process Another Vehicle
          </Button>
          
          <Button
            variant="contained"
            color="primary"
            startIcon={isPrinting ? <CircularProgress size={24} color="inherit" /> : <Print />}
            onClick={handlePrintReceipt}
            disabled={isPrinting}
          >
            {isPrinting ? 'Printing...' : 'Print Receipt'}
          </Button>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Vehicle Exit & Payment
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Please verify vehicle information before processing payment
        </Typography>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <DirectionsCar sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
                <Box>
                  <Typography variant="h6">
                    {vehicleEntry.licensePlate}
                  </Typography>
                  <Chip 
                    label={vehicleEntry.vehicleType} 
                    size="small" 
                    color="primary" 
                    variant="outlined" 
                  />
                </Box>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              {/* Add entry image section */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Entry Image:
                </Typography>
                {vehicleEntry.image ? (
                  <Box sx={{ position: 'relative', mb: 2 }}>
                    <CardMedia
                      component="img"
                      height="140"
                      image={vehicleEntry.image}
                      alt="Vehicle Entry Image"
                      sx={{ borderRadius: 1, objectFit: 'cover' }}
                    />
                    <Tooltip title="View Larger Image">
                      <IconButton 
                        size="small" 
                        sx={{ 
                          position: 'absolute', 
                          right: 8, 
                          bottom: 8, 
                          bgcolor: 'rgba(0,0,0,0.5)', 
                          color: 'white',
                          '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' } 
                        }}
                        onClick={handleImagePreview}
                      >
                        <ZoomIn />
                      </IconButton>
                    </Tooltip>
                  </Box>
                ) : (
                  <Alert severity="warning" variant="outlined" icon={<PhotoCamera />}>
                    No entry image available
                  </Alert>
                )}
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Entry Time:
                </Typography>
                <Typography variant="body1">
                  {new Date(vehicleEntry.entryTime).toLocaleString()}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Ticket ID:
                </Typography>
                <Typography variant="body1">
                  {vehicleEntry.ticketId}
                </Typography>
              </Box>
              
              {vehicleEntry.lostTicket && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  <AlertTitle>Lost Ticket</AlertTitle>
                  Additional penalty fee will be applied.
                </Alert>
              )}
              
              {vehicleEntry.overnight && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  <AlertTitle>Overnight Vehicle</AlertTitle>
                  Overnight rate will be applied.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card variant="outlined" sx={{ bgcolor: 'success.light', height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Payment Summary
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AccessTime sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="body1">
                  Duration: {duration}
                </Typography>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="textSecondary">
                  Current Time (Exit)
                </Typography>
                <Typography variant="body1">
                  {new Date(exitTime).toLocaleString()}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="h5" color="primary" sx={{ fontWeight: 'bold' }}>
                  Total Fee: {paymentService.formatCurrency(fee)}
                </Typography>
              </Box>
              
              <Button
                variant="contained"
                color="primary"
                fullWidth
                size="large"
                startIcon={isProcessingPayment ? <CircularProgress size={24} color="inherit" /> : <Payment />}
                onClick={handleProcessPayment}
                disabled={isProcessingPayment}
                sx={{ mt: 2 }}
              >
                {isProcessingPayment ? 'Processing...' : 'Process Payment'}
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Receipt Dialog */}
      <Dialog
        open={showReceipt}
        onClose={handleCloseReceipt}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ textAlign: 'center' }}>
          <Receipt sx={{ mr: 1 }} />
          Parking Receipt
        </DialogTitle>
        
        <DialogContent dividers>
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              PARKING SYSTEM
            </Typography>
            <Typography variant="body2" gutterBottom>
              Receipt #{Math.floor(1000000 + Math.random() * 9000000)}
            </Typography>
            <Typography variant="caption" display="block" gutterBottom>
              {new Date().toLocaleString()}
            </Typography>
            
            <Divider sx={{ my: 2 }} />
            
            <Grid container spacing={2} sx={{ textAlign: 'left', mb: 2 }}>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  License Plate:
                </Typography>
                <Typography variant="body1">
                  {vehicleEntry.licensePlate}
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Vehicle Type:
                </Typography>
                <Typography variant="body1">
                  {vehicleEntry.vehicleType}
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Entry Time:
                </Typography>
                <Typography variant="body1">
                  {new Date(vehicleEntry.entryTime).toLocaleString()}
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Exit Time:
                </Typography>
                <Typography variant="body1">
                  {new Date(exitTime).toLocaleString()}
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="body2" color="textSecondary">
                  Duration:
                </Typography>
                <Typography variant="body1">
                  {duration}
                </Typography>
              </Grid>
            </Grid>
            
            <Divider sx={{ my: 2 }} />
            
            <Box sx={{ textAlign: 'right', mb: 2 }}>
              <Typography variant="body2" color="textSecondary">
                Total Fee:
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {paymentService.formatCurrency(fee)}
              </Typography>
            </Box>
            
            <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 3 }}>
              Thank you for using our parking facilities!
            </Typography>
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleCloseReceipt}>
            Close
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<Print />}
            onClick={handleCloseReceipt}
          >
            Print Another Copy
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Add Image Preview Dialog */}
      <Dialog
        open={showImageDialog}
        onClose={handleCloseImageDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Vehicle Entry Image
        </DialogTitle>
        <DialogContent>
          {vehicleEntry?.image ? (
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <img 
                src={vehicleEntry.image} 
                alt="Vehicle Entry" 
                style={{ maxWidth: '100%', maxHeight: '70vh' }} 
              />
            </Box>
          ) : (
            <Alert severity="warning" icon={<PhotoCamera />}>
              No entry image available
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseImageDialog}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default PaymentProcessor; 