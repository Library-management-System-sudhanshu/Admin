import { LoadingState } from '../../../components/feedback/LoadingState';
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetWorkspaceByIdQuery } from '../../../store/api';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { ArrowLeft, Building2, Search } from 'lucide-react';

export default function WorkspaceRooms() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: workspace, isLoading } = useGetWorkspaceByIdQuery(id!, { skip: !id });

  if (isLoading) {
    return (
      <LoadingState label="Loading classrooms..." />
    );
  }

  if (!workspace) {
    return (
      <div style={{ padding: '2rem', background: '#fee2e2', color: '#991b1b', borderRadius: '8px' }}>
        Workspace not found.
      </div>
    );
  }

  const roomsList = workspace.rooms || [];
  const filteredRooms = roomsList.filter((r: any) => 
    r.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.floor?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.floor?.branch?.name?.toLowerCase().includes(searchQuery.toLowerCase())
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

      {/* Main Content card */}
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
              background: 'rgba(16, 185, 129, 0.08)',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Building2 size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>Classrooms & Rooms list</h2>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Workspace: {workspace.name}</p>
            </div>
          </div>
          <div style={{ width: '300px' }}>
            <Input
              placeholder="Search classrooms or floors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Rooms Table */}
        {filteredRooms.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
                <th style={{ padding: '12px' }}>Room Name</th>
                <th style={{ padding: '12px' }}>Branch Location</th>
                <th style={{ padding: '12px' }}>Floor Name</th>
                <th style={{ padding: '12px' }}>Desk Capacity (Seats)</th>
              </tr>
            </thead>
            <tbody>
              {filteredRooms.map((room: any) => (
                <tr key={room.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px', fontWeight: 600, color: '#1e293b' }}>{room.name}</td>
                  <td style={{ padding: '12px', color: '#475569' }}>{room.floor?.branch?.name || 'Main Branch'}</td>
                  <td style={{ padding: '12px', color: '#475569' }}>{room.floor?.name || '1st Floor'}</td>
                  <td style={{ padding: '12px', fontWeight: 600, color: '#2563eb' }}>{room.seats?.length || 0} seats</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem', textAlign: 'center', padding: '24px 0' }}>
            No classrooms match your search parameters.
          </p>
        )}

      </div>

    </div>
  );
}
