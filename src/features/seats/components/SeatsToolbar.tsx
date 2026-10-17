import React from 'react';
import { Building, Layers, Edit2, Plus, LayoutGrid, Map, Search } from 'lucide-react';
import { ExpiringSeatsPopover } from './ExpiringSeatsPopover';
import type { Floor } from '../types';

export interface SeatsToolbarProps {
  branches?: any[];
  selectedBranch: string;
  onBranchChange: (branchId: string) => void;
  floors?: Floor[];
  activeFloorIndex: number;
  onFloorChange: (index: number) => void;
  currentFloor?: Floor | null;
  onEditFloor?: (floor: Floor) => void;
  onAddRoom?: (floorId: string) => void;
  isFloorVisualization: boolean;
  onToggleVisualization: () => void;
  globalSearchQuery: string;
  onGlobalSearchChange: (query: string) => void;
  expiringSeats: Array<{
    seatId: string;
    seatNumber: string;
    studentName: string;
    daysLeft: number;
    roomName: string;
    floorName?: string;
  }>;
  onSelectExpiringSeat: (seatId: string) => void;
  userAvatar?: string | null;
  userInitials?: string;
  onNavigateProfile?: () => void;
}

export const SeatsToolbar: React.FC<SeatsToolbarProps> = ({
  branches = [],
  selectedBranch,
  onBranchChange,
  floors = [],
  activeFloorIndex,
  onFloorChange,
  currentFloor,
  onEditFloor,
  onAddRoom,
  isFloorVisualization,
  onToggleVisualization,
  globalSearchQuery,
  onGlobalSearchChange,
  expiringSeats,
  onSelectExpiringSeat,
  userAvatar,
  userInitials = 'U',
  onNavigateProfile,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        borderBottom: '1px solid rgba(15, 23, 42, 0.05)',
        paddingBottom: '16px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'nowrap' }}>
        {/* Branch Selector */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: '#ffffff',
            padding: '6px 10px',
            borderRadius: '20px',
            border: '1px solid rgba(15, 23, 42, 0.05)',
            boxShadow: 'var(--shadow-soft)',
          }}
        >
          <Building size={14} color="#64748B" />
          <select
            value={selectedBranch}
            onChange={(e) => onBranchChange(e.target.value)}
            style={{
              border: 'none',
              background: 'transparent',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: 'var(--text-navy)',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        {/* Floor Selector */}
        {selectedBranch && floors.length > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: '#ffffff',
              padding: '4px 8px',
              borderRadius: '20px',
              border: '1px solid rgba(15, 23, 42, 0.05)',
              boxShadow: 'var(--shadow-soft)',
            }}
          >
            <Layers size={12} color="#64748B" />
            <select
              value={activeFloorIndex}
              onChange={(e) => onFloorChange(Number(e.target.value))}
              style={{
                border: 'none',
                background: 'transparent',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--text-navy)',
                outline: 'none',
                cursor: 'pointer',
                maxWidth: '100px',
              }}
            >
              {floors.map((floor, idx) => (
                <option key={floor.id} value={idx}>
                  {floor.name}
                </option>
              ))}
            </select>

            {currentFloor && onEditFloor && (
              <button
                type="button"
                onClick={() => onEditFloor(currentFloor)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '2px',
                  cursor: 'pointer',
                  color: 'var(--text-slate)',
                  display: 'flex',
                  alignItems: 'center',
                }}
                title="Edit Floor"
              >
                <Edit2 size={12} />
              </button>
            )}
          </div>
        )}

        {/* Add Room Button */}
        {selectedBranch && currentFloor && onAddRoom && (
          <button
            type="button"
            onClick={() => onAddRoom(currentFloor.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 12px',
              borderRadius: '20px',
              border: '1px solid rgba(37, 99, 235, 0.2)',
              backgroundColor: 'rgba(37, 99, 235, 0.08)',
              color: 'var(--accent-blue)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 150ms ease',
            }}
            title="Add Room"
          >
            <Plus size={14} /> Add Room
          </button>
        )}

        {/* Visualization Toggle */}
        {selectedBranch && floors.length > 0 && (
          <button
            type="button"
            onClick={onToggleVisualization}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '20px',
              border: '1px solid rgba(15, 23, 42, 0.05)',
              backgroundColor: isFloorVisualization ? 'var(--accent-blue)' : '#ffffff',
              color: isFloorVisualization ? '#ffffff' : 'var(--text-navy)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: 'var(--shadow-soft)',
              transition: 'all 0.15s ease',
            }}
          >
            {isFloorVisualization ? <LayoutGrid size={14} /> : <Map size={14} />}
            <span>{isFloorVisualization ? 'Grid View' : 'Floor Visualizer'}</span>
          </button>
        )}

        {/* Global Search */}
        <div style={{ position: 'relative', width: '150px' }}>
          <Search
            size={14}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#94A3B8',
            }}
          />
          <input
            type="text"
            placeholder="Search seat, student..."
            value={globalSearchQuery}
            onChange={(e) => onGlobalSearchChange(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 32px',
              fontSize: '0.8rem',
              borderRadius: '20px',
              border: '1px solid rgba(15, 23, 42, 0.05)',
              backgroundColor: '#ffffff',
              boxShadow: 'var(--shadow-soft)',
              outline: 'none',
              color: 'var(--text-navy)',
              transition: 'all 150ms ease',
            }}
          />
          {globalSearchQuery && (
            <button
              type="button"
              onClick={() => onGlobalSearchChange('')}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#94A3B8',
                fontSize: '1rem',
                padding: '4px',
              }}
            >
              &times;
            </button>
          )}
        </div>

        {/* Expiring Seats Popover */}
        <ExpiringSeatsPopover
          expiringSeats={expiringSeats}
          onSelectSeat={onSelectExpiringSeat}
        />

        {/* User Avatar */}
        {onNavigateProfile && (
          <div
            onClick={onNavigateProfile}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: userAvatar ? 'transparent' : 'var(--accent-blue)',
              backgroundImage: userAvatar ? `url(${userAvatar})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              border: '2px solid #ffffff',
              boxShadow: 'var(--shadow-soft)',
            }}
            title="Profile"
          >
            {!userAvatar && userInitials}
          </div>
        )}
      </div>
    </div>
  );
};
