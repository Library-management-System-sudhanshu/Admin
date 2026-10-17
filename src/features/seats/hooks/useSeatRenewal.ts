 import { useState, useEffect } from 'react';
import { addDaysToDate, addMonthsToDate } from '../../../utils/dateUtils';
import { getStudentDisplayName, getStudentEmail, getStudentMobile } from '../../../utils/studentUtils';
import type { Shift, Seat } from '../types';

export interface UseSeatRenewalProps {
  shifts?: Shift[];
  branches?: any[];
  selectedBranch?: string;
  selectedSeat: Seat | null;
  selectedAllocationId: string | null;
  userWorkspaceName?: string;
  vacateSeat: (payload: any) => { unwrap: () => Promise<any> };
  allocateSeat: (payload: any) => { unwrap: () => Promise<any> };
  createPayment: (payload: any) => { unwrap: () => Promise<any> };
  verifyRazorpay: (payload: any) => { unwrap: () => Promise<any> };
  showToast: (msg: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  onSuccess: (invoiceInfo: any) => void;
}

export function useSeatRenewal({
  shifts,
  branches,
  selectedBranch,
  selectedSeat,
  selectedAllocationId,
  userWorkspaceName,
  vacateSeat,
  allocateSeat,
  createPayment,
  verifyRazorpay,
  showToast,
  onSuccess,
}: UseSeatRenewalProps) {
  const [renewShiftId, setRenewShiftId] = useState('');
  const [renewDuration, setRenewDuration] = useState<number | string>(1);
  const [renewStartDate, setRenewStartDate] = useState('');
  const [renewEndDate, setRenewEndDate] = useState('');
  const [renewPaymentMethod, setRenewPaymentMethod] = useState<'CASH' | 'UPI' | 'RAZORPAY'>('UPI');
  const [renewAmount, setRenewAmount] = useState('');
  const [isRenewing, setIsRenewing] = useState(false);

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

  // Recompute end date and price when shift, start date or duration changes
  useEffect(() => {
    if (renewShiftId && shifts && renewStartDate) {
      const shift = shifts.find((s: any) => s.id === renewShiftId);
      if (shift) {
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

  const handleRenewSeat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSeat || !selectedAllocationId) return;
    const activeAllocation = selectedSeat.allocations?.find((a: any) => a.id === selectedAllocationId);
    if (!activeAllocation) return;

    setIsRenewing(true);
    try {
      await vacateSeat({ id: selectedSeat.id, studentProfileId: activeAllocation.studentProfileId }).unwrap();
      await allocateSeat({
        studentProfileId: activeAllocation.studentProfileId,
        seatId: selectedSeat.id,
        shiftId: renewShiftId,
        startDate: renewStartDate,
        endDate: renewEndDate,
      }).unwrap();

      const paymentResult = await createPayment({
        studentProfileId: activeAllocation.studentProfileId,
        amount: Number(renewAmount),
        method: renewPaymentMethod,
        shiftId: renewShiftId || undefined,
        durationMonths: renewDuration,
      }).unwrap();

      const renewPaid = Number(renewAmount) || 0;
      const invoiceInfo = {
        payment: paymentResult.payment,
        student: activeAllocation.studentProfile,
        seatNumber: selectedSeat.number || selectedSeat.seatNumber,
        shift: shifts?.find((s: any) => s.id === renewShiftId),
        startDate: renewStartDate,
        endDate: renewEndDate,
        branchName: branches?.find((b: any) => b.id === selectedBranch)?.name,
        originalAmount: renewPaid,
        payableAmount: renewPaid,
        discountAmount: 0,
        paidAmount: renewPaid,
        dueAmount: 0,
      };

      if (renewPaymentMethod === 'RAZORPAY' && paymentResult.razorpayOrder) {
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
          name: userWorkspaceName || 'N/A',
          description: `Seat ${selectedSeat.number || selectedSeat.seatNumber} Renewal`,
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
              onSuccess({
                ...invoiceInfo,
                payment: verifiedPayment,
              });
            } catch (err: any) {
              showToast(err.data?.message || 'Payment verification failed', 'error');
            }
          },
          prefill: {
            name: getStudentDisplayName(activeAllocation.studentProfile),
            email:
              getStudentEmail(activeAllocation.studentProfile) === 'N/A'
                ? ''
                : getStudentEmail(activeAllocation.studentProfile),
            contact:
              getStudentMobile(activeAllocation.studentProfile) === 'N/A'
                ? ''
                : getStudentMobile(activeAllocation.studentProfile),
          },
          theme: {
            color: '#2563eb',
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } else {
        onSuccess(invoiceInfo);
        showToast('Seat renewed successfully!', 'success');
      }
    } catch (err: any) {
      showToast(err?.data?.message || 'Seat renewal failed', 'error');
    } finally {
      setIsRenewing(false);
    }
  };

  return {
    renewShiftId,
    setRenewShiftId,
    renewDuration,
    setRenewDuration,
    renewStartDate,
    setRenewStartDate,
    renewEndDate,
    setRenewEndDate,
    renewPaymentMethod,
    setRenewPaymentMethod,
    renewAmount,
    setRenewAmount,
    isRenewing,
    handleRenewSeat,
  };
}
