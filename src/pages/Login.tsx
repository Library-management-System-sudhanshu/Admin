import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useLoginMutation, useRegisterTenantMutation, useGoogleLoginMutation } from '../store/api';
import { setCredentials } from '../store/authSlice';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/ToastContext';
import { 
  Mail, Lock, User, Building, MapPin, Users, Armchair, BookOpen, ArrowUpRight,
  ArrowRight, Eye, EyeOff, Check, Globe, Shield, AlertCircle
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

    // Google Identity Services (GIS) Integration
    const clientId = (import.meta as any).env.VITE_GOOGLE_CLIENT_ID;
    if (clientId) {
      const scriptId = 'google-gsi-script';
      if (!document.getElementById(scriptId)) {
        const script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => {
          if ((window as any).google?.accounts?.id) {
            (window as any).google.accounts.id.initialize({
              client_id: clientId,
              callback: async (response: any) => {
                if (response.credential) {
                  try {
                    const res = await googleLogin({ idToken: response.credential }).unwrap();
                    dispatch(setCredentials(res));
                    if (res.requiresWorkspaceInfo) {
                      navigate('/setup-workspace');
                    } else if (res.user?.role === 'SUPER_ADMIN') {
                      navigate('/super-admin');
                    } else {
                      navigate('/dashboard');
                    }
                  } catch (err: any) {
                    setError(err?.data?.message || 'Google Sign-In failed.');
                  }
                }
              }
            });
          }
        };
        document.body.appendChild(script);
      }
    }
  }, [location.search, showToast, navigate, googleLogin, dispatch]);

  const triggerGoogleAuth = () => {
    const clientId = (import.meta as any).env.VITE_GOOGLE_CLIENT_ID;
    if (clientId && (window as any).google?.accounts?.id) {
      (window as any).google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          setShowGoogleModal(true);
        }
      });
    } else {
      setShowGoogleModal(true);
    }
  };

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

  return (
    <div className="login-page-container login-home-theme">
      <header className="login-topbar">
        <Link to="/" className="login-wordmark" aria-label="Trishul home">
          <svg viewBox="0 0 40 40" fill="none" aria-hidden="true"><rect width="40" height="40" rx="12" fill="currentColor" /><path d="M12 12v8c0 5 3.5 7 8 7s8-2 8-7v-8M20 10v22" stroke="white" strokeWidth="2.7" strokeLinecap="round" /><path d="m9 15 3-3 3 3m10 0 3-3 3 3m-14-2 3-3 3 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          <span>trishul<span className="login-brand-dot">.</span></span>
        </Link>
        <Link to="/" className="login-back-link">Back to home <ArrowUpRight size={15} /></Link>
      </header>

      <aside className="login-brand-side">
        <div className="brand-hero-content">
          <span className="login-eyebrow"><span /> A LITTLE MORE ORGANISED.</span>
          <h1 className="brand-headline">Your space.<br />Your people.<br /><span>All together.</span></h1>
          <p className="brand-description">A calmer way to run your study hall. Bring your students, seats and everyday tasks into one thoughtful workspace.</p>
        </div>

        <div className="login-preview" aria-label="Illustrative workspace preview with sample seat data">
          <div className="login-preview-heading"><span><BookOpen size={16} /> The reading room</span><span className="login-demo-label">SAMPLE PREVIEW</span></div>
          <div className="login-preview-meta"><span>Room 01 <span> / Morning shift</span></span><span><i /> 12 seats available</span></div>
          <div className="login-room-grid" aria-hidden="true">
            {Array.from({ length: 24 }, (_, i) => <div key={i} className={`login-room-seat ${i % 4 < 2 ? 'is-taken' : ''}`}><Armchair size={21} strokeWidth={1.5} /><span>A{String(i + 1).padStart(2, '0')}</span></div>)}
          </div>
          <div className="login-preview-bottom"><span><i /> Available <i /> Occupied</span><span>24 seats · One clear view</span></div>
          <div className="login-member-note"><span className="login-member-icon"><Users size={19} /></span><div><strong>Everything in its place.</strong><span>Students. Seats. A calmer day.</span></div><span className="login-note-check"><Check size={15} /></span></div>
        </div>

        <div className="login-feature-note"><span><Check size={14} /> Seat planning</span><span><Check size={14} /> Fee tracking</span><span><Check size={14} /> Student records</span></div>
      </aside>

      {/* ============ RIGHT: AUTHENTICATION PANEL (40%) ============ */}
      <div className="login-auth-side">

        
        <div className="auth-card">
          <div className="auth-header">
            <span className="login-eyebrow">YOUR TRISHUL WORKSPACE</span>
            <h2 className="auth-title">
              {tab === 0 ? 'Welcome back.' : 'Make room for more.'}
            </h2>
            <p className="auth-subtitle">
              {tab === 0 ? 'Good to see you. Let’s get your day organised.' : 'Create an account to bring your study hall together.'}
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
              aria-pressed={tab === 0}
              onClick={() => { setTab(0); setError(''); }}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`segmented-tab-btn ${tab === 1 ? 'active' : ''}`}
              aria-pressed={tab === 1}
              onClick={() => { setTab(1); setError(''); }}
            >
              Register Hall
            </button>
          </div>

          {/* Alert error banner */}
          {error && (
            <div className="alert-banner-danger" role="alert">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Form Switcher */}
          {tab === 0 ? (
            /* ================= SIGN IN FORM ================= */
            <form onSubmit={handleLogin} className="auth-form">
              <div className="premium-input-group">
                <label className="premium-label" htmlFor="login-email">Email Address</label>
                <div className="premium-input-wrapper">
                  <Mail size={16} className="premium-input-icon" />
                  <input
                    type="email"
                    id="login-email"
                    autoComplete="username"
                    required
                    className="premium-input"
                    placeholder="admin@yourhall.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value.toLowerCase())}
                  />
                </div>
              </div>

              <div className="premium-input-group">
                <label className="premium-label" htmlFor="login-password">Password</label>
                <div className="premium-input-wrapper">
                  <Lock size={16} className="premium-input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="login-password"
                    autoComplete="current-password"
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
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
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
                onClick={triggerGoogleAuth}
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
                    <label className="premium-label">Library/Study Space Name</label>
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
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
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
                  aria-expanded={showOptional}
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
                onClick={triggerGoogleAuth}
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
              <Link to="/privacy" className="legal-link">Privacy Policy</Link>
              <span>•</span>
              <Link to="/terms" className="legal-link">Terms of Service</Link>
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