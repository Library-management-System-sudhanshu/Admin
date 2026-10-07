import { LoadingState } from '../../components/feedback/LoadingState';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Users, IndianRupee, TrendingUp } from 'lucide-react';
import { useGetSuperAdminMetricsQuery } from '../../store/api';

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const { data, isLoading, error } = useGetSuperAdminMetricsQuery({});

  if (isLoading) {
    return (
      <LoadingState label="Loading platform metrics..." />
    );
  }

  if (error || !data) {
    return (
      <div style={{ padding: '2rem', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', border: '1px solid #fca5a5' }}>
        Failed to load platform metrics. Please try again.
      </div>
    );
  }

  const metrics = [
    { 
      title: 'Total Workspaces', 
      value: data.totalWorkspaces.toString(), 
      icon: <Building2 size={24} />, 
      trend: 'Registered libraries' 
    },
    { 
      title: 'Active Students', 
      value: data.activeStudents.toLocaleString(), 
      icon: <Users size={24} />, 
      trend: 'Across all workspaces' 
    },
    { 
      title: 'Monthly Recurring Revenue', 
      value: `₹${data.monthlyRecurringRevenue.toLocaleString()}`, 
      icon: <IndianRupee size={24} />, 
      trend: 'From active SaaS plans' 
    },
    { 
      title: 'Platform Uptime', 
      value: data.platformUptime, 
      icon: <TrendingUp size={24} />, 
      trend: 'All systems operational' 
    },
  ];

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {metrics.map((m, i) => (
          <div key={i} style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>{m.title}</div>
              <div style={{ color: '#0ea5e9' }}>{m.icon}</div>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.25rem' }}>{m.value}</div>
            <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>{m.trend}</div>
          </div>
        ))}
      </div>

      <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <h3 style={{ margin: '0 0 1rem 0', color: '#0f172a', fontSize: '1.1rem' }}>Recent Onboardings</h3>
        
        {data.recentOnboardings.length === 0 ? (
          <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '1rem 0' }}>No workspaces onboarded yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#64748b' }}>
                <th style={{ padding: '0.75rem 0' }}>Workspace Name</th>
                <th>Owner</th>
                <th>Plan</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.recentOnboardings.map((row: any) => (
                <tr 
                  key={row.id} 
                  style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}
                  onClick={() => navigate(`/super-admin/workspaces/${row.id}`)}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <td style={{ padding: '1rem 0', fontWeight: 600, color: 'var(--accent-blue)' }}>
                    {row.name}
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 400, marginTop: '2px' }}>
                      {row.subdomain}.studyflow.in
                    </div>
                  </td>
                  <td style={{ color: '#475569' }}>{row.owner}</td>
                  <td style={{ color: '#475569' }}>{row.plan}</td>
                  <td>
                    <span style={{ 
                      background: row.status === 'ACTIVE' ? '#dcfce7' : row.status === 'TRIAL' ? '#e0f2fe' : '#fee2e2', 
                      color: row.status === 'ACTIVE' ? '#166534' : row.status === 'TRIAL' ? '#0369a1' : '#991b1b', 
                      padding: '4px 8px', 
                      borderRadius: '4px', 
                      fontSize: '0.75rem', 
                      fontWeight: 600 
                    }}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
