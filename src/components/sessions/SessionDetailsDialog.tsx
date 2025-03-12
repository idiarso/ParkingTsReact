import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import { format } from 'date-fns';
import { ParkingSession } from '../../store/types';

interface SessionDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  session: ParkingSession;
  onEndSession?: () => void;
}

interface InfoRowProps {
  label: string;
  value: string | number;
}

const InfoRow: React.FC<InfoRowProps> = ({
  label,
  value,
}) => (
  <Grid container spacing={2} sx={{ mb: 1 }}>
    <Grid item xs={4}>
      <Typography sx={{ color: 'text.secondary' }}>{label}:</Typography>
    </Grid>
    <Grid item xs={8}>
      <Typography>{value}</Typography>
    </Grid>
  </Grid>
);

const SessionDetailsDialog: React.FC<SessionDetailsDialogProps> = ({
  open,
  onClose,
  session,
  onEndSession,
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Parking Session Details
        <Box
          component="span"
          sx={{
            ml: 2,
            px: 1,
            py: 0.5,
            borderRadius: 1,
            bgcolor: session.status === 'active' ? 'success.light' : 'info.light',
            color: session.status === 'active' ? 'success.dark' : 'info.dark',
            fontSize: '0.875rem',
          }}
        >
          {session.status}
        </Box>
      </DialogTitle>
      <DialogContent>
        <Paper sx={{ p: 2, mb: 2 }}>
          <InfoRow label="Session ID" value={session.id} />
          <InfoRow label="Vehicle Number" value={session.vehicleNumber} />
          <InfoRow
            label="Entry Time"
            value={format(new Date(session.entryTime), 'dd/MM/yyyy HH:mm:ss')}
          />
          {session.exitTime && (
            <InfoRow
              label="Exit Time"
              value={format(new Date(session.exitTime), 'dd/MM/yyyy HH:mm:ss')}
            />
          )}
          {session.totalAmount !== undefined && (
            <InfoRow label="Total Amount" value={`$${session.totalAmount.toFixed(2)}`} />
          )}
          {session.lastSynced && (
            <InfoRow
              label="Last Synced"
              value={format(new Date(session.lastSynced), 'dd/MM/yyyy HH:mm:ss')}
            />
          )}
        </Paper>

        {onEndSession && (
          <Button
            variant="contained"
            color="primary"
            onClick={onEndSession}
            fullWidth
          >
            End Session
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SessionDetailsDialog; 