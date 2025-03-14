import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
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
  Tooltip
} from '@mui/material';
import {
  DirectionsCar,
  Print,
  PhotoCamera,
  Refresh,
  Add
} from '@mui/icons-material';
import { VehicleEntry } from '../../services/dbService';

// Extended interface for dashboard-specific fields
interface ExtendedVehicleEntry extends Partial<VehicleEntry> {
  driverName?: string;
  driverPhone?: string;
}

// Mock data for recent entries
const mockRecentEntries: ExtendedVehicleEntry[] = [
  {
    id: '1',
    ticketId: 'T-20230601-001',
    licensePlate: 'B 1234 XYZ',
    vehicleType: 'CAR',
    entryTime: Date.now() - 3600000, // 1 hour ago
    processed: true,
    driverName: 'Budi Santoso',
    driverPhone: '081234567890'
  },
  {
    id: '2',
    ticketId: 'T-20230601-002',
    licensePlate: 'D 5678 ABC',
    vehicleType: 'MOTORCYCLE',
    entryTime: Date.now() - 7200000, // 2 hours ago
    processed: true
  },
  {
    id: '3',
    ticketId: 'T-20230601-003',
    licensePlate: 'F 9012 DEF',
    vehicleType: 'CAR',
    entryTime: Date.now() - 10800000, // 3 hours ago
    processed: true
  }
];

const GateInDashboard: React.FC = () => {
  const [plateNumber, setPlateNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('CAR');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTicket, setShowTicket] = useState(false);
  const [recentEntries, setRecentEntries] = useState<ExtendedVehicleEntry[]>(mockRecentEntries);
  const [showCamera, setShowCamera] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!plateNumber.trim()) {
      setError('Nomor plat kendaraan harus diisi');
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const newEntry: ExtendedVehicleEntry = {
        id: `${Date.now()}`,
        ticketId: `T-${Date.now()}`,
        licensePlate: plateNumber.trim().toUpperCase(),
        vehicleType,
        entryTime: Date.now(),
        processed: true,
        driverName: driverName || undefined,
        driverPhone: driverPhone || undefined
      };

      setRecentEntries(prev => [newEntry, ...prev]);
      setShowTicket(true);
      
      // Reset form
      setPlateNumber('');
      setDriverName('');
      setDriverPhone('');
      
    } catch (error) {
      setError('Gagal memproses kendaraan masuk');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCapturePlate = () => {
    setShowCamera(true);
    // Simulate plate capture
    setTimeout(() => {
      setShowCamera(false);
      setPlateNumber('B 1234 XYZ');
    }, 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <DirectionsCar /> Pintu Masuk
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Entry Form */}
      <Paper sx={{ p: 3, mb: 4 }} elevation={2}>
        <Typography variant="h6" gutterBottom>
          Data Kendaraan Masuk
        </Typography>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
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
                fullWidth
                variant="outlined"
                onClick={handleCapturePlate}
                disabled={isProcessing}
                startIcon={<PhotoCamera />}
              >
                Scan Plat
              </Button>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Jenis Kendaraan</InputLabel>
                <Select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  disabled={isProcessing}
                >
                  <MenuItem value="CAR">CAR</MenuItem>
                  <MenuItem value="MOTORCYCLE">MOTORCYCLE</MenuItem>
                  <MenuItem value="TRUCK">TRUCK</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nama Pengemudi (Opsional)"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                disabled={isProcessing}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nomor Telepon (Opsional)"
                value={driverPhone}
                onChange={(e) => setDriverPhone(e.target.value)}
                disabled={isProcessing}
                placeholder="Contoh: 081234567890"
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                size="large"
                disabled={isProcessing}
                startIcon={isProcessing ? <CircularProgress size={20} /> : <Add />}
              >
                {isProcessing ? 'Memproses...' : 'Proses Masuk'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>

      {/* Recent Entries */}
      <Paper sx={{ p: 3 }} elevation={2}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Riwayat Masuk Terbaru
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
                <TableCell>Jenis Kendaraan</TableCell>
                <TableCell>Waktu Masuk</TableCell>
                <TableCell>Pengemudi</TableCell>
                <TableCell>Telepon</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recentEntries.map((entry, index) => (
                <TableRow key={index}>
                  <TableCell>{entry.licensePlate || '-'}</TableCell>
                  <TableCell>{entry.vehicleType || '-'}</TableCell>
                  <TableCell>{entry.entryTime ? new Date(entry.entryTime).toLocaleString('id-ID') : '-'}</TableCell>
                  <TableCell>{entry.driverName || '-'}</TableCell>
                  <TableCell>{entry.driverPhone || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Camera Dialog */}
      <Dialog
        open={showCamera}
        onClose={() => setShowCamera(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Pemindaian Plat Nomor</DialogTitle>
        <DialogContent>
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <CircularProgress />
            <Typography sx={{ mt: 2 }}>
              Memindai plat nomor...
            </Typography>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Ticket Dialog */}
      <Dialog
        open={showTicket}
        onClose={() => setShowTicket(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Tiket Parkir</DialogTitle>
        <DialogContent>
          <Card sx={{ minWidth: 275, maxWidth: 400, mx: 'auto', my: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom align="center">
                TIKET PARKIR
              </Typography>
              <Typography variant="body1" gutterBottom>
                Nomor Plat: {plateNumber}
              </Typography>
              <Typography variant="body1" gutterBottom>
                Jenis Kendaraan: {vehicleType}
              </Typography>
              <Typography variant="body1" gutterBottom>
                Waktu Masuk: {new Date().toLocaleString('id-ID')}
              </Typography>
              {driverName && (
                <Typography variant="body1" gutterBottom>
                  Pengemudi: {driverName}
                </Typography>
              )}
              {driverPhone && (
                <Typography variant="body1" gutterBottom>
                  Telepon: {driverPhone}
                </Typography>
              )}
            </CardContent>
          </Card>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTicket(false)}>Tutup</Button>
          <Button
            startIcon={<Print />}
            variant="contained"
            onClick={handlePrint}
          >
            Cetak Tiket
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GateInDashboard; 