import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import {
  useGetStudentsQuery,
  useGetStudentByIdQuery,
  useCreateStudentMutation,
  useUpdateStudentMutation,
  useUpdateStudentStatusMutation,
  useDeleteStudentMutation,
  useGetBranchesQuery,
  useGetShiftsQuery,
  useVacateSeatMutation,
  useAllocateSeatMutation,
  useCreatePaymentMutation,
  useClearStudentDuesMutation,
  useUploadImageMutation,
} from '../store/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Select } from '../components/ui/Select';
import { useToast } from '../components/ui/ToastContext';
import { useAlert } from '../components/ui/AlertContext';
import '../components/ui/Globals.css';
import {
  Plus,
  Check,
  X,
  Trash2,
  IdCard,
  Loader2,
  Edit2,
  Mail,
  Phone,
  Clock,
  History,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Camera
} from 'lucide-react';

const compressImage = (base64Str: string, maxWidth = 800, maxHeight = 800): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
  });
};

export default function Students() {
  const { showToast } = useToast();
  const { showAlert } = useAlert();
  const { user } = useSelector((state: RootState) => state.auth);
  const location = useLocation();
  const navigate = useNavigate();

  const { data: branches } = useGetBranchesQuery(user?.workspaceId, { skip: !user?.workspaceId });
  const { data: shifts } = useGetShiftsQuery(user?.workspaceId, { skip: !user?.workspaceId });

  const getDaysRemainingText = (endDateStr: string) => {
    if (!endDateStr) return 'No end date';
    const end = new Date(endDateStr);
    const today = new Date();
    end.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'Expired';
    if (diffDays === 0) return 'Ends today';
    return `${diffDays} days remaining`;
  };

  const [search, setSearch] = useState('');
  const [branchId, setBranchId] = useState('');
  const [page, setPage] = useState(1);
  const [filterShiftId, setFilterShiftId] = useState('');
  const [filterExpiration, setFilterExpiration] = useState(() => {
    return (location.state as any)?.filterExpiration || '';
  });

  // Reset page to 1 when filters or search change
  useEffect(() => {
    setPage(1);
  }, [search, branchId, filterShiftId, filterExpiration]);

  React.useEffect(() => {
    if (location.state && (location.state as any).filterExpiration !== undefined) {
      setFilterExpiration((location.state as any).filterExpiration);
    }
  }, [location.state]);


  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [openCard, setOpenCard] = useState(false);

  const [openEdit, setOpenEdit] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);

  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  React.useEffect(() => {
    if (location.state && (location.state as any).selectedStudentId) {
      setSelectedStudentId((location.state as any).selectedStudentId);
      setIsDrawerOpen(true);
      // Clean up router state so the drawer doesn't reopen unexpectedly
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Drawer tab and form states
  const [drawerActiveSection, setDrawerActiveSection] = useState<'DETAILS' | 'TRANSFER' | 'RENEW'>('DETAILS');



  // Renew states
  const [renewShiftId, setRenewShiftId] = useState('');
  const [renewStartDate, setRenewStartDate] = useState('');
  const [renewEndDate, setRenewEndDate] = useState('');
  const [renewPaymentMethod, setRenewPaymentMethod] = useState<'UPI' | 'CASH' | 'RAZORPAY'>('UPI');
  const [renewAmount, setRenewAmount] = useState('');
  const [renewDuration, setRenewDuration] = useState<number>(1);
  const [isRenewing, setIsRenewing] = useState(false);



  // Edit Form Fields
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editMobile, setEditMobile] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editGuardianName, setEditGuardianName] = useState('');
  const [editGuardianMobile, setEditGuardianMobile] = useState('');
  const [editAadharNumber, setEditAadharNumber] = useState('');
  const [editBranchId, setEditBranchId] = useState('');
  const [editJoiningDate, setEditJoiningDate] = useState('');
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  const { data, isLoading } = useGetStudentsQuery({
    search,
    branchId: branchId || undefined,
    filterShiftId: filterShiftId || undefined,
    filterExpiration: filterExpiration || undefined,
    page,
    limit: 10,
  });

  const { data: fullStudent, isLoading: isStudentLoading } = useGetStudentByIdQuery(
    selectedStudentId || '',
    { skip: !selectedStudentId }
  );

  const filteredStudents = React.useMemo(() => {
    return data?.students || [];
  }, [data?.students]);

  const [_createStudent] = useCreateStudentMutation();
  const [updateStudent, { isLoading: isUpdating }] = useUpdateStudentMutation();
  const [updateStatus] = useUpdateStudentStatusMutation();
  const [uploadImage, { isLoading: isUploadingImage }] = useUploadImageMutation();

  const handleStudentAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const rawBase64 = reader.result as string;
      try {
        const compressedBase64 = await compressImage(rawBase64);
        const uploadResult = await uploadImage({ base64: compressedBase64 }).unwrap();
        
        await updateStudent({
          id: fullStudent.id,
          avatar: uploadResult.url
        }).unwrap();
        
        showToast('Profile photo updated successfully!', 'success');
      } catch (err: any) {
        showToast(err?.data?.message || 'Failed to update student photo.', 'error');
      }
    };
    reader.readAsDataURL(file);
  };
  const [deleteStudent] = useDeleteStudentMutation();

  const [vacateSeat, { isLoading: isVacating }] = useVacateSeatMutation();
  const [allocateSeat] = useAllocateSeatMutation();
  const [createPayment] = useCreatePaymentMutation();
  const [clearStudentDues] = useClearStudentDuesMutation();

  const [clearDuesAmount, setClearDuesAmount] = useState('');
  const [clearDuesMethod, setClearDuesMethod] = useState<'UPI' | 'CASH' | 'RAZORPAY'>('UPI');
  const [isClearingDues, setIsClearingDues] = useState(false);

  const handleClearDues = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullStudent) return;
    setIsClearingDues(true);
    try {
      await clearStudentDues({
        id: fullStudent.id,
        amount: Number(clearDuesAmount),
        method: clearDuesMethod,
      }).unwrap();
      showToast('Dues cleared successfully!', 'success');
      setClearDuesAmount('');
    } catch (err: any) {
      showToast(err?.data?.message || 'Failed to clear dues', 'error');
    } finally {
      setIsClearingDues(false);
    }
  };



  const handleOpenEdit = (student: any) => {
    setEditingStudent(student);
    setEditName(student.user?.name || '');
    setEditEmail(student.user?.email || '');
    setEditMobile(student.user?.mobile || '');
    setEditPassword(student.user?.rawPassword || 'Student@123');
    setEditGuardianName(student.guardianName || '');
    setEditGuardianMobile(student.guardianMobile || '');
    setEditAadharNumber(student.aadharNumber || '');
    setEditBranchId(student.branchId || '');
    setEditJoiningDate(student.joiningDate ? new Date(student.joiningDate).toISOString().split('T')[0] : '');
    setEditErrors({});
    setOpenEdit(true);
  };

  const handleEditStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!editName.trim()) newErrors.name = 'Name is required';
    if (!editEmail.trim()) newErrors.email = 'Email is required';
    if (!editMobile.trim()) newErrors.mobile = 'Mobile is required';
    if (editPassword && editPassword.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (Object.keys(newErrors).length > 0) {
      setEditErrors(newErrors);
      return;
    }

    try {
      await updateStudent({
        id: editingStudent.id,
        name: editName,
        email: editEmail,
        mobile: editMobile,
        password: editPassword || undefined,
        guardianName: editGuardianName,
        guardianMobile: editGuardianMobile,
        aadharNumber: editAadharNumber,
        branchId: editBranchId,
        joiningDate: editJoiningDate,
      }).unwrap();
      setOpenEdit(false);
      setEditingStudent(null);
      setEditPassword('');
    } catch (err) {
      alert('Error updating student');
    }
  };


  // 1. useEffect to automatically calculate renewEndDate and renewAmount when renewShiftId or renewStartDate or renewDuration changes
  useEffect(() => {
    if (renewShiftId && shifts) {
      const shift = shifts.find((s: any) => s.id === renewShiftId);
      if (shift && renewStartDate) {
        const start = new Date(renewStartDate);
        // Calculate end date based on renewDuration
        start.setMonth(start.getMonth() + renewDuration);
        try {
          setRenewEndDate(start.toISOString().split('T')[0]);
          
          let price = shift.price || 0;
          if (renewDuration === 3 && shift.price3Months) {
            price = shift.price3Months;
          } else if (renewDuration === 6 && shift.price6Months) {
            price = shift.price6Months;
          } else {
            price = price * renewDuration;
          }
          setRenewAmount(price.toString());
        } catch (e) {
          // ignore
        }
      }
    }
  }, [renewShiftId, renewStartDate, renewDuration, shifts]);

  // 2. useEffect to prefill renew dates and shift when RENEW tab is selected
  useEffect(() => {
    if (drawerActiveSection === 'RENEW' && fullStudent) {
      const activeAllocation = fullStudent.allocations?.find((a: any) => a.isActive);
      if (activeAllocation) {
        // Start date is day after current subscription end date
        const nextDay = new Date(activeAllocation.endDate);
        nextDay.setDate(nextDay.getDate() + 1);
        try {
          setRenewStartDate(nextDay.toISOString().split('T')[0]);
        } catch (e) {
          setRenewStartDate(new Date().toISOString().split('T')[0]);
        }
        setRenewShiftId(activeAllocation.shiftId || '');
      } else {
        setRenewStartDate(new Date().toISOString().split('T')[0]);
      }

      setRenewEndDate('');
      setRenewAmount('');
      setRenewDuration(1);
      setRenewPaymentMethod('UPI');
    }
  }, [drawerActiveSection, fullStudent]);

  // 3. Submit vacate seat
  const handleVacateSeat = async (seatId: string) => {
    const confirmVacate = window.confirm("Are you sure you want to vacate this seat?");
    if (!confirmVacate) return;
    try {
      await vacateSeat({ id: seatId, studentProfileId: fullStudent?.profile?.id }).unwrap();
      showToast('Seat vacated successfully!', 'success');
    } catch (err: any) {
      showToast(err.data?.message || 'Failed to vacate seat', 'error');
    }
  };



  // 5. Submit Renewal
  const handleRenewSeat = async (e: React.FormEvent, activeAllocation: any) => {
    e.preventDefault();
    if (!activeAllocation || !activeAllocation.seatId) return;

    setIsRenewing(true);
    try {
      // 1. Vacate the current seat allocation
      await vacateSeat(activeAllocation.seatId).unwrap();
      
      // 2. Re-allocate with new shift and dates
      await allocateSeat({
        studentProfileId: activeAllocation.studentProfileId,
        seatId: activeAllocation.seatId,
        shiftId: renewShiftId,
        startDate: renewStartDate,
        endDate: renewEndDate,
      }).unwrap();

      // 3. Create payment invoice record
      await createPayment({
        studentProfileId: activeAllocation.studentProfileId,
        amount: Number(renewAmount),
        method: renewPaymentMethod,
        shiftId: renewShiftId || undefined,
        durationMonths: renewDuration,
      }).unwrap();

      setDrawerActiveSection('DETAILS');
      showToast('Seat renewed successfully!', 'success');
    } catch (err: any) {
      showToast(err?.data?.message || 'Seat renewal failed', 'error');
    } finally {
      setIsRenewing(false);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    await updateStatus({ id, status });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      await deleteStudent(id);
    }
  };

  return (
    <div style={{ width: '100%' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .student-hover-card-trigger {
          position: relative;
        }

        .student-hover-details-card {
          opacity: 0;
          visibility: hidden;
          position: absolute;
          top: -20px;
          left: 105%;
          width: 280px;
          background: #ffffff;
          border: 1px solid rgba(15, 23, 42, 0.08);
          border-radius: 12px;
          box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.1);
          padding: 14px;
          z-index: 999;
          text-align: left;
          white-space: normal;
          pointer-events: none;
          transform: translateX(10px);
          transition: opacity 150ms ease, transform 150ms ease, visibility 150ms;
        }

        .student-hover-card-trigger:hover .student-hover-details-card {
          opacity: 1;
          visibility: visible;
          transform: translateX(0);
        }
      `}} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>
          Student Records
        </h1>
        <Button 
          variant="primary" 
          onClick={() => navigate('/new-admission')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Plus size={18} /> New Admission
        </Button>
      </div>

      {/* Filters Toolbar */}
      <Card
        elevation="sm"
        style={{
          padding: '0.75rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'nowrap',
          overflow: 'visible',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: '0.75rem',
        }}
      >
        <div style={{ width: '240px', flexShrink: 0 }}>
          <Input
            placeholder="Search by Name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="no-margin"
          />
        </div>
        <div style={{ width: '180px', flexShrink: 0 }}>
          <Select
            value={branchId}
            onChange={(val) => setBranchId(val)}
            placeholder="All Branches"
            options={[
              { value: '', label: 'All Branches' },
              ...(branches?.map((b: any) => ({
                value: b.id,
                label: b.name,
              })) || [])
            ]}
          />
        </div>
        <div style={{ width: '180px', flexShrink: 0 }}>
          <Select
            value={filterShiftId}
            onChange={(val) => setFilterShiftId(val)}
            placeholder="All Shifts"
            options={[
              { value: '', label: 'All Shifts' },
              ...(shifts?.map((s: any) => ({
                value: s.id,
                label: `${s.name} (${s.startTime}-${s.endTime})`,
              })) || [])
            ]}
          />
        </div>
        <div style={{ width: '180px', flexShrink: 0 }}>
          <Select
            value={filterExpiration}
            onChange={(val) => setFilterExpiration(val)}
            placeholder="All Statuses"
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'ACTIVE', label: 'Active Seat' },
              { value: 'EXPIRING_SOON', label: 'Expiring Soon' },
              { value: 'EXPIRED', label: 'Expired Seat' },
              { value: 'NO_SEAT', label: 'No Seat' },
            ]}
          />
        </div>
      </Card>

      {/* Roster Table */}
      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '3rem', color: 'var(--primary)' }}>
          <Loader2 className="spinner" size={40} />
        </div>
      ) : (
        <>
          <div className="custom-table-container" style={{ overflow: 'visible' }}>
            <table className="custom-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Student</th>
                <th>Contact Info</th>
                <th style={{ whiteSpace: 'nowrap' }}>Seat & Shift</th>
                <th>Aadhar Card</th>
                <th>Admission Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
               {filteredStudents.map((student: any) => {
                 const activeAllocation = student.allocations?.find((a: any) => a.isActive);
                 const isSubscriptionExpired = activeAllocation && activeAllocation.endDate && new Date(activeAllocation.endDate).getTime() < new Date().getTime();
                 const hasSeat = !!activeAllocation;

                 const avatarBorderColor = 
                   isSubscriptionExpired ? '#ef4444' :
                   student.status === 'APPROVED' ? (hasSeat ? 'var(--success)' : '#cbd5e1') :
                   student.status === 'PENDING' ? 'var(--warning)' :
                   student.status === 'REJECTED' ? 'var(--danger)' :
                   'var(--border-color)';

                return (
                  <tr 
                    key={student.id}
                    onClick={() => {
                      setSelectedStudentId(student.id);
                      setDrawerActiveSection('DETAILS');
                      setIsDrawerOpen(true);
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <div className="student-hover-card-trigger" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div 
                          className="avatar" 
                          style={{ 
                            border: `2.5px solid ${avatarBorderColor}`, 
                            boxSizing: 'border-box',
                            background: student.user?.avatar ? `url(${student.user.avatar}) no-repeat center center / cover` : undefined,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          {!student.user?.avatar && student.user?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{student.user?.name}</div>
                          <div className="text-muted">{student.branch?.name || 'No Branch'}</div>
                        </div>

                        {/* Hover Details Card */}
                        <div className="student-hover-details-card" onClick={(e) => e.stopPropagation()}>
                          <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0F172A', borderBottom: '1px solid #F1F5F9', paddingBottom: '6px', marginBottom: '8px' }}>
                            Seat & Shift History
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.75rem' }}>
                            {student.allocations && student.allocations.length > 0 ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                                {student.allocations.map((alloc: any, idx: number) => {
                                  const isAllocExpired = alloc.endDate && new Date(alloc.endDate).getTime() < new Date().getTime();
                                  return (
                                    <div key={alloc.id || idx} style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: '6px', marginBottom: '2px' }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#0F172A' }}>
                                        <span>Seat {alloc.seat?.number || 'N/A'}</span>
                                        <span style={{ 
                                          fontSize: '0.65rem',
                                          padding: '2px 6px',
                                          borderRadius: '4px',
                                          fontWeight: 700,
                                          color: alloc.isActive ? (isAllocExpired ? '#ef4444' : '#10b981') : '#64748b',
                                          backgroundColor: alloc.isActive ? (isAllocExpired ? 'rgba(239,68,68,0.06)' : 'rgba(16,185,129,0.06)') : 'rgba(100,116,139,0.06)',
                                          border: alloc.isActive ? (isAllocExpired ? '1px solid rgba(239,68,68,0.1)' : '1px solid rgba(16,185,129,0.1)') : '1px solid rgba(100,116,139,0.1)'
                                        }}>
                                          {alloc.isActive ? (isAllocExpired ? 'Expired' : 'Active') : 'Past'}
                                        </span>
                                      </div>
                                      <div style={{ fontSize: '0.725rem', color: '#334155', fontWeight: 600, marginTop: '2px' }}>
                                        {alloc.shift?.name || 'N/A'} Shift ({alloc.shift?.startTime} - {alloc.shift?.endTime})
                                      </div>
                                      <div style={{ fontSize: '0.675rem', color: '#64748B', marginTop: '2px' }}>
                                        {new Date(alloc.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} - {new Date(alloc.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div style={{ fontStyle: 'italic', color: '#94A3B8', fontSize: '0.725rem', padding: '8px 0', textAlign: 'center' }}>
                                No active or past seat history
                              </div>
                            )}

                            {/* Secondary metadata footer */}
                            <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '8px', marginTop: '4px', fontSize: '0.675rem', color: '#64748B', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                              <div><strong>Guardian:</strong> {student.guardianName || 'N/A'} {student.guardianMobile && `(${student.guardianMobile})`}</div>
                              <div><strong>Joining Date:</strong> {student.joiningDate ? new Date(student.joiningDate).toLocaleDateString() : 'N/A'}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>{student.user?.email}</div>
                      <div className="text-muted">{student.user?.mobile}</div>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {(() => {
                        const activeAllocation = student.allocations?.find((a: any) => a.isActive);
                        if (!activeAllocation) {
                          const activeSub = student.subscriptions?.find((sub: any) => sub.status === 'ACTIVE');
                          const matchingShift = activeSub && shifts?.find((s: any) => 
                            activeSub.plan?.name?.toLowerCase().includes(s.name.toLowerCase())
                          );
                          if (matchingShift) {
                            return (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.875rem' }}>
                                <span style={{ fontWeight: 600, color: 'var(--accent-blue)' }}>
                                  No Seat Allocated
                                </span>
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontStyle: 'italic' }}>
                                  Paid: {matchingShift.name} ({matchingShift.startTime} - {matchingShift.endTime})
                                </span>
                              </div>
                            );
                          }
                          return <span className="text-muted" style={{ fontStyle: 'italic', fontSize: '0.875rem' }}>No Seat Allocated</span>;
                        }
                        
                        const end = new Date(activeAllocation.endDate);
                        const today = new Date();
                        end.setHours(0, 0, 0, 0);
                        today.setHours(0, 0, 0, 0);
                        const diffTime = end.getTime() - today.getTime();
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        
                        let statusText = '';
                        let badgeStyle: React.CSSProperties = {
                          display: 'inline-flex',
                          alignItems: 'center',
                          width: 'fit-content',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          lineHeight: 1.2,
                          marginTop: '4px',
                        };

                        if (diffDays < 0) {
                          statusText = 'Expired';
                          badgeStyle = {
                            ...badgeStyle,
                            color: 'var(--status-red)',
                            backgroundColor: 'rgba(239, 68, 68, 0.06)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                          };
                        } else if (diffDays <= 7) {
                          statusText = diffDays === 0 ? 'Expires Today' : `Expires in ${diffDays} days`;
                          badgeStyle = {
                            ...badgeStyle,
                            color: 'var(--status-gold)',
                            backgroundColor: 'rgba(217, 119, 6, 0.06)',
                            border: '1px solid rgba(217, 119, 6, 0.2)',
                          };
                        } else {
                          statusText = 'Active';
                          badgeStyle = {
                            ...badgeStyle,
                            color: 'var(--status-emerald)',
                            backgroundColor: 'rgba(16, 185, 129, 0.06)',
                            border: '1px solid rgba(16, 185, 129, 0.2)',
                          };
                        }

                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.875rem' }}>
                            <div>
                              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                Seat {activeAllocation.seat?.number || 'N/A'}
                              </span>
                              <span style={{ color: 'var(--text-secondary)', marginLeft: '0.25rem', fontSize: '0.8rem' }}>
                                ({activeAllocation.shift?.name || 'N/A'})
                              </span>
                            </div>
                            <span style={badgeStyle}>
                              {statusText}
                            </span>
                          </div>
                        );
                      })()}
                    </td>
                    <td>{student.aadharNumber || 'N/A'}</td>
                    <td>{new Date(student.joiningDate).toLocaleDateString()}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div className="action-buttons">
                      {student.status === 'PENDING' && (
                        <>
                          <button 
                            className="icon-btn success" 
                            title="Approve" 
                            onClick={() => handleStatusChange(student.id, 'APPROVED')}
                          >
                            <Check size={18} />
                          </button>
                          <button 
                            className="icon-btn danger" 
                            title="Reject" 
                            onClick={() => handleStatusChange(student.id, 'REJECTED')}
                          >
                            <X size={18} />
                          </button>
                        </>
                      )}
                      <button 
                        className="icon-btn" 
                        title="Edit Student" 
                        onClick={() => handleOpenEdit(student)}
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        className="icon-btn" 
                        title="ID Card" 
                        onClick={() => {
                          setSelectedStudent(student);
                          setOpenCard(true);
                        }}
                      >
                        <IdCard size={18} />
                      </button>
                      <button 
                        className="icon-btn danger" 
                        title="Delete" 
                        onClick={() => handleDelete(student.id)}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {data && data.total > 0 && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 24px',
            backgroundColor: '#ffffff',
            borderTop: '1px solid rgba(15, 23, 42, 0.05)',
            borderBottomLeftRadius: '16px',
            borderBottomRightRadius: '16px',
            marginTop: '-1px'
          }}>
            <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 500 }}>
              Showing <span style={{ color: '#0F172A', fontWeight: 600 }}>{((page - 1) * 10) + 1}</span> to{' '}
              <span style={{ color: '#0F172A', fontWeight: 600 }}>
                {Math.min(page * 10, data.total)}
              </span> of{' '}
              <span style={{ color: '#0F172A', fontWeight: 600 }}>{data.total}</span> students
            </span>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button
                disabled={page === 1}
                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  border: '1px solid rgba(15, 23, 42, 0.06)',
                  backgroundColor: '#ffffff',
                  color: page === 1 ? '#cbd5e1' : '#475569',
                  cursor: page === 1 ? 'not-allowed' : 'pointer',
                  transition: 'all 150ms ease',
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.02)'
                }}
              >
                <ChevronLeft size={14} />
              </button>
              
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>
                {page} / {Math.ceil(data.total / 10)}
              </span>

              <button
                disabled={page >= Math.ceil(data.total / 10)}
                onClick={() => setPage(prev => Math.min(prev + 1, Math.ceil(data.total / 10)))}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  border: '1px solid rgba(15, 23, 42, 0.06)',
                  backgroundColor: '#ffffff',
                  color: page >= Math.ceil(data.total / 10) ? '#cbd5e1' : '#475569',
                  cursor: page >= Math.ceil(data.total / 10) ? 'not-allowed' : 'pointer',
                  transition: 'all 150ms ease',
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.02)'
                }}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </>
    )}



      {/* ID Card Modal */}
      <Modal
        isOpen={openCard}
        onClose={() => setOpenCard(false)}
        title="Student ID Card"
        maxWidth="sm"
      >
        {selectedStudent && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}>
            <Card
              style={{
                width: '320px',
                border: '2px solid var(--primary)',
                borderRadius: '1rem',
                overflow: 'hidden',
                boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                backgroundColor: '#ffffff',
                color: '#0f172a'
              }}
            >
              {/* Card Header */}
              <div style={{ backgroundColor: 'var(--primary)', padding: '1rem', textAlign: 'center', color: '#ffffff' }}>
                <h3 style={{ margin: 0, fontWeight: 700, fontSize: '1.125rem' }}>{user?.workspace?.name?.toUpperCase() || 'N/A'}</h3>
                <span style={{ fontSize: '0.75rem', opacity: 0.9 }}>Digital Student Badge</span>
              </div>

              {/* Card Body */}
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: 80, height: 80, borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 600, marginBottom: '1rem' }}>
                  {selectedStudent.user?.name?.charAt(0).toUpperCase()}
                </div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.25rem 0' }}>
                  {selectedStudent.user?.name}
                </h2>
                <p style={{ margin: '0 0 1rem 0', color: '#64748b', fontSize: '0.875rem' }}>
                  ID: SF-{selectedStudent.id.substring(0, 8).toUpperCase()}
                </p>

                {/* Details list */}
                <div style={{
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  marginBottom: '1.5rem',
                  borderTop: '1px solid #f1f5f9',
                  borderBottom: '1px solid #f1f5f9',
                  padding: '1rem 0',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                    <span style={{ color: '#64748b', fontWeight: 500 }}>Mobile</span>
                    <span style={{ color: '#0f172a', fontWeight: 600 }}>{selectedStudent.user?.mobile}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                    <span style={{ color: '#64748b', fontWeight: 500 }}>Email</span>
                    <span style={{ color: '#0f172a', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '170px' }} title={selectedStudent.user?.email}>{selectedStudent.user?.email}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                    <span style={{ color: '#64748b', fontWeight: 500 }}>Branch</span>
                    <span style={{ color: '#0f172a', fontWeight: 600 }}>{selectedStudent.branch?.name || 'N/A'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                    <span style={{ color: '#64748b', fontWeight: 500 }}>Admission</span>
                    <span style={{ color: '#0f172a', fontWeight: 600 }}>{new Date(selectedStudent.joiningDate).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* QR Code */}
                {selectedStudent.qrCodeUrl && (
                  <img
                    src={selectedStudent.qrCodeUrl}
                    alt="QR Code"
                    style={{ width: 120, height: 120, border: '1px solid #e2e8f0', borderRadius: '0.5rem' }}
                  />
                )}
              </div>
            </Card>
          </div>
        )}
      </Modal>

      {/* Edit Student Modal */}
      <Modal
        isOpen={openEdit}
        onClose={() => setOpenEdit(false)}
        title="Edit Student Details"
        maxWidth="md"
      >
        <form onSubmit={handleEditStudent}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', gap: '1rem' }}>
            <Input
              label="Student Name"
              required
              value={editName}
              error={editErrors.name}
              onChange={(e) => setEditName(e.target.value)}
            />
            <Input
              label="Email Address"
              type="email"
              required
              value={editEmail}
              error={editErrors.email}
              onChange={(e) => setEditEmail(e.target.value)}
            />
            <Input
              label="Mobile Number"
              required
              value={editMobile}
              error={editErrors.mobile}
              onChange={(e) => setEditMobile(e.target.value)}
            />
            <Input
              label="New Password"
              type="password"
              value={editPassword}
              error={editErrors.password}
              placeholder="Student@123"
              onChange={(e) => setEditPassword(e.target.value)}
            />
            <div>
              <label className="custom-input-label" style={{ display: 'block', marginBottom: '0.5rem' }}>Target Branch</label>
              <Select
                value={editBranchId}
                onChange={(val) => setEditBranchId(val)}
                placeholder="Select a branch"
                options={branches?.map((b: any) => ({
                  value: b.id,
                  label: b.name,
                })) || []}
              />
            </div>
            <Input
              label="Guardian Name"
              value={editGuardianName}
              error={editErrors.guardianName}
              onChange={(e) => setEditGuardianName(e.target.value)}
            />
            <Input
              label="Guardian Mobile"
              value={editGuardianMobile}
              error={editErrors.guardianMobile}
              onChange={(e) => setEditGuardianMobile(e.target.value)}
            />
            <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Input
                label="Admission Date"
                type="date"
                required
                value={editJoiningDate}
                onChange={(e) => setEditJoiningDate(e.target.value)}
                className="no-margin"
              />
              <Input
                label="Aadhar Card Number"
                value={editAadharNumber}
                error={editErrors.aadharNumber}
                onChange={(e) => setEditAadharNumber(e.target.value)}
                className="no-margin"
              />
            </div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
            <Button type="button" variant="text" onClick={() => { setOpenEdit(false); setEditPassword(''); }}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={isUpdating}>Save Changes</Button>
          </div>
        </form>
      </Modal>

      {/* RIGHT SLIDING DRAWER PANEL */}
      <div 
        className={`drawer-backdrop ${isDrawerOpen ? 'open' : ''}`}
        onClick={() => setIsDrawerOpen(false)}
      />
      <div className={`right-drawer-panel ${isDrawerOpen ? 'open' : ''}`}>
        {/* Drawer Header */}
        <div className="drawer-header">
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-navy)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Student Profile
              {fullStudent?.status && (
                <span className={`status-pill ${fullStudent.status.toLowerCase()}`} style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 700, backgroundColor: fullStudent.status === 'APPROVED' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)', color: fullStudent.status === 'APPROVED' ? 'var(--status-emerald)' : 'var(--status-gold)' }}>
                  {fullStudent.status}
                </span>
              )}
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-slate)' }}>Detailed records and seat allocations</span>
          </div>
          <button 
            onClick={() => setIsDrawerOpen(false)}
            style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-slate)', padding: '4px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="drawer-body" style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {isStudentLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px', color: 'var(--primary)' }}>
              <Loader2 className="spinner" size={32} />
            </div>
          ) : fullStudent ? (
            <>
              {/* Profile Card */}
              <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: '#eff6ff', borderColor: 'rgba(37, 99, 235, 0.15)', borderRadius: '14px' }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div 
                    style={{ 
                      width: '48px', 
                      height: '48px', 
                      borderRadius: '50%', 
                      background: fullStudent.user?.avatar ? `url(${fullStudent.user.avatar}) no-repeat center center / cover` : 'var(--accent-blue)', 
                      color: 'white', 
                      fontWeight: 700, 
                      fontSize: '1.1rem', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      boxShadow: 'var(--shadow-soft)'
                    }}
                  >
                    {!fullStudent.user?.avatar && fullStudent.user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <label 
                    htmlFor={`student-avatar-${fullStudent.id}`}
                    style={{ 
                      position: 'absolute', 
                      bottom: -2, 
                      right: -2, 
                      backgroundColor: 'var(--accent-blue)', 
                      color: 'white', 
                      width: '18px', 
                      height: '18px', 
                      borderRadius: '50%', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      cursor: 'pointer',
                      border: '1px solid #ffffff',
                      boxShadow: 'var(--shadow-soft)'
                    }}
                  >
                    <Camera size={9} />
                  </label>
                  <input 
                    id={`student-avatar-${fullStudent.id}`}
                    type="file" 
                    accept="image/*" 
                    style={{ display: 'none' }} 
                    onChange={handleStudentAvatarUpload} 
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fullStudent.user?.name}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-slate)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}><Mail size={12} /> {fullStudent.user?.email}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-slate)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}><Phone size={12} /> {fullStudent.user?.mobile}</span>
                </div>
              </div>

              {/* Main Tab Selector at the Top */}
              {fullStudent.allocations?.some((a: any) => a.isActive) && (
                <div style={{ display: 'flex', background: '#F1F5F9', padding: '4px', borderRadius: '12px', gap: '4px' }}>
                  {['DETAILS', 'TRANSFER', 'RENEW'].map((tab: any) => {
                    const activeAllocation = fullStudent.allocations?.find((a: any) => a.isActive);
                    return (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => {
                          if (tab === 'TRANSFER') {
                            if (activeAllocation) {
                              navigate(`/transfer-seat?allocationId=${activeAllocation.id}&studentId=${fullStudent.id}`);
                            } else {
                              showAlert('No active seat allocation to transfer', { title: 'Error' });
                            }
                          } else {
                            setDrawerActiveSection(tab);
                          }
                        }}
                        style={{
                          flex: 1,
                          border: 'none',
                          padding: '8px',
                          borderRadius: '8px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          background: drawerActiveSection === tab ? '#ffffff' : 'transparent',
                          color: drawerActiveSection === tab ? 'var(--text-navy)' : 'var(--text-slate)',
                          cursor: 'pointer',
                          transition: 'all 150ms ease'
                        }}
                      >
                        {tab === 'DETAILS' ? 'Details' : tab === 'TRANSFER' ? 'Transfer' : 'Renew'}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Tab Content */}
              {drawerActiveSection === 'DETAILS' && (
                <>
                  {/* General Information */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <h5 style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-slate)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>General Information</h5>
                    <div style={{ background: '#ffffff', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-card)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {fullStudent.dueAmount > 0 && (
                        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '12px', borderRadius: '8px', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <span style={{ color: 'var(--status-red)', fontWeight: 700, fontSize: '0.85rem' }}>Outstanding Dues</span>
                            <span style={{ color: 'var(--status-red)', fontWeight: 800, fontSize: '1rem' }}>₹{fullStudent.dueAmount}</span>
                          </div>
                          <form onSubmit={handleClearDues} style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                            <div style={{ flex: 1 }}>
                              <label style={{ fontSize: '0.65rem', fontWeight: 700, color: '#991b1b', display: 'block', marginBottom: '4px' }}>Amount to Pay</label>
                              <input type="number" required value={clearDuesAmount} onChange={(e) => setClearDuesAmount(e.target.value)} max={fullStudent.dueAmount} style={{ padding: '6px', fontSize: '0.8rem', borderRadius: '6px', border: '1px solid #fca5a5', width: '100%', boxSizing: 'border-box' }} />
                            </div>
                            <div style={{ width: '100px' }}>
                              <label style={{ fontSize: '0.65rem', fontWeight: 700, color: '#991b1b', display: 'block', marginBottom: '4px' }}>Method</label>
                              <Select
                                value={clearDuesMethod}
                                onChange={(val: any) => setClearDuesMethod(val)}
                                options={[{ value: 'UPI', label: 'UPI' }, { value: 'CASH', label: 'Cash' }, { value: 'RAZORPAY', label: 'Online' }]}
                              />
                            </div>
                            <Button type="submit" variant="primary" style={{ backgroundColor: 'var(--status-red)', borderColor: 'var(--status-red)', height: '34px', padding: '0 12px', fontSize: '0.75rem' }} disabled={!clearDuesAmount || isClearingDues} isLoading={isClearingDues}>
                              Pay
                            </Button>
                          </form>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                        <span style={{ color: 'var(--text-slate)' }}>Guardian Name:</span>
                        <span style={{ fontWeight: 600, color: 'var(--text-navy)' }}>{fullStudent.guardianName || 'N/A'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                        <span style={{ color: 'var(--text-slate)' }}>Guardian Mobile:</span>
                        <span style={{ fontWeight: 600, color: 'var(--text-navy)' }}>{fullStudent.guardianMobile || 'N/A'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                        <span style={{ color: 'var(--text-slate)' }}>Aadhar Card:</span>
                        <span style={{ fontWeight: 600, color: 'var(--text-navy)' }}>{fullStudent.aadharNumber || 'N/A'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                        <span style={{ color: 'var(--text-slate)' }}>Admission Date:</span>
                        <span style={{ fontWeight: 600, color: 'var(--text-navy)' }}>{new Date(fullStudent.joiningDate).toLocaleDateString()}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                        <span style={{ color: 'var(--text-slate)' }}>Branch Location:</span>
                        <span style={{ fontWeight: 600, color: 'var(--text-navy)' }}>{fullStudent.branch?.name || 'N/A'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                        <span style={{ color: 'var(--text-slate)' }}>Login Password:</span>
                        <span style={{ fontWeight: 600, color: 'var(--text-navy)', fontFamily: 'monospace' }}>{fullStudent.user?.rawPassword || 'Student@123'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Seat Allocation Details */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <h5 style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-slate)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Seat Allocation</h5>
                    {(() => {
                      const activeAllocation = fullStudent.allocations?.find((a: any) => a.isActive);
                      if (!activeAllocation) {
                        const activeSub = fullStudent.subscriptions?.find((sub: any) => sub.status === 'ACTIVE');
                        const matchingShift = activeSub && shifts?.find((s: any) => 
                          activeSub.plan?.name?.toLowerCase().includes(s.name.toLowerCase())
                        );

                        return (
                          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px dashed var(--border-card)', textAlign: 'center', color: 'var(--text-slate)', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
                            <span>No active seat allocated currently</span>
                            {matchingShift && (
                              <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '8px 12px', fontSize: '0.75rem', color: '#1e3a8a', fontWeight: 600, width: '100%', boxSizing: 'border-box', textAlign: 'left' }}>
                                <div><strong>Paid Shift:</strong> {matchingShift.name}</div>
                                <div style={{ marginTop: '2px', color: '#2563eb' }}><strong>Time:</strong> {matchingShift.startTime} - {matchingShift.endTime}</div>
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setIsDrawerOpen(false);
                                navigate('/seats', {
                                  state: {
                                    preselectedStudentId: fullStudent.id,
                                    preselectedStudentName: fullStudent.user?.name,
                                  }
                                });
                                showToast('Select an available seat to assign to ' + fullStudent.user?.name, 'info');
                              }}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '8px 16px',
                                borderRadius: '10px',
                                border: 'none',
                                backgroundColor: 'var(--accent-blue)',
                                color: '#ffffff',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'background-color 150ms ease'
                              }}
                              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-blue)'}
                            >
                              <Plus size={14} /> Allot Seat
                            </button>
                          </div>
                        );
                      }
                      return (
                        <div style={{ background: '#ffffff', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-card)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                            <span style={{ color: 'var(--text-slate)' }}>Assigned Seat:</span>
                            <span style={{ fontWeight: 700, color: 'var(--accent-blue)' }}>Seat {activeAllocation.seat?.number}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                            <span style={{ color: 'var(--text-slate)' }}>Shift Batch:</span>
                            <span style={{ fontWeight: 600, color: 'var(--text-navy)' }}>{activeAllocation.shift?.name} ({activeAllocation.shift?.startTime} - {activeAllocation.shift?.endTime})</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                            <span style={{ color: 'var(--text-slate)' }}>Subscription Start:</span>
                            <span style={{ fontWeight: 600, color: 'var(--text-navy)' }}>{new Date(activeAllocation.startDate).toLocaleDateString()}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                            <span style={{ color: 'var(--text-slate)' }}>Subscription End:</span>
                            <span style={{ fontWeight: 600, color: 'var(--text-navy)' }}>{new Date(activeAllocation.endDate).toLocaleDateString()}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: activeAllocation.endDate && new Date(activeAllocation.endDate).getTime() < new Date().getTime() ? 'var(--status-red)' : 'var(--status-emerald)', fontSize: '0.75rem', fontWeight: 700, marginTop: '4px', borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
                            <Clock size={12} />
                            <span>{getDaysRemainingText(activeAllocation.endDate)}</span>
                          </div>

                          {/* Vacate Seat Button */}
                          <div style={{ borderTop: '1px solid var(--border-card)', paddingTop: '12px', marginTop: '4px' }}>
                            <button
                              type="button"
                              onClick={() => handleVacateSeat(activeAllocation.seatId)}
                              disabled={isVacating}
                              style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                padding: '8px',
                                borderRadius: '10px',
                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                backgroundColor: '#fef2f2',
                                color: 'var(--status-red)',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'background 150ms ease'
                              }}
                              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
                              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                            >
                              <LogOut size={14} style={{ transform: 'rotate(180deg)' }} /> Vacate Student Seat
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </>
              )}



              {drawerActiveSection === 'RENEW' && (
                <div>
                  {(() => {
                    const activeAllocation = fullStudent.allocations?.find((a: any) => a.isActive);
                    if (!activeAllocation) {
                      return (
                        <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px dashed var(--border-card)', textAlign: 'center', color: 'var(--text-slate)', fontSize: '0.8rem' }}>
                          No active seat allocation to renew
                        </div>
                      );
                    }
                    return (
                      <form onSubmit={(e) => handleRenewSeat(e, activeAllocation)} style={{ background: '#ffffff', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-card)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--status-emerald)', marginBottom: '4px' }}>
                          <History size={16} />
                          <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700 }}>Renew Seat Subscription</h4>
                        </div>

                        <div>
                          <label style={{ fontSize: '0.675rem', fontWeight: 700, color: 'var(--text-slate)', display: 'block', marginBottom: '4px' }}>Shift Schedule</label>
                          <Select
                            value={renewShiftId}
                            onChange={(val) => setRenewShiftId(val)}
                            placeholder="Select Shift"
                            options={shifts?.map((s: any) => ({ value: s.id, label: s.name })) || []}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '0.675rem', fontWeight: 700, color: 'var(--text-slate)', display: 'block', marginBottom: '4px' }}>Plan Duration</label>
                          <Select
                            value={renewDuration}
                            onChange={(val: any) => setRenewDuration(Number(val))}
                            placeholder="Select Duration"
                            options={[
                              { value: 1, label: '1 Month' },
                              { value: 3, label: '3 Months (Discounted)' },
                              { value: 6, label: '6 Months (Discounted)' },
                            ]}
                          />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          <div>
                            <label style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-slate)', display: 'block', marginBottom: '4px' }}>Start Date</label>
                            <input type="date" required value={renewStartDate} onChange={(e) => setRenewStartDate(e.target.value)} style={{ padding: '8px', fontSize: '0.8rem', borderRadius: '8px', border: '1px solid rgba(15, 23, 42, 0.05)', width: '100%', boxSizing: 'border-box' }} />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-slate)', display: 'block', marginBottom: '4px' }}>End Date</label>
                            <input type="date" required value={renewEndDate} onChange={(e) => setRenewEndDate(e.target.value)} style={{ padding: '8px', fontSize: '0.8rem', borderRadius: '8px', border: '1px solid rgba(15, 23, 42, 0.05)', width: '100%', boxSizing: 'border-box' }} />
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          <div>
                            <label style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-slate)', display: 'block', marginBottom: '4px' }}>Amount (₹)</label>
                            <input type="number" required value={renewAmount} onChange={(e) => setRenewAmount(e.target.value)} style={{ padding: '8px', fontSize: '0.8rem', borderRadius: '8px', border: '1px solid rgba(15, 23, 42, 0.05)', width: '100%', boxSizing: 'border-box' }} />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-slate)', display: 'block', marginBottom: '4px' }}>Method</label>
                            <Select
                              value={renewPaymentMethod}
                              onChange={(val: any) => setRenewPaymentMethod(val)}
                              placeholder="Payment Method"
                              options={[
                                { value: 'UPI', label: 'UPI' },
                                { value: 'CASH', label: 'Cash' },
                                { value: 'RAZORPAY', label: 'Online' }
                              ]}
                            />
                          </div>
                        </div>

                        <Button type="submit" variant="primary" style={{ backgroundColor: 'var(--status-emerald)', borderColor: 'var(--status-emerald)', width: '100%', marginTop: '6px' }} disabled={!renewShiftId || !renewStartDate || !renewEndDate || isRenewing} isLoading={isRenewing}>
                          Confirm Renewal
                        </Button>
                      </form>
                    );
                  })()}
                </div>
              )}

              {/* Invoices & Payments History */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <h5 style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-slate)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Payment Ledger History</h5>
                {fullStudent.payments && fullStudent.payments.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {fullStudent.payments.map((payment: any) => (
                      <div key={payment.id} style={{ background: '#ffffff', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-card)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-navy)' }}>₹{payment.amount}</span>
                          <span style={{ fontSize: '0.675rem', color: 'var(--text-slate)' }}>{new Date(payment.createdAt).toLocaleDateString()} • {payment.method}</span>
                        </div>
                        <span style={{ fontSize: '0.675rem', fontWeight: 700, color: payment.status === 'PAID' ? 'var(--status-emerald)' : 'var(--status-red)', backgroundColor: payment.status === 'PAID' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>
                          {payment.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px dashed var(--border-card)', textAlign: 'center', color: 'var(--text-slate)', fontSize: '0.8rem' }}>
                    No payment history found
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-slate)', padding: '20px' }}>
              Failed to load student details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
