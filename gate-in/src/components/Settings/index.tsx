import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Switch,
  FormControlLabel,
  FormGroup,
  TextField,
  Button,
  Divider,
  Alert,
  Snackbar,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  SelectChangeEvent
} from '@mui/material';
import { Save } from '@mui/icons-material';

interface SystemSettings {
  autoDetection: boolean;
  detectionInterval: number;
  notificationEnabled: boolean;
  captureMode: 'auto' | 'manual';
  imageQuality: number;
  storageRetention: number;
}

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings>({
    autoDetection: true,
    detectionInterval: 1000,
    notificationEnabled: true,
    captureMode: 'auto',
    imageQuality: 90,
    storageRetention: 30
  });

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked, type } = event.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSelectChange = (event: SelectChangeEvent) => {
    const { name, value } = event.target;
    if (name) {
      setSettings(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSave = async () => {
    try {
      // TODO: Implement API call to save settings
      setSnackbar({
        open: true,
        message: 'Settings saved successfully',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to save settings',
        severity: 'error'
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({
      ...prev,
      open: false
    }));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        System Settings
      </Typography>

      <Paper sx={{ p: 3, mt: 2 }}>
        <Typography variant="h6" gutterBottom>
          Detection Settings
        </Typography>
        <FormGroup>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.autoDetection}
                    onChange={handleChange}
                    name="autoDetection"
                  />
                }
                label="Enable Automatic Detection"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Detection Interval (ms)"
                name="detectionInterval"
                value={settings.detectionInterval}
                onChange={handleChange}
                disabled={!settings.autoDetection}
                InputProps={{ inputProps: { min: 500, max: 5000 } }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Capture Mode</InputLabel>
                <Select
                  name="captureMode"
                  value={settings.captureMode}
                  label="Capture Mode"
                  onChange={handleSelectChange}
                >
                  <MenuItem value="auto">Automatic</MenuItem>
                  <MenuItem value="manual">Manual</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </FormGroup>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom>
          Image Settings
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="number"
              label="Image Quality (%)"
              name="imageQuality"
              value={settings.imageQuality}
              onChange={handleChange}
              InputProps={{ inputProps: { min: 1, max: 100 } }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="number"
              label="Storage Retention (days)"
              name="storageRetention"
              value={settings.storageRetention}
              onChange={handleChange}
              InputProps={{ inputProps: { min: 1 } }}
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom>
          Notification Settings
        </Typography>
        <FormGroup>
          <FormControlLabel
            control={
              <Switch
                checked={settings.notificationEnabled}
                onChange={handleChange}
                name="notificationEnabled"
              />
            }
            label="Enable Notifications"
          />
        </FormGroup>

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleSave}
          >
            Save Settings
          </Button>
        </Box>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Settings; 