import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Button
} from '@mui/material';
import { green } from '@mui/material/colors';
import { Check, Warning, Error as ErrorIcon, DirectionsCar } from '@mui/icons-material';
import Webcam from 'react-webcam';
import socketService from '../services/socketService';
import dbService, { VehicleEntry } from '../services/dbService';
import { hardwareService } from '../services/hardwareService';
import QRCode from 'qrcode';
import { format } from 'date-fns';
import CameraSettings from './CameraSettings';
import cameraService from '../services/cameraService';
import CameraPreview from './CameraPreview';

// Helper function to replace date-fns
const formatDate = (date: Date, formatStr: string) => {
  return format(date, formatStr);
};

// Vehicle types
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const VEHICLE_TYPES = ['CAR', 'MOTORCYCLE', 'TRUCK', 'BUS'];

const AutomatedEntryGate: React.FC = () => {
  const webcamRef = useRef<Webcam>(null);
  const [processedVehicles, setProcessedVehicles] = useState<VehicleEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingEntry, setIsProcessingEntry] = useState(false);
  const [selectedVehicleType, setSelectedVehicleType] = useState('MOTORCYCLE');
  const [success, setSuccess] = useState<string | null>(null);

  // Handle push button press
  const handlePushButtonPress = async () => {
    if (isProcessingEntry) {
      console.log('Already processing an entry, please wait...');
      return;
    }

    setIsProcessingEntry(true);
    setError(null);
    
    console.log('Push button pressed, processing entry...');
    
    try {
      // Generate ticket ID: YYYYMMDD-HHMMSS-XXXX
      const now = new Date();
      const dateStr = format(now, 'yyyyMMdd-HHmmss');
      const randomSuffix = Math.floor(1000 + Math.random() * 9000); // 4-digit random number
      const ticketId = `${dateStr}-${randomSuffix}`;
      
      console.log('Generated ticket ID:', ticketId);
      
      // Generate QR code
      let qrCodeDataUrl = null;
      try {
        qrCodeDataUrl = await QRCode.toDataURL(ticketId);
        console.log('QR code generated successfully');
      } catch (qrError) {
        console.error('Failed to generate QR code:', qrError);
        setError('Failed to generate QR code');
        setIsProcessingEntry(false);
        return;
      }
      
      // Capture vehicle image
      let vehicleImageUrl = null;
      let licensePlate = null;
      
      try {
        // Capture image
        vehicleImageUrl = await cameraService.captureVehicleImage();
        
        if (vehicleImageUrl) {
          console.log('Vehicle image captured successfully');
          
          // Try to detect license plate
          const ocrResult = await cameraService.detectPlate(vehicleImageUrl);
          
          if (ocrResult && ocrResult.isValid) {
            licensePlate = ocrResult.text;
            console.log('License plate detected:', licensePlate);
            
            // Capture again with license plate text
            vehicleImageUrl = await cameraService.captureVehicleImage(licensePlate);
          } else {
            console.log('No valid license plate detected');
            licensePlate = 'TIDAK TERDETEKSI';
            
            // Capture again with "No plate" text
            vehicleImageUrl = await cameraService.captureVehicleImage(licensePlate);
          }
        }
      } catch (imageError) {
        console.error('Failed to capture vehicle image:', imageError);
        // Continue without image
      }
      
      // Prepare ticket data
      const entryData: Omit<VehicleEntry, 'id'> = {
        ticketId,
        entryTime: Date.now(),
        vehicleType: selectedVehicleType,
        licensePlate: licensePlate || 'TIDAK TERDETEKSI',
        image: vehicleImageUrl || undefined,
        processed: false
      };
      
      console.log('Ticket data prepared:', entryData);
      
      // Print ticket
      try {
        const printData = {
          ticketId,
          entryTime: now.toLocaleString(),
          vehicleType: selectedVehicleType,
          qrCode: qrCodeDataUrl
        };
        
        console.log('Sending print data to hardware service...');
        const printResult = await hardwareService.printTicket(printData);
        
        if (printResult) {
          console.log('Ticket printed successfully');
        } else {
          console.warn('Ticket printing failed');
          setError('Ticket printing failed');
        }
      } catch (printError) {
        console.error('Error printing ticket:', printError);
        setError('Error printing ticket');
      }
      
      // Save entry to database
      try {
        console.log('Saving vehicle entry to database...');
        const savedEntry = await dbService.addVehicleEntry(entryData);
        console.log('Vehicle entry saved to database');
        
        // Update local state with the saved entry that now has an ID
        setProcessedVehicles(prev => [savedEntry, ...prev]);
        
        // Send notification via socket if connected
        if (socketService.isConnected()) {
          socketService.emit('newEntry', savedEntry);
          console.log('Sent new entry notification via socket');
        }
      } catch (dbError) {
        console.error('Failed to save vehicle entry to database:', dbError);
        setError('Failed to save entry data');
      }
      
      // Open gate
      try {
        console.log('Opening gate...');
        const gateResult = await hardwareService.openGate();
        
        if (gateResult) {
          console.log('Gate opened successfully');
        } else {
          console.warn('Failed to open gate');
          setError('Failed to open gate');
        }
      } catch (gateError) {
        console.error('Error opening gate:', gateError);
        setError('Error opening gate');
      }
      
    } catch (error) {
      console.error('Error processing entry:', error);
      setError('Error processing entry');
    } finally {
      setIsProcessingEntry(false);
    }
  };

  const initializeSocket = async () => {
    try {
      await socketService.initialize();
      setError(null);
      setSuccess('Koneksi socket berhasil');
    } catch (error) {
      console.error('Failed to initialize socket:', error);
      setError('Tidak dapat terhubung ke server. Pastikan server berjalan dan dapat diakses.');
      setSuccess(null);
    }
  };

  // Initialize services and setup
  useEffect(() => {
    const initializeServices = async () => {
      try {
        setIsLoading(true);
        
        // Initialize camera service
        cameraService.init(webcamRef);
        
        // Initialize database
        await dbService.init();
        
        // Initialize socket connection
        initializeSocket();
        
        // Load processed vehicles
        const entries = await dbService.getVehicleEntries();
        setProcessedVehicles(entries);
        
        setIsLoading(false);
        setError(null);
      } catch (err) {
        console.error('Error initializing services:', err);
        setError('Error initializing services');
        setIsLoading(false);
      }
    };
    
    initializeServices();
    
    // Cleanup on unmount
    return () => {
      socketService.off('connect');
      socketService.off('disconnect');
    };
  }, []);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Initializing automated entry system...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Automated Entry Gate
      </Typography>
      
      {/* Connection status */}
      <Box sx={{ mb: 3 }}>
        {isConnected ? (
          <Alert 
            icon={<Check fontSize="inherit" />} 
            severity="success"
            sx={{ mb: 2 }}
          >
            Connected to server
          </Alert>
        ) : (
          <Alert 
            icon={<Warning fontSize="inherit" />} 
            severity="warning"
            sx={{ mb: 2 }}
          >
            Not connected to server - entries will be stored locally
          </Alert>
        )}
        
        {error && (
          <Alert 
            icon={<ErrorIcon fontSize="inherit" />} 
            severity="error"
            sx={{ mb: 2 }}
          >
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert 
            icon={<Check fontSize="inherit" />} 
            severity="success"
            sx={{ mb: 2 }}
          >
            {success}
          </Alert>
        )}
        
        {/* Tombol untuk menguji koneksi dan memuat data */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Button 
            variant="contained" 
            color="primary"
            onClick={initializeSocket}
          >
            Uji Koneksi Server
          </Button>
          
          <Button 
            variant="outlined" 
            color="primary"
            onClick={async () => {
              try {
                setIsLoading(true);
                // Memuat ulang data dari IndexedDB
                const entries = await dbService.getVehicleEntries();
                setProcessedVehicles(entries.slice(-10).reverse());
                console.log('Data dimuat ulang:', entries.length, 'entri');
                if (entries.length === 0) {
                  setError('Tidak ada data tersimpan di database lokal');
                } else {
                  setError(null);
                }
              } catch (err) {
                console.error('Error saat memuat data:', err);
                setError('Gagal memuat data dari database lokal');
              } finally {
                setIsLoading(false);
              }
            }}
          >
            Muat Ulang Data
          </Button>
          
          <Button 
            variant="outlined" 
            color="secondary"
            onClick={async () => {
              try {
                await handlePushButtonPress();
                console.log('Simulasi push button berhasil');
              } catch (err) {
                console.error('Error saat simulasi push button:', err);
                setError('Gagal simulasi push button');
              }
            }}
          >
            Simulasi Push Button
          </Button>
          
          <Button 
            variant="outlined" 
            color="info"
            onClick={async () => {
              try {
                // Cek status database
                const status = dbService.getDatabaseStatus();
                console.log('Status Database:', status);
                
                // Force initialize database jika perlu
                if (!status.initialized || !status.dbConnected) {
                  console.log('Database tidak terinisialisasi, mencoba initialize ulang...');
                  const initResult = await dbService.forceInitialize();
                  console.log('Hasil initialize ulang:', initResult ? 'Berhasil' : 'Gagal');
                }
                
                // Lakukan tes database
                const testResult = await dbService.testDatabase();
                if (testResult) {
                  setError(null);
                  console.log('Tes database berhasil!');
                  alert('Database berfungsi dengan baik. Cek konsol untuk detail.');
                } else {
                  setError('Tes database gagal. Lihat konsol untuk detail.');
                  console.error('Tes database gagal');
                }
              } catch (err) {
                console.error('Error saat menjalankan tes database:', err);
                setError('Error saat menjalankan tes database');
              }
            }}
          >
            Tes Database
          </Button>
          
          <Button 
            variant="outlined" 
            color="error"
            onClick={async () => {
              if (window.confirm('PERHATIAN: Ini akan menghapus semua data lokal. Lanjutkan?')) {
                try {
                  setIsLoading(true);
                  
                  // Hapus database IndexedDB
                  console.log('Menghapus database IndexedDB...');
                  
                  // Hapus database secara manual
                  const deleteRequest = indexedDB.deleteDatabase('parking-system');
                  
                  deleteRequest.onsuccess = async () => {
                    console.log('Database berhasil dihapus');
                    
                    // Tunggu sebentar
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                    // Inisialisasi ulang database
                    await dbService.forceInitialize();
                    
                    // Muat ulang halaman
                    window.location.reload();
                  };
                  
                  deleteRequest.onerror = () => {
                    console.error('Gagal menghapus database:', deleteRequest.error);
                    setError('Gagal menghapus database');
                    setIsLoading(false);
                  };
                  
                  deleteRequest.onblocked = () => {
                    alert('Database diblokir. Tutup tab lain yang menggunakan aplikasi ini.');
                    setError('Database diblokir. Tutup tab lain yang menggunakan aplikasi ini.');
                    setIsLoading(false);
                  };
                } catch (err) {
                  console.error('Error saat menghapus database:', err);
                  setError('Error saat menghapus database');
                  setIsLoading(false);
                }
              }
            }}
          >
            Reset Database
          </Button>
        </Box>
      </Box>
      
      <Grid container spacing={3}>
        {/* Left column - Camera */}
        <Grid item xs={12} md={6}>
          <CameraPreview 
            onImageCapture={(imageUrl) => {
              // Simpan URL gambar ke state jika perlu
              console.log('Gambar diambil:', imageUrl);
            }}
          />
          
          {/* Tambahkan di sini form untuk input plat nomor atau pengaturan lainnya */}
          <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Deteksi Plat Nomor Otomatis
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={async () => {
                  // Ambil gambar dari kamera
                  const imageUrl = await cameraService.captureVehicleImage();
                  
                  if (imageUrl) {
                    // Coba deteksi plat nomor
                    const ocrResult = await cameraService.detectPlate(imageUrl);
                    
                    console.log('OCR Result:', ocrResult);
                    
                    if (ocrResult && ocrResult.isValid) {
                      alert(`Plat Nomor Terdeteksi: ${ocrResult.text}`);
                    } else {
                      alert('Tidak dapat mendeteksi plat nomor. Silakan coba lagi atau masukkan secara manual.');
                    }
                  }
                }}
              >
                Deteksi Plat Nomor
              </Button>
            </Box>
          </Paper>
        </Grid>
        
        {/* Right column - Latest processed entry */}
        <Grid item xs={12} md={6}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card elevation={3}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Latest Entry
                  </Typography>
                  
                  {processedVehicles.length > 0 ? (
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <DirectionsCar sx={{ fontSize: 40, mr: 2, color: green[500] }} />
                        <Typography variant="h5">
                          {processedVehicles[0].licensePlate}
                        </Typography>
                      </Box>
                      
                      <Typography variant="body2" color="textSecondary">
                        Ticket ID: {processedVehicles[0].ticketId}
                      </Typography>
                      
                      <Typography variant="body2" color="textSecondary">
                        Entry Time: {new Date(processedVehicles[0].entryTime).toLocaleString()}
                      </Typography>
                      
                      <Typography variant="body2" color="textSecondary">
                        Vehicle Type: {processedVehicles[0].vehicleType}
                      </Typography>
                    </Box>
                  ) : (
                    <Typography variant="body1" color="textSecondary">
                      No entries processed yet
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
            
            {/* Recent entries table */}
            <Grid item xs={12}>
              <Paper elevation={3} sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Recent Entries
                </Typography>
                
                {processedVehicles.length > 0 ? (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Plate Number</TableCell>
                          <TableCell>Ticket ID</TableCell>
                          <TableCell>Entry Time</TableCell>
                          <TableCell>Type</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {processedVehicles.map((vehicle) => (
                          <TableRow key={vehicle.id}>
                            <TableCell>{vehicle.licensePlate}</TableCell>
                            <TableCell>{vehicle.ticketId}</TableCell>
                            <TableCell>
                              {new Date(vehicle.entryTime).toLocaleTimeString()}
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={vehicle.vehicleType} 
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography variant="body1" color="textSecondary">
                    No entries processed yet
                  </Typography>
                )}
              </Paper>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
      
      {/* Tambahkan pengaturan kamera */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          Pengaturan Kamera
        </Typography>
        <CameraSettings />
      </Box>
    </Box>
  );
};

export default AutomatedEntryGate; 