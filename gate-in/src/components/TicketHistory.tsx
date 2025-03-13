import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import dbService, { VehicleEntry } from '../services/dbService';

const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

const TicketHistory: React.FC = () => {
  const [entries, setEntries] = useState<VehicleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<VehicleEntry | null>(null);
  const [clearAllDialogOpen, setClearAllDialogOpen] = useState(false);

  const loadEntries = async () => {
    try {
      setLoading(true);
      const data = await dbService.getVehicleEntries();
      setEntries(data.sort((a, b) => b.entryTime - a.entryTime)); // Sort by newest first
    } catch (err) {
      console.error('Failed to load entries:', err);
      setError('Gagal memuat data riwayat');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();
  }, []);

  const handleDelete = async (entry: VehicleEntry) => {
    setSelectedEntry(entry);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedEntry) return;

    try {
      const success = await dbService.deleteVehicleEntry(selectedEntry.id);
      if (success) {
        await loadEntries();
        setError('Data berhasil dihapus');
      } else {
        throw new Error('Gagal menghapus data');
      }
    } catch (err) {
      console.error('Delete error:', err);
      setError('Gagal menghapus data');
    } finally {
      setDeleteDialogOpen(false);
      setSelectedEntry(null);
    }
  };

  const handleClearAll = () => {
    setClearAllDialogOpen(true);
  };

  const handleClearAllConfirm = async () => {
    try {
      const success = await dbService.deleteAllEntries();
      if (success) {
        setEntries([]);
        setError('Semua data berhasil dihapus');
      } else {
        throw new Error('Gagal menghapus semua data');
      }
    } catch (err) {
      console.error('Clear all error:', err);
      setError('Gagal menghapus semua data');
    } finally {
      setClearAllDialogOpen(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, maxWidth: 1200, mx: 'auto', mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2">
          Riwayat Tiket
        </Typography>
        <Box>
          <Button
            startIcon={<RefreshIcon />}
            onClick={loadEntries}
            sx={{ mr: 2 }}
          >
            Refresh
          </Button>
          <Button
            startIcon={<DeleteIcon />}
            color="error"
            onClick={handleClearAll}
            disabled={entries.length === 0}
          >
            Hapus Semua
          </Button>
        </Box>
      </Box>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID Tiket</TableCell>
              <TableCell>Nomor Plat</TableCell>
              <TableCell>Jenis Kendaraan</TableCell>
              <TableCell>Waktu Masuk</TableCell>
              <TableCell align="center">Aksi</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {entries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell>{entry.ticketId}</TableCell>
                <TableCell>{entry.licensePlate}</TableCell>
                <TableCell>{entry.vehicleType}</TableCell>
                <TableCell>{formatDate(entry.entryTime)}</TableCell>
                <TableCell align="center">
                  <IconButton
                    color="error"
                    onClick={() => handleDelete(entry)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {entries.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  Tidak ada data
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Konfirmasi Hapus</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Apakah Anda yakin ingin menghapus tiket dengan ID: {selectedEntry?.ticketId}?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Batal</Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Hapus
          </Button>
        </DialogActions>
      </Dialog>

      {/* Clear All Confirmation Dialog */}
      <Dialog
        open={clearAllDialogOpen}
        onClose={() => setClearAllDialogOpen(false)}
      >
        <DialogTitle>Konfirmasi Hapus Semua</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Apakah Anda yakin ingin menghapus semua riwayat tiket? Tindakan ini tidak dapat dibatalkan.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClearAllDialogOpen(false)}>Batal</Button>
          <Button onClick={handleClearAllConfirm} color="error" autoFocus>
            Hapus Semua
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setError(null)}
          severity={error?.includes('berhasil') ? 'success' : 'error'}
        >
          {error}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default TicketHistory; 