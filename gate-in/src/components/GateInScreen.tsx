import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Container,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  SelectChangeEvent,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { PhotoCamera, Edit } from '@mui/icons-material';
import { parkingApi, VehicleEntry } from '../services/api';
import { validateLicensePlate, formatLicensePlate } from '../utils/validation';
import { RecentEntries } from './RecentEntries';
import { useKeyboardShortcuts } from '../utils/shortcuts';
import { WebcamCapture } from './WebcamCapture';
import socketService from '../services/socketService';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  margin: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
}));

const MAX_RECENT_ENTRIES = 5;

const SHORTCUTS_HELP = `
Keyboard Shortcuts:
• Ctrl/Cmd + Enter: Submit entry
• Ctrl/Cmd + L: Clear form
• Alt + P: Focus plate number
• Alt + 1: Select Car
• Alt + 2: Select Motorcycle
• Alt + 3: Select Truck
• Alt + C: Toggle camera mode
`.trim();

export const GateInScreen: React.FC = () => {
  const [plateNumber, setPlateNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('car');
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recentEntries, setRecentEntries] = useState<VehicleEntry[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<'manual' | 'camera'>('manual');
  const plateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load recent entries from localStorage on component mount
    const savedEntries = localStorage.getItem('recentEntries');
    if (savedEntries) {
      setRecentEntries(JSON.parse(savedEntries));
    }

    // Simulate gate status update for initial connection
    socketService.updateGateStatus('entry-gate-1', 'closed');
  }, []);

  const updateRecentEntries = (newEntry: VehicleEntry) => {
    const updatedEntries = [newEntry, ...recentEntries].slice(0, MAX_RECENT_ENTRIES);
    setRecentEntries(updatedEntries);
    localStorage.setItem('recentEntries', JSON.stringify(updatedEntries));
  };

  const handlePlateNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatLicensePlate(e.target.value);
    setPlateNumber(formatted);
    
    if (formatted && !validateLicensePlate(formatted)) {
      setValidationError('Invalid license plate format');
    } else {
      setValidationError(null);
    }
  };

  const handleCameraCapture = (detectedPlate: string, confidence: number, imageSrc: string) => {
    setPlateNumber(detectedPlate);
    setValidationError(null);
    setInputMode('manual'); // Switch to manual mode after capture
  };

  const clearForm = () => {
    setPlateNumber('');
    setVehicleType('car');
    setValidationError(null);
    setError(null);
  };

  const handleSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    
    if (!validateLicensePlate(plateNumber)) {
      setValidationError('Invalid license plate format');
      return;
    }
    
    setIsSubmitting(true);
    setValidationError(null);
    
    try {
      const entry: VehicleEntry = {
        plateNumber: plateNumber.toUpperCase(),
        vehicleType,
        entryTime: new Date().toISOString(),
      };
      
      const response = await parkingApi.recordEntry(entry);
      
      if (response.success) {
        // Notify about vehicle entry through socket
        socketService.notifyVehicleEntry({
          ticketId: `TICKET-${Date.now()}`,
          licensePlate: entry.plateNumber,
          vehicleType: entry.vehicleType,
          entryTime: entry.entryTime
        });
        
        // Simulate gate opening
        socketService.updateGateStatus('entry-gate-1', 'open');
        
        // After 5 seconds, close the gate
        setTimeout(() => {
          socketService.updateGateStatus('entry-gate-1', 'closed');
        }, 5000);
        
        updateRecentEntries(entry);
        setShowSuccess(true);
        clearForm();
      } else {
        setError(response.error || 'Failed to process vehicle entry');
      }
    } catch (err) {
      setError('Failed to process vehicle entry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVehicleTypeChange = (event: SelectChangeEvent) => {
    setVehicleType(event.target.value as string);
  };

  const toggleInputMode = () => {
    setInputMode(prev => prev === 'manual' ? 'camera' : 'manual');
  };

  useKeyboardShortcuts({
    onSubmit: () => !isSubmitting && handleSubmit(),
    onClear: clearForm,
    onFocusPlate: () => {
      if (inputMode === 'manual') {
        plateInputRef.current?.focus();
      }
    },
    onVehicleType: setVehicleType,
  });

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Parking Gate Entry
        </Typography>
        
        <Tooltip title={SHORTCUTS_HELP} placement="left-start">
          <Typography
            variant="body2"
            color="textSecondary"
            sx={{ mb: 2, cursor: 'help' }}
          >
            💡 Hover to see keyboard shortcuts
          </Typography>
        </Tooltip>

        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
          <ToggleButtonGroup
            value={inputMode}
            exclusive
            onChange={() => toggleInputMode()}
            aria-label="input mode"
          >
            <ToggleButton value="manual" aria-label="manual input">
              <Edit />
            </ToggleButton>
            <ToggleButton value="camera" aria-label="camera input">
              <PhotoCamera />
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
        
        {inputMode === 'camera' ? (
          <WebcamCapture onPlateDetected={handleCameraCapture} autoDetect={false} />
        ) : (
          <StyledPaper elevation={3}>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="License Plate Number"
                    value={plateNumber}
                    onChange={handlePlateNumberChange}
                    error={!!validationError}
                    helperText={validationError}
                    required
                    variant="outlined"
                    inputProps={{ style: { textTransform: 'uppercase' } }}
                    disabled={isSubmitting}
                    inputRef={plateInputRef}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Vehicle Type</InputLabel>
                    <Select
                      value={vehicleType}
                      label="Vehicle Type"
                      onChange={handleVehicleTypeChange}
                      disabled={isSubmitting}
                    >
                      <MenuItem value="car">Car</MenuItem>
                      <MenuItem value="motorcycle">Motorcycle</MenuItem>
                      <MenuItem value="truck">Truck</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    fullWidth
                    size="large"
                    disabled={isSubmitting || !!validationError}
                  >
                    {isSubmitting ? 'Processing...' : 'Record Entry'}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </StyledPaper>
        )}
        
        <RecentEntries entries={recentEntries} />
        
        <Snackbar
          open={showSuccess}
          autoHideDuration={3000}
          onClose={() => setShowSuccess(false)}
        >
          <Alert severity="success" onClose={() => setShowSuccess(false)}>
            Vehicle entry recorded successfully!
          </Alert>
        </Snackbar>
        
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </Box>
    </Container>
  );
}; 