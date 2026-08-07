import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import { useAllocateSeatMutation, useCreatePaymentMutation, useGetStudentsQuery, useVerifyRazorpayMutation } from '../store/api';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Select } from './ui/Select';
import { Switch } from './ui/Switch';
import { DatePicker } from './ui/DatePicker';
import { useToast } from './ui/ToastContext';
import { Search } from 'lucide-react';
import { formatYYYYMMDD, addMonthsToDate } from '../utils/dateUtils';
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
  const { data: studentsData } = useGetStudentsQuery(undefined);
  const [allocateSeat, { isLoading: isAllocating }] = useAllocateSeatMutation();
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

  const [studentProfileId, setStudentProfileId] = useState('');
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [shiftId, setShiftId] = useState('');
  const [startDate, setStartDate] = useState(() => formatYYYYMMDD(preselectedJoiningDate) || formatYYYYMMDD(new Date()));
  const [endDate, setEndDate] = useState(() => {
    const base = formatYYYYMMDD(preselectedJoiningDate) || formatYYYYMMDD(new Date());
    const end = new Date(base);
    end.setMonth(end.getMonth() + 1);
    return formatYYYYMMDD(end);
  });
  const [durationMode, setDurationMode] = useState<number | 'flex'>(1);
  const [shouldGenerateInvoice, setShouldGenerateInvoice] = useState(true);
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI' | 'RAZORPAY'>('CASH');

  // Active allocations for selected seat
  const activeAllocations = useMemo(() => {
    if (!selectedSeat) return [];
    return selectedSeat.allocations?.filter((a: any) => a.isActive) || [];
  }, [selectedSeat]);

  // Compute available shifts for selected seat
  const availableShifts = useMemo(() => {
    if (!shifts || !selectedSeat) return [];
    const bookedShiftIds = activeAllocations.map((a: any) => a.shiftId || a.shift?.id);
    return shifts.filter((s: any) => !bookedShiftIds.includes(s.id));
  }, [shifts, selectedSeat, activeAllocations]);

  // Initialize values when selected seat / modal open changes
  useEffect(() => {
    if (isOpen && selectedSeat) {
      const baseDate = formatYYYYMMDD(preselectedJoiningDate) || formatYYYYMMDD(new Date());
      setStartDate(baseDate);
      const end = new Date(baseDate);
      end.setMonth(end.getMonth() + 1);
      setEndDate(formatYYYYMMDD(end));

      if (preselectedStudentId) {
        setStudentProfileId(preselectedStudentId);
        const student = studentsData?.students?.find((s: any) => s.id === preselectedStudentId);
        if (student) {
          setStudentSearchQuery(student.user?.name || '');
        }
      } else {
        setStudentProfileId('');
        setStudentSearchQuery('');
      }

      setDurationMode(1);
      setShouldGenerateInvoice(true);
      setInvoiceAmount('');
      setPaymentMethod('CASH');
    }
  }, [isOpen, selectedSeat, shifts, preselectedStudentId, preselectedJoiningDate, studentsData]);

  // Ensure shift is selected whenever availableShifts loads
  useEffect(() => {
    if (isOpen && availableShifts.length > 0) {
      if (!shiftId || !availableShifts.some((s: any) => s.id === shiftId)) {
        const targetShift = (preselectedShiftId && availableShifts.some((s: any) => s.id === preselectedShiftId))
          ? preselectedShiftId
          : availableShifts[0].id;
        setShiftId(targetShift);
      }
    }
  }, [isOpen, availableShifts, shiftId, preselectedShiftId]);

  // Sync form inputs with student's active subscription if they already have one
  useEffect(() => {
    if (isOpen && studentProfileId && studentsData?.students) {
      const student = studentsData.students.find((s: any) => s.id === studentProfileId);
      const activeSub = student?.subscriptions?.find((sub: any) => sub.status === 'ACTIVE');
      
      if (activeSub) {
        // Match shift
        const matchingShift = shifts?.find((s: any) => 
          activeSub.plan?.name?.toLowerCase().includes(s.name.toLowerCase())
        );
        if (matchingShift) {
          setShiftId(matchingShift.id);
        }
        
        // Match dates
        if (activeSub.startDate) {
          setStartDate(formatYYYYMMDD(activeSub.startDate));
        }
        if (activeSub.endDate) {
          setEndDate(formatYYYYMMDD(activeSub.endDate));
          setDurationMode('flex');
        }
        
        // Already paid / subscribed -> do not generate another invoice
        setShouldGenerateInvoice(false);
      } else {
        // No active subscription -> allow invoice generation and reset to student's admission date or preselected date
        setShouldGenerateInvoice(true);
        setDurationMode(1);
        const baseDate = formatYYYYMMDD(preselectedJoiningDate) || formatYYYYMMDD(student?.joiningDate) || formatYYYYMMDD(new Date());
        setStartDate(baseDate);
        const end = new Date(baseDate);
        end.setMonth(end.getMonth() + 1);
        setEndDate(formatYYYYMMDD(end));
      }
    }
  }, [isOpen, studentProfileId, studentsData, shifts, preselectedJoiningDate]);

  // Duration modes calculations
  useEffect(() => {
    if (durationMode === 'flex') return;
    if (startDate && typeof durationMode === 'number') {
      setEndDate(addMonthsToDate(startDate, durationMode));
    }
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
      return (
        student.user?.name?.toLowerCase().includes(query) ||
        student.user?.mobile?.includes(query) ||
        student.user?.email?.toLowerCase().includes(query)
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
    if (typeof durationMode === 'number') {
      if (durationMode === 3 && shift.price3Months) {
        return shift.price3Months;
      }
      if (durationMode === 6 && shift.price6Months) {
        return shift.price6Months;
      }
      return basePrice * durationMode;
    } else if (durationMode === 'flex' && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        const diffTime = end.getTime() - start.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 0) {
          return Math.round(basePrice * (diffDays / 30));
        }
      }
    }
    return basePrice;
  }, [shiftId, shifts, durationMode, startDate, endDate]);

  const dueAmount = useMemo(() => {
    const paid = parseFloat(invoiceAmount) || 0;
    return Math.max(0, calculatedBaseAmount - paid);
  }, [calculatedBaseAmount, invoiceAmount]);

  useEffect(() => {
    if (calculatedBaseAmount > 0) {
      setInvoiceAmount(calculatedBaseAmount.toString());
    } else {
      setInvoiceAmount('');
    }
  }, [calculatedBaseAmount]);

  const handleAllocate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSeat) return;
    try {
      await allocateSeat({
        studentProfileId,
        seatId: selectedSeat.id,
        shiftId,
        startDate,
        endDate,
      }).unwrap();

      if (shouldGenerateInvoice) {
        const paymentResult = await createPayment({
          studentProfileId,
          amount: Number(invoiceAmount),
          method: paymentMethod,
          shiftId: shiftId || undefined,
          durationMonths: typeof durationMode === 'number' ? durationMode : undefined,
          totalAmount: calculatedBaseAmount,
        }).unwrap();

        const student = studentsData?.students?.find((s: any) => s.id === studentProfileId);
        const invoiceInfo = {
          payment: paymentResult.payment,
          student,
          seatNumber: selectedSeat?.number,
          shift: shifts?.find((s: any) => s.id === shiftId),
          startDate,
          endDate,
          branchName: branches?.find((b: any) => b.id === selectedBranch)?.name,
          originalAmount: calculatedBaseAmount,
          payableAmount: Number(invoiceAmount),
        };

        if (paymentMethod === 'RAZORPAY' && paymentResult.razorpayOrder) {
          const scriptLoaded = await loadRazorpayScript();
          if (!scriptLoaded) {
            showToast('Failed to load Razorpay SDK. Check internet connection.', 'error');
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
                showToast(err.data?.message || 'Payment verification failed', 'error');
              }
            },
            prefill: {
              name: student?.user?.name || '',
              email: student?.user?.email || '',
              contact: student?.user?.mobile || '',
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
      } else {
        showToast('Seat allocated successfully!', 'success');
        onClose();
      }
    } catch (err: any) {
      showToast(err.data?.message || 'Seat allocation failed', 'error');
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
                        <strong>{alloc.shift?.name}</strong>: {alloc.studentProfile?.user?.name}
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

              {studentProfileId && (() => {
                const selectedStudent = studentsData?.students?.find((s: any) => s.id === studentProfileId);
                if (selectedStudent && Number(selectedStudent.dueAmount) > 0) {
                  return (
                    <div style={{ padding: '8px 12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#991b1b' }}>
                        ⚠️ Outstanding Dues:
                      </span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#991b1b' }}>₹{selectedStudent.dueAmount}</span>
                    </div>
                  );
                }
                return null;
              })()}

              {showStudentDropdown && displayedStudents.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: '#ffffff', border: '1px solid var(--border-card)', borderRadius: '12px', boxShadow: 'var(--shadow-hover)', zIndex: 1000, marginTop: '4px', maxHeight: '180px', overflowY: 'auto' }}>
                  {displayedStudents.map((st: any) => (
                    <div
                      key={st.id}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setStudentProfileId(st.id);
                        setStudentSearchQuery(st.user?.name || '');
                        setShowStudentDropdown(false);
                      }}
                      style={{ padding: '8px 12px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9' }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-navy)' }}>{st.user?.name}</span>
                        <span style={{ fontSize: '0.675rem', color: 'var(--text-slate)' }}>{st.user?.email || 'No email'} • {st.user?.mobile || 'No mobile'}</span>
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
              <label className="custom-input-label" style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-slate)', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>Shift Schedule</label>
              {availableShifts.length > 0 ? (
                <Select
                  value={shiftId}
                  onChange={(val) => setShiftId(val)}
                  placeholder="Select schedule shift"
                  options={availableShifts.map((s: any) => ({
                    value: s.id,
                    label: `${s.name} (${s.startTime} - ${s.endTime})`,
                  }))}
                />
              ) : (
                <div style={{ padding: '8px 12px', backgroundColor: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '12px', fontSize: '0.75rem', color: 'var(--status-red)', fontWeight: 600 }}>
                  All shifts are already occupied for this seat.
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
                  value={typeof durationMode === 'number' ? durationMode : ''}
                  onChange={(val) => setDurationMode(Number(val))}
                  placeholder="Months"
                  style={{ flex: 1 }}
                  options={[
                    { value: 1, label: '1 Month' },
                    { value: 2, label: '2 Months' },
                    { value: 3, label: '3 Months' },
                    { value: 6, label: '6 Months' }
                  ]}
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
                <div>
                  <label className="custom-input-label" style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-slate)', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>Collect Amount (₹)</label>
                  <input
                    type="number"
                    required
                    value={invoiceAmount}
                    onChange={(e) => setInvoiceAmount(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '12px', border: '1px solid rgba(15, 23, 42, 0.05)', fontSize: '0.8rem', color: 'var(--text-navy)', width: '100%', outline: 'none', backgroundColor: '#ffffff' }}
                  />
                  {calculatedBaseAmount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.75rem' }}>
                      <span style={{ color: 'var(--text-slate)' }}>Total Price: ₹{calculatedBaseAmount}</span>
                      {dueAmount > 0 ? (
                        <span style={{ color: 'var(--status-red)', fontWeight: 700 }}>Due: ₹{dueAmount}</span>
                      ) : (
                        <span style={{ color: 'var(--status-emerald)', fontWeight: 700 }}>Fully Paid</span>
                      )}
                    </div>
                  )}
                </div>
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
            disabled={!studentProfileId || !shiftId || (shouldGenerateInvoice && !invoiceAmount)}
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
