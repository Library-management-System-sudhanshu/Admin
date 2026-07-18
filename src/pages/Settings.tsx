import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Box, Typography, Card, TextField, Tabs, Tab } from '@mui/material';
import { Button } from '../components/ui/Button';
import type { RootState } from '../store';
import {
  useGetSettingsQuery,
  useUpdateSettingsMutation,
  useGetBranchesQuery,
  useTriggerSafetyAlarmMutation,
  useGetSaaSSubscriptionQuery,
  useGetSaaSPlansQuery,
  useCreateSaaSPaymentMutation,
  useVerifySaaSPaymentMutation
} from '../store/api';
import { useToast } from '../components/ui/ToastContext';
import { Select } from '../components/ui/Select';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { AlertTriangle, ShieldAlert, Radio, Volume2, Check, CreditCard, Sparkles } from 'lucide-react';

export default function Settings() {
  const { user } = useSelector((state: RootState) => state.auth);
  const { data: settings } = useGetSettingsQuery(user?.workspaceId, { skip: !user?.workspaceId });
  const [updateSettings, { isLoading: isSavingSettings }] = useUpdateSettingsMutation();
  const { data: branches } = useGetBranchesQuery(user?.workspaceId, { skip: !user?.workspaceId });
  const [triggerSafetyAlarm, { isLoading: isTriggeringAlarm }] = useTriggerSafetyAlarmMutation();
  const { showToast } = useToast();

  const { data: saasSubscription, refetch: refetchSub } = useGetSaaSSubscriptionQuery(user?.workspaceId, { skip: !user?.workspaceId });
  const { data: saasPlans = [] } = useGetSaaSPlansQuery({});
  const [createSaaSPayment, { isLoading: isCreatingSaaSPayment }] = useCreateSaaSPaymentMutation();
  const [verifySaaSPayment, { isLoading: isVerifyingSaaSPayment }] = useVerifySaaSPaymentMutation();

  const [upiId, setUpiId] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  // Tabs state
  const [activeTab, setActiveTab] = useState(0);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('tab') === 'subscription') {
      setActiveTab(2);
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

  // SOS parameters state
  const [alarmType, setAlarmType] = useState('FIRE');
  const [exitGate, setExitGate] = useState('Gate No 2');
  const [targetBranchId, setTargetBranchId] = useState('');
  const [customMsg, setCustomMsg] = useState('');
  const [isSosConfirmOpen, setIsSosConfirmOpen] = useState(false);

  // Sync state once settings are loaded
  React.useEffect(() => {
    if (settings) {
      setUpiId(settings.upiId || '');
      setQrCodeUrl(settings.qrCodeUrl || '');
    }
  }, [settings]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.workspaceId) return;
    try {
      await updateSettings({
        workspaceId: user.workspaceId,
        data: { upiId, qrCodeUrl },
      }).unwrap();
      showToast('Payment settings updated successfully!', 'success');
    } catch (err) {
      showToast('Failed to save payment settings', 'error');
    }
  };

  const playBuzzerSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, ctx.currentTime);

      // Siren modulation
      for (let i = 0; i < 10; i++) {
        osc.frequency.linearRampToValueAtTime(880, ctx.currentTime + i * 0.5 + 0.25);
        osc.frequency.linearRampToValueAtTime(440, ctx.currentTime + i * 0.5 + 0.5);
      }

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 5.0);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 5.0);
    } catch (e) {
      console.warn('Failed to play buzzer audio:', e);
    }
  };

  const handleTriggerAlarm = async () => {
    try {
      await triggerSafetyAlarm({
        type: alarmType,
        gate: exitGate,
        message: customMsg.trim() || undefined,
        branchId: targetBranchId || undefined,
      }).unwrap();

      showToast('Emergency safety alarm broadcasted successfully!', 'success');
      playBuzzerSound();
      setIsSosConfirmOpen(false);
      setCustomMsg('');
    } catch (err: any) {
      showToast(err?.data?.message || 'Failed to trigger safety alarm', 'error');
    }
  };

  return (
    <Box>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.9); }
        }
        @keyframes pulsate {
          0% { transform: scale(0.9); opacity: 0.8; }
          50% { transform: scale(1.1); opacity: 0.4; }
          100% { transform: scale(1.3); opacity: 0; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#0F172A' }}>
          Workspace Settings
        </Typography>
      </Box>

      {/* Tabs Layout */}
      <Box sx={{ borderBottom: 1, borderColor: '#E2E8F0', mb: 4 }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          aria-label="settings tabs"
          sx={{
            '& .MuiTab-root': {
              fontWeight: 600,
              textTransform: 'none',
              fontSize: '0.95rem',
              color: '#64748B',
              pb: 1.5,
              minWidth: 120,
              '&:hover': {
                color: '#0F172A',
              }
            },
            '& .Mui-selected': {
              color: '#2563EB !important',
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#2563EB',
              height: '3px',
              borderRadius: '3px 3px 0 0',
            }
          }}
        >
          <Tab label="Payment Settings" />
          <Tab label="Emergency SOS Broadcast" />
          <Tab label="SaaS Subscription" />
        </Tabs>
      </Box>

      {/* Payment Configuration Settings Tab */}
      {activeTab === 0 && (
        <Card sx={{ p: 3, border: '1px solid #E2E8F0', boxShadow: 'none' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
            Payment & UPI Configuration
          </Typography>
          <form onSubmit={handleSaveSettings}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <TextField
                label="UPI ID (for student plan renewals)"
                fullWidth
                placeholder="e.g. 8840839079@upi"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
              />
              <TextField
                label="Custom QR Code Image URL (optional)"
                fullWidth
                placeholder="e.g. https://example.com/qr-code.png"
                value={qrCodeUrl}
                onChange={(e) => setQrCodeUrl(e.target.value)}
                helperText="If blank, the system automatically generates a dynamic scan-and-pay QR code based on your UPI ID."
              />
              {upiId && (
                <Box sx={{ mt: 1, p: 2, bgcolor: '#F8FAFC', borderRadius: 2, display: 'inline-flex', flexDirection: 'column', alignItems: 'center', alignSelf: 'flex-start', border: '1px dashed #E2E8F0' }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', mb: 1 }}>
                    Preview UPI QR Code
                  </Typography>
                  <img
                    src={qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`upi://pay?pa=${upiId}&pn=StudyFlow&am=1500&cu=INR`)}`}
                    alt="UPI QR Code Preview"
                    style={{ width: 150, height: 150, borderRadius: 8, objectFit: 'contain' }}
                  />
                </Box>
              )}
              <Button
                type="submit"
                variant="primary"
                isLoading={isSavingSettings}
                style={{ alignSelf: 'flex-start', borderRadius: '10px', backgroundColor: 'var(--accent-blue)', borderColor: 'var(--accent-blue)' }}
              >
                Save Payment Settings
              </Button>
            </Box>
          </form>
        </Card>
      )}

      {/* Emergency SOS Settings Tab */}
      {activeTab === 1 && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.2fr 0.8fr' }, gap: 3 }}>
          {/* Form Configuration Card */}
          <Card sx={{ p: 3, border: '1px solid #E2E8F0', boxShadow: 'none', display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 1 }}>
                <ShieldAlert style={{ color: '#DC2626' }} /> Emergency Broadcast Configuration
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748B', mt: 1 }}>
                Configure real-time safety announcements, exit routes, and evacuation scopes during an emergency drill or live situation.
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1E293B' }}>Target Scope (Branch)</label>
                <Select
                  value={targetBranchId}
                  onChange={(val) => setTargetBranchId(val)}
                  placeholder="All Branches (Workspace-wide)"
                  options={[
                    { value: '', label: 'All Branches (Workspace-wide)' },
                    ...(branches?.map((b: any) => ({ value: b.id, label: b.name })) || [])
                  ]}
                />
              </div>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1E293B' }}>Alarm Type</label>
                  <Select
                    value={alarmType}
                    onChange={(val) => setAlarmType(val)}
                    options={[
                      { value: 'FIRE', label: '🔥 Fire Alarm' },
                      { value: 'EARTHQUAKE', label: '🌋 Earthquake Alarm' },
                      { value: 'MEDICAL', label: '🚨 Medical Emergency' },
                      { value: 'SECURITY', label: '🔒 Security / Lockdown' },
                      { value: 'TEST', label: '🛠️ Drill / Test Alarm' },
                    ]}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1E293B' }}>Evacuation Route / Exit Gate</label>
                  <Select
                    value={exitGate}
                    onChange={(val) => setExitGate(val)}
                    options={[
                      { value: 'Gate No 1', label: 'Gate No 1 (Main Road)' },
                      { value: 'Gate No 2', label: 'Gate No 2 (Parking Area)' },
                      { value: 'Emergency Fire Exit', label: 'Emergency Fire Exit' },
                      { value: 'Main Entrance', label: 'Main Entrance' },
                      { value: 'Assembly Area', label: 'Assembly Area (Outside)' },
                    ]}
                  />
                </div>
              </Box>

              <Input
                label="Custom Instructions / Message (Optional)"
                placeholder="e.g. Leave all bags behind and assemble at exit gate. Remain calm."
                value={customMsg}
                onChange={(e) => setCustomMsg(e.target.value)}
              />
            </Box>
          </Card>

          {/* Trigger Action Panel Card */}
          <Card
            sx={{
              p: 3,
              border: '1px solid #FECDD3',
              boxShadow: 'none',
              background: 'linear-gradient(180deg, #FFF5F5 0%, #FFF1F2 100%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
              minHeight: 320
            }}
          >
            <Box sx={{ zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2.5 }}>
              {/* Status Indicator */}
              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, bgcolor: '#FEE2E2', px: 2, py: 0.5, borderRadius: 100, border: '1px solid #FCA5A5' }}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: '#DC2626',
                    animation: 'pulse 1.5s infinite'
                  }}
                />
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#991B1B', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  System Ready
                </Typography>
              </Box>

              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#991B1B', textTransform: 'uppercase', mt: 1 }}>
                SOS Panic Command
              </Typography>

              {/* Pulsating SOS Trigger Button */}
              <Box
                onClick={() => setIsSosConfirmOpen(true)}
                sx={{
                  width: 140,
                  height: 140,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)',
                  boxShadow: '0 0 0 0 rgba(220, 38, 38, 0.4), 0 10px 25px -5px rgba(220, 38, 38, 0.5)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  userSelect: 'none',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  border: '6px solid #FFF1F2',
                  '&:hover': {
                    transform: 'scale(1.05)',
                    boxShadow: '0 0 25px 10px rgba(220, 38, 38, 0.5), 0 10px 25px -5px rgba(220, 38, 38, 0.6)',
                  },
                  '&:active': {
                    transform: 'scale(0.95)',
                  }
                }}
              >
                {/* Pulsating Ring Effect */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: -12,
                    left: -12,
                    right: -12,
                    bottom: -12,
                    borderRadius: '50%',
                    border: '2px solid #EF4444',
                    opacity: 0.4,
                    animation: 'pulsate 2s infinite ease-out',
                    pointerEvents: 'none'
                  }}
                />
                <Radio size={36} style={{ color: '#ffffff', marginBottom: '4px', animation: 'bounce-slow 3s infinite' }} />
                <Typography variant="button" sx={{ fontWeight: 900, color: '#ffffff', letterSpacing: '0.1em', fontSize: '1rem' }}>
                  PUSH SOS
                </Typography>
              </Box>

              <Typography variant="body2" sx={{ color: '#7F1D1D', fontWeight: 500, maxWidth: '240px', lineHeight: 1.4, fontSize: '0.8rem', mt: 1 }}>
                Pushes real-time warnings, alarm sounds, and instructions to all students instantly.
              </Typography>

              {/* Siren simulator demo */}
              <Button
                variant="outline"
                onClick={playBuzzerSound}
                style={{
                  borderColor: '#FCA5A5',
                  color: '#991B1B',
                  backgroundColor: '#ffffff',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  borderRadius: '8px',
                  padding: '6px 12px',
                  marginTop: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Volume2 size={14} /> Test Siren Audio
              </Button>
            </Box>
          </Card>
        </Box>
      )}

      {/* SaaS Subscription Settings Tab */}
      {activeTab === 2 && (
        <Box>
          {/* Current Subscription Status */}
          <Card sx={{ p: 3, border: '1px solid #E2E8F0', boxShadow: 'none', mb: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
              <CreditCard size={20} style={{ color: '#2563EB' }} />
              Current Subscription Status
            </Typography>

            {saasSubscription ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', fontSize: '0.9rem' }}>
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
          </Card>

          {/* Pricing Plans & Upgrades */}
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
            Upgrade / Purchase Subscription
          </Typography>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            {saasPlans.map((plan: any) => {
              const isCurrent = saasSubscription && saasSubscription.saasPlanId === plan.id && saasSubscription.status === 'ACTIVE';
              return (
                <div key={plan.id} style={{ 
                  border: isCurrent ? '2px solid #2563EB' : '1px solid #E2E8F0', 
                  borderRadius: '16px', 
                  padding: '2rem', 
                  background: 'white',
                  boxShadow: isCurrent ? '0 10px 15px -3px rgba(37, 99, 235, 0.1)' : '0 1px 3px rgba(0,0,0,0.05)',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  {isCurrent && (
                    <span style={{
                      position: 'absolute',
                      top: '-12px',
                      right: '24px',
                      background: '#2563EB',
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      textTransform: 'uppercase'
                    }}>
                      Current Plan
                    </span>
                  )}
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', color: '#0F172A', fontWeight: 700 }}>{plan.name}</h3>
                  <p style={{ margin: '0 0 1.5rem 0', color: '#64748B', fontSize: '0.85rem', lineHeight: 1.4 }}>{plan.description}</p>
                  
                  <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '1.5rem' }}>
                    <span style={{ fontSize: '2rem', fontWeight: 800, color: '#0F172A' }}>₹{plan.price}</span>
                    <span style={{ color: '#64748B', marginLeft: '4px', fontSize: '0.9rem' }}>/ month</span>
                  </div>

                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0', flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {plan.features?.map((f: string, idx: number) => (
                      <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#475569' }}>
                        <Check size={16} style={{ color: '#10B981', flexShrink: 0 }} />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <Button 
                    variant={isCurrent ? 'outline' : 'primary'}
                    fullWidth
                    disabled={isCurrent || isCreatingSaaSPayment || isVerifyingSaaSPayment}
                    onClick={() => handlePayNow(plan)}
                  >
                    {isCreatingSaaSPayment ? 'Initiating...' : isCurrent ? 'Active Plan' : 'Purchase Plan'}
                  </Button>
                </div>
              );
            })}
          </div>
        </Box>
      )}

      {/* CONFIRMATION MODAL */}
      <Modal
        isOpen={isSosConfirmOpen}
        onClose={() => setIsSosConfirmOpen(false)}
        title="⚠️ Confirm Emergency SOS Broadcast"
        maxWidth="sm"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#FEF2F2', padding: '16px', borderRadius: '12px', border: '1px solid #FEE2E2' }}>
            <AlertTriangle size={32} style={{ color: '#DC2626', flexShrink: 0 }} />
            <div>
              <h4 style={{ margin: 0, color: '#991B1B', fontWeight: 700, fontSize: '0.9rem' }}>Critical System Notice</h4>
              <p style={{ margin: '4px 0 0 0', color: '#7F1D1D', fontSize: '0.8rem', lineHeight: 1.4 }}>
                This is a real-time system broadcast. Triggering this will immediately push audio, visual, and text notifications to all active students in the selected branch.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: '#F8FAFC', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748B', fontWeight: 500 }}>Target Scope:</span>
              <span style={{ color: '#0F172A', fontWeight: 700 }}>
                {targetBranchId ? (branches?.find((b: any) => b.id === targetBranchId)?.name || 'Selected Branch') : 'All Branches (Workspace-wide)'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748B', fontWeight: 500 }}>Alarm Type:</span>
              <span style={{ color: '#0F172A', fontWeight: 700 }}>
                {alarmType === 'FIRE' ? '🔥 Fire Alarm' :
                  alarmType === 'EARTHQUAKE' ? '🌋 Earthquake Alarm' :
                    alarmType === 'MEDICAL' ? '🚨 Medical Emergency' :
                      alarmType === 'SECURITY' ? '🔒 Security / Lockdown' : '🛠️ Drill / Test Alarm'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748B', fontWeight: 500 }}>Evacuation Route:</span>
              <span style={{ color: '#0F172A', fontWeight: 700 }}>{exitGate}</span>
            </div>
            {customMsg.trim() && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderTop: '1px solid #E2E8F0', paddingTop: '8px', marginTop: '4px' }}>
                <span style={{ color: '#64748B', fontWeight: 500 }}>Custom Message:</span>
                <span style={{ color: '#0F172A', fontStyle: 'italic', background: '#ffffff', padding: '8px', borderRadius: '6px', border: '1px solid #F1F5F9' }}>
                  "{customMsg}"
                </span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsSosConfirmOpen(false)}
              disabled={isTriggeringAlarm}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              style={{ backgroundColor: '#DC2626', borderColor: '#DC2626' }}
              disabled={isTriggeringAlarm}
              isLoading={isTriggeringAlarm}
              onClick={() => handleTriggerAlarm()}
            >
              🔥 Broadcast Alarm Now
            </Button>
          </div>
        </div>
      </Modal>
    </Box>
  );
}
