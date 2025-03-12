import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Divider,
  Grid,
  Paper
} from '@mui/material';
import TextField from '@mui/material/TextField';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Avatar from '@mui/material/Avatar';
import Alert from '@mui/material/Alert';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { ChangePasswordDialog } from '../components/ChangePasswordDialog';
import { updateUserProfile } from '../store/slices/authSlice';

// Extend the User interface to include createdAt
interface ExtendedUser {
  id: string;
  name: string;
  username: string;
  role: string;
  createdAt?: string;
  lastLogin?: {
    timestamp: string;
    ip: string;
  };
}

const Profile: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.auth.user) as ExtendedUser;
  
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  if (!user) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">User not found. Please log in again.</Alert>
      </Box>
    );
  }
  
  const handleEdit = () => {
    setEditing(true);
  };
  
  const handleCancel = () => {
    setEditing(false);
    setName(user.name);
  };
  
  const handleSave = async () => {
    if (!name.trim()) {
      setError('Name cannot be empty');
      return;
    }
    
    try {
      await dispatch(updateUserProfile({ name })).unwrap();
      setSuccess('Profile updated successfully');
      setEditing(false);
      
      // Clear success message after a delay
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    }
  };
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };
  
  const handleCloseError = () => {
    setError(null);
  };
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        My Profile
      </Typography>
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}
      
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 2 }}
          onClose={handleCloseError}
        >
          {error}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Avatar 
              sx={{ 
                width: 100, 
                height: 100, 
                fontSize: 40,
                mb: 2,
                bgcolor: 'primary.main'
              }}
            >
              {getInitials(user.name)}
            </Avatar>
            
            <Typography variant="h5" gutterBottom>
              {user.name}
            </Typography>
            
            <Typography variant="body2" color="text.secondary">
              {user.username}
            </Typography>
            
            <Box sx={{ mt: 2, mb: 1, width: '100%' }}>
              <Divider />
            </Box>
            
            <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'flex-start', mb: 1 }}>
              <strong>Role:</strong> {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
            </Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'flex-start', mb: 1 }}>
              <strong>Last Login:</strong> {formatDate(user.lastLogin?.timestamp)}
            </Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'flex-start' }}>
              <strong>Account Created:</strong> {formatDate(user.createdAt)}
            </Typography>
            
            <Button 
              fullWidth 
              variant="outlined" 
              sx={{ mt: 3 }}
              onClick={() => setChangePasswordOpen(true)}
            >
              Change Password
            </Button>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Account Details
              </Typography>
              
              <Box sx={{ mt: 3 }}>
                <TextField
                  fullWidth
                  label="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  InputProps={{ readOnly: !editing }}
                  sx={{ mb: 2 }}
                />
                
                <TextField
                  fullWidth
                  label="Username"
                  value={user.username}
                  InputProps={{ readOnly: true }}
                  sx={{ mb: 2 }}
                />
                
                <TextField
                  fullWidth
                  label="Role"
                  value={user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  InputProps={{ readOnly: true }}
                  sx={{ mb: 2 }}
                />
                
                {editing ? (
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
                    <Button variant="outlined" onClick={handleCancel}>
                      Cancel
                    </Button>
                    <Button variant="contained" onClick={handleSave}>
                      Save Changes
                    </Button>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                    <Button variant="contained" onClick={handleEdit}>
                      Edit Profile
                    </Button>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      <ChangePasswordDialog
        open={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
      />
    </Box>
  );
};

export default Profile; 