import React, { useRef, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import BackupIcon from '@mui/icons-material/Backup';
import RestoreIcon from '@mui/icons-material/Restore';
import { getDB } from '../../utils/db';
import {
  createBackup,
  restoreBackup,
  exportDataToJson,
  importDataFromJson,
} from '../../utils/printAndExport';

interface BackupRestoreDialogProps {
  open: boolean;
  onClose: () => void;
}

const BackupRestoreDialog: React.FC<BackupRestoreDialogProps> = ({
  open,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBackup = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      const db = await getDB();
      const data = await createBackup(db);
      exportDataToJson(data);
      setSuccess('Backup created successfully!');
    } catch (err) {
      setError('Failed to create backup: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (file: File) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      const data = await importDataFromJson(file);
      const db = await getDB();
      await restoreBackup(db, data);
      setSuccess('Data restored successfully!');
    } catch (err) {
      setError('Failed to restore data: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleRestore(file);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Backup and Restore</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Backup Data
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            Create a backup of all your parking system data. The backup includes parking sessions,
            vehicle records, and system settings.
          </Typography>
          <Button
            variant="contained"
            startIcon={<BackupIcon />}
            onClick={handleBackup}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Create Backup'}
          </Button>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Restore Data
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            Restore your parking system data from a backup file. This will replace all current
            data with the data from the backup file.
          </Typography>
          <input
            type="file"
            accept=".json"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <Button
            variant="contained"
            color="secondary"
            startIcon={<RestoreIcon />}
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Restore from Backup'}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default BackupRestoreDialog; 