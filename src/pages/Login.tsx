import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useLoginMutation, useRegisterTenantMutation, useGoogleLoginMutation } from '../store/api';
import { setCredentials } from '../store/authSlice';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/ToastContext';
import { 
  Mail, Lock, User, Building, MapPin, TrendingUp, Users, Wallet, Clock, 
  ArrowRight, Eye, EyeOff, Check, HelpCircle, Activity, Globe, Shield, RefreshCw, AlertCircle
} from 'lucide-react';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { showToast } = useToast();
  
  // 0 = Sign In, 1 = Register Hall
  const [tab, setTab] = useState(0); 

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Register fields
  const [name, setName] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');
  const [address, setAddress] = useState('');
  const [pincode, setPincode] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [logo, setLogo] = useState('');
  const [showOptional, setShowOptional] = useState(false);

  // Google Simulator fields
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [showDisabledModal, setShowDisabledModal] = useState(false);
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
    if (searchParams.get('disabled') === 'true') {
      setShowDisabledModal(true);
      navigate('/login', { replace: true });
    }
  }, [location.search, showToast, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await loginMutation({ email, password }).unwrap();
      dispatch(setCredentials(res));
      if (res.user?.role === 'SUPER_ADMIN') {
        navigate('/super-admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      if (err?.data?.message?.includes('disabled') || err?.data?.message?.includes('Access denied')) {
        setShowDisabledModal(true);
      } else {
        setError(err?.data?.message || 'Login failed. Check credentials.');
      }
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
      } else if (res.user?.role === 'SUPER_ADMIN') {
        navigate('/super-admin');
      } else {
        navigate('/dashboard');
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
    const finalVal = field === 'email' ? value.toLowerCase() : value;
    setter(finalVal);
    validateField(field, finalVal);
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
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.data?.message || 'Registration failed.');
    }
  };

  // Live seat map sample grids
  const seatRows = 5;
  const seatCols = 8;
  const occupiedSeeds = [2, 5, 9, 11, 14, 18, 21, 23, 27, 30, 33, 36, 38];

  return (
    <div className="login-page-container">
      
      {/* ============ LEFT: BRAND / GLASSMORPHISM PANEL (60%) ============ */}
      <div className="login-brand-side">
        {/* Glow Effects */}
        <div className="glow-blob-1" />
        <div className="glow-blob-2" />

        {/* Brand header */}
        <div className="brand-header">
          <div className="brand-logo-container">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="brand-logo-icon">
              <path d="M12 2v19" />
              <path d="M5 6v4c0 3.87 3.13 7 7 7s7-3.13 7-7V6" />
              <path d="M9 11h6" />
            </svg>
          </div>
          <span className="brand-title">TRISHUL</span>
        </div>

        {/* Brand Hero Content */}
        <div className="brand-hero-content">
          <h1 className="brand-headline">
            Manage your Study Hall from a single dashboard.
          </h1>
          <p className="brand-description">
            The complete operating system for modern libraries. Streamline seat booking, active memberships, invoicing, and real-time occupancy.
          </p>
        </div>

        {/* Layered Floating Widgets */}
        <div className="brand-widgets-container">
          
          {/* Widget 1: Live Seat Map */}
          <div className="glass-widget widget-seatmap">
            <div className="widget-title-row">
              <span className="widget-label">Live Seat Map</span>
              <span className="widget-value-badge">
                <span className="live-dot" /> 27 / 40 Free
              </span>
            </div>
            <div className="seatmap-grid">
              {Array.from({ length: seatRows * seatCols }).map((_, i) => {
                const isOccupied = occupiedSeeds.includes(i);
                return (
                  <div
                    key={i}
                    className={`seat-cell ${isOccupied ? 'occupied' : 'available'}`}
                  />
                );
              })}
            </div>
          </div>

          {/* Widget 2: Revenue Sparkline */}
          <div className="glass-widget widget-analytics">
            <div className="widget-title-row">
              <span className="widget-label">Monthly Revenue</span>
              <span className="revenue-trend">
                <TrendingUp size={12} style={{ marginRight: '3px' }} /> +12.4%
              </span>
            </div>
            <div className="revenue-value">
              ₹1,84,500
              <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}>this month</span>
            </div>
            <svg className="sparkline-svg" viewBox="0 0 300 70">
              <defs>
                <linearGradient id="sparkline-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="sparkline-line" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="50%" stopColor="#60A5FA" />
                  <stop offset="100%" stopColor="#2563EB" />
                </linearGradient>
              </defs>
              <path
                className="sparkline-path"
                d="M 0 50 C 30 45, 60 25, 90 35 C 120 45, 150 15, 180 20 C 210 25, 240 5, 270 10 L 300 5"
                stroke="url(#sparkline-line)"
              />
              <path
                d="M 0 50 C 30 45, 60 25, 90 35 C 120 45, 150 15, 180 20 C 210 25, 240 5, 270 10 L 300 5 L 300 70 L 0 70 Z"
                fill="url(#sparkline-gradient)"
              />
            </svg>
          </div>

          {/* Widget 3: Live Stats Grid */}
          <div className="glass-widget widget-metrics">
            <div className="widget-title-row">
              <span className="widget-label">Hall Metrics</span>
              <span className="widget-value-badge" style={{ color: 'var(--color-secondary)', background: 'rgba(59, 130, 246, 0.1)' }}>
                Active
              </span>
            </div>
            <div className="metrics-list">
              <div className="metric-row">
                <span className="metric-name">
                  <Activity size={13} className="metric-icon" /> Occupancy
                </span>
                <span className="metric-value">82.5%</span>
              </div>
              <div className="metric-row">
                <span className="metric-name">
                  <Users size={13} className="metric-icon" /> Members
                </span>
                <span className="metric-value">342 active</span>
              </div>
              <div className="metric-row">
                <span className="metric-name">
                  <Clock size={13} className="metric-icon" /> Live Checkins
                </span>
                <span className="metric-value">48 present</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Trust stats */}
        <div className="brand-trust-strip">
          <div className="trust-stat-item">
            <span className="trust-stat-number">500+</span>
            <span className="trust-stat-label">Study Halls</span>
          </div>
          <div className="trust-stat-item">
            <span className="trust-stat-number">24/7</span>
            <span className="trust-stat-label">Live Monitoring</span>
          </div>
          <div className="trust-stat-item">
            <span className="trust-stat-number">99.9%</span>
            <span className="trust-stat-label">System Uptime</span>
          </div>
        </div>
      </div>

      {/* ============ RIGHT: AUTHENTICATION PANEL (40%) ============ */}
      <div className="login-auth-side"> 
        <div className="auth-card-glow" />
        
        <div className="auth-card">
          <div className="auth-header">
            <h2 className="auth-title">
              {tab === 0 ? 'Welcome Back' : 'Register Hall'}
            </h2>
            <p className="auth-subtitle">
              {tab === 0 ? 'Sign in to manage your study hall.' : 'Get your workspace ready in a minute.'}
            </p>
          </div>

          {/* Segmented Control */}
          <div className="segmented-control-container">
            <div 
              className="segmented-slider-pill" 
              style={{ transform: tab === 0 ? 'translateX(0%)' : 'translateX(100%)' }} 
            />
            <button
              type="button"
              className={`segmented-tab-btn ${tab === 0 ? 'active' : ''}`}
              onClick={() => { setTab(0); setError(''); }}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`segmented-tab-btn ${tab === 1 ? 'active' : ''}`}
              onClick={() => { setTab(1); setError(''); }}
            >
              Register Hall
            </button>
          </div>

          {/* Alert error banner */}
          {error && (
            <div className="alert-banner-danger">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Form Switcher */}
          {tab === 0 ? (
            /* ================= SIGN IN FORM ================= */
            <form onSubmit={handleLogin} className="auth-form">
              <div className="premium-input-group">
                <label className="premium-label">Email Address</label>
                <div className="premium-input-wrapper">
                  <Mail size={16} className="premium-input-icon" />
                  <input
                    type="email"
                    required
                    className="premium-input"
                    placeholder="admin@yourhall.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value.toLowerCase())}
                  />
                </div>
              </div>

              <div className="premium-input-group">
                <label className="premium-label">Password</label>
                <div className="premium-input-wrapper">
                  <Lock size={16} className="premium-input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="premium-input has-toggle"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="input-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Action row (Remember & Forgot) */}
              <div className="form-action-row">
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Remember me</span>
                </label>
                <a 
                  href="#" 
                  className="forgot-password-link"
                  onClick={(e) => {
                    e.preventDefault();
                    showToast('Please contact Trishul support to reset your workspace password.', 'info');
                  }}
                >
                  Forgot Password?
                </a>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="btn-primary-gradient"
                disabled={isLoginLoading}
              >
                {isLoginLoading ? (
                  <>
                    <svg className="premium-spinner" viewBox="0 0 50 50">
                      <circle className="premium-spinner-circle" cx="25" cy="25" r="20" fill="none" strokeWidth="5" stroke="currentColor"></circle>
                    </svg>
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              <div className="divider-row">
                <div className="divider-line" />
                <span className="divider-text">OR</span>
                <div className="divider-line" />
              </div>

              {/* Google Sign In */}
              <button
                type="button"
                className="btn-social-outline"
                onClick={() => setShowGoogleModal(true)}
                disabled={isGoogleLoading}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6-4.53z" fill="#EA4335" />
                </svg>
                <span>Continue with Google</span>
              </button>
            </form>
          ) : (
            /* ================= REGISTER FORM ================= */
            <form onSubmit={handleRegister} className="auth-form">
              <div className="register-grid-layout">
                {/* Column 1 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div className="premium-input-group">
                    <label className="premium-label">Owner Name</label>
                    <div className="premium-input-wrapper">
                      <User size={16} className="premium-input-icon" />
                      <input
                        type="text"
                        required
                        className={`premium-input ${errors.name ? 'input-error' : ''}`}
                        placeholder="Full Name"
                        value={name}
                        onChange={(e) => handleRegisterChange('name', e.target.value, setName)}
                      />
                    </div>
                    {errors.name && (
                      <span className="input-error-msg">
                        <AlertCircle size={12} /> {errors.name}
                      </span>
                    )}
                  </div>

                  <div className="premium-input-group">
                    <label className="premium-label">Workspace Name</label>
                    <div className="premium-input-wrapper">
                      <Building size={16} className="premium-input-icon" />
                      <input
                        type="text"
                        required
                        className={`premium-input ${errors.workspaceName ? 'input-error' : ''}`}
                        placeholder="Royal Study Space"
                        value={workspaceName}
                        onChange={(e) => handleRegisterChange('workspaceName', e.target.value, setWorkspaceName)}
                      />
                    </div>
                    {errors.workspaceName && (
                      <span className="input-error-msg">
                        <AlertCircle size={12} /> {errors.workspaceName}
                      </span>
                    )}
                  </div>

                  <div className="premium-input-group">
                    <label className="premium-label">Email</label>
                    <div className="premium-input-wrapper">
                      <Mail size={16} className="premium-input-icon" />
                      <input
                        type="email"
                        required
                        className={`premium-input ${errors.email ? 'input-error' : ''}`}
                        placeholder="admin@yourhall.com"
                        value={email}
                        onChange={(e) => handleRegisterChange('email', e.target.value, setEmail)}
                      />
                    </div>
                    {errors.email && (
                      <span className="input-error-msg">
                        <AlertCircle size={12} /> {errors.email}
                      </span>
                    )}
                  </div>
                </div>

                {/* Column 2 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div className="premium-input-group">
                    <label className="premium-label">Address</label>
                    <div className="premium-input-wrapper">
                      <MapPin size={16} className="premium-input-icon" />
                      <input
                        type="text"
                        required
                        className={`premium-input ${errors.address ? 'input-error' : ''}`}
                        placeholder="Full Address"
                        value={address}
                        onChange={(e) => handleRegisterChange('address', e.target.value, setAddress)}
                      />
                    </div>
                    {errors.address && (
                      <span className="input-error-msg">
                        <AlertCircle size={12} /> {errors.address}
                      </span>
                    )}
                  </div>

                  <div className="premium-input-group">
                    <label className="premium-label">Pincode</label>
                    <div className="premium-input-wrapper">
                      <MapPin size={16} className="premium-input-icon" />
                      <input
                        type="text"
                        required
                        className={`premium-input ${errors.pincode ? 'input-error' : ''}`}
                        placeholder="PIN code"
                        value={pincode}
                        onChange={(e) => handleRegisterChange('pincode', e.target.value, setPincode)}
                      />
                    </div>
                    {errors.pincode && (
                      <span className="input-error-msg">
                        <AlertCircle size={12} /> {errors.pincode}
                      </span>
                    )}
                  </div>

                  <div className="premium-input-group">
                    <label className="premium-label">Password</label>
                    <div className="premium-input-wrapper">
                      <Lock size={16} className="premium-input-icon" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        className={`premium-input has-toggle ${errors.password ? 'input-error' : ''}`}
                        placeholder="Min 6 characters"
                        value={password}
                        onChange={(e) => handleRegisterChange('password', e.target.value, setPassword)}
                      />
                      <button
                        type="button"
                        className="input-password-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {errors.password && (
                      <span className="input-error-msg">
                        <AlertCircle size={12} /> {errors.password}
                      </span>
                    )}
                  </div>
                </div>

                {/* Optional Accordion Trigger */}
                <button
                  type="button"
                  className="optional-accordion-trigger"
                  onClick={() => setShowOptional(!showOptional)}
                >
                  <span>Additional Details (Optional)</span>
                  <span style={{ fontSize: '0.75rem', transition: 'transform 0.2s', transform: showOptional ? 'rotate(180deg)' : 'rotate(0)' }}>▼</span>
                </button>

                {/* Optional Accordion Body */}
                {showOptional && (
                  <div className="optional-accordion-body">
                    <div className="premium-input-group">
                      <label className="premium-label">GST Number</label>
                      <div className="premium-input-wrapper">
                        <Building size={16} className="premium-input-icon" />
                        <input
                          type="text"
                          className={`premium-input ${errors.gstNumber ? 'input-error' : ''}`}
                          placeholder="15-char GSTIN"
                          value={gstNumber}
                          onChange={(e) => handleRegisterChange('gstNumber', e.target.value, setGstNumber)}
                        />
                      </div>
                      {errors.gstNumber && (
                        <span className="input-error-msg">
                          <AlertCircle size={12} /> {errors.gstNumber}
                        </span>
                      )}
                    </div>

                    <div className="premium-input-group">
                      <label className="premium-label">Logo URL</label>
                      <div className="premium-input-wrapper">
                        <Globe size={16} className="premium-input-icon" />
                        <input
                          type="text"
                          className="premium-input"
                          placeholder="Logo link"
                          value={logo}
                          onChange={(e) => setLogo(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Registration Button */}
              <button
                type="submit"
                className="btn-primary-gradient"
                disabled={isRegisterLoading}
                style={{ marginTop: '0.5rem' }}
              >
                {isRegisterLoading ? (
                  <>
                    <svg className="premium-spinner" viewBox="0 0 50 50">
                      <circle className="premium-spinner-circle" cx="25" cy="25" r="20" fill="none" strokeWidth="5" stroke="currentColor"></circle>
                    </svg>
                    <span>Registering workspace...</span>
                  </>
                ) : (
                  <>
                    <span>Register & Log In</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              <div className="divider-row">
                <div className="divider-line" />
                <span className="divider-text">OR</span>
                <div className="divider-line" />
              </div>

              {/* Google Sign In */}
              <button
                type="button"
                className="btn-social-outline"
                onClick={() => setShowGoogleModal(true)}
                disabled={isGoogleLoading}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6-4.53z" fill="#EA4335" />
                </svg>
                <span>Continue with Google</span>
              </button>
            </form>
          )}

          {/* Footer content */}
          <div className="auth-footer">
            <span style={{ marginRight: '4px' }}>Need help?</span>
            <a 
              href="mailto:support@trishulsaas.com?subject=Login%20Inquiry" 
              className="footer-support-link"
            >
              Contact Support
            </a>
            <div className="footer-legal-links">
              <a href="#" onClick={(e) => e.preventDefault()} className="legal-link">Privacy Policy</a>
              <span>•</span>
              <a href="#" onClick={(e) => e.preventDefault()} className="legal-link">Terms of Service</a>
            </div>
          </div>
        </div>
      </div>

      {/* ================= GOOGLE SIMULATOR MODAL ================= */}
      {showGoogleModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.3)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 999999, animation: 'fadeIn 200ms ease-out'
        }}>
          <div className="auth-card premium-modal-glass" style={{ width: '100%', maxWidth: '400px', margin: '2rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(15, 23, 42, 0.03)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem auto',
                border: '1px solid rgba(15, 23, 42, 0.08)'
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6-4.53z" fill="#EA4335" />
                </svg>
              </div>
              <h2 className="auth-title" style={{ fontSize: '1.25rem' }}>
                Google Account Simulator
              </h2>
              <p className="auth-subtitle" style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
                Sign in with Google sandbox credentials
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <span className="widget-label" style={{ fontSize: '0.65rem' }}>Quick Select</span>
                <button
                  type="button"
                  className="simulator-quick-btn"
                  onClick={() => {
                    setGoogleEmail('john.doe@gmail.com');
                    setGoogleName('John Doe');
                  }}
                >
                  <strong>John Doe</strong>
                  <span>john.doe@gmail.com</span>
                </button>
              </div>

              <div className="divider-row" style={{ margin: '0.5rem 0' }}>
                <div className="divider-line" />
                <span className="divider-text" style={{ fontSize: '0.65rem' }}>OR ENTER CUSTOM</span>
                <div className="divider-line" />
              </div>

              <div className="premium-input-group">
                <label className="premium-label">Google Email Address</label>
                <div className="premium-input-wrapper">
                  <Mail size={16} className="premium-input-icon" />
                  <input
                    type="email"
                    className="premium-input"
                    placeholder="email@gmail.com"
                    value={googleEmail}
                    onChange={(e) => setGoogleEmail(e.target.value.toLowerCase())}
                  />
                </div>
              </div>

              <div className="premium-input-group">
                <label className="premium-label">Google User Name</label>
                <div className="premium-input-wrapper">
                  <User size={16} className="premium-input-icon" />
                  <input
                    type="text"
                    className="premium-input"
                    placeholder="Your Name"
                    value={googleName}
                    onChange={(e) => setGoogleName(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button 
                  type="button" 
                  className="btn-social-outline" 
                  style={{ flex: 1 }} 
                  onClick={() => setShowGoogleModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-primary-gradient"
                  style={{ flex: 1 }}
                  disabled={!googleEmail || !googleName || isGoogleLoading}
                  onClick={() => {
                    handleGoogleSignIn(googleEmail, googleName);
                    setShowGoogleModal(false);
                  }}
                >
                  {isGoogleLoading ? (
                    <svg className="premium-spinner" viewBox="0 0 50 50">
                      <circle className="premium-spinner-circle" cx="25" cy="25" r="20" fill="none" strokeWidth="5" stroke="currentColor"></circle>
                    </svg>
                  ) : (
                    <span>Log In</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= WORKSPACE SUSPENDED MODAL ================= */}
      <Modal
        isOpen={showDisabledModal}
        onClose={() => setShowDisabledModal(false)}
        title={
          <span style={{ color: 'var(--color-danger)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={20} /> Access Suspended
          </span>
        }
        maxWidth="sm"
      >
        <div style={{ padding: '0.5rem 0' }}>
          <p style={{ margin: '0 0 1.5rem 0', color: 'var(--color-text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>
            Your library workspace access has been suspended or disabled by the platform administrator. 
            Please contact customer support to verify your billing status or reactivate your account.
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button 
              type="button" 
              className="btn-social-outline" 
              onClick={() => setShowDisabledModal(false)}
              style={{ flex: 1 }}
            >
              Cancel
            </button>
            <button 
              type="button" 
              className="btn-primary-gradient" 
              onClick={() => {
                window.location.href = 'mailto:support@trishulsaas.com?subject=Workspace%20Suspension%20Inquiry';
              }}
              style={{ flex: 1, backgroundColor: 'var(--color-danger)', boxShadow: '0 4px 14px rgba(239, 68, 68, 0.25)' }}
            >
              Contact Support
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}