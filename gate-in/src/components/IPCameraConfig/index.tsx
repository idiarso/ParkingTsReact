import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Switch,
  Tooltip,
  Alert,
  LinearProgress,
  SelectChangeEvent
} from '@mui/material';
import { Add, Delete, Edit, Visibility, VisibilityOff, Check } from '@mui/icons-material';
import { cameraConfigService, IPCameraConfig as CameraConfig, DEFAULT_WEBCAM } from '../../services/cameraConfig';

export const IPCameraConfig: React.FC = () => {
  const [cameras, setCameras] = useState<CameraConfig[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCamera, setEditingCamera] = useState<CameraConfig | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [testingCamera, setTestingCamera] = useState(false);
  const [testResult, setTestResult] = useState<boolean | null>(null);

  // Form state
  const [formState, setFormState] = useState<CameraConfig>({
    id: '',
    name: '',
    url: '',
    username: '',
    password: '',
    type: 'http',
    enabled: true
  });

  useEffect(() => {
    loadCameras();
  }, []);

  const loadCameras = () => {
    const configs = cameraConfigService.getConfigs();
    setCameras(configs);
  };

  const handleAddNew = () => {
    setEditingCamera(null);
    setFormState({
      id: `camera-${Date.now()}`,
      name: '',
      url: '',
      username: '',
      password: '',
      type: 'http',
      enabled: true
    });
    setDialogOpen(true);
    setTestResult(null);
  };

  const handleEdit = (camera: CameraConfig) => {
    setEditingCamera(camera);
    setFormState({ ...camera });
    setDialogOpen(true);
    setTestResult(null);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this camera?')) {
      cameraConfigService.deleteConfig(id);
      loadCameras();
    }
  };

  const handleSubmit = () => {
    // Basic validation
    if (!formState.name.trim() || !formState.url.trim()) {
      alert('Camera name and URL are required');
      return;
    }

    if (editingCamera) {
      cameraConfigService.updateConfig(formState);
    } else {
      cameraConfigService.addConfig(formState);
    }

    setDialogOpen(false);
    loadCameras();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const name = e.target.name as string;
    const value = e.target.value as string;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const toggleCameraEnabled = (id: string, currentStatus: boolean) => {
    const camera = cameras.find(c => c.id === id);
    if (camera) {
      const updated = { ...camera, enabled: !currentStatus };
      cameraConfigService.updateConfig(updated);
      loadCameras();
    }
  };

  const testCamera = async () => {
    setTestingCamera(true);
    setTestResult(null);
    
    try {
      const result = await cameraConfigService.testCamera(formState);
      setTestResult(result);
    } catch (err) {
      setTestResult(false);
      console.error('Camera test failed:', err);
    } finally {
      setTestingCamera(false);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5">IP Camera Management</Typography>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<Add />}
            onClick={handleAddNew}
          >
            Add Camera
          </Button>
        </Box>

        {cameras.length === 0 ? (
          <Typography variant="body1" color="textSecondary" sx={{ textAlign: 'center', my: 4 }}>
            No IP cameras configured. Click 'Add Camera' to configure one.
          </Typography>
        ) : (
          <List>
            {/* Always show the default webcam first */}
            <ListItem divider>
              <ListItemText 
                primary={DEFAULT_WEBCAM.name} 
                secondary="Default device (built-in webcam)"
              />
              <ListItemSecondaryAction>
                <Switch 
                  edge="end"
                  checked={true}
                  disabled
                />
              </ListItemSecondaryAction>
            </ListItem>
            
            {cameras.map((camera) => (
              <ListItem key={camera.id} divider>
                <ListItemText 
                  primary={camera.name} 
                  secondary={
                    <>
                      <Typography component="span" variant="body2" color="textSecondary">
                        {camera.url} • {camera.type.toUpperCase()}
                      </Typography>
                      {camera.username && (
                        <Typography component="span" variant="body2" color="textSecondary" sx={{ ml: 1 }}>
                          • Auth: {camera.username}
                        </Typography>
                      )}
                    </>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton edge="end" onClick={() => handleEdit(camera)} sx={{ mr: 1 }}>
                    <Edit />
                  </IconButton>
                  <IconButton edge="end" onClick={() => handleDelete(camera.id)} sx={{ mr: 1 }}>
                    <Delete />
                  </IconButton>
                  <Switch 
                    edge="end"
                    checked={camera.enabled}
                    onChange={() => toggleCameraEnabled(camera.id, camera.enabled)}
                  />
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}
      </Paper>

      {/* Add/Edit Camera Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingCamera ? 'Edit Camera' : 'Add New IP Camera'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Camera Name"
                name="name"
                value={formState.name}
                onChange={handleInputChange}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                label="Camera URL"
                name="url"
                value={formState.url}
                onChange={handleInputChange}
                required
                placeholder="http://camera-ip:port/video"
                helperText="Example: http://192.168.1.100:8080/video or rtsp://192.168.1.100:554/stream"
              />
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Camera Type</InputLabel>
                <Select
                  name="type"
                  value={formState.type}
                  label="Camera Type"
                  onChange={handleSelectChange}
                >
                  <MenuItem value="http">HTTP (JPEG/PNG)</MenuItem>
                  <MenuItem value="mjpeg">MJPEG Stream</MenuItem>
                  <MenuItem value="rtsp">RTSP Stream</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Username"
                name="username"
                value={formState.username}
                onChange={handleInputChange}
                placeholder="(Optional)"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formState.password}
                onChange={handleInputChange}
                placeholder="(Optional)"
                InputProps={{
                  endAdornment: (
                    <IconButton 
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  )
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControl component="fieldset">
                <Grid container alignItems="center">
                  <Grid item>
                    <Switch
                      checked={formState.enabled}
                      onChange={(e) => setFormState(prev => ({ ...prev, enabled: e.target.checked }))}
                      name="enabled"
                    />
                  </Grid>
                  <Grid item>
                    <Typography variant="body2">
                      Enabled
                    </Typography>
                  </Grid>
                </Grid>
              </FormControl>
            </Grid>
            
            {testResult !== null && (
              <Grid item xs={12}>
                <Alert severity={testResult ? "success" : "error"}>
                  {testResult 
                    ? "Camera connection successful!" 
                    : "Failed to connect to camera. Please check URL and credentials."}
                </Alert>
              </Grid>
            )}
            
            {testingCamera && (
              <Grid item xs={12}>
                <LinearProgress />
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button 
            onClick={testCamera} 
            color="secondary"
            disabled={testingCamera || !formState.url}
          >
            Test Connection
          </Button>
          <Button 
            onClick={handleSubmit} 
            color="primary" 
            variant="contained"
            startIcon={<Check />}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}; 