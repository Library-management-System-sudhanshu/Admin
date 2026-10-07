import { LoadingState } from '../../../components/feedback/LoadingState';
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetWorkspaceByIdQuery } from '../../../store/api';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { ArrowLeft, Grid, Search } from 'lucide-react';

export default function WorkspaceBranches() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: workspace, isLoading } = useGetWorkspaceByIdQuery(id!, { skip: !id });

  if (isLoading) {
    return (
      <LoadingState label="Loading branch profiles..." />
    );
  }

  if (!workspace) {
    return (
      <div style={{ padding: '2rem', background: '#fee2e2', color: '#991b1b', borderRadius: '8px' }}>
        Workspace not found.
      </div>
    );
  }

  const branchesList = workspace.branches || [];
  const filteredBranches = branchesList.filter((b: any) => 
    b.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.address?.toLowerCase().includes(searchQuery.toLowerCase())
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
              background: 'rgba(245, 158, 11, 0.08)',
              color: '#f59e0b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Grid size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>Registered Library Branches</h2>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Workspace: {workspace.name}</p>
            </div>
          </div>
          <div style={{ width: '300px' }}>
            <Input
              placeholder="Search branch name or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Branches Table */}
        {filteredBranches.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
                <th style={{ padding: '12px' }}>Branch Name</th>
                <th style={{ padding: '12px' }}>Branch Address</th>
                <th style={{ padding: '12px' }}>Registration Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredBranches.map((b: any) => (
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
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem', textAlign: 'center', padding: '24px 0' }}>
            No branches match your search parameters.
          </p>
        )}

      </div>

    </div>
  );
}
