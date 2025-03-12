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
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { PhotoCamera, Cameraswitch } from '@mui/icons-material';
import { detectLicensePlate } from '../services/ocr';

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

interface WebcamCaptureProps {
  onCapture: (plateNumber: string) => void;
}

export const WebcamCapture: React.FC<WebcamCaptureProps> = ({ onCapture }) => {
  const webcamRef = useRef<Webcam>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState<string>();
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [autoScan, setAutoScan] = useState(false);
  const [lastDetectionTime, setLastDetectionTime] = useState(0);
  const scanIntervalRef = useRef<NodeJS.Timeout>();

  // Sound effects
  const successSound = useRef(new Audio('/sounds/success.mp3'));
  const errorSound = useRef(new Audio('/sounds/error.mp3'));

  const handleDevices = useCallback((mediaDevices: MediaDeviceInfo[]) => {
    const videoDevices = mediaDevices.filter(({ kind }) => kind === 'videoinput');
    setDevices(videoDevices);
    if (videoDevices.length > 0 && !deviceId) {
      setDeviceId(videoDevices[0].deviceId);
    }
  }, [deviceId]);

  useEffect(() => {
    navigator.mediaDevices.enumerateDevices()
      .then(handleDevices)
      .catch(() => setError('Failed to access camera devices'));
  }, [handleDevices]);

  const switchCamera = useCallback(() => {
    const currentIndex = devices.findIndex(device => device.deviceId === deviceId);
    const nextIndex = (currentIndex + 1) % devices.length;
    setDeviceId(devices[nextIndex].deviceId);
  }, [devices, deviceId]);

  const processImage = async (imageSrc: string) => {
    try {
      const result = await detectLicensePlate(imageSrc);
      
      if (result.isValid && result.text) {
        if (result.confidence > 0.85) {
          successSound.current.play();
          onCapture(result.text);
          setConfidence(result.confidence);
          setLastDetectionTime(Date.now());
          return true;
        }
      } else {
        setError(result.validationErrors.join(', ') || 'Failed to detect license plate');
        errorSound.current.play();
      }
    } catch (err) {
      setError('Failed to process image. Please try again or enter manually.');
      errorSound.current.play();
    }
    return false;
  };

  const captureImage = useCallback(async () => {
    try {
      setIsProcessing(true);
      setError(null);
      setConfidence(null);
      
      const imageSrc = webcamRef.current?.getScreenshot();
      if (!imageSrc) {
        throw new Error('Failed to capture image');
      }

      await processImage(imageSrc);
    } finally {
      setIsProcessing(false);
    }
  }, [onCapture]);

  // Auto-scanning functionality
  useEffect(() => {
    if (autoScan) {
      scanIntervalRef.current = setInterval(async () => {
        if (!isProcessing && Date.now() - lastDetectionTime > 2000) {
          const imageSrc = webcamRef.current?.getScreenshot();
          if (imageSrc) {
            setIsProcessing(true);
            await processImage(imageSrc);
            setIsProcessing(false);
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
  }, [autoScan, isProcessing, lastDetectionTime]);

  const videoConstraints = {
    width: 1280,
    height: 720,
    deviceId,
    facingMode: 'environment',
  };

  return (
    <StyledPaper>
      <Typography variant="h6" gutterBottom align="center">
        License Plate Scanner
      </Typography>
      
      <WebcamContainer>
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          videoConstraints={videoConstraints}
          style={{ width: '100%', borderRadius: '4px' }}
        />
        <GuideOverlay />
        {isProcessing && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              borderRadius: '4px',
            }}
          >
            <CircularProgress color="primary" />
          </Box>
        )}
      </WebcamContainer>

      {confidence !== null && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Detection Confidence
          </Typography>
          <LinearProgress
            variant="determinate"
            value={confidence * 100}
            color={confidence > 0.9 ? 'success' : confidence > 0.7 ? 'warning' : 'error'}
          />
          <Typography variant="caption" color="textSecondary">
            {Math.round(confidence * 100)}%
          </Typography>
        </Box>
      )}

      <ControlsContainer>
        <FormControlLabel
          control={
            <Switch
              checked={autoScan}
              onChange={(e) => setAutoScan(e.target.checked)}
              disabled={isProcessing}
            />
          }
          label="Auto Scan"
        />
        <Button
          variant="contained"
          startIcon={<PhotoCamera />}
          onClick={captureImage}
          disabled={isProcessing || autoScan}
        >
          Capture Plate
        </Button>
        {devices.length > 1 && (
          <Button
            variant="outlined"
            startIcon={<Cameraswitch />}
            onClick={switchCamera}
            disabled={isProcessing}
          >
            Switch Camera
          </Button>
        )}
      </ControlsContainer>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      <Typography variant="body2" color="textSecondary" sx={{ mt: 2, textAlign: 'center' }}>
        Position the license plate within the guide box for best results
      </Typography>
    </StyledPaper>
  );
}; 