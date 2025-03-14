import React, { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import {
  Box,
  Button,
  Grid,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { PhotoCamera, Refresh, FlipCameraIos } from '@mui/icons-material';

interface SimpleCameraCaptureProps {
  onCapture?: (imageSrc: string) => void;
  aspectRatio?: '1:1' | '4:3' | '16:9';
  showControls?: boolean;
}

const SimpleCameraCapture: React.FC<SimpleCameraCaptureProps> = ({
  onCapture,
  aspectRatio = '4:3',
  showControls = true,
}) => {
  const webcamRef = useRef<Webcam>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Configurar dimensiones basadas en la relación de aspecto
  const getDimensions = () => {
    switch (aspectRatio) {
      case '1:1': return { width: 360, height: 360 };
      case '16:9': return { width: 640, height: 360 };
      case '4:3':
      default: return { width: 480, height: 360 };
    }
  };

  const dimensions = getDimensions();

  // Obtener la lista de cámaras disponibles
  useEffect(() => {
    const getDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        
        setDevices(videoDevices);
        
        // Seleccionar la primera cámara disponible
        if (videoDevices.length > 0 && !selectedDeviceId) {
          // Intentar encontrar la cámara trasera primero
          const backCamera = videoDevices.find(device => 
            device.label.toLowerCase().includes('back') || 
            device.label.toLowerCase().includes('trasera') ||
            device.label.toLowerCase().includes('rear'));
          
          setSelectedDeviceId(backCamera?.deviceId || videoDevices[0].deviceId);
        }
      } catch (error) {
        console.error('Error accediendo a las cámaras:', error);
        setCameraError('No se pudo acceder a la cámara. Por favor, verifique los permisos.');
      }
    };

    getDevices();
  }, []);

  // Capturar foto
  const capturePhoto = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setCapturedImage(imageSrc);
        if (onCapture) {
          onCapture(imageSrc);
        }
      }
    }
  };

  // Reiniciar captura
  const resetCapture = () => {
    setCapturedImage(null);
  };

  // Cambiar de cámara
  const handleDeviceChange = (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    // Reiniciar la captura al cambiar de cámara
    resetCapture();
  };

  // Cambiar a la siguiente cámara disponible
  const switchCamera = () => {
    if (devices.length > 1) {
      const currentIndex = devices.findIndex(d => d.deviceId === selectedDeviceId);
      const nextIndex = (currentIndex + 1) % devices.length;
      setSelectedDeviceId(devices[nextIndex].deviceId);
      resetCapture();
    }
  };

  const videoConstraints = {
    width: dimensions.width,
    height: dimensions.height,
    deviceId: selectedDeviceId,
    facingMode: "environment", // Intenta usar la cámara trasera por defecto
  };

  return (
    <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
      <Grid container spacing={2} justifyContent="center">
        {/* Área de la cámara o la imagen capturada */}
        <Grid item xs={12} sx={{ textAlign: 'center' }}>
          <Box
            sx={{
              width: dimensions.width,
              height: dimensions.height,
              margin: '0 auto',
              overflow: 'hidden',
              position: 'relative',
              borderRadius: 1,
              border: '1px solid #ddd',
            }}
          >
            {!capturedImage ? (
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={videoConstraints}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
                mirrored={videoConstraints.facingMode === "user"}
              />
            ) : (
              <img
                src={capturedImage}
                alt="Captured"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            )}
            
            {cameraError && (
              <Box sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(0,0,0,0.7)',
                color: 'white',
                padding: 2,
              }}>
                <Typography variant="body1">{cameraError}</Typography>
              </Box>
            )}
          </Box>
        </Grid>

        {showControls && (
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              {!capturedImage ? (
                <>
                  {/* Botón para tomar foto */}
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<PhotoCamera />}
                    onClick={capturePhoto}
                    disabled={!!cameraError}
                  >
                    Tomar Foto
                  </Button>
                  
                  {/* Botón para cambiar cámara */}
                  {devices.length > 1 && (
                    <Button
                      variant="outlined"
                      startIcon={<FlipCameraIos />}
                      onClick={switchCamera}
                      disabled={!!cameraError}
                    >
                      Cambiar Cámara
                    </Button>
                  )}
                  
                  {/* Selector de cámara */}
                  {devices.length > 0 && (
                    <FormControl sx={{ minWidth: 200 }}>
                      <InputLabel>Seleccionar Cámara</InputLabel>
                      <Select
                        value={selectedDeviceId}
                        label="Seleccionar Cámara"
                        onChange={(e) => handleDeviceChange(e.target.value as string)}
                        disabled={!!cameraError}
                      >
                        {devices.map((device) => (
                          <MenuItem key={device.deviceId} value={device.deviceId}>
                            {device.label || `Cámara ${devices.indexOf(device) + 1}`}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                </>
              ) : (
                <>
                  {/* Botón para tomar otra foto */}
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<Refresh />}
                    onClick={resetCapture}
                  >
                    Tomar Otra Foto
                  </Button>
                </>
              )}
            </Box>
          </Grid>
        )}
      </Grid>
    </Paper>
  );
};

export default SimpleCameraCapture; 