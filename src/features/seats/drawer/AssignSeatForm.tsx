import React from 'react';
import { User, Search, Plus, AlertCircle } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import { Switch } from '../../../components/ui/Switch';
import { DatePicker } from '../../../components/ui/DatePicker';
import { getStudentDisplayName, getStudentEmail, getStudentMobile } from '../../../utils/studentUtils';
import { formatTo12hString, calculateShiftDuration } from '../../../utils/dateUtils';
import type { Seat, Shift } from '../types';

export interface AssignSeatFormProps {
  selectedSeat: Seat | null;
  shifts?: Shift[];
  studentSearchQuery: string;
  setStudentSearchQuery: (query: string) => void;
  studentProfileId: string;
  setStudentProfileId: (id: string) => void;
  showStudentDropdown: boolean;
  setShowStudentDropdown: (show: boolean) => void;
  isSearchFocused: boolean;
  setIsSearchFocused: (focused: boolean) => void;
  displayedStudents: any[];
  shiftId: string;
  setShiftId: (id: string) => void;
  durationMode: number | string;
  setDurationMode: (mode: number | string) => void;
  startDate: string;
  setStartDate: (date: string) => void;
  endDate: string;
  setEndDate: (date: string) => void;
  shouldGenerateInvoice: boolean;
  setShouldGenerateInvoice: (generate: boolean) => void;
  invoiceAmount: string;
  setInvoiceAmount: (amount: string) => void;
  paymentMethod: 'CASH' | 'UPI' | 'RAZORPAY';
  setPaymentMethod: (method: 'CASH' | 'UPI' | 'RAZORPAY') => void;
  calculatedBaseAmount: number;
  drawerDueAmount: number;
  isAllocating: boolean;
  isCreatingPayment: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onNavigateToShifts: () => void;
}

export const AssignSeatForm: React.FC<AssignSeatFormProps> = ({
  selectedSeat,
  shifts = [],
  studentSearchQuery,
  setStudentSearchQuery,
  studentProfileId,
  setStudentProfileId,
  showStudentDropdown,
  setShowStudentDropdown,
  isSearchFocused,
  setIsSearchFocused,
  displayedStudents,
  shiftId,
  setShiftId,
  durationMode,
  setDurationMode,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  shouldGenerateInvoice,
  setShouldGenerateInvoice,
  invoiceAmount,
  setInvoiceAmount,
  paymentMethod,
  setPaymentMethod,
  calculatedBaseAmount,
  drawerDueAmount,
  isAllocating,
  isCreatingPayment,
  onSubmit,
  onNavigateToShifts,
}) => {
  const activeAllocations = selectedSeat?.allocations?.filter((a) => a.isActive) || [];

  return (
    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-blue)', marginBottom: '4px' }}>
        <User size={16} />
        <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700 }}>Assign Student Seat</h4>
      </div>

      {/* Shared Seat Warning Alert */}
      {activeAllocations.length > 0 && (
        <div
          style={{
            padding: '10px 12px',
            backgroundColor: '#fffbeb',
            border: '1px solid #fef3c7',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#b45309', display: 'flex', alignItems: 'center', gap: '4px' }}>
            ⚠️ Shared Seat Warning
          </span>
          <span style={{ fontSize: '0.675rem', color: '#b45309', lineHeight: '1.3' }}>
            This seat is already occupied during:
            <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
              {activeAllocations.map((alloc) => (
                <li key={alloc.id}>
                  <strong>{alloc.shift?.name}</strong>: {getStudentDisplayName(alloc.studentProfile)}
                </li>
              ))}
            </ul>
          </span>
        </div>
      )}

      {/* Student autocomplete search */}
      <div style={{ position: 'relative' }}>
        <label
          className="custom-input-label"
          style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-slate)', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}
        >
          Search Student
        </label>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#F1F5F9',
            borderRadius: '12px',
            padding: '4px 12px',
            border: isSearchFocused ? '1px solid var(--accent-blue)' : '1px solid transparent',
            transition: 'all 150ms ease',
          }}
        >
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
            onFocus={() => {
              setShowStudentDropdown(true);
              setIsSearchFocused(true);
            }}
            onBlur={() => {
              setIsSearchFocused(false);
              setTimeout(() => setShowStudentDropdown(false), 250);
            }}
            style={{
              border: 'none',
              background: 'transparent',
              outline: 'none',
              width: '100%',
              padding: '6px 0',
              fontSize: '0.85rem',
              color: 'var(--text-navy)',
            }}
          />
        </div>

        {showStudentDropdown && displayedStudents.length > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              backgroundColor: '#ffffff',
              border: '1px solid var(--border-card)',
              borderRadius: '12px',
              boxShadow: 'var(--shadow-hover)',
              zIndex: 1000,
              marginTop: '4px',
              maxHeight: '180px',
              overflowY: 'auto',
            }}
          >
            {displayedStudents.map((st: any) => (
              <div
                key={st.id}
                onMouseDown={(e) => {
                  e.preventDefault();
                  setStudentProfileId(st.id);
                  setStudentSearchQuery(getStudentDisplayName(st));
                  setShowStudentDropdown(false);
                }}
                style={{
                  padding: '8px 12px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  borderBottom: '1px solid #f1f5f9',
                }}
              >
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-navy)' }}>{getStudentDisplayName(st)}</span>
                <span style={{ fontSize: '0.675rem', color: 'var(--text-slate)' }}>
                  {getStudentEmail(st)} • {getStudentMobile(st)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Shift select */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
          <label
            className="custom-input-label"
            style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-slate)', textTransform: 'uppercase', marginBottom: 0, display: 'block' }}
          >
            Shift Schedule
          </label>
          <button
            type="button"
            onClick={onNavigateToShifts}
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
            }}
          >
            <Plus size={13} strokeWidth={2.5} /> Add Shift
          </button>
        </div>
        {shifts && shifts.length > 0 ? (
          <Select
            value={shiftId}
            onChange={(val) => {
              if (val === 'ADD_NEW_SHIFT') {
                onNavigateToShifts();
                return;
              }
              setShiftId(val);
            }}
            placeholder="Select schedule shift"
            options={[
              ...shifts.map((s) => ({
                value: s.id,
                label: `${s.name} (${calculateShiftDuration(s.startTime, s.endTime)}) (${formatTo12hString(s.startTime)} - ${formatTo12hString(s.endTime)})`,
              })),
              { value: 'ADD_NEW_SHIFT', label: '+ Add New Shift', isAction: true },
            ]}
          />
        ) : (
          <div
            style={{
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
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '180px' }}>
              <AlertCircle size={16} style={{ flexShrink: 0, color: '#ef4444' }} />
              <span>No shifts are configured. Add a shift in Settings to allocate this seat.</span>
            </div>
            <button
              type="button"
              onClick={onNavigateToShifts}
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

      {/* Duration mode */}
      <div>
        <label
          className="custom-input-label"
          style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-slate)', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}
        >
          Duration
        </label>
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
              { value: 6, label: '6 Months' },
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
              transition: 'all 150ms ease',
            }}
          >
            Flex Dates
          </button>
        </div>
      </div>

      {/* Dates Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <DatePicker label="Start Date" required value={startDate} onChange={(val) => setStartDate(val)} />
        <DatePicker
          label="End Date"
          required
          disabled={durationMode !== 'flex'}
          value={endDate}
          onChange={(val) => setEndDate(val)}
        />
      </div>

      {/* Generate Fee Invoice Switch */}
      <div style={{ margin: '6px 0' }}>
        <Switch
          checked={shouldGenerateInvoice}
          onChange={setShouldGenerateInvoice}
          label="Generate invoice & fee receipt"
          id="generate-invoice-drawer"
        />
      </div>

      {/* Invoicing details fields */}
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
              <input
                type="number"
                required={shouldGenerateInvoice}
                placeholder="e.g. 1500"
                value={invoiceAmount}
                onChange={(e) => setInvoiceAmount(e.target.value)}
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
                  {drawerDueAmount > 0 ? (
                    <span style={{ color: 'var(--status-red)', fontWeight: 700 }}>Due: ₹{drawerDueAmount}</span>
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
                value={paymentMethod}
                onChange={(val: any) => setPaymentMethod(val)}
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

      {/* Submit / Cancel actions */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
        <Button
          type="submit"
          variant="primary"
          style={{ flex: 1, backgroundColor: 'var(--accent-blue)', borderColor: 'var(--accent-blue)', borderRadius: '12px' }}
          disabled={!studentProfileId || !shiftId || !startDate || !endDate || (shouldGenerateInvoice && !invoiceAmount)}
          isLoading={isAllocating || isCreatingPayment}
        >
          Assign Student
        </Button>
      </div>
    </form>
  );
};
