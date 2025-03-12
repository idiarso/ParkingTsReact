import React, { useState, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  DirectionsCar,
  CameraAlt,
  Print,
  Refresh,
  CheckCircle,
  Error as ErrorIcon
} from '@mui/icons-material';

interface VehicleEntry {
  plateNumber: string;
  vehicleType: string;
  entryTime: string;
  driverName?: string;
  driverPhone?: string;
}

interface CameraViewProps {
  onCapture: (plateNumber: string) => void;
  isProcessing: boolean;
}

// Mock camera view component
const CameraView: React.FC<CameraViewProps> = ({ onCapture, isProcessing }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isActive, setIsActive] = useState(false);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsActive(true);
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
    }
  };

  const captureImage = () => {
    // Simulate plate recognition
    setTimeout(() => {
      onCapture('ABC123');
    }, 1500);
  };

  return (
    <Box sx={{ position: 'relative' }}>
      {!isActive ? (
        <Box
          sx={{
            height: 200,
            bgcolor: 'grey.200',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 1
          }}
        >
          <Button
            startIcon={<CameraAlt />}
            variant="contained"
            onClick={startCamera}
          >
            Start Camera
          </Button>
        </Box>
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay
            style={{
              width: '100%',
              height: '200px',
              objectFit: 'cover',
              borderRadius: '4px'
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              bottom: 8,
              right: 8,
              display: 'flex',
              gap: 1
            }}
          >
            <Button
              variant="contained"
              color="primary"
              onClick={captureImage}
              disabled={isProcessing}
              startIcon={isProcessing ? <CircularProgress size={20} /> : <CameraAlt />}
            >
              {isProcessing ? 'Processing...' : 'Capture'}
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
};

// Ticket preview component
const TicketPreview: React.FC<{ entry: VehicleEntry }> = ({ entry }) => (
  <Card sx={{ minWidth: 275, maxWidth: 400, mx: 'auto', my: 2 }}>
    <CardContent>
      <Typography variant="h6" gutterBottom align="center">
        Parking Ticket
      </Typography>
      <Typography variant="body1" gutterBottom>
        Plate Number: {entry.plateNumber}
      </Typography>
      <Typography variant="body1" gutterBottom>
        Vehicle Type: {entry.vehicleType}
      </Typography>
      <Typography variant="body1" gutterBottom>
        Entry Time: {new Date(entry.entryTime).toLocaleString()}
      </Typography>
      {entry.driverName && (
        <Typography variant="body1" gutterBottom>
          Driver: {entry.driverName}
        </Typography>
      )}
      {entry.driverPhone && (
        <Typography variant="body1" gutterBottom>
          Contact: {entry.driverPhone}
        </Typography>
      )}
    </CardContent>
  </Card>
);

const GateInDashboard: React.FC = () => {
  const [formData, setFormData] = useState<VehicleEntry>({
    plateNumber: '',
    vehicleType: '',
    entryTime: new Date().toISOString(),
    driverName: '',
    driverPhone: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTicket, setShowTicket] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentEntries, setRecentEntries] = useState<VehicleEntry[]>([]);

  const handlePlateRecognition = (plateNumber: string) => {
    setFormData(prev => ({
      ...prev,
      plateNumber
    }));
    setIsProcessing(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsProcessing(true);

    try {
      // Validate form
      if (!formData.plateNumber || !formData.vehicleType) {
        throw new Error('Please fill in all required fields');
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update recent entries
      setRecentEntries(prev => [
        {
          ...formData,
          entryTime: new Date().toISOString()
        },
        ...prev
      ]);

      // Show ticket
      setShowTicket(true);

      // Reset form
      setFormData({
        plateNumber: '',
        vehicleType: '',
        entryTime: new Date().toISOString(),
        driverName: '',
        driverPhone: ''
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name as string]: value
    }));
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <DirectionsCar /> Gate Entry
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Camera Section */}
      <Paper sx={{ p: 3, mb: 4 }} elevation={2}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CameraAlt /> Plate Recognition
        </Typography>
        <CameraView onCapture={handlePlateRecognition} isProcessing={isProcessing} />
      </Paper>

      {/* Entry Form */}
      <Paper sx={{ p: 3, mb: 4 }} elevation={2}>
        <Typography variant="h6" gutterBottom>
          New Vehicle Entry
        </Typography>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Plate Number"
                name="plateNumber"
                value={formData.plateNumber}
                onChange={handleChange}
                disabled={isProcessing}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Vehicle Type</InputLabel>
                <Select
                  name="vehicleType"
                  value={formData.vehicleType}
                  label="Vehicle Type"
                  onChange={handleChange}
                  disabled={isProcessing}
                >
                  <MenuItem value="Car">Car</MenuItem>
                  <MenuItem value="Motorcycle">Motorcycle</MenuItem>
                  <MenuItem value="Truck">Truck</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Driver Name"
                name="driverName"
                value={formData.driverName}
                onChange={handleChange}
                disabled={isProcessing}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Driver Phone"
                name="driverPhone"
                value={formData.driverPhone}
                onChange={handleChange}
                disabled={isProcessing}
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={isProcessing}
                startIcon={isProcessing ? <CircularProgress size={20} /> : <CheckCircle />}
              >
                {isProcessing ? 'Processing...' : 'Record Entry'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>

      {/* Recent Entries Table */}
      <Paper sx={{ p: 3 }} elevation={2}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Recent Entries
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
                <TableCell>Vehicle Type</TableCell>
                <TableCell>Entry Time</TableCell>
                <TableCell>Driver Name</TableCell>
                <TableCell>Driver Phone</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recentEntries.map((entry, index) => (
                <TableRow key={index}>
                  <TableCell>{entry.plateNumber}</TableCell>
                  <TableCell>{entry.vehicleType}</TableCell>
                  <TableCell>{new Date(entry.entryTime).toLocaleString()}</TableCell>
                  <TableCell>{entry.driverName || '-'}</TableCell>
                  <TableCell>{entry.driverPhone || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Ticket Dialog */}
      <Dialog
        open={showTicket}
        onClose={() => setShowTicket(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Entry Ticket</DialogTitle>
        <DialogContent>
          <TicketPreview entry={recentEntries[0] || formData} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTicket(false)}>Close</Button>
          <Button
            startIcon={<Print />}
            variant="contained"
            onClick={handlePrint}
          >
            Print Ticket
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GateInDashboard; 