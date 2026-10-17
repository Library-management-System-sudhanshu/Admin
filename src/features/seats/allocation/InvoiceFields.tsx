import React from 'react';
import { Switch } from '../../../components/ui/Switch';
import { Select } from '../../../components/ui/Select';

export interface InvoiceFieldsProps {
  shouldGenerateInvoice: boolean;
  onShouldGenerateInvoiceChange: (gen: boolean) => void;
  invoiceAmount: string;
  onInvoiceAmountChange: (amount: string) => void;
  paymentMethod: 'CASH' | 'UPI' | 'RAZORPAY';
  onPaymentMethodChange: (method: 'CASH' | 'UPI' | 'RAZORPAY') => void;
  calculatedBaseAmount: number;
  dueAmount: number;
  switchId?: string;
  disabled?: boolean;
}

export const InvoiceFields: React.FC<InvoiceFieldsProps> = ({
  shouldGenerateInvoice,
  onShouldGenerateInvoiceChange,
  invoiceAmount,
  onInvoiceAmountChange,
  paymentMethod,
  onPaymentMethodChange,
  calculatedBaseAmount,
  dueAmount,
  switchId = 'generate-invoice-switch',
  disabled = false,
}) => {
  return (
    <>
      <div style={{ margin: '6px 0' }}>
        <Switch
          checked={shouldGenerateInvoice}
          onChange={onShouldGenerateInvoiceChange}
          label="Generate invoice & fee receipt"
          id={switchId}
          disabled={disabled}
        />
      </div>

      {shouldGenerateInvoice && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            background: '#F8FAFC',
            padding: '12px',
            borderRadius: '12px',
            border: '1px dashed rgba(15, 23, 42, 0.05)',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <label
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  color: 'var(--text-slate)',
                  textTransform: 'uppercase',
                  display: 'block',
                  marginBottom: '4px',
                }}
              >
                Amount (₹)
              </label>
              <input
                type="number"
                disabled={disabled}
                required={shouldGenerateInvoice}
                placeholder="e.g. 1500"
                value={invoiceAmount}
                onChange={(e) => onInvoiceAmountChange(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '12px',
                  border: '1px solid rgba(15, 23, 42, 0.05)',
                  fontSize: '0.8rem',
                  width: '100%',
                  outline: 'none',
                  backgroundColor: '#ffffff',
                }}
              />
              {calculatedBaseAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.7rem' }}>
                  <span style={{ color: 'var(--text-slate)' }}>Total: ₹{calculatedBaseAmount}</span>
                  {dueAmount > 0 ? (
                    <span style={{ color: 'var(--status-red)', fontWeight: 700 }}>Due: ₹{dueAmount}</span>
                  ) : (
                    <span style={{ color: 'var(--status-emerald)', fontWeight: 700 }}>Paid</span>
                  )}
                </div>
              )}
            </div>
            <div>
              <label
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  color: 'var(--text-slate)',
                  textTransform: 'uppercase',
                  display: 'block',
                  marginBottom: '4px',
                }}
              >
                Method
              </label>
              <Select
                disabled={disabled}
                value={paymentMethod}
                onChange={(val: any) => onPaymentMethodChange(val)}
                placeholder="Select channel"
                options={[
                  { value: 'CASH', label: 'Cash' },
                  { value: 'UPI', label: 'UPI' },
                  { value: 'RAZORPAY', label: 'Online' },
                ]}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
