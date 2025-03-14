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
  IconButton,
  InputAdornment,
  CircularProgress
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { PhotoCamera } from '@mui/icons-material';
import { parkingApi, VehicleEntry as ApiVehicleEntry } from '../services/api';
import { VehicleEntry as DbVehicleEntry } from '../services/dbService';
import { validateLicensePlate, formatLicensePlate } from '../utils/validation';
import { RecentEntries } from './RecentEntries';
import { useKeyboardShortcuts } from '../utils/shortcuts';
import socketService from '../services/socketService';
import { useNavigate } from 'react-router-dom';

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
  const [driverName, setDriverName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recentEntries, setRecentEntries] = useState<ApiVehicleEntry[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<'manual' | 'camera'>('manual');
  const plateInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Load recent entries from localStorage on component mount
    const savedEntries = localStorage.getItem('recentEntries');
    if (savedEntries) {
      setRecentEntries(JSON.parse(savedEntries));
    }

    // Simulate gate status update for initial connection
    socketService.updateGateStatus('entry-gate-1', 'closed');
  }, []);

  const updateRecentEntries = (newEntry: ApiVehicleEntry) => {
    console.log("Updating recent entries with new entry:", newEntry);
    const updatedEntries = [newEntry, ...recentEntries].slice(0, MAX_RECENT_ENTRIES);
    setRecentEntries(updatedEntries);
    
    // Make sure we're storing properly in localStorage
    try {
      localStorage.setItem('recentEntries', JSON.stringify(updatedEntries));
      console.log(`Recent entries updated successfully, now have ${updatedEntries.length} entries`);
    } catch (err) {
      console.error("Error saving recent entries to localStorage:", err);
    }
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

  const handleDriverNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDriverName(e.target.value);
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhoneNumber(e.target.value);
  };

  const clearForm = () => {
    setPlateNumber('');
    setVehicleType('car');
    setDriverName('');
    setPhoneNumber('');
    setValidationError(null);
    setError(null);
  };

  const handleSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    
    if (!plateNumber.trim()) {
      setValidationError('Nomor plat wajib diisi');
      return;
    }
    
    if (!validateLicensePlate(plateNumber)) {
      setValidationError('Format nomor plat tidak valid');
      return;
    }
    
    setIsSubmitting(true);
    setValidationError(null);
    
    try {
      // Get current timestamp for consistent use
      const timestamp = new Date();
      const ticketId = `T${timestamp.getFullYear()}${String(timestamp.getMonth() + 1).padStart(2, '0')}${String(timestamp.getDate()).padStart(2, '0')}${String(timestamp.getHours()).padStart(2, '0')}${String(timestamp.getMinutes()).padStart(2, '0')}${String(timestamp.getSeconds()).padStart(2, '0')}`;
      
      const entry: ApiVehicleEntry = {
        plateNumber: plateNumber.toUpperCase(),
        vehicleType,
        entryTime: timestamp.toISOString(),
        ticketId: ticketId,
        driverName: driverName.trim() || undefined,
        phoneNumber: phoneNumber.trim() || undefined
      };
      
      // Simpan data tiket untuk digunakan halaman preview - PENTING! Simpan sebelum navigasi
      console.log("Menyimpan data tiket di localStorage:", entry);
      localStorage.setItem('lastTicketData', JSON.stringify(entry));
      
      // Always store locally first to ensure data is not lost
      const localEntry = {...entry};
      updateRecentEntries(localEntry);
      
      // Store in browser's localStorage as backup
      const offlineEntries = JSON.parse(localStorage.getItem('offlineVehicleEntries') || '[]');
      offlineEntries.push(entry);
      localStorage.setItem('offlineVehicleEntries', JSON.stringify(offlineEntries));
      
      // Try to send to API
      try {
        const response = await parkingApi.recordEntry(entry);
        
        if (!response.success) {
          console.warn('API submission failed, but data is saved locally:', response.error);
          setError('Server tidak menyimpan data, tetapi data sudah disimpan secara lokal.');
        }
      } catch (apiErr) {
        console.error('API error, falling back to local storage:', apiErr);
        setError('Tidak dapat terhubung ke server, tetapi data sudah disimpan secara lokal.');
      }
      
      // Notify about vehicle entry through socket (if online)
      socketService.notifyVehicleEntry({
        ticketId: ticketId,
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
      
      setShowSuccess(true);
      
      // Clear form AFTER ensuring data is saved
      clearForm();
      
      // Verify data is in localStorage before navigating
      console.log("Data tiket tersimpan?", localStorage.getItem('lastTicketData'));
      
      // Navigate using react-router instead of location.href
      navigate('/ticket-preview');
      
    } catch (err) {
      console.error('Error during submission:', err);
      setError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVehicleTypeChange = (event: SelectChangeEvent) => {
    setVehicleType(event.target.value as string);
  };

  const toggleInputMode = () => {
    setInputMode(prev => {
      const newMode = prev === 'manual' ? 'camera' : 'manual';
      console.log(`Switching input mode from ${prev} to ${newMode}`);
      return newMode;
    });
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

  // Convert API VehicleEntry to DB VehicleEntry format for RecentEntries component
  const convertToDbFormat = (entries: ApiVehicleEntry[]): DbVehicleEntry[] => {
    return entries.map(entry => ({
      id: entry.entryTime, // Use entryTime as a unique ID
      ticketId: `TICKET-${entry.entryTime}`,
      licensePlate: entry.plateNumber,
      vehicleType: entry.vehicleType,
      entryTime: new Date(entry.entryTime).getTime(),
      processed: true,
      image: undefined
    }));
  };

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
        
        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 3 }}
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}
        
        {showSuccess && (
          <Snackbar
            open={showSuccess}
            autoHideDuration={5000}
            onClose={() => setShowSuccess(false)}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          >
            <Alert onClose={() => setShowSuccess(false)} severity="success" sx={{ width: '100%' }}>
              Data kendaraan berhasil tercatat! Silahkan periksa halaman cetak tiket.
            </Alert>
          </Snackbar>
        )}
        
        <StyledPaper>
          {inputMode === 'camera' ? (
            <Box>
              <Typography variant="h6" gutterBottom>
                Mode Kamera (Simulasi)
              </Typography>
              <Box 
                sx={{ 
                  width: '100%', 
                  maxWidth: '500px', 
                  height: '300px', 
                  backgroundColor: '#111',
                  margin: '0 auto 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  borderRadius: 1,
                  overflow: 'hidden'
                }}
              >
                <Typography 
                  color="white" 
                  sx={{ position: 'absolute', top: 10, left: 10, fontSize: '0.8rem', backgroundColor: 'rgba(0,0,0,0.5)', padding: '2px 8px', borderRadius: 1 }}
                >
                  <Box component="span" sx={{ 
                    display: 'inline-block', 
                    width: 8, 
                    height: 8, 
                    borderRadius: '50%', 
                    backgroundColor: '#f44336',
                    marginRight: 1,
                    animation: 'pulse 1.5s infinite',
                    '@keyframes pulse': {
                      '0%': { opacity: 1 },
                      '50%': { opacity: 0.5 },
                      '100%': { opacity: 1 },
                    }
                  }}></Box>
                  LIVE
                </Typography>
                <Box sx={{ 
                  width: '70%', 
                  height: '25%', 
                  border: '2px dashed white',
                  position: 'absolute'
                }}></Box>
                <Button 
                  variant="contained" 
                  color="primary"
                  sx={{ position: 'absolute', bottom: 16 }}
                  onClick={() => {
                    // Simulasi deteksi plat nomor
                    const samplePlates = ['B1234AB', 'D5678CD', 'F9012EF', 'A2468BD', 'H1357IJ'];
                    const randomPlate = samplePlates[Math.floor(Math.random() * samplePlates.length)];
                    setPlateNumber(randomPlate);
                    setInputMode('manual');
                    
                    // Notifikasi pengguna
                    setShowSuccess(true);
                  }}
                >
                  <PhotoCamera sx={{ mr: 1 }} /> Ambil Gambar
                </Button>
              </Box>
              <Box sx={{ textAlign: 'center', mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Posisikan plat nomor dalam kotak dan tekan tombol "Ambil Gambar"
                </Typography>
                <Button 
                  variant="outlined" 
                  color="secondary" 
                  onClick={() => setInputMode('manual')}
                  sx={{ mt: 1 }}
                >
                  Kembali ke Input Manual
                </Button>
              </Box>
            </Box>
          ) : (
            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Data Kendaraan Masuk
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    id="plateNumber"
                    name="plateNumber"
                    label="Nomor Plat"
                    value={plateNumber}
                    onChange={handlePlateNumberChange}
                    inputRef={plateInputRef}
                    error={!!validationError}
                    helperText={validationError || "Masukkan nomor plat kendaraan"}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={toggleInputMode}
                            edge="end"
                            color={inputMode === ('camera' as 'manual' | 'camera') ? 'primary' : 'default'}
                          >
                            <PhotoCamera />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    disabled={inputMode === ('camera' as 'manual' | 'camera') || isSubmitting}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <FormControl fullWidth disabled={isSubmitting}>
                    <InputLabel id="vehicle-type-label">Jenis Kendaraan *</InputLabel>
                    <Select
                      labelId="vehicle-type-label"
                      id="vehicleType"
                      value={vehicleType}
                      label="Jenis Kendaraan *"
                      onChange={handleVehicleTypeChange}
                    >
                      <MenuItem value="car">Mobil</MenuItem>
                      <MenuItem value="motorcycle">Motor</MenuItem>
                      <MenuItem value="truck">Truk</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    id="driverName"
                    name="driverName"
                    label="Nama Pengemudi (Opsional)"
                    value={driverName}
                    onChange={handleDriverNameChange}
                    disabled={isSubmitting}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    id="phoneNumber"
                    name="phoneNumber"
                    label="Nomor Telepon (Opsional)"
                    value={phoneNumber}
                    onChange={handlePhoneNumberChange}
                    disabled={isSubmitting}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                    <Button
                      variant="outlined"
                      color="secondary"
                      onClick={clearForm}
                      disabled={isSubmitting}
                    >
                      Reset
                    </Button>
                    
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      disabled={isSubmitting || !!validationError}
                      startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
                      size="large"
                    >
                      {isSubmitting ? 'Processing...' : 'PROSES MASUK'}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </form>
          )}
        </StyledPaper>
        
        <RecentEntries entries={convertToDbFormat(recentEntries)} />
      </Box>
    </Container>
  );
}; 