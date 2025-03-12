import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Chip
} from '@mui/material';
import {
  ExitToApp,
  Receipt,
  Payment,
  Print,
  Refresh,
  CheckCircle,
  LocalAtm,
  CreditCard,
  Timer,
  Error as ErrorIcon,
  Search as SearchIcon
} from '@mui/icons-material';

interface ParkingSession {
  plateNumber: string;
  vehicleType: string;
  entryTime: string;
  exitTime?: string;
  duration: string;
  fee: number;
  isPaid: boolean;
  paymentMethod?: 'cash' | 'card';
}

interface RecentExit extends ParkingSession {
  exitTime: string;
  paymentMethod: 'cash' | 'card';
}

// Mock data
const mockSession: ParkingSession = {
  plateNumber: 'ABC123',
  vehicleType: 'Car',
  entryTime: '2024-03-12 08:30:00',
  duration: '2 hours 15 minutes',
  fee: 25.00,
  isPaid: false
};

const mockRecentExits: RecentExit[] = [
  {
    plateNumber: 'XYZ789',
    vehicleType: 'Car',
    entryTime: '2024-03-12 08:00:00',
    exitTime: '2024-03-12 10:30:00',
    duration: '2h 30m',
    fee: 30.00,
    isPaid: true,
    paymentMethod: 'cash'
  }
];

// Receipt component
const ReceiptPreview: React.FC<{ session: ParkingSession }> = ({ session }) => (
  <Card sx={{ minWidth: 275, maxWidth: 400, mx: 'auto', my: 2 }}>
    <CardContent>
      <Typography variant="h6" gutterBottom align="center">
        Parking Receipt
      </Typography>
      <Box sx={{ mb: 3, textAlign: 'center' }}>
        <Chip
          label={session.isPaid ? 'PAID' : 'UNPAID'}
          color={session.isPaid ? 'success' : 'error'}
          sx={{ mb: 2 }}
        />
      </Box>
      <Typography variant="body1" gutterBottom>
        Plate Number: {session.plateNumber}
      </Typography>
      <Typography variant="body1" gutterBottom>
        Vehicle Type: {session.vehicleType}
      </Typography>
      <Typography variant="body1" gutterBottom>
        Entry Time: {new Date(session.entryTime).toLocaleString()}
      </Typography>
      {session.exitTime && (
        <Typography variant="body1" gutterBottom>
          Exit Time: {new Date(session.exitTime).toLocaleString()}
        </Typography>
      )}
      <Typography variant="body1" gutterBottom>
        Duration: {session.duration}
      </Typography>
      <Divider sx={{ my: 2 }} />
      <Typography variant="h5" align="center" color="primary" gutterBottom>
        Total Fee: ${session.fee.toFixed(2)}
      </Typography>
      {session.paymentMethod && (
        <Typography variant="body2" align="center" color="text.secondary">
          Paid via {session.paymentMethod.toUpperCase()}
        </Typography>
      )}
    </CardContent>
  </Card>
);

const GateOutDashboard: React.FC = () => {
  const [plateNumber, setPlateNumber] = useState('');
  const [sessionData, setSessionData] = useState<ParkingSession | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [recentExits, setRecentExits] = useState<RecentExit[]>(mockRecentExits);

  // Calculate real-time duration and fee
  useEffect(() => {
    if (sessionData && !sessionData.isPaid) {
      const interval = setInterval(() => {
        const entry = new Date(sessionData.entryTime);
        const now = new Date();
        const durationMs = now.getTime() - entry.getTime();
        const hours = Math.floor(durationMs / (1000 * 60 * 60));
        const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
        
        // Update duration and fee
        setSessionData(prev => {
          if (!prev) return null;
          const newFee = calculateFee(hours, minutes, prev.vehicleType);
          return {
            ...prev,
            duration: `${hours}h ${minutes}m`,
            fee: newFee
          };
        });
      }, 60000); // Update every minute

      return () => clearInterval(interval);
    }
  }, [sessionData]);

  const calculateFee = (hours: number, minutes: number, vehicleType: string): number => {
    // Base rate per hour
    const baseRate = vehicleType === 'Car' ? 10 : vehicleType === 'Motorcycle' ? 5 : 15;
    const totalHours = hours + (minutes / 60);
    return Math.ceil(totalHours) * baseRate;
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsProcessing(true);

    try {
      if (!plateNumber.trim()) {
        throw new Error('Please enter a plate number');
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSessionData(mockSession);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayment = async (method: 'cash' | 'card') => {
    setError(null);
    setPaymentMethod(method);
    setIsProcessing(true);

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (sessionData) {
        const updatedSession: ParkingSession = {
          ...sessionData,
          isPaid: true,
          paymentMethod: method,
          exitTime: new Date().toISOString()
        };
        setSessionData(updatedSession);
      }
    } catch (err) {
      setError('Payment processing failed. Please try again.');
      setPaymentMethod(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExit = async () => {
    setIsProcessing(true);
    try {
      // Simulate exit processing
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (sessionData) {
        // Add to recent exits
        const exitRecord: RecentExit = {
          ...sessionData,
          exitTime: new Date().toISOString(),
          paymentMethod: paymentMethod!
        };
        setRecentExits(prev => [exitRecord, ...prev]);
      }

      // Show receipt
      setShowReceipt(true);

      // Reset form
      setPlateNumber('');
      setSessionData(null);
      setPaymentMethod(null);
    } catch (err) {
      setError('Failed to process exit. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <ExitToApp /> Gate Exit
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Search Form */}
      <Paper sx={{ p: 3, mb: 4 }} elevation={2}>
        <Typography variant="h6" gutterBottom>
          Find Vehicle
        </Typography>
        <form onSubmit={handleSearch}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={8}>
              <TextField
                required
                fullWidth
                label="Plate Number"
                value={plateNumber}
                onChange={(e) => setPlateNumber(e.target.value)}
                disabled={isProcessing}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                onClick={handleSearch}
                fullWidth
                disabled={isProcessing}
                startIcon={isProcessing ? <CircularProgress size={20} /> : <SearchIcon />}
              >
                {isProcessing ? 'Searching...' : 'Search'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>

      {/* Session Details */}
      {sessionData && (
        <Paper sx={{ p: 3, mb: 4 }} elevation={2}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Receipt /> Parking Details
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary">
                    Vehicle Information
                  </Typography>
                  <Typography variant="h6" gutterBottom>
                    {sessionData.plateNumber} - {sessionData.vehicleType}
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" color="text.secondary">
                    Entry Time
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {new Date(sessionData.entryTime).toLocaleString()}
                  </Typography>
                  <Typography variant="subtitle2" color="text.secondary">
                    Duration
                  </Typography>
                  <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Timer fontSize="small" />
                    {sessionData.duration}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary">
                    Payment Information
                  </Typography>
                  <Typography variant="h4" color="primary" gutterBottom>
                    ${sessionData.fee.toFixed(2)}
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Select Payment Method
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Button
                        fullWidth
                        variant={paymentMethod === 'cash' ? 'contained' : 'outlined'}
                        onClick={() => handlePayment('cash')}
                        disabled={isProcessing || sessionData.isPaid}
                        startIcon={<LocalAtm />}
                      >
                        Cash
                      </Button>
                    </Grid>
                    <Grid item xs={6}>
                      <Button
                        fullWidth
                        variant={paymentMethod === 'card' ? 'contained' : 'outlined'}
                        onClick={() => handlePayment('card')}
                        disabled={isProcessing || sessionData.isPaid}
                        startIcon={<CreditCard />}
                      >
                        Card
                      </Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12}>
              <Button
                fullWidth
                variant="contained"
                color="success"
                size="large"
                onClick={handleExit}
                disabled={!sessionData.isPaid || isProcessing}
                startIcon={isProcessing ? <CircularProgress size={20} /> : <CheckCircle />}
              >
                {isProcessing ? 'Processing...' : 'Process Exit'}
              </Button>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Recent Exits */}
      <Paper sx={{ p: 3 }} elevation={2}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Recent Exits
          </Typography>
          <Tooltip title="Refresh">
            <IconButton onClick={() => {}}>
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Plate Number</TableCell>
                <TableCell>Entry Time</TableCell>
                <TableCell>Exit Time</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Fee</TableCell>
                <TableCell>Payment Method</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recentExits.map((exit, index) => (
                <TableRow key={index}>
                  <TableCell>{exit.plateNumber}</TableCell>
                  <TableCell>{new Date(exit.entryTime).toLocaleString()}</TableCell>
                  <TableCell>{new Date(exit.exitTime).toLocaleString()}</TableCell>
                  <TableCell>{exit.duration}</TableCell>
                  <TableCell>${exit.fee.toFixed(2)}</TableCell>
                  <TableCell>
                    <Chip
                      icon={exit.paymentMethod === 'cash' ? <LocalAtm /> : <CreditCard />}
                      label={exit.paymentMethod.toUpperCase()}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Receipt Dialog */}
      <Dialog
        open={showReceipt}
        onClose={() => setShowReceipt(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Payment Receipt</DialogTitle>
        <DialogContent>
          {sessionData && <ReceiptPreview session={sessionData} />}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowReceipt(false)}>Close</Button>
          <Button
            startIcon={<Print />}
            variant="contained"
            onClick={handlePrint}
          >
            Print Receipt
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GateOutDashboard; 