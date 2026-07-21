import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useSetupWorkspaceMutation } from '../store/api';
import { setCredentials } from '../store/authSlice';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import type { RootState } from '../store';

export default function SetupWorkspace() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, token } = useSelector((state: RootState) => state.auth);
  const [setupWorkspace, { isLoading }] = useSetupWorkspaceMutation();

  const [workspaceName, setWorkspaceName] = useState('');
  const [address, setAddress] = useState('');
  const [pincode, setPincode] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [logo, setLogo] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!workspaceName.trim()) {
      newErrors.workspaceName = 'Workspace/Library name is required';
    } else if (workspaceName.trim().length < 3) {
      newErrors.workspaceName = 'Workspace name must be at least 3 characters';
    }

    if (!address.trim()) {
      newErrors.address = 'Address is required';
    } else if (address.trim().length < 5) {
      newErrors.address = 'Address must be at least 5 characters';
    }

    if (pincode.trim() && !/^\d{6}$/.test(pincode.trim())) {
      newErrors.pincode = 'Pincode must be exactly 6 digits';
    }

    if (gstNumber.trim() && gstNumber.trim().length !== 15) {
      newErrors.gstNumber = 'GST Number must be exactly 15 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setApiError('');
    try {
      const res = await setupWorkspace({
        workspaceName: workspaceName.trim(),
        address: address.trim(),
        pincode: pincode.trim() || undefined,
        gstNumber: gstNumber.trim() || undefined,
        logo: logo.trim() || undefined,
      }).unwrap();

      // Update Redux state and localStorage with the newly generated workspaceId
      dispatch(setCredentials({
        user: res.user,
        accessToken: res.accessToken || token || '',
      }));

      navigate('/dashboard');
    } catch (err: any) {
      setApiError(err?.data?.message || 'Failed to complete workspace setup.');
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      padding: '2rem'
    }}>
      <Card elevation="lg" style={{ width: '100%', maxWidth: '780px', border: '1px solid rgba(226, 232, 240, 0.8)' }}>
        <div className="card-content" style={{ padding: '2rem' }}>
          
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h1 style={{ color: 'var(--primary)', margin: '0 0 0.5rem 0', fontWeight: 800, fontSize: '1.85rem', letterSpacing: '-0.025em' }}>
              Setup Your Library Workspace
            </h1>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem', fontWeight: 500 }}>
              Welcome, {user?.name}! Complete your details to initialize your library database.
            </p>
          </div>

          {apiError && (
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
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
            }}>
              {/* Left Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <Input
                  label="Workspace / Library Name"
                  required
                  placeholder="e.g. Sri Ram Digital Library"
                  value={workspaceName}
                  error={errors.workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                />
                <Input
                  label="GST Number (Optional)"
                  placeholder="15-character GSTIN"
                  value={gstNumber}
                  error={errors.gstNumber}
                  onChange={(e) => setGstNumber(e.target.value)}
                />
                <Input
                  label="Logo Image URL (Optional)"
                  placeholder="e.g. https://example.com/logo.png"
                  value={logo}
                  onChange={(e) => setLogo(e.target.value)}
                />
              </div>

              {/* Right Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <Input
                  label="Full Physical Address"
                  required
                  placeholder="e.g. Street Number, City, State"
                  value={address}
                  error={errors.address}
                  onChange={(e) => setAddress(e.target.value)}
                />
                <Input
                  label="Pincode (Optional)"
                  placeholder="6-digit ZIP code"
                  value={pincode}
                  error={errors.pincode}
                  onChange={(e) => setPincode(e.target.value)}
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              size="lg"
              isLoading={isLoading}
              style={{ marginTop: '1.5rem' }}
            >
              Complete Onboarding & Launch Dashboard
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
