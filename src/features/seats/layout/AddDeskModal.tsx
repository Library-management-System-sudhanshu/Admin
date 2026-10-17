import React from 'react';
import { Button } from '../../../components/ui/Button';
import type { Room } from '../types';

export interface AddDeskModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room | null;
  deskSeatCount: number | '';
  setDeskSeatCount: (count: number | '') => void;
  deskLayoutType: 'one_side' | 'both_sides';
  setDeskLayoutType: (type: 'one_side' | 'both_sides') => void;
  deskStartSeat: number | '';
  setDeskStartSeat: (seat: number | '') => void;
  onSubmit: () => void;
  isLoading?: boolean;
}

export const AddDeskModal: React.FC<AddDeskModalProps> = ({
  isOpen,
  onClose,
  room,
  deskSeatCount,
  setDeskSeatCount,
  deskLayoutType,
  setDeskLayoutType,
  deskStartSeat,
  setDeskStartSeat,
  onSubmit,
  isLoading = false,
}) => {
  if (!isOpen || !room) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(15, 23, 42, 0.4)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999,
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          width: '420px',
          padding: '24px',
          boxShadow: 'var(--shadow-xl)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-navy)' }}>
            Add Desk Layout
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: 'var(--text-slate)' }}>
            Configure the desk size, layout structure, and seat numbers.
          </p>
        </div>

        {/* Number of Seats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-navy)' }}>Number of Seats</label>
          <input
            type="number"
            min={1}
            max={50}
            value={deskSeatCount}
            onChange={(e) => {
              if (e.target.value === '') {
                setDeskSeatCount('');
                return;
              }
              const val = parseInt(e.target.value, 10);
              if (!isNaN(val)) {
                setDeskSeatCount(val);
              }
            }}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1.5px solid var(--border-card)',
              fontSize: '0.85rem',
              outline: 'none',
              fontWeight: 500,
            }}
          />
        </div>

        {/* Desk Layout Selection */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-navy)' }}>Desk Layout</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setDeskLayoutType('one_side')}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '8px',
                border: '1.5px solid',
                borderColor: deskLayoutType === 'one_side' ? 'var(--accent-blue)' : 'var(--border-card)',
                backgroundColor: deskLayoutType === 'one_side' ? 'rgba(37, 99, 235, 0.05)' : '#ffffff',
                color: deskLayoutType === 'one_side' ? 'var(--accent-blue)' : 'var(--text-navy)',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              One Side
            </button>
            <button
              type="button"
              onClick={() => setDeskLayoutType('both_sides')}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '8px',
                border: '1.5px solid',
                borderColor: deskLayoutType === 'both_sides' ? 'var(--accent-blue)' : 'var(--border-card)',
                backgroundColor: deskLayoutType === 'both_sides' ? 'rgba(37, 99, 235, 0.05)' : '#ffffff',
                color: deskLayoutType === 'both_sides' ? 'var(--accent-blue)' : 'var(--text-navy)',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Both Sides
            </button>
          </div>
        </div>

        {/* Start and End Seat range */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-navy)' }}>
              Starting Seat Number
            </label>
            <input
              type="number"
              min={1}
              value={deskStartSeat}
              onChange={(e) => {
                if (e.target.value === '') {
                  setDeskStartSeat('');
                  return;
                }
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val)) {
                  setDeskStartSeat(val);
                }
              }}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1.5px solid var(--border-card)',
                fontSize: '0.85rem',
                outline: 'none',
                fontWeight: 500,
              }}
            />
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-navy)' }}>
              Ending Seat (Calculated)
            </label>
            <input
              type="text"
              disabled
              value={deskStartSeat && deskSeatCount ? Number(deskStartSeat) + Number(deskSeatCount) - 1 : ''}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1.5px solid var(--border-card)',
                backgroundColor: '#f8fafc',
                color: 'var(--text-slate)',
                fontSize: '0.85rem',
                fontWeight: 600,
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
          <Button
            variant="outline"
            onClick={onClose}
            style={{ flex: 1, padding: '8px', fontSize: '0.8rem', height: '36px' }}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={onSubmit}
            isLoading={isLoading}
            style={{
              flex: 1,
              padding: '8px',
              fontSize: '0.8rem',
              height: '36px',
              backgroundColor: '#000000',
              borderColor: '#000000',
              color: '#ffffff',
            }}
          >
            Create
          </Button>
        </div>
      </div>
    </div>
  );
};
