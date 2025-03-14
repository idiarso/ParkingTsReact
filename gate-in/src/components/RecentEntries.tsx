import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Box,
  CircularProgress,
  Alert
} from '@mui/material';
import { VehicleEntry } from '../services/dbService';

interface RecentEntriesProps {
  entries: VehicleEntry[];
}

export const RecentEntries: React.FC<RecentEntriesProps> = ({ entries: propEntries }) => {
  const [entries, setEntries] = useState<VehicleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // First check if entries were passed as props
    if (propEntries && propEntries.length > 0) {
      setEntries(propEntries);
      setLoading(false);
      return;
    }

    // If no prop entries, try to load from localStorage
    try {
      // Try to get recent entries from localStorage
      const recentEntriesJson = localStorage.getItem('recentEntries');
      const offlineEntriesJson = localStorage.getItem('offlineVehicleEntries');
      
      let localEntries: any[] = [];
      
      if (recentEntriesJson) {
        console.log("Loading recent entries from localStorage");
        const parsedEntries = JSON.parse(recentEntriesJson);
        if (Array.isArray(parsedEntries)) {
          localEntries = parsedEntries;
        }
      }
      
      // Also check offlineVehicleEntries as a fallback
      if (localEntries.length === 0 && offlineEntriesJson) {
        console.log("Loading offline entries from localStorage");
        const parsedOfflineEntries = JSON.parse(offlineEntriesJson);
        if (Array.isArray(parsedOfflineEntries)) {
          localEntries = parsedOfflineEntries;
        }
      }
      
      // Convert to VehicleEntry format
      if (localEntries.length > 0) {
        const convertedEntries: VehicleEntry[] = localEntries.map(entry => ({
          id: entry.entryTime,
          ticketId: entry.ticketId || `TICKET-${entry.entryTime}`,
          licensePlate: entry.plateNumber,
          vehicleType: entry.vehicleType,
          entryTime: new Date(entry.entryTime).getTime(),
          image: undefined,
          processed: true
        }));
        
        setEntries(convertedEntries);
        console.log(`Loaded ${convertedEntries.length} entries from localStorage`);
      } else {
        console.log("No entries found in localStorage");
      }
    } catch (err) {
      console.error("Error loading entries from localStorage:", err);
      setError("Gagal memuat riwayat entri");
    } finally {
      setLoading(false);
    }
  }, [propEntries]);

  if (loading) {
    return (
      <Paper sx={{ p: 3, mt: 3, textAlign: 'center' }}>
        <CircularProgress size={24} sx={{ mb: 2 }} />
        <Typography>Memuat riwayat...</Typography>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper sx={{ p: 3, mt: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Paper>
    );
  }

  if (entries.length === 0) {
    return (
      <Paper sx={{ p: 3, mt: 3, textAlign: 'center' }}>
        <Typography>Tidak ada riwayat entri kendaraan</Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        Riwayat Entri Terbaru
      </Typography>
      
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>ID Tiket</TableCell>
              <TableCell>Nomor Plat</TableCell>
              <TableCell>Jenis</TableCell>
              <TableCell>Waktu Masuk</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {entries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell>{entry.ticketId}</TableCell>
                <TableCell>{entry.licensePlate}</TableCell>
                <TableCell>
                  {entry.vehicleType === 'car' && 'Mobil'}
                  {entry.vehicleType === 'motorcycle' && 'Motor'}
                  {entry.vehicleType === 'truck' && 'Truk'}
                  {!['car', 'motorcycle', 'truck'].includes(entry.vehicleType) && entry.vehicleType}
                </TableCell>
                <TableCell>
                  {new Date(entry.entryTime).toLocaleString('id-ID', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </TableCell>
                <TableCell>
                  <Chip 
                    label={entry.processed ? "Tercatat" : "Pending"} 
                    color={entry.processed ? "success" : "warning"}
                    size="small"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}; 