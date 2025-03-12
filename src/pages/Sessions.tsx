import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ThunkDispatch } from 'redux-thunk';
import { AnyAction } from 'redux';
import { 
  DataGrid, 
  GridColDef, 
  GridRenderCellParams,
  GridRowModel,
  GridEventListener,
  GridPaginationModel,
} from '@mui/x-data-grid';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  IconButton,
} from '@mui/material';
import Tooltip from '@mui/material/Tooltip';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import RefreshIcon from '@mui/icons-material/Refresh';
import { loadActiveSessions, endParkingSession } from '../store/actions/parkingSessions';
import { RootState } from '../store/reducers';
import { ParkingSession } from '../store/types';
import { format, formatDistanceToNow } from 'date-fns';

interface ExtendedParkingSession extends Omit<ParkingSession, 'vehicleType'> {
  totalAmount?: number;
  vehicleType?: string;
}

interface SessionDetailsDialogProps {
  session: ExtendedParkingSession | null;
  open: boolean;
  onClose: () => void;
  onEndSession: (sessionId: string) => void;
}

const SessionDetailsDialog: React.FC<SessionDetailsDialogProps> = ({
  session,
  open,
  onClose,
  onEndSession,
}) => {
  const [duration, setDuration] = useState('');

  useEffect(() => {
    if (!session) return;

    const updateDuration = () => {
      const start = new Date(session.entryTime);
      setDuration(formatDistanceToNow(start, { addSuffix: true }));
    };

    updateDuration();
    const interval = setInterval(updateDuration, 60000);

    return () => clearInterval(interval);
  }, [session]);

  if (!session) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ pb: 1, borderBottom: 1, borderColor: 'divider' }}>
          Parking Session Details
        </Box>
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Session ID
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 1 }}>
                    {session.id}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Vehicle Number
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 1 }}>
                    {session.vehicleNumber}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
              <Typography variant="subtitle2" color="text.secondary">
                Vehicle Type
              </Typography>
              <Typography variant="body1" sx={{ mt: 1 }}>
                {session.vehicleType || 'Not specified'}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
              <Typography variant="subtitle2" color="text.secondary">
                Status
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Chip
                  label={session.status}
                  color={session.status === 'active' ? 'success' : 'info'}
                  size="small"
                  variant="outlined"
                />
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
              <Typography variant="subtitle2" color="text.secondary">
                Entry Time
              </Typography>
              <Typography variant="body1" sx={{ mt: 1 }}>
                {format(new Date(session.entryTime), 'dd/MM/yyyy HH:mm:ss')}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
              <Typography variant="subtitle2" color="text.secondary">
                Duration
              </Typography>
              <Typography variant="body1" sx={{ mt: 1 }}>
                {duration}
              </Typography>
            </Paper>
          </Grid>

          {session.totalAmount && (
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Total Amount
                </Typography>
                <Typography variant="h6" color="primary" sx={{ mt: 1 }}>
                  ${session.totalAmount.toFixed(2)}
                </Typography>
              </Paper>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Box sx={{ width: '100%', p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button onClick={onClose}>
              Close
            </Button>
            {session.status === 'active' && (
              <Button 
                variant="contained" 
                color="primary"
                onClick={() => {
                  onEndSession(session.id);
                  onClose();
                }}
              >
                End Session
              </Button>
            )}
          </Box>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

const PAGE_SIZE = 25;

const renderCell = (params: GridRenderCellParams) => {
  const handleEndSession = () => {
    // Implementation
  };

  return (
    <Button
      variant="contained"
      color="primary"
      onClick={handleEndSession}
      disabled={params.row.exitTime !== null}
    >
      End Session
    </Button>
  );
};

export default function Sessions() {
  const dispatch = useDispatch<ThunkDispatch<RootState, unknown, AnyAction>>();
  const { sessions, loading, error } = useSelector((state: RootState) => state.parkingSessions);
  const [selectedSession, setSelectedSession] = useState<ExtendedParkingSession | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [paginationModel, setPaginationModel] = React.useState<GridPaginationModel>({
    page: 0,
    pageSize: PAGE_SIZE,
  });

  const refreshData = useCallback(() => {
    dispatch(loadActiveSessions());
  }, [dispatch]);

  useEffect(() => {
    refreshData();
    // Set up auto-refresh every 5 minutes
    const interval = setInterval(refreshData, 300000);
    return () => clearInterval(interval);
  }, [refreshData]);

  const handleEndSession = useCallback((sessionId: string) => {
    dispatch(endParkingSession(sessionId));
  }, [dispatch]);

  const handleCloseDialog = useCallback(() => {
    setDialogOpen(false);
    setSelectedSession(null);
  }, []);

  const handleOpenDetails = useCallback((session: ExtendedParkingSession) => {
    setSelectedSession(session);
    setDialogOpen(true);
  }, []);

  const columns: GridColDef[] = useMemo(() => [
    {
      field: 'id',
      headerName: 'Session ID',
      width: 200,
      filterable: true,
    },
    {
      field: 'vehicleNumber',
      headerName: 'Vehicle Number',
      width: 150,
      filterable: true,
    },
    {
      field: 'vehicleType',
      headerName: 'Vehicle Type',
      width: 130,
      filterable: true,
    },
    {
      field: 'entryTime',
      headerName: 'Entry Time',
      width: 180,
      valueFormatter: (params) =>
        format(new Date(params.value), 'dd/MM/yyyy HH:mm:ss'),
      filterable: true,
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value}
          color={params.value === 'active' ? 'success' : 'info'}
          size="small"
          variant="outlined"
        />
      ),
      filterable: true,
    },
    {
      field: 'duration',
      headerName: 'Duration',
      width: 150,
      valueGetter: (params) => {
        const start = new Date(params.row.entryTime);
        return formatDistanceToNow(start, { addSuffix: true });
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      renderCell: renderCell
    },
  ], []);

  const handleRowClick: GridEventListener<'rowClick'> = useCallback((params) => {
    handleOpenDetails(params.row as ExtendedParkingSession);
  }, [handleOpenDetails]);

  if (loading && sessions.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', width: '100%', padding: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">
          Active Parking Sessions
        </Typography>
        <Tooltip title="Refresh data">
          <IconButton onClick={refreshData} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Paper sx={{ height: 'calc(100vh - 100px)', width: '100%' }}>
        <DataGrid
          rows={sessions}
          columns={columns}
          rowCount={sessions.length}
          loading={loading}
          pageSizeOptions={[25, 50, 100]}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          paginationMode="server"
          filterMode="server"
          disableRowSelectionOnClick
          getRowId={(row: GridRowModel) => row.id}
          onRowClick={handleRowClick}
          initialState={{
            columns: {
              columnVisibilityModel: {
                id: false,
              },
            },
          }}
          sx={{
            '& .MuiDataGrid-cell:focus': {
              outline: 'none',
            },
          }}
        />
      </Paper>

      <SessionDetailsDialog
        session={selectedSession}
        open={dialogOpen}
        onClose={handleCloseDialog}
        onEndSession={handleEndSession}
      />
    </Box>
  );
} 