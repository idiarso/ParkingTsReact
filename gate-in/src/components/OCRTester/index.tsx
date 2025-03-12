import React, { useState } from 'react';
import { Box, Button, Typography, Paper } from '@mui/material';
import { detectLicensePlate } from '../../services/ocr';
import { WebcamCapture } from '../WebcamCapture';

export const OCRTester: React.FC = () => {
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePlateDetected = async (plate: string, confidence: number, imageSrc: string) => {
    try {
      setError(null);
      const ocrResult = await detectLicensePlate(imageSrc);
      setResult(JSON.stringify(ocrResult, null, 2));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process image');
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Webcam Capture
        </Typography>
        <WebcamCapture onPlateDetected={handlePlateDetected} autoDetect={false} />
      </Paper>

      {error && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: 'error.light' }}>
          <Typography color="error">{error}</Typography>
        </Paper>
      )}

      {result && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            OCR Result
          </Typography>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{result}</pre>
        </Paper>
      )}
    </Box>
  );
}; 