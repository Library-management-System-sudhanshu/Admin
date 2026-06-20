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
  const [subdomain, setSubdomain] = useState('');
  const [address, setAddress] = useState('');

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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await registerMutation({
        email,
        password,
        name,
        workspaceName,
        subdomain,
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
                onChange={(e) => setName(e.target.value)}
                sx={{ mb: 2 }}
              />
              <TextField
                label="Workspace/Study Hall Name"
                fullWidth
                required
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                sx={{ mb: 2 }}
              />
              <TextField
                label="Subdomain (unique identifier)"
                fullWidth
                required
                value={subdomain}
                onChange={(e) => setSubdomain(e.target.value)}
                sx={{ mb: 2 }}
              />
              <TextField
                label="Address"
                fullWidth
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                sx={{ mb: 2 }}
              />
              <TextField
                label="Email"
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
