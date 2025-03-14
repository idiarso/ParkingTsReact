import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Paper,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  IconButton
} from '@mui/material';
import { 
  Print, 
  Camera as CameraIcon,
  PhotoCamera,
  Refresh
} from '@mui/icons-material';
import socketService from '../services/socketService';
import dbService, { VehicleEntry } from '../services/dbService';
import JsBarcode from 'jsbarcode';

// CSS for print
const printStyles = `
  @media print {
    body * {
      visibility: hidden;
    }
    .print-section, .print-section * {
      visibility: visible;
    }
    .print-section {
      position: absolute;
      left: 0;
      top: 0;
      width: 58mm !important;
      background-color: white !important;
      color: black !important;
      padding: 5mm !important;
      margin: 0 !important;
    }
    #barcodeCanvas {
      display: block !important;
      margin: 2mm auto !important;
      width: 50mm !important;
      height: auto !important;
    }
    .ticket-header {
      font-size: 14pt !important;
      margin-bottom: 2mm !important;
      font-weight: bold !important;
    }
    .ticket-info {
      font-size: 9pt !important;
      margin-bottom: 1mm !important;
      line-height: 1.2 !important;
    }
    .no-print {
      display: none !important;
    }
  }
`;

const TicketGenerator: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [ticket, setTicket] = useState<VehicleEntry | null>(null);
  const [showTicket, setShowTicket] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dbInitialized, setDbInitialized] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const barcodeRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize camera
  const initCamera = async () => {
    try {
      const constraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "environment"
        }
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setIsCameraActive(true);
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Gagal mengakses kamera. Pastikan kamera tersedia dan izin diberikan.');
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsCameraActive(false);
    }
  };

  // Capture image using canvas
  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas size to match video dimensions
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw the video frame to canvas
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert to base64
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      handleGenerateTicket(imageData);
      
    } catch (err) {
      console.error('Error capturing image:', err);
      setError('Gagal mengambil gambar');
    }
  };

  // Initialize database
  useEffect(() => {
    const initDb = async () => {
      try {
        const initialized = await dbService.init();
        setDbInitialized(initialized);
        if (!initialized) {
          setError('Gagal menginisialisasi database. Mohon muat ulang halaman.');
        }
      } catch (err) {
        console.error('Database initialization error:', err);
        setError('Gagal menginisialisasi database. Mohon muat ulang halaman.');
      }
    };
    initDb();

    // Cleanup camera on unmount
    return () => {
      stopCamera();
    };
  }, []);

  // Generate barcode when ticket is available
  useEffect(() => {
    if (ticket && barcodeRef.current) {
      try {
        console.log("Generating barcode for ticket:", ticket);
        
        // Clear previous barcode
        const context = barcodeRef.current.getContext('2d');
        if (context) {
          context.clearRect(0, 0, barcodeRef.current.width, barcodeRef.current.height);
        }

        // Generate barcode
        JsBarcode(barcodeRef.current, ticket.ticketId, {
          format: "CODE128",
          width: 2,
          height: 50,
          displayValue: true,
          fontSize: 12,
          font: "monospace",
          textAlign: "center",
          textPosition: "bottom",
          textMargin: 2,
          background: "#ffffff"
        });

      } catch (err) {
        console.error("Error generating barcode:", err);
      }
    }
  }, [ticket, showTicket]);

  const handleGenerateTicket = async (imageData?: string) => {
    if (!dbInitialized) {
      setError('Database belum siap. Mohon tunggu sebentar.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    
    try {
      const now = new Date();
      // Generate simple ticket ID: YYYYMMDDHHMMSS
      const ticketId = now.toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
      
      const newEntry: Omit<VehicleEntry, 'id'> = {
        ticketId,
        licensePlate: '-',
        vehicleType: 'UNKNOWN',
        entryTime: now.getTime(),
        processed: false,
        image: imageData
      };
      
      console.log("Creating new entry:", newEntry);
      
      // Save to database
      const savedEntry = await dbService.addVehicleEntry(newEntry);
      console.log("Saved entry:", savedEntry);
      
      // Notify socket server
      socketService.notifyVehicleEntry({
        ticketId,
        licensePlate: '-',
        vehicleType: 'UNKNOWN',
        entryTime: now.toISOString()
      });
      
      // Update gate status
      socketService.updateGateStatus('gate-in', 'open');
      setTimeout(() => socketService.updateGateStatus('gate-in', 'closed'), 5000);
      
      setTicket(savedEntry);
      setShowTicket(true);
      stopCamera(); // Stop camera after capturing
      
    } catch (err) {
      console.error('Error generating ticket:', err);
      setError('Gagal membuat tiket. Silakan coba lagi.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrintTicket = () => {
    const style = document.createElement('style');
    style.innerHTML = printStyles;
    document.head.appendChild(style);
    window.print();
    setTimeout(() => {
      document.head.removeChild(style);
      setShowTicket(false);
    }, 500);
  };

  return (
    <Paper elevation={3} sx={{ p: 3, maxWidth: 800, mx: 'auto', mt: 4 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Tiket Parkir
        </Typography>

        {/* Camera Section */}
        <Box sx={{ mb: 3, position: 'relative' }}>
          {isCameraActive ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                onLoadedMetadata={() => {
                  if (canvasRef.current && videoRef.current) {
                    canvasRef.current.width = videoRef.current.videoWidth;
                    canvasRef.current.height = videoRef.current.videoHeight;
                  }
                }}
                style={{ width: '100%', maxWidth: '640px', borderRadius: '8px' }}
              />
              <Box sx={{ mt: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={captureImage}
                  startIcon={<PhotoCamera />}
                  disabled={isGenerating}
                >
                  Ambil Foto
                </Button>
                <Button
                  variant="outlined"
                  onClick={stopCamera}
                  sx={{ ml: 2 }}
                >
                  Tutup Kamera
                </Button>
              </Box>
            </>
          ) : (
            <Button
              variant="contained"
              color="primary"
              onClick={initCamera}
              startIcon={<CameraIcon />}
              disabled={isGenerating}
            >
              Buka Kamera
            </Button>
          )}
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </Box>

        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={() => handleGenerateTicket()}
          disabled={isGenerating}
          sx={{ 
            py: 2, 
            px: 4, 
            fontSize: '1.2rem',
            borderRadius: '8px',
            boxShadow: 3,
            mt: 3
          }}
        >
          {isGenerating ? (
            <>
              <CircularProgress size={24} color="inherit" sx={{ mr: 1 }} />
              Processing...
            </>
          ) : (
            'Generate Tiket'
          )}
        </Button>
      </Box>
      
      <Dialog 
        open={showTicket} 
        onClose={() => setShowTicket(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogContent sx={{ p: 2 }}>
          <Card variant="outlined" className="print-section">
            <CardContent>
              <Typography variant="h5" align="center" className="ticket-header">
                TIKET PARKIR
              </Typography>
              
              <Typography className="ticket-info">
                Nomor Plat: {ticket?.licensePlate || '-'}
              </Typography>
              <Typography className="ticket-info">
                Jenis Kendaraan: {ticket?.vehicleType || '-'}
              </Typography>
              <Typography className="ticket-info">
                Waktu Masuk: {ticket ? new Date(ticket.entryTime).toLocaleString('id-ID') : '-'}
              </Typography>

              <Box sx={{ mt: 2, mb: 1 }}>
                <canvas ref={barcodeRef} id="barcodeCanvas"></canvas>
              </Box>
            </CardContent>
          </Card>
          
          <DialogActions sx={{ mt: 2 }}>
            <Button 
              onClick={() => setShowTicket(false)}
              variant="outlined"
              className="no-print"
            >
              TUTUP
            </Button>
            <Button 
              onClick={handlePrintTicket}
              variant="contained"
              startIcon={<Print />}
              className="no-print"
            >
              CETAK TIKET
            </Button>
          </DialogActions>
        </DialogContent>
      </Dialog>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setError(null)}
          severity="error"
        >
          {error}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default TicketGenerator;
