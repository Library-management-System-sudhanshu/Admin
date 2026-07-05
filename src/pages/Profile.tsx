import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useToast } from '../components/ui/ToastContext';
import type { RootState } from '../store';
import { useGetProfileQuery, useUpdateProfileMutation } from '../store/api';
import { setCredentials } from '../store/authSlice';
import { 
  Save as SaveIcon, 
  Lock as LockIcon, 
  Shield as ShieldIcon
} from 'lucide-react';

export default function Profile() {
  const { showToast } = useToast();
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
      showToast('Account and Library details saved successfully!', 'success');
      refetch();
    } catch (err: any) {
      showToast(err?.data?.message || 'Failed to update profile.', 'error');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }

    if (password.length < 6) {
      showToast('Password must be at least 6 characters.', 'error');
      return;
    }

    try {
      const updatedUser = await updateProfile({ password }).unwrap();
      dispatch(setCredentials({ user: updatedUser, accessToken: token || '' }));
      showToast('Password updated successfully!', 'success');
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      showToast(err?.data?.message || 'Failed to update password.', 'error');
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .profile-grid {
          display: grid;
          grid-template-columns: 1.8fr 1fr;
          gap: 24px;
        }
        .profile-card {
          background: #ffffff;
          border: 1px solid rgba(226, 232, 240, 0.8);
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.02);
          transition: transform 200ms ease, box-shadow 200ms ease;
        }
        .profile-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05), 0 4px 6px -2px rgba(0,0,0,0.02);
        }
        .input-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
        }
        @media (max-width: 900px) {
          .profile-grid {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 600px) {
          .input-grid-2 {
            grid-template-columns: 1fr;
          }
        }
      `}} />

      {/* Page Header */}
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.025em' }}>
          Account Settings
        </h1>
        <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Manage your personal profile, security options, and workspace details.
        </p>
      </div>

      {/* Profile Hero Card */}
      <div className="profile-card" style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '24px',
        flexWrap: 'wrap',
        padding: '32px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            fontSize: '2.25rem',
            background: 'linear-gradient(135deg, var(--primary) 0%, #3b82f6 100%)',
            color: '#ffffff',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 30px rgba(37, 99, 235, 0.25)'
          }}>
            {name?.charAt(0).toUpperCase() || 'A'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: '#ffffff', letterSpacing: '-0.015em' }}>
                {name}
              </h2>
              <div style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '4px', 
                backgroundColor: 'rgba(255, 255, 255, 0.1)', 
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#38bdf8',
                padding: '2px 8px',
                borderRadius: '9999px',
                fontSize: '0.7rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                <ShieldIcon size={12} />
                {user?.role}
              </div>
            </div>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem' }}>
              {email}
            </p>
          </div>
        </div>

        {/* Small Statistics Cards */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', flex: 1, justifyContent: 'flex-end', minWidth: '280px' }}>
          {[
            { label: 'Workspace', value: workspaceName || 'N/A' },
            { label: 'Role', value: user?.role || 'Staff' },
            { label: 'Status', value: 'Active', color: '#4ade80' }
          ].map((stat, idx) => (
            <div key={idx} style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              padding: '12px 18px',
              minWidth: '110px'
            }}>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {stat.label}
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, marginTop: '2px', color: stat.color || '#f8fafc' }}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Two-Column Responsive Layout */}
      <div className="profile-grid">
        
        {/* LEFT COLUMN (65%) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Personal Information Card */}
            <div className="profile-card">
              <div style={{ marginBottom: '18px' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
                  Personal Information
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
                  Update your account contact settings.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <Input
                  label="Full Name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />

                <div className="input-grid-2">
                  <Input
                    label="Email Address"
                    type="email"
                    required
                    value={email}
                    disabled
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <Input
                    label="Mobile Number"
                    placeholder="e.g. 9876543210"
                    value={mobile}
                    disabled
                    onChange={(e) => setMobile(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Workspace Information Card */}
            <div className="profile-card">
              <div style={{ marginBottom: '18px' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
                  Workspace / Library Details
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
                  Manage your physical library address and registration settings.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <Input
                  label="Workspace/Library Name"
                  required
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                />

                <div className="custom-input-container w-full" style={{ marginBottom: 0 }}>
                  <label className="custom-input-label">Address</label>
                  <div className="custom-input-wrapper">
                    <textarea
                      required
                      rows={3}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="custom-input"
                      style={{ 
                        padding: '0.75rem', 
                        width: '100%', 
                        fontFamily: 'inherit', 
                        fontSize: '0.95rem',
                        resize: 'vertical',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--bg-surface)'
                      }}
                    />
                  </div>
                </div>

                <div className="input-grid-2">
                  <Input
                    label="Pincode"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                  />
                  <Input
                    label="GST Number (Optional)"
                    value={gstNumber}
                    onChange={(e) => setGstNumber(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-start' }}>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isUpdating}
                  style={{ 
                    borderRadius: '8px', 
                    padding: '0.65rem 1.5rem', 
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.9rem'
                  }}
                >
                  <SaveIcon size={16} />
                  {isUpdating ? 'Saving...' : 'Save Details'}
                </Button>
              </div>
            </div>
          </form>
        </div>

        {/* RIGHT COLUMN (35%) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Security Card */}
          <div className="profile-card">
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '18px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '8px',
                background: 'rgba(99, 102, 241, 0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--primary)', flexShrink: 0
              }}>
                <LockIcon size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 2px 0' }}>
                  Change Password
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
                  Ensure your account is protected.
                </p>
              </div>
            </div>

            <form onSubmit={handleChangePassword}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <Input
                  label="New Password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                <Input
                  label="Confirm New Password"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />

                <div style={{ marginTop: '6px' }}>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isUpdating}
                    style={{ 
                      borderRadius: '8px', 
                      padding: '0.65rem 1.5rem', 
                      fontWeight: 600,
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      fontSize: '0.9rem'
                    }}
                  >
                    <LockIcon size={16} />
                    Update Password
                  </Button>
                </div>
              </div>
            </form>
          </div>

          {/* Quick Info Card */}
          <div className="profile-card">
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '18px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '8px',
                background: 'rgba(56, 189, 248, 0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#0284c7', flexShrink: 0
              }}>
                <ShieldIcon size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 2px 0' }}>
                  Quick Information
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
                  Read-only metadata properties.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { label: 'Admin Email', value: email },
                { label: 'Access Role', value: user?.role || 'Staff' },
                { label: 'Workspace Name', value: workspaceName || 'N/A' },
                { label: 'Account Status', value: 'Active (Approved)', color: '#16a34a' }
              ].map((item, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  padding: '10px 14px',
                  background: '#f8fafc',
                  border: '1px solid #f1f5f9',
                  borderRadius: '8px',
                  fontSize: '0.85rem'
                }}>
                  <span style={{ color: '#64748b', fontWeight: 500, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {item.label}
                  </span>
                  <span style={{ color: item.color || '#334155', fontWeight: 700 }}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
