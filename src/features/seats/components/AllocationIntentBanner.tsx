import React from 'react';

export interface AllocationIntentBannerProps {
  student: {
    id: string;
    name: string;
    joiningDate?: string;
    shiftId?: string;
  } | null;
  onCancel: () => void;
}

export const AllocationIntentBanner: React.FC<AllocationIntentBannerProps> = ({
  student,
  onCancel,
}) => {
  if (!student) return null;

  return (
    <div
      style={{
        backgroundColor: '#eff6ff',
        border: '1px solid #bfdbfe',
        borderRadius: '12px',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        boxShadow: 'var(--shadow-soft)',
        marginBottom: '16px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '1.25rem' }} role="img" aria-label="Target">🎯</span>
        <span style={{ fontSize: '0.875rem', color: '#1e3a8a', fontWeight: 600 }}>
          Allocating seat for <strong style={{ textDecoration: 'underline' }}>{student.name}</strong>. Please click on any available (green) seat below to proceed.
        </span>
      </div>
      <button
        type="button"
        onClick={onCancel}
        style={{
          background: '#ffffff',
          border: '1px solid #d1d5db',
          borderRadius: '8px',
          padding: '6px 14px',
          fontSize: '0.75rem',
          fontWeight: 600,
          color: '#374151',
          cursor: 'pointer',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
          whiteSpace: 'nowrap',
          transition: 'all 0.15s ease',
        }}
      >
        Cancel Allocation
      </button>
    </div>
  );
};
