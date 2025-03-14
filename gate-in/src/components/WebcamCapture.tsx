import React, { useRef, useState, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import {
  Box,
  Button,
  Paper,
  Typography,
  Alert,
  LinearProgress,
  Switch,
  FormControlLabel,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Grid
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { PhotoCamera, Videocam, VideocamOff, SettingsBackupRestore } from '@mui/icons-material';
import { detectLicensePlate } from '../services/ocr';
import { cameraConfigService, type IPCameraConfig } from '../services/cameraConfig';
import { PlateColor } from '../utils/colorDetection';

interface OCRResult {
  text: string;
  confidence: number;
  isValid: boolean;
}

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
  aspectRatio: '4/3',
  backgroundColor: '#000',
  overflow: 'hidden',
  borderRadius: '4px',
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

const LiveIndicator = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 8,
  left: 8,
  display: 'flex',
  alignItems: 'center',
  padding: '4px 8px',
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  borderRadius: '4px',
  color: '#fff',
  gap: '4px',
  '& .dot': {
    width: 8,
    height: 8,
    borderRadius: '50%',
    backgroundColor: theme.palette.error.main,
    animation: 'pulse 1.5s infinite',
  },
  '@keyframes pulse': {
    '0%': {
      opacity: 1,
    },
    '50%': {
      opacity: 0.4,
    },
    '100%': {
      opacity: 1,
    },
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
  const [autoScan, setAutoScan] = useState(autoDetect);
  const [lastDetectionTime, setLastDetectionTime] = useState(0);
  const [licensePlate, setLicensePlate] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(true);
  const scanIntervalRef = useRef<NodeJS.Timeout>();
  const webcamRef = useRef<Webcam>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedCamera] = useState<string>(initialCamera);
  const [availableCameras, setAvailableCameras] = useState<IPCameraConfig[]>([]);
  const [ipCameraUrl, setIpCameraUrl] = useState<string>('');

  const processImage = useCallback(async (imageSrc: string): Promise<boolean> => {
    if (!isCameraActive) return false;
    
    setIsProcessing(true);
    try {
      const result = await detectLicensePlate(imageSrc);
      
      if (result.confidence >= 75 && result.isValid) {
        setLicensePlate(result.text);
        setConfidence(result.confidence);
        setImage(imageSrc);
        setLastDetectionTime(Date.now());
        
        if (onPlateDetected) {
          onPlateDetected(result.text, result.confidence, imageSrc);
        }
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
  }, [onPlateDetected, isCameraActive]);

  // Load camera configurations
  useEffect(() => {
    const ipCameras = cameraConfigService.getConfigs().filter(c => c.enabled);
    setAvailableCameras(ipCameras);
    
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
        
        // Select the first available device if none is selected
        if (videoDevices.length > 0 && !selectedDeviceId) {
          setSelectedDeviceId(videoDevices[0].deviceId);
        }
      } catch (err) {
        console.error('Error getting media devices:', err);
        setError('Failed to access camera devices. Please check permissions.');
      }
    };

    getDevices();
  }, [selectedDeviceId]);

  // Set up auto-scanning
  useEffect(() => {
    if (autoScan && isCameraActive) {
      scanIntervalRef.current = setInterval(async () => {
        if (!isProcessing && Date.now() - lastDetectionTime > 2000) {
          const imageSrc = webcamRef.current?.getScreenshot();
          if (imageSrc) {
            await processImage(imageSrc);
          }
        }
      }, 1000);
    }

    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    };
  }, [autoScan, isProcessing, lastDetectionTime, isCameraActive, processImage]);

  const handleDeviceChange = (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    resetCapture();
  };

  const toggleAutoScan = () => {
    setAutoScan(prev => !prev);
  };

  const toggleCamera = () => {
    setIsCameraActive(prev => !prev);
    if (!isCameraActive) {
      resetCapture();
    }
  };

  const resetCapture = () => {
    setImage(null);
    setLicensePlate(null);
    setConfidence(null);
    setError(null);
  };

  const getVideoConstraints = () => {
    return {
      width: 1280,
      height: 720,
      deviceId: selectedDeviceId,
      facingMode: "environment"
    };
  };

  return (
    <Box sx={{ width: '100%' }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <WebcamContainer>
            {isCameraActive && (
              <>
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  videoConstraints={getVideoConstraints()}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
                <LiveIndicator>
                  <div className="dot" />
                  <Typography variant="caption">LIVE</Typography>
                </LiveIndicator>
                <GuideOverlay />
              </>
            )}
            {!isCameraActive && (
              <Box
                sx={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#1a1a1a',
                }}
              >
                <Typography variant="h6" color="white">
                  Camera Disabled
                </Typography>
              </Box>
            )}
          </WebcamContainer>
        </Grid>

        <Grid item xs={12}>
          <ControlsContainer>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Camera Device</InputLabel>
              <Select
                value={selectedDeviceId}
                label="Camera Device"
                onChange={(e) => handleDeviceChange(e.target.value)}
                disabled={!isCameraActive}
              >
                {devices.map((device) => (
                  <MenuItem key={device.deviceId} value={device.deviceId}>
                    {device.label || `Camera ${device.deviceId}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button
              variant="contained"
              color={isCameraActive ? "primary" : "error"}
              startIcon={isCameraActive ? <Videocam /> : <VideocamOff />}
              onClick={toggleCamera}
            >
              {isCameraActive ? 'Disable Camera' : 'Enable Camera'}
            </Button>

            <FormControlLabel
              control={
                <Switch
                  checked={autoScan}
                  onChange={toggleAutoScan}
                  disabled={!isCameraActive}
                />
              }
              label="Auto Scan"
            />

            <Button
              variant="contained"
              startIcon={<PhotoCamera />}
              onClick={() => {
                const imageSrc = webcamRef.current?.getScreenshot();
                if (imageSrc) processImage(imageSrc);
              }}
              disabled={!isCameraActive || isProcessing}
            >
              Capture
            </Button>

            {image && (
              <Button
                variant="outlined"
                startIcon={<SettingsBackupRestore />}
                onClick={resetCapture}
              >
                Reset
              </Button>
            )}
          </ControlsContainer>
        </Grid>

        {(licensePlate || isProcessing) && (
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              {isProcessing ? (
                <Box sx={{ width: '100%' }}>
                  <LinearProgress />
                  <Typography sx={{ mt: 1 }}>Processing image...</Typography>
                </Box>
              ) : (
                <>
                  <Typography variant="h6" gutterBottom>
                    Detected License Plate: {licensePlate}
                  </Typography>
                  {confidence && (
                    <Typography color="textSecondary">
                      Confidence: {confidence}%
                    </Typography>
                  )}
                </>
              )}
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}; 