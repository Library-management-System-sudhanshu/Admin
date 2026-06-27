import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Box, Typography, Card, TextField } from '@mui/material';
import { Button } from '../components/ui/Button';
import type { RootState } from '../store';
import { useGetSettingsQuery, useUpdateSettingsMutation } from '../store/api';
import { useToast } from '../components/ui/ToastContext';

export default function Settings() {
  const { user } = useSelector((state: RootState) => state.auth);
  const { data: settings } = useGetSettingsQuery(user?.workspaceId, { skip: !user?.workspaceId });
  const [updateSettings, { isLoading: isSavingSettings }] = useUpdateSettingsMutation();
  const { showToast } = useToast();

  const [upiId, setUpiId] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');

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

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#0F172A' }}>
          Workspace Settings
        </Typography>
      </Box>

      {/* Payment Configuration Settings Card */}
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
    </Box>
  );
}
