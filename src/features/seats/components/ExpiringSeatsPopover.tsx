import React, { useState } from 'react';
import { Bell } from 'lucide-react';

export interface ExpiringSeatItem {
  seatId: string;
  seatNumber: string;
  studentName: string;
  daysLeft: number;
  roomName: string;
  floorName?: string;
}

export interface ExpiringSeatsPopoverProps {
  expiringSeats: ExpiringSeatItem[];
  onSelectSeat: (seatId: string) => void;
}

export const ExpiringSeatsPopover: React.FC<ExpiringSeatsPopoverProps> = ({
  expiringSeats,
  onSelectSeat,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title="Expiring Subscriptions"
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          backgroundColor: '#ffffff',
          border: '1px solid rgba(15, 23, 42, 0.05)',
          boxShadow: 'var(--shadow-soft)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: 'var(--text-navy)',
          position: 'relative',
        }}
      >
        <Bell size={18} />
        {expiringSeats.length > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-2px',
              right: '-2px',
              backgroundColor: 'var(--status-red)',
              color: 'white',
              fontSize: '0.6rem',
              fontWeight: 800,
              borderRadius: '50%',
              minWidth: '16px',
              height: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid white',
            }}
          >
            {expiringSeats.length}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            onClick={() => setIsOpen(false)}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 998 }}
          />
          <div
            className="glass-card animate-fade-in"
            style={{
              position: 'absolute',
              right: 0,
              top: '44px',
              width: '300px',
              padding: '12px',
              zIndex: 999,
              border: '1px solid var(--border-card)',
              maxHeight: '350px',
              overflowY: 'auto',
            }}
          >
            <h4
              style={{
                margin: '0 0 10px 0',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: 'var(--text-navy)',
                borderBottom: '1px solid var(--border-card)',
                paddingBottom: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span>Expiring Subscriptions</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-slate)' }}>Next 7 days</span>
            </h4>

            {expiringSeats.length === 0 ? (
              <p
                style={{
                  margin: 0,
                  fontSize: '0.75rem',
                  color: 'var(--text-slate)',
                  textAlign: 'center',
                  padding: '16px 0',
                }}
              >
                No seats expiring soon!
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {expiringSeats.map((item) => (
                  <div
                    key={item.seatId}
                    onClick={() => {
                      onSelectSeat(item.seatId);
                      setIsOpen(false);
                    }}
                    style={{
                      padding: '8px',
                      borderRadius: '8px',
                      background: '#f8fafc',
                      border: '1px solid #f1f5f9',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-navy)' }}>
                        Seat {item.seatNumber}
                      </span>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          color: item.daysLeft <= 3 ? 'var(--status-red)' : 'var(--status-amber)',
                        }}
                      >
                        {item.daysLeft}d left
                      </span>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-slate)' }}>
                      {item.studentName} ({item.roomName})
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
