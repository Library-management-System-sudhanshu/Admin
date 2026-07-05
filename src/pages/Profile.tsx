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
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem' }}>
      
      {/* Upper Profile Header Section */}
      <Card elevation="sm" style={{ 
        padding: '2rem', 
        marginBottom: '2rem', 
        borderRadius: '1rem', 
        border: '1px solid var(--border-color)', 
        background: 'linear-gradient(to right, #ffffff, var(--bg-surface-hover))',
        display: 'flex',
        alignItems: 'center',
        gap: '2rem',
        flexWrap: 'wrap'
      }}>
        <div style={{
          width: '90px',
          height: '90px',
          borderRadius: '50%',
          fontSize: '2.5rem',
          background: 'linear-gradient(135deg, var(--primary) 0%, #1D4ED8 100%)',
          color: 'white',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 30px rgba(37, 99, 235, 0.15)'
        }}>
          {name?.charAt(0).toUpperCase() || 'A'}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              {name}
            </h2>
            <div style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.25rem', 
              backgroundColor: 'var(--primary-light)', 
              color: 'var(--primary)',
              padding: '0.25rem 0.75rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              <ShieldIcon size={14} />
              {user?.role}
            </div>
          </div>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {email}
          </p>
          {workspaceName && (
            <p style={{ margin: '0.5rem 0 0 0', color: 'var(--primary)', fontWeight: 600, fontSize: '0.9rem' }}>
              Library: {workspaceName}
            </p>
          )}
        </div>
      </Card>

      {/* Unified Layout Details */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
        
        {/* Personal & Library Details Column */}
        <Card elevation="sm" style={{ padding: '2rem', borderRadius: '1rem', border: '1px solid var(--border-color)' }}>
          <form onSubmit={handleUpdateProfile}>
            
            {/* Profile Details */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.25rem 0' }}>
                Personal Information
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
                Update your contact settings and access configuration.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1.5rem' }}>
                <Input
                  label="Full Name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />

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

            <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '2rem 0' }} />

            {/* Library Workspace Details */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.25rem 0' }}>
                Library / Workspace Details
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
                Manage workspace address, name, pincode, and billing GST details.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1.5rem' }}>
                <Input
                  label="Workspace/Library Name"
                  required
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                />

                <div className="custom-input-container w-full">
                  <label className="custom-input-label">Address</label>
                  <div className="custom-input-wrapper">
                    <textarea
                      required
                      rows={2}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="custom-input"
                      style={{ padding: '0.75rem', width: '100%', fontFamily: 'inherit', resize: 'vertical' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
            </div>

            <div style={{ marginTop: '2rem' }}>
              <Button
                type="submit"
                variant="primary"
                disabled={isUpdating}
                style={{ 
                  borderRadius: '0.5rem', 
                  padding: '0.75rem 2rem', 
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <SaveIcon size={16} />
                {isUpdating ? 'Saving...' : 'Save Details'}
              </Button>
            </div>

          </form>
        </Card>

        {/* Security Details Column */}
        <Card elevation="sm" style={{ padding: '2rem', borderRadius: '1rem', border: '1px solid var(--border-color)', height: 'fit-content' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.25rem 0' }}>
              Change Password
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
              Ensure your credentials remain secure.
            </p>
          </div>
          
          <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '1.5rem 0' }} />

          <form onSubmit={handleChangePassword}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
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

              <div style={{ marginTop: '1.5rem' }}>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isUpdating}
                  style={{ 
                    borderRadius: '0.5rem', 
                    padding: '0.75rem 2rem', 
                    fontWeight: 600,
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <LockIcon size={16} />
                  Update Password
                </Button>
              </div>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
