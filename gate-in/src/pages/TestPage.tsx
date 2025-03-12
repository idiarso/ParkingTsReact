import React from 'react';
import { Container, Typography } from '@mui/material';
import { OCRTester } from '../components/OCRTester';

const TestPage: React.FC = () => {
  return (
    <Container>
      <Typography variant="h4" sx={{ my: 4, textAlign: 'center' }}>
        License Plate OCR Testing
      </Typography>
      <OCRTester />
    </Container>
  );
};

export default TestPage; 