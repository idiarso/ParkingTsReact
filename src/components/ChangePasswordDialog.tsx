import React, { useState, ChangeEvent } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Box,
  Alert,
} from '@mui/material';
import TextField from '@mui/material/TextField';
import type { StandardTextFieldProps } from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useDispatch } from 'react-redux';
import { changePassword } from '../store/slices/authSlice';
import { AppDispatch } from '../store';

interface ChangePasswordDialogProps {
  open: boolean;
  onClose: () => void;
}

export const ChangePasswordDialog: React.FC<ChangePasswordDialogProps> = ({ open, onClose }) => {
  const dispatch = useDispatch<AppDispatch>();
  
  // Form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // UI state
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // Handle close with reset
  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Reset form
  const resetForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
    setSuccess(false);
    setLoading(false);
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  // Validate form
  const validateForm = (): boolean => {
    if (!currentPassword) {
      setError('Current password is required');
      return false;
    }

    if (!newPassword) {
      setError('New password is required');
      return false;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return false;
    }

    if (newPassword === currentPassword) {
      setError('New password must be different from current password');
      return false;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    return true;
  };

  // Handle form submission
  const handleSubmit = async () => {
    setError(null);
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await dispatch(changePassword({ 
        currentPassword, 
        newPassword 
      })).unwrap();
      
      setSuccess(true);
      setLoading(false);
      
      // Close dialog after a delay
      setTimeout(handleClose, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to change password');
      setLoading(false);
    }
  };

  const handleInputChange = (setter: (value: string) => void) => (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    setter(e.target.value);
  };

  const handleToggleVisibility = (
    showState: boolean,
    setShowState: (state: boolean) => void
  ) => () => {
    setShowState(!showState);
  };

  const textFieldProps = (
    showPassword: boolean,
    setShowPassword: (show: boolean) => void,
    value: string,
    setter: (value: string) => void,
    label: string
  ): Partial<StandardTextFieldProps> => ({
    fullWidth: true,
    label,
    type: showPassword ? 'text' : 'password',
    value,
    onChange: handleInputChange(setter),
    error: !!error && !value,
    InputProps: {
      endAdornment: (
        <InputAdornment position="end">
          <IconButton
            onClick={handleToggleVisibility(showPassword, setShowPassword)}
            edge="end"
            disabled={loading || success}
          >
            {showPassword ? <VisibilityOff /> : <Visibility />}
          </IconButton>
        </InputAdornment>
      ),
    },
  });

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Change Password</DialogTitle>
      
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Password changed successfully!
            </Alert>
          )}
          
          <TextField
            {...textFieldProps(
              showCurrentPassword,
              setShowCurrentPassword,
              currentPassword,
              setCurrentPassword,
              'Current Password'
            )}
          />
          
          <TextField
            {...textFieldProps(
              showNewPassword,
              setShowNewPassword,
              newPassword,
              setNewPassword,
              'New Password'
            )}
          />
          
          <TextField
            {...textFieldProps(
              showConfirmPassword,
              setShowConfirmPassword,
              confirmPassword,
              setConfirmPassword,
              'Confirm New Password'
            )}
          />
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary"
          disabled={loading || success}
        >
          {loading ? <CircularProgress size={24} /> : 'Change Password'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}; 