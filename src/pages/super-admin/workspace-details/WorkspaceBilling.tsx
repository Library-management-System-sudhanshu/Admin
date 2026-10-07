import { LoadingState } from '../../../components/feedback/LoadingState';
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetWorkspaceByIdQuery } from '../../../store/api';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { ArrowLeft, IndianRupee, Search } from 'lucide-react';

export default function WorkspaceBilling() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: workspace, isLoading } = useGetWorkspaceByIdQuery(id!, { skip: !id });

  if (isLoading) {
    return (
      <LoadingState label="Loading transaction ledger..." />
    );
  }

  if (!workspace) {
    return (
      <div style={{ padding: '2rem', background: '#fee2e2', color: '#991b1b', borderRadius: '8px' }}>
        Workspace not found.
      </div>
    );
  }

  const paymentsList = workspace.payments || [];
  const filteredPayments = paymentsList.filter((p: any) => 
    p.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.studentProfile?.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.studentProfile?.user?.mobile?.includes(searchQuery) ||
    p.channel?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Back navigation */}
      <div>
        <Button 
          variant="outline" 
          onClick={() => navigate(`/super-admin/workspaces/${id}`)}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '10px' }}
        >
          <ArrowLeft size={16} /> Back to {workspace.name} Details
        </Button>
      </div>

      {/* Main card panel */}
      <div style={{
        background: '#ffffff',
        border: '1px solid rgba(15, 23, 42, 0.05)',
        borderRadius: '16px',
        padding: '28px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        
        {/* Header Title and Search bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              background: 'rgba(139, 92, 246, 0.08)',
              color: '#8b5cf6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <IndianRupee size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>Collection Ledger / Payments list</h2>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Workspace: {workspace.name}</p>
            </div>
          </div>
          <div style={{ width: '300px' }}>
            <Input
              placeholder="Search by student name or invoice..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Payments Table */}
        {filteredPayments.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
                <th style={{ padding: '12px' }}>Invoice ID</th>
                <th style={{ padding: '12px' }}>Student Profile</th>
                <th style={{ padding: '12px' }}>Collected Amount</th>
                <th style={{ padding: '12px' }}>Paid Date</th>
                <th style={{ padding: '12px' }}>Method</th>
                <th style={{ padding: '12px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((pay: any) => (
                <tr key={pay.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px', fontFamily: 'monospace', color: '#64748b' }}>
                    #{pay.id.substring(0, 8)}
                  </td>
                  <td style={{ padding: '12px', fontWeight: 600, color: '#1e293b' }}>
                    {pay.studentProfile?.user?.name || 'Walk-in User'}
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 400 }}>{pay.studentProfile?.user?.mobile}</div>
                  </td>
                  <td style={{ padding: '12px', fontWeight: 700, color: '#0f172a' }}>
                    ₹{pay.amount}
                  </td>
                  <td style={{ padding: '12px', color: '#475569' }}>
                    {new Date(pay.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '12px', color: '#475569' }}>
                    <span style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 700, color: '#4b5563' }}>
                      {pay.channel || 'CASH'}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ 
                      background: pay.status === 'PAID' ? '#dcfce7' : '#fee2e2', 
                      color: pay.status === 'PAID' ? '#166534' : '#991b1b', 
                      padding: '3px 8px', 
                      borderRadius: '4px', 
                      fontSize: '0.75rem', 
                      fontWeight: 700 
                    }}>
                      {pay.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem', textAlign: 'center', padding: '24px 0' }}>
            No transaction records match your search query.
          </p>
        )}

      </div>

    </div>
  );
}
