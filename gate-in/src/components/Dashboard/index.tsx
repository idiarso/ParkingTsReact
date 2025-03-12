import React, { useState } from 'react';
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
  TableRow
} from '@mui/material';
import { DirectionsCar } from '@mui/icons-material';

interface VehicleEntry {
  plateNumber: string;
  vehicleType: string;
  entryTime: string;
  driverName?: string;
  driverPhone?: string;
}

const mockRecentEntries: VehicleEntry[] = [
  {
    plateNumber: 'ABC123',
    vehicleType: 'Car',
    entryTime: '2024-03-12 10:30:00',
    driverName: 'John Doe',
    driverPhone: '123-456-7890'
  },
  {
    plateNumber: 'XYZ789',
    vehicleType: 'Motorcycle',
    entryTime: '2024-03-12 10:25:00'
  }
];

const GateInDashboard: React.FC = () => {
  const [formData, setFormData] = useState<VehicleEntry>({
    plateNumber: '',
    vehicleType: '',
    entryTime: new Date().toISOString(),
    driverName: '',
    driverPhone: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log('Form submitted:', formData);
    // Reset form
    setFormData({
      plateNumber: '',
      vehicleType: '',
      entryTime: new Date().toISOString(),
      driverName: '',
      driverPhone: ''
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name as string]: value
    }));
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <DirectionsCar /> Gate Entry
      </Typography>

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
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Driver Phone"
                name="driverPhone"
                value={formData.driverPhone}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                sx={{ mt: 2 }}
              >
                Record Entry
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>

      {/* Recent Entries Table */}
      <Paper sx={{ p: 3 }} elevation={2}>
        <Typography variant="h6" gutterBottom>
          Recent Entries
        </Typography>
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
              {mockRecentEntries.map((entry, index) => (
                <TableRow key={index}>
                  <TableCell>{entry.plateNumber}</TableCell>
                  <TableCell>{entry.vehicleType}</TableCell>
                  <TableCell>{entry.entryTime}</TableCell>
                  <TableCell>{entry.driverName || '-'}</TableCell>
                  <TableCell>{entry.driverPhone || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default GateInDashboard; 