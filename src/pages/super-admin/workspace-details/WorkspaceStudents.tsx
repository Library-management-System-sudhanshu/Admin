import { LoadingState } from '../../../components/feedback/LoadingState';
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetWorkspaceByIdQuery, useGetStudentsQuery } from '../../../store/api';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { ArrowLeft, Users, Search } from 'lucide-react';

export default function WorkspaceStudents() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: workspace, isLoading: isWorkspaceLoading } = useGetWorkspaceByIdQuery(id!, { skip: !id });
  const { data: students = [], isLoading: isStudentsLoading } = useGetStudentsQuery({ workspaceId: id }, { skip: !id });

  if (isWorkspaceLoading || isStudentsLoading) {
    return (
      <LoadingState label="Loading student records..." />
    );
  }

  if (!workspace) {
    return (
      <div style={{ padding: '2rem', background: '#fee2e2', color: '#991b1b', borderRadius: '8px' }}>
        Workspace not found.
      </div>
    );
  }

  const filteredStudents = students.filter((s: any) => 
    s.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.user?.mobile?.includes(searchQuery) ||
    s.user?.email?.toLowerCase().includes(searchQuery.toLowerCase())
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

      {/* Main content table card */}
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
        
        {/* Title and Search Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              background: 'rgba(59, 130, 246, 0.08)',
              color: '#3b82f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Users size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>Registered Students list</h2>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Workspace: {workspace.name}</p>
            </div>
          </div>
          <div style={{ width: '300px' }}>
            <Input
              placeholder="Search by student name or mobile..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Students Table */}
        {filteredStudents.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
                <th style={{ padding: '12px' }}>Student</th>
                <th style={{ padding: '12px' }}>Mobile Number</th>
                <th style={{ padding: '12px' }}>Guardian Contact</th>
                <th style={{ padding: '12px' }}>Joined Date</th>
                <th style={{ padding: '12px' }}>Due balance</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((stud: any) => (
                <tr key={stud.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px', fontWeight: 600, color: '#1e293b' }}>
                    {stud.user?.name}
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 400 }}>{stud.user?.email || 'No email'}</div>
                  </td>
                  <td style={{ padding: '12px', color: '#475569' }}>{stud.user?.mobile}</td>
                  <td style={{ padding: '12px', color: '#475569' }}>
                    {stud.guardianName ? `${stud.guardianName} (${stud.guardianMobile})` : 'N/A'}
                  </td>
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
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem', textAlign: 'center', padding: '24px 0' }}>
            No registered students match your search.
          </p>
        )}

      </div>

    </div>
  );
}
