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
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        borderBottom: '1px solid rgba(15, 23, 42, 0.05)',
        paddingBottom: '16px',
      }}
    >
      {/* Left: Branch Selector & Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#ffffff',
            padding: '8px 14px',
            borderRadius: '20px',
            border: '1px solid rgba(15, 23, 42, 0.08)',
            boxShadow: 'var(--shadow-soft)',
          }}
        >
          <Building size={16} color="var(--accent-blue)" />
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748B' }}>Branch:</span>
          <select
            value={selectedBranch}
            onChange={(e) => onBranchChange(e.target.value)}
            style={{
              border: 'none',
              background: 'transparent',
              fontSize: '0.85rem',
              fontWeight: 700,
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
      </div>

      {/* Right: Search, Expiring Seats & User Avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'nowrap' }}>

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
