import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useLoginMutation } from '../../store/api';
import { setCredentials } from '../../store/authSlice';
import type { RootState } from '../../store';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export default function SuperAdminLogin() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const [loginMutation, { isLoading }] = useLoginMutation();

  // If already logged in as super admin, redirect to dashboard
  useEffect(() => {
    if (user && user.role === 'SUPER_ADMIN') {
      navigate('/super-admin', { replace: true });
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      const res = await loginMutation({ email, password }).unwrap();
      
      // Strict Check: Only allow SUPER_ADMINs to login through this portal
      if (res.user.role !== 'SUPER_ADMIN') {
        setError('Unauthorized access. This portal is strictly for Trishul Industries admins.');
        return;
      }
      
      dispatch(setCredentials(res));
      navigate('/super-admin', { replace: true });
    } catch (err: any) {
      setError(err?.data?.message || 'Login failed. Check your credentials.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#0f172a' }}>
      
      {/* Left side: Branding */}
      <div style={{ flex: '1', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '4rem', color: 'white', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(245, 158, 11, 0.15) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        
        <div style={{ zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
            <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f172a', fontWeight: 900, fontSize: '1.25rem' }}>
              T
            </div>
            <span style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '0.05em' }}>TRISHUL HQ</span>
          </div>
          
          <h1 style={{ fontSize: '3rem', fontWeight: 800, lineHeight: 1.1, marginBottom: '1.5rem', maxWidth: '500px' }}>
            Platform Control Center
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '1.1rem', maxWidth: '400px', lineHeight: 1.6 }}>
            The central command for managing StudyFlow workspaces, SaaS subscriptions, and platform metrics.
          </p>
        </div>
      </div>
      
      {/* Right side: Login Form */}
      <div style={{ flex: '0 0 500px', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ width: '100%', maxWidth: '360px' }}>
          
          <div style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ color: 'white', margin: '0 0 0.5rem 0', fontSize: '1.75rem', fontWeight: 800 }}>Admin Login</h2>
            <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.9rem' }}>Enter your Trishul Industries credentials.</p>
          </div>
          
          {error && (
            <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.85rem', fontWeight: 600, border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              {error}
            </div>
          )}
          
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem' }}>Admin Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value.toLowerCase())}
                style={{ width: '100%', padding: '0.75rem 1rem', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '0.9rem', outline: 'none' }}
                placeholder="admin@trishul.com"
              />
            </div>
            
            <div>
              <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem' }}>Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', padding: '0.75rem 1rem', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '0.9rem', outline: 'none' }}
                placeholder="••••••••"
              />
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              style={{ 
                marginTop: '1rem', width: '100%', padding: '0.875rem', background: '#fbbf24', color: '#0f172a', 
                border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.95rem', cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.7 : 1, transition: 'all 0.2s ease'
              }}
            >
              {isLoading ? 'Authenticating...' : 'Sign In to HQ'}
            </button>
          </form>
          
          <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
            <p style={{ color: '#475569', fontSize: '0.75rem', margin: 0 }}>
              &copy; {new Date().getFullYear()} Trishul Industries. All rights reserved.
            </p>
          </div>
          
        </div>
      </div>
      
    </div>
  );
}
