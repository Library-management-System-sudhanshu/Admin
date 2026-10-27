 import { useState, useEffect } from 'react';
import { addDaysToDate, addMonthsToDate, calculateSubscriptionEndDate, calculatePlanPrice } from '../../../utils/dateUtils';
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
  const [renewDiscount, setRenewDiscount] = useState('');
  const [isRenewing, setIsRenewing] = useState(false);

  const selectedShift = shifts?.find((s: any) => s.id === renewShiftId);
  const basePrice = selectedShift ? calculatePlanPrice(selectedShift, renewDuration) : 0;
  const parsedDiscount = parseFloat(renewDiscount) || 0;
  const netPayable = Math.max(0, basePrice - parsedDiscount);
  const parsedPaid = parseFloat(renewAmount) || 0;
  const dueAmount = Math.max(0, netPayable - parsedPaid);

  const handleDiscountChange = (newDiscount: string) => {
    setRenewDiscount(newDiscount);
    if (renewShiftId && shifts) {
      const shift = shifts.find((s: any) => s.id === renewShiftId);
      if (shift) {
        const planPrice = calculatePlanPrice(shift, renewDuration);
        const disc = parseFloat(newDiscount) || 0;
        setRenewAmount(Math.max(0, planPrice - disc).toString());
      }
    }
  };

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
        const endDateCalculated = calculateSubscriptionEndDate(renewStartDate, renewDuration);
        const price = calculatePlanPrice(shift, renewDuration);
        const disc = parseFloat(renewDiscount) || 0;

        if (endDateCalculated) {
          setRenewEndDate(endDateCalculated);
        }
        setRenewAmount(Math.max(0, price - disc).toString());
      }
    }
  }, [renewShiftId, renewStartDate, renewDuration, shifts]);

  // Reset discount when allocation changes
  useEffect(() => {
    setRenewDiscount('');
  }, [selectedAllocationId, selectedSeat?.id]);

  const handleRenewSeat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSeat || !selectedAllocationId) return;
    const activeAllocation = selectedSeat.allocations?.find((a: any) => a.id === selectedAllocationId);
    if (!activeAllocation) return;

    const currentShift = shifts?.find((s: any) => s.id === renewShiftId);
    const planBasePrice = currentShift ? calculatePlanPrice(currentShift, renewDuration) : 0;
    const discountNum = parseFloat(renewDiscount) || 0;
    const renewPaid = Number(renewAmount) || 0;
    const payable = Math.max(0, planBasePrice - discountNum);
    const remainingDue = Math.max(0, payable - renewPaid);
    const studentExistingDue = activeAllocation.studentProfile?.dueAmount
      ? Number(activeAllocation.studentProfile.dueAmount)
      : 0;

    if (planBasePrice > 0) {
      if (discountNum > planBasePrice) {
        showToast(`Discount (₹${discountNum}) cannot exceed the plan price (₹${planBasePrice}).`, 'error');
        return;
      }
      if (renewPaid > payable) {
        showToast(`Amount paid (₹${renewPaid}) cannot exceed net payable (₹${payable}) when discount is ₹${discountNum}.`, 'error');
        return;
      }
    }

    setIsRenewing(true);
    const paymentPayload = {
      studentProfileId: activeAllocation.studentProfileId,
      amount: renewPaid,
      method: renewPaymentMethod,
      shiftId: renewShiftId || undefined,
      durationMonths: typeof renewDuration === 'number' 
        ? renewDuration 
        : (parseInt(String(renewDuration), 10) || undefined),
      totalAmount: planBasePrice,
      discountAmount: discountNum > 0 ? discountNum : undefined,
      notes: typeof renewDuration === 'string' ? `Plan Duration: ${renewDuration}` : undefined,
    };

    try {
      // Atomic renewal: allocateSeat deactivates old allocation and creates payment in one DB transaction
      const allocResult = await allocateSeat({
        studentProfileId: activeAllocation.studentProfileId,
        seatId: selectedSeat.id,
        shiftId: renewShiftId,
        startDate: renewStartDate,
        endDate: renewEndDate,
        payment: paymentPayload,
      }).unwrap();

      const paymentResult = allocResult?.payment 
        ? { payment: allocResult.payment, razorpayOrder: allocResult.razorpayOrder } 
        : await createPayment(paymentPayload).unwrap();

      const invoiceInfo = {
        payment: paymentResult?.payment || paymentResult,
        student: activeAllocation.studentProfile,
        seatNumber: selectedSeat.number || selectedSeat.seatNumber,
        shift: currentShift,
        startDate: renewStartDate,
        endDate: renewEndDate,
        branchName: branches?.find((b: any) => b.id === selectedBranch)?.name,
        originalAmount: planBasePrice,
        payableAmount: payable,
        discountAmount: discountNum,
        paidAmount: renewPaid,
        dueAmount: remainingDue,
        previousDue: studentExistingDue,
        totalDue: remainingDue + studentExistingDue,
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
                payment: verifiedPayment?.payment || verifiedPayment,
              });
            } catch (err: any) {
              showToast(err.data?.message || 'Payment verification failed', 'error');
            } finally {
              setIsRenewing(false);
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
        rzp.on('payment.failed', function (response: any) {
          showToast(response?.error?.description || 'Payment cancelled/failed', 'error');
          setIsRenewing(false);
        });
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
    renewDiscount,
    setRenewDiscount,
    handleDiscountChange,
    basePrice,
    dueAmount,
    isRenewing,
    handleRenewSeat,
  };
}
