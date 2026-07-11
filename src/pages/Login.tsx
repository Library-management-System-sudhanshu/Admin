import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useLoginMutation, useRegisterTenantMutation, useGoogleLoginMutation } from '../store/api';
import { setCredentials } from '../store/authSlice';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useToast } from '../components/ui/ToastContext';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const [tab, setTab] = useState(0); // 0 = Login, 1 = Register

  // Login fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Register fields
  const [name, setName] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');
  const [address, setAddress] = useState('');
  const [pincode, setPincode] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [logo, setLogo] = useState('');
  const [showOptional, setShowOptional] = useState(false); // Toggle optional fields

  // Google Simulation fields
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');

  // Validation Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [loginMutation, { isLoading: isLoginLoading }] = useLoginMutation();
  const [registerMutation, { isLoading: isRegisterLoading }] = useRegisterTenantMutation();
  const [googleLogin, { isLoading: isGoogleLoading }] = useGoogleLoginMutation();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('expired') === 'true') {
      showToast('Session expired. Please log in again.', 'error');
      navigate('/login', { replace: true });
    }
  }, [location.search, showToast, navigate]);

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

  const handleGoogleSignIn = async (gEmail: string, gName: string) => {
    setError('');
    try {
      const header = { alg: "HS256", typ: "JWT" };
      const payload = {
        email: gEmail,
        name: gName,
        sub: `google-sub-${Math.random().toString(36).substr(2, 9)}`
      };

      const encodedHeader = btoa(unescape(encodeURIComponent(JSON.stringify(header))));
      const encodedPayload = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
      const idToken = `mock-token-${encodedHeader}.${encodedPayload}.signature`;

      const res = await googleLogin({ idToken }).unwrap();
      dispatch(setCredentials(res));

      if (res.requiresWorkspaceInfo) {
        navigate('/setup-workspace');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err?.data?.message || 'Google authentication failed.');
    }
  };

  const validateField = (field: string, value: string) => {
    let errorMsg = '';
    switch (field) {
      case 'name':
        if (!/^[a-zA-Z0-9\s\.\-]*$/.test(value)) {
          errorMsg = 'Name can contain only letters, numbers, spaces, dots, and hyphens';
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
        if (value.trim().length === 0) {
          errorMsg = 'Address is required';
        } else if (value.trim().length < 5) {
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
      case 'pincode':
        if (value.trim().length === 0) {
          errorMsg = 'Pincode is required';
        } else if (!/^\d{6}$/.test(value.trim())) {
          errorMsg = 'Pincode must be exactly 6 digits';
        }
        break;
      case 'gstNumber':
        if (value.trim().length > 0 && value.trim().length !== 15) {
          errorMsg = 'GST number must be exactly 15 characters';
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
    } else if (!/^[a-zA-Z0-9\s\.\-]{2,50}$/.test(name.trim())) {
      newErrors.name = 'Name must be 2-50 characters';
    }

    if (!workspaceName.trim()) {
      newErrors.workspaceName = 'Workspace name is required';
    } else if (workspaceName.trim().length < 3) {
      newErrors.workspaceName = 'Workspace name must be at least 3 characters';
    }

    if (!address.trim()) {
      newErrors.address = 'Address is required';
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

    if (!pincode.trim()) {
      newErrors.pincode = 'Pincode is required';
    } else if (!/^\d{6}$/.test(pincode.trim())) {
      newErrors.pincode = 'Pincode must be exactly 6 digits';
    }

    if (gstNumber.trim() && gstNumber.trim().length !== 15) {
      newErrors.gstNumber = 'GST number must be exactly 15 characters';
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
        pincode: pincode.trim() || undefined,
        gstNumber: gstNumber.trim() || undefined,
        logo: logo.trim() || undefined,
      }).unwrap();
      dispatch(setCredentials(res));
      navigate('/');
    } catch (err: any) {
      setError(err?.data?.message || 'Registration failed.');
    }
  };

  // Seat map for the branding panel — a small grid representing live
  // study-hall seat occupancy. Purely decorative, but literal to the product.
  const seatRows = 5;
  const seatCols = 8;
  const occupiedSeeds = [2, 5, 9, 11, 14, 18, 21, 23, 27, 30, 33, 36, 38];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#ffffff' }}>
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .optional-accordion { animation: slideDown 200ms ease-out; }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes seatPulse {
          0%, 100% { opacity: 0.55; }
          50% { opacity: 1; }
        }

        @keyframes floatSlow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }

        .brand-seat.is-occupied { animation: seatPulse 3.2s ease-in-out infinite; }

        .brand-panel { position: relative; overflow: hidden; }

        .brand-float { animation: floatSlow 7s ease-in-out infinite; }

        /* Compact form elements override to fit on one page without scroll */
        .auth-panel .custom-input-container {
          margin-bottom: 0.5rem !important;
        }
        .auth-panel .custom-input {
          padding: 0.55rem 0.85rem !important;
          font-size: 0.9rem !important;
        }
        .auth-panel .custom-input-label {
          margin-bottom: 0.25rem !important;
          font-size: 0.8rem !important;
        }

        @media (prefers-reduced-motion: reduce) {
          .brand-seat.is-occupied, .brand-float { animation: none !important; }
        }

        @media (max-width: 900px) {
          .brand-panel { display: none !important; }
          .auth-panel { flex: 1 1 100% !important; max-width: 100% !important; }
        }

        @media (max-width: 600px) {
          .register-grid { grid-template-columns: 1fr !important; }
          .optional-grid { grid-template-columns: 1fr !important; }
        }
      `}} />

      {/* ============ LEFT: BRAND / GLASSMORPHISM PANEL (~58%) ============ */}
      <div
        className="brand-panel"
        style={{
          flex: '0 0 58%',
          maxWidth: '58%',
          minHeight: '100vh',
          background: 'radial-gradient(circle at 15% 15%, #1e2a5e 0%, #0b1130 45%, #060814 100%)',
          padding: '3.5rem 3rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          color: '#ffffff',
        }}
      >
        {/* Ambient glow blobs */}
        <div className="brand-float" style={{
          position: 'absolute', top: '-120px', right: '-100px',
          width: '340px', height: '340px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.45) 0%, rgba(99,102,241,0) 70%)',
          filter: 'blur(10px)', pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute', bottom: '-140px', left: '-80px',
          width: '380px', height: '380px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(56,189,248,0.30) 0%, rgba(56,189,248,0) 70%)',
          filter: 'blur(10px)', pointerEvents: 'none'
        }} />

        {/* Brand mark */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.5rem' }}>
            <div style={{
              width: '34px', height: '34px', borderRadius: '8px',
              background: 'rgba(255,255,255,0.10)',
              border: '1px solid rgba(255,255,255,0.18)',
              backdropFilter: 'blur(6px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: '1rem'
            }}>
              T
            </div>
            <span style={{ fontWeight: 700, fontSize: '0.9rem', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.85)' }}>
              TRISHUL
            </span>
          </div>

          <h1 style={{
            fontSize: '2.1rem',
            fontWeight: 800,
            lineHeight: 1.15,
            margin: '0 0 0.75rem 0',
            letterSpacing: '-0.02em',
            maxWidth: '480px'
          }}>
            Run your study hall like it runs itself.
          </h1>
          <p style={{
            margin: 0,
            fontSize: '0.9rem',
            lineHeight: 1.5,
            color: 'rgba(255,255,255,0.65)',
            maxWidth: '420px'
          }}>
            One dashboard for seats, members, billing and every branch —
            built for library and study hall owners across the country.
          </p>
        </div>

        {/* Signature glass element: live seat map */}
        <div className="brand-float" style={{
          position: 'relative',
          zIndex: 2,
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.14)',
          borderRadius: '16px',
          padding: '1.25rem',
          maxWidth: '300px',
          backdropFilter: 'blur(14px)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.06em', color: 'rgba(255,255,255,0.6)' }}>
              LIVE SEAT MAP
            </span>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#4ade80' }}>
              27 / 40 available
            </span>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${seatCols}, 1fr)`,
            gap: '5px'
          }}>
            {Array.from({ length: seatRows * seatCols }).map((_, i) => {
              const occupied = occupiedSeeds.includes(i);
              return (
                <div
                  key={i}
                  className={occupied ? 'brand-seat is-occupied' : 'brand-seat'}
                  style={{
                    aspectRatio: '1 / 1',
                    borderRadius: '3px',
                    background: occupied ? 'rgba(248,113,113,0.85)' : 'rgba(74,222,128,0.7)',
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Feature strip */}
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', gap: '2rem', marginTop: '1.5rem' }}>
          {[
            { k: '500+', v: 'Study halls onboarded' },
            { k: 'GST', v: 'Ready invoicing' },
            { k: '24/7', v: 'Real-time occupancy' },
          ].map((item) => (
            <div key={item.k}>
              <div style={{ fontSize: '1rem', fontWeight: 800 }}>{item.k}</div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.55)', marginTop: '0.15rem' }}>{item.v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ============ RIGHT: AUTH PANEL (~42%) ============ */}
      <div
        className="auth-panel"
        style={{
          flex: '0 0 42%',
          maxWidth: '42%',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'start',
          padding: '1.5rem 2.5rem',
          background: '#ffffff',
        }}
      >
        <div style={{ width: '100%', maxWidth: '560px' }}>

          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ margin: '0 0 0.35rem 0', fontWeight: 800, fontSize: '1.6rem', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              {tab === 0 ? 'Welcome back' : 'Set up your study hall'}
            </h2>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
              {tab === 0 ? 'Sign in to manage your dashboard' : 'Get your workspace ready in a minute'}
            </p>
          </div>

          {/* Tab Slider */}
          <div style={{
            display: 'flex',
            background: '#f1f5f9',
            padding: '4px',
            borderRadius: '12px',
            marginBottom: '1.5rem'
          }}>
            <button
              type="button"
              onClick={() => { setTab(0); setError(''); }}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '9px',
                background: tab === 0 ? '#ffffff' : 'transparent',
                border: 'none',
                boxShadow: tab === 0 ? '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)' : 'none',
                color: tab === 0 ? 'var(--primary)' : '#475569',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setTab(1); setError(''); }}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '9px',
                background: tab === 1 ? '#ffffff' : 'transparent',
                border: 'none',
                boxShadow: tab === 1 ? '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)' : 'none',
                color: tab === 1 ? 'var(--primary)' : '#475569',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              Register Hall
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              color: 'var(--danger)',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              marginBottom: '1.25rem',
              fontSize: '0.85rem',
              fontWeight: 500,
              border: '1px solid rgba(239, 68, 68, 0.15)'
            }}>
              {error}
            </div>
          )}

          {/* Sign In Form */}
          {tab === 0 && (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
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
                style={{ marginTop: '0.75rem' }}
              >
                Sign In
              </Button>

              <div style={{ display: 'flex', alignItems: 'center', margin: '1rem 0', color: '#94a3b8' }}>
                <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
                <span style={{ padding: '0 0.75rem', fontSize: '0.75rem', fontWeight: 700 }}>OR</span>
                <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
              </div>

              <Button
                type="button"
                variant="outline"
                fullWidth
                size="lg"
                onClick={() => setShowGoogleModal(true)}
                isLoading={isGoogleLoading}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  borderColor: '#cbd5e1', color: '#334155', background: '#ffffff', fontWeight: 600
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6-4.53z" fill="#EA4335" />
                </svg>
                Continue with Google
              </Button>
            </form>
          )}

          {/* Register Form */}
          {tab === 1 && (
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="register-grid" style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
              }}>
                {/* Column 1 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <Input
                    label="Owner Name"
                    required
                    placeholder="Full Name"
                    value={name}
                    error={errors.name}
                    onChange={(e) => handleRegisterChange('name', e.target.value, setName)}
                  />
                  <Input
                    label="Workspace/Study Hall Name"
                    required
                    placeholder="e.g. Royal Study Space"
                    value={workspaceName}
                    error={errors.workspaceName}
                    onChange={(e) => handleRegisterChange('workspaceName', e.target.value, setWorkspaceName)}
                  />
                  <Input
                    label="Email"
                    type="email"
                    required
                    placeholder="admin@yourhall.com"
                    value={email}
                    error={errors.email}
                    onChange={(e) => handleRegisterChange('email', e.target.value, setEmail)}
                  />
                </div>

                {/* Column 2 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <Input
                    label="Address"
                    required
                    placeholder="Full Physical Address"
                    value={address}
                    error={errors.address}
                    onChange={(e) => handleRegisterChange('address', e.target.value, setAddress)}
                  />
                  <Input
                    label="Pincode"
                    required
                    placeholder="PIN code"
                    value={pincode}
                    error={errors.pincode}
                    onChange={(e) => handleRegisterChange('pincode', e.target.value, setPincode)}
                  />
                  <Input
                    label="Password"
                    type="password"
                    required
                    placeholder="Min 6 characters"
                    value={password}
                    error={errors.password}
                    onChange={(e) => handleRegisterChange('password', e.target.value, setPassword)}
                  />

                  {/* Optional Section Accordion Trigger */}
                  <button
                    type="button"
                    onClick={() => setShowOptional(!showOptional)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
                      padding: '0.75rem 1rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px',
                      color: '#475569', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                      marginTop: '1.25rem', transition: 'all 200ms ease'
                    }}
                  >
                    <span>Additional Details (Optional)</span>
                    <span style={{ fontSize: '0.7rem' }}>{showOptional ? '▲' : '▼'}</span>
                  </button>
                </div>
              </div>

              {/* Optional Section Accordion Content */}
              {showOptional && (
                <div className="optional-accordion optional-grid" style={{
                  padding: '1rem',
                  border: '1px solid #f1f5f9',
                  borderRadius: '10px',
                  background: '#fafbfd',
                  marginTop: '0.25rem',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: '0.75rem'
                }}>
                  <Input
                    label="GST Number"
                    placeholder="GSTIN"
                    value={gstNumber}
                    error={errors.gstNumber}
                    onChange={(e) => handleRegisterChange('gstNumber', e.target.value, setGstNumber)}
                  />
                  <Input
                    label="Logo URL"
                    placeholder="Logo link"
                    value={logo}
                    onChange={(e) => setLogo(e.target.value)}
                  />
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                fullWidth
                size="lg"
                isLoading={isRegisterLoading}
                style={{ marginTop: '1rem' }}
              >
                Register & Log In
              </Button>

              <div style={{ display: 'flex', alignItems: 'center', margin: '1rem 0', color: '#94a3b8' }}>
                <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
                <span style={{ padding: '0 0.75rem', fontSize: '0.75rem', fontWeight: 700 }}>OR</span>
                <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
              </div>

              <Button
                type="button"
                variant="outline"
                fullWidth
                size="lg"
                onClick={() => setShowGoogleModal(true)}
                isLoading={isGoogleLoading}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  borderColor: '#cbd5e1', color: '#334155', background: '#ffffff', fontWeight: 600
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6-4.53z" fill="#EA4335" />
                </svg>
                Continue with Google
              </Button>
            </form>
          )}
        </div>
      </div>

      {/* Google Account Simulator Modal */}
      {showGoogleModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, animation: 'fadeIn 200ms ease-out'
        }}>
          <div style={{
            width: '100%', maxWidth: '400px', margin: '2rem',
            background: '#ffffff', borderRadius: '16px',
            border: '1px solid rgba(226, 232, 240, 0.8)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.25)'
          }}>
            <div style={{ padding: '2rem' }}>
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#f1f5f9',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem auto'
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6-4.53z" fill="#EA4335" />
                  </svg>
                </div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Google Account Simulator
                </h2>
                <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.8rem', fontWeight: 500 }}>
                  Sign in with Google sandbox credentials
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.05em' }}>QUICK SELECT</span>
                  <button
                    type="button"
                    onClick={() => {
                      setGoogleEmail('john.doe@gmail.com');
                      setGoogleName('John Doe');
                    }}
                    style={{
                      padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0',
                      background: '#f8fafc', textAlign: 'left', cursor: 'pointer',
                      display: 'flex', flexDirection: 'column'
                    }}
                  >
                    <strong style={{ color: '#334155', fontSize: '0.85rem' }}>John Doe</strong>
                    <span style={{ color: '#64748b', fontSize: '0.75rem' }}>john.doe@gmail.com</span>
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', color: '#cbd5e1', fontSize: '0.7rem', fontWeight: 700 }}>
                  <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
                  <span style={{ padding: '0 0.5rem', letterSpacing: '0.05em' }}>OR ENTER CUSTOM</span>
                  <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
                </div>

                <Input
                  label="Google Email Address"
                  placeholder="email@gmail.com"
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                />

                <Input
                  label="Google User Name"
                  placeholder="Your Name"
                  value={googleName}
                  onChange={(e) => setGoogleName(e.target.value)}
                />

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <Button type="button" variant="outline" fullWidth onClick={() => setShowGoogleModal(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    fullWidth
                    isLoading={isGoogleLoading}
                    disabled={!googleEmail || !googleName}
                    onClick={() => {
                      handleGoogleSignIn(googleEmail, googleName);
                      setShowGoogleModal(false);
                    }}
                  >
                    Verify & Log In
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}