import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  Container,
  Grid,
  Paper,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledCard = styled(Card)(({ theme }) => ({
  marginTop: theme.spacing(4),
  padding: theme.spacing(3),
}));

const StyledButton = styled(Button)(({ theme }) => ({
  margin: theme.spacing(2, 0),
}));

interface EntryFormData {
  plateNumber: string;
  vehicleType: string;
}

const EntryGate: React.FC = () => {
  const [formData, setFormData] = useState<EntryFormData>({
    plateNumber: '',
    vehicleType: '',
  });
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // TODO: Implement API call to backend
      const response = await fetch('http://localhost:5000/api/parking/entry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to record entry');
      }

      const data = await response.json();
      setSnackbar({
        open: true,
        message: 'Vehicle entry recorded successfully',
        severity: 'success'
      });

      // Reset form
      setFormData({
        plateNumber: '',
        vehicleType: '',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to record vehicle entry',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Parking Entry Gate
        </Typography>

        <StyledCard>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="License Plate Number"
                    name="plateNumber"
                    value={formData.plateNumber}
                    onChange={handleInputChange}
                    required
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Vehicle Type"
                    name="vehicleType"
                    value={formData.vehicleType}
                    onChange={handleInputChange}
                    required
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12}>
                  <StyledButton
                    fullWidth
                    variant="contained"
                    color="primary"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Record Entry'}
                  </StyledButton>
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </StyledCard>

        <Paper sx={{ mt: 4, p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Recent Entries
          </Typography>
          {/* TODO: Add recent entries list component */}
        </Paper>
      </Box>

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
    </Container>
  );
};

export default EntryGate; 