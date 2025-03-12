import React from 'react';
import { Link } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import BlockIcon from '@mui/icons-material/Block';

const Forbidden: React.FC = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: 3,
      }}
    >
      <BlockIcon
        sx={{
          fontSize: 64,
          color: 'error.main',
          mb: 2,
        }}
      />
      
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        sx={{
          fontWeight: 'bold',
          textAlign: 'center',
        }}
      >
        403 - Access Forbidden
      </Typography>
      
      <Typography
        variant="body1"
        sx={{
          color: 'text.secondary',
          textAlign: 'center',
          maxWidth: 600,
          mb: 3,
        }}
      >
        You don't have permission to access this page. Please contact your administrator if you believe this is an error.
      </Typography>
      
      <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Button
          component={Link}
          to="/"
          variant="contained"
          color="primary"
          sx={{ minWidth: 200 }}
        >
          Go to Dashboard
        </Button>
      </Box>
    </Box>
  );
};

export default Forbidden; 