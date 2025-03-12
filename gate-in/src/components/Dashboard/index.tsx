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

interface VehicleEntry {
  plateNumber: string;
  vehicleType: string;
  entryTime: string;
  driverName?: string;
  driverPhone?: string;
}

// Mock data for recent entries
const mockRecentEntries: VehicleEntry[] = [
  {
    plateNumber: 'B 1234 XYZ',
    vehicleType: 'Mobil',
    entryTime: '2024-03-12 09:30:00',
    driverName: 'Budi Santoso',
    driverPhone: '081234567890'
  },
  {
    plateNumber: 'D 5678 ABC',
    vehicleType: 'Motor',
    entryTime: '2024-03-12 09:15:00'
  }
];

const GateInDashboard: React.FC = () => {
  const [plateNumber, setPlateNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTicket, setShowTicket] = useState(false);
  const [recentEntries, setRecentEntries] = useState<VehicleEntry[]>(mockRecentEntries);
  const [showCamera, setShowCamera] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsProcessing(true);

    try {
      if (!plateNumber.trim() || !vehicleType) {
        throw new Error('Nomor plat dan jenis kendaraan harus diisi');
      }

      // Validate Indonesian plate number format
      const plateRegex = /^[A-Z]{1,2}\s?\d{1,4}\s?[A-Z]{1,3}$/;
      if (!plateRegex.test(plateNumber.trim())) {
        throw new Error('Format nomor plat tidak valid (Contoh: B 1234 XYZ)');
      }

      // Validate phone number if provided
      if (driverPhone && !/^(\+62|62|0)8[1-9][0-9]{6,9}$/.test(driverPhone)) {
        throw new Error('Nomor telepon tidak valid (Contoh: 081234567890)');
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const newEntry: VehicleEntry = {
        plateNumber: plateNumber.trim().toUpperCase(),
        vehicleType,
        entryTime: new Date().toISOString(),
        ...(driverName && { driverName }),
        ...(driverPhone && { driverPhone })
      };

      setRecentEntries(prev => [newEntry, ...prev]);
      setShowTicket(true);

      // Reset form
      setPlateNumber('');
      setVehicleType('');
      setDriverName('');
      setDriverPhone('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
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
                  <MenuItem value="Mobil">Mobil</MenuItem>
                  <MenuItem value="Motor">Motor</MenuItem>
                  <MenuItem value="Truk">Truk</MenuItem>
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
                  <TableCell>{entry.plateNumber}</TableCell>
                  <TableCell>{entry.vehicleType}</TableCell>
                  <TableCell>{new Date(entry.entryTime).toLocaleString('id-ID')}</TableCell>
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