import React, { useRef, useCallback, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import {
  Box,
  Button,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  LinearProgress,
  Switch,
  FormControlLabel,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  IconButton
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { PhotoCamera, Cameraswitch, SettingsBackupRestore } from '@mui/icons-material';
import { detectLicensePlate } from '../services/ocr';
import { cameraConfigService, IPCameraConfig, DEFAULT_WEBCAM } from '../services/cameraConfig';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  position: 'relative',
}));

const WebcamContainer = styled(Box)({
  position: 'relative',
  width: '100%',
  maxWidth: '640px',
  margin: '0 auto',
});

const ControlsContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(1),
  marginTop: theme.spacing(1),
  justifyContent: 'center',
  flexWrap: 'wrap',
}));

const GuideOverlay = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '80%',
  height: '30%',
  border: `2px solid ${theme.palette.primary.main}`,
  borderRadius: theme.shape.borderRadius,
  pointerEvents: 'none',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: '-20px',
    left: '50%',
    transform: 'translateX(-50%)',
    borderLeft: '10px solid transparent',
    borderRight: '10px solid transparent',
    borderBottom: `10px solid ${theme.palette.primary.main}`,
  },
}));

// Random plate numbers for simulation
const SAMPLE_PLATES = [
  'B1234CD', 'D5678EF', 'F9012GH', 'A2468BD', 'H1357IJ',
  'AB123CD', 'DE456FG', 'GH789IJ', 'JK012LM', 'NO345PQ'
];

// Mock confidence levels for simulation
const CONFIDENCE_LEVELS = [68, 75, 82, 88, 90, 94, 97, 99];

interface WebcamCaptureProps {
  onPlateDetected?: (plate: string, confidence: number, imageSrc: string) => void;
  autoDetect?: boolean;
  initialCamera?: string;
}

export const WebcamCapture: React.FC<WebcamCaptureProps> = ({
  onPlateDetected,
  autoDetect = false,
  initialCamera = 'local'
}) => {
  const [image, setImage] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [confidence, setConfidence] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [autoScan, setAutoScan] = useState(true); // Enable auto scanning by default
  const [lastDetectionTime, setLastDetectionTime] = useState(0);
  const [licensePlate, setLicensePlate] = useState<string | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout>();
  const webcamRef = useRef<Webcam>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedCamera, setSelectedCamera] = useState<string>(initialCamera);
  const [availableCameras, setAvailableCameras] = useState<IPCameraConfig[]>([]);
  const [ipCameraUrl, setIpCameraUrl] = useState<string>('');
  const [useFallbackPlayer, setUseFallbackPlayer] = useState<boolean>(false);

  // Load camera configurations
  useEffect(() => {
    const ipCameras = cameraConfigService.getConfigs().filter(c => c.enabled);
    setAvailableCameras(ipCameras);
    
    // If an IP camera is selected, set its URL
    if (selectedCamera !== 'local') {
      const selectedConfig = ipCameras.find(c => c.id === selectedCamera);
      if (selectedConfig) {
        setIpCameraUrl(cameraConfigService.formatCameraUrl(selectedConfig));
      }
    } else {
      setIpCameraUrl('');
    }
  }, [selectedCamera]);

  // Get available webcam devices
  useEffect(() => {
    const getDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        setDevices(videoDevices);
      } catch (err) {
        console.error('Error getting media devices:', err);
        setError('Failed to access camera devices. Please check permissions.');
      }
    };

    getDevices();
  }, []);

  // Set up auto-scanning
  useEffect(() => {
    if (autoScan && autoDetect) {
      scanIntervalRef.current = setInterval(async () => {
        if (!isProcessing && Date.now() - lastDetectionTime > 2000) {
          const imageSrc = webcamRef.current?.getScreenshot();
          if (imageSrc) {
            setIsProcessing(true);
            const success = await processImage(imageSrc);
            setIsProcessing(false);
             
            // If license plate detected successfully, notify the parent component
            if (success) {
              // This will automatically process the entry
              console.log('License plate detected and processed automatically');
            }
          }
        }
      }, 1000);
    } else {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    }

    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    };
  }, [autoScan, isProcessing, lastDetectionTime, autoDetect]);

  // Take a screenshot from the webcam
  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setImage(imageSrc);
      processImage(imageSrc);
    }
  }, []);

  // Mock license plate recognition
  // In a real implementation, you would call an ALPR API or use a local library
  const processImage = async (imageSrc: string): Promise<boolean> => {
    setIsProcessing(true);
    setLicensePlate(null);
    setConfidence(null);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demonstration purposes, generate random plate
      // In a real app, you would call an ALPR API or TensorFlow model
      const randomPlate = SAMPLE_PLATES[Math.floor(Math.random() * SAMPLE_PLATES.length)];
      const randomConfidence = CONFIDENCE_LEVELS[Math.floor(Math.random() * CONFIDENCE_LEVELS.length)];
      
      setLicensePlate(randomPlate);
      setConfidence(randomConfidence);
      setImage(imageSrc);
      setLastDetectionTime(Date.now());
      
      // Notify parent component if confidence is high enough
      if (randomConfidence >= 75 && onPlateDetected) {
        onPlateDetected(randomPlate, randomConfidence, imageSrc);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error processing image:', error);
      setError('Failed to process image');
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeviceChange = (deviceId: string) => {
    setSelectedDeviceId(deviceId);
  };

  const toggleAutoScan = () => {
    setAutoScan(prev => !prev);
  };

  const resetCapture = () => {
    setImage(null);
    setLicensePlate(null);
    setConfidence(null);
    setError(null);
  };

  // IP camera media constraints
  const getVideoConstraints = () => {
    if (selectedCamera === 'local') {
      // Use the first available device or the default
      const deviceId = devices.length > 0 ? devices[0].deviceId : undefined;
      return {
        width: 1280,
        height: 720,
        deviceId,
        facingMode: "environment"
      };
    }
    return false; // Not used for IP cameras
  };

  return (
    <Box sx={{ width: '100%' }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Box sx={{ position: 'relative', mb: 2 }}>
          {/* Camera feed */}
          <Paper 
            elevation={3} 
            sx={{ 
              overflow: 'hidden', 
              position: 'relative',
              width: '100%',
              maxWidth: '100%',
              height: 'auto',
              aspectRatio: '4/3',
            }}
          >
            {selectedCamera === 'local' ? (
              <Webcam
                audio={false}
                ref={webcamRef}
                videoConstraints={getVideoConstraints()}
                screenshotFormat="image/jpeg"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : ipCameraUrl && !useFallbackPlayer ? (
              // IP Camera stream - using img for MJPEG or http
              <Box sx={{ width: '100%', minHeight: '300px', backgroundColor: '#000', position: 'relative' }}>
                {(() => {
                  const selectedConfig = availableCameras.find(c => c.id === selectedCamera);
                  if (selectedConfig?.type === 'mjpeg' || selectedConfig?.type === 'http') {
                    return (
                      <img 
                        src={`${ipCameraUrl}${ipCameraUrl.includes('?') ? '&' : '?'}t=${Date.now()}`}
                        alt="IP Camera Feed" 
                        style={{ width: '100%', height: 'auto' }}
                        onError={() => setUseFallbackPlayer(true)}
                      />
                    );
                  } else if (selectedConfig?.type === 'rtsp') {
                    // For RTSP, we need a player that supports it (not directly supported in browser)
                    return (
                      <Box sx={{ p: 2, textAlign: 'center' }}>
                        <Typography>
                          RTSP streams require a specialized player. 
                        </Typography>
                        <Button 
                          variant="outlined" 
                          onClick={() => setUseFallbackPlayer(true)}
                          sx={{ mt: 1 }}
                        >
                          Use Fallback Player
                        </Button>
                      </Box>
                    );
                  }
                  return (
                    <Typography sx={{ p: 2, color: 'white' }}>
                      Unsupported camera type
                    </Typography>
                  );
                })()}
              </Box>
            ) : (
              // Fallback for unsupported IP camera types
              <Box sx={{ 
                width: '100%', 
                minHeight: '300px', 
                backgroundColor: '#222', 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                flexDirection: 'column'
              }}>
                <Typography variant="body1" color="white" gutterBottom>
                  Cannot display this camera feed directly in browser.
                </Typography>
                <Typography variant="caption" color="gray">
                  IP camera feeds may require server-side processing or special plugins.
                </Typography>
                <Button 
                  variant="outlined" 
                  color="primary" 
                  sx={{ mt: 2 }}
                  onClick={() => {
                    // Capture still image for processing
                    const timestamp = Date.now();
                    const imageUrl = `${ipCameraUrl}${ipCameraUrl.includes('?') ? '&' : '?'}t=${timestamp}`;
                    
                    // Create an image element to load the snapshot
                    const img = new Image();
                    img.crossOrigin = 'anonymous';
                    img.onload = () => {
                      // Create a canvas to get the image data
                      const canvas = document.createElement('canvas');
                      canvas.width = img.width;
                      canvas.height = img.height;
                      const ctx = canvas.getContext('2d');
                      if (ctx) {
                        ctx.drawImage(img, 0, 0);
                        const dataUrl = canvas.toDataURL('image/jpeg');
                        setImage(dataUrl);
                        processImage(dataUrl);
                      }
                    };
                    img.onerror = () => {
                      setError('Failed to load image from camera');
                    };
                    img.src = imageUrl;
                  }}
                >
                  Capture Snapshot
                </Button>
              </Box>
            )}
            
            {/* Processing indicator */}
            {isProcessing && (
              <Box sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
              }}>
                <CircularProgress color="primary" />
              </Box>
            )}
          </Paper>
          
          {/* Captured image */}
          {image && !autoDetect && (
            <Paper 
              elevation={3} 
              sx={{ 
                mt: 2,
                overflow: 'hidden',
                width: '100%',
                maxWidth: '100%',
                height: 'auto',
                aspectRatio: '4/3',
                position: 'relative'
              }}
            >
              <img 
                src={image} 
                alt="Captured" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
              
              {/* Display detected license plate */}
              {licensePlate && (
                <Box sx={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  p: 1,
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  color: 'white',
                  textAlign: 'center'
                }}>
                  <Typography variant="h6">{licensePlate}</Typography>
                  <Typography variant="body2">
                    Confidence: {confidence}%
                  </Typography>
                </Box>
              )}
            </Paper>
          )}
        </Box>
        
        {/* Controls */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%', maxWidth: '100%' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
            <FormControl sx={{ minWidth: 150, flex: 1 }} size="small">
              <InputLabel id="camera-select-label">Camera</InputLabel>
              <Select
                labelId="camera-select-label"
                value={selectedCamera}
                label="Camera"
                onChange={(e) => setSelectedCamera(e.target.value as string)}
                disabled={isProcessing}
              >
                <MenuItem value="local">{DEFAULT_WEBCAM.name}</MenuItem>
                {availableCameras.map((camera) => (
                  <MenuItem key={camera.id} value={camera.id}>
                    {camera.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
            {!autoDetect && (
              <Button 
                variant="contained" 
                color="primary" 
                onClick={capture}
                disabled={isProcessing || !selectedCamera}
                startIcon={<PhotoCamera />}
                sx={{ flex: 1 }}
              >
                Capture
              </Button>
            )}
            
            <Button
              variant={autoScan ? "contained" : "outlined"}
              color={autoScan ? "success" : "primary"}
              onClick={toggleAutoScan}
              disabled={isProcessing || !selectedCamera || !autoDetect}
              sx={{ flex: 1 }}
            >
              {autoScan ? "Auto-Scan On" : "Auto-Scan Off"}
            </Button>
            
            {!autoDetect && image && (
              <IconButton 
                color="secondary" 
                onClick={resetCapture}
                disabled={isProcessing}
              >
                <SettingsBackupRestore />
              </IconButton>
            )}
          </Box>
        </Box>
      </Box>
      
      {/* Results display for manual mode */}
      {!autoDetect && licensePlate && (
        <Paper sx={{ p: 2, mt: 2 }}>
          <Typography variant="h6">
            Detected License Plate: {licensePlate}
          </Typography>
          <Typography variant="body1">
            Confidence: {confidence}%
          </Typography>
          {confidence && confidence < 75 && (
            <Alert severity="warning" sx={{ mt: 1 }}>
              Low confidence detection. Try again with better lighting or positioning.
            </Alert>
          )}
        </Paper>
      )}
    </Box>
  );
}; 