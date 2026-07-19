import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  useGetWorkspaceByIdQuery, 
  useUpdateWorkspaceMutation,
  useGetStudentsQuery 
} from '../../store/api';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/ToastContext';
import { 
  ArrowLeft, 
  Building2, 
  Users, 
  Grid, 
  IndianRupee, 
  Mail, 
  Phone, 
  ShieldAlert, 
  ShieldCheck, 
  ExternalLink 
} from 'lucide-react';

export default function WorkspaceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const { data: workspace, isLoading, error } = useGetWorkspaceByIdQuery(id!, { skip: !id });
  const { data: students = [] } = useGetStudentsQuery({ workspaceId: id }, { skip: !id });
  const [updateWorkspace, { isLoading: isUpdating }] = useUpdateWorkspaceMutation();

  const handleToggleAccess = async () => {
    if (!workspace) return;
    try {
      await updateWorkspace({
        id: workspace.id,
        isActive: !workspace.isActive
      }).unwrap();
      showToast(
        `Workspace "${workspace.name}" has been ${!workspace.isActive ? 'enabled' : 'disabled'} successfully.`,
        'success'
      );
    } catch (err) {
      showToast('Failed to update workspace status.', 'error');
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px', color: '#64748b' }}>
        Loading workspace details...
      </div>
    );
  }

  if (error || !workspace) {
    return (
      <div style={{ padding: '2rem', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', border: '1px solid #fca5a5' }}>
        Failed to load workspace details. Please verify the ID and try again.
      </div>
    );
  }

  const owner = workspace.users && workspace.users[0];
  const isActive = workspace.isActive;

  const stats = [
    { 
      label: 'Registered Students', 
      value: workspace.metrics?.studentCount || 0, 
      icon: <Users size={20} />, 
      color: '#3b82f6', 
      bg: 'rgba(59, 130, 246, 0.08)', 
      path: `/super-admin/workspaces/${id}/students` 
    },
    { 
      label: 'Classrooms / Rooms', 
      value: workspace.metrics?.roomCount || 0, 
      icon: <Building2 size={20} />, 
      color: '#10b981', 
      bg: 'rgba(16, 185, 129, 0.08)', 
      path: `/super-admin/workspaces/${id}/rooms` 
    },
    { 
      label: 'Desk Capacity (Seats)', 
      value: workspace.metrics?.seatCount || 0, 
      icon: <Grid size={20} />, 
      color: '#f59e0b', 
      bg: 'rgba(245, 158, 11, 0.08)', 
      path: `/super-admin/workspaces/${id}/rooms` 
    },
    { 
      label: 'Total Revenue (INR)', 
      value: `₹${workspace.metrics?.totalRevenue || 0}`, 
      icon: <IndianRupee size={20} />, 
      color: '#8b5cf6', 
      bg: 'rgba(139, 92, 246, 0.08)', 
      path: `/super-admin/workspaces/${id}/billing` 
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Back navigation */}
      <div>
        <Button 
          variant="outline" 
          onClick={() => navigate('/super-admin/workspaces')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '10px' }}
        >
          <ArrowLeft size={16} /> Back to Workspaces
        </Button>
      </div>

      {/* Header Overview Card */}
      <div style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        color: '#ffffff',
        padding: '24px',
        borderRadius: '16px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em' }}>{workspace.name}</h2>
            <span style={{
              background: isActive ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
              color: isActive ? '#34d399' : '#f87171',
              border: `1px solid ${isActive ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              padding: '2px 10px',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase'
            }}>
              {isActive ? 'Access Active' : 'Access Disabled'}
            </span>
          </div>
          <span style={{ fontSize: '0.9rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
            URL: <a href={`http://${workspace.subdomain}.studyflow.in:5173`} target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              {workspace.subdomain}.studyflow.in <ExternalLink size={12} />
            </a>
          </span>
        </div>

        <Button
          variant="primary"
          onClick={handleToggleAccess}
          disabled={isUpdating}
          style={{
            borderRadius: '12px',
            padding: '10px 20px',
            backgroundColor: isActive ? '#dc2626' : '#16a34a',
            borderColor: isActive ? '#dc2626' : '#16a34a',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          {isActive ? <ShieldAlert size={16} /> : <ShieldCheck size={16} />}
          {isActive ? 'Revoke / Disable Access' : 'Restore / Enable Access'}
        </Button>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        {stats.map((stat, index) => (
          <div 
            key={index} 
            onClick={() => navigate(stat.path)}
            style={{
              background: '#ffffff',
              border: '1px solid rgba(15, 23, 42, 0.05)',
              borderRadius: '16px',
              padding: '20px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.02)';
            }}
          >
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: stat.bg,
              color: stat.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {stat.icon}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{stat.label}</span>
              <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>{stat.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Two Column details section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', alignItems: 'start' }}>
        
        {/* General & Owner info */}
        <div style={{
          background: '#ffffff',
          border: '1px solid rgba(15, 23, 42, 0.05)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          <div>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
              Workspace Profile Details
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Workspace ID:</span>
                <span style={{ fontWeight: 600, color: '#334155', fontFamily: 'monospace' }}>{workspace.id}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Physical Address:</span>
                <span style={{ fontWeight: 600, color: '#334155', textAlign: 'right' }}>
                  {workspace.address} {workspace.pincode && `(PIN: ${workspace.pincode})`}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Created Date:</span>
                <span style={{ fontWeight: 600, color: '#334155' }}>
                  {new Date(workspace.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
              Owner Account details
            </h3>
            {owner ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Full Name:</span>
                  <span style={{ fontWeight: 600, color: '#334155' }}>{owner.name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Email ID:</span>
                  <span style={{ fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Mail size={14} style={{ color: '#94a3b8' }} /> {owner.email}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Mobile Number:</span>
                  <span style={{ fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Phone size={14} style={{ color: '#94a3b8' }} /> {owner.mobile || 'N/A'}
                  </span>
                </div>
              </div>
            ) : (
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>No owner details associated.</p>
            )}
          </div>
        </div>

        {/* Subscription details */}
        <div style={{
          background: '#ffffff',
          border: '1px solid rgba(15, 23, 42, 0.05)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)'
        }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
            SaaS Subscription Details
          </h3>
          {workspace.subscription ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Active SaaS Plan:</span>
                  <span style={{ fontWeight: 700, color: 'var(--accent-blue)' }}>
                    {workspace.subscription.saasPlan?.name || 'Trial/Basic'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Status:</span>
                  <span style={{ 
                    fontWeight: 700, 
                    color: workspace.subscription.status === 'ACTIVE' ? '#166534' : '#b45309' 
                  }}>
                    {workspace.subscription.status}
                  </span>
                </div>
                {workspace.subscription.trialEndDate && workspace.subscription.status === 'TRIAL' && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Trial Ends:</span>
                    <span style={{ color: '#334155', fontWeight: 600 }}>
                      {new Date(workspace.subscription.trialEndDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                    </span>
                  </div>
                )}
                {workspace.subscription.currentPeriodEnd && workspace.subscription.status === 'ACTIVE' && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Subscription Renewal:</span>
                    <span style={{ color: '#334155', fontWeight: 600 }}>
                      {new Date(workspace.subscription.currentPeriodEnd).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                    </span>
                  </div>
                )}
              </div>
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '14px',
                fontSize: '0.8rem',
                color: '#475569',
                lineHeight: 1.5
              }}>
                <strong>Plan Features:</strong>
                <ul style={{ margin: '6px 0 0 0', paddingLeft: '20px' }}>
                  <li>Max Rooms: {workspace.subscription.saasPlan?.maxRooms || 'Unlimited'}</li>
                  <li>Max Seats: {workspace.subscription.saasPlan?.maxSeats || 'Unlimited'}</li>
                  <li>WhatsApp Broadcast: {workspace.subscription.saasPlan?.allowWhatsApp ? 'Allowed' : 'Not Allowed'}</li>
                </ul>
              </div>
            </div>
          ) : (
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>No active subscription plan configured.</p>
          )}
        </div>
      </div>

      {/* Workspace Preview Lists (Branches Summary) */}
      <div style={{
        background: '#ffffff',
        border: '1px solid rgba(15, 23, 42, 0.05)',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
            Library Branches ({workspace.branches?.length || 0})
          </h3>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate(`/super-admin/workspaces/${id}/branches`)}
            style={{ borderRadius: '8px' }}
          >
            View All Branches
          </Button>
        </div>
        
        {workspace.branches && workspace.branches.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
                <th style={{ padding: '8px 12px' }}>Branch Name</th>
                <th style={{ padding: '8px 12px' }}>Branch Address</th>
                <th style={{ padding: '8px 12px' }}>Added Date</th>
              </tr>
            </thead>
            <tbody>
              {workspace.branches.slice(0, 3).map((b: any) => (
                <tr key={b.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px', fontWeight: 600, color: '#1e293b' }}>{b.name}</td>
                  <td style={{ padding: '12px', color: '#475569' }}>{b.address || 'Main Location'}</td>
                  <td style={{ padding: '12px', color: '#64748b' }}>
                    {new Date(b.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>No branches registered yet.</p>
        )}
      </div>

      {/* Workspace Preview Lists (Students Summary) */}
      <div style={{
        background: '#ffffff',
        border: '1px solid rgba(15, 23, 42, 0.05)',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
            Registered Students Preview ({students.length})
          </h3>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate(`/super-admin/workspaces/${id}/students`)}
            style={{ borderRadius: '8px' }}
          >
            View All Students
          </Button>
        </div>

        {students.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
                <th style={{ padding: '8px 12px' }}>Student</th>
                <th style={{ padding: '8px 12px' }}>Mobile Number</th>
                <th style={{ padding: '8px 12px' }}>Joined Date</th>
                <th style={{ padding: '8px 12px' }}>Due balance</th>
              </tr>
            </thead>
            <tbody>
              {students.slice(0, 5).map((stud: any) => (
                <tr key={stud.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px', fontWeight: 600, color: '#1e293b' }}>
                    {stud.user?.name}
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 400 }}>{stud.user?.email || 'No email'}</div>
                  </td>
                  <td style={{ padding: '12px', color: '#475569' }}>{stud.user?.mobile}</td>
                  <td style={{ padding: '12px', color: '#64748b' }}>
                    {new Date(stud.joiningDate).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '12px', fontWeight: 600, color: stud.dueAmount > 0 ? '#ef4444' : '#10b981' }}>
                    ₹{stud.dueAmount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>No students registered under this library yet.</p>
        )}
      </div>

    </div>
  );
}
