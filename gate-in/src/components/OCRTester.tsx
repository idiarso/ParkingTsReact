import React, { useState } from 'react';
import {
  Paper,
  Typography,
  Box,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Divider
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { testOCRSystem, TestResult, TestSummary } from '../utils/testOCR';

export const OCRTester: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [summary, setSummary] = useState<TestSummary | null>(null);

  const runTests = async () => {
    setLoading(true);
    try {
      const { results: testResults, summary: testSummary } = await testOCRSystem();
      setResults(testResults);
      setSummary(testSummary);
    } catch (error) {
      console.error('Error running tests:', error);
    }
    setLoading(false);
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5">OCR System Test Results</Typography>
        <Button
          variant="contained"
          onClick={runTests}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : undefined}
        >
          {loading ? 'Running Tests...' : 'Run Tests'}
        </Button>
      </Box>

      {summary && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>Summary</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Overall Results</Typography>
                  <Typography>Total Tests: {summary.total}</Typography>
                  <Typography>Passed: {summary.passed}</Typography>
                  <Typography>Failed: {summary.failed}</Typography>
                  <Typography>Accuracy: {summary.accuracy.toFixed(2)}%</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Variation Results</Typography>
                  {summary.variationResults.map((vr, index) => (
                    <Box key={index} sx={{ mb: 1 }}>
                      <Typography variant="subtitle2">{vr.variation.description}</Typography>
                      <Typography variant="body2">
                        Accuracy: {vr.accuracy.toFixed(2)}% ({vr.passed}/{vr.total})
                      </Typography>
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {results.length > 0 && (
        <Box>
          <Typography variant="h6" gutterBottom>Detailed Results</Typography>
          {results.map((result, index) => (
            <Accordion key={index}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                  <Typography>
                    {result.plate.text} - {result.variation.description}
                  </Typography>
                  <Chip
                    label={result.passed ? 'Passed' : 'Failed'}
                    color={result.passed ? 'success' : 'error'}
                    size="small"
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    {result.imageUrl && (
                      <Card>
                        <CardMedia
                          component="img"
                          image={result.imageUrl}
                          alt={`Test plate: ${result.plate.text}`}
                          sx={{ height: 100, objectFit: 'contain' }}
                        />
                      </Card>
                    )}
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2">Expected:</Typography>
                    <Typography>Text: {result.plate.text}</Typography>
                    <Typography>Type: {result.plate.expectedType}</Typography>
                    <Typography>Color: {result.plate.expectedColor}</Typography>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="subtitle2">Result:</Typography>
                    <Typography>Text: {result.result.text}</Typography>
                    <Typography>Type: {result.result.plateType}</Typography>
                    <Typography>Color: {result.result.color}</Typography>
                    <Typography>Confidence: {result.result.confidence}%</Typography>
                    {result.errors.length > 0 && (
                      <>
                        <Typography variant="subtitle2" color="error" sx={{ mt: 1 }}>
                          Errors:
                        </Typography>
                        {result.errors.map((error, i) => (
                          <Typography key={i} color="error" variant="body2">
                            • {error}
                          </Typography>
                        ))}
                      </>
                    )}
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}
    </Paper>
  );
}; 