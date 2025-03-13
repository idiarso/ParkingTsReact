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
  Snackbar
} from '@mui/material';
import { 
  Print, 
  CheckCircle
} from '@mui/icons-material';
import { v4 as uuidv4 } from 'uuid';
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

// Helper function to format date
const formatDate = (date: Date): string => {
  const pad = (num: number) => num.toString().padStart(2, '0');
  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const year = date.getFullYear();
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  
  return `${day}/${month}/${year}, ${hours}.${minutes}.${seconds}`;
};

const TicketGenerator: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [ticket, setTicket] = useState<VehicleEntry | null>(null);
  const [showTicket, setShowTicket] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dbInitialized, setDbInitialized] = useState(false);
  const [licensePlate, setLicensePlate] = useState<string>('');
  const [vehicleHistory, setVehicleHistory] = useState<VehicleEntry[]>([]);
  const barcodeRef = useRef<HTMLCanvasElement>(null);
  const barcodeContainerRef = useRef<HTMLDivElement>(null);

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
  }, []);

  // Load vehicle history when license plate changes
  useEffect(() => {
    const loadVehicleHistory = async () => {
      if (licensePlate && licensePlate !== '-') {
        try {
          const history = await dbService.getEntriesByLicensePlate(licensePlate);
          setVehicleHistory(history);
        } catch (err) {
          console.error('Error loading vehicle history:', err);
        }
      }
    };
    loadVehicleHistory();
  }, [licensePlate]);

  // Generate barcode when ticket is available
  useEffect(() => {
    if (ticket && barcodeRef.current && barcodeContainerRef.current) {
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

        // Make sure barcode is visible
        barcodeContainerRef.current.style.display = 'block';
        barcodeRef.current.style.display = 'block';
        barcodeRef.current.style.width = '100%';
        barcodeRef.current.style.height = 'auto';

      } catch (err) {
        console.error("Error generating barcode:", err);
      }
    }
  }, [ticket, showTicket]);

  const handleGenerateTicket = async () => {
    if (!dbInitialized) {
      setError('Database belum siap. Mohon tunggu sebentar.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    
    try {
      const now = new Date();
      // Generate ticket ID with format: YYYYMMDDHHMMSS-XXXX
      const datePart = now.toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
      const randomPart = Math.floor(1000 + Math.random() * 9000);
      const ticketId = `${datePart}-${randomPart}`;
      
      // Get the current license plate from camera/OCR if available
      const currentPlate = licensePlate || await getCurrentLicensePlate();
      
      const newEntry: Omit<VehicleEntry, 'id'> = {
        ticketId,
        licensePlate: currentPlate,
        vehicleType: determineVehicleType(currentPlate, vehicleHistory),
        entryTime: now.getTime(),
        processed: false
      };
      
      console.log("Creating new entry:", newEntry);
      
      // Save to database
      const savedEntry = await dbService.addVehicleEntry(newEntry);
      console.log("Saved entry:", savedEntry);
      
      if (!savedEntry) {
        throw new Error('Gagal menyimpan tiket ke database');
      }
      
      // Notify socket server
      socketService.notifyVehicleEntry({
        ticketId,
        licensePlate: currentPlate,
        vehicleType: newEntry.vehicleType,
        entryTime: now.toISOString()
      });
      
      // Update gate status
      socketService.updateGateStatus('gate-in', 'open');
      setTimeout(() => socketService.updateGateStatus('gate-in', 'closed'), 5000);
      
      setTicket(savedEntry);
      setShowTicket(true);
      
    } catch (err) {
      console.error('Error generating ticket:', err);
      setError('Gagal membuat tiket. Silakan coba lagi.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Helper function to get current license plate from camera/OCR
  const getCurrentLicensePlate = async (): Promise<string> => {
    // TODO: Implement actual license plate detection
    // For now, return a placeholder
    return 'B 1234 XY';
  };

  // Helper function to determine vehicle type based on history
  const determineVehicleType = (plate: string, history: VehicleEntry[]): string => {
    if (history.length > 0) {
      // Use the most common vehicle type from history
      const typeCounts = history.reduce((acc, entry) => {
        acc[entry.vehicleType] = (acc[entry.vehicleType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      let maxCount = 0;
      let mostCommonType = 'UNKNOWN';
      
      Object.entries(typeCounts).forEach(([type, count]) => {
        if (count > maxCount) {
          mostCommonType = type;
          maxCount = count;
        }
      });
      
      return mostCommonType;
    }
    
    // Default to car if no history
    return 'CAR';
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
    <Paper elevation={3} sx={{ p: 3, maxWidth: 600, mx: 'auto', mt: 4 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Tiket Parkir
        </Typography>

        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={handleGenerateTicket}
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
            'Get Ticket'
          )}
        </Button>
        
        <Snackbar 
          open={!!error} 
          autoHideDuration={6000} 
          onClose={() => setError(null)}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        </Snackbar>
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
                Waktu Masuk: {ticket ? formatDate(new Date(ticket.entryTime)) : '-'}
              </Typography>

              <Box ref={barcodeContainerRef} sx={{ mt: 2, mb: 1, textAlign: 'center' }}>
                <canvas ref={barcodeRef} id="barcodeCanvas" style={{ maxWidth: '100%' }}></canvas>
              </Box>

              {vehicleHistory.length > 0 && (
                <Box sx={{ mt: 2, pt: 2, borderTop: '1px dashed #ccc' }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Riwayat Kendaraan:
                  </Typography>
                  {vehicleHistory.slice(0, 3).map((entry, index) => (
                    <Typography key={index} variant="caption" display="block" color="textSecondary">
                      {formatDate(new Date(entry.entryTime))} - {entry.vehicleType}
                    </Typography>
                  ))}
                </Box>
              )}
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
    </Paper>
  );
};

export default TicketGenerator;
