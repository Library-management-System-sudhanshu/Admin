import React, { useState, useEffect, useMemo } from 'react';
import { useAllocateSeatMutation, useCreatePaymentMutation, useGetStudentsQuery } from '../store/api';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Select } from './ui/Select';
import { Switch } from './ui/Switch';
import { useToast } from './ui/ToastContext';
import { Sparkles, Search } from 'lucide-react';

interface AllocateSeatModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSeat: any;
  shifts: any[] | undefined;
  branches: any[] | undefined;
  selectedBranch: string;
  seatMap: any[] | undefined;
  onSuccess: (invoiceInfo: any) => void;
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
}) => {
  const { showToast } = useToast();
  const { data: studentsData } = useGetStudentsQuery(undefined);
  const [allocateSeat, { isLoading: isAllocating }] = useAllocateSeatMutation();
  const [createPayment, { isLoading: isCreatingPayment }] = useCreatePaymentMutation();

  const [studentProfileId, setStudentProfileId] = useState('');
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [shiftId, setShiftId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [durationMode, setDurationMode] = useState<number | 'flex'>(1);
  const [shouldGenerateInvoice, setShouldGenerateInvoice] = useState(true);
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI' | 'RAZORPAY'>('CASH');

  // Initialize values when selected seat / modal open changes
  useEffect(() => {
    if (isOpen && selectedSeat) {
      const today = new Date().toISOString().split('T')[0];
      setStartDate(today);
      const end = new Date(today);
      end.setMonth(end.getMonth() + 1);
      setEndDate(end.toISOString().split('T')[0]);
      setStudentProfileId('');
      setStudentSearchQuery('');

      const activeAllocations = selectedSeat.allocations?.filter((a: any) => a.isActive) || [];
      const bookedShiftIds = activeAllocations.map((a: any) => a.shiftId || a.shift?.id);
      const availableShifts = shifts?.filter((s: any) => !bookedShiftIds.includes(s.id)) || [];

      if (availableShifts.length > 0) {
        setShiftId(availableShifts[0].id);
      } else {
        setShiftId('');
      }

      setDurationMode(1);
      setShouldGenerateInvoice(true);
      setInvoiceAmount('');
      setPaymentMethod('CASH');
    }
  }, [isOpen, selectedSeat, shifts]);

  // Duration modes calculations
  useEffect(() => {
    if (durationMode === 'flex') return;
    if (startDate && typeof durationMode === 'number') {
      const date = new Date(startDate);
      if (!isNaN(date.getTime())) {
        date.setMonth(date.getMonth() + durationMode);
        setEndDate(date.toISOString().split('T')[0]);
      }
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
        }).unwrap();

        const invoiceInfo = {
          payment: paymentResult.payment,
          student: studentsData?.students?.find((s: any) => s.id === studentProfileId),
          seatNumber: selectedSeat?.number,
          shift: shifts?.find((s: any) => s.id === shiftId),
          startDate,
          endDate,
          branchName: branches?.find((b: any) => b.id === selectedBranch)?.name,
          originalAmount: calculatedBaseAmount,
          payableAmount: Number(invoiceAmount),
        };
        onSuccess(invoiceInfo);
      } else {
        showToast('Seat allocated successfully!', 'success');
        onClose();
      }
    } catch (err: any) {
      showToast(err.data?.message || 'Seat allocation failed', 'error');
    }
  };

  if (!selectedSeat) return null;

  const activeAllocations = selectedSeat.allocations?.filter((a: any) => a.isActive) || [];
  const bookedShiftIds = activeAllocations.map((a: any) => a.shiftId || a.shift?.id);
  const availableShifts = shifts?.filter((s: any) => !bookedShiftIds.includes(s.id)) || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Allocate Seat ${selectedSeat?.number}`}
      maxWidth="lg"
    >
      <form onSubmit={handleAllocate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-blue)', marginBottom: '4px' }}>
          <Sparkles size={16} />
          <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700 }}>Assign Student to Seat</h4>
        </div>

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
                      style={{ padding: '8px 12px', cursor: 'pointer', display: 'flex', flexDirection: 'column', borderBottom: '1px solid #f1f5f9' }}
                    >
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-navy)' }}>{st.user?.name}</span>
                      <span style={{ fontSize: '0.675rem', color: 'var(--text-slate)' }}>{st.user?.email || 'No email'} • {st.user?.mobile || 'No mobile'}</span>
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
            <div>
              <label className="custom-input-label" style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-slate)', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>Start Date</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '12px', border: '1px solid rgba(15, 23, 42, 0.05)', fontSize: '0.8rem', color: 'var(--text-navy)', width: '100%', outline: 'none' }}
              />
            </div>

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
              <div>
                <label className="custom-input-label" style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-slate)', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>End Date</label>
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{ padding: '8px 12px', borderRadius: '12px', border: '1px solid rgba(15, 23, 42, 0.05)', fontSize: '0.8rem', color: 'var(--text-navy)', width: '100%', outline: 'none' }}
                />
              </div>
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
