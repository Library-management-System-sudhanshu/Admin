import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useGetSaaSPlansQuery, useCreateSaaSPlanMutation, useUpdateSaaSPlanMutation } from '../../store/api';
import { X, Check } from 'lucide-react';

export default function SaaSPlans() {
  const { data: plans = [], isLoading } = useGetSaaSPlansQuery({});
  const [createPlan, { isLoading: isCreating }] = useCreateSaaSPlanMutation();
  const [updatePlan, { isLoading: isUpdating }] = useUpdateSaaSPlanMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    maxSeats: '',
    features: '',
  });

  const handleOpenModal = (plan?: any) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData({
        name: plan.name,
        price: plan.price.toString(),
        description: plan.description || '',
        maxSeats: plan.maxSeats === -1 ? '' : plan.maxSeats.toString(),
        features: plan.features ? plan.features.join('\n') : '',
      });
    } else {
      setEditingPlan(null);
      setFormData({
        name: '',
        price: '',
        description: '',
        maxSeats: '',
        features: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      name: formData.name,
      price: parseFloat(formData.price),
      description: formData.description,
      maxSeats: formData.maxSeats ? parseInt(formData.maxSeats) : -1,
      features: formData.features.split('\n').filter(f => f.trim()),
    };

    try {
      if (editingPlan) {
        await updatePlan({ id: editingPlan.id, ...payload }).unwrap();
      } else {
        await createPlan(payload).unwrap();
      }
      setIsModalOpen(false);
    } catch (err) {
      alert('Error saving plan. Please try again.');
    }
  };

  const handleToggleActive = async (plan: any) => {
    try {
      await updatePlan({ id: plan.id, isActive: !plan.isActive }).unwrap();
    } catch (err) {
      alert('Error toggling plan status.');
    }
  };

  if (isLoading) {
    return <div style={{ padding: '2rem' }}>Loading plans...</div>;
  }

  return (
    <div style={{ background: 'white', borderRadius: '12px', padding: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ margin: 0, color: '#0f172a', fontSize: '1.25rem' }}>SaaS Pricing Plans</h2>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>Define what you charge Library Owners for using StudyFlow.</p>
        </div>
        <Button variant="primary" onClick={() => handleOpenModal()}>Create New Plan</Button>
      </div>

      {plans.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
          <p style={{ color: '#64748b' }}>No plans created yet. Click "Create New Plan" to get started.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
          {plans.map((plan: any) => (
            <div key={plan.id} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem', opacity: plan.isActive ? 1 : 0.6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', color: '#0f172a' }}>
                  {plan.name} {!plan.isActive && <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 'bold' }}>(Inactive)</span>}
                </h3>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0ea5e9', marginBottom: '0.5rem' }}>₹{plan.price} / mo</div>
              <p style={{ color: '#64748b', margin: '0 0 1.5rem 0', fontSize: '0.9rem', minHeight: '40px' }}>
                {plan.description || (plan.maxSeats === -1 ? 'Unlimited seats' : `Up to ${plan.maxSeats} seats`)}
              </p>
              
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem 0', minHeight: '120px' }}>
                {plan.features?.map((f: string, j: number) => (
                  <li key={j} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#475569' }}>
                    <Check size={16} color="#10b981" /> {f}
                  </li>
                ))}
              </ul>
              
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Button variant="outline" fullWidth onClick={() => handleOpenModal(plan)}>Edit</Button>
                <Button variant="outline" style={{ color: plan.isActive ? '#ef4444' : '#10b981', borderColor: plan.isActive ? '#ef4444' : '#10b981' }} onClick={() => handleToggleActive(plan)}>
                  {plan.isActive ? 'Disable' : 'Enable'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Plan Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', borderRadius: '12px', width: '100%', maxWidth: '500px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{editingPlan ? 'Edit SaaS Plan' : 'Create SaaS Plan'}</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <Input
                label="Plan Name"
                placeholder="e.g., Pro Tier"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <Input
                label="Monthly Price (₹)"
                type="number"
                placeholder="1999"
                required
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              />
              <Input
                label="Short Description"
                placeholder="Brief summary of who this plan is for..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
              <Input
                label="Max Seats Allowed"
                type="number"
                placeholder="Leave blank for unlimited"
                min="1"
                value={formData.maxSeats}
                onChange={(e) => setFormData({ ...formData, maxSeats: e.target.value })}
              />
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: '#334155' }}>Features (One per line)</label>
                <textarea
                  placeholder="Unlimited Branches&#10;Advanced Analytics&#10;Priority Support"
                  rows={4}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.375rem', border: '1px solid #e2e8f0', fontFamily: 'inherit', resize: 'vertical' }}
                  value={formData.features}
                  onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                />
              </div>

              <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" variant="primary" disabled={isCreating || isUpdating}>
                  {isCreating || isUpdating ? 'Saving...' : 'Save Plan'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
