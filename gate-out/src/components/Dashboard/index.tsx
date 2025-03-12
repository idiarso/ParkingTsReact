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
  plateNumber: 'B 1234 XYZ',  // Indonesian plate format
  vehicleType: 'Mobil',       // Indonesian vehicle type
  entryTime: '2024-03-12 08:30:00',
  duration: '2 jam 15 menit', // Indonesian duration format
  fee: 25000,                 // In Rupiah
  isPaid: false
};

const mockRecentExits: RecentExit[] = [
  {
    plateNumber: 'D 5678 ABC',
    vehicleType: 'Mobil',
    entryTime: '2024-03-12 08:00:00',
    exitTime: '2024-03-12 10:30:00',
    duration: '2j 30m',
    fee: 30000,
    isPaid: true,
    paymentMethod: 'cash'
  }
];

// Format currency to Rupiah
const formatToRupiah = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// Receipt component
const ReceiptPreview: React.FC<{ session: ParkingSession }> = ({ session }) => (
  <Card sx={{ minWidth: 275, maxWidth: 400, mx: 'auto', my: 2 }}>
    <CardContent>
      <Typography variant="h6" gutterBottom align="center">
        Struk Parkir
      </Typography>
      <Box sx={{ mb: 3, textAlign: 'center' }}>
        <Chip
          label={session.isPaid ? 'LUNAS' : 'BELUM LUNAS'}
          color={session.isPaid ? 'success' : 'error'}
          sx={{ mb: 2 }}
        />
      </Box>
      <Typography variant="body1" gutterBottom>
        Nomor Plat: {session.plateNumber}
      </Typography>
      <Typography variant="body1" gutterBottom>
        Jenis Kendaraan: {session.vehicleType}
      </Typography>
      <Typography variant="body1" gutterBottom>
        Waktu Masuk: {new Date(session.entryTime).toLocaleString('id-ID')}
      </Typography>
      {session.exitTime && (
        <Typography variant="body1" gutterBottom>
          Waktu Keluar: {new Date(session.exitTime).toLocaleString('id-ID')}
        </Typography>
      )}
      <Typography variant="body1" gutterBottom>
        Durasi: {session.duration}
      </Typography>
      <Divider sx={{ my: 2 }} />
      <Typography variant="h5" align="center" color="primary" gutterBottom>
        Total Biaya: {formatToRupiah(session.fee)}
      </Typography>
      {session.paymentMethod && (
        <Typography variant="body2" align="center" color="text.secondary">
          Dibayar via {session.paymentMethod === 'cash' ? 'TUNAI' : 'KARTU'}
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
    // Base rate per hour in Rupiah
    const baseRate = vehicleType === 'Mobil' ? 5000 : vehicleType === 'Motor' ? 2000 : 8000;
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
        <ExitToApp /> Pintu Keluar
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Search Form */}
      <Paper sx={{ p: 3, mb: 4 }} elevation={2}>
        <Typography variant="h6" gutterBottom>
          Cari Kendaraan
        </Typography>
        <form onSubmit={handleSearch}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={8}>
              <TextField
                required
                fullWidth
                label="Nomor Plat"
                value={plateNumber}
                onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                disabled={isProcessing}
                placeholder="Contoh: B 1234 XYZ"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                disabled={isProcessing}
                startIcon={isProcessing ? <CircularProgress size={20} /> : <SearchIcon />}
              >
                {isProcessing ? 'Mencari...' : 'Cari'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>

      {/* Session Details */}
      {sessionData && (
        <Paper sx={{ p: 3, mb: 4 }} elevation={2}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Receipt /> Detail Parkir
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary">
                    Informasi Kendaraan
                  </Typography>
                  <Typography variant="h6" gutterBottom>
                    {sessionData.plateNumber} - {sessionData.vehicleType}
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" color="text.secondary">
                    Waktu Masuk
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {new Date(sessionData.entryTime).toLocaleString('id-ID')}
                  </Typography>
                  <Typography variant="subtitle2" color="text.secondary">
                    Durasi
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
                    Informasi Pembayaran
                  </Typography>
                  <Typography variant="h4" color="primary" gutterBottom>
                    {formatToRupiah(sessionData.fee)}
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Pilih Metode Pembayaran
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
                        Tunai
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
                        Kartu
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
                {isProcessing ? 'Memproses...' : 'Proses Keluar'}
              </Button>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Recent Exits */}
      <Paper sx={{ p: 3 }} elevation={2}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Riwayat Keluar Terbaru
          </Typography>
          <Tooltip title="Segarkan">
            <IconButton onClick={() => {}}>
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nomor Plat</TableCell>
                <TableCell>Waktu Masuk</TableCell>
                <TableCell>Waktu Keluar</TableCell>
                <TableCell>Durasi</TableCell>
                <TableCell>Biaya</TableCell>
                <TableCell>Metode Pembayaran</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recentExits.map((exit, index) => (
                <TableRow key={index}>
                  <TableCell>{exit.plateNumber}</TableCell>
                  <TableCell>{new Date(exit.entryTime).toLocaleString('id-ID')}</TableCell>
                  <TableCell>{new Date(exit.exitTime).toLocaleString('id-ID')}</TableCell>
                  <TableCell>{exit.duration}</TableCell>
                  <TableCell>{formatToRupiah(exit.fee)}</TableCell>
                  <TableCell>
                    <Chip
                      icon={exit.paymentMethod === 'cash' ? <LocalAtm /> : <CreditCard />}
                      label={exit.paymentMethod === 'cash' ? 'TUNAI' : 'KARTU'}
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
        <DialogTitle>Struk Pembayaran</DialogTitle>
        <DialogContent>
          {sessionData && <ReceiptPreview session={sessionData} />}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowReceipt(false)}>Tutup</Button>
          <Button
            startIcon={<Print />}
            variant="contained"
            onClick={handlePrint}
          >
            Cetak Struk
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GateOutDashboard; 