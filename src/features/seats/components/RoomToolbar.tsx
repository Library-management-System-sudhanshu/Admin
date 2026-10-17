import React, { useState } from 'react';
import {
  ChevronDown,
  DoorOpen,
  Search,
  Plus,
  MoreVertical,
  Edit2,
  Trash2,
  ChevronRight,
} from 'lucide-react';
import { SeatStatusBadge } from './SeatStatusBadge';
import { STATUS_FILTER_OPTIONS, SORT_OPTIONS } from '../constants';
import type { Room, RoomStatusFilter, SeatSort } from '../types';

export interface RoomToolbarProps {
  room: Room;
  totalSeats: number;
  occupancyPercent: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  branchName?: string;
  floorName?: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: RoomStatusFilter | string;
  onStatusFilterChange: (filter: RoomStatusFilter | string) => void;
  sortOption: SeatSort | string;
  onSortOptionChange: (sort: SeatSort | string) => void;
  onAddSeat: (roomId: string) => void;
  onRenameRoom: (room: Room) => void;
  onDeleteRoom: (roomId: string) => void;
}

export const RoomToolbar: React.FC<RoomToolbarProps> = ({
  room,
  totalSeats,
  occupancyPercent,
  isExpanded,
  onToggleExpand,
  branchName,
  floorName,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sortOption,
  onSortOptionChange,
  onAddSeat,
  onRenameRoom,
  onDeleteRoom,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      {/* ROOM ACCORDION HEADER */}
      <div className="room-accordion-header" onClick={onToggleExpand}>
        {/* Left Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
          <ChevronDown
            size={18}
            className="room-chevron-icon"
            style={{
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
            }}
          />

          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'rgba(37, 99, 235, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-blue)',
              flexShrink: 0,
            }}
          >
            <DoorOpen size={18} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <span
              style={{
                fontSize: '1rem',
                fontWeight: 700,
                color: 'var(--text-navy)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {room.name}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
              <span
                style={{
                  fontSize: '0.675rem',
                  fontWeight: 600,
                  color: '#64748B',
                  background: '#F1F5F9',
                  padding: '1px 6px',
                  borderRadius: '4px',
                }}
              >
                {totalSeats} Seats
              </span>
              <SeatStatusBadge occupancyPercent={occupancyPercent} />
            </div>
          </div>
        </div>

        {/* Center Progress Bar */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '0 24px',
            maxWidth: '300px',
          }}
        >
          <div className="room-progress-track">
            <div className="room-progress-fill" style={{ width: `${occupancyPercent}%` }} />
          </div>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-slate)' }}>
            {occupancyPercent}%
          </span>
        </div>

        {/* Right Actions */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Inline Room Search */}
          <div style={{ position: 'relative', width: '160px' }}>
            <Search
              size={12}
              style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94A3B8',
              }}
            />
            <input
              type="text"
              placeholder="Search room..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 10px 6px 26px',
                fontSize: '0.75rem',
                borderRadius: '16px',
                border: '1px solid rgba(15, 23, 42, 0.05)',
                outline: 'none',
                color: 'var(--text-navy)',
              }}
            />
          </div>

          <button
            type="button"
            onClick={() => onAddSeat(room.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 12px',
              border: '1px solid rgba(15, 23, 42, 0.05)',
              background: '#ffffff',
              borderRadius: '16px',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--text-navy)',
              cursor: 'pointer',
              transition: 'background 150ms ease',
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = '#f8fafc')}
            onMouseOut={(e) => (e.currentTarget.style.background = '#ffffff')}
          >
            <Plus size={12} /> Add Seat
          </button>

          {/* Room options dropdown */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen(!isMenuOpen);
            }}
            style={{
              border: 'none',
              background: 'none',
              color: '#64748B',
              padding: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              borderRadius: '6px',
            }}
            title="Room options"
          >
            <MoreVertical size={16} />
          </button>

          {isMenuOpen && (
            <>
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen(false);
                }}
                style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9998 }}
              />
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  backgroundColor: '#ffffff',
                  border: '1px solid var(--border-card)',
                  borderRadius: '10px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                  zIndex: 9999,
                  minWidth: '130px',
                  padding: '6px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRenameRoom(room);
                    setIsMenuOpen(false);
                  }}
                  style={{
                    border: 'none',
                    background: 'none',
                    padding: '8px 12px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    borderRadius: '6px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    color: 'var(--text-navy)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'background 150ms ease',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.background = '#f1f5f9')}
                  onMouseOut={(e) => (e.currentTarget.style.background = 'none')}
                >
                  <Edit2 size={14} /> Rename
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMenuOpen(false);
                    onDeleteRoom(room.id);
                  }}
                  style={{
                    border: 'none',
                    background: 'none',
                    padding: '8px 12px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    borderRadius: '6px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    color: 'var(--status-red)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'background 150ms ease',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.background = '#fef2f2')}
                  onMouseOut={(e) => (e.currentTarget.style.background = 'none')}
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* BREADCRUMBS & FILTERS BAR (Rendered inside body when expanded) */}
      {isExpanded && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px',
            flexWrap: 'wrap',
            marginBottom: '16px',
            borderBottom: '1px solid rgba(15, 23, 42, 0.04)',
            paddingBottom: '12px',
          }}
        >
          {/* Breadcrumbs */}
          <div className="breadcrumb-container" style={{ margin: 0, padding: 0, border: 'none' }}>
            {branchName && <span className="breadcrumb-item">{branchName}</span>}
            {branchName && floorName && <ChevronRight size={10} />}
            {floorName && <span className="breadcrumb-item">{floorName}</span>}
            {floorName && <ChevronRight size={10} />}
            <span style={{ color: 'var(--text-navy)', fontWeight: 600 }}>{room.name}</span>
          </div>

          {/* Filters & Sort */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 500, color: 'var(--text-slate)' }}>Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => onStatusFilterChange(e.target.value)}
                style={{
                  border: '1px solid rgba(15, 23, 42, 0.05)',
                  borderRadius: '8px',
                  padding: '3px 6px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  color: 'var(--text-navy)',
                  outline: 'none',
                  cursor: 'pointer',
                  background: '#ffffff',
                }}
              >
                {STATUS_FILTER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 500, color: 'var(--text-slate)' }}>Sort:</span>
              <select
                value={sortOption}
                onChange={(e) => onSortOptionChange(e.target.value)}
                style={{
                  border: '1px solid rgba(15, 23, 42, 0.05)',
                  borderRadius: '8px',
                  padding: '3px 6px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  color: 'var(--text-navy)',
                  outline: 'none',
                  cursor: 'pointer',
                  background: '#ffffff',
                }}
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
