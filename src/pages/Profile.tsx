import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Box, 
  Typography, 
  Button, 
  Card, 
  TextField, 
  Avatar, 
  Grid, 
  Alert, 
  InputAdornment, 
  Divider 
} from '@mui/material';
import { 
  Save as SaveIcon, 
  Lock as LockIcon, 
  Person as PersonIcon, 
  Email as EmailIcon, 
  Phone as PhoneIcon,
  Shield as ShieldIcon,
  CheckCircle as CheckCircleIcon,
  AdminPanelSettings as AdminIcon,
  Badge as BadgeIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  PinDrop as PinIcon,
  Receipt as ReceiptIcon
} from '@mui/icons-material';
import type { RootState } from '../store';
import { useGetProfileQuery, useUpdateProfileMutation } from '../store/api';
import { setCredentials } from '../store/authSlice';

export default function Profile() {
  const { user, token } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();

  const { data: profile, refetch } = useGetProfileQuery(undefined, { skip: !token });
  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  
  // Workspace / Library Details
  const [workspaceName, setWorkspaceName] = useState('');
  const [address, setAddress] = useState('');
  const [pincode, setPincode] = useState('');
  const [gstNumber, setGstNumber] = useState('');

  // Password fields
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const target = profile || user;
    if (target) {
      setName(target.name || '');
      setEmail(target.email || '');
      setMobile(target.mobile || '');
      if (target.workspace) {
        setWorkspaceName(target.workspace.name || '');
        setAddress(target.workspace.address || '');
        setPincode(target.workspace.pincode || '');
        setGstNumber(target.workspace.gstNumber || '');
      }
    }
  }, [profile, user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    try {
      const payload: any = { 
        name, 
        email, 
        mobile,
        workspaceName,
        address,
        pincode,
        gstNumber
      };
      const updatedUser = await updateProfile(payload).unwrap();
      
      dispatch(setCredentials({ user: updatedUser, accessToken: token || '' }));
      setMessage({ type: 'success', text: 'Account and Library details saved successfully!' });
      refetch();
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.data?.message || 'Failed to update profile.' });
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    if (password.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }

    try {
      const updatedUser = await updateProfile({ password }).unwrap();
      dispatch(setCredentials({ user: updatedUser, accessToken: token || '' }));
      setMessage({ type: 'success', text: 'Password updated successfully!' });
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.data?.message || 'Failed to update password.' });
    }
  };

  return (
    <Box sx={{ maxWidth: '1100px', margin: '0 auto', p: { xs: 2, sm: 3, md: 4 } }}>
      
      {/* Upper Profile Header Section */}
      <Card sx={{ 
        p: 4, 
        mb: 4, 
        borderRadius: '20px', 
        border: '1px solid #E2E8F0', 
        boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        background: 'linear-gradient(to right, #ffffff, #f8fafc)'
      }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item>
            <Avatar
              sx={{
                width: { xs: 80, md: 100 },
                height: { xs: 80, md: 100 },
                fontSize: '2.5rem',
                background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                color: 'white',
                fontWeight: 700,
                boxShadow: '0 8px 30px rgba(37, 99, 235, 0.25)'
              }}
            >
              {name?.charAt(0).toUpperCase() || 'A'}
            </Avatar>
          </Grid>
          <Grid item xs={12} sm>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A' }}>
                  {name}
                </Typography>
                <Box sx={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: 0.5, 
                  bgcolor: '#EFF6FF', 
                  color: '#1D4ED8',
                  px: 1.5,
                  py: 0.5,
                  borderRadius: '9999px',
                  border: '1px solid #BFDBFE'
                }}>
                  <AdminIcon sx={{ fontSize: '14px' }} />
                  <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {user?.role}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" sx={{ color: '#64748B' }}>
                {email}
              </Typography>
              {workspaceName && (
                <Typography variant="body2" sx={{ color: 'var(--primary)', fontWeight: 600, mt: 0.5 }}>
                  Library: {workspaceName}
                </Typography>
              )}
            </Box>
          </Grid>
        </Grid>
      </Card>

      {/* Status Message */}
      {message && (
        <Alert 
          severity={message.type} 
          icon={message.type === 'success' ? <CheckCircleIcon sx={{ color: '#10B981' }} /> : undefined}
          sx={{ 
            mb: 4, 
            borderRadius: '12px', 
            border: '1px solid', 
            borderColor: message.type === 'success' ? '#A7F3D0' : '#FCA5A5',
            bgcolor: message.type === 'success' ? '#ECFDF5' : '#FEF2F2',
            color: message.type === 'success' ? '#065F46' : '#991B1B'
          }}
        >
          {message.text}
        </Alert>
      )}

      {/* Unified Layout Details */}
      <Grid container spacing={4}>
        
        {/* Personal & Library Details Column */}
        <Grid item xs={12} md={7}>
          <Card sx={{ p: { xs: 3, md: 4 }, borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: 'none' }}>
            <form onSubmit={handleUpdateProfile}>
              
              {/* Profile Details */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A' }}>
                  Personal Information
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748B', mt: 0.5 }}>
                  Update your contact settings and access configuration.
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 3 }}>
                  <TextField
                    label="Full Name"
                    required
                    fullWidth
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon sx={{ color: '#94A3B8' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                  />

                  <TextField
                    label="Email Address"
                    type="email"
                    required
                    fullWidth
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailIcon sx={{ color: '#94A3B8' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                  />

                  <TextField
                    label="Mobile Number"
                    fullWidth
                    placeholder="e.g. 9876543210"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PhoneIcon sx={{ color: '#94A3B8' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                  />

                  <TextField
                    label="Role Access"
                    disabled
                    fullWidth
                    value={user?.role || 'Staff'}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <BadgeIcon sx={{ color: '#94A3B8' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: '#F8FAFC' } }}
                  />
                </Box>
              </Box>

              <Divider sx={{ my: 4 }} />

              {/* Library Workspace Details */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A' }}>
                  Library / Workspace Details
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748B', mt: 0.5 }}>
                  Manage workspace address, name, pincode, and billing GST details.
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 3 }}>
                  <TextField
                    label="Workspace/Library Name"
                    required
                    fullWidth
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <BusinessIcon sx={{ color: '#94A3B8' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                  />

                  <TextField
                    label="Address"
                    required
                    fullWidth
                    multiline
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1 }}>
                          <LocationIcon sx={{ color: '#94A3B8' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                  />

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Pincode"
                        fullWidth
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <PinIcon sx={{ color: '#94A3B8' }} />
                            </InputAdornment>
                          ),
                        }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="GST Number (Optional)"
                        fullWidth
                        value={gstNumber}
                        onChange={(e) => setGstNumber(e.target.value)}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <ReceiptIcon sx={{ color: '#94A3B8' }} />
                            </InputAdornment>
                          ),
                        }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                      />
                    </Grid>
                  </Grid>
                </Box>
              </Box>

              <Box sx={{ mt: 4 }}>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<SaveIcon />}
                  disabled={isUpdating}
                  sx={{ 
                    borderRadius: '10px', 
                    px: 4, 
                    py: 1.2, 
                    textTransform: 'none', 
                    fontWeight: 600,
                    boxShadow: 'none',
                    '&:hover': {
                      boxShadow: 'none',
                      bgcolor: '#1D4ED8'
                    }
                  }}
                >
                  {isUpdating ? 'Saving...' : 'Save Profile & Workspace'}
                </Button>
              </Box>

            </form>
          </Card>
        </Grid>

        {/* Security Details Column */}
        <Grid item xs={12} md={5}>
          <Card sx={{ p: { xs: 3, md: 4 }, borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: 'none' }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A' }}>
                Change Password
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748B', mt: 0.5 }}>
                Ensure your credentials remain secure.
              </Typography>
            </Box>
            
            <Divider sx={{ mb: 4 }} />

            <form onSubmit={handleChangePassword}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <TextField
                  label="New Password"
                  type="password"
                  required
                  fullWidth
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon sx={{ color: '#94A3B8' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                />

                <TextField
                  label="Confirm New Password"
                  type="password"
                  required
                  fullWidth
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon sx={{ color: '#94A3B8' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                />

                <Box sx={{ mt: 2 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    startIcon={<LockIcon />}
                    disabled={isUpdating}
                    fullWidth
                    sx={{ 
                      borderRadius: '10px', 
                      py: 1.2, 
                      textTransform: 'none', 
                      fontWeight: 600,
                      boxShadow: 'none',
                      '&:hover': {
                        boxShadow: 'none',
                        bgcolor: '#1D4ED8'
                      }
                    }}
                  >
                    Update Password
                  </Button>
                </Box>
              </Box>
            </form>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
