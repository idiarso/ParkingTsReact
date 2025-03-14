import React, { useState, useRef, useEffect } from 'react';
import { Box, Button, Typography, Paper, Grid, CircularProgress } from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import RefreshIcon from '@mui/icons-material/Refresh';
import Webcam from 'react-webcam';
import cameraService, { CameraType } from '../services/cameraService';

interface CameraPreviewProps {
  onImageCapture?: (imageUrl: string | null) => void;
  initialImage?: string | null;
}

const CameraPreview: React.FC<CameraPreviewProps> = ({ onImageCapture, initialImage }) => {
  const webcamRef = useRef<Webcam>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(initialImage || null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(true);

  // Inisialisasi kamera saat komponen dimount
  useEffect(() => {
    cameraService.init(webcamRef);

    // Event listener untuk snapshot dari kamera IP
    const handleSnapshot = (imageUrl: string) => {
      setCapturedImage(imageUrl);
      if (onImageCapture) {
        onImageCapture(imageUrl);
      }
    };

    // Event listener untuk error
    const handleError = (error: Error) => {
      console.error('Camera error:', error);
      setErrorMessage(error.message);
    };

    // Subscribe to events
    cameraService.on('snapshot', handleSnapshot);
    cameraService.on('error', handleError);

    // Cleanup
    return () => {
      cameraService.off('snapshot', handleSnapshot);
      cameraService.off('error', handleError);
    };
  }, [onImageCapture]);

  // Capture image from camera
  const handleCapture = async () => {
    setIsCapturing(true);
    setErrorMessage(null);
    
    try {
      const imageUrl = await cameraService.captureVehicleImage();
      
      setCapturedImage(imageUrl);
      
      if (onImageCapture) {
        onImageCapture(imageUrl);
      }
    } catch (error) {
      console.error('Failed to capture image:', error);
      setErrorMessage('Gagal mengambil gambar. Silakan coba lagi.');
    } finally {
      setIsCapturing(false);
    }
  };

  // Reset/clear captured image
  const handleReset = () => {
    setCapturedImage(null);
    setCameraActive(true);
    if (onImageCapture) {
      onImageCapture(null);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Kamera
      </Typography>
      
      <Grid container spacing={2}>
        {/* Live Camera View */}
        <Grid item xs={12} md={6}>
          <Box 
            sx={{ 
              position: 'relative',
              height: 240,
              border: '1px solid #ccc',
              borderRadius: 1,
              overflow: 'hidden',
              display: capturedImage && !cameraActive ? 'none' : 'block'
            }}
          >
            <Webcam
              ref={webcamRef}
              audio={false}
              width="100%"
              height={240}
              screenshotFormat="image/jpeg"
              videoConstraints={{
                width: 640,
                height: 480,
                facingMode: "environment"
              }}
            />
            <Typography 
              variant="caption" 
              sx={{ 
                position: 'absolute', 
                top: 5, 
                right: 5, 
                backgroundColor: 'rgba(0,0,0,0.5)',
                color: 'white',
                px: 1,
                py: 0.5,
                borderRadius: 1
              }}
            >
              LIVE
            </Typography>
          </Box>
        </Grid>
        
        {/* Captured Image Preview */}
        <Grid item xs={12} md={6}>
          <Box 
            sx={{ 
              height: 240,
              border: '1px solid #ccc',
              borderRadius: 1,
              overflow: 'hidden',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: '#f5f5f5'
            }}
          >
            {capturedImage ? (
              <img 
                src={capturedImage} 
                alt="Captured" 
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '100%', 
                  objectFit: 'contain' 
                }} 
              />
            ) : (
              <Typography 
                variant="body2" 
                color="textSecondary"
                sx={{ p: 2, textAlign: 'center' }}
              >
                Belum ada gambar yang diambil
              </Typography>
            )}
          </Box>
        </Grid>
        
        {/* Buttons */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 1 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<PhotoCameraIcon />}
              onClick={handleCapture}
              disabled={isCapturing}
              sx={{ minWidth: 150 }}
            >
              {isCapturing ? (
                <>
                  <CircularProgress size={24} sx={{ mr: 1, color: 'white' }} />
                  Mengambil...
                </>
              ) : (
                'Ambil Foto'
              )}
            </Button>
            
            {capturedImage && (
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<RefreshIcon />}
                onClick={handleReset}
                sx={{ minWidth: 150 }}
              >
                Reset
              </Button>
            )}
          </Box>
        </Grid>
        
        {/* Error Message */}
        {errorMessage && (
          <Grid item xs={12}>
            <Typography color="error" variant="body2">
              Error: {errorMessage}
            </Typography>
          </Grid>
        )}
      </Grid>
    </Paper>
  );
};

export default CameraPreview; 