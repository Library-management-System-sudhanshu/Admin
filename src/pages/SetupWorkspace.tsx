import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useSetupWorkspaceMutation, useUploadImageMutation } from '../store/api';
import { setCredentials } from '../store/authSlice';
import type { RootState } from '../store';
import { 
  Building, 
  MapPin, 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck, 
  FileText, 
  Image as ImageIcon,
  Armchair,
  AlertCircle,
  Compass,
  Upload,
  X,
  Check
} from 'lucide-react';

export default function SetupWorkspace() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, token } = useSelector((state: RootState) => state.auth);
  const [setupWorkspace, { isLoading }] = useSetupWorkspaceMutation();
  const [uploadImage, { isLoading: isUploadingImage }] = useUploadImageMutation();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [workspaceName, setWorkspaceName] = useState('');
  const [address, setAddress] = useState('');
  const [pincode, setPincode] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [logo, setLogo] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setApiError('Please select a valid image file (PNG, JPG, WEBP, GIF, SVG).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setApiError('Image file size must be less than 5MB.');
      return;
    }

    setApiError('');
    setUploadSuccess(false);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        const res = await uploadImage({ base64 }).unwrap();
        
        // Resolve full URL if server returns a relative path e.g. /uploads/upload_...
        const baseUrl = (import.meta as any).env.VITE_API_URL || 'http://localhost:3000';
        const finalUrl = res.url.startsWith('http') ? res.url : `${baseUrl.replace(/\/$/, '')}${res.url}`;
        
        setLogo(finalUrl);
        setUploadSuccess(true);
      } catch (err: any) {
        setApiError(err?.data?.message || 'Image upload failed. Please try again.');
      }
    };
    reader.readAsDataURL(file);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!workspaceName.trim()) {
      newErrors.workspaceName = 'Library or Space name is required';
    } else if (workspaceName.trim().length < 3) {
      newErrors.workspaceName = 'Workspace name must be at least 3 characters';
    }

    if (!address.trim()) {
      newErrors.address = 'Physical address is required';
    } else if (address.trim().length < 5) {
      newErrors.address = 'Address must be at least 5 characters';
    }

    if (pincode.trim() && !/^\d{6}$/.test(pincode.trim())) {
      newErrors.pincode = 'Pincode must be exactly 6 digits';
    }

    if (gstNumber.trim() && gstNumber.trim().length !== 15) {
      newErrors.gstNumber = 'GST Number must be 15 characters';
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

      dispatch(setCredentials({
        user: res.user,
        accessToken: res.accessToken || token || '',
      }));

      navigate('/dashboard');
    } catch (err: any) {
      setApiError(err?.data?.message || 'Failed to complete workspace setup. Please try again.');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      backgroundColor: '#0F172A',
      backgroundImage: `
        radial-gradient(at 0% 0%, rgba(37, 99, 235, 0.25) 0px, transparent 50%),
        radial-gradient(at 100% 100%, rgba(139, 92, 246, 0.2) 0px, transparent 50%),
        radial-gradient(at 50% 50%, rgba(15, 23, 42, 0.8) 0px, transparent 100%)
      `,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      position: 'relative',
      overflow: 'hidden'
    }}>
      
      {/* Background Decorative Blur Orbs */}
      <div style={{
        position: 'absolute', top: '-10%', left: '15%', width: '400px', height: '400px',
        background: 'rgba(37, 99, 235, 0.15)', filter: 'blur(120px)', borderRadius: '50%', pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', bottom: '-10%', right: '15%', width: '400px', height: '400px',
        background: 'rgba(139, 92, 246, 0.15)', filter: 'blur(120px)', borderRadius: '50%', pointerEvents: 'none'
      }} />

      {/* Main Container Card */}
      <div style={{
        width: '100%',
        maxWidth: '1020px',
        backgroundColor: '#ffffff',
        borderRadius: '24px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.1)',
        display: 'grid',
        gridTemplateColumns: '340px 1fr',
        overflow: 'hidden',
        position: 'relative',
        zIndex: 10
      }}>

        {/* ================= LEFT SIDEBAR (BRAND & PROGRESS) ================= */}
        <div style={{
          background: 'linear-gradient(160deg, #1E293B 0%, #0F172A 100%)',
          padding: '40px 32px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          color: '#ffffff',
          position: 'relative',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <div>
            {/* Header Tag */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '20px',
              backgroundColor: 'rgba(37, 99, 235, 0.2)',
              border: '1px solid rgba(37, 99, 235, 0.4)',
              color: '#60A5FA',
              fontSize: '0.72rem',
              fontWeight: 700,
              letterSpacing: '0.05em',
              marginBottom: '28px'
            }}>
              <Compass size={14} />
              <span>ONBOARDING STEP 2 OF 2</span>
            </div>

            <h2 style={{
              margin: '0 0 12px 0',
              fontSize: '1.6rem',
              fontWeight: 800,
              lineHeight: 1.25,
              color: '#ffffff',
              letterSpacing: '-0.02em'
            }}>
              Initialize Your Library Workspace
            </h2>
            <p style={{
              margin: 0,
              fontSize: '0.85rem',
              color: '#94A3B8',
              lineHeight: 1.5,
              fontWeight: 400
            }}>
              Welcome, <strong style={{ color: '#F1F5F9' }}>{user?.name || 'Owner'}</strong>! Complete your space information to unlock seat maps, billing, and management portal.
            </p>

            {/* Checklist items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '36px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.2)', color: '#34D399', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <CheckCircle2 size={16} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: '#F8FAFC' }}>Owner Account Created</h4>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#64748B' }}>{user?.email}</p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(37, 99, 235, 0.3)', color: '#60A5FA', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid rgba(96, 165, 250, 0.4)' }}>
                  <Building size={14} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: '#60A5FA' }}>Library & Branch Details</h4>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#94A3B8' }}>Set up location, logo & GST credentials</p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', opacity: 0.55 }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(148, 163, 184, 0.15)', color: '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Armchair size={14} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: '#CBD5E1' }}>Instant Dashboard Access</h4>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#64748B' }}>Seat maps, student allocations & billing</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Security Badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            paddingTop: '20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            fontSize: '0.75rem',
            color: '#64748B',
            marginTop: '32px'
          }}>
            <ShieldCheck size={16} color="#34D399" />
            <span>256-bit Encrypted Enterprise Workspace</span>
          </div>
        </div>

        {/* ================= RIGHT FORM SECTION ================= */}
        <div style={{ padding: '40px 44px', display: 'flex', flexDirection: 'column', justifyContent: 'center', backgroundColor: '#ffffff' }}>
          
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
              Library & Space Profile
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: '#64748B' }}>
              Enter your library details. You can update these settings anytime from your dashboard.
            </p>
          </div>

          {apiError && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              backgroundColor: '#FEF2F2',
              border: '1px solid #FCA5A5',
              color: '#991B1B',
              padding: '12px 16px',
              borderRadius: '12px',
              fontSize: '0.82rem',
              fontWeight: 500,
              marginBottom: '20px'
            }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{apiError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            
            {/* Library / Space Name */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#1E293B', marginBottom: '6px' }}>
                Library / Study Space Name <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Building size={17} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
                <input
                  type="text"
                  placeholder="e.g. Trishul Digital Study Library"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 42px',
                    borderRadius: '12px',
                    border: errors.workspaceName ? '1.5px solid #EF4444' : '1px solid #CBD5E1',
                    fontSize: '0.88rem',
                    fontWeight: 500,
                    color: '#0F172A',
                    outline: 'none',
                    backgroundColor: '#F8FAFC',
                    transition: 'all 150ms ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.backgroundColor = '#ffffff';
                    e.target.style.borderColor = '#2563EB';
                    e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.12)';
                  }}
                  onBlur={(e) => {
                    e.target.style.backgroundColor = '#F8FAFC';
                    e.target.style.borderColor = errors.workspaceName ? '#EF4444' : '#CBD5E1';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
              {errors.workspaceName && (
                <span style={{ fontSize: '0.72rem', color: '#EF4444', marginTop: '4px', display: 'block', fontWeight: 600 }}>{errors.workspaceName}</span>
              )}
            </div>

            {/* Physical Address */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#1E293B', marginBottom: '6px' }}>
                Physical Address <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <MapPin size={17} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
                <input
                  type="text"
                  placeholder="Street name, landmark, city, state"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 42px',
                    borderRadius: '12px',
                    border: errors.address ? '1.5px solid #EF4444' : '1px solid #CBD5E1',
                    fontSize: '0.88rem',
                    fontWeight: 500,
                    color: '#0F172A',
                    outline: 'none',
                    backgroundColor: '#F8FAFC',
                    transition: 'all 150ms ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.backgroundColor = '#ffffff';
                    e.target.style.borderColor = '#2563EB';
                    e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.12)';
                  }}
                  onBlur={(e) => {
                    e.target.style.backgroundColor = '#F8FAFC';
                    e.target.style.borderColor = errors.address ? '#EF4444' : '#CBD5E1';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
              {errors.address && (
                <span style={{ fontSize: '0.72rem', color: '#EF4444', marginTop: '4px', display: 'block', fontWeight: 600 }}>{errors.address}</span>
              )}
            </div>

            {/* Pincode & GST Number (2 Columns) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#1E293B', marginBottom: '6px' }}>
                  Pincode <span style={{ color: '#94A3B8', fontWeight: 500 }}>(Optional)</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <FileText size={17} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
                  <input
                    type="text"
                    placeholder="6-digit ZIP code"
                    maxLength={6}
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                    style={{
                      width: '100%',
                      padding: '12px 14px 12px 42px',
                      borderRadius: '12px',
                      border: errors.pincode ? '1.5px solid #EF4444' : '1px solid #CBD5E1',
                      fontSize: '0.88rem',
                      fontWeight: 500,
                      color: '#0F172A',
                      outline: 'none',
                      backgroundColor: '#F8FAFC',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => {
                      e.target.style.backgroundColor = '#ffffff';
                      e.target.style.borderColor = '#2563EB';
                      e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.12)';
                    }}
                    onBlur={(e) => {
                      e.target.style.backgroundColor = '#F8FAFC';
                      e.target.style.borderColor = errors.pincode ? '#EF4444' : '#CBD5E1';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
                {errors.pincode && (
                  <span style={{ fontSize: '0.72rem', color: '#EF4444', marginTop: '4px', display: 'block', fontWeight: 600 }}>{errors.pincode}</span>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#1E293B', marginBottom: '6px' }}>
                  GSTIN <span style={{ color: '#94A3B8', fontWeight: 500 }}>(Optional)</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <Building size={17} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
                  <input
                    type="text"
                    placeholder="15-char GSTIN"
                    maxLength={15}
                    value={gstNumber}
                    onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                    style={{
                      width: '100%',
                      padding: '12px 14px 12px 42px',
                      borderRadius: '12px',
                      border: errors.gstNumber ? '1.5px solid #EF4444' : '1px solid #CBD5E1',
                      fontSize: '0.88rem',
                      fontWeight: 500,
                      color: '#0F172A',
                      outline: 'none',
                      backgroundColor: '#F8FAFC',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => {
                      e.target.style.backgroundColor = '#ffffff';
                      e.target.style.borderColor = '#2563EB';
                      e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.12)';
                    }}
                    onBlur={(e) => {
                      e.target.style.backgroundColor = '#F8FAFC';
                      e.target.style.borderColor = errors.gstNumber ? '#EF4444' : '#CBD5E1';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
                {errors.gstNumber && (
                  <span style={{ fontSize: '0.72rem', color: '#EF4444', marginTop: '4px', display: 'block', fontWeight: 600 }}>{errors.gstNumber}</span>
                )}
              </div>
            </div>

            {/* Logo Image Upload & URL */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#1E293B', marginBottom: '6px' }}>
                Library Logo <span style={{ color: '#94A3B8', fontWeight: 500 }}>(Optional)</span>
              </label>

              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '16px',
                borderRadius: '16px',
                border: '1px dashed #CBD5E1',
                backgroundColor: '#F8FAFC',
              }}>
                {/* Logo Preview Avatar */}
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '14px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  flexShrink: 0,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                  position: 'relative'
                }}>
                  {logo ? (
                    <img 
                      src={logo} 
                      alt="Library Logo Preview" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <Building size={28} style={{ color: '#94A3B8' }} />
                  )}
                </div>

                {/* Actions & Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingImage}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 14px',
                        borderRadius: '10px',
                        border: '1px solid #2563EB',
                        backgroundColor: 'rgba(37, 99, 235, 0.05)',
                        color: '#2563EB',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: isUploadingImage ? 'not-allowed' : 'pointer',
                        transition: 'all 150ms ease'
                      }}
                    >
                      {isUploadingImage ? (
                        <span>Uploading File...</span>
                      ) : (
                        <>
                          <Upload size={14} />
                          <span>Upload Image File</span>
                        </>
                      )}
                    </button>

                    {logo && (
                      <button
                        type="button"
                        onClick={() => { setLogo(''); setUploadSuccess(false); }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '8px 12px',
                          borderRadius: '10px',
                          border: '1px solid #EF4444',
                          backgroundColor: '#FEF2F2',
                          color: '#EF4444',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        <X size={14} />
                        <span>Remove</span>
                      </button>
                    )}

                    {uploadSuccess && (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        backgroundColor: '#D1FAE5',
                        color: '#065F46',
                        fontSize: '0.72rem',
                        fontWeight: 700
                      }}>
                        <Check size={12} /> Uploaded
                      </span>
                    )}
                  </div>

                  <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748B' }}>
                    Supports PNG, JPG, WEBP or SVG up to 5MB. Saved directly to server storage.
                  </p>
                </div>
              </div>

              {/* Optional URL Input Fallback */}
              <div style={{ marginTop: '10px', position: 'relative' }}>
                <ImageIcon size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input
                  type="text"
                  placeholder="Or paste image URL (https://...)"
                  value={logo}
                  onChange={(e) => { setLogo(e.target.value); setUploadSuccess(false); }}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 38px',
                    borderRadius: '10px',
                    border: '1px solid #E2E8F0',
                    fontSize: '0.78rem',
                    color: '#475569',
                    outline: 'none',
                    backgroundColor: '#ffffff',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                marginTop: '10px',
                width: '100%',
                padding: '14px 24px',
                borderRadius: '14px',
                border: 'none',
                background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                color: '#ffffff',
                fontSize: '0.95rem',
                fontWeight: 700,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                boxShadow: '0 10px 20px -5px rgba(37, 99, 235, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 200ms ease',
                opacity: isLoading ? 0.7 : 1
              }}
              onMouseOver={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 14px 26px -5px rgba(37, 99, 235, 0.5)';
                }
              }}
              onMouseOut={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '0 10px 20px -5px rgba(37, 99, 235, 0.4)';
                }
              }}
            >
              {isLoading ? (
                <span>Initializing Workspace...</span>
              ) : (
                <>
                  <span>Complete Setup & Launch Dashboard</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>

          </form>

        </div>

      </div>
    </div>
  );
}
