import React, { useMemo } from 'react';
import type { Room, Seat, Position, LayoutSpacer as LayoutSpacerType, LayoutGroup } from '../types';
import { LayoutSeat } from './LayoutSeat';
import { LayoutSpacer } from './LayoutSpacer';
import { SelectionOverlay } from './SelectionOverlay';
import { SelectionActions } from './SelectionActions';
import { LayoutToolbar } from './LayoutToolbar';
import { getSeatPosition, getSeatPixelPosition } from './layoutGeometry';
import { parseSpacers, getGroupForItem } from './layoutSerialization';

export interface LayoutCanvasProps {
  room: Room;
  isEditing: boolean;
  roomWidth: number;
  roomHeight: number;
  tempLayout: Record<string, Position>;
  spacers: LayoutSpacerType[];
  selectedArrangeIds: string[];
  statusFilter?: string;
  canUndo: boolean;
  isSaving?: boolean;
  dragSelectStart: Position | null;
  dragSelectEnd: Position | null;
  onCanvasPointerDown: (e: React.PointerEvent) => void;
  onSeatPointerDown: (e: React.PointerEvent, seatId: string) => void;
  onSeatDoubleClick?: (seat: Seat) => void;
  onSeatClick?: (seat: Seat) => void;
  onSpacerPointerDown: (e: React.PointerEvent, id: string) => void;
  onSpacerResizePointerDown: (e: React.PointerEvent, id: string) => void;
  onRemoveSpacer: (id: string) => void;
  onSelectGroup: (memberIds: string[]) => void;
  // Toolbar actions
  onStartArrange: () => void;
  onAddSpacer: () => void;
  onOpenAddDesk: () => void;
  onArrangeAscending: () => void;
  onUndo: () => void;
  onCancel: () => void;
  onSave: () => void;
  // Selection actions
  onAlign: (direction: 'horizontal' | 'vertical') => void;
  onAlignStraight: (direction: 'horizontal' | 'vertical') => void;
  onRotateSelection: () => void;
  onGroupAndLock: () => void;
  onUngroup: () => void;
  onToggleLock: (lock: boolean) => void;
}

export const LayoutCanvas: React.FC<LayoutCanvasProps> = ({
  room,
  isEditing,
  roomWidth,
  roomHeight,
  tempLayout,
  spacers,
  selectedArrangeIds,
  statusFilter = 'ALL',
  canUndo,
  isSaving = false,
  dragSelectStart,
  dragSelectEnd,
  onCanvasPointerDown,
  onSeatPointerDown,
  onSeatDoubleClick,
  onSeatClick,
  onSpacerPointerDown,
  onSpacerResizePointerDown,
  onRemoveSpacer,
  onSelectGroup,
  onStartArrange,
  onAddSpacer,
  onOpenAddDesk,
  onArrangeAscending,
  onUndo,
  onCancel,
  onSave,
  onAlign,
  onAlignStraight,
  onRotateSelection,
  onGroupAndLock,
  onUngroup,
  onToggleLock,
}) => {
  const seats = useMemo(() => {
    return [...(room.seats || [])].sort((a, b) =>
      (a.number || a.seatNumber || '').localeCompare(b.number || b.seatNumber || '', undefined, { numeric: true })
    );
  }, [room.seats]);

  const savedSpacers = useMemo(() => {
    return parseSpacers(room.spacers);
  }, [room.spacers]);

  // Compute bounding box for selection actions floating menu
  const selectionMenuPosition = useMemo(() => {
    if (!isEditing || selectedArrangeIds.length === 0) return null;
    let minY = Infinity;
    let maxX = -Infinity;

    selectedArrangeIds.forEach((id) => {
      const seat = room.seats?.find((s) => s.id === id);
      if (seat) {
        const pos = tempLayout[id] || getSeatPixelPosition(seat, 0, roomWidth, roomHeight, tempLayout);
        if (pos.y < minY) minY = pos.y;
        if (pos.x + 78 > maxX) maxX = pos.x + 78;
      } else {
        const spacer = spacers.find((s) => s.id === id);
        if (spacer) {
          const w = spacer.w || 78;
          if (spacer.y < minY) minY = spacer.y;
          if (spacer.x + w > maxX) maxX = spacer.x + w;
        }
      }
    });

    if (minY === Infinity) return null;
    return { x: maxX, y: minY - 45 };
  }, [isEditing, selectedArrangeIds, room.seats, tempLayout, spacers, roomWidth, roomHeight]);

  const hasGrouped = useMemo(() => {
    return selectedArrangeIds.some((id) => getGroupForItem(id, spacers));
  }, [selectedArrangeIds, spacers]);

  const hasLockedGroup = useMemo(() => {
    return selectedArrangeIds.some((id) => {
      const g = getGroupForItem(id, spacers);
      return g && g.locked;
    });
  }, [selectedArrangeIds, spacers]);

  const hasUnlockedGroup = useMemo(() => {
    return selectedArrangeIds.some((id) => {
      const g = getGroupForItem(id, spacers);
      return g && !g.locked;
    });
  }, [selectedArrangeIds, spacers]);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        borderRadius: '16px',
        border: isEditing ? '2px dashed var(--accent-blue)' : '1px solid var(--border-card)',
        backgroundColor: '#f8fafc',
        overflow: 'hidden',
      }}
    >
      {/* Scrollable Viewport */}
      <div style={{ width: '100%', overflow: 'auto', borderRadius: '15px' }}>
        <div
          onPointerDown={onCanvasPointerDown}
          style={{
            position: 'relative',
            width: `${roomWidth}px`,
            height: `${roomHeight}px`,
            backgroundImage: 'radial-gradient(#cbd5e1 1.5px, transparent 1.5px)',
            backgroundSize: '20px 20px',
            overflow: 'visible',
            transition: isEditing ? 'none' : 'width 150ms ease, height 150ms ease',
          }}
        >
          {/* Seats */}
          {seats.map((seat, idx) => {
            const matchesFilter = statusFilter === 'ALL' || !statusFilter || seat.status === statusFilter;
            if (!matchesFilter) return null;

            const position = isEditing
              ? getSeatPixelPosition(seat, idx, roomWidth, roomHeight, tempLayout)
              : getSeatPosition(seat, idx);
            const rotation = isEditing ? tempLayout[seat.id]?.rotation || 0 : seat.rotation || 0;
            const isSelected = selectedArrangeIds.includes(seat.id);

            return (
              <LayoutSeat
                key={seat.id}
                seat={seat}
                position={position}
                rotation={rotation}
                isEditing={isEditing}
                isSelected={isSelected}
                isOccupied={seat.status === 'OCCUPIED'}
                isExpired={false}
                onPointerDown={onSeatPointerDown}
                onDoubleClick={onSeatDoubleClick}
                onClick={onSeatClick}
              />
            );
          })}

          {/* Active Spacers in Edit Mode */}
          {isEditing &&
            spacers
              .filter((s) => s.type !== 'group_metadata')
              .map((spacer) => {
                const isSelected = selectedArrangeIds.includes(spacer.id);
                const spacerGroup = getGroupForItem(spacer.id, spacers);
                const isSpacerLocked = !!(spacerGroup && spacerGroup.locked);

                return (
                  <LayoutSpacer
                    key={spacer.id}
                    spacer={spacer}
                    isEditing={true}
                    isSelected={isSelected}
                    isLocked={isSpacerLocked}
                    isGrouped={!!spacerGroup}
                    groupMemberIds={spacerGroup?.memberIds || []}
                    onPointerDown={onSpacerPointerDown}
                    onResizePointerDown={onSpacerResizePointerDown}
                    onRemove={onRemoveSpacer}
                    onSelectGroup={onSelectGroup}
                  />
                );
              })}

          {/* View Mode Saved Spacers */}
          {!isEditing &&
            savedSpacers
              .filter((s) => s.type !== 'group_metadata')
              .map((spacer) => (
                <LayoutSpacer key={spacer.id} spacer={spacer} isEditing={false} />
              ))}

          {/* Drag Selection Marquee Box */}
          {dragSelectStart && dragSelectEnd && (
            <SelectionOverlay start={dragSelectStart} end={dragSelectEnd} />
          )}

          {/* Selection Menu Toolbar */}
          {selectionMenuPosition && (
            <SelectionActions
              selectedCount={selectedArrangeIds.length}
              position={selectionMenuPosition}
              onAlign={onAlign}
              onAlignStraight={onAlignStraight}
              onRotate={onRotateSelection}
              onGroupAndLock={onGroupAndLock}
              onUngroup={onUngroup}
              onToggleLock={onToggleLock}
              hasGrouped={hasGrouped}
              hasLockedGroup={hasLockedGroup}
              hasUnlockedGroup={hasUnlockedGroup}
            />
          )}
        </div>
      </div>

      {/* Floating Arrange Toolbar */}
      <LayoutToolbar
        isEditing={isEditing}
        canUndo={canUndo}
        isSaving={isSaving}
        onStartArrange={onStartArrange}
        onAddSpacer={onAddSpacer}
        onOpenAddDesk={onOpenAddDesk}
        onArrangeAscending={onArrangeAscending}
        onUndo={onUndo}
        onCancel={onCancel}
        onSave={onSave}
      />
    </div>
  );
};
