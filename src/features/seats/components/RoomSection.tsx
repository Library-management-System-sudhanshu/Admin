import React, { useMemo } from 'react';
import { RoomToolbar } from './RoomToolbar';
import { StudyHallGrid } from './StudyHallGrid';
import { filterAndSortSeats } from '../utils/seatFiltering';
import { getSeatStatusInfo } from '../../../utils/seatUtils';
import type { Room, RoomStatusFilter, SeatSort } from '../types';

export interface RoomSectionProps {
  room: Room;
  branchName?: string;
  floorName?: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
  isFloorVisualization?: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: RoomStatusFilter | string;
  onStatusFilterChange: (status: RoomStatusFilter | string) => void;
  sortOption: SeatSort | string;
  onSortOptionChange: (sort: SeatSort | string) => void;
  onAddSeat: (roomId: string) => void;
  onRenameRoom: (room: Room) => void;
  onDeleteRoom: (roomId: string) => void;
  onSelectSeat: (seat: any) => void;
  highlightedSeatId?: string | null;
  renderVisualizationCanvas?: (room: Room) => React.ReactNode;
  editingSeatId?: string | null;
  editingSeatNumber?: string;
  onEditNumberChange?: (val: string) => void;
  onEditNumberSubmit?: (newNumber: string) => void;
  onEditNumberCancel?: () => void;
}

export const RoomSection: React.FC<RoomSectionProps> = ({
  room,
  branchName,
  floorName,
  isExpanded,
  onToggleExpand,
  isFloorVisualization = false,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sortOption,
  onSortOptionChange,
  onAddSeat,
  onRenameRoom,
  onDeleteRoom,
  onSelectSeat,
  highlightedSeatId,
  renderVisualizationCanvas,
  editingSeatId,
  editingSeatNumber,
  onEditNumberChange,
  onEditNumberSubmit,
  onEditNumberCancel,
}) => {
  const total = room.seats?.length || 0;
  const occupied = useMemo(() => {
    return (room.seats || []).filter((s) => getSeatStatusInfo(s).isOccupied).length;
  }, [room.seats]);

  const percent = total > 0 ? Math.round((occupied / total) * 100) : 0;

  const sortedAndFilteredSeats = useMemo(() => {
    return filterAndSortSeats(room.seats || [], {
      search: searchQuery,
      status: statusFilter,
      sort: sortOption,
    });
  }, [room.seats, searchQuery, statusFilter, sortOption]);

  return (
    <div className={`room-accordion ${isExpanded ? 'expanded' : ''}`}>
      <RoomToolbar
        room={room}
        totalSeats={total}
        occupancyPercent={percent}
        isExpanded={isExpanded}
        onToggleExpand={onToggleExpand}
        branchName={branchName}
        floorName={floorName}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        statusFilter={statusFilter}
        onStatusFilterChange={onStatusFilterChange}
        sortOption={sortOption}
        onSortOptionChange={onSortOptionChange}
        onAddSeat={onAddSeat}
        onRenameRoom={onRenameRoom}
        onDeleteRoom={onDeleteRoom}
      />

      {isExpanded && (
        <div className="room-accordion-body">
          {isFloorVisualization && renderVisualizationCanvas ? (
            renderVisualizationCanvas(room)
          ) : (
            <StudyHallGrid
              room={room}
              sortedAndFilteredSeats={sortedAndFilteredSeats}
              highlightedSeatId={highlightedSeatId}
              onSelectSeat={onSelectSeat}
              onAddSeats={onAddSeat}
              editingSeatId={editingSeatId}
              editingSeatNumber={editingSeatNumber}
              onEditNumberChange={onEditNumberChange}
              onEditNumberSubmit={onEditNumberSubmit}
              onEditNumberCancel={onEditNumberCancel}
            />
          )}
        </div>
      )}
    </div>
  );
};
