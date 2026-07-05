import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useLoginMutation, useRegisterTenantMutation } from '../store/api';
import { setCredentials } from '../store/authSlice';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useToast } from '../components/ui/ToastContext';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const [tab, setTab] = useState(0); // 0 = Login, 1 = Register
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('expired') === 'true') {
      showToast('Session expired. Please log in again.', 'error');
      navigate('/login', { replace: true });
    }
  }, [location.search, showToast, navigate]);

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
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: 'var(--bg-main)'
    }}>
      <Card elevation="lg" style={{ width: '100%', maxWidth: '450px', margin: '2rem' }}>
        <div className="card-content">
          <h1 className="text-center" style={{ color: 'var(--primary)', marginBottom: '0.25rem', fontWeight: 700 }}>
            StudyFlow
          </h1>
          <p className="text-center text-muted" style={{ marginBottom: '2rem' }}>
            Study Hall Management System
          </p>

          <div style={{ display: 'flex', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
            <button
              type="button"
              onClick={() => { setTab(0); setError(''); }}
              style={{
                flex: 1,
                padding: '0.75rem',
                background: 'transparent',
                border: 'none',
                borderBottom: tab === 0 ? '2px solid var(--primary)' : '2px solid transparent',
                color: tab === 0 ? 'var(--primary)' : 'var(--text-secondary)',
                fontWeight: tab === 0 ? 600 : 500,
                cursor: 'pointer',
                transition: 'all var(--transition-fast)'
              }}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => { setTab(1); setError(''); }}
              style={{
                flex: 1,
                padding: '0.75rem',
                background: 'transparent',
                border: 'none',
                borderBottom: tab === 1 ? '2px solid var(--primary)' : '2px solid transparent',
                color: tab === 1 ? 'var(--primary)' : 'var(--text-secondary)',
                fontWeight: tab === 1 ? 600 : 500,
                cursor: 'pointer',
                transition: 'all var(--transition-fast)'
              }}
            >
              Register Hall
            </button>
          </div>

          {error && (
            <div style={{ 
              backgroundColor: 'rgba(239, 68, 68, 0.1)', 
              color: 'var(--danger)', 
              padding: '0.75rem', 
              borderRadius: 'var(--radius-md)', 
              marginBottom: '1rem',
              fontSize: '0.875rem'
            }}>
              {error}
            </div>
          )}

          {tab === 0 && (
            <form onSubmit={handleLogin}>
              <Input
                label="Email Address"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Input
                label="Password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button
                type="submit"
                variant="primary"
                fullWidth
                size="lg"
                isLoading={isLoginLoading}
                style={{ marginTop: '0.5rem' }}
              >
                Sign In
              </Button>
            </form>
          )}

          {tab === 1 && (
            <form onSubmit={handleRegister}>
               <Input
                label="Owner Name"
                required
                value={name}
                error={errors.name}
                onChange={(e) => handleRegisterChange('name', e.target.value, setName)}
              />
              <Input
                label="Workspace/Study Hall Name"
                required
                value={workspaceName}
                error={errors.workspaceName}
                onChange={(e) => handleRegisterChange('workspaceName', e.target.value, setWorkspaceName)}
              />
              <Input
                label="Address"
                required
                value={address}
                error={errors.address}
                onChange={(e) => handleRegisterChange('address', e.target.value, setAddress)}
              />
              <Input
                label="Email"
                type="email"
                required
                value={email}
                error={errors.email}
                onChange={(e) => handleRegisterChange('email', e.target.value, setEmail)}
              />
              <Input
                label="Password"
                type="password"
                required
                value={password}
                error={errors.password}
                onChange={(e) => handleRegisterChange('password', e.target.value, setPassword)}
              />
              <Button
                type="submit"
                variant="primary"
                fullWidth
                size="lg"
                isLoading={isRegisterLoading}
                style={{ marginTop: '0.5rem' }}
              >
                Register & Log In
              </Button>
            </form>
          )}
        </div>
      </Card>
    </div>
  );
}

