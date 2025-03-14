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
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();
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

  const navigateToEntryScreen = () => {
    navigate('/gate-in');  // Redirect to our GateInScreen for vehicle entry
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard Gate Masuk
      </Typography>
      
      <Grid container spacing={3}>
        {/* Main actions card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Tindakan Cepat
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                <Button 
                  variant="contained" 
                  color="primary" 
                  size="large"
                  startIcon={<DirectionsCar />}
                  onClick={navigateToEntryScreen}
                  fullWidth
                >
                  Proses Kendaraan Masuk
                </Button>
                
                {/* ... other buttons ... */}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* ... rest of the component ... */}
      </Grid>
    </Box>
  );
};

export default GateInDashboard; 