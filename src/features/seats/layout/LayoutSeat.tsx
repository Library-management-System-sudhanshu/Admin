import React from 'react';
import type { Seat, Position } from '../types';
import { SeatCard } from '../components/SeatCard';

export interface LayoutSeatProps {
  seat: Seat;
  position: Position;
  rotation: number;
  isEditing: boolean;
  isSelected: boolean;
  isOccupied: boolean;
  isExpired: boolean;
  onPointerDown?: (e: React.PointerEvent, seatId: string) => void;
  onDoubleClick?: (seat: Seat) => void;
  onClick?: (seat: Seat) => void;
}

export const LayoutSeat: React.FC<LayoutSeatProps> = ({
  seat,
  position,
  rotation,
  isEditing,
  isSelected,
  isOccupied,
  isExpired,
  onPointerDown,
  onDoubleClick,
  onClick,
}) => {
  return (
    <div
      onPointerDown={(e) => {
        if (isEditing && onPointerDown) {
          e.stopPropagation();
          onPointerDown(e, seat.id);
        }
      }}
      onDoubleClick={(e) => {
        if (isEditing && onDoubleClick) {
          e.stopPropagation();
          onDoubleClick(seat);
        }
      }}
      onClick={(e) => {
        if (isEditing) {
          e.stopPropagation();
        } else if (onClick) {
          onClick(seat);
        }
      }}
      style={{
        position: 'absolute',
        left: isEditing ? `${position.x}px` : `${position.x}%`,
        top: isEditing ? `${position.y}px` : `${position.y}%`,
        touchAction: 'none',
        cursor: isEditing ? 'move' : 'pointer',
        zIndex: isEditing ? (isSelected ? 6 : 5) : 2,
        transition: isEditing ? 'none' : 'all 0.15s ease',
        outline: isEditing && isSelected ? '3px solid var(--accent-blue)' : undefined,
        outlineOffset: '2px',
        borderRadius: '8px',
      }}
    >
      <SeatCard
        seat={seat}
        isFloorCanvas={true}
        isEditingLayout={isEditing}
        rotationVal={rotation}
        onSelect={() => onClick?.(seat)}
      />
    </div>
  );
};
