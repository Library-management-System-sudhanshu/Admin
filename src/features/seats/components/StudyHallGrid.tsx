import React from 'react';
import { Armchair, SlidersHorizontal, Plus } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { SeatCard } from './SeatCard';
import type { Seat } from '../types';

export interface StudyHallGridProps {
  room: {
    id: string;
    name: string;
    seats?: Seat[];
    [key: string]: any;
  };
  sortedAndFilteredSeats: Seat[];
  highlightedSeatId?: string | null;
  onSelectSeat: (seat: any) => void;
  onAddSeats?: (roomId: string) => void;
  editingSeatId?: string | null;
  editingSeatNumber?: string;
  onEditNumberChange?: (val: string) => void;
  onEditNumberSubmit?: (newNumber: string) => void;
  onEditNumberCancel?: () => void;
}

export const StudyHallGrid: React.FC<StudyHallGridProps> = ({
  room,
  sortedAndFilteredSeats,
  highlightedSeatId,
  onSelectSeat,
  onAddSeats,
  editingSeatId,
  editingSeatNumber = '',
  onEditNumberChange,
  onEditNumberSubmit,
  onEditNumberCancel,
}) => {
  if (!room.seats || room.seats.length === 0) {
    return (
      <div
        className="empty-state-container"
        style={{
          padding: '36px 24px',
          background: 'rgba(248, 250, 252, 0.6)',
          borderRadius: '16px',
          border: '1px dashed rgba(15, 23, 42, 0.12)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: 'rgba(37, 99, 235, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-blue)',
            marginBottom: '12px',
          }}
        >
          <Armchair size={24} />
        </div>
        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-navy)' }}>
          No seats created in {room.name}
        </h4>
        <p style={{ margin: '4px 0 16px 0', fontSize: '0.8rem', color: 'var(--text-slate)', maxWidth: '380px' }}>
          Add seats (e.g. 1-50 or A1-A20) to start configuring and allocating students to this hall.
        </p>
        {onAddSeats && (
          <Button
            onClick={() => onAddSeats(room.id)}
            variant="primary"
            size="sm"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              borderRadius: '10px',
              backgroundColor: 'var(--accent-blue)',
              padding: '8px 16px',
            }}
          >
            <Plus size={14} /> Add Seats to {room.name}
          </Button>
        )}
      </div>
    );
  }

  if (sortedAndFilteredSeats.length === 0) {
    return (
      <div className="empty-state-container" style={{ padding: '24px' }}>
        <SlidersHorizontal size={24} style={{ color: '#94a3b8', marginBottom: '8px' }} />
        <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-navy)' }}>
          No matching seats
        </h4>
        <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: 'var(--text-slate)' }}>
          Try clearing your active filters or changing your query
        </p>
      </div>
    );
  }

  // Group seats by letter prefix if available, otherwise numeric chunks of 10
  const rows: Record<string, Seat[]> = {};
  sortedAndFilteredSeats.forEach((seat) => {
    const num = seat.number || seat.seatNumber || '';
    const match = num.match(/^([A-Za-z]+)/);
    const prefix = match ? match[1].toUpperCase() : 'NUM';
    if (!rows[prefix]) {
      rows[prefix] = [];
    }
    rows[prefix].push(seat);
  });

  const rowKeys = Object.keys(rows).sort();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
      {rowKeys.map((rowKey, idx) => {
        const rowSeats = rows[rowKey];

        if (rowKey === 'NUM') {
          const chunks: Seat[][] = [];
          for (let i = 0; i < rowSeats.length; i += 10) {
            chunks.push(rowSeats.slice(i, i + 10));
          }
          return (
            <React.Fragment key={rowKey}>
              {chunks.map((chunk, chunkIdx) => (
                <React.Fragment key={chunkIdx}>
                  <div className="study-hall-row">
                    <div className="study-hall-row-label">Row {chunkIdx + 1}</div>
                    <div className="study-hall-row-grid">
                      {chunk.map((seat) => (
                        <SeatCard
                          key={seat.id}
                          seat={seat}
                          isHighlighted={highlightedSeatId === seat.id}
                          onSelect={onSelectSeat}
                          isEditingNumber={editingSeatId === seat.id}
                          editingNumberValue={editingSeatNumber}
                          onEditNumberChange={onEditNumberChange}
                          onEditNumberSubmit={onEditNumberSubmit}
                          onEditNumberCancel={onEditNumberCancel}
                        />
                      ))}
                    </div>
                  </div>
                  {chunkIdx < chunks.length - 1 && (
                    <div className="walkway-separator">Walkway Gap</div>
                  )}
                </React.Fragment>
              ))}
            </React.Fragment>
          );
        }

        return (
          <React.Fragment key={rowKey}>
            <div className="study-hall-row">
              <div className="study-hall-row-label">Row {rowKey}</div>
              <div className="study-hall-row-grid">
                {rowSeats.map((seat) => (
                  <SeatCard
                    key={seat.id}
                    seat={seat}
                    isHighlighted={highlightedSeatId === seat.id}
                    onSelect={onSelectSeat}
                    isEditingNumber={editingSeatId === seat.id}
                    editingNumberValue={editingSeatNumber}
                    onEditNumberChange={onEditNumberChange}
                    onEditNumberSubmit={onEditNumberSubmit}
                    onEditNumberCancel={onEditNumberCancel}
                  />
                ))}
              </div>
            </div>
            {idx < rowKeys.length - 1 && (
              <div className="walkway-separator">Walkway Gap</div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
