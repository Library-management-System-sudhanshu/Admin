import { LoadingState } from '../../components/feedback/LoadingState';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { useGetWorkspacesQuery, useUpdateWorkspaceMutation, useCreateWorkspaceMutation } from '../../store/api';
import { useToast } from '../../components/ui/ToastContext';
import { Building2, Plus, Info, Check, Eye } from 'lucide-react';

export default function WorkspacesList() {
  const navigate = useNavigate();
  const { data: workspaces = [], isLoading, error } = useGetWorkspacesQuery({});
  const [updateWorkspace, { isLoading: isUpdating }] = useUpdateWorkspaceMutation();
  const [createWorkspace, { isLoading: isCreating }] = useCreateWorkspaceMutation();
  const { showToast } = useToast();

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState<any>(null);

  // Form state for creating workspace
  const [formData, setFormData] = useState({
    name: '',
    subdomain: '',
    address: '',
    pincode: '',
    ownerName: '',
    ownerEmail: '',
    ownerPassword: '',
    ownerMobile: '',
  });

  const handleOpenAddModal = () => {
    setFormData({
      name: '',
      subdomain: '',
      address: '',
      pincode: '',
      ownerName: '',
      ownerEmail: '',
      ownerPassword: '',
      ownerMobile: '',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenViewModal = (workspace: any) => {
    navigate(`/super-admin/workspaces/${workspace.id}`);
  };

  const handleAddWorkspaceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createWorkspace(formData).unwrap();
      showToast('Workspace and owner account created successfully!', 'success');
      setIsAddModalOpen(false);
    } catch (err: any) {
      showToast(err?.data?.message || 'Failed to create workspace manually.', 'error');
    }
  };

  const handleToggleAccess = async (workspace: any) => {
    try {
      await updateWorkspace({
        id: workspace.id,
        isActive: !workspace.isActive
      }).unwrap();
      showToast(
        `Workspace "${workspace.name}" has been ${!workspace.isActive ? 'enabled' : 'disabled'} successfully.`,
        'success'
      );
      // Update selected workspace in detail modal if open
      if (selectedWorkspace?.id === workspace.id) {
        setSelectedWorkspace({ ...workspace, isActive: !workspace.isActive });
      }
    } catch (err) {
      showToast('Failed to update workspace status.', 'error');
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const baseSubdomain = name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    setFormData(prev => ({
      ...prev,
      name,
      subdomain: baseSubdomain
    }));
  };

  if (isLoading) {
    return (
      <LoadingState label="Loading workspaces..." />
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', border: '1px solid #fca5a5' }}>
        Failed to load workspaces. Please try again.
      </div>
    );
  }

  return (
    <div style={{ background: 'white', borderRadius: '12px', padding: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ margin: 0, color: '#0f172a', fontSize: '1.25rem', fontWeight: 700 }}>Managed Workspaces</h2>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>Enable or disable access for library owners based on billing.</p>
        </div>
        <Button variant="primary" onClick={handleOpenAddModal} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={16} /> Add Workspace Manually
        </Button>
      </div>

      {workspaces.length === 0 ? (
        <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem' }}>No workspaces found.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#64748b' }}>
              <th style={{ padding: '1rem' }}>Workspace</th>
              <th style={{ padding: '1rem' }}>Subdomain</th>
              <th style={{ padding: '1rem' }}>Contact</th>
              <th style={{ padding: '1rem' }}>SaaS Plan</th>
              <th style={{ padding: '1rem' }}>Status</th>
              <th style={{ padding: '1rem' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {workspaces.map((row: any) => {
              const owner = row.users && row.users[0];
              const planName = row.subscription?.saasPlan?.name || (row.subscription ? `Trial (${row.subscription.status})` : 'No Subscription');
              const isActive = row.isActive;

              return (
                <tr key={row.id} style={{ borderBottom: '1px solid #f1f5f9', opacity: isActive ? 1 : 0.6 }}>
                  <td 
                    onClick={() => navigate(`/super-admin/workspaces/${row.id}`)}
                    style={{ padding: '1rem', fontWeight: 600, color: 'var(--accent-blue)', cursor: 'pointer' }}
                  >
                    {row.name}
                  </td>
                  <td style={{ padding: '1rem', color: '#475569' }}>{row.subdomain}.studyflow.in</td>
                  <td style={{ padding: '1rem', color: '#475569' }}>
                    {owner ? (
                      <div>
                        <div style={{ fontWeight: 500 }}>{owner.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{owner.email}</div>
                      </div>
                    ) : (
                      'N/A'
                    )}
                  </td>
                  <td style={{ padding: '1rem', color: '#475569' }}>{planName}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      background: isActive ? '#dcfce7' : '#fee2e2', 
                      color: isActive ? '#166534' : '#991b1b', 
                      padding: '4px 8px', 
                      borderRadius: '4px', 
                      fontSize: '0.75rem', 
                      fontWeight: 600 
                    }}>
                      {isActive ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => navigate(`/super-admin/workspaces/${row.id}`)}
                      style={{ marginRight: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                    >
                      <Eye size={14} /> View Details
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleToggleAccess(row)}
                      disabled={isUpdating}
                      style={{ 
                        borderColor: isActive ? '#ef4444' : '#10b981', 
                        color: isActive ? '#ef4444' : '#10b981' 
                      }}
                    >
                      {isActive ? 'Disable Access' : 'Enable Access'}
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* 1. ADD WORKSPACE MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Workspace Manually"
        maxWidth="md"
      >
        <form onSubmit={handleAddWorkspaceSubmit}>
          <div style={{ padding: '0.5rem 0' }}>
            <h4 style={{ margin: '0 0 1rem 0', color: '#1e293b', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem', fontSize: '1rem' }}>Workspace Information</h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <Input
                label="Workspace/Library Name"
                value={formData.name}
                onChange={handleNameChange}
                placeholder="e.g. Royal Library"
                required
              />
              <Input
                label="Subdomain (auto-generated)"
                value={formData.subdomain}
                onChange={(e) => setFormData({ ...formData, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                placeholder="e.g. royal-library"
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <Input
                label="Physical Address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="e.g. 1st Floor, Sector 15, Noida"
                required
              />
              <Input
                label="Pincode"
                value={formData.pincode}
                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                placeholder="e.g. 201301"
              />
            </div>

            <h4 style={{ margin: '1.5rem 0 1rem 0', color: '#1e293b', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem', fontSize: '1rem' }}>Owner Account Credentials</h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <Input
                label="Owner Full Name"
                value={formData.ownerName}
                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                placeholder="e.g. Rajesh Kumar"
                required
              />
              <Input
                label="Owner Mobile Number"
                value={formData.ownerMobile}
                onChange={(e) => setFormData({ ...formData, ownerMobile: e.target.value })}
                placeholder="e.g. 9876543210"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <Input
                label="Owner Email Address"
                type="email"
                value={formData.ownerEmail}
                onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value.toLowerCase() })}
                placeholder="e.g. rajesh@email.com"
                required
              />
              <Input
                label="Owner Password"
                type="password"
                value={formData.ownerPassword}
                onChange={(e) => setFormData({ ...formData, ownerPassword: e.target.value })}
                placeholder="Password (min 6 characters)"
                required
                minLength={6}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
              <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
              <Button type="submit" variant="primary" disabled={isCreating}>
                {isCreating ? 'Creating Workspace...' : 'Create Workspace'}
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
