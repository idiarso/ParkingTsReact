import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Alert,
  CircularProgress
} from '@mui/material';
import { format } from 'date-fns';

interface VehicleEntry {
  id: string;
  plateNumber: string;
  entryTime: string;
  vehicleType: string;
  status: 'success' | 'pending' | 'failed';
  gate: string;
}

const RecentEntries: React.FC = () => {
  const [entries, setEntries] = useState<VehicleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    fetchRecentEntries();
  }, []);

  const fetchRecentEntries = async () => {
    try {
      // TODO: Replace with actual API call
      const mockData: VehicleEntry[] = [
        {
          id: '1',
          plateNumber: 'B 1234 CD',
          entryTime: new Date().toISOString(),
          vehicleType: 'Car',
          status: 'success',
          gate: 'Main Entrance'
        },
        // Add more mock data as needed
      ];
      
      setEntries(mockData);
      setError(null);
    } catch (err) {
      setError('Failed to fetch recent entries');
      console.error('Error fetching entries:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getStatusColor = (status: VehicleEntry['status']) => {
    switch (status) {
      case 'success':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Recent Entries
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Plate Number</TableCell>
                <TableCell>Entry Time</TableCell>
                <TableCell>Vehicle Type</TableCell>
                <TableCell>Gate</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {entries
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((entry) => (
                  <TableRow key={entry.id} hover>
                    <TableCell>{entry.plateNumber}</TableCell>
                    <TableCell>
                      {format(new Date(entry.entryTime), 'dd/MM/yyyy HH:mm:ss')}
                    </TableCell>
                    <TableCell>{entry.vehicleType}</TableCell>
                    <TableCell>{entry.gate}</TableCell>
                    <TableCell>
                      <Chip
                        label={entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                        color={getStatusColor(entry.status)}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component="div"
          count={entries.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Box>
  );
};

export { RecentEntries };
export default RecentEntries; 