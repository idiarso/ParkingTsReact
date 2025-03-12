import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Divider,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Chip,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell
} from '@mui/material';
import {
  Brightness2 as NightIcon,
  DirectionsCar,
  Receipt,
  Schedule
} from '@mui/icons-material';
import dbService from '../services/dbService';
import { VehicleEntry } from '../services/paymentService';

interface OvernightProcessorProps {
  onVehicleSelected: (entry: VehicleEntry) => void;
}

const isOvernight = (entry: VehicleEntry): boolean => {
  const entryTime = new Date(entry.entryTime);
  const now = new Date();
  
  // Calculate the difference in hours
  const diffHours = (now.getTime() - entryTime.getTime()) / (1000 * 60 * 60);
  
  // Consider vehicles that have been parked for more than 8 hours as overnight
  return diffHours >= 8;
};

const OvernightProcessor: React.FC<OvernightProcessorProps> = ({ onVehicleSelected }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [overnightVehicles, setOvernightVehicles] = useState<VehicleEntry[]>([]);

  useEffect(() => {
    loadOvernightVehicles();
  }, []);

  const loadOvernightVehicles = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // In a real implementation, this would filter entries directly from the database
      // For this demo, we'll get all active entries and filter them in memory
      const entries = await dbService.getAllActiveEntries();
      
      // Filter to only include overnight vehicles
      const overnight = entries.filter(isOvernight);
      
      setOvernightVehicles(overnight);
      
      if (overnight.length === 0) {
        setError('No overnight vehicles found in the parking lot');
      }
    } catch (err) {
      console.error('Error loading overnight vehicles:', err);
      setError('Failed to load overnight vehicles. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectVehicle = (entry: VehicleEntry) => {
    onVehicleSelected({
      ...entry,
      // Add an overnight flag to apply special rates
      overnight: true
    });
  };

  const getDurationInHours = (entryTime: number): number => {
    const now = new Date();
    const entry = new Date(entryTime);
    return Math.round((now.getTime() - entry.getTime()) / (1000 * 60 * 60));
  };

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" gutterBottom display="flex" alignItems="center">
          <NightIcon color="primary" sx={{ mr: 1 }} />
          Overnight Vehicle Processing
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Process vehicles that have stayed overnight with special rates
        </Typography>
      </Box>

      {error && (
        <Alert severity="info" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          Overnight Vehicles ({overnightVehicles.length})
        </Typography>
        <Button
          variant="outlined"
          startIcon={isLoading ? <CircularProgress size={20} /> : <Schedule />}
          onClick={loadOvernightVehicles}
          disabled={isLoading}
        >
          Refresh List
        </Button>
      </Box>
      
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : overnightVehicles.length > 0 ? (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>License Plate</TableCell>
                <TableCell>Entry Time</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Vehicle Type</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {overnightVehicles.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <DirectionsCar color="primary" sx={{ mr: 1 }} />
                      <Typography variant="body2" fontWeight="bold">
                        {entry.licensePlate}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {new Date(entry.entryTime).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      color="warning" 
                      size="small" 
                      label={`${getDurationInHours(entry.entryTime)} hours`} 
                    />
                  </TableCell>
                  <TableCell>{entry.vehicleType}</TableCell>
                  <TableCell align="right">
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<Receipt />}
                      onClick={() => handleSelectVehicle(entry)}
                    >
                      Process
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : null}

      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="body1" fontWeight="bold">
          Overnight Policy
        </Typography>
        <Typography variant="body2">
          Vehicles parked for more than 8 hours are considered overnight.
          Special overnight rates will be applied automatically.
        </Typography>
      </Alert>
    </Paper>
  );
};

export default OvernightProcessor; 