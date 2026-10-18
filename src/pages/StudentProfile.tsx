import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import {
  useGetStudentByIdQuery,
  useGetBranchesQuery,
  useGetShiftsQuery,
  useUpdateStudentMutation,
  useDeleteStudentMutation,
  useVacateSeatMutation,
  useAllocateSeatMutation,
  useUpdateAllocationMutation,
  useCreatePaymentMutation,
  useVerifyRazorpayMutation,
  useClearStudentDuesMutation,
  useUploadImageMutation,
} from '../store/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { DatePicker } from '../components/ui/DatePicker';
import { LoadingState } from '../components/feedback/LoadingState';
import { QueryFeedback } from '../components/feedback/QueryFeedback';
import { useToast } from '../components/ui/ToastContext';
import { useAlert } from '../components/ui/AlertContext';
import { InvoiceReceiptModal } from '../components/InvoiceReceiptModal';
import { RenewSeatForm } from '../features/seats/drawer/RenewSeatForm';
import {
  getStudentDisplayName,
  getStudentInitials,
  getStudentEmail,
  getStudentMobile,
} from '../utils/studentUtils';
import {
  formatYYYYMMDD,
  calculateSubscriptionEndDate,
  formatPlanDuration,
  formatTo12hString,
  calculatePlanPrice,
} from '../utils/dateUtils';
import { compressImage } from '../utils/imageUtils';
import { getDaysRemainingText } from '../utils/seatUtils';
import { getErrorMessage } from '../utils/errorUtils';
import { isValidEmail } from '../utils/validators';
import {
  ArrowLeft,
  Mail,
  Phone,
  Camera,
  Edit2,
  Trash2,
  Armchair,
  Clock,
  LogOut,
  Eye,
  EyeOff,
  Building2,
  Plus,
  Repeat,
  DollarSign,
  User,
  CreditCard,
  FileText,
  Calendar,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import './StudentProfile.css';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (document.getElementById('razorpay-script')) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.id = 'razorpay-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function StudentProfile() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { showAlert } = useAlert();
  const [searchParams] = useSearchParams();
  const { id: routeId } = useParams<{ id: string }>();
  const studentId = routeId || searchParams.get('id') || searchParams.get('studentId') || '';

  const { user } = useSelector((state: RootState) => state.auth);

  // Queries
  const {
    currentData: student,
    isFetching: isStudentLoading,
    error: studentError,
    refetch: refetchStudent,
  } = useGetStudentByIdQuery(studentId, { skip: !studentId });

  const { data: branches } = useGetBranchesQuery(user?.workspaceId, { skip: !user?.workspaceId });
  const { data: shifts } = useGetShiftsQuery(student?.branchId || '', {
    skip: !student?.branchId,
  });

  // Mutations
  const [updateStudent, { isLoading: isUpdatingStudent }] = useUpdateStudentMutation();
  const [deleteStudent, { isLoading: isDeletingStudent }] = useDeleteStudentMutation();
  const [vacateSeat, { isLoading: isVacating }] = useVacateSeatMutation();
  const [allocateSeat] = useAllocateSeatMutation();
  const [updateAllocation, { isLoading: isUpdatingAllocation }] = useUpdateAllocationMutation();
  const [createPayment] = useCreatePaymentMutation();
  const [verifyRazorpay] = useVerifyRazorpayMutation();
  const [clearStudentDues, { isLoading: isClearingDues }] = useClearStudentDuesMutation();
  const [uploadImage] = useUploadImageMutation();

  // Active section tab
  const [activeTab, setActiveTab] = useState<'DETAILS' | 'RENEW'>('DETAILS');

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);

  // Clear dues state
  const [clearDuesAmount, setClearDuesAmount] = useState('');
  const [clearDuesMethod, setClearDuesMethod] = useState<'UPI' | 'CASH' | 'RAZORPAY'>('UPI');

  // Renewal Form state
  const [renewShiftId, setRenewShiftId] = useState('');
  const [renewDuration, setRenewDuration] = useState<number | string>(1);
  const [renewStartDate, setRenewStartDate] = useState('');
  const [renewEndDate, setRenewEndDate] = useState('');
  const [renewAmount, setRenewAmount] = useState('');
  const [renewDiscount, setRenewDiscount] = useState('');
  const [renewPaymentMethod, setRenewPaymentMethod] = useState<'UPI' | 'CASH' | 'RAZORPAY'>('CASH');
  const [isRenewing, setIsRenewing] = useState(false);

  // Invoice Receipt Modal state
  const [openInvoiceReceipt, setOpenInvoiceReceipt] = useState(false);
  const [createdInvoiceData, setCreatedInvoiceData] = useState<any>(null);

  // Edit Modal State
  const [openEdit, setOpenEdit] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editMobile, setEditMobile] = useState('');
  const [editGuardianName, setEditGuardianName] = useState('');
  const [editGuardianMobile, setEditGuardianMobile] = useState('');
  const [editAadharNumber, setEditAadharNumber] = useState('');
  const [editBranchId, setEditBranchId] = useState('');
  const [editAllocationId, setEditAllocationId] = useState<string | null>(null);
  const [editSubscriptionStart, setEditSubscriptionStart] = useState('');
  const [editSubscriptionEnd, setEditSubscriptionEnd] = useState('');
  const [editDurationMonths, setEditDurationMonths] = useState<number | string>(1);
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  // Active seat allocation
  const activeAllocation = useMemo(() => {
    return student?.allocations?.find((a: any) => a.isActive);
  }, [student]);

  // Active subscription
  const activeSub = useMemo(() => {
    return student?.subscriptions?.find((sub: any) => sub.status === 'ACTIVE');
  }, [student]);

  // Total paid sum
  const totalPaid = useMemo(() => {
    if (!student?.payments) return 0;
    return student.payments.reduce((acc: number, p: any) => acc + Number(p.amount || 0), 0);
  }, [student?.payments]);

  // Sync renewal default dates from active allocation
  useEffect(() => {
    if (activeAllocation) {
      setRenewShiftId(activeAllocation.shiftId || '');
      const nextStart = activeAllocation.endDate
        ? new Date(new Date(activeAllocation.endDate).getTime() + 24 * 60 * 60 * 1000)
        : new Date();
      const startStr = formatYYYYMMDD(nextStart.toISOString());
      setRenewStartDate(startStr);
      setRenewDuration(1);
    }
  }, [activeAllocation]);

  // Auto calculate renewEndDate & renewAmount
  useEffect(() => {
    if (renewShiftId && shifts && renewStartDate) {
      const shift = shifts.find((s: any) => s.id === renewShiftId);
      if (shift) {
        const endDateCalculated = calculateSubscriptionEndDate(renewStartDate, renewDuration);
        setRenewEndDate(endDateCalculated);
        const basePrice = calculatePlanPrice(shift, renewDuration);
        const discountNum = parseFloat(renewDiscount) || 0;
        const finalPrice = Math.max(0, basePrice - discountNum);
        setRenewAmount(finalPrice.toString());
      }
    }
  }, [renewShiftId, shifts, renewStartDate, renewDuration, renewDiscount]);

  const handleRenewDiscountChange = (newDiscount: string) => {
    setRenewDiscount(newDiscount);
    if (renewShiftId && shifts) {
      const shift = shifts.find((s: any) => s.id === renewShiftId);
      if (shift) {
        const basePrice = calculatePlanPrice(shift, renewDuration);
        const discountNum = parseFloat(newDiscount) || 0;
        const finalPrice = Math.max(0, basePrice - discountNum);
        setRenewAmount(finalPrice.toString());
      }
    }
  };

  const getStudentBranchName = (std: any) => {
    if (!std || !branches) return 'N/A';
    const branch = branches.find((b: any) => b.id === std.branchId);
    return branch ? branch.name : 'N/A';
  };

  const getEffectivePaymentStatus = (payment: any) => {
    if (!payment) return 'UNKNOWN';
    if (payment.status) {
      const s = String(payment.status).toUpperCase();
      if (s === 'PAID' || s === 'COMPLETED' || s === 'SUCCESS') return 'PAID';
      if (s === 'PARTIAL') return 'PARTIAL';
      if (s === 'PENDING' || s === 'FAILED' || s === 'UNPAID') return 'UNPAID';
    }
    const amt = Number(payment.amount || 0);
    const tot = Number(payment.totalAmount || 0);
    const disc = Number(payment.discountAmount || 0);
    const net = Math.max(0, tot - disc);
    if (net > 0 && amt >= net) return 'PAID';
    if (amt > 0 && amt < net) return 'PARTIAL';
    return 'UNPAID';
  };

  // Avatar Upload
  const handleStudentAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !student) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const rawBase64 = reader.result as string;
      try {
        const compressedBase64 = await compressImage(rawBase64);
        const uploadResult = await uploadImage({ base64: compressedBase64 }).unwrap();
        await updateStudent({
          id: student.id,
          avatar: uploadResult.url,
        }).unwrap();
        showToast('Profile photo updated successfully!', 'success');
        refetchStudent();
      } catch (err: any) {
        showToast(err?.data?.message || 'Failed to update student photo.', 'error');
      }
    };
    reader.readAsDataURL(file);
  };

  // Clear Dues
  const handleClearDues = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;
    try {
      await clearStudentDues({
        id: student.id,
        amount: Number(clearDuesAmount),
        method: clearDuesMethod,
      }).unwrap();
      showToast('Dues cleared successfully!', 'success');
      setClearDuesAmount('');
      refetchStudent();
    } catch (err: any) {
      showToast(err?.data?.message || 'Failed to clear dues', 'error');
    }
  };

  // Vacate Seat
  const handleVacateSeat = async (seatId: string) => {
    const confirmed = await showAlert('Are you sure you want to vacate this seat?', {
      title: 'Vacate Seat',
      confirmText: 'Vacate Seat',
      cancelText: 'Cancel',
      type: 'danger',
    });
    if (!confirmed || !student) return;

    try {
      await vacateSeat({ id: seatId, studentProfileId: student.id }).unwrap();
      showToast('Seat vacated successfully!', 'success');
      refetchStudent();
    } catch (err: any) {
      showToast(err?.data?.message || 'Failed to vacate seat', 'error');
    }
  };

  // Delete Student
  const handleDeleteStudent = async () => {
    if (!student) return;
    const confirmed = await showAlert(
      'Are you sure you want to delete this student? This action cannot be undone and will remove all student records.',
      {
        title: 'Delete Student',
        confirmText: 'Delete Permanently',
        cancelText: 'Cancel',
        type: 'danger',
      }
    );
    if (!confirmed) return;

    try {
      await deleteStudent(student.id).unwrap();
      showToast('Student deleted successfully', 'success');
      navigate('/students');
    } catch (err: any) {
      showToast(err?.data?.message || 'Failed to delete student', 'error');
    }
  };

  // View full payment invoice modal
  const handleViewPaymentDetails = (payment: any) => {
    const shift = activeAllocation?.shift || shifts?.find((s: any) => s.id === payment.shiftId);

    const invoicePayload = {
      id: payment.id,
      receiptNumber:
        payment.receiptNumber ||
        payment.receiptNo ||
        `REC-${payment.id.slice(0, 8).toUpperCase()}`,
      invoiceNumber: payment.invoiceNumber || `INV-${payment.id.slice(0, 8).toUpperCase()}`,
      studentName: getStudentDisplayName(student),
      studentEmail: getStudentEmail(student),
      studentMobile: getStudentMobile(student),
      studentAadhar: student?.aadharNumber || '',
      studentBranch: getStudentBranchName(student),
      seatNumber: activeAllocation?.seat?.number || 'N/A',
      shiftName: shift?.name || 'Standard Shift',
      shiftTime: shift
        ? `${formatTo12hString(shift.startTime)} - ${formatTo12hString(shift.endTime)}`
        : '',
      planDuration: formatPlanDuration(
        payment.startDate || activeAllocation?.startDate,
        payment.endDate || activeAllocation?.endDate,
        'Monthly Plan'
      ),
      startDate: payment.startDate || activeAllocation?.startDate || new Date().toISOString(),
      endDate: payment.endDate || activeAllocation?.endDate || new Date().toISOString(),
      amount: Number(payment.amount || 0),
      totalAmount: Number(payment.totalAmount || payment.amount || 0),
      discountAmount: Number(payment.discountAmount || 0),
      paymentMethod: payment.method || 'CASH',
      status: getEffectivePaymentStatus(payment),
      paymentDate: payment.createdAt || new Date().toISOString(),
      branchAddress: branches?.find((b: any) => b.id === student?.branchId)?.address || '',
      branchPhone: branches?.find((b: any) => b.id === student?.branchId)?.contactPhone || '',
    };

    setCreatedInvoiceData(invoicePayload);
    setOpenInvoiceReceipt(true);
  };

  // Open Edit Dialog
  const handleOpenEdit = () => {
    if (!student) return;
    const resolvedName = student.user?.name || student.displayName || student.name || '';
    const resolvedEmail = student.user?.email || student.contactEmail || student.email || '';
    const resolvedMobile = student.user?.mobile || student.contactMobile || student.mobile || '';

    setEditName(resolvedName);
    setEditEmail(resolvedEmail);
    setEditMobile(resolvedMobile);
    setEditGuardianName(student.guardianName || '');
    setEditGuardianMobile(student.guardianMobile || '');
    setEditAadharNumber(student.aadharNumber || '');
    setEditBranchId(student.branchId || '');

    const activeAlloc = student.allocations?.find((a: any) => a.isActive) || student.allocations?.[0];
    if (activeAlloc) {
      setEditAllocationId(activeAlloc.id);
      const startStr = formatYYYYMMDD(activeAlloc.startDate);
      const endStr = formatYYYYMMDD(activeAlloc.endDate);
      setEditSubscriptionStart(startStr);
      setEditSubscriptionEnd(endStr);
      if (startStr && endStr) {
        const s = new Date(startStr);
        const e = new Date(endStr);
        const diffDays = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        const diffMonths = Math.round(diffDays / 30);
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

  // Save Edit Student
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;

    const newErrors: Record<string, string> = {};
    if (!editName.trim()) newErrors.name = 'Name is required';
    if (!editEmail.trim()) newErrors.email = 'Email is required';
    else if (!isValidEmail(editEmail.trim())) newErrors.email = 'Invalid email address';
    if (!editMobile.trim()) newErrors.mobile = 'Mobile is required';

    if (editAllocationId) {
      if (!editSubscriptionStart) newErrors.subscriptionStart = 'Subscription Start date is required';
      if (!editSubscriptionEnd) newErrors.subscriptionEnd = 'Subscription End date is required';
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
        id: student.id,
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
      refetchStudent();
    } catch (err: any) {
      showToast(getErrorMessage(err, 'Failed to update student details'), 'error');
    }
  };

  // Submit Seat Renewal
  const handleRenewSeat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAllocation || !activeAllocation.seatId || !student) return;

    const selectedShift = shifts?.find((s: any) => s.id === renewShiftId);
    const planBasePrice = selectedShift ? calculatePlanPrice(selectedShift, renewDuration) : 0;
    const discountNum = parseFloat(renewDiscount) || 0;
    const renewPaid = Number(renewAmount) || 0;
    const payable = Math.max(0, planBasePrice - discountNum);
    const remainingDue = Math.max(0, payable - renewPaid);
    const studentExistingDue = student?.dueAmount ? Number(student.dueAmount) : 0;

    if (planBasePrice > 0) {
      if (discountNum > planBasePrice) {
        showToast(`Discount (₹${discountNum}) cannot exceed the plan price (₹${planBasePrice}).`, 'error');
        return;
      }
      if (renewPaid > payable) {
        showToast(
          `Amount paid (₹${renewPaid}) cannot exceed net payable (₹${payable}) when discount is ₹${discountNum}.`,
          'error'
        );
        return;
      }
    }

    setIsRenewing(true);
    try {
      const studentProfileId = activeAllocation.studentProfileId || student.id;

      // 1. Vacate current seat allocation
      await vacateSeat({
        id: activeAllocation.seatId,
        studentProfileId,
      }).unwrap();

      // 2. Re-allocate with new shift and dates
      await allocateSeat({
        studentProfileId,
        seatId: activeAllocation.seatId,
        shiftId: renewShiftId,
        startDate: renewStartDate,
        endDate: renewEndDate,
      }).unwrap();

      // 3. Create payment invoice record
      const paymentResult = await createPayment({
        studentProfileId,
        amount: renewPaid,
        method: renewPaymentMethod,
        shiftId: renewShiftId || undefined,
        durationMonths: typeof renewDuration === 'number' ? renewDuration : undefined,
        totalAmount: planBasePrice,
        discountAmount: discountNum > 0 ? discountNum : undefined,
        notes: typeof renewDuration === 'string' ? `Plan Duration: ${renewDuration}` : undefined,
      }).unwrap();

      const invoiceInfo = {
        payment: paymentResult?.payment || paymentResult,
        student,
        seatNumber: activeAllocation.seat?.number || activeAllocation.seat?.seatNumber,
        shift: selectedShift,
        startDate: renewStartDate,
        endDate: renewEndDate,
        branchName: getStudentBranchName(student),
        originalAmount: planBasePrice,
        payableAmount: payable,
        discountAmount: discountNum,
        paidAmount: renewPaid,
        dueAmount: remainingDue,
        previousDue: studentExistingDue,
        totalDue: remainingDue + studentExistingDue,
      };

      if (renewPaymentMethod === 'RAZORPAY' && paymentResult?.razorpayOrder) {
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          showToast('Failed to load Razorpay SDK. Check internet connection.', 'error');
          setIsRenewing(false);
          return;
        }

        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_T9hh97PsK4bGuG',
          amount: paymentResult.razorpayOrder.amount,
          currency: paymentResult.razorpayOrder.currency,
          name: user?.workspace?.name || 'Library Workspace',
          description: `Seat ${activeAllocation.seat?.number || ''} Renewal`,
          order_id: paymentResult.razorpayOrder.id,
          handler: async function (response: any) {
            try {
              const verifiedPayment = await verifyRazorpay({
                id: paymentResult.payment.id,
                transactionId: response.razorpay_payment_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              }).unwrap();

              showToast('Payment verified & seat renewed successfully!', 'success');
              setCreatedInvoiceData({
                ...invoiceInfo,
                payment: verifiedPayment?.payment || verifiedPayment,
              });
              setOpenInvoiceReceipt(true);
              setActiveTab('DETAILS');
              refetchStudent();
            } catch (vErr: any) {
              showToast(vErr?.data?.message || 'Payment verification failed', 'error');
            }
          },
          prefill: {
            name: getStudentDisplayName(student),
            email: getStudentEmail(student),
            contact: getStudentMobile(student),
          },
          theme: { color: '#2563EB' },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } else {
        showToast('Seat renewed successfully!', 'success');
        setCreatedInvoiceData(invoiceInfo);
        setOpenInvoiceReceipt(true);
        setActiveTab('DETAILS');
        refetchStudent();
      }
    } catch (err: any) {
      showToast(err?.data?.message || 'Failed to renew seat', 'error');
    } finally {
      setIsRenewing(false);
    }
  };

  if (!studentId) {
    return (
      <div style={{ maxWidth: '500px', margin: '4rem auto', padding: '1rem', textAlign: 'center' }}>
        <div className="sp-card" style={{ padding: '2.5rem 1.5rem', alignItems: 'center', textAlign: 'center' }}>
          <User size={48} color="#94a3b8" />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0.5rem 0' }}>
            No Student Selected
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 1.25rem' }}>
            Please select a student record from the directory to view their complete profile.
          </p>
          <Button variant="primary" onClick={() => navigate('/students')}>
            Go to Students Directory
          </Button>
        </div>
      </div>
    );
  }

  if (isStudentLoading && !student) return <LoadingState label="Loading student profile details…" />;
  if (studentError) return <QueryFeedback error={studentError} fetching={isStudentLoading} onRetry={refetchStudent} />;
  if (!student) return null;

  return (
    <div className="sp-container">
      {/* 1. Top Breadcrumb & Actions Bar */}
      <div className="sp-topbar">
        <div className="sp-breadcrumb-wrap">
          <button className="sp-back-btn" onClick={() => navigate('/students')}>
            <ArrowLeft size={15} /> Back
          </button>
          <div className="sp-breadcrumb-trail">
            <span className="sp-breadcrumb-parent" onClick={() => navigate('/students')}>Students</span>
            <span className="sp-breadcrumb-separator">/</span>
            <span className="sp-breadcrumb-current">{getStudentDisplayName(student)}</span>
          </div>
        </div>

        <div className="sp-topbar-actions">
          <Button
            variant="primary"
            type="button"
            onClick={handleOpenEdit}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', padding: '0.5rem 1rem' }}
          >
            <Edit2 size={14} /> Edit Profile
          </Button>
          <Button
            variant="outline"
            type="button"
            onClick={handleDeleteStudent}
            isLoading={isDeletingStudent}
            style={{
              color: '#dc2626',
              borderColor: 'rgba(239, 68, 68, 0.3)',
              backgroundColor: '#fef2f2',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.85rem',
              padding: '0.5rem 0.85rem',
            }}
          >
            <Trash2 size={14} /> Delete
          </Button>
        </div>
      </div>

      {/* 2. Hero Identity Banner Card */}
      <div className="sp-hero-card">
        <div className="sp-hero-left">
          <div className="sp-avatar-wrap">
            <div
              className="sp-avatar"
              style={{
                background:
                  student.user?.avatar || student.avatar
                    ? `url(${student.user?.avatar || student.avatar}) no-repeat center center / cover`
                    : 'var(--accent-blue)',
              }}
            >
              {!(student.user?.avatar || student.avatar) && getStudentInitials(student)}
            </div>
            <label
              htmlFor={`student-hero-avatar-${student.id}`}
              className="sp-avatar-upload-label"
              title="Upload student photo"
            >
              <Camera size={11} />
            </label>
            <input
              id={`student-hero-avatar-${student.id}`}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleStudentAvatarUpload}
            />
          </div>

          <div className="sp-hero-info">
            <div className="sp-hero-name-row">
              <h1 className="sp-hero-name">{getStudentDisplayName(student)}</h1>
              {student.status && (
                <span className={`sp-status-badge sp-status-${student.status.toLowerCase()}`}>
                  {student.status}
                </span>
              )}
              {student.aadharNumber && (
                <span
                  style={{
                    fontSize: '0.7rem',
                    color: '#64748b',
                    background: '#f1f5f9',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontWeight: 600,
                  }}
                >
                  UIDAI: {student.aadharNumber}
                </span>
              )}
            </div>

            <div className="sp-hero-meta-row">
              <span className="sp-hero-meta-item">
                <Mail size={13} style={{ color: 'var(--accent-blue)' }} /> {getStudentEmail(student)}
              </span>
              <span className="sp-hero-meta-item">
                <Phone size={13} style={{ color: 'var(--accent-blue)' }} /> {getStudentMobile(student)}
              </span>
              <span className="sp-hero-meta-item">
                <Building2 size={13} style={{ color: 'var(--accent-blue)' }} /> {getStudentBranchName(student)}
              </span>
            </div>
          </div>
        </div>

        {/* Hero Right Metric Badges */}
        <div className="sp-hero-metrics">
          <div className={`sp-metric-tile ${activeAllocation ? 'active-seat' : ''}`}>
            <span className="sp-metric-label">{activeAllocation ? 'Current Seat' : 'Seat Status'}</span>
            <span className="sp-metric-value">
              {activeAllocation ? `Seat ${activeAllocation.seat?.number}` : 'Unassigned'}
            </span>
            <span className="sp-metric-sub">
              {activeAllocation ? (
                `${activeAllocation.shift?.name || 'Shift'} • ${getDaysRemainingText(activeAllocation.endDate)}`
              ) : (
                'No seat active'
              )}
            </span>
          </div>

          <div className={`sp-metric-tile ${student.dueAmount > 0 ? 'due-alert' : ''}`}>
            <span className="sp-metric-label">{student.dueAmount > 0 ? 'Outstanding Due' : 'Fees & Dues'}</span>
            <span className="sp-metric-value">
              {student.dueAmount > 0 ? `₹${student.dueAmount}` : 'All Clear'}
            </span>
            <span className="sp-metric-sub">
              {student.dueAmount > 0 ? 'Payment pending' : 'Zero outstanding balance'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Main Grid Layout (Left: Identity/Seat • Right: Financial Ledger/Renewal) */}
      <div className="sp-grid">
        {/* ================= LEFT COLUMN ================= */}
        <div className="sp-sidebar">
          {/* Outstanding Dues Alert Box (if dues > 0) */}
          {student.dueAmount > 0 && (
            <div className="sp-dues-card">
              <div className="sp-dues-header">
                <div className="sp-dues-title">
                  <AlertTriangle size={17} color="#dc2626" />
                  <span>Pending Dues Notice</span>
                </div>
                <span className="sp-dues-amount">₹{student.dueAmount}</span>
              </div>
              <form onSubmit={handleClearDues} className="sp-dues-form">
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.68rem', fontWeight: 700, color: '#991b1b', display: 'block', marginBottom: '4px' }}>
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    required
                    value={clearDuesAmount}
                    onChange={(e) => setClearDuesAmount(e.target.value)}
                    max={student.dueAmount}
                    placeholder="Pay amount"
                    style={{
                      height: '38px',
                      padding: '0 10px',
                      fontSize: '0.85rem',
                      borderRadius: '8px',
                      border: '1px solid #fca5a5',
                      width: '100%',
                      boxSizing: 'border-box',
                      backgroundColor: '#ffffff',
                      outline: 'none',
                    }}
                  />
                </div>
                <div style={{ width: '100px' }}>
                  <label style={{ fontSize: '0.68rem', fontWeight: 700, color: '#991b1b', display: 'block', marginBottom: '4px' }}>
                    Method
                  </label>
                  <Select
                    value={clearDuesMethod}
                    onChange={(val: any) => setClearDuesMethod(val)}
                    options={[
                      { value: 'UPI', label: 'UPI' },
                      { value: 'CASH', label: 'Cash' },
                      { value: 'RAZORPAY', label: 'Online' },
                    ]}
                  />
                </div>
                <Button
                  type="submit"
                  variant="primary"
                  style={{
                    backgroundColor: '#dc2626',
                    borderColor: '#dc2626',
                    height: '38px',
                    padding: '0 14px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    borderRadius: '8px',
                  }}
                  disabled={!clearDuesAmount || isClearingDues}
                  isLoading={isClearingDues}
                >
                  Pay
                </Button>
              </form>
            </div>
          )}

          {/* Seat & Subscription Card */}
          <div className="sp-card">
            <div className="sp-card-header">
              <h3 className="sp-card-title">
                <Armchair size={16} color="var(--accent-blue)" /> Seat & Subscription
              </h3>
              {activeAllocation && (
                <span className="sp-prop-pill valid">
                  <CheckCircle2 size={12} /> Assigned
                </span>
              )}
            </div>

            {activeAllocation ? (
              <>
                <div className="sp-seat-banner">
                  <div>
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#1e40af', textTransform: 'uppercase' }}>
                      Allocated Seat
                    </span>
                    <div className="sp-seat-hero-num">Seat {activeAllocation.seat?.number}</div>
                    <div className="sp-seat-shift-title">{activeAllocation.shift?.name}</div>
                    <div className="sp-seat-shift-time">
                      {formatTo12hString(activeAllocation.shift?.startTime)} - {formatTo12hString(activeAllocation.shift?.endTime)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                      Validity
                    </span>
                    <span className="sp-prop-pill valid" style={{ fontSize: '0.72rem' }}>
                      <Clock size={11} /> {getDaysRemainingText(activeAllocation.endDate)}
                    </span>
                  </div>
                </div>

                <div className="sp-prop-list">
                  <div className="sp-prop-row">
                    <span className="sp-prop-label">Plan Duration:</span>
                    <span className="sp-prop-value">
                      {formatPlanDuration(activeAllocation.startDate, activeAllocation.endDate, activeSub?.plan?.name)}
                    </span>
                  </div>
                  <div className="sp-prop-row">
                    <span className="sp-prop-label">Start Date:</span>
                    <span className="sp-prop-value">{new Date(activeAllocation.startDate).toLocaleDateString()}</span>
                  </div>
                  <div className="sp-prop-row">
                    <span className="sp-prop-label">Expiry Date:</span>
                    <span className="sp-prop-value">{new Date(activeAllocation.endDate).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="sp-card-actions">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      navigate(`/transfer-seat?allocationId=${activeAllocation.id}&studentId=${student.id}`)
                    }
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                    }}
                  >
                    <Armchair size={13} /> Transfer Seat
                  </Button>
                  <button
                    type="button"
                    className="sp-btn-vacate"
                    onClick={() => handleVacateSeat(activeAllocation.seatId)}
                    disabled={isVacating}
                  >
                    <LogOut size={13} style={{ transform: 'rotate(180deg)' }} /> Vacate Seat
                  </button>
                </div>
              </>
            ) : (
              <div className="sp-empty-seat">
                <Armchair size={36} color="#94a3b8" />
                <span className="sp-empty-seat-text">No active seat allocated currently</span>

                {activeSub && (
                  <div
                    style={{
                      backgroundColor: '#eff6ff',
                      border: '1px solid #bfdbfe',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      fontSize: '0.75rem',
                      color: '#1e3a8a',
                      fontWeight: 600,
                      width: '100%',
                      boxSizing: 'border-box',
                      textAlign: 'left',
                    }}
                  >
                    <div><strong>Paid Plan:</strong> {activeSub.plan?.name || 'Standard'}</div>
                    <div style={{ marginTop: '2px', color: '#2563eb' }}>
                      <strong>Time:</strong> {formatPlanDuration(activeSub.startDate, activeSub.endDate, '1 Month')}
                    </div>
                  </div>
                )}

                <Button
                  type="button"
                  variant="primary"
                  onClick={() => {
                    navigate('/seats', {
                      state: {
                        preselectedStudentId: student.id,
                        preselectedStudentName: getStudentDisplayName(student),
                      },
                    });
                    showToast('Select an available seat to assign to ' + getStudentDisplayName(student), 'info');
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                  }}
                >
                  <Plus size={14} /> Allot Seat Now
                </Button>
              </div>
            )}
          </div>

          {/* Personal & Guardian Information Card */}
          <div className="sp-card">
            <div className="sp-card-header">
              <h3 className="sp-card-title">
                <User size={16} color="var(--accent-blue)" /> Personal & Guardian Details
              </h3>
            </div>

            <div className="sp-prop-list">
              <div className="sp-prop-row">
                <span className="sp-prop-label">Guardian Name:</span>
                <span className="sp-prop-value">{student.guardianName || 'N/A'}</span>
              </div>
              <div className="sp-prop-row">
                <span className="sp-prop-label">Guardian Mobile:</span>
                <span className="sp-prop-value">{student.guardianMobile || 'N/A'}</span>
              </div>
              <div className="sp-prop-row">
                <span className="sp-prop-label">Branch Location:</span>
                <span className="sp-prop-value">{getStudentBranchName(student)}</span>
              </div>
              <div className="sp-prop-row">
                <span className="sp-prop-label">Aadhar Card:</span>
                <span className="sp-prop-value">{student.aadharNumber || 'N/A'}</span>
              </div>
              <div className="sp-prop-row">
                <span className="sp-prop-label">Login Password:</span>
                <div className="sp-password-box">
                  <span className="sp-password-text">
                    {showPassword ? student.user?.rawPassword || 'Student@123' : '••••••••'}
                  </span>
                  <button
                    type="button"
                    className="sp-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= RIGHT COLUMN ================= */}
        <div className="sp-main-content">
          {/* Segmented Navigation Tab Bar */}
          <div className="sp-tabs-nav">
            <div className="sp-tab-pills">
              <button
                type="button"
                className={`sp-tab-btn ${activeTab === 'DETAILS' ? 'active' : ''}`}
                onClick={() => setActiveTab('DETAILS')}
              >
                <CreditCard size={15} /> Payment Ledger History
                <span className="sp-tab-counter">{student.payments?.length || 0}</span>
              </button>

              {activeAllocation && (
                <button
                  type="button"
                  className={`sp-tab-btn ${activeTab === 'RENEW' ? 'active' : ''}`}
                  onClick={() => setActiveTab('RENEW')}
                >
                  <Repeat size={15} /> Renew Subscription
                </button>
              )}
            </div>

          </div>

          {/* TAB 1: PAYMENT LEDGER */}
          {activeTab === 'DETAILS' && (
            <>
              {/* Financial Quick Summary Bar */}
              <div className="sp-ledger-summary">
                <div className="sp-summary-box">
                  <span className="sp-summary-label">Total Fee Paid</span>
                  <span className="sp-summary-value" style={{ color: 'var(--status-emerald, #059669)' }}>
                    ₹{totalPaid.toFixed(2)}
                  </span>
                </div>
                <div className="sp-summary-box">
                  <span className="sp-summary-label">Total Invoices</span>
                  <span className="sp-summary-value">{student.payments?.length || 0}</span>
                </div>
                <div className="sp-summary-box">
                  <span className="sp-summary-label">Account Balance</span>
                  <span
                    className="sp-summary-value"
                    style={{ color: student.dueAmount > 0 ? '#dc2626' : 'var(--text-navy, #0f172a)' }}
                  >
                    {student.dueAmount > 0 ? `₹${student.dueAmount} Due` : 'Settled'}
                  </span>
                </div>
              </div>

              {/* Transactions List */}
              {student.payments && student.payments.length > 0 ? (
                <div className="sp-ledger-list">
                  {student.payments.map((payment: any) => {
                    const effStatus = getEffectivePaymentStatus(payment);
                    const hasDiscount = Number(payment.discountAmount || 0) > 0;
                    const hasTotal = Number(payment.totalAmount || 0) > Number(payment.amount || 0);

                    return (
                      <div
                        key={payment.id}
                        className="sp-ledger-card"
                        onClick={() => handleViewPaymentDetails(payment)}
                        role="button"
                        tabIndex={0}
                        title="Click to view tax invoice and receipt"
                      >
                        <div className="sp-ledger-left">
                          <div className="sp-ledger-amount-row">
                            <span className="sp-ledger-amount">₹{Number(payment.amount || 0).toFixed(2)}</span>
                            {(hasTotal || hasDiscount) && (
                              <span className="sp-ledger-breakdown">
                                ({hasTotal ? `Plan: ₹${Number(payment.totalAmount).toFixed(0)}` : ''}
                                {hasDiscount ? ` • Disc: -₹${Number(payment.discountAmount).toFixed(0)}` : ''})
                              </span>
                            )}
                          </div>
                          <div className="sp-ledger-meta">
                            <Calendar size={12} />
                            <span>{new Date(payment.createdAt).toLocaleDateString()}</span>
                            <span>•</span>
                            <span style={{ fontWeight: 600 }}>{payment.method}</span>
                          </div>
                        </div>

                        <div className="sp-ledger-right">
                          <span className={`sp-ledger-status ${effStatus.toLowerCase()}`}>
                            {effStatus}
                          </span>
                          <span className="sp-ledger-view-btn">
                            <FileText size={12} /> Invoice
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="sp-empty-ledger">
                  <CreditCard size={36} color="#94a3b8" />
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>No Payment Records Found</span>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    Payments and subscription invoices will appear here once recorded.
                  </span>
                </div>
              )}
            </>
          )}

          {/* TAB 2: RENEW SUBSCRIPTION */}
          {activeTab === 'RENEW' && (
            <div className="sp-card" style={{ padding: '1.75rem' }}>
              {activeAllocation ? (
                <>
                  <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-navy)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Repeat size={17} color="var(--accent-blue)" /> Renew Subscription
                    </h3>
                    <span style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px', display: 'block' }}>
                      Renew seat #{activeAllocation.seat?.number} for {getStudentDisplayName(student)}
                    </span>
                  </div>

                  <RenewSeatForm
                    shifts={shifts}
                    renewShiftId={renewShiftId}
                    onShiftChange={setRenewShiftId}
                    renewDuration={renewDuration}
                    onDurationChange={setRenewDuration}
                    renewStartDate={renewStartDate}
                    onStartDateChange={setRenewStartDate}
                    renewEndDate={renewEndDate}
                    onEndDateChange={setRenewEndDate}
                    renewAmount={renewAmount}
                    onAmountChange={setRenewAmount}
                    renewDiscount={renewDiscount}
                    onDiscountChange={handleRenewDiscountChange}
                    previousDue={student?.dueAmount ? Number(student.dueAmount) : 0}
                    renewPaymentMethod={renewPaymentMethod}
                    onPaymentMethodChange={setRenewPaymentMethod}
                    hideHeader={true}
                    onSubmit={handleRenewSeat}
                    isRenewing={isRenewing}
                  />
                </>
              ) : (
                <div className="sp-empty-seat">
                  <Armchair size={36} color="#94a3b8" />
                  <span>No active seat allocation found to renew.</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Student Modal */}
      <Modal
        isOpen={openEdit}
        onClose={() => setOpenEdit(false)}
        title="Edit Student Information"
        maxWidth="md"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <Button variant="outline" type="button" onClick={() => setOpenEdit(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="button"
              onClick={handleSaveEdit}
              isLoading={isUpdatingStudent || isUpdatingAllocation}
            >
              Save Changes
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
                Full Name *
              </label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Student full name"
                error={editErrors.name}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
                Email Address *
              </label>
              <Input
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="student@example.com"
                error={editErrors.email}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
                Mobile Number *
              </label>
              <Input
                value={editMobile}
                onChange={(e) => setEditMobile(e.target.value)}
                placeholder="10-digit mobile"
                error={editErrors.mobile}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
                Aadhar Card Number
              </label>
              <Input
                value={editAadharNumber}
                onChange={(e) => setEditAadharNumber(e.target.value)}
                placeholder="12-digit Aadhar"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
                Guardian Name
              </label>
              <Input
                value={editGuardianName}
                onChange={(e) => setEditGuardianName(e.target.value)}
                placeholder="Parent / Guardian Name"
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
                Guardian Mobile
              </label>
              <Input
                value={editGuardianMobile}
                onChange={(e) => setEditGuardianMobile(e.target.value)}
                placeholder="Guardian Phone"
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
              Branch
            </label>
            <Select
              value={editBranchId}
              onChange={(val) => setEditBranchId(val)}
              options={branches?.map((b: any) => ({ value: b.id, label: b.name })) || []}
            />
          </div>

          {editAllocationId && (
            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a' }}>
                Subscription Dates (Active Seat)
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '3px' }}>
                    Start Date
                  </label>
                  <DatePicker
                    value={editSubscriptionStart}
                    onChange={(val) => {
                      setEditSubscriptionStart(val);
                      if (val) {
                        const calculatedEnd = calculateSubscriptionEndDate(val, editDurationMonths);
                        if (calculatedEnd) setEditSubscriptionEnd(calculatedEnd);
                      }
                    }}
                    placeholder="YYYY-MM-DD"
                  />
                  {editErrors.subscriptionStart && (
                    <span style={{ fontSize: '0.7rem', color: 'var(--status-red)' }}>{editErrors.subscriptionStart}</span>
                  )}
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '3px' }}>
                    End Date
                  </label>
                  <DatePicker
                    value={editSubscriptionEnd}
                    onChange={(val) => setEditSubscriptionEnd(val)}
                    placeholder="YYYY-MM-DD"
                  />
                  {editErrors.subscriptionEnd && (
                    <span style={{ fontSize: '0.7rem', color: 'var(--status-red)' }}>{editErrors.subscriptionEnd}</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </form>
      </Modal>

      {/* Invoice Receipt Modal */}
      <InvoiceReceiptModal
        isOpen={openInvoiceReceipt}
        onClose={() => setOpenInvoiceReceipt(false)}
        createdInvoiceData={createdInvoiceData}
      />
    </div>
  );
}
