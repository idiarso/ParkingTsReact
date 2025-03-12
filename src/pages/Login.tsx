import React, { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import MuiBox from '@mui/material/Box';
import MuiButton from '@mui/material/Button';
import MuiTextField from '@mui/material/TextField';
import MuiTypography from '@mui/material/Typography';
import MuiContainer from '@mui/material/Container';
import MuiPaper from '@mui/material/Paper';
import MuiAvatar from '@mui/material/Avatar';
import LocalParkingIcon from '@mui/icons-material/LocalParking';
import { useAuth } from '../hooks/useAuth';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    
    try {
      await login({ email: username, password });
      navigate('/dashboard');
    } catch (err) {
      setError('Invalid username or password');
    }
  };

  return (
    <MuiContainer maxWidth="xs">
      <MuiBox
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <MuiPaper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <MuiAvatar sx={{ m: 1, bgcolor: 'primary.main', width: 56, height: 56 }}>
            <LocalParkingIcon sx={{ fontSize: 40 }} />
          </MuiAvatar>
          <MuiTypography component="h1" variant="h5">
            Parking System
          </MuiTypography>
          <MuiBox
            component="form"
            onSubmit={handleSubmit}
            sx={{ mt: 1, width: '100%' }}
          >
            <MuiTextField
              fullWidth
              id="username"
              label="Email"
              name="username"
              autoComplete="email"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              sx={{ mb: 2 }}
            />
            <MuiTextField
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ mb: 2 }}
            />
            {error && (
              <MuiTypography color="error" sx={{ mb: 2 }}>
                {error}
              </MuiTypography>
            )}
            <MuiButton
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 1 }}
            >
              Sign In
            </MuiButton>
          </MuiBox>
        </MuiPaper>
      </MuiBox>
    </MuiContainer>
  );
};

export default Login; 