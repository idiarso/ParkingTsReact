import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Container,
  Grid,
  Divider,
  CircularProgress,
  IconButton
} from '@mui/material';
import { 
  Print as PrintIcon, 
  ArrowBack as ArrowBackIcon,
  QrCode2 as QrCodeIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import JsBarcode from 'jsbarcode';
import { useNavigate } from 'react-router-dom';

// CSS untuk print
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
      padding: 5mm !important;
      margin: 0 !important;
    }
    #barcode-container {
      display: block !important;
      margin: 5mm auto !important;
    }
    .no-print {
      display: none !important;
    }
    .ticket-header {
      font-size: 14pt !important;
      text-align: center !important;
      margin-bottom: 3mm !important;
    }
    .ticket-info {
      font-size: 9pt !important;
      margin-bottom: 1mm !important;
    }
  }
`;

// Format tanggal Indonesia
const formatDate = (dateString: string) => {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  };
  return new Date(dateString).toLocaleDateString('id-ID', options);
};

// Format jenis kendaraan
const formatVehicleType = (type: string) => {
  switch (type.toLowerCase()) {
    case 'car': return 'Mobil';
    case 'motorcycle': return 'Motor';
    case 'truck': return 'Truk';
    default: return type;
  }
};

const TicketPreview: React.FC = () => {
  const [ticketData, setTicketData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const barcodeRef = useRef<HTMLCanvasElement>(null);
  const ticketRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      // Get the ticket data from localStorage
      const storedTicket = localStorage.getItem('lastTicketData');
      console.log("Checking for stored ticket data:", storedTicket);
      
      if (storedTicket) {
        const parsedTicket = JSON.parse(storedTicket);
        console.log("Retrieved ticket data:", parsedTicket);
        if (!parsedTicket.ticketId) {
          console.error("Invalid ticket data - missing ticketId:", parsedTicket);
          setError('Data tiket tidak valid (ticketId tidak ditemukan)');
        } else {
          setTicketData(parsedTicket);
        }
      } else {
        console.error("No ticket data found in localStorage");
        setError('Tidak ada data tiket yang tersedia');
      }
    } catch (err) {
      console.error('Error loading ticket data:', err);
      setError('Terjadi kesalahan saat memuat data tiket');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (ticketData && barcodeRef.current) {
      try {
        const ticketId = ticketData.ticketId || "NO-ID";
        console.log("Generating barcode for ticketId:", ticketId);
        
        // Clear any previous barcode
        const context = barcodeRef.current.getContext('2d');
        if (context) {
          context.clearRect(0, 0, barcodeRef.current.width, barcodeRef.current.height);
        }

        // Generate barcode using a more reliable format for thermal printers
        JsBarcode(barcodeRef.current, ticketId, {
          format: "CODE39",
          width: 1.5,
          height: 40,
          displayValue: true,
          font: "monospace",
          fontSize: 12,
          textMargin: 2,
          textAlign: "center",
          background: "#ffffff"
        });
        
        console.log("Barcode generated successfully for:", ticketId);
      } catch (err) {
        console.error('Error generating barcode:', err, ticketData);
        // Continue without barcode but show error
        setError('Gagal membuat barcode. Tiket akan dicetak tanpa barcode.');
      }
    } else {
      console.log("Not generating barcode - ticketData or barcodeRef unavailable", 
        { hasTicketData: !!ticketData, hasBarcodeRef: !!barcodeRef.current });
    }
  }, [ticketData]);

  const handlePrint = () => {
    const style = document.createElement('style');
    style.innerHTML = printStyles;
    document.head.appendChild(style);
    
    setTimeout(() => {
      window.print();
      
      // Clean up after printing
      setTimeout(() => {
        document.head.removeChild(style);
      }, 500);
    }, 200);
  };

  const handleBack = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Memuat data tiket...
        </Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="error" gutterBottom>
            Error
          </Typography>
          <Typography variant="body1">{error}</Typography>
          <Button 
            variant="contained" 
            color="primary" 
            sx={{ mt: 2 }} 
            onClick={handleBack}
            startIcon={<ArrowBackIcon />}
          >
            Kembali
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column' }}>
            {/* Ticket Preview */}
            <div ref={ticketRef} className="print-section">
              <Box 
                sx={{ 
                  border: '1px dashed #ccc', 
                  p: 2, 
                  borderRadius: 1,
                  backgroundColor: '#fff',
                  maxWidth: '250px',
                  mx: 'auto'
                }}
              >
                <Typography className="ticket-header" variant="h6" align="center" gutterBottom fontWeight="bold">
                  TIKET PARKIR
                </Typography>
                <Divider sx={{ my: 1 }} />
                
                <Box id="barcode-container" sx={{ my: 2, textAlign: 'center' }}>
                  <canvas ref={barcodeRef} />
                </Box>
                
                <Divider sx={{ my: 1 }} />
                
                <Typography className="ticket-info" variant="body2">
                  <strong>Nomor Plat:</strong> {ticketData?.plateNumber || '-'}
                </Typography>
                
                <Typography className="ticket-info" variant="body2">
                  <strong>Jenis Kendaraan:</strong> {formatVehicleType(ticketData?.vehicleType || '')}
                </Typography>
                
                {ticketData?.driverName && (
                  <Typography className="ticket-info" variant="body2">
                    <strong>Pengemudi:</strong> {ticketData.driverName}
                  </Typography>
                )}
                
                {ticketData?.phoneNumber && (
                  <Typography className="ticket-info" variant="body2">
                    <strong>Telepon:</strong> {ticketData.phoneNumber}
                  </Typography>
                )}
                
                <Typography className="ticket-info" variant="body2">
                  <strong>Waktu Masuk:</strong> {formatDate(ticketData?.entryTime || new Date().toISOString())}
                </Typography>
                
                <Typography className="ticket-info" variant="body2">
                  <strong>ID Tiket:</strong> {ticketData?.ticketId || '-'}
                </Typography>
                
                <Divider sx={{ my: 1 }} />
                
                <Typography variant="caption" align="center" display="block" sx={{ mt: 1 }}>
                  Simpan tiket ini untuk keluar
                </Typography>
              </Box>
            </div>
          </Grid>
          
          <Grid item xs={12} md={6} className="no-print">
            <Typography variant="h5" gutterBottom>
              Tiket Parkir
            </Typography>
            
            <Typography variant="body1" paragraph>
              Tiket parkir berhasil dibuat. Silakan cetak tiket ini untuk diberikan kepada pengendara.
            </Typography>
            
            <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button 
                variant="contained" 
                color="primary" 
                fullWidth
                startIcon={<PrintIcon />}
                onClick={handlePrint}
              >
                Cetak Tiket
              </Button>
              
              <Button 
                variant="outlined"
                color="primary"
                fullWidth
                startIcon={<ArrowBackIcon />}
                onClick={handleBack}
              >
                Kembali
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default TicketPreview; 