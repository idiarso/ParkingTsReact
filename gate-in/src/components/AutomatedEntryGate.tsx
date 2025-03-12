import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  Chip,
  CircularProgress
} from '@mui/material';
import { green, red, orange } from '@mui/material/colors';
import { Check, Warning, Error as ErrorIcon, DirectionsCar } from '@mui/icons-material';
import { WebcamCapture } from './WebcamCapture';
import socketService from '../services/socketService';
import dbService, { VehicleEntry } from '../services/dbService';

// Helper function to replace date-fns
const formatDate = (date: Date, formatString: string): string => {
  // Simple implementation to replace date-fns format function
  const pad = (num: number) => num.toString().padStart(2, '0');
  
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  
  // Basic format replacements
  return formatString
    .replace('yyyy', year.toString())
    .replace('MM', month)
    .replace('dd', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
};

// Vehicle types
const VEHICLE_TYPES = ['CAR', 'MOTORCYCLE', 'TRUCK', 'BUS'];

const AutomatedEntryGate: React.FC = () => {
  // State variables
  const [isConnected, setIsConnected] = useState(false);
  const [lastProcessedPlate, setLastProcessedPlate] = useState<string | null>(null);
  const [processedVehicles, setProcessedVehicles] = useState<VehicleEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize services
  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      try {
        // Initialize database
        await dbService.init();
        
        // Connect to socket
        socketService.connect();
        setIsConnected(socketService.isConnected());
        
        // Load recent entries
        const entries = await dbService.getVehicleEntries();
        setProcessedVehicles(entries.slice(-10).reverse()); // Get latest 10 entries
      } catch (err) {
        setError('Failed to initialize services');
        console.error('Initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initialize();

    // Set up socket connection listeners
    const connectionListener = (connected: boolean) => {
      setIsConnected(connected);
      if (!connected) {
        setError('Socket connection lost. Reconnecting...');
      } else {
        setError(null);
      }
    };

    socketService.onConnectionChange(connectionListener);

    // Cleanup on component unmount
    return () => {
      socketService.disconnect();
    };
  }, []);

  // Detect license plate
  const handleLicensePlateDetected = async (plate: string, confidence: number, imageSrc: string) => {
    if (confidence < 75) {
      console.log(`Low confidence detection (${confidence}%), skipping...`);
      return;
    }

    try {
      // Check if this is a recent duplicate to avoid processing the same vehicle multiple times
      if (lastProcessedPlate === plate) {
        const timeSinceLastProcessed = Date.now() - processedVehicles[0]?.entryTime;
        if (timeSinceLastProcessed < 10000) { // 10 seconds
          console.log('Duplicate license plate detected, skipping...');
          return;
        }
      }

      // Determine vehicle type based on historical data or random for new vehicles
      let vehicleType = VEHICLE_TYPES[Math.floor(Math.random() * VEHICLE_TYPES.length)];
      
      // Check for historical entries with this license plate
      const historicalEntries = await dbService.getEntriesByLicensePlate(plate);
      if (historicalEntries.length > 0) {
        // Use the most common vehicle type from history
        const typeCounts = historicalEntries.reduce((acc, entry) => {
          acc[entry.vehicleType] = (acc[entry.vehicleType] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        // Find the most frequent vehicle type
        let maxCount = 0;
        Object.entries(typeCounts).forEach(([type, count]) => {
          if (count > maxCount) {
            vehicleType = type;
            maxCount = count;
          }
        });
      }

      // Generate ticket ID (format: YYYYMMDD-HHMMSS-XXXX)
      const now = new Date();
      const datePart = formatDate(now, 'yyyyMMdd');
      const timePart = formatDate(now, 'HHmmss');
      const randomPart = Math.floor(1000 + Math.random() * 9000);
      const ticketId = `${datePart}-${timePart}-${randomPart}`;

      // Create entry record
      const newEntry: Omit<VehicleEntry, 'id'> = {
        ticketId,
        licensePlate: plate,
        vehicleType,
        entryTime: now.getTime(),
        image: imageSrc,
        processed: true
      };

      // Save to database
      const savedEntry = await dbService.addVehicleEntry(newEntry);
      
      // Update UI state
      setLastProcessedPlate(plate);
      setProcessedVehicles(prev => [savedEntry, ...prev.slice(0, 9)]);
      
      // Notify socket server
      socketService.notifyVehicleEntry({
        ticketId,
        licensePlate: plate,
        vehicleType,
        entryTime: now.toISOString()
      });

      // Update gate status (simulate gate opening)
      socketService.updateGateStatus('gate-in', 'open');
      
      // After a delay, close the gate
      setTimeout(() => {
        socketService.updateGateStatus('gate-in', 'closed');
      }, 5000);
      
    } catch (err) {
      console.error('Error processing vehicle entry:', err);
      setError('Failed to process vehicle entry');
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Initializing automated entry system...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Automated Entry Gate
      </Typography>
      
      {/* Connection status */}
      <Box sx={{ mb: 3 }}>
        {isConnected ? (
          <Alert 
            icon={<Check fontSize="inherit" />} 
            severity="success"
            sx={{ mb: 2 }}
          >
            Connected to server
          </Alert>
        ) : (
          <Alert 
            icon={<Warning fontSize="inherit" />} 
            severity="warning"
            sx={{ mb: 2 }}
          >
            Not connected to server - entries will be stored locally
          </Alert>
        )}
        
        {error && (
          <Alert 
            icon={<ErrorIcon fontSize="inherit" />} 
            severity="error"
            sx={{ mb: 2 }}
          >
            {error}
          </Alert>
        )}
      </Box>
      
      <Grid container spacing={3}>
        {/* Left column - Camera */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              License Plate Detection Camera
            </Typography>
            <WebcamCapture 
              onPlateDetected={handleLicensePlateDetected}
              autoDetect={true}
            />
          </Paper>
        </Grid>
        
        {/* Right column - Latest processed entry */}
        <Grid item xs={12} md={6}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card elevation={3}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Latest Entry
                  </Typography>
                  
                  {processedVehicles.length > 0 ? (
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <DirectionsCar sx={{ fontSize: 40, mr: 2, color: green[500] }} />
                        <Typography variant="h5">
                          {processedVehicles[0].licensePlate}
                        </Typography>
                      </Box>
                      
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="textSecondary">
                            Ticket ID
                          </Typography>
                          <Typography variant="body1">
                            {processedVehicles[0].ticketId}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="textSecondary">
                            Vehicle Type
                          </Typography>
                          <Chip 
                            label={processedVehicles[0].vehicleType} 
                            color="primary" 
                            size="small" 
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="body2" color="textSecondary">
                            Entry Time
                          </Typography>
                          <Typography variant="body1">
                            {formatDate(new Date(processedVehicles[0].entryTime), 'yyyy-MM-dd HH:mm:ss')}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Box>
                  ) : (
                    <Typography variant="body1" color="textSecondary">
                      No vehicles processed yet
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
            
            {/* Recent entries */}
            <Grid item xs={12}>
              <TableContainer component={Paper} elevation={3}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>License Plate</TableCell>
                      <TableCell>Ticket ID</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Time</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {processedVehicles.slice(1).map((vehicle) => (
                      <TableRow key={vehicle.id}>
                        <TableCell>{vehicle.licensePlate}</TableCell>
                        <TableCell>{vehicle.ticketId}</TableCell>
                        <TableCell>
                          <Chip 
                            label={vehicle.vehicleType} 
                            size="small" 
                            color="primary" 
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          {formatDate(new Date(vehicle.entryTime), 'HH:mm:ss')}
                        </TableCell>
                      </TableRow>
                    ))}
                    {processedVehicles.length <= 1 && (
                      <TableRow>
                        <TableCell colSpan={4} align="center">
                          No recent entries
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AutomatedEntryGate; 