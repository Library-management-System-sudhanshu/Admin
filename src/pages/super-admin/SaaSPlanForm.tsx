import { LoadingState } from '../../components/feedback/LoadingState';
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  useGetSaaSPlansQuery, 
  useCreateSaaSPlanMutation, 
  useUpdateSaaSPlanMutation 
} from '../../store/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useToast } from '../../components/ui/ToastContext';
import { ArrowLeft, Save, Zap, Check, Info } from 'lucide-react';

export default function SaaSPlanForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const isEditMode = Boolean(id);

  const { data: plans = [], isLoading: isPlansLoading } = useGetSaaSPlansQuery({});
  const [createPlan, { isLoading: isCreating }] = useCreateSaaSPlanMutation();
  const [updatePlan, { isLoading: isUpdating }] = useUpdateSaaSPlanMutation();

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    maxSeats: '',
    features: '',
    allowWhatsApp: false,
    maxRooms: '',
  });

  // Load editing plan details if in edit mode
  useEffect(() => {
    if (isEditMode && plans.length > 0) {
      const plan = plans.find((p: any) => p.id === id);
      if (plan) {
        setFormData({
          name: plan.name,
          price: plan.price.toString(),
          description: plan.description || '',
          maxSeats: plan.maxSeats === -1 ? '' : plan.maxSeats.toString(),
          features: plan.features ? plan.features.join('\n') : '',
          allowWhatsApp: plan.allowWhatsApp || false,
          maxRooms: plan.maxRooms ? plan.maxRooms.toString() : '',
        });
      } else {
        showToast('Requested plan tier not found.', 'error');
        navigate('/super-admin/plans');
      }
    }
  }, [id, isEditMode, plans, navigate, showToast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      name: formData.name,
      price: parseFloat(formData.price),
      description: formData.description,
      maxSeats: formData.maxSeats ? parseInt(formData.maxSeats) : -1,
      features: formData.features.split('\n').filter(f => f.trim()),
      allowWhatsApp: formData.allowWhatsApp,
      maxRooms: formData.maxRooms ? parseInt(formData.maxRooms) : -1,
    };

    try {
      if (isEditMode) {
        await updatePlan({ id: id!, ...payload }).unwrap();
        showToast('Plan tier updated successfully.', 'success');
      } else {
        await createPlan(payload).unwrap();
        showToast('New SaaS plan tier created successfully.', 'success');
      }
      navigate('/super-admin/plans');
    } catch (err) {
      showToast('Error saving plan parameters. Please try again.', 'error');
    }
  };

  if (isEditMode && isPlansLoading) {
    return (
      <LoadingState label="Loading plan parameters..." />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Back button */}
      <div>
        <Button 
          variant="outline" 
          onClick={() => navigate('/super-admin/plans')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '10px' }}
        >
          <ArrowLeft size={16} /> Back to Pricing Plans
        </Button>
      </div>

      {/* Main editor structure */}
      <div style={{
        background: '#ffffff',
        border: '1px solid rgba(15, 23, 42, 0.05)',
        borderRadius: '20px',
        padding: '32px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.02)',
        display: 'flex',
        flexDirection: 'column',
        gap: '28px'
      }}>
        
        {/* Title and Intro */}
        <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'rgba(37, 99, 235, 0.08)',
            color: '#2563eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Zap size={20} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
              {isEditMode ? 'Modify SaaS Plan Tier' : 'Define New Subscription Tier'}
            </h2>
            <p style={{ margin: '2px 0 0 0', color: '#64748b', fontSize: '0.85rem' }}>
              Set subscription pricing, seat capacities, room allowances, and custom feature checklists for library owners.
            </p>
          </div>
        </div>

        {/* Editor Form */}
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', alignItems: 'start' }}>
          
          {/* Left Column: Properties & Pricing */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Plan Properties
            </h3>

            <Input
              label="Plan Name / Identifier"
              placeholder="e.g. Starter Tier, Elite Center"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Input
                label="Monthly Pricing (INR)"
                type="number"
                placeholder="e.g. 1999"
                required
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              />
              <Input
                label="Maximum Seat Capacity"
                type="number"
                placeholder="Leave blank for unlimited"
                min="1"
                value={formData.maxSeats}
                onChange={(e) => setFormData({ ...formData, maxSeats: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'center' }}>
              <Input
                label="Maximum Classroom/Room Cap"
                type="number"
                placeholder="Leave blank for unlimited"
                min="1"
                value={formData.maxRooms}
                onChange={(e) => setFormData({ ...formData, maxRooms: e.target.value })}
              />

              {/* WhatsApp Broadcast toggle */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '16px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>WhatsApp Broadcast Access</span>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  cursor: 'pointer', 
                  fontSize: '0.85rem', 
                  color: '#1e293b', 
                  fontWeight: 600,
                  border: '1px solid #cbd5e1',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  backgroundColor: '#f8fafc'
                }}>
                  <input 
                    type="checkbox"
                    checked={formData.allowWhatsApp}
                    onChange={(e) => setFormData({ ...formData, allowWhatsApp: e.target.checked })}
                    style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '4px',
                      accentColor: '#2563eb',
                      cursor: 'pointer'
                    }}
                  />
                  Allow broadcasts
                </label>
              </div>
            </div>

            <Input
              label="Short Pitch / Subtitle"
              placeholder="e.g. Perfect for libraries starting with their first branch."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />

            {/* Info notice box */}
            <div style={{
              background: 'rgba(59, 130, 246, 0.04)',
              border: '1px solid rgba(59, 130, 246, 0.15)',
              borderRadius: '12px',
              padding: '14px',
              fontSize: '0.8rem',
              color: '#3b82f6',
              lineHeight: 1.5,
              display: 'flex',
              gap: '10px',
              alignItems: 'flex-start'
            }}>
              <Info size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Limits Notice:</strong> Leaving Seat/Desk limits or Classroom thresholds blank will enable <strong>Unlimited</strong> allocations on the client library workspace.
              </div>
            </div>
          </div>

          {/* Right Column: Features List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Feature Checklist
            </h3>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>
                Bullet Features (One item per line)
              </label>
              <textarea
                placeholder="Unlimited branch profiles&#10;Detailed attendance logs&#10;Priority 24/7 technical support&#10;Complaints & support tracker"
                rows={7}
                style={{ 
                  width: '100%', 
                  padding: '12px 14px', 
                  borderRadius: '10px', 
                  border: '1px solid #cbd5e1', 
                  fontFamily: 'inherit', 
                  fontSize: '0.85rem',
                  resize: 'vertical',
                  outline: 'none',
                  lineHeight: 1.6
                }}
                value={formData.features}
                onChange={(e) => setFormData({ ...formData, features: e.target.value })}
              />
            </div>

            {/* Preview visual check box */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Preview feature Checklist
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {formData.features.split('\n').filter(f => f.trim()).map((feat, index) => (
                  <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.825rem', color: '#334155' }}>
                    <Check size={14} style={{ color: '#2563eb' }} />
                    <span>{feat}</span>
                  </div>
                ))}
                {!formData.features.trim() && (
                  <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontStyle: 'italic' }}>Start typing features to see preview...</span>
                )}
              </div>
            </div>

            {/* Actions button row */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'flex-end', 
              gap: '12px', 
              marginTop: '16px', 
              borderTop: '1px solid #f1f5f9', 
              paddingTop: '20px' 
            }}>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate('/super-admin/plans')}
                style={{ borderRadius: '10px' }}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="primary" 
                disabled={isCreating || isUpdating}
                style={{ borderRadius: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Save size={16} />
                {isCreating || isUpdating ? 'Saving tier parameters...' : 'Save Plan Settings'}
              </Button>
            </div>

          </div>

        </form>

      </div>

    </div>
  );
}
