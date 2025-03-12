import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Alert, 
  Grid, 
  AppBar, 
  Toolbar, 
  IconButton, 
  Menu, 
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Badge,
  Avatar
} from '@mui/material';
import { 
  DirectionsCarFilledOutlined,
  Menu as MenuIcon,
  Receipt,
  Payment,
  LocalAtm,
  NightShelter,
  Settings,
  Person,
  ExitToApp,
  Help,
  Assignment
} from '@mui/icons-material';
import BarcodeScanner from './BarcodeScanner';
import PaymentProcessor from './PaymentProcessor';
import dbService from '../services/dbService';
import socketService from '../services/socketService';
import { VehicleEntry } from '../services/paymentService';
import LostTicketProcessor from './LostTicketProcessor';
import OvernightProcessor from './OvernightProcessor';

const GateOutDashboard: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [vehicleEntry, setVehicleEntry] = useState<VehicleEntry | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Menu state
  const [mainAnchorEl, setMainAnchorEl] = useState<null | HTMLElement>(null);
  const [userAnchorEl, setUserAnchorEl] = useState<null | HTMLElement>(null);
  const [activeView, setActiveView] = useState<'standard' | 'lost-ticket' | 'overnight'>('standard');

  // Handle menu open/close
  const handleMainMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setMainAnchorEl(event.currentTarget);
  };

  const handleUserMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setUserAnchorEl(event.currentTarget);
  };

  const handleMainMenuClose = () => {
    setMainAnchorEl(null);
  };

  const handleUserMenuClose = () => {
    setUserAnchorEl(null);
  };

  const handleViewChange = (view: 'standard' | 'lost-ticket' | 'overnight') => {
    setActiveView(view);
    setVehicleEntry(null);
    setError(null);
    handleMainMenuClose();
  };

  const handleLogout = () => {
    console.log('Logging out');
    handleUserMenuClose();
    // Implement logout logic
  };

  // Initialize services
  useEffect(() => {
    // Initialize database
    dbService.init();
    
    // Connect to socket server
    socketService.connect();
    
    // Set up socket connection listener
    socketService.onConnectionChange(setIsConnected);
    
    // Cleanup on component unmount
    return () => {
      socketService.disconnect();
    };
  }, []);

  // Handler for ticket scanning
  const handleTicketScan = async (ticketId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Find the vehicle entry by ticket ID
      const entry = await dbService.findByTicketId(ticketId);
      
      if (!entry) {
        setError(`Ticket ID ${ticketId} not found. Please try again.`);
        setVehicleEntry(null);
        return;
      }
      
      // Check if the vehicle has already exited
      if (entry.exitTime) {
        setError(`This ticket (${ticketId}) has already been processed. Vehicle exited at ${new Date(entry.exitTime).toLocaleString()}`);
        setVehicleEntry(null);
        return;
      }
      
      setVehicleEntry(entry);
    } catch (err) {
      console.error('Error processing ticket:', err);
      setError('Failed to process ticket. Please try again.');
      setVehicleEntry(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Handler to reset the state for a new ticket
  const handleReset = () => {
    setVehicleEntry(null);
    setError(null);
  };

  // Title based on active view
  const getViewTitle = () => {
    switch (activeView) {
      case 'lost-ticket':
        return 'Lost Ticket Processing';
      case 'overnight':
        return 'Overnight Vehicle Processing';
      default:
        return 'Gate-Out Payment Station';
    }
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={handleMainMenuClick}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Gate-Out System
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ mr: 2 }}>
              Gate: Main Exit
            </Typography>
            <IconButton color="inherit" onClick={handleUserMenuClick}>
              <Badge color="secondary" variant="dot">
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                  <Person />
                </Avatar>
              </Badge>
            </IconButton>
          </Box>
          
          {/* Main Menu */}
          <Menu
            anchorEl={mainAnchorEl}
            open={Boolean(mainAnchorEl)}
            onClose={handleMainMenuClose}
          >
            <MenuItem onClick={() => handleViewChange('standard')}>
              <ListItemIcon>
                <DirectionsCarFilledOutlined fontSize="small" />
              </ListItemIcon>
              <ListItemText>Kendaraan Keluar</ListItemText>
            </MenuItem>
            
            <MenuItem onClick={() => handleViewChange('lost-ticket')}>
              <ListItemIcon>
                <Assignment fontSize="small" />
              </ListItemIcon>
              <ListItemText>Tiket Hilang</ListItemText>
            </MenuItem>
            
            <MenuItem onClick={() => handleViewChange('overnight')}>
              <ListItemIcon>
                <NightShelter fontSize="small" />
              </ListItemIcon>
              <ListItemText>Kendaraan Menginap</ListItemText>
            </MenuItem>
            
            <Divider />
            
            <MenuItem onClick={handleMainMenuClose}>
              <ListItemIcon>
                <Payment fontSize="small" />
              </ListItemIcon>
              <ListItemText>Laporan Shift</ListItemText>
            </MenuItem>
            
            <MenuItem onClick={handleMainMenuClose}>
              <ListItemIcon>
                <LocalAtm fontSize="small" />
              </ListItemIcon>
              <ListItemText>Laporan Pendapatan</ListItemText>
            </MenuItem>
            
            <MenuItem onClick={handleMainMenuClose}>
              <ListItemIcon>
                <Help fontSize="small" />
              </ListItemIcon>
              <ListItemText>Bantuan</ListItemText>
            </MenuItem>
          </Menu>
          
          {/* User Menu */}
          <Menu
            anchorEl={userAnchorEl}
            open={Boolean(userAnchorEl)}
            onClose={handleUserMenuClose}
          >
            <MenuItem onClick={handleUserMenuClose}>
              <ListItemIcon>
                <Person fontSize="small" />
              </ListItemIcon>
              <ListItemText>Profil</ListItemText>
            </MenuItem>
            
            <MenuItem onClick={handleUserMenuClose}>
              <ListItemIcon>
                <Settings fontSize="small" />
              </ListItemIcon>
              <ListItemText>Pengaturan</ListItemText>
            </MenuItem>
            
            <Divider />
            
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <ExitToApp fontSize="small" />
              </ListItemIcon>
              <ListItemText>Keluar</ListItemText>
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <DirectionsCarFilledOutlined color="primary" sx={{ fontSize: 48, mb: 1 }} />
          <Typography variant="h4" gutterBottom>
            {getViewTitle()}
          </Typography>
          <Typography variant="body1" color="textSecondary">
            {activeView === 'standard' && 'Scan parking ticket to process vehicle exit and payment'}
            {activeView === 'lost-ticket' && 'Enter license plate to find vehicle and process lost ticket'}
            {activeView === 'overnight' && 'Process overnight vehicles with special rates'}
          </Typography>
          
          {!isConnected && (
            <Alert severity="warning" sx={{ mt: 2, mx: 'auto', maxWidth: 600 }}>
              Not connected to server. Some features may be limited.
            </Alert>
          )}
        </Box>
        
        <Grid container spacing={3}>
          {activeView === 'standard' && (
            <>
              <Grid item xs={12}>
                <BarcodeScanner 
                  onScan={handleTicketScan} 
                  isProcessing={isLoading} 
                />
              </Grid>
              
              <Grid item xs={12}>
                {error && (
                  <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                  </Alert>
                )}
                
                <PaymentProcessor 
                  vehicleEntry={vehicleEntry}
                  onReset={handleReset}
                  isLoading={isLoading}
                />
              </Grid>
            </>
          )}
          
          {activeView === 'lost-ticket' && (
            <Grid item xs={12}>
              <LostTicketProcessor 
                onVehicleFound={(entry) => {
                  setVehicleEntry(entry);
                  setError(null);
                }} 
              />
              
              {vehicleEntry && (
                <Box sx={{ mt: 3 }}>
                  <PaymentProcessor 
                    vehicleEntry={vehicleEntry}
                    onReset={handleReset}
                    isLoading={isLoading}
                  />
                </Box>
              )}
            </Grid>
          )}
          
          {activeView === 'overnight' && (
            <Grid item xs={12}>
              <OvernightProcessor 
                onVehicleSelected={(entry) => {
                  setVehicleEntry(entry);
                  setError(null);
                }} 
              />
              
              {vehicleEntry && (
                <Box sx={{ mt: 3 }}>
                  <PaymentProcessor 
                    vehicleEntry={vehicleEntry}
                    onReset={handleReset}
                    isLoading={isLoading}
                  />
                </Box>
              )}
            </Grid>
          )}
        </Grid>
      </Container>
    </>
  );
};

export default GateOutDashboard; 