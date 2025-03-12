import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ThunkDispatch } from '@reduxjs/toolkit';
import { AnyAction } from 'redux';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import { TimePicker } from '@mui/x-date-pickers';
import DeleteIcon from '@mui/icons-material/Delete';
import { loadSettings, updateSettings } from '../store/actions/settings';
import { RootState } from '../store/reducers';
import { Settings as SettingsType, ParkingRate } from '../types/settings';

type AppDispatch = ThunkDispatch<RootState, unknown, AnyAction>;

export default function Settings() {
  const dispatch = useDispatch<AppDispatch>();
  const { settings, loading, error } = useSelector((state: RootState) => state.settings);
  const [localSettings, setLocalSettings] = useState<SettingsType | null>(null);

  useEffect(() => {
    void dispatch(loadSettings());
  }, [dispatch]);

  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  const handleParkingRateChange = (index: number, field: keyof ParkingRate, value: string) => {
    if (!localSettings) return;

    const updatedRates = [...localSettings.parkingRates];
    if (field === 'vehicleType') {
      updatedRates[index] = { ...updatedRates[index], [field]: value };
    } else {
      const numValue = parseFloat(value) || 0;
      updatedRates[index] = { ...updatedRates[index], [field]: numValue };
    }

    setLocalSettings({ ...localSettings, parkingRates: updatedRates });
  };

  const handleAddRate = () => {
    if (!localSettings) return;

    const newRate = {
      vehicleType: '',
      baseRate: 0,
      hourlyRate: 0
    };

    setLocalSettings({
      ...localSettings,
      parkingRates: [...localSettings.parkingRates, newRate]
    });
  };

  const handleDeleteRate = (index: number) => {
    if (!localSettings) return;

    const updatedRates = localSettings.parkingRates.filter((_: ParkingRate, i: number) => i !== index);
    setLocalSettings({ ...localSettings, parkingRates: updatedRates });
  };

  const handleTimeChange = (time: Date | null, field: 'openingTime' | 'closingTime') => {
    if (!localSettings || !time) return;

    const formattedTime = time.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    setLocalSettings({ ...localSettings, [field]: formattedTime });
  };

  const handleSave = async () => {
    if (!localSettings) return;
    void dispatch(updateSettings(localSettings));
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!localSettings) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">Failed to load settings</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Paper sx={{ p: 2 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          Parking Settings
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TimePicker
              label="Opening Time"
              value={localSettings.openingTime ? new Date(`2000-01-01T${localSettings.openingTime}`) : null}
              onChange={(time) => handleTimeChange(time, 'openingTime')}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TimePicker
              label="Closing Time"
              value={localSettings.closingTime ? new Date(`2000-01-01T${localSettings.closingTime}`) : null}
              onChange={(time) => handleTimeChange(time, 'closingTime')}
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" sx={{ mb: 2 }}>
          Parking Rates
        </Typography>

        {localSettings.parkingRates.map((rate, index) => (
          <Grid container key={index} spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Vehicle Type"
                value={rate.vehicleType}
                onChange={(e) => handleParkingRateChange(index, 'vehicleType', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                type="number"
                label="Base Rate"
                value={rate.baseRate.toString()}
                onChange={(e) => handleParkingRateChange(index, 'baseRate', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                type="number"
                label="Hourly Rate"
                value={rate.hourlyRate.toString()}
                onChange={(e) => handleParkingRateChange(index, 'hourlyRate', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <IconButton onClick={() => handleDeleteRate(index)} color="error">
                <DeleteIcon />
              </IconButton>
            </Grid>
          </Grid>
        ))}

        <Button variant="outlined" onClick={handleAddRate} sx={{ mt: 2 }}>
          Add Rate
        </Button>

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="contained" onClick={handleSave} disabled={loading}>
            Save Changes
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </Paper>
    </Box>
  );
} 