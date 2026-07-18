import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { useGetSaaSPlansQuery, useUpdateSaaSPlanMutation } from '../../store/api';
import { Plus, Edit, Zap, Award, Sparkles, Check } from 'lucide-react';
import { useToast } from '../../components/ui/ToastContext';

// Helper to resolve card styles based on pricing tiers
const getPlanTheme = (price: number) => {
  if (price < 1000) {
    return {
      primary: '#10b981', // Emerald
      bgLight: 'rgba(16, 185, 129, 0.03)',
      bgBorder: 'rgba(16, 185, 129, 0.15)',
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      shadow: 'rgba(16, 185, 129, 0.1)',
      badge: 'Starter Tier',
      icon: <Zap size={22} style={{ color: '#10b981' }} />
    };
  } else if (price >= 1000 && price < 3000) {
    return {
      primary: '#2563eb', // Indigo Blue
      bgLight: 'rgba(37, 99, 235, 0.03)',
      bgBorder: 'rgba(37, 99, 235, 0.2)',
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
      shadow: 'rgba(37, 99, 235, 0.15)',
      badge: 'Growth Tier',
      icon: <Award size={22} style={{ color: '#2563eb' }} />,
      popular: true
    };
  } else {
    return {
      primary: '#8b5cf6', // Violet/Purple
      bgLight: 'rgba(139, 92, 246, 0.03)',
      bgBorder: 'rgba(139, 92, 246, 0.2)',
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
      shadow: 'rgba(139, 92, 246, 0.15)',
      badge: 'Enterprise Elite',
      icon: <Sparkles size={22} style={{ color: '#8b5cf6' }} />
    };
  }
};

export default function SaaSPlans() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { data: plans = [], isLoading } = useGetSaaSPlansQuery({});
  const [updatePlan] = useUpdateSaaSPlanMutation();

  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);

  const handleToggleActive = async (plan: any) => {
    try {
      await updatePlan({ id: plan.id, isActive: !plan.isActive }).unwrap();
      showToast(`Plan has been ${!plan.isActive ? 'enabled' : 'disabled'} successfully.`, 'success');
    } catch (err) {
      showToast('Error updating plan status.', 'error');
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px', color: '#64748b' }}>
        Loading platform plans...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header section with description */}
      <div style={{
        background: '#ffffff',
        border: '1px solid rgba(15, 23, 42, 0.05)',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
            SaaS Subscription Plans
          </h2>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>
            Configure and manage SaaS tiers offered to library administrators, specifying desk thresholds and feature matrices.
          </p>
        </div>
        <Button 
          variant="primary" 
          onClick={() => navigate('/super-admin/plans/new')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '12px', padding: '10px 20px', fontWeight: 700 }}
        >
          <Plus size={16} /> Create New Plan
        </Button>
      </div>

      {/* Grid of pricing cards */}
      {plans.length === 0 ? (
        <div style={{
          padding: '48px',
          textAlign: 'center',
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px dashed #cbd5e1',
          color: '#64748b'
        }}>
          <p style={{ margin: 0, fontSize: '0.9rem' }}>No subscription tiers defined yet. Click "Create New Plan" to populate.</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px'
        }}>
          {plans.map((plan: any) => {
            const theme = getPlanTheme(plan.price);
            const isHovered = hoveredCardId === plan.id;
            const isActive = plan.isActive;

            return (
              <div 
                key={plan.id}
                onMouseEnter={() => setHoveredCardId(plan.id)}
                onMouseLeave={() => setHoveredCardId(null)}
                style={{
                  background: '#ffffff',
                  border: `2px solid ${isHovered ? theme.primary : isActive ? theme.bgBorder : 'rgba(226, 232, 240, 0.8)'}`,
                  borderRadius: '20px',
                  padding: '28px',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px',
                  opacity: isActive ? 1 : 0.65,
                  boxShadow: isHovered 
                    ? `0 20px 25px -5px ${theme.shadow}, 0 10px 10px -5px ${theme.shadow}` 
                    : '0 4px 6px -1px rgba(0, 0, 0, 0.01)',
                  transform: isHovered ? 'translateY(-6px)' : 'translateY(0)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  overflow: 'hidden'
                }}
              >
                {/* Popularity Ribbon Badge */}
                {theme.popular && isActive && (
                  <div style={{
                    position: 'absolute',
                    top: '0',
                    right: '0',
                    background: theme.gradient,
                    color: '#ffffff',
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    padding: '6px 14px',
                    borderBottomLeftRadius: '14px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Popular Tier
                  </div>
                )}

                {/* Card Title Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: theme.bgLight,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {theme.icon}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: theme.primary, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {theme.badge}
                    </span>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                      {plan.name}
                    </h3>
                  </div>
                </div>

                {/* Price Display */}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
                  <span style={{ fontSize: '2.25rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em' }}>
                    ₹{plan.price}
                  </span>
                  <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>
                    / month
                  </span>
                </div>

                {/* Plan Metrics / Threshold limits */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <p style={{ margin: 0, color: '#475569', fontSize: '0.85rem', lineHeight: 1.5, minHeight: '38px' }}>
                    {plan.description || `Perfect for expanding libraries requiring custom configurations.`}
                  </p>
                  
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                    <span style={{ background: '#f1f5f9', color: '#334155', padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
                      Seats: {plan.maxSeats === -1 ? 'Unlimited' : `${plan.maxSeats} capacity`}
                    </span>
                    <span style={{ background: '#f1f5f9', color: '#334155', padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
                      Rooms: {plan.maxRooms === -1 ? 'Unlimited' : `${plan.maxRooms} limit`}
                    </span>
                    <span style={{ 
                      background: plan.allowWhatsApp ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)', 
                      color: plan.allowWhatsApp ? '#059669' : '#dc2626', 
                      padding: '3px 8px', 
                      borderRadius: '6px', 
                      fontSize: '0.75rem', 
                      fontWeight: 700 
                    }}>
                      WhatsApp: {plan.allowWhatsApp ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>

                {/* Features Checklist */}
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Included Features
                  </h4>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {plan.features && plan.features.length > 0 ? (
                      plan.features.map((feat: string, index: number) => (
                        <li key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#334155' }}>
                          <Check size={14} style={{ color: theme.primary }} />
                          <span>{feat}</span>
                        </li>
                      ))
                    ) : (
                      <li style={{ color: '#94a3b8', fontSize: '0.8rem', fontStyle: 'italic' }}>No features specified</li>
                    )}
                  </ul>
                </div>

                {/* Actions row */}
                <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                  <Button 
                    variant="outline" 
                    fullWidth 
                    onClick={() => navigate(`/super-admin/plans/edit/${plan.id}`)}
                    style={{ borderRadius: '10px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                  >
                    <Edit size={12} /> Edit Tier
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => handleToggleActive(plan)}
                    style={{ 
                      borderRadius: '10px', 
                      fontWeight: 700,
                      borderColor: isActive ? '#dc2626' : '#16a34a', 
                      color: isActive ? '#dc2626' : '#16a34a',
                      minWidth: '90px'
                    }}
                  >
                    {isActive ? 'Disable' : 'Enable'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
