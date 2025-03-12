import React, { useState } from 'react';
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
  TableRow
} from '@mui/material';
import { ExitToApp, Receipt, Payment } from '@mui/icons-material';

interface ParkingSession {
  plateNumber: string;
  vehicleType: string;
  entryTime: string;
  duration: string;
  fee: number;
  isPaid: boolean;
}

const mockSession: ParkingSession = {
  plateNumber: 'ABC123',
  vehicleType: 'Car',
  entryTime: '2024-03-12 08:30:00',
  duration: '2 hours 15 minutes',
  fee: 25.00,
  isPaid: false
};

const GateOutDashboard: React.FC = () => {
  const [plateNumber, setPlateNumber] = useState('');
  const [sessionData, setSessionData] = useState<ParkingSession | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate fetching session data
    setSessionData(mockSession);
  };

  const handlePayment = (method: 'cash' | 'card') => {
    setPaymentMethod(method);
    // Process payment logic here
    console.log('Processing payment with:', method);
  };

  const handleExit = () => {
    // Process vehicle exit
    console.log('Processing vehicle exit');
    // Reset form
    setPlateNumber('');
    setSessionData(null);
    setPaymentMethod(null);
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <ExitToApp /> Gate Exit
      </Typography>

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
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
              >
                Search
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
                    {sessionData.entryTime}
                  </Typography>
                  <Typography variant="subtitle2" color="text.secondary">
                    Duration
                  </Typography>
                  <Typography variant="body1">
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
                        startIcon={<Payment />}
                      >
                        Cash
                      </Button>
                    </Grid>
                    <Grid item xs={6}>
                      <Button
                        fullWidth
                        variant={paymentMethod === 'card' ? 'contained' : 'outlined'}
                        onClick={() => handlePayment('card')}
                        startIcon={<Payment />}
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
                disabled={!paymentMethod}
              >
                Process Exit
              </Button>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Recent Exits */}
      <Paper sx={{ p: 3 }} elevation={2}>
        <Typography variant="h6" gutterBottom>
          Recent Exits
        </Typography>
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
              <TableRow>
                <TableCell>XYZ789</TableCell>
                <TableCell>2024-03-12 08:00:00</TableCell>
                <TableCell>2024-03-12 10:30:00</TableCell>
                <TableCell>2h 30m</TableCell>
                <TableCell>$30.00</TableCell>
                <TableCell>Cash</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default GateOutDashboard; 