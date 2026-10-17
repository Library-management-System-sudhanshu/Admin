import React from 'react';
import { HelpCircle, DoorOpen, Plus } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { LoadingState } from '../../../components/feedback/LoadingState';
import { RoomSection } from './RoomSection';
import type { Floor, Room, RoomStatusFilter, SeatSort } from '../types';

export interface SeatsWorkspaceProps {
  isLoading: boolean;
  mapError?: any;
  seatMap?: Floor[] | null;
  currentFloor?: Floor | null;
  branchName?: string;
  onAddFloor: () => void;
  onAddRoom: (floorId: string) => void;
  onAddSeat: (roomId: string) => void;
  collapsedRooms: Record<string, boolean>;
  onToggleCollapseRoom: (roomId: string) => void;
  roomSearches: Record<string, string>;
  onRoomSearchChange: (roomId: string, query: string) => void;
  statusFilters: Record<string, RoomStatusFilter | string>;
  onStatusFilterChange: (roomId: string, status: RoomStatusFilter | string) => void;
  sortOptions: Record<string, SeatSort | string>;
  onSortOptionChange: (roomId: string, sort: SeatSort | string) => void;
  onRenameRoom: (room: Room) => void;
  onDeleteRoom: (roomId: string) => void;
  onSelectSeat: (seat: any) => void;
  highlightedSeatId?: string | null;
  isFloorVisualization?: boolean;
  renderVisualizationCanvas?: (room: Room) => React.ReactNode;
  editingSeatId?: string | null;
  editingSeatNumber?: string;
  onEditNumberChange?: (val: string) => void;
  onEditNumberSubmit?: (newNumber: string) => void;
  onEditNumberCancel?: () => void;
}

export const SeatsWorkspace: React.FC<SeatsWorkspaceProps> = ({
  isLoading,
  mapError,
  seatMap,
  currentFloor,
  branchName,
  onAddFloor,
  onAddRoom,
  onAddSeat,
  collapsedRooms,
  onToggleCollapseRoom,
  roomSearches,
  onRoomSearchChange,
  statusFilters,
  onStatusFilterChange,
  sortOptions,
  onSortOptionChange,
  onRenameRoom,
  onDeleteRoom,
  onSelectSeat,
  highlightedSeatId,
  isFloorVisualization = false,
  renderVisualizationCanvas,
  editingSeatId,
  editingSeatNumber,
  onEditNumberChange,
  onEditNumberSubmit,
  onEditNumberCancel,
}) => {
  if (isLoading) {
    return <LoadingState />;
  }

  if (mapError && !seatMap) {
    return null;
  }

  if (!seatMap || seatMap.length === 0) {
    return (
      <div className="empty-state-container">
        <HelpCircle size={48} style={{ color: '#94a3b8', marginBottom: '16px' }} />
        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-navy)' }}>
          No floors configured
        </h3>
        <p style={{ margin: '8px 0 16px 0', fontSize: '0.875rem', color: 'var(--text-slate)', maxWidth: '400px' }}>
          You haven't added any floors or seat layouts in this branch yet. Create one to get started.
        </p>
        <Button onClick={onAddFloor} variant="primary" style={{ backgroundColor: 'var(--accent-blue)' }}>
          Add Your First Floor
        </Button>
      </div>
    );
  }

  if (!currentFloor?.rooms || currentFloor.rooms.length === 0) {
    return (
      <div
        className="empty-state-container"
        style={{
          padding: '48px 24px',
          background: 'rgba(255, 255, 255, 0.7)',
          borderRadius: '16px',
          border: '1px solid var(--border-card)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'rgba(37, 99, 235, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-blue)',
            marginBottom: '16px',
          }}
        >
          <DoorOpen size={28} />
        </div>
        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-navy)' }}>
          No rooms created in {currentFloor?.name || 'this floor'}
        </h3>
        <p style={{ margin: '8px 0 20px 0', fontSize: '0.875rem', color: 'var(--text-slate)', maxWidth: '420px' }}>
          You have created "{currentFloor?.name || 'this floor'}". Add a room or hall to start configuring seats.
        </p>
        {currentFloor && (
          <Button
            onClick={() => onAddRoom(currentFloor.id)}
            variant="primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '12px',
              backgroundColor: 'var(--accent-blue)',
            }}
          >
            <Plus size={16} /> Add Room to {currentFloor.name}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {currentFloor.rooms.map((room) => {
        const isExpanded = !collapsedRooms[room.id];

        return (
          <RoomSection
            key={room.id}
            room={room}
            branchName={branchName}
            floorName={currentFloor.name}
            isExpanded={isExpanded}
            onToggleExpand={() => onToggleCollapseRoom(room.id)}
            isFloorVisualization={isFloorVisualization}
            searchQuery={roomSearches[room.id] || ''}
            onSearchChange={(q) => onRoomSearchChange(room.id, q)}
            statusFilter={statusFilters[room.id] || 'ALL'}
            onStatusFilterChange={(s) => onStatusFilterChange(room.id, s)}
            sortOption={sortOptions[room.id] || 'NUMBER'}
            onSortOptionChange={(o) => onSortOptionChange(room.id, o)}
            onAddSeat={onAddSeat}
            onRenameRoom={onRenameRoom}
            onDeleteRoom={onDeleteRoom}
            onSelectSeat={onSelectSeat}
            highlightedSeatId={highlightedSeatId}
            renderVisualizationCanvas={renderVisualizationCanvas}
            editingSeatId={editingSeatId}
            editingSeatNumber={editingSeatNumber}
            onEditNumberChange={onEditNumberChange}
            onEditNumberSubmit={onEditNumberSubmit}
            onEditNumberCancel={onEditNumberCancel}
          />
        );
      })}
    </div>
  );
};
