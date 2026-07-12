import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { useGetWorkspacesQuery, useUpdateWorkspaceMutation, useCreateWorkspaceMutation } from '../../store/api';
import { useToast } from '../../components/ui/ToastContext';
import { Building2, Plus, Info, Check, Eye } from 'lucide-react';

export default function WorkspacesList() {
  const { data: workspaces = [], isLoading, error } = useGetWorkspacesQuery({});
  const [updateWorkspace, { isLoading: isUpdating }] = useUpdateWorkspaceMutation();
  const [createWorkspace, { isLoading: isCreating }] = useCreateWorkspaceMutation();
  const { showToast } = useToast();

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
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
    setSelectedWorkspace(workspace);
    setIsViewModalOpen(true);
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
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px', color: '#64748b' }}>
        Loading workspaces...
      </div>
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
                  <td style={{ padding: '1rem', fontWeight: 600, color: '#0f172a' }}>{row.name}</td>
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
                      onClick={() => handleOpenViewModal(row)}
                      style={{ marginRight: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                    >
                      <Info size={14} /> View Details
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
                onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
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

      {/* 2. VIEW DETAILS MODAL */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Workspace Details"
        maxWidth="md"
      >
        {selectedWorkspace && (
          <div style={{ padding: '0.5rem 0' }}>
            {/* Summary Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #f1f5f9', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#0f172a', fontSize: '1.25rem', fontWeight: 700 }}>
                  {selectedWorkspace.name}
                </h3>
                <span style={{ 
                  background: selectedWorkspace.isActive ? '#dcfce7' : '#fee2e2', 
                  color: selectedWorkspace.isActive ? '#166534' : '#991b1b', 
                  padding: '4px 10px', 
                  borderRadius: '4px', 
                  fontSize: '0.8rem', 
                  fontWeight: 700 
                }}>
                  {selectedWorkspace.isActive ? 'Access: Active' : 'Access: Disabled'}
                </span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleToggleAccess(selectedWorkspace)}
                style={{ 
                  borderColor: selectedWorkspace.isActive ? '#ef4444' : '#10b981', 
                  color: selectedWorkspace.isActive ? '#ef4444' : '#10b981' 
                }}
              >
                {selectedWorkspace.isActive ? 'Disable Access' : 'Enable Access'}
              </Button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              {/* Left Column: General Metadata */}
              <div>
                <h4 style={{ margin: '0 0 1rem 0', color: '#475569', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                  General Info
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.9rem' }}>
                  <div>
                    <div style={{ color: '#64748b', fontSize: '0.8rem' }}>Workspace ID</div>
                    <div style={{ color: '#334155', fontFamily: 'monospace', fontSize: '0.85rem', wordBreak: 'break-all' }}>{selectedWorkspace.id}</div>
                  </div>
                  <div>
                    <div style={{ color: '#64748b', fontSize: '0.8rem' }}>Subdomain URL</div>
                    <div style={{ color: '#334155' }}>
                      <a href={`http://${selectedWorkspace.subdomain}.studyflow.in:5173`} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>
                        {selectedWorkspace.subdomain}.studyflow.in
                      </a>
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#64748b', fontSize: '0.8rem' }}>Address</div>
                    <div style={{ color: '#334155', lineHeight: 1.4 }}>
                      {selectedWorkspace.address}
                      {selectedWorkspace.pincode && `, PIN - ${selectedWorkspace.pincode}`}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#64748b', fontSize: '0.8rem' }}>Created At</div>
                    <div style={{ color: '#334155' }}>{new Date(selectedWorkspace.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</div>
                  </div>
                </div>
              </div>

              {/* Right Column: Owner & SaaS Billing */}
              <div>
                {/* Owner info */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ margin: '0 0 1rem 0', color: '#475569', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                    Owner details
                  </h4>
                  {selectedWorkspace.users && selectedWorkspace.users[0] ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem' }}>
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>{selectedWorkspace.users[0].name}</div>
                      <div style={{ color: '#64748b' }}>Email: <span style={{ color: '#334155' }}>{selectedWorkspace.users[0].email}</span></div>
                      <div style={{ color: '#64748b' }}>Mobile: <span style={{ color: '#334155' }}>{selectedWorkspace.users[0].mobile || 'N/A'}</span></div>
                    </div>
                  ) : (
                    <p style={{ color: '#64748b', margin: 0, fontSize: '0.9rem' }}>No owner registered.</p>
                  )}
                </div>

                {/* SaaS Subscription Info */}
                <div style={{ 
                  background: '#f8fafc', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '8px', 
                  padding: '1rem' 
                }}>
                  <h4 style={{ margin: '0 0 0.75rem 0', color: '#475569', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                    SaaS Subscription
                  </h4>
                  {selectedWorkspace.subscription ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748b' }}>Plan:</span>
                        <span style={{ fontWeight: 700, color: '#0f172a' }}>
                          {selectedWorkspace.subscription.saasPlan?.name || 'Trial Plan'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748b' }}>Status:</span>
                        <span style={{ 
                          fontWeight: 700, 
                          color: selectedWorkspace.subscription.status === 'ACTIVE' ? '#166534' : '#b45309' 
                        }}>
                          {selectedWorkspace.subscription.status}
                        </span>
                      </div>
                      {selectedWorkspace.subscription.trialEndDate && selectedWorkspace.subscription.status === 'TRIAL' && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#64748b' }}>Trial Ends:</span>
                          <span style={{ color: '#334155', fontWeight: 500 }}>
                            {new Date(selectedWorkspace.subscription.trialEndDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {selectedWorkspace.subscription.currentPeriodEnd && selectedWorkspace.subscription.status === 'ACTIVE' && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#64748b' }}>Next Renewal:</span>
                          <span style={{ color: '#334155', fontWeight: 500 }}>
                            {new Date(selectedWorkspace.subscription.currentPeriodEnd).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p style={{ color: '#64748b', margin: 0, fontSize: '0.85rem' }}>No active SaaS trial or plan.</p>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
              <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>Close Details</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
