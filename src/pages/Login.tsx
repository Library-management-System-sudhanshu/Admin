import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useLoginMutation, useRegisterTenantMutation } from '../store/api';
import { setCredentials } from '../store/authSlice';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
} from '@mui/material';

export default function Login() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [tab, setTab] = useState(0); // 0 = Login, 1 = Register, 2 = OTP Login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Register Fields
  const [name, setName] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');
  const [address, setAddress] = useState('');
  
  // Validation Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [loginMutation, { isLoading: isLoginLoading }] = useLoginMutation();
  const [registerMutation, { isLoading: isRegisterLoading }] = useRegisterTenantMutation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await loginMutation({ email, password }).unwrap();
      dispatch(setCredentials(res));
      navigate('/');
    } catch (err: any) {
      setError(err?.data?.message || 'Login failed. Check credentials.');
    }
  };

  const validateField = (field: string, value: string) => {
    let errorMsg = '';
    switch (field) {
      case 'name':
        if (!/^[a-zA-Z\s]*$/.test(value)) {
          errorMsg = 'Name must contain only letters';
        } else if (value.trim().length > 0 && value.trim().length < 2) {
          errorMsg = 'Name must be at least 2 characters';
        } else if (value.trim().length > 50) {
          errorMsg = 'Name must be at most 50 characters';
        }
        break;
      case 'workspaceName':
        if (value.trim().length > 0 && value.trim().length < 3) {
          errorMsg = 'Workspace name must be at least 3 characters';
        }
        break;
      case 'address':
        if (value.trim().length > 0 && value.trim().length < 5) {
          errorMsg = 'Address must be at least 5 characters';
        }
        break;
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (value.trim().length > 0 && !emailRegex.test(value.trim())) {
          errorMsg = 'Invalid email address';
        }
        break;
      case 'password':
        if (value.length > 0 && value.length < 6) {
          errorMsg = 'Password must be at least 6 characters';
        }
        break;
      default:
        break;
    }

    setErrors((prev) => {
      if (errorMsg) {
        return { ...prev, [field]: errorMsg };
      } else {
        const next = { ...prev };
        delete next[field];
        return next;
      }
    });
  };

  const validateRegister = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) {
      newErrors.name = 'Name is required';
    } else if (!/^[a-zA-Z\s]{2,50}$/.test(name.trim())) {
      newErrors.name = 'Name must be 2-50 characters and contain only letters';
    }

    if (!workspaceName.trim()) {
      newErrors.workspaceName = 'Workspace name is required';
    } else if (workspaceName.trim().length < 3) {
      newErrors.workspaceName = 'Workspace name must be at least 3 characters';
    }

    if (!address.trim()) {
      newErrors.address = 'Address must be at least 5 characters';
    } else if (address.trim().length < 5) {
      newErrors.address = 'Address must be at least 5 characters';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(email.trim())) {
      newErrors.email = 'Invalid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegisterChange = (field: string, value: string, setter: (val: string) => void) => {
    setter(value);
    validateField(field, value);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateRegister()) return;
    setError('');
    try {
      const res = await registerMutation({
        email,
        password,
        name,
        workspaceName,
        address,
      }).unwrap();
      dispatch(setCredentials(res));
      navigate('/');
    } catch (err: any) {
      setError(err?.data?.message || 'Registration failed.');
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        bgcolor: '#0F172A',
      }}
    >
      <Card sx={{ width: 450, borderRadius: 3, boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" align="center" color="primary" sx={{ fontWeight: 700, mb: 1 }}>
            StudyFlow
          </Typography>
          <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 3 }}>
            SaaS Study Hall Management System
          </Typography>

          <Tabs
            value={tab}
            onChange={(_, val) => {
              setTab(val);
              setError('');
            }}
            variant="fullWidth"
            sx={{ mb: 3 }}
          >
            <Tab label="Login" />
            <Tab label="Register Hall" />
          </Tabs>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {tab === 0 && (
            <form onSubmit={handleLogin}>
              <TextField
                label="Email Address"
                type="email"
                fullWidth
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                sx={{ mb: 2 }}
              />
              <TextField
                label="Password"
                type="password"
                fullWidth
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                sx={{ mb: 3 }}
              />
              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={isLoginLoading}
                sx={{ height: 48 }}
              >
                {isLoginLoading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
              </Button>
            </form>
          )}

          {tab === 1 && (
            <form onSubmit={handleRegister}>
               <TextField
                label="Owner Name"
                fullWidth
                required
                value={name}
                error={!!errors.name}
                helperText={errors.name}
                onChange={(e) => handleRegisterChange('name', e.target.value, setName)}
                sx={{ mb: 2 }}
              />
              <TextField
                label="Workspace/Study Hall Name"
                fullWidth
                required
                value={workspaceName}
                error={!!errors.workspaceName}
                helperText={errors.workspaceName}
                onChange={(e) => handleRegisterChange('workspaceName', e.target.value, setWorkspaceName)}
                sx={{ mb: 2 }}
              />

              <TextField
                label="Address"
                fullWidth
                required
                value={address}
                error={!!errors.address}
                helperText={errors.address}
                onChange={(e) => handleRegisterChange('address', e.target.value, setAddress)}
                sx={{ mb: 2 }}
              />
              <TextField
                label="Email"
                type="email"
                fullWidth
                required
                value={email}
                error={!!errors.email}
                helperText={errors.email}
                onChange={(e) => handleRegisterChange('email', e.target.value, setEmail)}
                sx={{ mb: 2 }}
              />
              <TextField
                label="Password"
                type="password"
                fullWidth
                required
                value={password}
                error={!!errors.password}
                helperText={errors.password}
                onChange={(e) => handleRegisterChange('password', e.target.value, setPassword)}
                sx={{ mb: 3 }}
              />
              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={isRegisterLoading}
                sx={{ height: 48 }}
              >
                {isRegisterLoading ? <CircularProgress size={24} color="inherit" /> : 'Register & Log In'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
