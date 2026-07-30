import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useToast } from '../components/ui/ToastContext';
import type { RootState } from '../store';
import { 
  useGetProfileQuery, 
  useUpdateProfileMutation, 
  useUploadImageMutation,
  useGetSaaSSubscriptionQuery,
  useGetSaaSPlansQuery,
  useCreateSaaSPaymentMutation,
  useVerifySaaSPaymentMutation
} from '../store/api';
import { setCredentials } from '../store/authSlice';
import { 
  Save as SaveIcon, 
  Lock as LockIcon, 
  Shield as ShieldIcon,
  Camera as CameraIcon,
  Check,
  CreditCard
} from 'lucide-react';

const compressImage = (base64Str: string, maxWidth = 800, maxHeight = 800): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);

      const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
      resolve(compressedBase64);
    };
    img.onerror = () => {
      resolve(base64Str);
    };
  });
};

export default function Profile() {
  const { showToast } = useToast();
  const { user, token } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();

  const { data: profile, refetch } = useGetProfileQuery(undefined, { skip: !token });
  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();
  const [uploadImage, { isLoading: isUploadingImage }] = useUploadImageMutation();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [avatar, setAvatar] = useState('');
  
  // Workspace / Library Details
  const [workspaceName, setWorkspaceName] = useState('');
  const [address, setAddress] = useState('');
  const [pincode, setPincode] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [logo, setLogo] = useState('');

  // Password fields
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // SaaS Subscription hooks & checkout logic
  const { data: saasSubscription, refetch: refetchSub } = useGetSaaSSubscriptionQuery(user?.workspaceId, { 
    skip: !user?.workspaceId || user?.role === 'SUPER_ADMIN' 
  });
  const { data: saasPlans = [] } = useGetSaaSPlansQuery({}, {
    skip: !user?.workspaceId || user?.role === 'SUPER_ADMIN'
  });
  const [createSaaSPayment, { isLoading: isCreatingSaaSPayment }] = useCreateSaaSPaymentMutation();
  const [verifySaaSPayment, { isLoading: isVerifyingSaaSPayment }] = useVerifySaaSPaymentMutation();

  const [activeTab, setActiveTab] = useState<'profile' | 'subscription'>('profile');
  const [hoveredPlanId, setHoveredPlanId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('tab') === 'subscription') {
      setActiveTab('subscription');
    }
  }, []);

  const loadRazorpay = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayNow = async (plan: any) => {
    if (!user?.workspaceId || !plan) {
      showToast("Please select a valid plan.", 'error');
      return;
    }

    const sdkLoaded = await loadRazorpay();
    if (!sdkLoaded) {
      showToast('Razorpay SDK failed to load. Are you online?', 'error');
      return;
    }

    try {
      const orderData = await createSaaSPayment({
        workspaceId: user.workspaceId,
        saasPlanId: plan.id,
      }).unwrap();

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_T9hh97PsK4bGuG',
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'StudyFlow',
        description: `SaaS Subscription: ${orderData.planName}`,
        order_id: orderData.orderId,
        handler: async function (response: any) {
          try {
            await verifySaaSPayment({
              workspaceId: user?.workspaceId || '',
              paymentData: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                saasPlanId: plan.id
              }
            }).unwrap();
            showToast('Subscription activated successfully!', 'success');
            refetchSub();
          } catch (err) {
            console.error('Verification failed', err);
            showToast('Payment verification failed. Please contact support.', 'error');
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
        },
        theme: {
          color: '#0ea5e9'
        }
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();
    } catch (err) {
      console.error('Error creating payment:', err);
      showToast('Failed to initiate payment. Please try again.', 'error');
    }
  };

  useEffect(() => {
    const target = profile || user;
    if (target) {
      setName(target.name || '');
      setEmail(target.email || '');
      setMobile(target.mobile || '');
      setAvatar(target.avatar || '');
      if (target.workspace) {
        setWorkspaceName(target.workspace.name || '');
        setAddress(target.workspace.address || '');
        setPincode(target.workspace.pincode || '');
        setGstNumber(target.workspace.gstNumber || '');
        setLogo(target.workspace.logo || '');
      }
    }
  }, [profile, user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const rawBase64 = reader.result as string;
      try {
        const compressedBase64 = await compressImage(rawBase64);
        const uploadResult = await uploadImage({ base64: compressedBase64 }).unwrap();
        const updatedUser = await updateProfile({ avatar: uploadResult.url }).unwrap();
        dispatch(setCredentials({ user: updatedUser, accessToken: token || '' }));
        setAvatar(uploadResult.url);
        showToast('Profile photo updated successfully!', 'success');
      } catch (err: any) {
        showToast(err?.data?.message || 'Failed to upload photo.', 'error');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const rawBase64 = reader.result as string;
      try {
        const compressedBase64 = await compressImage(rawBase64);
        const uploadResult = await uploadImage({ base64: compressedBase64 }).unwrap();
        setLogo(uploadResult.url);
        showToast('Logo uploaded. Click "Save Details" to persist changes.', 'success');
      } catch (err: any) {
        showToast(err?.data?.message || 'Failed to upload logo.', 'error');
      }
    };
    reader.readAsDataURL(file);
  };

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
        gstNumber,
        logo
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

  const tabStyle = (tabId: typeof activeTab) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1.25rem',
    border: 'none',
    background: 'none',
    borderBottom: activeTab === tabId ? '3px solid var(--primary)' : '3px solid transparent',
    color: activeTab === tabId ? 'var(--primary)' : 'var(--text-slate)',
    fontWeight: activeTab === tabId ? 700 : 600,
    fontSize: '0.95rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
  });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .profile-grid {
          display: grid;
          grid-template-columns: 1.8fr 1fr;
          gap: 20px;
        }
        .profile-card {
          background: #ffffff;
          border: 1px solid rgba(15, 23, 42, 0.05);
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.02), 0 4px 12px -4px rgba(15, 23, 42, 0.02);
          transition: transform 250ms ease, box-shadow 250ms ease, border-color 250ms ease;
        }
        .profile-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 25px -5px rgba(15, 23, 42, 0.05), 0 8px 16px -6px rgba(15, 23, 42, 0.03);
          border-color: rgba(37, 99, 235, 0.1);
        }
        .input-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .profile-hero {
          position: relative;
          background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          padding: 24px;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          flex-wrap: wrap;
          overflow: hidden;
          box-shadow: 0 15px 30px -10px rgba(0, 0, 0, 0.25);
        }
        .profile-hero::before {
          content: "";
          position: absolute;
          top: -50%;
          right: -20%;
          width: 300px;
          height: 300px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(99, 102, 241, 0) 70%);
          pointer-events: none;
        }
        .hero-avatar-container {
          position: relative;
        }
        .hero-avatar {
          width: 76px;
          height: 76px;
          border-radius: 50%;
          font-size: 2.2rem;
          font-weight: 800;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 3.5px solid rgba(255, 255, 255, 0.15);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
          overflow: hidden;
          transition: border-color 0.3s, transform 0.3s;
        }
        .hero-avatar-container:hover .hero-avatar {
          border-color: var(--accent-blue);
          transform: scale(1.02);
        }
        .hero-avatar-camera {
          position: absolute;
          bottom: -2px;
          right: -2px;
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: var(--accent-blue);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          border: 2px solid #0f172a;
          box-shadow: 0 3px 8px rgba(0, 0, 0, 0.3);
          transition: transform 0.2s, background-color 0.2s;
        }
        .hero-avatar-camera:hover {
          transform: scale(1.1);
          background: #1d4ed8;
        }
        .badge-super-admin {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(236, 72, 153, 0.2) 100%);
          color: #f472b6;
          border: 1px solid rgba(236, 72, 153, 0.3);
          padding: 3px 10px;
          border-radius: 9999px;
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          box-shadow: 0 0 10px rgba(236, 72, 153, 0.15);
        }
        .badge-admin {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: rgba(56, 189, 248, 0.15);
          color: #38bdf8;
          border: 1px solid rgba(56, 189, 248, 0.3);
          padding: 3px 10px;
          border-radius: 9999px;
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
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
      <div className="profile-hero">
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap', zIndex: 1 }}>
          
          {/* Avatar Upload Container */}
          <div className="hero-avatar-container">
            <div className="hero-avatar" style={{
              background: avatar ? `url(${avatar}) no-repeat center center / cover` : 'linear-gradient(135deg, var(--accent-blue) 0%, #3b82f6 100%)',
            }}>
              {!avatar && (name?.charAt(0).toUpperCase() || 'A')}
            </div>
            <label className="hero-avatar-camera">
              <CameraIcon size={14} />
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleAvatarUpload} 
                style={{ display: 'none' }} 
                disabled={isUploadingImage}
              />
            </label>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.65rem', fontWeight: 800, margin: 0, color: '#ffffff', letterSpacing: '-0.02em' }}>
                {name}
              </h2>
              <div className={user?.role === 'SUPER_ADMIN' ? 'badge-super-admin' : 'badge-admin'}>
                <ShieldIcon size={12} />
                {user?.role?.replace('_', ' ')}
              </div>
            </div>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem', fontWeight: 500 }}>
              {email}
            </p>
          </div>
        </div>

        {/* Small Statistics Cards */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', flex: 1, justifyContent: 'flex-end', minWidth: '280px', zIndex: 1 }}>
          {[
            { label: 'Workspace', value: workspaceName || 'N/A' },
            { label: 'User Role', value: user?.role?.replace('_', ' ') || 'Staff' },
            { label: 'Acc. Status', value: 'Active', color: '#4ade80' }
          ].map((stat, idx) => (
            <div key={idx} style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '14px 20px',
              minWidth: '120px',
              backdropFilter: 'blur(8px)'
            }}>
              <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {stat.label}
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, marginTop: '4px', color: stat.color || '#f8fafc' }}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Profile/Subscription Tabs */}
      {user?.role !== 'SUPER_ADMIN' && (
        <div style={{ 
          display: 'flex', 
          borderBottom: '1px solid #e2e8f0', 
          marginBottom: '1rem',
          overflowX: 'auto',
          whiteSpace: 'nowrap',
          gap: '8px'
        }}>
          <button style={tabStyle('profile')} onClick={() => setActiveTab('profile')}>
            Profile Details
          </button>
          <button style={tabStyle('subscription')} onClick={() => setActiveTab('subscription')}>
            SaaS Subscription
          </button>
        </div>
      )}

      {/* Two-Column Responsive Layout */}
      {activeTab === 'profile' && (
        <div className="profile-grid">
        
        {/* LEFT COLUMN (65%) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Personal Information Card */}
            <div className="profile-card" style={{ background: 'linear-gradient(180deg, #ffffff 0%, #eff6ff 100%)', borderLeft: '4px solid #3b82f6' }}>
              <div style={{ marginBottom: '18px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
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
            <div className="profile-card" style={{ background: 'linear-gradient(180deg, #ffffff 0%, #f0fdf4 100%)', borderLeft: '4px solid #10b981' }}>
              <div style={{ marginBottom: '18px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
                  Workspace / Library Details
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
                  Manage your physical library address and registration settings.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                
                {/* Logo Upload Section */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '4px' }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '8px',
                    border: '1px dashed #cbd5e1',
                    background: logo ? `url(${logo}) no-repeat center center / cover` : '#f8fafc',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden'
                  }}>
                    {!logo && <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>No Logo</span>}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: '#334155',
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}>
                      Upload Logo
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleLogoUpload} 
                        style={{ display: 'none' }} 
                        disabled={isUploadingImage}
                      />
                    </label>
                    {logo && (
                      <button
                        type="button"
                        onClick={() => setLogo('')}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--danger)',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          textAlign: 'left',
                          padding: 0
                        }}
                      >
                        Remove Logo
                      </button>
                    )}
                  </div>
                </div>

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
          <div className="profile-card" style={{ background: 'linear-gradient(180deg, #ffffff 0%, #fff1f2 100%)', borderLeft: '4px solid #f43f5e' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '18px' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '8px',
                background: 'rgba(244, 63, 94, 0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#f43f5e', flexShrink: 0
              }}>
                <LockIcon size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 2px 0' }}>
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
      )}

      {/* SaaS Subscription Settings Tab */}
      {activeTab === 'subscription' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Current Subscription Status */}
          <div className="profile-card" style={{ background: 'linear-gradient(180deg, #ffffff 0%, #faf5ff 100%)', borderLeft: '4px solid #a855f7' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CreditCard size={18} style={{ color: '#a855f7' }} />
              Current Subscription Status
            </h3>

            {saasSubscription ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '2rem', fontSize: '0.9rem' }}>
                <div>
                  <div style={{ color: '#64748B', fontSize: '0.8rem', fontWeight: 600 }}>PLAN LEVEL</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A', marginTop: '4px', textTransform: 'uppercase' }}>
                    {saasSubscription.saasPlan?.name || 'Trial Plan'}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#64748B', fontSize: '0.8rem', fontWeight: 600 }}>STATUS</div>
                  <div style={{ marginTop: '4px' }}>
                    <span style={{
                      background: saasSubscription.status === 'ACTIVE' ? '#DCFCE7' : '#FEF3C7',
                      color: saasSubscription.status === 'ACTIVE' ? '#166534' : '#b45309',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      textTransform: 'uppercase'
                    }}>
                      {saasSubscription.status}
                    </span>
                  </div>
                </div>
                <div>
                  <div style={{ color: '#64748B', fontSize: '0.8rem', fontWeight: 600 }}>
                    {saasSubscription.status === 'TRIAL' ? 'TRIAL END DATE' : 'NEXT RENEWAL DATE'}
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A', marginTop: '4px' }}>
                    {new Date(saasSubscription.status === 'TRIAL' ? saasSubscription.trialEndDate : saasSubscription.currentPeriodEnd).toLocaleDateString(undefined, { dateStyle: 'long' })}
                  </div>
                </div>
              </div>
            ) : (
              <p style={{ color: '#64748B', margin: 0 }}>No active subscription or trial found. Please start a trial or contact support.</p>
            )}
          </div>

          {/* Pricing Plans & Upgrades */}
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 1.5rem 0' }}>
              Upgrade / Purchase Subscription
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
              {saasPlans.map((plan: any) => {
                const isCurrent = saasSubscription && saasSubscription.saasPlanId === plan.id && saasSubscription.status === 'ACTIVE';
                const isHovered = hoveredPlanId === plan.id;
                
                // Color Tokens:
                // C6FE62 (active card btn)
                // 232323 (active card background)
                // F2F2F2 (unactive card colour)
                // E3E3E3 (inactive card btn)
                const cardBg = isCurrent ? '#232323' : '#F2F2F2';
                const cardBorder = isCurrent ? '2px solid #C6FE62' : '1.5px solid #E3E3E3';
                const cardShadow = isCurrent 
                  ? '0 20px 25px -5px rgba(198, 254, 98, 0.15), 0 10px 10px -5px rgba(198, 254, 98, 0.1)' 
                  : (isHovered ? '0 10px 15px -3px rgba(0,0,0,0.05)' : '0 1px 3px rgba(0,0,0,0.02)');
                const titleColor = isCurrent ? '#FFFFFF' : '#232323';
                const descColor = isCurrent ? '#A3A3A3' : '#525252';
                const priceColor = isCurrent ? '#C6FE62' : '#232323';
                const periodColor = isCurrent ? '#888888' : '#737373';
                const featureColor = isCurrent ? '#E5E5E5' : '#404040';

                return (
                  <div 
                    key={plan.id}
                    onMouseEnter={() => setHoveredPlanId(plan.id)}
                    onMouseLeave={() => setHoveredPlanId(null)}
                    style={{ 
                      border: cardBorder, 
                      borderRadius: '20px', 
                      padding: '2rem', 
                      background: cardBg,
                      boxShadow: cardShadow,
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
                      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                      minHeight: '420px'
                    }}
                  >
                    {isCurrent && (
                      <span style={{
                        position: 'absolute',
                        top: '-12px',
                        right: '24px',
                        background: '#C6FE62',
                        color: '#000000',
                        padding: '4px 14px',
                        borderRadius: '9999px',
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        border: '1.5px solid #232323'
                      }}>
                        Current Plan
                      </span>
                    )}
                    <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', color: titleColor, fontWeight: 800 }}>{plan.name}</h3>
                    <p style={{ margin: '0 0 1.5rem 0', color: descColor, fontSize: '0.85rem', lineHeight: 1.4, minHeight: '38px' }}>{plan.description}</p>
                    
                    <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '1.5rem', borderBottom: `1px solid ${isCurrent ? '#333333' : '#e5e7eb'}`, paddingBottom: '16px' }}>
                      <span style={{ fontSize: '2.25rem', fontWeight: 900, color: priceColor }}>₹{plan.price}</span>
                      <span style={{ color: periodColor, marginLeft: '4px', fontSize: '0.85rem', fontWeight: 600 }}>/ month</span>
                    </div>

                    <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0', flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {plan.features?.map((f: string, idx: number) => (
                        <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: featureColor }}>
                          <Check size={16} style={{ color: isCurrent ? '#C6FE62' : '#10B981', flexShrink: 0 }} />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>

                    <Button 
                      variant={isCurrent ? 'outline' : 'primary'}
                      fullWidth
                      disabled={isCurrent || isCreatingSaaSPayment || isVerifyingSaaSPayment}
                      onClick={() => handlePayNow(plan)}
                      style={{
                        borderRadius: '12px',
                        padding: '12px 20px',
                        backgroundColor: isCurrent ? '#C6FE62' : '#E3E3E3',
                        borderColor: isCurrent ? '#C6FE62' : '#E3E3E3',
                        color: isCurrent ? '#000000' : '#232323',
                        fontWeight: 800,
                        cursor: isCurrent ? 'default' : 'pointer'
                      }}
                    >
                      {isCreatingSaaSPayment ? 'Initiating...' : isCurrent ? 'Active Plan' : 'Purchase Plan'}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
