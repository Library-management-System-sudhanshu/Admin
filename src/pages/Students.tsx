import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { LoadingState } from '../components/feedback/LoadingState';
import { QueryFeedback } from '../components/feedback/QueryFeedback';
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
  useUpdateAllocationMutation,
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
import { DatePicker } from '../components/ui/DatePicker';
import { formatYYYYMMDD, formatDateDisplay, getTodayYYYYMMDD, addDaysToDate, addMonthsToDate } from '../utils/dateUtils';
import {
  Plus,
  Check,
  X,
  Trash2,
  IdCard,
  Edit2,
  Mail,
  Phone,
  Clock,
  History,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Camera,
  Eye,
  EyeOff,
  Search,
  Users,
  UserCheck,
  AlertCircle,
  RotateCcw
} from 'lucide-react';
import { formatTo12hString, calculateShiftDuration } from '../utils/dateUtils';
import { compressImage } from '../utils/imageUtils';
import { getDaysRemainingText } from '../utils/seatUtils';
import { StudentIDCardModal } from '../features/students';
import { getErrorMessage } from '../utils/errorUtils';
import { isValidEmail } from '../utils/validators';
import {
  getStudentDisplayName,
  getStudentInitials,
  getStudentEmail,
  getStudentMobile,
  getStudentBranchName,
} from '../utils/studentUtils';

export default function Students() {
  const { showToast } = useToast();
  const { showAlert } = useAlert();
  const { user } = useSelector((state: RootState) => state.auth);
  const location = useLocation();
  const navigate = useNavigate();

  const { data: branches } = useGetBranchesQuery(user?.workspaceId, { skip: !user?.workspaceId });
  const { data: shifts } = useGetShiftsQuery(user?.workspaceId, { skip: !user?.workspaceId });

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [branchId, setBranchId] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [filterShiftId, setFilterShiftId] = useState('');
  const [filterExpiration, setFilterExpiration] = useState(() => {
    return (location.state as any)?.filterExpiration || '';
  });
  const [filterDays, setFilterDays] = useState<number | undefined>(() => {
    return (location.state as any)?.days;
  });

  // Reset page to 1 when filters or search change
  useEffect(() => {
    setPage(1);
  }, [search, branchId, filterShiftId, filterExpiration, filterDays]);

  React.useEffect(() => {
    if (location.state && (location.state as any).filterExpiration !== undefined) {
      setFilterExpiration((location.state as any).filterExpiration);
    }
    if (location.state && (location.state as any).days !== undefined) {
      setFilterDays((location.state as any).days);
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
  const [renewDuration, setRenewDuration] = useState<number | string>(1);
  const [isRenewing, setIsRenewing] = useState(false);



  // Edit Form Fields
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editMobile, setEditMobile] = useState('');
  const [editGuardianName, setEditGuardianName] = useState('');
  const [editGuardianMobile, setEditGuardianMobile] = useState('');
  const [editAadharNumber, setEditAadharNumber] = useState('');
  const [editBranchId, setEditBranchId] = useState('');
  const [editSubscriptionStart, setEditSubscriptionStart] = useState('');
  const [editSubscriptionEnd, setEditSubscriptionEnd] = useState('');
  const [editDurationMonths, setEditDurationMonths] = useState<number | 'custom'>(1);
  const [editAllocationId, setEditAllocationId] = useState<string | null>(null);
  const [editingActiveAllocation, setEditingActiveAllocation] = useState<any>(null);
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [showPasswordInDrawer, setShowPasswordInDrawer] = useState(false);

  const { currentData: data, isFetching, error, refetch } = useGetStudentsQuery({
    search: debouncedSearch,
    branchId: branchId || undefined,
    filterShiftId: filterShiftId || undefined,
    filterExpiration: filterExpiration || undefined,
    days: filterDays,
    page,
    limit,
  });

  const isLoading = isFetching && !data;

  const { currentData: fullStudent, isFetching: isStudentLoading } = useGetStudentByIdQuery(
    selectedStudentId || '',
    { skip: !selectedStudentId }
  );

  const filteredStudents = React.useMemo(() => {
    return data?.students || [];
  }, [data?.students]);

  // Dynamic KPI Metrics calculations
  const stats = React.useMemo(() => {
    const list = data?.students || [];
    let activeSeats = 0;
    let expiringSoon = 0;
    let expiredOrNoSeat = 0;

    list.forEach((st: any) => {
      const activeAlloc = st.allocations?.find((a: any) => a.isActive);
      if (!activeAlloc) {
        expiredOrNoSeat++;
      } else if (activeAlloc.endDate) {
        const end = new Date(activeAlloc.endDate);
        const today = new Date();
        end.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) {
          expiredOrNoSeat++;
        } else if (diffDays <= 7) {
          expiringSoon++;
        } else {
          activeSeats++;
        }
      } else {
        activeSeats++;
      }
    });

    return { activeSeats, expiringSoon, expiredOrNoSeat };
  }, [data?.students]);

  const hasActiveFilters = Boolean(search || branchId || filterShiftId || filterExpiration);

  const handleResetFilters = () => {
    setSearch('');
    setBranchId('');
    setFilterShiftId('');
    setFilterExpiration('');
  };

  const [_createStudent] = useCreateStudentMutation();
  const [updateStudent, { isLoading: isUpdating }] = useUpdateStudentMutation();
  const [updateAllocation, { isLoading: isUpdatingAllocation }] = useUpdateAllocationMutation();
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
    const targetStudent = (fullStudent && fullStudent.id === student.id) ? fullStudent : student;
    setEditingStudent(targetStudent);
    const resolvedName = targetStudent.user?.name || targetStudent.displayName || targetStudent.name || '';
    const resolvedEmail = targetStudent.user?.email || targetStudent.contactEmail || targetStudent.email || '';
    const resolvedMobile = targetStudent.user?.mobile || targetStudent.contactMobile || targetStudent.mobile || '';
    setEditName(resolvedName);
    setEditEmail(resolvedEmail);
    setEditMobile(resolvedMobile);
    setEditGuardianName(targetStudent.guardianName || '');
    setEditGuardianMobile(targetStudent.guardianMobile || '');
    setEditAadharNumber(targetStudent.aadharNumber || '');
    setEditBranchId(targetStudent.branchId || '');

    const activeAlloc = targetStudent.allocations?.find((a: any) => a.isActive) || targetStudent.allocations?.[0];
    setEditingActiveAllocation(activeAlloc || null);
    if (activeAlloc) {
      setEditAllocationId(activeAlloc.id);
      const startStr = formatYYYYMMDD(activeAlloc.startDate);
      const endStr = formatYYYYMMDD(activeAlloc.endDate);
      setEditSubscriptionStart(startStr);
      setEditSubscriptionEnd(endStr);
      if (startStr && endStr) {
        const s = new Date(startStr);
        const e = new Date(endStr);
        const diffMonths = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24 * 30));
        setEditDurationMonths(diffMonths > 0 ? diffMonths : 1);
      } else {
        setEditDurationMonths(1);
      }
    } else {
      setEditAllocationId(null);
      setEditSubscriptionStart('');
      setEditSubscriptionEnd('');
      setEditDurationMonths(1);
    }

    setEditErrors({});
    setOpenEdit(true);
  };

  const handleSubscriptionStartChange = (val: string) => {
    setEditSubscriptionStart(val);
    if (val) {
      const months = typeof editDurationMonths === 'number' ? editDurationMonths : 1;
      const calculatedEnd = addMonthsToDate(val, months);
      setEditSubscriptionEnd(calculatedEnd);
    }
    if (editErrors.subscriptionStart || editErrors.subscriptionEnd) {
      setEditErrors(prev => ({ ...prev, subscriptionStart: '', subscriptionEnd: '' }));
    }
  };

  const handleDurationPresetClick = (months: number) => {
    setEditDurationMonths(months);
    if (editSubscriptionStart) {
      const calculatedEnd = addMonthsToDate(editSubscriptionStart, months);
      setEditSubscriptionEnd(calculatedEnd);
    }
    if (editErrors.subscriptionEnd) {
      setEditErrors(prev => ({ ...prev, subscriptionEnd: '' }));
    }
  };

  const handleEditStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!editName.trim()) newErrors.name = 'Name is required';
    if (!editEmail.trim()) newErrors.email = 'Email is required';
    else if (!isValidEmail(editEmail.trim())) newErrors.email = 'Invalid email address';
    if (!editMobile.trim()) newErrors.mobile = 'Mobile is required';

    if (editAllocationId) {
      if (!editSubscriptionStart) {
        newErrors.subscriptionStart = 'Subscription Start date is required';
      }
      if (!editSubscriptionEnd) {
        newErrors.subscriptionEnd = 'Subscription End date is required';
      }
      if (editSubscriptionStart && editSubscriptionEnd) {
        if (new Date(editSubscriptionEnd).getTime() <= new Date(editSubscriptionStart).getTime()) {
          newErrors.subscriptionEnd = 'Subscription End must be after Subscription Start';
        }
      }
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
        guardianName: editGuardianName,
        guardianMobile: editGuardianMobile,
        aadharNumber: editAadharNumber,
        branchId: editBranchId,
      }).unwrap();

      if (editAllocationId && editSubscriptionStart && editSubscriptionEnd) {
        await updateAllocation({
          id: editAllocationId,
          startDate: editSubscriptionStart,
          endDate: editSubscriptionEnd,
        }).unwrap();
      }

      showToast('Student details updated successfully!', 'success');
      setOpenEdit(false);
      setEditingStudent(null);
    } catch (err: any) {
      showToast(getErrorMessage(err, 'Error updating student'), 'error');
    }
  };


  // 1. useEffect to automatically calculate renewEndDate and renewAmount when renewShiftId or renewStartDate or renewDuration changes
  useEffect(() => {
    if (renewShiftId && shifts) {
      const shift = shifts.find((s: any) => s.id === renewShiftId);
      if (shift && renewStartDate) {
        let endDateCalculated = '';
        let price = shift.price || 0;

        if (renewDuration === '7d') {
          endDateCalculated = addDaysToDate(renewStartDate, 7);
          price = Math.round((price / 30) * 7);
        } else if (renewDuration === '10d') {
          endDateCalculated = addDaysToDate(renewStartDate, 10);
          price = Math.round((price / 30) * 10);
        } else if (renewDuration === '15d') {
          endDateCalculated = addDaysToDate(renewStartDate, 15);
          price = Math.round((price / 30) * 15);
        } else {
          const months = typeof renewDuration === 'number' ? renewDuration : parseInt(renewDuration as string) || 1;
          endDateCalculated = addMonthsToDate(renewStartDate, months);
          if (months === 3 && shift.price3Months) {
            price = shift.price3Months;
          } else if (months === 6 && shift.price6Months) {
            price = shift.price6Months;
          } else {
            price = price * months;
          }
        }

        setRenewEndDate(endDateCalculated);
        setRenewAmount(price.toString());
      }
    }
  }, [renewShiftId, renewStartDate, renewDuration, shifts]);

  // 2. useEffect to prefill renew dates and shift when RENEW tab is selected
  useEffect(() => {
    if (drawerActiveSection === 'RENEW' && fullStudent) {
      const activeAllocation = fullStudent.allocations?.find((a: any) => a.isActive);
      if (activeAllocation) {
        // Start date is day after current subscription end date
        setRenewStartDate(addDaysToDate(activeAllocation.endDate, 1) || getTodayYYYYMMDD());
        setRenewShiftId(activeAllocation.shiftId || '');
      } else {
        setRenewStartDate(getTodayYYYYMMDD());
      }

      setRenewEndDate('');
      setRenewAmount('');
      setRenewDuration(1);
      setRenewPaymentMethod('UPI');
    }
  }, [drawerActiveSection, fullStudent]);

  // 3. Submit vacate seat
  const handleVacateSeat = async (seatId: string) => {
    const confirmed = await showAlert("Are you sure you want to vacate this seat?", {
      title: "Vacate Seat",
      confirmText: "Vacate Seat",
      cancelText: "Cancel",
      type: "danger",
    });
    if (!confirmed) return;
    try {
      await vacateSeat({ id: seatId, studentProfileId: fullStudent?.profile?.id }).unwrap();
      showToast('Seat vacated successfully!', 'success');
    } catch (err: any) {
      showToast(err.data?.message || 'Failed to vacate seat', 'error');
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    await updateStatus({ id, status });
  };

  const handleDelete = async (id: string) => {
    const confirmed = await showAlert("Are you sure you want to delete this student? This action cannot be undone.", {
      title: "Delete Student",
      confirmText: "Delete",
      cancelText: "Cancel",
      type: "danger",
    });
    if (!confirmed) return;
    try {
      await deleteStudent(id).unwrap();
      showToast('Student deleted successfully', 'success');
    } catch (err: any) {
      showToast(err?.data?.message || 'Failed to delete student', 'error');
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

  return (
    <div style={{ width: '100%' }}>
      {/* Dynamic Scoped CSS for Student Records */}
      <style dangerouslySetInnerHTML={{ __html: `
        .student-hover-card-trigger {
          position: relative;
        }

        .student-hover-details-card {
          position: absolute;
          top: 100%;
          left: 0;
          z-index: 100;
          width: 280px;
          background: #ffffff;
          border: 1px solid var(--border-card);
          border-radius: 12px;
          box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.15), 0 8px 10px -6px rgba(15, 23, 42, 0.1);
          padding: 12px;
          opacity: 0;
          visibility: hidden;
          transform: translateY(4px);
          transition: all 180ms ease;
          pointer-events: auto;
        }

        .student-hover-card-trigger:hover .student-hover-details-card {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }

        .student-table-row {
          transition: background-color 150ms ease;
        }
        .student-table-row:hover {
          background-color: #F8FAFC !important;
        }

        .sr-filter-input::placeholder {
          color: #94A3B8;
        }

        @media (max-width: 640px) {
          .sr-filter-bar { flex-direction: column !important; }
          .sr-filter-bar > div { width: 100% !important; flex: unset !important; }
          .sr-status-chips { overflow-x: auto; -webkit-overflow-scrolling: touch; }
          .sr-status-chips::-webkit-scrollbar { display: none; }
        }
      `}} />



      {/* High-Density Integrated Filter Toolbar */}
      <div
        className="sr-filter-bar"
        style={{
          padding: '0.5rem 0.75rem',
          marginBottom: '0.75rem',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: '0.5rem',
          flexWrap: 'wrap',
          backgroundColor: '#ffffff',
          border: '1px solid var(--border-card)',
          borderRadius: '0.75rem',
          boxShadow: 'var(--shadow-soft)'
        }}
      >
        {/* Search Box */}
        <div style={{ position: 'relative', flex: '1 1 220px', minWidth: '200px' }}>
          <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input
            type="text"
            placeholder="Search student by name, mobile, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sr-filter-input"
            style={{
              width: '100%',
              padding: '0.45rem 2rem 0.45rem 2.2rem',
              fontSize: '0.825rem',
              borderRadius: '0.5rem',
              border: '1px solid var(--border-card)',
              outline: 'none',
              backgroundColor: '#F8FAFC',
              boxSizing: 'border-box',
              color: 'var(--text-navy)',
              transition: 'all 150ms ease'
            }}
            onFocus={(e) => {
              e.target.style.backgroundColor = '#ffffff';
              e.target.style.borderColor = 'var(--accent-blue)';
            }}
            onBlur={(e) => {
              if (!e.target.value) e.target.style.backgroundColor = '#F8FAFC';
              e.target.style.borderColor = 'var(--border-card)';
            }}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#94A3B8',
                padding: '2px'
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Branch Select */}
        <div style={{ width: '165px', flexShrink: 0 }}>
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

        {/* Shift Select */}
        <div style={{ width: '165px', flexShrink: 0 }}>
          <Select
            value={filterShiftId}
            onChange={(val) => setFilterShiftId(val)}
            placeholder="All Shifts"
            options={[
              { value: '', label: 'All Shifts' },
              ...(shifts?.map((s: any) => ({
                value: s.id,
                label: `${s.name} (${calculateShiftDuration(s.startTime, s.endTime)}) (${formatTo12hString(s.startTime)} - ${formatTo12hString(s.endTime)})`,
              })) || [])
            ]}
          />
        </div>

        {/* Expiration Status Select */}
        <div style={{ width: '165px', flexShrink: 0 }}>
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

        {/* Reset Filters Button */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleResetFilters}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '0.45rem 0.75rem',
              fontSize: '0.775rem',
              fontWeight: 600,
              color: 'var(--status-red)',
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.15)',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 150ms ease'
            }}
          >
            <RotateCcw size={13} /> Reset
          </button>
        )}

        {/* Primary Add Student Action */}
        <button
          type="button"
          onClick={() => navigate('/new-admission')}
          style={{
            marginLeft: 'auto',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '0.45rem 0.95rem',
            fontSize: '0.8rem',
            fontWeight: 600,
            borderRadius: '0.5rem',
            border: 'none',
            color: '#ffffff',
            backgroundColor: 'var(--accent-blue)',
            boxShadow: '0 1px 3px rgba(37, 99, 235, 0.25)',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            transition: 'all 150ms ease'
          }}
        >
          <Plus size={15} /> Add Student
        </button>
      </div>

      <QueryFeedback error={error} fetching={isFetching && !!data} onRetry={refetch} />
      {/* Roster Table Card */}
      {isLoading ? (
        <LoadingState />
      ) : error && !data ? null : (
        <div className="custom-table-container" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', background: '#ffffff', borderRadius: '0.75rem', border: '1px solid var(--border-card)', boxShadow: 'var(--shadow-soft)' }}>
          <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid var(--border-card)' }}>
                <th style={{ padding: '0.65rem 1rem', fontSize: '0.725rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-slate)' }}>Student</th>
                <th style={{ padding: '0.65rem 1rem', fontSize: '0.725rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-slate)' }}>Contact Info</th>
                <th style={{ padding: '0.65rem 1rem', fontSize: '0.725rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-slate)', whiteSpace: 'nowrap' }}>Seat & Shift</th>
                <th style={{ padding: '0.65rem 1rem', fontSize: '0.725rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-slate)', whiteSpace: 'nowrap' }}>Subscription & Expiry</th>
                <th style={{ padding: '0.65rem 1rem', fontSize: '0.725rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-slate)', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '3.5rem 1rem', textAlign: 'center', color: 'var(--text-slate)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.65rem', maxWidth: '380px', margin: '0 auto' }}>
                      <div
                        style={{
                          width: '52px',
                          height: '52px',
                          borderRadius: '50%',
                          backgroundColor: '#F1F5F9',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#64748B',
                          marginBottom: '0.2rem'
                        }}
                      >
                        <Users size={26} />
                      </div>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-navy)' }}>
                        {hasActiveFilters ? 'No students found matching your filters' : 'No students found'}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: '#64748B', lineHeight: 1.45 }}>
                        {hasActiveFilters
                          ? 'No records match your selected filter criteria. Clear your filters to view all students.'
                          : 'No students have been enrolled in this library yet. Get started by admitting a new student.'}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginTop: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                        {hasActiveFilters ? (
                          <button
                            type="button"
                            onClick={handleResetFilters}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '0.5rem 1.15rem',
                              fontSize: '0.825rem',
                              fontWeight: 600,
                              borderRadius: '0.5rem',
                              border: '1px solid var(--border-card)',
                              color: 'var(--text-navy)',
                              backgroundColor: '#F8FAFC',
                              cursor: 'pointer',
                              transition: 'all 150ms ease'
                            }}
                          >
                            <RotateCcw size={14} /> Clear All Filters
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => navigate('/new-admission')}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '0.5rem 1.15rem',
                              fontSize: '0.825rem',
                              fontWeight: 600,
                              borderRadius: '0.5rem',
                              border: 'none',
                              color: '#ffffff',
                              backgroundColor: 'var(--accent-blue)',
                              boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)',
                              cursor: 'pointer',
                              transition: 'all 150ms ease'
                            }}
                          >
                            <Plus size={16} /> Add Student
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student: any) => {
                  const activeAllocation = student.allocations?.find((a: any) => a.isActive);
                  const isSubscriptionExpired = activeAllocation && activeAllocation.endDate && new Date(activeAllocation.endDate).getTime() < new Date().getTime();
                  const hasSeat = !!activeAllocation;

                  const avatarBorderColor = 
                    isSubscriptionExpired ? '#ef4444' :
                    student.status === 'APPROVED' ? (hasSeat ? 'var(--status-emerald)' : '#cbd5e1') :
                    student.status === 'PENDING' ? 'var(--status-gold)' :
                    student.status === 'REJECTED' ? 'var(--status-red)' :
                    'var(--border-card)';

                  return (
                    <tr 
                      key={student.id}
                      className="student-table-row"
                      onClick={() => {
                        setSelectedStudentId(student.id);
                        setDrawerActiveSection('DETAILS');
                        setIsDrawerOpen(true);
                      }}
                      style={{ cursor: 'pointer', borderBottom: '1px solid var(--border-card)' }}
                    >
                      <td style={{ padding: '0.6rem 1rem' }}>
                        <div className="student-hover-card-trigger" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <div 
                            className="avatar" 
                            style={{ 
                              width: '34px',
                              height: '34px',
                              border: `2px solid ${avatarBorderColor}`, 
                              boxSizing: 'border-box',
                              background: (student.user?.avatar || student.avatar) ? `url(${student.user?.avatar || student.avatar}) no-repeat center center / cover` : undefined,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.8rem',
                              fontWeight: 700
                            }}
                          >
                            {!(student.user?.avatar || student.avatar) && getStudentInitials(student)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-navy)', lineHeight: 1.2 }}>
                              {getStudentDisplayName(student)}
                            </div>
                            <div style={{ fontSize: '0.725rem', color: 'var(--text-slate)', marginTop: '2px' }}>
                              {getStudentBranchName(student, branches)}
                            </div>
                          </div>

                          {/* Hover Details Card */}
                          <div className="student-hover-details-card" onClick={(e) => e.stopPropagation()}>
                            <div style={{ fontWeight: 700, fontSize: '0.825rem', color: '#0F172A', borderBottom: '1px solid #F1F5F9', paddingBottom: '6px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span>Seat & Shift History</span>
                              <span style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 600 }}>ID: {student.id.substring(0, 6)}</span>
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
                                          {alloc.shift?.name || 'N/A'} Shift ({formatTo12hString(alloc.shift?.startTime)} - {formatTo12hString(alloc.shift?.endTime)})
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

                      <td style={{ padding: '0.6rem 1rem' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-navy)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Mail size={12} style={{ color: '#94A3B8', flexShrink: 0 }} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }} title={getStudentEmail(student)}>
                            {getStudentEmail(student)}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.725rem', color: 'var(--text-slate)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Phone size={11} style={{ color: '#94A3B8', flexShrink: 0 }} />
                          {getStudentMobile(student)}
                        </div>
                      </td>

                      <td style={{ padding: '0.6rem 1rem', whiteSpace: 'nowrap' }}>
                        {(() => {
                          const activeAllocation = student.allocations?.find((a: any) => a.isActive);
                          if (!activeAllocation) {
                            const activeSub = student.subscriptions?.find((sub: any) => sub.status === 'ACTIVE');
                            const matchingShift = activeSub && shifts?.find((s: any) => 
                              activeSub.plan?.name?.toLowerCase().includes(s.name.toLowerCase())
                            );
                            if (matchingShift) {
                              return (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.8rem' }}>
                                  <span style={{ fontWeight: 700, color: 'var(--accent-blue)' }}>
                                    No Seat Allocated
                                  </span>
                                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.725rem', fontStyle: 'italic' }}>
                                    Paid: {matchingShift.name} ({formatTo12hString(matchingShift.startTime)} - {formatTo12hString(matchingShift.endTime)})
                                  </span>
                                </div>
                              );
                            }
                            return <span style={{ fontStyle: 'italic', fontSize: '0.775rem', color: 'var(--text-slate)' }}>No Seat Allocated</span>;
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
                            padding: '2px 7px',
                            borderRadius: '4px',
                            fontSize: '0.675rem',
                            fontWeight: 700,
                            lineHeight: 1.2,
                            marginTop: '3px',
                          };

                          if (diffDays < 0) {
                            statusText = 'Expired';
                            badgeStyle = {
                              ...badgeStyle,
                              color: 'var(--status-red)',
                              backgroundColor: 'rgba(239, 68, 68, 0.08)',
                              border: '1px solid rgba(239, 68, 68, 0.2)',
                            };
                          } else if (diffDays <= 7) {
                            statusText = diffDays === 0 ? 'Expires Today' : `Expires in ${diffDays}d`;
                            badgeStyle = {
                              ...badgeStyle,
                              color: 'var(--status-gold)',
                              backgroundColor: 'rgba(217, 119, 6, 0.08)',
                              border: '1px solid rgba(217, 119, 6, 0.2)',
                            };
                          } else {
                            statusText = `Active (${diffDays}d left)`;
                            badgeStyle = {
                              ...badgeStyle,
                              color: 'var(--status-emerald)',
                              backgroundColor: 'rgba(16, 185, 129, 0.08)',
                              border: '1px solid rgba(16, 185, 129, 0.2)',
                            };
                          }

                          return (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', fontSize: '0.8rem' }}>
                              <div>
                                <span style={{ fontWeight: 700, color: 'var(--text-navy)' }}>
                                  Seat {activeAllocation.seat?.number || 'N/A'}
                                </span>
                                <span style={{ color: 'var(--text-slate)', marginLeft: '0.25rem', fontSize: '0.75rem' }}>
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


                      <td style={{ padding: '0.6rem 1rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                        {(() => {
                          const activeAlloc = student.allocations?.find((a: any) => a.isActive);
                          if (!activeAlloc) {
                            return (
                              <span style={{ fontStyle: 'italic', fontSize: '0.75rem', color: 'var(--text-slate)' }}>
                                No active seat
                              </span>
                            );
                          }
                          const end = new Date(activeAlloc.endDate);
                          const today = new Date();
                          end.setHours(0, 0, 0, 0);
                          today.setHours(0, 0, 0, 0);
                          const isExpired = end.getTime() < today.getTime();

                          return (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem' }}>
                                <span style={{ fontWeight: 600, color: 'var(--text-navy)' }}>
                                  {new Date(activeAlloc.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                </span>
                                <span style={{ color: 'var(--text-slate)', fontSize: '0.75rem' }}>→</span>
                                <span style={{ fontWeight: 700, color: isExpired ? 'var(--status-red)' : 'var(--text-navy)' }}>
                                  {new Date(activeAlloc.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </span>
                              </div>
                              <span style={{ fontSize: '0.7rem', color: isExpired ? 'var(--status-red)' : 'var(--text-slate)', fontWeight: 500 }}>
                                {getDaysRemainingText(activeAlloc.endDate)}
                              </span>
                            </div>
                          );
                        })()}
                      </td>

                      <td style={{ padding: '0.6rem 1rem', textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                        <div className="action-buttons" style={{ justifyContent: 'flex-end' }}>
                          {student.status === 'PENDING' && (
                            <>
                              <button 
                                className="icon-btn success" 
                                title="Approve" 
                                onClick={() => handleStatusChange(student.id, 'APPROVED')}
                              >
                                <Check size={16} />
                              </button>
                              <button 
                                className="icon-btn danger" 
                                title="Reject" 
                                onClick={() => handleStatusChange(student.id, 'REJECTED')}
                              >
                                <X size={16} />
                              </button>
                            </>
                          )}
                          <button 
                            className="icon-btn" 
                            title="Edit Student" 
                            onClick={() => handleOpenEdit(student)}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            className="icon-btn" 
                            title="ID Card" 
                            onClick={() => {
                              setSelectedStudent(student);
                              setOpenCard(true);
                            }}
                          >
                            <IdCard size={16} />
                          </button>
                          <button 
                            className="icon-btn danger" 
                            title="Delete" 
                            onClick={() => handleDelete(student.id)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Integrated Pagination Footer */}
          {data && data.total > 0 && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.6rem 1.25rem',
              backgroundColor: '#F8FAFC',
              borderTop: '1px solid var(--border-card)',
              borderBottomLeftRadius: '0.75rem',
              borderBottomRightRadius: '0.75rem'
            }}>
              <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>
                  Showing <span style={{ color: '#0F172A', fontWeight: 700 }}>{((page - 1) * limit) + 1}</span> to{' '}
                  <span style={{ color: '#0F172A', fontWeight: 700 }}>
                    {Math.min(page * limit, data.total)}
                  </span> of{' '}
                  <span style={{ color: '#0F172A', fontWeight: 700 }}>{data.total}</span> students
                </span>
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  style={{
                    padding: '2px 6px',
                    borderRadius: '4px',
                    border: '1px solid var(--border-card)',
                    fontSize: '0.75rem',
                    color: '#0F172A',
                    fontWeight: 600,
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </span>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  disabled={page === 1}
                  onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '26px',
                    height: '26px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-card)',
                    backgroundColor: '#ffffff',
                    color: page === 1 ? '#cbd5e1' : '#475569',
                    cursor: page === 1 ? 'not-allowed' : 'pointer',
                    transition: 'all 150ms ease',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.02)'
                  }}
                >
                  <ChevronLeft size={14} />
                </button>
                
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>
                  {page} / {Math.ceil(data.total / 10)}
                </span>

                <button
                  disabled={page >= Math.ceil(data.total / limit)}
                  onClick={() => setPage(prev => Math.min(prev + 1, Math.ceil(data.total / limit)))}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '26px',
                    height: '26px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-card)',
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
        </div>
      )}



      {/* ID Card Modal */}
      <StudentIDCardModal
        isOpen={openCard}
        onClose={() => setOpenCard(false)}
        student={selectedStudent}
        workspaceName={user?.workspace?.name}
        branches={branches}
      />

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
              onChange={(e) => setEditEmail(e.target.value.toLowerCase())}
            />
            <Input
              label="Mobile Number"
              required
              maxLength={10}
              value={editMobile}
              error={editErrors.mobile}
              onChange={(e) => setEditMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
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
              maxLength={10}
              value={editGuardianMobile}
              error={editErrors.guardianMobile}
              onChange={(e) => setEditGuardianMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
            />
            <Input
              label="Aadhar Card Number"
              maxLength={12}
              value={editAadharNumber}
              error={editErrors.aadharNumber}
              onChange={(e) => setEditAadharNumber(e.target.value.replace(/\D/g, '').slice(0, 12))}
            />
          </div>

          {/* Subscription Dates Section */}
          <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
              <div>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-navy)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block' }}>
                  Subscription & Expiry Period
                </span>
                <span style={{ fontSize: '0.725rem', color: 'var(--text-slate)' }}>
                  Set Subscription Start to automatically calculate the expiration date
                </span>
              </div>
              {editingActiveAllocation?.seat && (
                <span style={{ fontSize: '0.725rem', color: 'var(--accent-blue)', background: 'rgba(37, 99, 235, 0.08)', padding: '2px 8px', borderRadius: '6px', fontWeight: 600 }}>
                  Seat {editingActiveAllocation.seat.number || editingActiveAllocation.seat.seatNumber} {editingActiveAllocation.shift?.name ? `• ${editingActiveAllocation.shift.name}` : ''}
                </span>
              )}
            </div>

            {editingActiveAllocation ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                {/* Duration Presets */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.725rem', fontWeight: 600, color: 'var(--text-slate)', marginRight: '4px' }}>
                    Duration:
                  </span>
                  {[
                    { label: '1 Month', months: 1 },
                    { label: '2 Months', months: 2 },
                    { label: '3 Months', months: 3 },
                    { label: '6 Months', months: 6 },
                    { label: '1 Year', months: 12 },
                  ].map((preset) => {
                    const isSelected = editDurationMonths === preset.months;
                    return (
                      <button
                        key={preset.months}
                        type="button"
                        onClick={() => handleDurationPresetClick(preset.months)}
                        style={{
                          padding: '3px 10px',
                          borderRadius: '6px',
                          fontSize: '0.725rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 120ms ease',
                          border: isSelected ? '1px solid var(--accent-blue)' : '1px solid var(--border-card)',
                          backgroundColor: isSelected ? 'var(--accent-blue)' : '#F8FAFC',
                          color: isSelected ? '#ffffff' : 'var(--text-navy)',
                        }}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', gap: '1rem' }}>
                  <div>
                    <DatePicker
                      label="Subscription Start *"
                      required
                      value={editSubscriptionStart}
                      onChange={handleSubscriptionStartChange}
                    />
                    {editErrors.subscriptionStart && (
                      <span style={{ color: 'var(--status-red)', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                        {editErrors.subscriptionStart}
                      </span>
                    )}
                  </div>
                  <div>
                    <DatePicker
                      label="Subscription End (Calculated Expiry) *"
                      required
                      value={editSubscriptionEnd}
                      onChange={(val) => {
                        setEditSubscriptionEnd(val);
                        setEditDurationMonths('custom');
                        if (editErrors.subscriptionEnd) {
                          setEditErrors(prev => ({ ...prev, subscriptionEnd: '' }));
                        }
                      }}
                    />
                    {editErrors.subscriptionEnd && (
                      <span style={{ color: 'var(--status-red)', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                        {editErrors.subscriptionEnd}
                      </span>
                    )}
                  </div>
                </div>

                {/* Expiry summary badge */}
                {editSubscriptionEnd && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    backgroundColor: new Date(editSubscriptionEnd).getTime() < new Date().getTime() ? '#FEF2F2' : '#F0FDF4',
                    border: `1px solid ${new Date(editSubscriptionEnd).getTime() < new Date().getTime() ? '#FECACA' : '#BBF7D0'}`,
                    borderRadius: '8px',
                    fontSize: '0.775rem',
                    color: new Date(editSubscriptionEnd).getTime() < new Date().getTime() ? 'var(--status-red)' : '#166534',
                    fontWeight: 600
                  }}>
                    <Clock size={14} />
                    <span>
                      Expiry: {new Date(editSubscriptionEnd).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {' • '}
                      {getDaysRemainingText(editSubscriptionEnd)}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ padding: '12px 14px', background: '#F8FAFC', border: '1px dashed #CBD5E1', borderRadius: '10px', fontSize: '0.8rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={16} style={{ color: '#94A3B8', flexShrink: 0 }} />
                <span>No active seat subscription found for this student. Allocate a seat to manage subscription dates.</span>
              </div>
            )}
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
            <Button type="button" variant="text" onClick={() => setOpenEdit(false)}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={isUpdating || isUpdatingAllocation}>Save Changes</Button>
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
            <LoadingState />
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
                      background: (fullStudent.user?.avatar || fullStudent.avatar) ? `url(${fullStudent.user?.avatar || fullStudent.avatar}) no-repeat center center / cover` : 'var(--accent-blue)', 
                      color: 'white', 
                      fontWeight: 700, 
                      fontSize: '1.1rem', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      boxShadow: 'var(--shadow-soft)'
                    }}
                  >
                    {!(fullStudent.user?.avatar || fullStudent.avatar) && getStudentInitials(fullStudent)}
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
                  <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{getStudentDisplayName(fullStudent)}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-slate)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}><Mail size={12} /> {getStudentEmail(fullStudent)}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-slate)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}><Phone size={12} /> {getStudentMobile(fullStudent)}</span>
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
                              <input
                                type="number"
                                required
                                value={clearDuesAmount}
                                onChange={(e) => setClearDuesAmount(e.target.value)}
                                max={fullStudent.dueAmount}
                                style={{
                                  height: '38px',
                                  padding: '0 10px',
                                  fontSize: '0.8rem',
                                  borderRadius: '8px',
                                  border: '1px solid #fca5a5',
                                  width: '100%',
                                  boxSizing: 'border-box',
                                  outline: 'none',
                                  backgroundColor: '#ffffff'
                                }}
                              />
                            </div>
                            <div style={{ width: '110px' }}>
                              <label style={{ fontSize: '0.65rem', fontWeight: 700, color: '#991b1b', display: 'block', marginBottom: '4px' }}>Method</label>
                              <Select
                                value={clearDuesMethod}
                                onChange={(val: any) => setClearDuesMethod(val)}
                                options={[{ value: 'UPI', label: 'UPI' }, { value: 'CASH', label: 'Cash' }, { value: 'RAZORPAY', label: 'Online' }]}
                              />
                            </div>
                            <Button
                              type="submit"
                              variant="primary"
                              style={{
                                backgroundColor: 'var(--status-red)',
                                borderColor: 'var(--status-red)',
                                height: '38px',
                                padding: '0 16px',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                borderRadius: '8px'
                              }}
                              disabled={!clearDuesAmount || isClearingDues}
                              isLoading={isClearingDues}
                            >
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
                        <span style={{ color: 'var(--text-slate)' }}>Branch Location:</span>
                        <span style={{ fontWeight: 600, color: 'var(--text-navy)' }}>{getStudentBranchName(fullStudent, branches)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                        <span style={{ color: 'var(--text-slate)' }}>Login Password:</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-navy)', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                            {showPasswordInDrawer ? (fullStudent.user?.rawPassword || 'Student@123') : '••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowPasswordInDrawer(!showPasswordInDrawer)}
                            title={showPasswordInDrawer ? 'Hide Password' : 'Show Password'}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '2px 4px',
                              color: 'var(--accent-blue)',
                              display: 'flex',
                              alignItems: 'center',
                              borderRadius: '4px',
                            }}
                          >
                            {showPasswordInDrawer ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
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
                                <div style={{ marginTop: '2px', color: '#2563eb' }}><strong>Time:</strong> {formatTo12hString(matchingShift.startTime)} - {formatTo12hString(matchingShift.endTime)}</div>
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setIsDrawerOpen(false);
                                navigate('/seats', {
                                  state: {
                                    preselectedStudentId: fullStudent.id,
                                    preselectedStudentName: getStudentDisplayName(fullStudent),
                                  }
                                });
                                showToast('Select an available seat to assign to ' + getStudentDisplayName(fullStudent), 'info');
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
                            <span style={{ fontWeight: 600, color: 'var(--text-navy)' }}>{activeAllocation.shift?.name} ({formatTo12hString(activeAllocation.shift?.startTime)} - {formatTo12hString(activeAllocation.shift?.endTime)})</span>
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
                            onChange={(val: any) => setRenewDuration(isNaN(Number(val)) ? val : Number(val))}
                            placeholder="Select Duration"
                            options={[
                              { value: 1, label: '1 Month (Standard)' },
                              { value: 2, label: '2 Months' },
                              { value: 3, label: '3 Months (Quarterly)' },
                              { value: 6, label: '6 Months (Half Yearly)' },
                              { value: '7d', label: '7 Days (Short Term)' },
                              { value: '10d', label: '10 Days (Short Term)' },
                              { value: '15d', label: '15 Days (Half Month)' },
                            ]}
                          />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          <DatePicker
                            label="Start Date"
                            required
                            value={renewStartDate}
                            onChange={(val) => setRenewStartDate(val)}
                          />
                          <DatePicker
                            label="End Date"
                            required
                            value={renewEndDate}
                            onChange={(val) => setRenewEndDate(val)}
                          />
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
