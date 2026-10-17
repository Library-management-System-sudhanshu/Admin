import React from 'react';
import { History } from 'lucide-react';
import { Select } from '../../../components/ui/Select';
import { DatePicker } from '../../../components/ui/DatePicker';
import { Button } from '../../../components/ui/Button';

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
  renewPaymentMethod: 'UPI' | 'CASH' | 'RAZORPAY';
  onPaymentMethodChange: (val: 'UPI' | 'CASH' | 'RAZORPAY') => void;
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
  renewPaymentMethod,
  onPaymentMethodChange,
  onSubmit,
  isRenewing = false,
}) => {
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
          onChange={(val) => onShiftChange(val)}
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
            Amount (₹)
          </label>
          <input
            type="number"
            required
            value={renewAmount}
            onChange={(e) => onAmountChange(e.target.value)}
            style={{
              padding: '8px',
              fontSize: '0.8rem',
              borderRadius: '8px',
              border: '1px solid rgba(15, 23, 42, 0.05)',
              width: '100%',
            }}
          />
        </div>
        <div>
          <label style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-slate)', display: 'block', marginBottom: '4px' }}>
            Method
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
      </div>

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
