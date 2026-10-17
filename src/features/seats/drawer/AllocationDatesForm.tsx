import React from 'react';
import { DatePicker } from '../../../components/ui/DatePicker';
import { Button } from '../../../components/ui/Button';

export interface AllocationDatesFormProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (val: string) => void;
  onEndDateChange: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading?: boolean;
}

export const AllocationDatesForm: React.FC<AllocationDatesFormProps> = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onSubmit,
  isLoading = false,
}) => {
  return (
    <form
      onSubmit={onSubmit}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        background: '#F8FAFC',
        padding: '10px',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
      }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
        <DatePicker
          label="Start"
          required
          value={startDate}
          onChange={onStartDateChange}
        />
        <DatePicker
          label="End"
          required
          value={endDate}
          onChange={onEndDateChange}
        />
      </div>
      <Button
        type="submit"
        size="sm"
        variant="primary"
        style={{ backgroundColor: 'var(--accent-blue)', width: '100%', marginTop: '4px' }}
        isLoading={isLoading}
      >
        Save Dates
      </Button>
    </form>
  );
};
