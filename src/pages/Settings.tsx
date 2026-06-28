import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Box, Typography, Card, TextField, Tabs, Tab } from '@mui/material';
import { Button } from '../components/ui/Button';
import type { RootState } from '../store';
import {
  useGetSettingsQuery,
  useUpdateSettingsMutation,
  useGetBranchesQuery,
  useTriggerSafetyAlarmMutation
} from '../store/api';
import { useToast } from '../components/ui/ToastContext';
import { Select } from '../components/ui/Select';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { AlertTriangle, ShieldAlert, Radio, Volume2 } from 'lucide-react';

export default function Settings() {
  const { user } = useSelector((state: RootState) => state.auth);
  const { data: settings } = useGetSettingsQuery(user?.workspaceId, { skip: !user?.workspaceId });
  const [updateSettings, { isLoading: isSavingSettings }] = useUpdateSettingsMutation();
  const { data: branches } = useGetBranchesQuery(user?.workspaceId, { skip: !user?.workspaceId });
  const [triggerSafetyAlarm, { isLoading: isTriggeringAlarm }] = useTriggerSafetyAlarmMutation();
  const { showToast } = useToast();

  const [upiId, setUpiId] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  // Tabs state
  const [activeTab, setActiveTab] = useState(0);

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
