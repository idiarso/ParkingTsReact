import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Divider,
  Alert,
  CircularProgress,
  Card,
  CardContent
} from '@mui/material';
import {
  Search,
  Warning,
  DirectionsCar,
  Receipt
} from '@mui/icons-material';
import dbService from '../services/dbService';
import { VehicleEntry } from '../services/paymentService';

interface LostTicketProcessorProps {
  onVehicleFound: (entry: VehicleEntry) => void;
}

const LostTicketProcessor: React.FC<LostTicketProcessorProps> = ({ onVehicleFound }) => {
  const [licensePlate, setLicensePlate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<VehicleEntry[]>([]);

  const handleSearch = async () => {
    if (!licensePlate.trim()) {
      setError('Please enter a license plate number');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSearchResults([]);

    try {
      // In a real implementation, this would search the database for matching entries
      // For this demo, we'll simulate a search with a timeout
      const entries = await dbService.findByLicensePlate(licensePlate.toUpperCase());
      
      if (!entries || entries.length === 0) {
        setError(`No vehicles found with license plate: ${licensePlate.toUpperCase()}`);
      } else {
        setSearchResults(entries);
      }
    } catch (err) {
      console.error('Error searching for vehicle:', err);
      setError('Failed to search for vehicle. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectVehicle = (entry: VehicleEntry) => {
    onVehicleFound({
      ...entry,
      // Add a penalty fee flag for lost tickets
      lostTicket: true
    });
  };

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" gutterBottom display="flex" alignItems="center">
          <Warning color="warning" sx={{ mr: 1 }} />
          Lost Ticket Processing
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Search for a vehicle by license plate number to process a lost ticket
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs>
            <TextField
              fullWidth
              label="License Plate Number"
              variant="outlined"
              value={licensePlate}
              onChange={(e) => setLicensePlate(e.target.value)}
              disabled={isLoading}
              placeholder="Enter license plate (e.g., B1234CD)"
            />
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSearch}
              disabled={isLoading}
              startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <Search />}
              sx={{ py: 1.5 }}
            >
              {isLoading ? 'Searching...' : 'Search'}
            </Button>
          </Grid>
        </Grid>
      </Box>

      {searchResults.length > 0 && (
        <>
          <Divider sx={{ mb: 3 }} />
          <Typography variant="h6" gutterBottom>
            Search Results
          </Typography>

          <Grid container spacing={2}>
            {searchResults.map((entry) => (
              <Grid item xs={12} key={entry.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item>
                        <DirectionsCar fontSize="large" color="primary" />
                      </Grid>
                      <Grid item xs>
                        <Typography variant="h6">
                          {entry.licensePlate}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Entry Time: {new Date(entry.entryTime).toLocaleString()}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Vehicle Type: {entry.vehicleType}
                        </Typography>
                      </Grid>
                      <Grid item>
                        <Button
                          variant="contained"
                          color="primary"
                          startIcon={<Receipt />}
                          onClick={() => handleSelectVehicle(entry)}
                        >
                          Process Exit
                        </Button>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      )}

      <Alert severity="warning" sx={{ mt: 3 }}>
        <Typography variant="body1" fontWeight="bold">
          Lost Ticket Policy
        </Typography>
        <Typography variant="body2">
          A penalty fee will be applied in addition to the parking fee for lost tickets.
          Please verify vehicle identity using entry image before processing payment.
        </Typography>
      </Alert>
    </Paper>
  );
};

export default LostTicketProcessor; 