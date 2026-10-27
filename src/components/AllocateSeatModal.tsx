import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import { useAllocateSeatMutation, useVacateSeatMutation, useCreatePaymentMutation, useGetStudentsQuery, useGetStudentPaymentsQuery, useVerifyRazorpayMutation } from '../store/api';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Select } from './ui/Select';
import { Switch } from './ui/Switch';
import { DatePicker } from './ui/DatePicker';
import { useToast } from './ui/ToastContext';
import { Search, Plus, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatYYYYMMDD, addMonthsToDate, addDaysToDate, formatTo12hString, calculateShiftDuration } from '../utils/dateUtils';
import { getAvailableSeatShifts, getSeatStatusInfo } from '../utils/seatUtils';
import { getStudentDisplayName, getStudentEmail, getStudentMobile } from '../utils/studentUtils';
interface AllocateSeatModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSeat: any;
  shifts: any[] | undefined;
  branches: any[] | undefined;
  selectedBranch: string;
  seatMap: any[] | undefined;
  onSuccess: (invoiceInfo: any) => void;
  preselectedStudentId?: string;
  preselectedJoiningDate?: string;
  preselectedShiftId?: string;
}

export const AllocateSeatModal: React.FC<AllocateSeatModalProps> = ({
  isOpen,
  onClose,
  selectedSeat,
  shifts,
  branches,
  selectedBranch,
  seatMap,
  onSuccess,
  preselectedStudentId,
  preselectedJoiningDate,
  preselectedShiftId,
}) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { data: studentsData } = useGetStudentsQuery(undefined);
  const [allocateSeat, { isLoading: isAllocating }] = useAllocateSeatMutation();
  const [vacateSeat] = useVacateSeatMutation();
  const [createPayment, { isLoading: isCreatingPayment }] = useCreatePaymentMutation();
  const [verifyRazorpay] = useVerifyRazorpayMutation();

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const [studentProfileId, setStudentProfileId] = useState(preselectedStudentId || '');
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [shiftId, setShiftId] = useState(preselectedShiftId || '');
  const [startDate, setStartDate] = useState(() => formatYYYYMMDD(preselectedJoiningDate) || formatYYYYMMDD(new Date()));
  const [endDate, setEndDate] = useState(() => {
    const base = formatYYYYMMDD(preselectedJoiningDate) || formatYYYYMMDD(new Date());
    const end = new Date(base);
    end.setMonth(end.getMonth() + 1);
    return formatYYYYMMDD(end);
  });
  const [durationMode, setDurationMode] = useState<number | string>('');
  const [shouldGenerateInvoice, setShouldGenerateInvoice] = useState(true);
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI' | 'RAZORPAY'>('CASH');
  const [discountAmount, setDiscountAmount] = useState('');
  const [prefilledPayment, setPrefilledPayment] = useState<any>(null);

  const prevIsOpenRef = useRef(false);
  const syncedStudentIdRef = useRef<string | null>(null);

  // Active allocations for selected seat
  const activeAllocations = useMemo(() => {
    if (!selectedSeat) return [];
    return getSeatStatusInfo(selectedSeat).currentAllocations;
  }, [selectedSeat]);

  // Compute available shifts for selected seat
  const availableShifts = useMemo(() => {
    if (!shifts || !selectedSeat) return [];
    return getAvailableSeatShifts(selectedSeat, shifts, startDate, endDate, studentProfileId);
  }, [shifts, selectedSeat, startDate, endDate, studentProfileId]);

  // Selected student object
  const selectedStudent = useMemo(() => {
    if (!studentProfileId || !studentsData?.students) return null;
    return studentsData.students.find((s: any) => s.id === studentProfileId) || null;
  }, [studentProfileId, studentsData]);

  // Fetch payment history for student to get accurate admission payment records
  const { data: studentPaymentsData } = useGetStudentPaymentsQuery(
    studentProfileId,
    { skip: !studentProfileId }
  );

  // Combine payments from studentProfile and studentPaymentsData
  const allStudentPayments = useMemo(() => {
    const fromStudent = selectedStudent?.payments || [];
    const fromApi = studentPaymentsData?.payments || (Array.isArray(studentPaymentsData) ? studentPaymentsData : []);
    const combined = [...fromStudent, ...fromApi];
    const map = new Map<string, any>();
    combined.forEach((p: any) => {
      if (p && p.id) map.set(p.id, p);
    });
    return Array.from(map.values()).sort(
      (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [selectedStudent, studentPaymentsData]);

  // One-time initialization only when modal transitions from closed to open
  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      const baseDate = formatYYYYMMDD(preselectedJoiningDate) || formatYYYYMMDD(new Date());
      setStartDate(baseDate);
      const end = new Date(baseDate);
      end.setMonth(end.getMonth() + 1);
      setEndDate(formatYYYYMMDD(end));

      if (preselectedStudentId) {
        setStudentProfileId(preselectedStudentId);
        const student = studentsData?.students?.find((s: any) => s.id === preselectedStudentId);
        if (student) {
          setStudentSearchQuery(getStudentDisplayName(student));
        } else {
          setStudentSearchQuery('');
        }
      } else {
        setStudentProfileId('');
        setStudentSearchQuery('');
      }

      setShiftId(preselectedShiftId || '');
      setDurationMode('');
      setShouldGenerateInvoice(true);
      setInvoiceAmount('');
      setPaymentMethod('CASH');
      setDiscountAmount('');
      setPrefilledPayment(null);
      syncedStudentIdRef.current = null;
    } else if (!isOpen && prevIsOpenRef.current) {
      syncedStudentIdRef.current = null;
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, preselectedStudentId, preselectedJoiningDate, preselectedShiftId, studentsData]);

  // When preselectedStudentId is active and studentsData finishes loading, update display name
  useEffect(() => {
    if (isOpen && preselectedStudentId && !studentSearchQuery && studentsData?.students) {
      const student = studentsData.students.find((s: any) => s.id === preselectedStudentId);
      if (student) {
        setStudentSearchQuery(getStudentDisplayName(student));
      }
    }
  }, [isOpen, preselectedStudentId, studentSearchQuery, studentsData]);

  // Ensure shift is selected whenever availableShifts loads
  useEffect(() => {
    if (isOpen && availableShifts.length > 0) {
      if (!shiftId || !availableShifts.some((s: any) => s.id === shiftId)) {
        const targetShift = (preselectedShiftId && availableShifts.some((s: any) => s.id === preselectedShiftId))
          ? preselectedShiftId
          : availableShifts[0]?.id || '';
        if (targetShift) {
          setShiftId(targetShift);
        }
      }
    }
  }, [isOpen, availableShifts, shiftId, preselectedShiftId]);

  // Sync form inputs with student's active subscription and admission payment
  useEffect(() => {
    if (!isOpen || !studentProfileId || !selectedStudent) return;
    if (syncedStudentIdRef.current === studentProfileId) return;

    const activeSub = selectedStudent.subscriptions?.find((sub: any) => sub.status === 'ACTIVE') || selectedStudent.subscriptions?.[0];
    
    // Find matching payment for this subscription or admission
    const payment = allStudentPayments.find((p: any) => 
      (activeSub && (
        p.subscriptionPlanId === activeSub.subscriptionPlanId || 
        p.subscriptionPlanId === activeSub.plan?.id || 
        p.studentSubscriptionId === activeSub.id
      )) || !p.subscriptionPlanId
    ) || allStudentPayments[0] || null;

    if (activeSub) {
      // Match shift
      const matchingShift = shifts?.find((s: any) => 
        activeSub.plan?.name?.toLowerCase().includes(s.name.toLowerCase())
      );
      if (matchingShift) {
        setShiftId(matchingShift.id);
      } else if (preselectedShiftId) {
        setShiftId(preselectedShiftId);
      }
      
      // Match dates
      if (activeSub.startDate) {
        setStartDate(formatYYYYMMDD(activeSub.startDate));
      }
      if (activeSub.endDate) {
        setEndDate(formatYYYYMMDD(activeSub.endDate));
        let matchedDuration = 'flex';
        const planDurationDays = activeSub.plan?.durationDays;
        
        if (matchingShift?.customPricing && planDurationDays) {
          const getDurationDays = (label: string) => {
            const l = String(label).toLowerCase();
            const num = parseInt(l) || 1;
            if (l.includes('day')) return num;
            if (l.includes('month')) return num * 30;
            if (l.includes('year')) return num * 365;
            return 30;
          };
          
          const match = matchingShift.customPricing.find((cp: any) => getDurationDays(cp.label) === planDurationDays);
          if (match) {
            matchedDuration = match.label;
          }
        }
        setDurationMode(matchedDuration);
      }
    }

    if (payment) {
      setPaymentMethod(payment.method || 'CASH');
      setInvoiceAmount(payment.amount !== undefined ? Number(payment.amount).toString() : '0');
      const discount = payment.discountAmount ? Number(payment.discountAmount) : 0;
      setDiscountAmount(discount > 0 ? discount.toString() : '');
      setPrefilledPayment(payment);
    }

    syncedStudentIdRef.current = studentProfileId;
  }, [isOpen, studentProfileId, selectedStudent, allStudentPayments, shifts, preselectedShiftId]);

  // Duration modes calculations
  useEffect(() => {
    if (durationMode === 'flex' || !durationMode) return;
    if (!startDate) return;

    const getDurationDays = (label: string) => {
      const l = String(label).toLowerCase();
      const num = parseInt(l) || 1;
      if (l.includes('day')) return num;
      if (l.includes('month')) return num * 30;
      if (l.includes('year')) return num * 365;
      return 30;
    };

    setEndDate(addDaysToDate(startDate, getDurationDays(durationMode as string)));
  }, [startDate, durationMode]);

  // Student list search inside Allocate form
  const filteredStudents = useMemo(() => {
    if (!studentsData?.students) return [];
    const query = studentSearchQuery.trim().toLowerCase();

    // Gather set of student profile IDs who already have active allocations
    const allocatedIds = new Set<string>();
    if (seatMap) {
      seatMap.forEach((floor: any) => {
        floor.rooms?.forEach((room: any) => {
          room.seats?.forEach((seat: any) => {
            seat.allocations?.forEach((alloc: any) => {
              if (alloc.isActive && alloc.studentProfileId) {
                allocatedIds.add(alloc.studentProfileId);
              }
            });
          });
        });
      });
    }

    return studentsData.students.filter((student: any) => {
      // Exclude if already allocated to any seat
      if (allocatedIds.has(student.id)) return false;

      if (!query) return true;
      const displayName = getStudentDisplayName(student).toLowerCase();
      const mobile = getStudentMobile(student);
      const email = getStudentEmail(student).toLowerCase();
      return (
        displayName.includes(query) ||
        mobile.includes(query) ||
        email.includes(query)
      );
    });
  }, [studentsData, studentSearchQuery, seatMap]);

  const displayedStudents = useMemo(() => {
    return filteredStudents.slice(0, 8);
  }, [filteredStudents]);

  // Sync invoice amount with base plan price
  const calculatedBaseAmount = useMemo(() => {
    if (!shiftId || !shifts) return 0;
    const shift = shifts.find((s: any) => s.id === shiftId);
    if (!shift) return 0;
    const basePrice = shift.price || 0;

    if (durationMode === 'flex' && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        const diffTime = end.getTime() - start.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 0) {
          return Math.round(basePrice * (diffDays / 30));
        }
      }
      return basePrice;
    }

    if (shift.customPricing && Array.isArray(shift.customPricing)) {
      const cp = shift.customPricing.find((c: any) => c.label === durationMode);
      if (cp) return cp.price;
    }

    return basePrice;
  }, [shiftId, shifts, durationMode, startDate, endDate]);



  // Student existing outstanding balance from prior transactions
  const studentExistingDue = selectedStudent ? Number(selectedStudent.dueAmount) : 0;

  // Due calculation for this seat allocation booking
  const dueAmount = useMemo(() => {
    const paid = parseFloat(invoiceAmount) || 0;
    const discount = parseFloat(discountAmount) || 0;
    const netPayable = Math.max(0, calculatedBaseAmount - discount);
    return Math.max(0, netPayable - paid);
  }, [calculatedBaseAmount, invoiceAmount, discountAmount]);

  // Auto-fill invoice amount only for new bookings (when student does not already have an admission payment)
  useEffect(() => {
    if (prefilledPayment) return;
    if (selectedStudent && (selectedStudent.subscriptions?.length > 0 || allStudentPayments.length > 0)) {
      return;
    }
    if (calculatedBaseAmount > 0) {
      const discount = parseFloat(discountAmount) || 0;
      setInvoiceAmount(Math.max(0, calculatedBaseAmount - discount).toString());
    } else {
      setInvoiceAmount('');
    }
  }, [calculatedBaseAmount, discountAmount, prefilledPayment, selectedStudent, allStudentPayments.length]);

  const handleAllocate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSeat) return;
    if (!availableShifts.some((shift: any) => shift.id === shiftId)) {
      showToast('Select an available shift for these dates.', 'error');
      return;
    }

    const parsedDiscount = parseFloat(discountAmount) || 0;
    const parsedPaid = Number(invoiceAmount) || 0;
    const netPayable = Math.max(0, calculatedBaseAmount - parsedDiscount);

    if (shouldGenerateInvoice && calculatedBaseAmount > 0) {
      if (parsedDiscount > calculatedBaseAmount) {
        showToast(`Discount (₹${parsedDiscount}) cannot exceed the plan price (₹${calculatedBaseAmount}).`, 'error');
        return;
      }
      if (parsedPaid > netPayable) {
        showToast(`Collect amount (₹${parsedPaid}) cannot exceed net payable (₹${netPayable}) after discount.`, 'error');
        return;
      }
    }

    const paymentPayload = (shouldGenerateInvoice && !prefilledPayment) ? {
      amount: parsedPaid,
      method: paymentMethod,
      shiftId: shiftId || undefined,
      durationMonths: typeof durationMode === 'number' 
        ? durationMode 
        : (parseInt(String(durationMode), 10) || undefined),
      totalAmount: calculatedBaseAmount,
      discountAmount: parsedDiscount > 0 ? parsedDiscount : undefined,
    } : undefined;

    let allocResult: any = null;
    try {
      allocResult = await allocateSeat({
        studentProfileId,
        seatId: selectedSeat.id,
        shiftId,
        startDate,
        endDate,
        payment: paymentPayload,
      }).unwrap();
    } catch (allocErr: any) {
      // Backend automatically rolled back the entire transaction!
      showToast(allocErr.data?.message || 'Seat allocation failed', 'error');
      return;
    }

    if (shouldGenerateInvoice) {
      try {
        let paymentResult: any;
        const isSameAmount = prefilledPayment && Number(invoiceAmount) === Number(prefilledPayment.amount);
        const isSameMethod = prefilledPayment && paymentMethod === prefilledPayment.method;
        const isSameDiscount = prefilledPayment && Number(discountAmount || 0) === Number(prefilledPayment.discountAmount || 0);

        if (prefilledPayment && isSameAmount && isSameMethod && isSameDiscount) {
          paymentResult = { payment: prefilledPayment };
        } else if (allocResult?.payment) {
          // Payment was created and committed atomically with the seat allocation!
          paymentResult = {
            payment: allocResult.payment,
            razorpayOrder: allocResult.razorpayOrder,
          };
        } else {
          // Fallback if backend was called without inline payment
          paymentResult = await createPayment({
            studentProfileId,
            amount: parsedPaid,
            method: paymentMethod,
            shiftId: shiftId || undefined,
            durationMonths: typeof durationMode === 'number' 
              ? durationMode 
              : (parseInt(String(durationMode), 10) || undefined),
            totalAmount: calculatedBaseAmount,
            discountAmount: parsedDiscount > 0 ? parsedDiscount : undefined,
          }).unwrap();
        }

        const student = studentsData?.students?.find((s: any) => s.id === studentProfileId) || selectedStudent;
        const actualPayable = Math.max(0, calculatedBaseAmount - parsedDiscount);
        const remainingDue = Math.max(0, actualPayable - parsedPaid);
        const effectivePreviousDue = prefilledPayment ? 0 : studentExistingDue;
        const effectiveTotalDue = prefilledPayment ? Math.max(remainingDue, studentExistingDue) : remainingDue + studentExistingDue;

        const invoiceInfo = {
          payment: paymentResult.payment,
          student,
          seatNumber: selectedSeat?.number,
          shift: shifts?.find((s: any) => s.id === shiftId),
          startDate,
          endDate,
          branchName: branches?.find((b: any) => b.id === selectedBranch)?.name,
          originalAmount: calculatedBaseAmount,
          payableAmount: actualPayable,
          discountAmount: parsedDiscount,
          paidAmount: parsedPaid,
          dueAmount: remainingDue,
          previousDue: effectivePreviousDue,
          totalDue: effectiveTotalDue,
        };

        if (paymentMethod === 'RAZORPAY' && paymentResult.razorpayOrder) {
          const scriptLoaded = await loadRazorpayScript();
          if (!scriptLoaded) {
            showToast('Failed to load Razorpay SDK. Check internet connection. Reverting seat...', 'error');
            try {
              await vacateSeat({ id: selectedSeat.id, studentProfileId }).unwrap();
            } catch (e) {
              console.error('Failed to vacate seat on SDK error:', e);
            }
            return;
          }

          const options = {
            key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_T9hh97PsK4bGuG',
            amount: paymentResult.razorpayOrder.amount,
            currency: paymentResult.razorpayOrder.currency,
            name: user?.workspace?.name || 'N/A',
            description: `Seat ${selectedSeat.number} Allocation`,
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

                showToast('Payment verified & seat allocated successfully!', 'success');
                onSuccess({
                  ...invoiceInfo,
                  payment: verifiedPayment,
                });
              } catch (err: any) {
                showToast(err.data?.message || 'Payment verification failed. Reverting seat allocation.', 'error');
                try {
                  await vacateSeat({ id: selectedSeat.id, studentProfileId }).unwrap();
                } catch (e) {
                  console.error('Failed to vacate seat after verification error:', e);
                }
              }
            },
            modal: {
              ondismiss: async function () {
                showToast('Razorpay payment cancelled. Reverting seat allocation...', 'warning');
                try {
                  await vacateSeat({ id: selectedSeat.id, studentProfileId }).unwrap();
                } catch (e) {
                  console.error('Failed to vacate seat after dismiss:', e);
                }
              },
            },
            prefill: {
              name: getStudentDisplayName(student),
              email: getStudentEmail(student) === 'N/A' ? '' : getStudentEmail(student),
              contact: getStudentMobile(student) === 'N/A' ? '' : getStudentMobile(student),
            },
            theme: {
              color: '#2563eb',
            },
          };

          const rzp = new (window as any).Razorpay(options);
          rzp.open();
        } else {
          showToast('Seat allocated successfully!', 'success');
          onSuccess(invoiceInfo);
        }
      } catch (paymentErr: any) {
        showToast(paymentErr.data?.message || 'Payment processing failed. Reverting seat allocation...', 'error');
        try {
          await vacateSeat({ id: selectedSeat.id, studentProfileId }).unwrap();
        } catch (e) {
          console.error('Failed to revert seat:', e);
        }
      }
    } else {
      showToast('Seat allocated successfully!', 'success');
      onSuccess(null);
    }
  };

  if (!selectedSeat) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Allocate Seat ${selectedSeat?.number}`}
      maxWidth="lg"
    >
      <form onSubmit={handleAllocate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' }}>
          {/* Left Column: Student & Shift */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Shared Seat Info / Warning */}
            {activeAllocations.length > 0 && (
              <div style={{ padding: '10px 12px', backgroundColor: '#eff6ff', border: '1px solid #dbeafe', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  ℹ️ Shared Seat Allocation
                </span>
                <span style={{ fontSize: '0.675rem', color: 'var(--text-navy)', lineHeight: '1.3' }}>
                  This seat is already occupied by:
                  <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                    {activeAllocations.map((alloc: any) => (
                      <li key={alloc.id}>
                        <strong>{alloc.shift?.name}</strong>: {getStudentDisplayName(alloc.studentProfile)}
                      </li>
                    ))}
                  </ul>
                </span>
              </div>
            )}

            {/* Student Search */}
            <div style={{ position: 'relative' }}>
              <label className="custom-input-label" style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-slate)', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>Search Student</label>
              <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: '12px', padding: '4px 12px', border: isSearchFocused ? '1px solid var(--accent-blue)' : '1px solid transparent', transition: 'all 150ms ease' }}>
                <Search size={16} style={{ color: '#94a3b8', marginRight: '6px' }} />
                <input
                  type="text"
                  placeholder="Name, email, phone..."
                  value={studentSearchQuery}
                  onChange={(e) => {
                    setStudentSearchQuery(e.target.value);
                    setShowStudentDropdown(true);
                    if (studentProfileId) setStudentProfileId('');
                  }}
                  onFocus={() => { setShowStudentDropdown(true); setIsSearchFocused(true); }}
                  onBlur={() => { setIsSearchFocused(false); setTimeout(() => setShowStudentDropdown(false), 250); }}
                  style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', padding: '6px 0', fontSize: '0.85rem', color: 'var(--text-navy)' }}
                />
              </div>

              {studentProfileId && selectedStudent && Number(selectedStudent.dueAmount) > 0 && (
                <div style={{ padding: '8px 12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#991b1b' }}>
                    ⚠️ Outstanding Dues:
                  </span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#991b1b' }}>₹{Number(selectedStudent.dueAmount).toFixed(2)}</span>
                </div>
              )}

              {showStudentDropdown && displayedStudents.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: '#ffffff', border: '1px solid var(--border-card)', borderRadius: '12px', boxShadow: 'var(--shadow-hover)', zIndex: 1000, marginTop: '4px', maxHeight: '180px', overflowY: 'auto' }}>
                  {displayedStudents.map((st: any) => (
                    <div
                      key={st.id}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setStudentProfileId(st.id);
                        setStudentSearchQuery(getStudentDisplayName(st));
                        setShowStudentDropdown(false);
                      }}
                      style={{ padding: '8px 12px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9' }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-navy)' }}>{getStudentDisplayName(st)}</span>
                        <span style={{ fontSize: '0.675rem', color: 'var(--text-slate)' }}>{getStudentEmail(st)} • {getStudentMobile(st)}</span>
                      </div>
                      {Number(st.dueAmount) > 0 && (
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--status-red)', backgroundColor: '#fef2f2', border: '1px solid #fecaca', padding: '2px 6px', borderRadius: '6px', whiteSpace: 'nowrap' }}>
                          Due: ₹{st.dueAmount}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Shift Schedule Selection (Excludes booked shifts) */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <label className="custom-input-label" style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-slate)', textTransform: 'uppercase', marginBottom: 0, display: 'block' }}>
                  Shift Schedule
                </label>
                <button
                  type="button"
                  id="allocate-modal-add-shift-header-btn"
                  onClick={() => {
                    onClose();
                    navigate('/billing?tab=shifts&action=add-shift', { state: { tab: 1, openCreateShift: true } });
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: 'none',
                    border: 'none',
                    color: 'var(--primary-color, #2563eb)',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    padding: '2px 4px',
                    borderRadius: '4px',
                    transition: 'all 0.15s ease',
                  }}
                  title="Configure new shift"
                >
                  <Plus size={13} strokeWidth={2.5} /> Add Shift
                </button>
              </div>

              {availableShifts.length > 0 ? (
                <Select
                  value={shiftId}
                  onChange={(val) => {
                    if (val === 'ADD_NEW_SHIFT') {
                      onClose();
                      navigate('/billing?tab=shifts&action=add-shift', { state: { tab: 1, openCreateShift: true } });
                      return;
                    }
                    setShiftId(val);
                    const selectedShift = availableShifts.find((s: any) => s.id === val);
                    if (selectedShift && selectedShift.customPricing && selectedShift.customPricing.length > 0) {
                      setDurationMode(selectedShift.customPricing[0].label);
                    } else {
                      setDurationMode('');
                    }
                  }}
                  placeholder="Select schedule shift"
                  options={[
                    ...availableShifts.map((s: any) => ({
                      value: s.id,
                      label: `${s.name} (${calculateShiftDuration(s.startTime, s.endTime)}) (${formatTo12hString(s.startTime)} - ${formatTo12hString(s.endTime)})`,
                    })),
                    { value: 'ADD_NEW_SHIFT', label: '+ Add New Shift', isAction: true },
                  ]}
                />
              ) : (
                <div style={{
                  padding: '10px 14px',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fee2e2',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  color: 'var(--status-red, #dc2626)',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                  flexWrap: 'wrap',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '180px' }}>
                    <AlertCircle size={16} style={{ flexShrink: 0, color: '#ef4444' }} />
                    <span>
                      {!shifts ? 'Loading shifts…' : shifts.length === 0
                        ? 'No shifts are configured. Add a shift in Settings to allocate this seat.'
                        : 'No shifts are available for the selected dates. Choose different dates or another seat.'}
                    </span>
                  </div>
                  <button
                    type="button"
                    id="allocate-modal-add-shift-btn"
                    onClick={() => {
                      onClose();
                      navigate('/billing?tab=shifts&action=add-shift', { state: { tab: 1, openCreateShift: true } });
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      backgroundColor: '#ef4444',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '5px 12px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: '0 2px 6px rgba(239, 68, 68, 0.25)',
                      flexShrink: 0,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#dc2626')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ef4444')}
                  >
                    <Plus size={14} strokeWidth={2.5} />
                    Add Shift
                  </button>
                </div>
              )}
            </div>

            {/* Start Date */}
            <DatePicker
              label="Start Date"
              required
              value={startDate}
              onChange={(val) => setStartDate(val)}
            />

            {/* Duration mode */}
            <div>
              <label className="custom-input-label" style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-slate)', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>Duration</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Select
                  value={durationMode}
                  onChange={(val) => setDurationMode(val)}
                  placeholder="Select Duration"
                  style={{ flex: 1 }}
                  options={
                    shifts?.find((s: any) => s.id === shiftId)?.customPricing?.map((cp: any) => ({
                      value: cp.label,
                      label: `${cp.label} (₹${cp.price})`,
                    })) || []
                  }
                />
                <button
                  type="button"
                  onClick={() => setDurationMode('flex')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '12px',
                    border: durationMode === 'flex' ? '2px solid var(--accent-blue)' : '1px solid rgba(15, 23, 42, 0.05)',
                    backgroundColor: durationMode === 'flex' ? 'var(--accent-blue)' : '#ffffff',
                    color: durationMode === 'flex' ? '#ffffff' : 'var(--text-navy)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 150ms ease'
                  }}
                >
                  Flex Dates
                </button>
              </div>
            </div>

            {/* End Date (flex mode) */}
            {durationMode === 'flex' && (
              <DatePicker
                label="End Date"
                required
                value={endDate}
                onChange={(val) => setEndDate(val)}
              />
            )}
          </div>

          {/* Right Column: Invoicing & Payment */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Generate Invoice Switch */}
            <div style={{ padding: '6px 0', borderBottom: '1px solid var(--border-card)', marginBottom: '4px' }}>
              <Switch
                checked={shouldGenerateInvoice}
                onChange={setShouldGenerateInvoice}
                label="Generate Invoice & Collect Payment"
                id="modal-generate-invoice"
              />
            </div>

            {/* Invoice settings */}
            {shouldGenerateInvoice ? (
              <div style={{ padding: '16px', backgroundColor: '#F8FAFC', borderRadius: '16px', border: '1px solid var(--border-card)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', borderBottom: '1px dashed var(--border-card)', paddingBottom: '8px' }}>
                  <span style={{ color: 'var(--text-slate)', fontWeight: 600 }}>Standard Plan Price:</span>
                  <strong style={{ color: 'var(--text-navy)', fontSize: '0.9rem' }}>₹{calculatedBaseAmount}</strong>
                </div>
                <div>
                  <label className="custom-input-label" style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-slate)', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>Payment Method</label>
                  <Select
                    value={paymentMethod}
                    onChange={(val: any) => setPaymentMethod(val)}
                    options={[
                      { value: 'CASH', label: 'Cash' },
                      { value: 'UPI', label: 'UPI / NetBanking' },
                      { value: 'RAZORPAY', label: 'Razorpay Online' }
                    ]}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: calculatedBaseAmount > 0 ? '1fr 1fr' : '1fr', gap: '10px' }}>
                  <div>
                    <label className="custom-input-label" style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-slate)', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>Collect Amount (₹)</label>
                    <input
                      type="number"
                      required
                      value={invoiceAmount}
                      onChange={(e) => {
                        setPrefilledPayment(null);
                        setInvoiceAmount(e.target.value);
                      }}
                      style={{ padding: '8px 12px', borderRadius: '12px', border: '1px solid rgba(15, 23, 42, 0.05)', fontSize: '0.8rem', color: 'var(--text-navy)', width: '100%', outline: 'none', backgroundColor: '#ffffff', boxSizing: 'border-box' }}
                    />
                  </div>
                  {calculatedBaseAmount > 0 && (
                    <div>
                      <label className="custom-input-label" style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-slate)', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>Discount (₹)</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={discountAmount}
                        onChange={(e) => {
                          setPrefilledPayment(null);
                          const val = e.target.value;
                          setDiscountAmount(val);
                          const disc = parseFloat(val) || 0;
                          if (calculatedBaseAmount > 0) {
                            setInvoiceAmount(Math.max(0, calculatedBaseAmount - disc).toString());
                          }
                        }}
                        style={{ padding: '8px 12px', borderRadius: '12px', border: '1px solid rgba(15, 23, 42, 0.05)', fontSize: '0.8rem', color: 'var(--text-navy)', width: '100%', outline: 'none', backgroundColor: '#ffffff', boxSizing: 'border-box' }}
                      />
                    </div>
                  )}
                </div>
                {calculatedBaseAmount > 0 && (
                  <div style={{ borderTop: '1px dashed var(--border-card)', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {/* Total Price for new booking */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                      <span style={{ color: 'var(--text-slate)' }}>Total Price:</span>
                      <span style={{ color: 'var(--text-navy)', fontWeight: 600 }}>
                        ₹{calculatedBaseAmount}
                      </span>
                    </div>
                    {/* Discount row: always show when discount field has value > 0 */}
                    {(parseFloat(discountAmount) || 0) > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                        <span style={{ color: 'var(--text-slate)' }}>Discount:</span>
                        <span style={{ color: '#7c3aed', fontWeight: 600 }}>− ₹{parseFloat(discountAmount)}</span>
                      </div>
                    )}
                    {/* Collected Amount: always show what admin entered */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                      <span style={{ color: 'var(--text-slate)' }}>Collected Amount:</span>
                      <span style={{ color: 'var(--text-navy)', fontWeight: 600 }}>₹{parseFloat(invoiceAmount) || 0}</span>
                    </div>
                    {/* Previous Due if any and NOT prefilled payment */}
                    {studentExistingDue > 0 && !prefilledPayment && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                        <span style={{ color: '#991b1b' }}>Previous Due:</span>
                        <span style={{ color: '#991b1b', fontWeight: 600 }}>₹{studentExistingDue.toFixed(2)}</span>
                      </div>
                    )}
                    {/* Due / Fully Paid */}
                    {(() => {
                      const effectiveDue = prefilledPayment
                        ? Math.max(dueAmount, studentExistingDue)
                        : (dueAmount + studentExistingDue);

                      return (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', borderTop: '1px solid var(--border-card)', paddingTop: '6px', marginTop: '2px' }}>
                          <span style={{ fontWeight: 700, color: effectiveDue > 0 ? '#991b1b' : 'var(--status-emerald)' }}>
                            {effectiveDue > 0 ? 'Total Due:' : 'Status:'}
                          </span>
                          {effectiveDue > 0 ? (
                            <span style={{ color: 'var(--status-red)', fontWeight: 700 }}>
                              ₹{effectiveDue.toFixed(2)}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--status-emerald)', fontWeight: 700 }}>✅ Fully Paid</span>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ padding: '16px', backgroundColor: '#F8FAFC', borderRadius: '16px', border: '1px dashed var(--border-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '140px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-slate)', textAlign: 'center' }}>
                  No invoice will be generated. The student will be allocated to the seat directly without any billing records.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Form Buttons */}
        <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border-card)', paddingTop: '12px', marginTop: '8px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{ flex: 1, padding: '10px', background: 'none', border: '1px solid var(--border-card)', color: 'var(--text-slate)', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
          >
            Cancel
          </button>
          <Button
            type="submit"
            variant="primary"
            disabled={!studentProfileId || !availableShifts.some((shift: any) => shift.id === shiftId) || (shouldGenerateInvoice && !invoiceAmount)}
            style={{ flex: 1, backgroundColor: 'var(--accent-blue)', borderColor: 'var(--accent-blue)', borderRadius: '12px' }}
            isLoading={isAllocating || isCreatingPayment}
          >
            Allocate Seat
          </Button>
        </div>
      </form>
    </Modal>
  );
};
