import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useToast } from '../ui/ToastContext';
import { 
  useGetSaaSPlansQuery, 
  useUpdateWorkspaceSubscriptionMutation 
} from '../../store/api';
import { Calendar, Clock, CheckCircle2 } from 'lucide-react';

interface EditSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspace: {
    id: string;
    name: string;
    subscription?: {
      id?: string;
      saasPlanId?: string | null;
      status?: string;
      trialEndDate?: string | null;
      currentPeriodEnd?: string | null;
      saasPlan?: {
        id?: string;
        name?: string;
      };
    };
  } | null;
  onSuccess?: () => void;
}

export const EditSubscriptionModal: React.FC<EditSubscriptionModalProps> = ({
  isOpen,
  onClose,
  workspace,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const { data: plans = [], isLoading: isPlansLoading } = useGetSaaSPlansQuery({});
  const [updateSubscription, { isLoading: isUpdating }] = useUpdateWorkspaceSubscriptionMutation();

  const [saasPlanId, setSaasPlanId] = useState<string>('');
  const [status, setStatus] = useState<string>('ACTIVE');
  const [expiryDate, setExpiryDate] = useState<string>('');

  useEffect(() => {
    if (isOpen && workspace) {
      const sub = workspace.subscription;
      setSaasPlanId(sub?.saasPlanId || sub?.saasPlan?.id || (plans[0]?.id ?? ''));
      setStatus(sub?.status || 'ACTIVE');

      const existingDate = sub?.currentPeriodEnd || sub?.trialEndDate;
      if (existingDate) {
        try {
          const d = new Date(existingDate);
          if (!isNaN(d.getTime())) {
            setExpiryDate(d.toISOString().split('T')[0]);
          } else {
            setDefaultDate();
          }
        } catch {
          setDefaultDate();
        }
      } else {
        setDefaultDate();
      }
    }
  }, [isOpen, workspace, plans]);

  const setDefaultDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    setExpiryDate(d.toISOString().split('T')[0]);
  };

  const handleQuickExtend = (days: number) => {
    let base = new Date();
    // If the input date is valid and in the future, extend from that date
    if (expiryDate) {
      const parsed = new Date(expiryDate);
      if (!isNaN(parsed.getTime()) && parsed > base) {
        base = parsed;
      }
    }
    const newDate = new Date(base.getTime());
    newDate.setDate(newDate.getDate() + days);
    setExpiryDate(newDate.toISOString().split('T')[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspace) return;

    if (!expiryDate) {
      showToast('Please select a valid expiry date.', 'error');
      return;
    }

    try {
      const parsedExpiry = new Date(`${expiryDate}T23:59:59`);
      
      const payload: any = {
        workspaceId: workspace.id,
        saasPlanId: saasPlanId || null,
        status,
      };

      if (status === 'TRIAL') {
        payload.trialEndDate = parsedExpiry.toISOString();
        payload.currentPeriodEnd = null;
      } else {
        payload.currentPeriodEnd = parsedExpiry.toISOString();
      }

      await updateSubscription(payload).unwrap();
      showToast(`Subscription for "${workspace.name}" updated successfully.`, 'success');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err?.data?.message || 'Failed to update workspace subscription.', 'error');
    }
  };

  if (!workspace) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Workspace Subscription & Expiry"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '4px 0' }}>
          
          {/* Workspace Info Header Banner */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(37,99,235,0.06) 0%, rgba(59,130,246,0.02) 100%)',
            border: '1px solid #bfdbfe',
            borderRadius: '12px',
            padding: '14px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                Workspace
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                {workspace.name}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Current Status:</span>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '6px',
                background: workspace.subscription?.status === 'ACTIVE' ? '#dcfce7' : '#fee2e2',
                color: workspace.subscription?.status === 'ACTIVE' ? '#166534' : '#991b1b',
              }}>
                {workspace.subscription?.status || 'NO_SUBSCRIPTION'}
              </span>
            </div>
          </div>

          {/* Form Fields: SaaS Plan & Subscription Status */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            
            {/* SaaS Plan Tier */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                SaaS Plan Tier
              </label>
              <select
                value={saasPlanId}
                onChange={(e) => setSaasPlanId(e.target.value)}
                disabled={isPlansLoading}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.875rem',
                  color: '#0f172a',
                  backgroundColor: '#ffffff',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="">-- No Specific Plan --</option>
                {plans.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (₹{Number(p.price).toLocaleString('en-IN')}/mo)
                  </option>
                ))}
              </select>
            </div>

            {/* Subscription Status */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Subscription Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: status === 'ACTIVE' ? '#166534' : (status === 'TRIAL' ? '#0369a1' : '#991b1b'),
                  backgroundColor: '#ffffff',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="ACTIVE">ACTIVE (Full Paid Access)</option>
                <option value="TRIAL">TRIAL (Evaluation Period)</option>
                <option value="EXPIRED">EXPIRED (Access Suspended)</option>
                <option value="CANCELLED">CANCELLED (Account Inactive)</option>
              </select>
            </div>
          </div>

          {/* Expiry Date Section */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} style={{ color: '#2563eb' }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>
                  {status === 'TRIAL' ? 'Trial Expiry Date' : 'Subscription Expiry / Renewal Date'}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  The workspace access will remain active until the end of this day.
                </div>
              </div>
            </div>

            <div style={{ maxWidth: '280px' }}>
              <Input
                label="Select Date"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                required
              />
            </div>

            {/* Quick Extension Presets */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>
                <Clock size={13} />
                <span>QUICK EXTEND PRESETS (Click to add):</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {[
                  { label: '+7 Days', days: 7 },
                  { label: '+15 Days', days: 15 },
                  { label: '+1 Month (30d)', days: 30 },
                  { label: '+3 Months (90d)', days: 90 },
                  { label: '+6 Months (180d)', days: 180 },
                  { label: '+1 Year (365d)', days: 365 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handleQuickExtend(preset.days)}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      padding: '6px 12px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: '#1e293b',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#2563eb';
                      e.currentTarget.style.color = '#2563eb';
                      e.currentTarget.style.background = 'rgba(37, 99, 235, 0.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#cbd5e1';
                      e.currentTarget.style.color = '#1e293b';
                      e.currentTarget.style.background = '#ffffff';
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Modal Footer Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isUpdating}
              style={{ borderRadius: '10px', padding: '10px 18px' }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isUpdating}
              style={{
                borderRadius: '10px',
                padding: '10px 22px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#2563eb'
              }}
            >
              <CheckCircle2 size={16} />
              {isUpdating ? 'Saving Changes...' : 'Save Expiry & Subscription'}
            </Button>
          </div>

        </div>
      </form>
    </Modal>
  );
};
