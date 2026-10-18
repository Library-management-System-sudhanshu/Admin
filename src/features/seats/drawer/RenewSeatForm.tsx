import React from 'react';
import { History } from 'lucide-react';
import { Select } from '../../../components/ui/Select';
import { DatePicker } from '../../../components/ui/DatePicker';
import { Button } from '../../../components/ui/Button';
import { calculatePlanPrice } from '../../../utils/dateUtils';

export interface RenewSeatFormProps {
  shifts?: any[];
  renewShiftId: string;
  onShiftChange: (shiftId: string) => void;
  renewDuration: number | string;
  onDurationChange: (duration: number | string) => void;
  renewStartDate: string;
  onStartDateChange: (val: string) => void;
  renewEndDate: string;
  onEndDateChange: (val: string) => void;
  renewAmount: string;
  onAmountChange: (val: string) => void;
  renewDiscount?: string;
  onDiscountChange?: (val: string) => void;
  renewPaymentMethod: 'UPI' | 'CASH' | 'RAZORPAY';
  onPaymentMethodChange: (val: 'UPI' | 'CASH' | 'RAZORPAY') => void;
  basePrice?: number;
  previousDue?: number;
  onSubmit: (e: React.FormEvent) => void;
  isRenewing?: boolean;
}

export const RenewSeatForm: React.FC<RenewSeatFormProps> = ({
  shifts = [],
  renewShiftId,
  onShiftChange,
  renewDuration,
  onDurationChange,
  renewStartDate,
  onStartDateChange,
  renewEndDate,
  onEndDateChange,
  renewAmount,
  onAmountChange,
  renewDiscount = '',
  onDiscountChange,
  renewPaymentMethod,
  onPaymentMethodChange,
  basePrice,
  previousDue = 0,
  onSubmit,
  isRenewing = false,
}) => {
  const selectedShift = shifts.find((s) => s.id === renewShiftId);

  const durationOptions = React.useMemo(() => {
    if (!selectedShift) {
      return [
        { value: 1, label: '1 Month' },
        { value: 2, label: '2 Months' },
        { value: 3, label: '3 Months' },
        { value: 6, label: '6 Months' },
        { value: '7d', label: '7 Days' },
        { value: '15d', label: '15 Days' },
      ];
    }

    if (Array.isArray(selectedShift.customPricing) && selectedShift.customPricing.length > 0) {
      return selectedShift.customPricing.map((cp: any) => ({
        value: cp.label,
        label: `${cp.label} (₹${cp.price})`,
      }));
    }

    const opts: { value: any; label: string }[] = [];
    if (selectedShift.price7Days) opts.push({ value: '7d', label: `7 Days (₹${selectedShift.price7Days})` });
    if (selectedShift.price15Days) opts.push({ value: '15d', label: `15 Days (₹${selectedShift.price15Days})` });
    opts.push({ value: 1, label: `1 Month (₹${selectedShift.price || 0})` });
    opts.push({ value: 2, label: `2 Months (₹${(selectedShift.price || 0) * 2})` });
    opts.push({ value: 3, label: `3 Months (₹${selectedShift.price3Months || (selectedShift.price || 0) * 3})` });
    opts.push({ value: 6, label: `6 Months (₹${selectedShift.price6Months || (selectedShift.price || 0) * 6})` });
    return opts;
  }, [selectedShift]);

  const calculatedBasePrice = React.useMemo(() => {
    if (basePrice !== undefined) return basePrice;
    if (!selectedShift) return 0;
    return calculatePlanPrice(selectedShift, renewDuration);
  }, [basePrice, selectedShift, renewDuration]);

  const discount = parseFloat(renewDiscount) || 0;
  const netPayable = Math.max(0, calculatedBasePrice - discount);
  const paid = parseFloat(renewAmount) || 0;
  const currentDue = Math.max(0, netPayable - paid);
  const studentPrevDue = previousDue && previousDue > 0 ? previousDue : 0;
  const totalDue = currentDue + studentPrevDue;

  return (
    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--status-emerald)', marginBottom: '4px' }}>
        <History size={16} />
        <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700 }}>Renew Seat Subscription</h4>
      </div>
      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-slate)' }}>
        Extend the student's booking subscription and auto-generate the renewal payment invoice.
      </p>

      <div>
        <label style={{ fontSize: '0.675rem', fontWeight: 700, color: 'var(--text-slate)', display: 'block', marginBottom: '4px' }}>
          Shift Schedule
        </label>
        <Select
          value={renewShiftId}
          onChange={(val) => {
            onShiftChange(val);
            const newShift = shifts.find((s) => s.id === val);
            if (newShift?.customPricing?.length) {
              onDurationChange(newShift.customPricing[0].label);
            }
          }}
          placeholder="Select Shift"
          options={shifts.map((s) => ({ value: s.id, label: s.name }))}
        />
      </div>

      <div>
        <label style={{ fontSize: '0.675rem', fontWeight: 700, color: 'var(--text-slate)', display: 'block', marginBottom: '4px' }}>
          Plan Duration
        </label>
        <Select
          value={renewDuration}
          onChange={(val: any) => onDurationChange(isNaN(Number(val)) ? val : Number(val))}
          placeholder="Select Duration"
          options={durationOptions}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <DatePicker
          label="Start Date"
          required
          value={renewStartDate}
          onChange={onStartDateChange}
        />
        <DatePicker
          label="End Date"
          required
          value={renewEndDate}
          onChange={onEndDateChange}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <div>
          <label style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-slate)', display: 'block', marginBottom: '4px' }}>
            Amount Paid (₹)
          </label>
          <input
            type="number"
            min="0"
            required
            value={renewAmount}
            onChange={(e) => onAmountChange(e.target.value)}
            style={{
              padding: '8px',
              fontSize: '0.8rem',
              borderRadius: '8px',
              border: '1px solid rgba(15, 23, 42, 0.05)',
              width: '100%',
              boxSizing: 'border-box',
            }}
          />
        </div>
        <div>
          <label style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-slate)', display: 'block', marginBottom: '4px' }}>
            Discount (₹)
          </label>
          <input
            type="number"
            min="0"
            placeholder="0"
            value={renewDiscount}
            onChange={(e) => onDiscountChange?.(e.target.value)}
            style={{
              padding: '8px',
              fontSize: '0.8rem',
              borderRadius: '8px',
              border: '1px solid rgba(15, 23, 42, 0.05)',
              width: '100%',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      <div>
        <label style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-slate)', display: 'block', marginBottom: '4px' }}>
          Payment Method
        </label>
        <Select
          value={renewPaymentMethod}
          onChange={(val: any) => onPaymentMethodChange(val)}
          placeholder="Payment Method"
          options={[
            { value: 'UPI', label: 'UPI' },
            { value: 'CASH', label: 'Cash' },
            { value: 'RAZORPAY', label: 'Online' },
          ]}
        />
      </div>

      {calculatedBasePrice > 0 && (
        <div
          style={{
            background: '#f8fafc',
            border: '1px solid var(--border-card)',
            borderRadius: '10px',
            padding: '10px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
            <span style={{ color: 'var(--text-slate)' }}>Total Plan Price:</span>
            <span style={{ color: 'var(--text-navy)', fontWeight: 600 }}>₹{calculatedBasePrice}</span>
          </div>

          {discount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
              <span style={{ color: 'var(--text-slate)' }}>Discount:</span>
              <span style={{ color: '#7c3aed', fontWeight: 600 }}>− ₹{discount}</span>
            </div>
          )}

          {discount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
              <span style={{ color: 'var(--text-slate)' }}>Net Payable:</span>
              <span style={{ color: 'var(--text-navy)', fontWeight: 600 }}>₹{netPayable}</span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
            <span style={{ color: 'var(--text-slate)' }}>Amount Paid:</span>
            <span style={{ color: 'var(--text-navy)', fontWeight: 600 }}>₹{paid}</span>
          </div>

          {studentPrevDue > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
              <span style={{ color: '#991b1b' }}>Previous Due:</span>
              <span style={{ color: '#991b1b', fontWeight: 600 }}>₹{studentPrevDue.toFixed(2)}</span>
            </div>
          )}

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.8rem',
              borderTop: '1px dashed var(--border-card)',
              paddingTop: '6px',
              marginTop: '2px',
            }}
          >
            <span
              style={{
                fontWeight: 700,
                color: (currentDue > 0 || studentPrevDue > 0) ? '#991b1b' : 'var(--status-emerald)',
              }}
            >
              {currentDue > 0 ? 'Due Amount:' : (studentPrevDue > 0 ? 'Total Due:' : 'Payment Status:')}
            </span>

            {currentDue > 0 ? (
              <span style={{ color: 'var(--status-red)', fontWeight: 700 }}>
                ₹{currentDue.toFixed(2)}
                {studentPrevDue > 0 && (
                  <span style={{ fontSize: '0.7rem', color: '#991b1b', fontWeight: 500, marginLeft: '4px' }}>
                    (+ ₹{studentPrevDue.toFixed(2)} prev = ₹{totalDue.toFixed(2)})
                  </span>
                )}
              </span>
            ) : studentPrevDue > 0 ? (
              <span style={{ color: '#991b1b', fontWeight: 700 }}>
                ₹{studentPrevDue.toFixed(2)} (Previous Due)
              </span>
            ) : (
              <span style={{ color: 'var(--status-emerald)', fontWeight: 700 }}>
                ✅ Fully Paid
              </span>
            )}
          </div>
        </div>
      )}

      <Button
        type="submit"
        variant="primary"
        style={{
          backgroundColor: 'var(--status-emerald)',
          borderColor: 'var(--status-emerald)',
          width: '100%',
          marginTop: '6px',
        }}
        disabled={!renewShiftId || !renewStartDate || !renewEndDate || isRenewing}
        isLoading={isRenewing}
      >
        Confirm Renewal
      </Button>
    </form>
  );
};

