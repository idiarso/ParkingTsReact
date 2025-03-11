import React, { useState, useEffect, ChangeEvent } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import { styled, Theme } from '@mui/material/styles';

const StyledPaper = styled(Paper)(({ theme }: { theme: Theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2)
}));

const StyledTableCell = styled(TableCell)(({ theme }: { theme: Theme }) => ({
  fontWeight: 'bold',
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.common.white
}));

interface ParkingSession {
  id: string;
  plateNumber: string;
  vehicleType: string;
  entryTime: string;
  parkingFee?: number;
  isCompleted: boolean;
  driverName?: string;
  driverPhone?: string;
  parkingSpot?: string;
}

interface ExitGateProps {
  onExit: (plateNumber: string) => void;
}

const ExitGate: React.FC<ExitGateProps> = ({ onExit }) => {
  const [plateNumber, setPlateNumber] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<ParkingSession | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [paymentReference, setPaymentReference] = useState<string>('');

  const handleSearch = async () => {
    if (!plateNumber) {
      setError('Please enter a plate number');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/parking/details/${plateNumber}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch parking details');
      }

      setSession(data.data);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  const handleExit = async () => {
    if (!session || !paymentMethod || !paymentReference) {
      setError('Please fill in all payment details');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/parking/exit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plateNumber: session.plateNumber,
          paymentMethod,
          paymentReference,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to process exit');
      }

      onExit(session.plateNumber);
      setSession(null);
      setPlateNumber('');
      setPaymentMethod('');
      setPaymentReference('');
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Box my={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Exit Gate
        </Typography>

        <StyledPaper>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                label="Plate Number"
                value={plateNumber}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setPlateNumber(e.target.value.toUpperCase())}
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                onClick={handleSearch}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Search'}
              </Button>
            </Grid>
          </Grid>
        </StyledPaper>

        {error && (
          <StyledPaper>
            <Typography color="error">{error}</Typography>
          </StyledPaper>
        )}

        {session && (
          <Card>
            <CardContent>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <StyledTableCell>Field</StyledTableCell>
                      <StyledTableCell>Value</StyledTableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>Plate Number</TableCell>
                      <TableCell>{session.plateNumber}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Vehicle Type</TableCell>
                      <TableCell>{session.vehicleType}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Entry Time</TableCell>
                      <TableCell>{new Date(session.entryTime).toLocaleString()}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Parking Fee</TableCell>
                      <TableCell>${session.parkingFee?.toFixed(2) || '0.00'}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              <Box mt={3}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Payment Method"
                      value={paymentMethod}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setPaymentMethod(e.target.value)}
                      disabled={loading}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Payment Reference"
                      value={paymentReference}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setPaymentReference(e.target.value)}
                      disabled={loading}
                    />
                  </Grid>
                </Grid>

                <Box mt={2}>
                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    onClick={handleExit}
                    disabled={loading}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Process Exit'}
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}
      </Box>
    </Container>
  );
};

export default ExitGate; 