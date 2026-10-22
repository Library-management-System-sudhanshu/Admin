import { LoadingState } from '../../../components/feedback/LoadingState';
import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  useGetWorkspaceByIdQuery, 
  useGetStudentsQuery,
  useGetBranchesQuery,
  useClearStudentDuesMutation,
  useDeleteStudentMutation
} from '../../../store/api';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Modal } from '../../../components/ui/Modal';
import { useToast } from '../../../components/ui/ToastContext';
import { EditStudentModal } from './EditStudentModal';
import { 
  ArrowLeft, 
  Users, 
  Search, 
  Edit3, 
  Trash2, 
  CreditCard, 
  Building2, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  XCircle, 
  RefreshCw,
  Phone,
  Mail,
  Calendar,
  X,
  IndianRupee,
  ShieldCheck,
  UserCheck
} from 'lucide-react';

export default function WorkspaceStudents() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();

  // Queries
  const { data: workspace, isLoading: isWorkspaceLoading, refetch: refetchWorkspace } = useGetWorkspaceByIdQuery(id!, { skip: !id });
  const { data: studentsData, isLoading: isStudentsLoading, refetch: refetchStudents } = useGetStudentsQuery({ workspaceId: id, limit: 100 }, { skip: !id });
  const { data: branchesData } = useGetBranchesQuery(id!, { skip: !id });

  // Mutations
  const [clearDues, { isLoading: isClearingDues }] = useClearStudentDuesMutation();
  const [deleteStudent, { isLoading: isDeletingStudent }] = useDeleteStudentMutation();

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [duesFilter, setDuesFilter] = useState('ALL');

  // Modals state
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [duesStudent, setDuesStudent] = useState<any>(null);
  const [duesAmountToClear, setDuesAmountToClear] = useState<string>('');
  const [duesMethod, setDuesMethod] = useState<'CASH' | 'UPI'>('CASH');

  const [deletingStudent, setDeletingStudent] = useState<any>(null);

  // Normalize Students list
  const studentsList: any[] = useMemo(() => {
    if (!studentsData) return [];
    if (Array.isArray(studentsData)) return studentsData;
    if (Array.isArray(studentsData.students)) return studentsData.students;
    if (Array.isArray(studentsData.data)) return studentsData.data;
    return [];
  }, [studentsData]);

  // Normalize Branches
  const branches = useMemo(() => {
    if (branchesData?.branches && Array.isArray(branchesData.branches)) return branchesData.branches;
    if (Array.isArray(branchesData)) return branchesData;
    if (workspace?.branches && Array.isArray(workspace.branches)) return workspace.branches;
    return [];
  }, [branchesData, workspace]);

  // Check for auto-open query param (?editStudentId=...)
  useEffect(() => {
    const editId = searchParams.get('editStudentId');
    if (editId && studentsList.length > 0) {
      const match = studentsList.find((s: any) => s.id === editId);
      if (match) {
        setEditingStudent(match);
        setIsEditModalOpen(true);
      }
    }
  }, [searchParams, studentsList]);

  // Filtered students list
  const filteredStudents = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return studentsList.filter((s: any) => {
      const name = (s.displayName || s.user?.name || s.name || '').toLowerCase();
      const mobile = (s.contactMobile || s.user?.mobile || s.mobile || '');
      const email = (s.contactEmail || s.user?.email || s.email || '').toLowerCase();
      const guardian = (s.guardianName || '').toLowerCase();
      const aadhar = (s.aadharNumber || '');

      // Search match
      const matchesSearch = !query || 
        name.includes(query) || 
        mobile.includes(query) || 
        email.includes(query) || 
        guardian.includes(query) ||
        aadhar.includes(query);

      // Status match
      const studentStatus = (s.status || 'APPROVED').toUpperCase();
      const matchesStatus = statusFilter === 'ALL' || studentStatus === statusFilter;

      // Branch match
      const studentBranch = s.branchId || s.branch?.id || '';
      const matchesBranch = branchFilter === 'ALL' || studentBranch === branchFilter;

      // Dues match
      const due = Number(s.dueAmount) || 0;
      const matchesDues = 
        duesFilter === 'ALL' || 
        (duesFilter === 'HAS_DUES' && due > 0) || 
        (duesFilter === 'NO_DUES' && due === 0);

      return matchesSearch && matchesStatus && matchesBranch && matchesDues;
    });
  }, [studentsList, searchQuery, statusFilter, branchFilter, duesFilter]);

  // KPI Calculations
  const metrics = useMemo(() => {
    let approved = 0;
    let pending = 0;
    let waitlisted = 0;
    let totalDues = 0;

    studentsList.forEach((s: any) => {
      const st = (s.status || 'APPROVED').toUpperCase();
      if (st === 'APPROVED') approved++;
      else if (st === 'PENDING') pending++;
      else if (st === 'WAITLISTED') waitlisted++;

      totalDues += Number(s.dueAmount) || 0;
    });

    return {
      total: studentsList.length,
      approved,
      pending,
      waitlisted,
      totalDues
    };
  }, [studentsList]);

  // Handle Edit Action
  const handleOpenEdit = (student: any) => {
    setEditingStudent(student);
    setIsEditModalOpen(true);
  };

  const handleCloseEdit = () => {
    setIsEditModalOpen(false);
    setEditingStudent(null);
    if (searchParams.has('editStudentId')) {
      searchParams.delete('editStudentId');
      setSearchParams(searchParams);
    }
  };

  // Handle Clear Dues Action
  const handleOpenClearDues = (student: any) => {
    setDuesStudent(student);
    setDuesAmountToClear(String(student.dueAmount || 0));
    setDuesMethod('CASH');
  };

  const handleConfirmClearDues = async () => {
    if (!duesStudent) return;
    const amount = Number(duesAmountToClear);
    if (isNaN(amount) || amount <= 0) {
      showToast('Please enter a valid amount greater than 0', 'error');
      return;
    }
    if (amount > Number(duesStudent.dueAmount || 0)) {
      showToast('Amount exceeds the outstanding due balance', 'error');
      return;
    }

    try {
      await clearDues({
        id: duesStudent.id,
        amount,
        method: duesMethod
      }).unwrap();
      showToast(`Successfully cleared ₹${amount} dues for ${duesStudent.displayName || duesStudent.user?.name}!`, 'success');
      setDuesStudent(null);
      refetchStudents();
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || 'Failed to clear dues';
      showToast(msg, 'error');
    }
  };

  // Handle Delete Action
  const handleConfirmDelete = async () => {
    if (!deletingStudent) return;
    try {
      await deleteStudent(deletingStudent.id).unwrap();
      showToast(`Student ${deletingStudent.displayName || deletingStudent.user?.name} deleted successfully`, 'success');
      setDeletingStudent(null);
      refetchStudents();
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || 'Failed to delete student';
      showToast(msg, 'error');
    }
  };

  if (isWorkspaceLoading || isStudentsLoading) {
    return <LoadingState label="Loading registered students list..." />;
  }

  if (!workspace) {
    return (
      <div style={{ padding: '2rem', background: '#fee2e2', color: '#991b1b', borderRadius: '12px' }}>
        Workspace not found.
      </div>
    );
  }

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '24px', 
      maxWidth: '1440px', 
      margin: '0 auto', 
      width: '100%',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      color: '#0f172a'
    }}>
      
      {/* Top Header & Back Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <Button 
          variant="outline" 
          onClick={() => navigate(`/super-admin/workspaces/${id}`)}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            borderRadius: '10px',
            fontSize: '0.85rem',
            fontWeight: 500
          }}
        >
          <ArrowLeft size={16} /> Back to {workspace.name} Details
        </Button>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => { refetchStudents(); refetchWorkspace(); }}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              borderRadius: '8px',
              fontSize: '0.8125rem',
              fontWeight: 500
            }}
          >
            <RefreshCw size={14} /> Refresh List
          </Button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        
        {/* Total Students */}
        <div style={{
          background: '#ffffff',
          borderRadius: '14px',
          padding: '18px 20px',
          border: '1px solid rgba(15, 23, 42, 0.06)',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
          display: 'flex',
          alignItems: 'center',
          gap: '14px'
        }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'rgba(59, 130, 246, 0.08)',
            color: '#2563eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Users size={20} />
          </div>
          <div>
            <div style={{ 
              fontSize: '0.75rem', 
              color: '#64748b', 
              fontWeight: 600, 
              textTransform: 'uppercase', 
              letterSpacing: '0.04em' 
            }}>
              Total Students
            </div>
            <div style={{ 
              fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
              fontSize: '1.5rem', 
              fontWeight: 600, 
              color: '#0f172a',
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
              marginTop: '2px',
              fontVariantNumeric: 'tabular-nums'
            }}>
              {metrics.total}
            </div>
          </div>
        </div>

        {/* Approved Active */}
        <div style={{
          background: '#ffffff',
          borderRadius: '14px',
          padding: '18px 20px',
          border: '1px solid rgba(15, 23, 42, 0.06)',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
          display: 'flex',
          alignItems: 'center',
          gap: '14px'
        }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'rgba(16, 185, 129, 0.08)',
            color: '#10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div style={{ 
              fontSize: '0.75rem', 
              color: '#64748b', 
              fontWeight: 600, 
              textTransform: 'uppercase', 
              letterSpacing: '0.04em' 
            }}>
              Approved & Active
            </div>
            <div style={{ 
              fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
              fontSize: '1.5rem', 
              fontWeight: 600, 
              color: '#0f172a',
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
              marginTop: '2px',
              fontVariantNumeric: 'tabular-nums'
            }}>
              {metrics.approved}
            </div>
          </div>
        </div>

        {/* Pending / Waitlist */}
        <div style={{
          background: '#ffffff',
          borderRadius: '14px',
          padding: '18px 20px',
          border: '1px solid rgba(15, 23, 42, 0.06)',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
          display: 'flex',
          alignItems: 'center',
          gap: '14px'
        }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'rgba(245, 158, 11, 0.08)',
            color: '#f59e0b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Clock size={20} />
          </div>
          <div>
            <div style={{ 
              fontSize: '0.75rem', 
              color: '#64748b', 
              fontWeight: 600, 
              textTransform: 'uppercase', 
              letterSpacing: '0.04em' 
            }}>
              Pending / Waitlist
            </div>
            <div style={{ 
              fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
              fontSize: '1.5rem', 
              fontWeight: 600, 
              color: '#0f172a',
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
              marginTop: '2px',
              fontVariantNumeric: 'tabular-nums'
            }}>
              {metrics.pending + metrics.waitlisted}
            </div>
          </div>
        </div>

        {/* Total Outstanding Dues */}
        <div style={{
          background: '#ffffff',
          borderRadius: '14px',
          padding: '18px 20px',
          border: '1px solid rgba(15, 23, 42, 0.06)',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
          display: 'flex',
          alignItems: 'center',
          gap: '14px'
        }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: metrics.totalDues > 0 ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)',
            color: metrics.totalDues > 0 ? '#ef4444' : '#10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <CreditCard size={20} />
          </div>
          <div>
            <div style={{ 
              fontSize: '0.75rem', 
              color: '#64748b', 
              fontWeight: 600, 
              textTransform: 'uppercase', 
              letterSpacing: '0.04em' 
            }}>
              Outstanding Dues
            </div>
            <div style={{ 
              fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
              fontSize: '1.5rem', 
              fontWeight: 600, 
              color: metrics.totalDues > 0 ? '#ef4444' : '#10b981',
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
              marginTop: '2px',
              fontVariantNumeric: 'tabular-nums'
            }}>
              ₹{metrics.totalDues.toLocaleString('en-IN')}
            </div>
          </div>
        </div>

      </div>

      {/* Main Container Card */}
      <div style={{
        background: '#ffffff',
        border: '1px solid rgba(15, 23, 42, 0.06)',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        
        {/* Title Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          borderBottom: '1px solid #f1f5f9',
          paddingBottom: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(59, 130, 246, 0.25)'
            }}>
              <Users size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ 
                  margin: 0, 
                  fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                  fontSize: '1.25rem', 
                  fontWeight: 600, 
                  color: '#0f172a',
                  letterSpacing: '-0.02em'
                }}>
                  Registered Students list
                </h2>
                <span style={{
                  background: 'rgba(59, 130, 246, 0.08)',
                  color: '#2563eb',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: '12px'
                }}>
                  {filteredStudents.length} of {studentsList.length}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: '#64748b', fontWeight: 400 }}>
                Workspace: <span style={{ color: '#334155', fontWeight: 500 }}>{workspace.name}</span> • Super Admin Full Edit Control & Validation
              </p>
            </div>
          </div>
        </div>

        {/* Filters Toolbar */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          background: '#f8fafc',
          padding: '14px',
          borderRadius: '12px',
          border: '1px solid #f1f5f9'
        }}>
          {/* Search Box */}
          <div style={{ gridColumn: 'span 1' }}>
            <Input
              placeholder="Search by name, mobile, email, Aadhar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ fontSize: '0.875rem' }}
            />
          </div>

          {/* Status Filter */}
          <div>
            <Select
              value={statusFilter}
              options={[
                { value: 'ALL', label: 'All Statuses' },
                { value: 'APPROVED', label: 'Approved / Active' },
                { value: 'PENDING', label: 'Pending Review' },
                { value: 'WAITLISTED', label: 'Waitlisted' },
                { value: 'REJECTED', label: 'Rejected' },
              ]}
              onChange={(val) => setStatusFilter(val)}
            />
          </div>

          {/* Branch Filter */}
          <div>
            <Select
              value={branchFilter}
              options={[
                { value: 'ALL', label: 'All Branches' },
                ...branches.map((b: any) => ({ value: b.id, label: b.name })),
              ]}
              onChange={(val) => setBranchFilter(val)}
            />
          </div>

          {/* Dues Filter */}
          <div>
            <Select
              value={duesFilter}
              options={[
                { value: 'ALL', label: 'All Due Statuses' },
                { value: 'HAS_DUES', label: 'Has Due Balance (> ₹0)' },
                { value: 'NO_DUES', label: 'Cleared Dues (₹0)' },
              ]}
              onChange={(val) => setDuesFilter(val)}
            />
          </div>
        </div>

        {/* Students Table */}
        {filteredStudents.length > 0 ? (
          <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left', background: '#f8fafc' }}>
                  <th style={{ padding: '12px 16px', fontSize: '0.725rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Student Profile</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.725rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contact Numbers</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.725rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Branch & ID</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.725rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.725rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Joined Date</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.725rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Due Balance</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.725rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((stud: any) => {
                  const name = stud.displayName || stud.user?.name || stud.name || 'Unnamed Student';
                  const email = stud.contactEmail || stud.user?.email || stud.email || 'No email';
                  const mobile = stud.contactMobile || stud.user?.mobile || stud.mobile || 'N/A';
                  const status = (stud.status || 'APPROVED').toUpperCase();
                  const due = Number(stud.dueAmount) || 0;
                  const branchName = stud.branch?.name || branches.find((b: any) => b.id === stud.branchId)?.name || 'Main Library';

                  // Status badge colors
                  let statusBg = 'rgba(16, 185, 129, 0.08)';
                  let statusColor = '#059669';
                  if (status === 'PENDING') {
                    statusBg = 'rgba(245, 158, 11, 0.08)';
                    statusColor = '#d97706';
                  } else if (status === 'WAITLISTED') {
                    statusBg = 'rgba(59, 130, 246, 0.08)';
                    statusColor = '#2563eb';
                  } else if (status === 'REJECTED') {
                    statusBg = 'rgba(239, 68, 68, 0.08)';
                    statusColor = '#dc2626';
                  }

                  return (
                    <tr 
                      key={stud.id} 
                      style={{ 
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      {/* Student Profile Info */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '8px',
                            background: 'linear-gradient(135deg, #4f46e5 0%, #2563eb 100%)',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 600,
                            fontSize: '0.8rem',
                            flexShrink: 0
                          }}>
                            {name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#0f172a', letterSpacing: '-0.01em' }}>
                              {name}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 400, display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Mail size={12} /> {email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact & Guardian */}
                      <td style={{ padding: '12px 16px', color: '#334155' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 500, fontSize: '0.8125rem' }}>
                          <Phone size={13} style={{ color: '#64748b' }} /> {mobile}
                        </div>
                        {stud.guardianName && (
                          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px', fontWeight: 400 }}>
                            Parent: {stud.guardianName} {stud.guardianMobile && `(${stud.guardianMobile})`}
                          </div>
                        )}
                      </td>

                      {/* Branch & Aadhar */}
                      <td style={{ padding: '12px 16px', color: '#475569' }}>
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '2px 8px',
                          background: '#f1f5f9',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          color: '#334155'
                        }}>
                          <Building2 size={12} /> {branchName}
                        </div>
                        {stud.aadharNumber && (
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '3px', fontWeight: 400 }}>
                            Aadhar: •••• {stud.aadharNumber.slice(-4)}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          letterSpacing: '0.01em',
                          background: statusBg,
                          color: statusColor
                        }}>
                          {status}
                        </span>
                      </td>

                      {/* Joined Date */}
                      <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.8125rem', fontWeight: 400 }}>
                        {stud.joiningDate ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar size={13} /> {new Date(stud.joiningDate).toLocaleDateString()}
                          </span>
                        ) : 'N/A'}
                      </td>

                      {/* Due Amount */}
                      <td style={{ padding: '12px 16px' }}>
                        {due > 0 ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 8px',
                            background: '#fef2f2',
                            color: '#dc2626',
                            borderRadius: '6px',
                            fontWeight: 600,
                            fontSize: '0.8125rem',
                            border: '1px solid #fee2e2',
                            fontVariantNumeric: 'tabular-nums'
                          }}>
                            ₹{due.toLocaleString('en-IN')}
                          </span>
                        ) : (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '2px 8px',
                            background: '#ecfdf5',
                            color: '#059669',
                            borderRadius: '6px',
                            fontWeight: 500,
                            fontSize: '0.75rem'
                          }}>
                            Paid (₹0)
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', alignItems: 'center' }}>
                          
                          {/* Edit Student Details Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(stud)}
                            title="Edit Student Details"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px',
                              padding: '5px 10px',
                              borderRadius: '7px',
                              border: '1px solid #bfdbfe',
                              background: '#eff6ff',
                              color: '#1d4ed8',
                              fontWeight: 500,
                              fontSize: '0.78rem',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#2563eb';
                              e.currentTarget.style.color = '#ffffff';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = '#eff6ff';
                              e.currentTarget.style.color = '#1d4ed8';
                            }}
                          >
                            <Edit3 size={13} /> Edit
                          </button>

                          {/* Clear Dues (if > 0) */}
                          {due > 0 && (
                            <button
                              type="button"
                              onClick={() => handleOpenClearDues(stud)}
                              title="Clear / Collect Dues"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '5px 9px',
                                borderRadius: '7px',
                                border: '1px solid #bbf7d0',
                                background: '#f0fdf4',
                                color: '#15803d',
                                fontWeight: 500,
                                fontSize: '0.78rem',
                                cursor: 'pointer'
                              }}
                            >
                              <CreditCard size={13} /> Clear
                            </button>
                          )}

                          {/* Delete Student */}
                          <button
                            type="button"
                            onClick={() => setDeletingStudent(stud)}
                            title="Delete Student Record"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '28px',
                              height: '28px',
                              borderRadius: '7px',
                              border: '1px solid #fecaca',
                              background: '#fff',
                              color: '#ef4444',
                              cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#fee2e2'}
                            onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
                          >
                            <Trash2 size={13} />
                          </button>

                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '48px 20px',
            color: '#64748b',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px'
          }}>
            <Users size={36} style={{ color: '#cbd5e1' }} />
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#334155' }}>
              No registered students match your current search or filters.
            </div>
            <p style={{ margin: 0, fontSize: '0.8125rem', color: '#64748b', fontWeight: 400 }}>
              Try adjusting your search query, or clear filters to see all students.
            </p>
            {(searchQuery || statusFilter !== 'ALL' || branchFilter !== 'ALL' || duesFilter !== 'ALL') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('ALL');
                  setBranchFilter('ALL');
                  setDuesFilter('ALL');
                }}
                style={{ fontSize: '0.8125rem', fontWeight: 500 }}
              >
                Reset Filters
              </Button>
            )}
          </div>
        )}

      </div>

      {/* EDIT STUDENT MODAL */}
      {editingStudent && (
        <EditStudentModal
          isOpen={isEditModalOpen}
          onClose={handleCloseEdit}
          student={editingStudent}
          branches={branches}
          workspaceName={workspace.name}
          onSuccess={() => {
            refetchStudents();
            refetchWorkspace();
          }}
        />
      )}

      {/* CLEAR DUES MODAL */}
      {duesStudent && (
        <Modal
          isOpen={!!duesStudent}
          onClose={() => setDuesStudent(null)}
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CreditCard size={18} style={{ color: '#16a34a' }} />
              <span style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif", fontWeight: 600, fontSize: '1.15rem' }}>
                Clear Student Dues
              </span>
            </div>
          }
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button variant="outline" onClick={() => setDuesStudent(null)} disabled={isClearingDues}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleConfirmClearDues} disabled={isClearingDues}>
                {isClearingDues ? 'Processing...' : 'Confirm Payment'}
              </Button>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontFamily: "'Inter', sans-serif" }}>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#475569', fontWeight: 400 }}>
              Clear outstanding dues for student <strong style={{ color: '#0f172a', fontWeight: 600 }}>{duesStudent.displayName || duesStudent.user?.name}</strong>.
            </p>

            <div style={{
              padding: '12px 16px',
              background: '#fef2f2',
              borderRadius: '8px',
              border: '1px solid #fee2e2',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '0.8125rem', color: '#991b1b', fontWeight: 500 }}>Total Current Due:</span>
              <span style={{ fontSize: '1.15rem', color: '#ef4444', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                ₹{Number(duesStudent.dueAmount || 0).toLocaleString('en-IN')}
              </span>
            </div>

            <div>
              <Input
                label="Amount to Clear (₹)"
                type="number"
                min="1"
                max={duesStudent.dueAmount}
                value={duesAmountToClear}
                onChange={(e) => setDuesAmountToClear(e.target.value)}
                helperText={`Cannot exceed outstanding balance of ₹${duesStudent.dueAmount || 0}`}
              />
            </div>

            <div>
              <Select
                label="Payment Method"
                value={duesMethod}
                options={[
                  { value: 'CASH', label: 'Cash Payment' },
                  { value: 'UPI', label: 'UPI / Direct Bank Transfer' },
                ]}
                onChange={(val) => setDuesMethod(val as any)}
              />
            </div>
          </div>
        </Modal>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingStudent && (
        <Modal
          isOpen={!!deletingStudent}
          onClose={() => setDeletingStudent(null)}
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#dc2626' }}>
              <Trash2 size={18} />
              <span style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif", fontWeight: 600, fontSize: '1.15rem' }}>
                Delete Student Record
              </span>
            </div>
          }
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button variant="outline" onClick={() => setDeletingStudent(null)} disabled={isDeletingStudent}>
                Cancel
              </Button>
              <Button 
                variant="primary" 
                onClick={handleConfirmDelete} 
                disabled={isDeletingStudent}
                style={{ background: '#dc2626', borderColor: '#dc2626' }}
              >
                {isDeletingStudent ? 'Deleting...' : 'Delete Permanently'}
              </Button>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontFamily: "'Inter', sans-serif" }}>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#334155', fontWeight: 400 }}>
              Are you sure you want to permanently delete <strong style={{ color: '#0f172a', fontWeight: 600 }}>{deletingStudent.displayName || deletingStudent.user?.name}</strong>?
            </p>
            <div style={{
              padding: '12px 14px',
              background: '#fef2f2',
              borderRadius: '8px',
              border: '1px solid #fecaca',
              fontSize: '0.8125rem',
              color: '#991b1b',
              lineHeight: 1.5,
              fontWeight: 400
            }}>
              <strong style={{ fontWeight: 600 }}>Warning:</strong> This will revoke active seat allocations, subscriptions, and student access for this workspace. This action cannot be undone.
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
}
