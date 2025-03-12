import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Divider,
  CircularProgress,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Alert
} from '@mui/material';
import { 
  Print, 
  FileDownload, 
  Refresh, 
  Assessment,
  DateRange,
  AttachMoney,
  DirectionsCar
} from '@mui/icons-material';
import dbService from '../../services/dbService';
import { VehicleEntry } from '../../services/paymentService';

interface ShiftReportProps {
  onClose: () => void;
}

interface ShiftSummary {
  totalVehicles: number;
  totalRevenue: number;
  byVehicleType: Record<string, { count: number; revenue: number }>;
  byPaymentMethod: Record<string, { count: number; revenue: number }>;
}

const ShiftReport: React.FC<ShiftReportProps> = ({ onClose }) => {
  const [date, setDate] = useState<Date | null>(new Date());
  const [shift, setShift] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [transactions, setTransactions] = useState<VehicleEntry[]>([]);
  const [summary, setSummary] = useState<ShiftSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (date) {
      loadReportData();
    }
  }, [date, shift]);

  const loadReportData = async () => {
    if (!date) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      
      // Apply shift filter if not "all"
      if (shift === 'morning') {
        startDate.setHours(6, 0, 0, 0);
        endDate.setHours(14, 0, 0, 0);
      } else if (shift === 'evening') {
        startDate.setHours(14, 0, 0, 0);
        endDate.setHours(22, 0, 0, 0);
      } else if (shift === 'night') {
        startDate.setHours(22, 0, 0, 0);
        endDate.setHours(6, 0, 0, 0);
        endDate.setDate(endDate.getDate() + 1);
      }

      // In a real implementation, this would get transactions from the database
      // For this demo, we'll get completed entries and filter them
      const allTransactions = await dbService.getCompletedEntries();
      
      // Filter by date range
      const filteredTransactions = allTransactions.filter(entry => {
        const exitTime = new Date(entry.exitTime || 0);
        return exitTime >= startDate && exitTime <= endDate;
      });
      
      setTransactions(filteredTransactions);
      
      // Calculate summary
      const summaryData: ShiftSummary = {
        totalVehicles: filteredTransactions.length,
        totalRevenue: filteredTransactions.reduce((sum, entry) => sum + (entry.fee || 0), 0),
        byVehicleType: {},
        byPaymentMethod: {}
      };
      
      // Group by vehicle type
      filteredTransactions.forEach(entry => {
        // Vehicle type summary
        if (!summaryData.byVehicleType[entry.vehicleType]) {
          summaryData.byVehicleType[entry.vehicleType] = { count: 0, revenue: 0 };
        }
        summaryData.byVehicleType[entry.vehicleType].count += 1;
        summaryData.byVehicleType[entry.vehicleType].revenue += (entry.fee || 0);
        
        // Payment method summary (assuming payment method is stored)
        const paymentMethod = entry.paymentMethod || 'Cash';
        if (!summaryData.byPaymentMethod[paymentMethod]) {
          summaryData.byPaymentMethod[paymentMethod] = { count: 0, revenue: 0 };
        }
        summaryData.byPaymentMethod[paymentMethod].count += 1;
        summaryData.byPaymentMethod[paymentMethod].revenue += (entry.fee || 0);
      });
      
      setSummary(summaryData);
      
      if (filteredTransactions.length === 0) {
        setError('No transactions found for the selected date and shift');
      }
    } catch (err) {
      console.error('Error loading report data:', err);
      setError('Failed to load report data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    // In a real implementation, this would generate a CSV or Excel file
    console.log('Exporting report data');
    alert('Report export functionality would be implemented here');
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount);
  };

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" display="flex" alignItems="center">
          <Assessment color="primary" sx={{ mr: 1 }} />
          Shift Report
        </Typography>
        <Button variant="outlined" onClick={onClose}>
          Close
        </Button>
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <TextField
            label="Select Date"
            type="date"
            value={date ? date.toISOString().split('T')[0] : ''}
            onChange={(e) => setDate(new Date(e.target.value))}
            fullWidth
            InputLabelProps={{
              shrink: true,
            }}
          />
        </Grid>
        
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Shift</InputLabel>
            <Select
              value={shift}
              label="Shift"
              onChange={(e) => setShift(e.target.value)}
            >
              <MenuItem value="all">All Day</MenuItem>
              <MenuItem value="morning">Morning (6:00 - 14:00)</MenuItem>
              <MenuItem value="evening">Evening (14:00 - 22:00)</MenuItem>
              <MenuItem value="night">Night (22:00 - 06:00)</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Button
            fullWidth
            variant="contained"
            startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <Refresh />}
            onClick={loadReportData}
            disabled={isLoading || !date}
            sx={{ height: '56px' }}
          >
            {isLoading ? 'Loading...' : 'Generate Report'}
          </Button>
        </Grid>
      </Grid>
      
      {error && (
        <Alert severity="info" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {summary && (
        <>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Summary - {date?.toLocaleDateString()} - {shift === 'all' ? 'All Day' : `${shift.charAt(0).toUpperCase() + shift.slice(1)} Shift`}
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" color="primary" display="flex" alignItems="center">
                      <DirectionsCar sx={{ mr: 1 }} />
                      Total Vehicles
                    </Typography>
                    <Typography variant="h4" sx={{ mt: 2 }}>
                      {summary.totalVehicles}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" color="primary" display="flex" alignItems="center">
                      <AttachMoney sx={{ mr: 1 }} />
                      Total Revenue
                    </Typography>
                    <Typography variant="h4" sx={{ mt: 2 }}>
                      {formatCurrency(summary.totalRevenue)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" color="primary" display="flex" alignItems="center">
                      <DateRange sx={{ mr: 1 }} />
                      Report Date
                    </Typography>
                    <Typography variant="h4" sx={{ mt: 2 }}>
                      {date?.toLocaleDateString()}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
          
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                By Vehicle Type
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Vehicle Type</TableCell>
                      <TableCell align="right">Count</TableCell>
                      <TableCell align="right">Revenue</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(summary.byVehicleType).map(([type, data]) => (
                      <TableRow key={type}>
                        <TableCell>{type}</TableCell>
                        <TableCell align="right">{data.count}</TableCell>
                        <TableCell align="right">{formatCurrency(data.revenue)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                By Payment Method
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Payment Method</TableCell>
                      <TableCell align="right">Count</TableCell>
                      <TableCell align="right">Revenue</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(summary.byPaymentMethod).map(([method, data]) => (
                      <TableRow key={method}>
                        <TableCell>{method}</TableCell>
                        <TableCell align="right">{data.count}</TableCell>
                        <TableCell align="right">{formatCurrency(data.revenue)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          </Grid>
          
          <Typography variant="h6" gutterBottom>
            Transaction Details
          </Typography>
          <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>License Plate</TableCell>
                  <TableCell>Entry Time</TableCell>
                  <TableCell>Exit Time</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Vehicle Type</TableCell>
                  <TableCell align="right">Fee</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{entry.licensePlate}</TableCell>
                    <TableCell>{new Date(entry.entryTime).toLocaleString()}</TableCell>
                    <TableCell>{entry.exitTime ? new Date(entry.exitTime).toLocaleString() : '-'}</TableCell>
                    <TableCell>
                      {entry.exitTime 
                        ? `${Math.round((new Date(entry.exitTime).getTime() - new Date(entry.entryTime).getTime()) / (1000 * 60))} min` 
                        : '-'
                      }
                    </TableCell>
                    <TableCell>{entry.vehicleType}</TableCell>
                    <TableCell align="right">{formatCurrency(entry.fee || 0)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button 
              variant="outlined" 
              startIcon={<Print />} 
              onClick={handlePrint}
              sx={{ mr: 2 }}
            >
              Cetak Laporan
            </Button>
            <Button 
              variant="contained" 
              startIcon={<FileDownload />} 
              onClick={handleExport}
            >
              Export
            </Button>
          </Box>
        </>
      )}
    </Paper>
  );
};

export default ShiftReport; 