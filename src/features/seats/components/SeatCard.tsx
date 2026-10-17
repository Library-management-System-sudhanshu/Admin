import React from 'react';
import { Lock, Link2, Wrench } from 'lucide-react';
import { getSeatStatusInfo } from '../../../utils/seatUtils';
import { getStudentDisplayName } from '../../../utils/studentUtils';

export interface SeatCardProps {
  seat: any;
  isHighlighted?: boolean;
  isFloorCanvas?: boolean;
  rotationVal?: number;
  isSeatLocked?: boolean;
  seatGroup?: any;
  isEditingLayout?: boolean;
  onSelect: (seat: any) => void;
  onRotate?: (seatId: string) => void;
  isEditingNumber?: boolean;
  editingNumberValue?: string;
  onEditNumberChange?: (val: string) => void;
  onEditNumberSubmit?: (newNumber: string) => void;
  onEditNumberCancel?: () => void;
}

const getShiftBadgeStyle = (shiftName: string = '') => {
  const name = shiftName.toLowerCase();
  if (name.includes('morning')) return { bg: '#e0f2fe', fg: '#0369a1', border: '#bae6fd', label: 'M' };
  if (name.includes('evening')) return { bg: '#ffedd5', fg: '#c2410c', border: '#fed7aa', label: 'E' };
  if (name.includes('night')) return { bg: '#faf5ff', fg: '#6b21a8', border: '#e9d5ff', label: 'N' };
  if (name.includes('afternoon')) return { bg: '#fef9c3', fg: '#854d0e', border: '#fef08a', label: 'A' };
  return { bg: '#f1f5f9', fg: '#475569', border: '#e2e8f0', label: shiftName ? shiftName.charAt(0).toUpperCase() : 'S' };
};

const getSeatFaceStyle = (rotation: number = 0) => {
  switch (rotation) {
    case 90:
      return { position: 'absolute' as const, top: 0, bottom: 0, right: 0, width: '5px', backgroundColor: '#2563eb', borderRadius: '0 8px 8px 0', zIndex: 5 };
    case 180:
      return { position: 'absolute' as const, bottom: 0, left: 0, right: 0, height: '5px', backgroundColor: '#2563eb', borderRadius: '0 0 8px 8px', zIndex: 5 };
    case 270:
      return { position: 'absolute' as const, top: 0, bottom: 0, left: 0, width: '5px', backgroundColor: '#2563eb', borderRadius: '8px 0 0 8px', zIndex: 5 };
    case 0:
    default:
      return { position: 'absolute' as const, top: 0, left: 0, right: 0, height: '5px', backgroundColor: '#2563eb', borderRadius: '8px 8px 0 0', zIndex: 5 };
  }
};

export const SeatCard: React.FC<SeatCardProps> = ({
  seat,
  isHighlighted = false,
  isFloorCanvas = false,
  rotationVal = 0,
  isSeatLocked = false,
  seatGroup,
  isEditingLayout = false,
  onSelect,
  onRotate,
  isEditingNumber = false,
  editingNumberValue = '',
  onEditNumberChange,
  onEditNumberSubmit,
  onEditNumberCancel,
}) => {
  const { isOccupied, isExpired, activeAllocations, currentAllocations } = getSeatStatusInfo(seat);
  const seatClass = seat.status === 'BLOCKED' ? 'blocked' : seat.status === 'RESERVED' ? 'reserved' : isOccupied ? 'occupied' : 'available';

  return (
    <div
      id={`seat-${seat.id}`}
      className={`seat-tile ${seatClass} seat-container-hover`}
      onClick={(e) => {
        if (isEditingLayout) {
          e.stopPropagation();
          return;
        }
        onSelect(seat);
      }}
      style={{
        width: '78px',
        height: '78px',
        border: isHighlighted ? '2px solid var(--accent-blue)' : undefined,
        boxShadow: isHighlighted ? '0 0 0 3px rgba(37, 99, 235, 0.25), var(--shadow-hover)' : undefined,
        transform: isHighlighted ? 'scale(1.05)' : undefined,
        cursor: isEditingLayout ? (isSeatLocked ? 'not-allowed' : 'move') : 'pointer',
      }}
    >
      {/* Visualizer Lock Indicator */}
      {isFloorCanvas && isEditingLayout && isSeatLocked && (
        <div
          style={{
            position: 'absolute',
            top: '4px',
            left: '4px',
            zIndex: 10,
            color: '#ef4444',
            backgroundColor: 'rgba(255,255,255,0.85)',
            borderRadius: '4px',
            padding: '2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
          title="Locked in Group"
        >
          <Lock size={10} />
        </div>
      )}

      {/* Visualizer Group Indicator */}
      {isFloorCanvas && isEditingLayout && seatGroup && !isSeatLocked && (
        <div
          style={{
            position: 'absolute',
            top: '4px',
            left: '4px',
            zIndex: 10,
            color: '#2563eb',
            backgroundColor: 'rgba(255,255,255,0.85)',
            borderRadius: '4px',
            padding: '2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
          title="Grouped"
        >
          <Link2 size={10} />
        </div>
      )}

      {/* Rotate button when editing layout */}
      {isFloorCanvas && isEditingLayout && onRotate && (
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onRotate(seat.id);
          }}
          style={{
            position: 'absolute',
            top: '-6px',
            left: '-6px',
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            backgroundColor: '#ffffff',
            border: '1.5px solid var(--accent-blue)',
            color: 'var(--accent-blue)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 15,
            fontSize: '0.6rem',
            fontWeight: 800,
            boxShadow: 'var(--shadow-soft)',
          }}
          title="Rotate Seat"
        >
          ↻
        </button>
      )}

      {isFloorCanvas ? (
        <div style={getSeatFaceStyle(rotationVal)} />
      ) : (
        <div className="seat-tile-accent" />
      )}

      {/* Seat Number */}
      {isEditingNumber ? (
        <input
          type="text"
          value={editingNumberValue}
          onChange={(e) => onEditNumberChange && onEditNumberChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onEditNumberSubmit && onEditNumberSubmit(editingNumberValue);
            } else if (e.key === 'Escape') {
              onEditNumberCancel && onEditNumberCancel();
            }
          }}
          onBlur={() => {
            onEditNumberSubmit && onEditNumberSubmit(editingNumberValue);
          }}
          autoFocus
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            width: '50px',
            height: '22px',
            textAlign: 'center',
            fontSize: '0.85rem',
            fontWeight: 700,
            color: 'var(--text-navy)',
            border: '2px solid var(--accent-blue)',
            borderRadius: '6px',
            outline: 'none',
            zIndex: 20,
            boxShadow: 'var(--shadow-soft)',
          }}
        />
      ) : (
        <span
          style={{
            position: 'absolute',
            top: '4px',
            right: '6px',
            fontSize: '0.625rem',
            fontWeight: 800,
            color: 'var(--text-slate)',
            opacity: 0.85,
            zIndex: 2,
          }}
        >
          {seat.number || seat.seatNumber}
        </span>
      )}

      {/* Occupant/Status indicator */}
      {isOccupied ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'center',
            width: '100%',
            paddingLeft: '8px',
            paddingRight: '8px',
            marginTop: '12px',
            gap: '2px',
            overflow: 'hidden',
            zIndex: 1,
          }}
        >
          {currentAllocations.map((alloc: any) => {
            const badge = getShiftBadgeStyle(alloc.shift?.name || '');
            const studentName = getStudentDisplayName(alloc.studentProfile);
            return (
              <div
                key={alloc.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  gap: '2px',
                  lineHeight: '1.2',
                }}
                title={`${studentName} (${alloc.shift?.name || 'Shift'})`}
              >
                <span
                  style={{
                    fontSize: '0.52rem',
                    fontWeight: 700,
                    color: 'var(--text-navy)',
                    maxWidth: '46px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {studentName.split(' ')[0]}
                </span>
                <span
                  style={{
                    fontSize: '0.45rem',
                    fontWeight: 800,
                    backgroundColor: badge.bg,
                    color: badge.fg,
                    border: `1px solid ${badge.border}`,
                    padding: '0px 3px',
                    borderRadius: '4px',
                    lineHeight: '1',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '10px',
                    height: '10px',
                    flexShrink: 0,
                  }}
                >
                  {badge.label}
                </span>
              </div>
            );
          })}
        </div>
      ) : isExpired ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, marginTop: '8px', gap: '2px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px' }}>
            <span className="seat-dot available" style={{ width: '4px', height: '4px' }} />
            <span style={{ fontSize: '0.48rem', fontWeight: 700, color: 'var(--status-emerald)' }}>FREE</span>
          </div>
        </div>
      ) : seat.status === 'BLOCKED' ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, marginTop: '8px', gap: '2px' }}>
          <Wrench size={10} style={{ color: 'var(--status-amber)' }} />
          <span style={{ fontSize: '0.525rem', fontWeight: 700, color: 'var(--status-amber)' }}>MAINT</span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, marginTop: '8px', gap: '2px' }}>
          <span className="seat-dot available" />
          <span style={{ fontSize: '0.525rem', fontWeight: 600, color: 'var(--status-emerald)' }}>FREE</span>
        </div>
      )}

      {/* Hover Tooltip */}
      <div className="custom-tooltip" style={{ minWidth: 'auto', width: 'max-content', padding: '5px 8px', borderRadius: '8px' }}>
        {activeAllocations.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left' }}>
            <strong style={{ fontSize: '0.725rem', borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: '2px', marginBottom: '1px', display: 'block' }}>
              Occupants ({activeAllocations.length})
            </strong>
            {activeAllocations.map((alloc: any) => {
              const formattedEnd = alloc.endDate
                ? new Date(alloc.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                : 'N/A';
              return (
                <div key={alloc.id} style={{ display: 'flex', flexDirection: 'column', fontSize: '0.75rem', lineHeight: '1.2' }}>
                  <span style={{ fontWeight: 700 }}>{getStudentDisplayName(alloc.studentProfile)}</span>
                  <span style={{ opacity: 0.8, fontSize: '0.65rem' }}>Shift: {alloc.shift?.name}</span>
                  <span style={{ opacity: 0.8, fontSize: '0.65rem' }}>Ends: {formattedEnd}</span>
                </div>
              );
            })}
          </div>
        ) : seat.status === 'BLOCKED' ? (
          <strong>Maintenance</strong>
        ) : (
          <strong>Available</strong>
        )}
      </div>
    </div>
  );
};
