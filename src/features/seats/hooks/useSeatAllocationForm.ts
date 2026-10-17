import { useState, useMemo, useEffect } from 'react';
import { formatYYYYMMDD, addMonthsToDate } from '../../../utils/dateUtils';
import type { Shift, Seat } from '../types';

export interface UseSeatAllocationFormProps {
  shifts?: Shift[];
  studentsData?: { students?: any[] };
  selectedSeat: Seat | null;
  preselectedStudent?: { id: string; name: string; joiningDate?: string; shiftId?: string } | null;
  branches?: any[];
  selectedBranch?: string;
  allocateSeat: (payload: any) => { unwrap: () => Promise<any> };
  createPayment: (payload: any) => { unwrap: () => Promise<any> };
  showToast: (msg: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  onSuccess: (invoiceInfo?: any) => void;
}

export function useSeatAllocationForm({
  shifts,
  studentsData,
  selectedSeat,
  preselectedStudent,
  branches,
  selectedBranch,
  allocateSeat,
  createPayment,
  showToast,
  onSuccess,
}: UseSeatAllocationFormProps) {
  const [studentProfileId, setStudentProfileId] = useState('');
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [shiftId, setShiftId] = useState('');
  const [startDate, setStartDate] = useState(() => formatYYYYMMDD(preselectedStudent?.joiningDate) || formatYYYYMMDD(new Date()));
  const [endDate, setEndDate] = useState(() => {
    const base = formatYYYYMMDD(preselectedStudent?.joiningDate) || formatYYYYMMDD(new Date());
    const end = new Date(base);
    end.setMonth(end.getMonth() + 1);
    return formatYYYYMMDD(end);
  });
  const [durationMode, setDurationMode] = useState<number | 'flex'>(1);
  const [shouldGenerateInvoice, setShouldGenerateInvoice] = useState(true);
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI' | 'RAZORPAY'>('CASH');
  const [isAllocating, setIsAllocating] = useState(false);

  // Sync dates when durationMode changes
  useEffect(() => {
    if (durationMode === 'flex') return;
    if (startDate && typeof durationMode === 'number') {
      setEndDate(addMonthsToDate(startDate, durationMode));
    } else {
      setEndDate('');
    }
  }, [startDate, durationMode]);

  // Pricing calculation
  const calculatedBaseAmount = useMemo(() => {
    if (!shiftId || !shifts) return 0;
    const shift = shifts.find((s: any) => s.id === shiftId);
    if (!shift) return 0;

    const basePrice = shift.price || 0;
    if (typeof durationMode === 'number') {
      if (durationMode === 3 && shift.price3Months) return shift.price3Months;
      if (durationMode === 6 && shift.price6Months) return shift.price6Months;
      return basePrice * durationMode;
    } else if (durationMode === 'flex' && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays > 0) return Math.round(basePrice * (diffDays / 30));
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

  const resetForm = () => {
    const baseDate = formatYYYYMMDD(new Date());
    setStartDate(baseDate);
    const end = new Date(baseDate);
    end.setMonth(end.getMonth() + 1);
    setEndDate(formatYYYYMMDD(end));
    setStudentProfileId('');
    setStudentSearchQuery('');
    setShiftId('');
    setDurationMode(1);
    setShouldGenerateInvoice(true);
    setInvoiceAmount('');
    setPaymentMethod('CASH');
  };

  const handleAllocate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSeat) return;

    setIsAllocating(true);
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

        const seatPaid = Number(invoiceAmount) || 0;
        const seatTotal = calculatedBaseAmount || seatPaid;
        const seatDue = Math.max(0, seatTotal - seatPaid);

        const invoiceInfo = {
          payment: paymentResult.payment,
          student: studentsData?.students?.find((s: any) => s.id === studentProfileId),
          seatNumber: selectedSeat.number || selectedSeat.seatNumber,
          shift: shifts?.find((s: any) => s.id === shiftId),
          startDate,
          endDate,
          branchName: branches?.find((b: any) => b.id === selectedBranch)?.name,
          originalAmount: seatTotal,
          payableAmount: seatTotal,
          discountAmount: 0,
          paidAmount: seatPaid,
          dueAmount: seatDue,
        };
        onSuccess(invoiceInfo);
      } else {
        showToast('Seat allocated successfully!', 'success');
        onSuccess();
      }
      resetForm();
    } catch (err: any) {
      showToast(err.data?.message || 'Seat allocation failed', 'error');
    } finally {
      setIsAllocating(false);
    }
  };

  return {
    studentProfileId,
    setStudentProfileId,
    studentSearchQuery,
    setStudentSearchQuery,
    showStudentDropdown,
    setShowStudentDropdown,
    shiftId,
    setShiftId,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    durationMode,
    setDurationMode,
    shouldGenerateInvoice,
    setShouldGenerateInvoice,
    invoiceAmount,
    setInvoiceAmount,
    paymentMethod,
    setPaymentMethod,
    calculatedBaseAmount,
    dueAmount,
    isAllocating,
    handleAllocate,
    resetForm,
  };
}
