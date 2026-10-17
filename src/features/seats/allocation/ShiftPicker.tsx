import React from 'react';
import { Plus, AlertCircle } from 'lucide-react';
import { Select } from '../../../components/ui/Select';
import { formatTo12hString, calculateShiftDuration } from '../../../utils/dateUtils';
import type { Shift } from '../types';

export interface ShiftPickerProps {
  shifts?: Shift[];
  shiftId: string;
  onShiftChange: (shiftId: string) => void;
  onNavigateToAddShift: () => void;
  disabled?: boolean;
}

export const ShiftPicker: React.FC<ShiftPickerProps> = ({
  shifts = [],
  shiftId,
  onShiftChange,
  onNavigateToAddShift,
  disabled = false,
}) => {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
        <label
          className="custom-input-label"
          style={{
            fontSize: '0.7rem',
            fontWeight: 700,
            color: 'var(--text-slate)',
            textTransform: 'uppercase',
            marginBottom: 0,
            display: 'block',
          }}
        >
          Shift Schedule
        </label>
        <button
          type="button"
          onClick={onNavigateToAddShift}
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
          disabled={disabled}
          value={shiftId}
          onChange={(val) => {
            if (val === 'ADD_NEW_SHIFT') {
              onNavigateToAddShift();
              return;
            }
            onShiftChange(val);
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
            onClick={onNavigateToAddShift}
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
  );
};
