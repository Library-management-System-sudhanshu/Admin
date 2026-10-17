import React from 'react';
import { Select } from '../../../components/ui/Select';
import { DatePicker } from '../../../components/ui/DatePicker';

export interface BookingDatesFieldsProps {
  durationMode: number | string;
  onDurationModeChange: (mode: number | string) => void;
  startDate: string;
  onStartDateChange: (date: string) => void;
  endDate: string;
  onEndDateChange: (date: string) => void;
  disabled?: boolean;
}

export const BookingDatesFields: React.FC<BookingDatesFieldsProps> = ({
  durationMode,
  onDurationModeChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  disabled = false,
}) => {
  return (
    <>
      {/* Duration selector */}
      <div>
        <label
          className="custom-input-label"
          style={{
            fontSize: '0.7rem',
            fontWeight: 700,
            color: 'var(--text-slate)',
            textTransform: 'uppercase',
            marginBottom: '4px',
            display: 'block',
          }}
        >
          Duration
        </label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Select
            disabled={disabled}
            value={typeof durationMode === 'number' ? durationMode : ''}
            onChange={(val) => onDurationModeChange(Number(val))}
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
            disabled={disabled}
            onClick={() => onDurationModeChange('flex')}
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
              opacity: disabled ? 0.6 : 1,
            }}
          >
            Flex Dates
          </button>
        </div>
      </div>

      {/* Dates Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <DatePicker
          label="Start Date"
          required
          disabled={disabled}
          value={startDate}
          onChange={(val) => onStartDateChange(val)}
        />
        <DatePicker
          label="End Date"
          required
          disabled={disabled || durationMode !== 'flex'}
          value={endDate}
          onChange={(val) => onEndDateChange(val)}
        />
      </div>
    </>
  );
};
