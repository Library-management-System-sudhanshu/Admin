import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  DoorOpen,
  Armchair,
  FileSpreadsheet,
  Map,
  LayoutGrid,
  MoreVertical,
} from 'lucide-react';
import type { Floor } from '../types';
import { getSeatStatusInfo } from '../../../utils/seatUtils';

export interface FloorNavigationTabsProps {
  floors: Floor[];
  activeFloorId: string | null;
  onSelectFloor: (floorId: string) => void;
  onAddFloor: () => void;
  onAddRoom: (floorId: string) => void;
  onAddSeat: (floorId: string) => void;
  onImportLayout: () => void;
  onEditFloor?: (floor: Floor) => void;
  onDeleteFloor?: (floorId: string) => void;
  isFloorVisualization?: boolean;
  onToggleVisualization?: () => void;
}

export const FloorNavigationTabs: React.FC<FloorNavigationTabsProps> = ({
  floors = [],
  activeFloorId,
  onSelectFloor,
  onAddFloor,
  onAddRoom,
  onAddSeat,
  onImportLayout,
  onEditFloor,
  onDeleteFloor,
  isFloorVisualization = false,
  onToggleVisualization,
}) => {
  const [menuOpenFloorId, setMenuOpenFloorId] = useState<string | null>(null);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        padding: '12px 16px',
        border: '1px solid rgba(226, 232, 240, 0.9)',
        boxShadow: 'var(--shadow-soft)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        {/* Left Side: Horizontal Floor Tabs */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
            flex: 1,
            minWidth: '280px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginRight: '6px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'rgba(37, 99, 235, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-blue)',
              }}
            >
              <Layers size={16} />
            </div>
            <span style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-navy)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Floors:
            </span>
          </div>

          {floors.map((floor) => {
            const isActive = floor.id === activeFloorId;
            const totalRooms = floor.rooms?.length || 0;
            const allSeats = (floor.rooms || []).flatMap((r) => r.seats || []);
            const totalSeats = allSeats.length;
            const occupiedSeats = allSeats.filter((s) => getSeatStatusInfo(s).isOccupied).length;
            const occupancyRate = totalSeats > 0 ? Math.round((occupiedSeats / totalSeats) * 100) : 0;

            return (
              <div
                key={floor.id}
                style={{
                  position: 'relative',
                  display: 'inline-flex',
                }}
              >
                <button
                  type="button"
                  onClick={() => onSelectFloor(floor.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 14px',
                    borderRadius: '12px',
                    border: '1px solid',
                    borderColor: isActive ? 'var(--accent-blue)' : 'rgba(226, 232, 240, 0.9)',
                    backgroundColor: isActive ? 'var(--accent-blue)' : '#F8FAFC',
                    color: isActive ? '#FFFFFF' : 'var(--text-navy)',
                    boxShadow: isActive
                      ? '0 4px 12px rgba(37, 99, 235, 0.25)'
                      : 'none',
                    cursor: 'pointer',
                    transition: 'all 150ms cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{floor.name}</span>

                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      padding: '2px 7px',
                      borderRadius: '8px',
                      backgroundColor: isActive ? 'rgba(255, 255, 255, 0.22)' : '#E2E8F0',
                      color: isActive ? '#FFFFFF' : '#475569',
                    }}
                  >
                    {totalRooms} {totalRooms === 1 ? 'Room' : 'Rooms'} • {totalSeats} Seats
                  </span>

                  {totalSeats > 0 && (
                    <span
                      style={{
                        fontSize: '0.675rem',
                        fontWeight: 700,
                        padding: '1px 5px',
                        borderRadius: '6px',
                        backgroundColor: isActive
                          ? 'rgba(16, 185, 129, 0.3)'
                          : occupancyRate > 0
                          ? '#ECFDF5'
                          : '#F1F5F9',
                        color: isActive ? '#FFFFFF' : occupancyRate > 0 ? '#047857' : '#64748B',
                      }}
                    >
                      {occupancyRate}%
                    </span>
                  )}
                </button>

                {/* Floor Options Button */}
                {isActive && (onEditFloor || onDeleteFloor) && (
                  <div style={{ position: 'relative' }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpenFloorId(menuOpenFloorId === floor.id ? null : floor.id);
                      }}
                      style={{
                        height: '100%',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0 4px',
                        display: 'flex',
                        alignItems: 'center',
                        color: isActive ? '#FFFFFF' : '#64748B',
                        marginLeft: '-4px',
                      }}
                      title="Floor Options"
                    >
                      <MoreVertical size={14} />
                    </button>

                    {menuOpenFloorId === floor.id && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '105%',
                          left: 0,
                          backgroundColor: '#FFFFFF',
                          borderRadius: '10px',
                          border: '1px solid #E2E8F0',
                          boxShadow: 'var(--shadow-xl)',
                          padding: '4px',
                          display: 'flex',
                          flexDirection: 'column',
                          minWidth: '140px',
                          zIndex: 100,
                        }}
                      >
                        {onEditFloor && (
                          <button
                            type="button"
                            onClick={() => {
                              setMenuOpenFloorId(null);
                              onEditFloor(floor);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '8px 12px',
                              border: 'none',
                              backgroundColor: 'transparent',
                              borderRadius: '6px',
                              fontSize: '0.775rem',
                              fontWeight: 600,
                              color: 'var(--text-navy)',
                              cursor: 'pointer',
                              textAlign: 'left',
                            }}
                          >
                            <Edit2 size={13} color="#2563EB" /> Rename Floor
                          </button>
                        )}
                        {onDeleteFloor && (
                          <button
                            type="button"
                            onClick={() => {
                              setMenuOpenFloorId(null);
                              onDeleteFloor(floor.id);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '8px 12px',
                              border: 'none',
                              backgroundColor: 'transparent',
                              borderRadius: '6px',
                              fontSize: '0.775rem',
                              fontWeight: 600,
                              color: '#EF4444',
                              cursor: 'pointer',
                              textAlign: 'left',
                            }}
                          >
                            <Trash2 size={13} color="#EF4444" /> Delete Floor
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Add Floor Button */}
          <button
            type="button"
            onClick={onAddFloor}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '12px',
              border: '1.5px dashed rgba(37, 99, 235, 0.4)',
              backgroundColor: 'rgba(37, 99, 235, 0.04)',
              color: 'var(--accent-blue)',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 150ms ease',
            }}
          >
            <Plus size={14} /> Add Floor
          </button>
        </div>

        {/* Right Side: Quick Action Suite (Add Room, Add Seats, Import Layout, Visualizer) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {activeFloorId && (
            <>
              <button
                type="button"
                onClick={() => onAddRoom(activeFloorId)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 12px',
                  borderRadius: '10px',
                  border: '1px solid #E2E8F0',
                  backgroundColor: '#FFFFFF',
                  color: 'var(--text-navy)',
                  fontSize: '0.775rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: 'var(--shadow-soft)',
                }}
              >
                <DoorOpen size={14} color="#8B5CF6" /> + Room
              </button>

              <button
                type="button"
                onClick={() => onAddSeat(activeFloorId)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 12px',
                  borderRadius: '10px',
                  border: '1px solid #E2E8F0',
                  backgroundColor: '#FFFFFF',
                  color: 'var(--text-navy)',
                  fontSize: '0.775rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: 'var(--shadow-soft)',
                }}
              >
                <Armchair size={14} color="#10B981" /> + Seats
              </button>
            </>
          )}

          {/* Import Seat Map / Layout Button */}
          <button
            type="button"
            onClick={onImportLayout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '10px',
              border: '1px solid #10B981',
              backgroundColor: '#ECFDF5',
              color: '#065F46',
              fontSize: '0.775rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: '0 2px 6px rgba(16, 185, 129, 0.15)',
            }}
          >
            <FileSpreadsheet size={15} color="#059669" /> Import (CSV / Excel)
          </button>

          {/* Visualizer Toggle */}
          {onToggleVisualization && (
            <button
              type="button"
              onClick={onToggleVisualization}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 12px',
                borderRadius: '10px',
                border: '1px solid #E2E8F0',
                backgroundColor: isFloorVisualization ? 'var(--accent-blue)' : '#FFFFFF',
                color: isFloorVisualization ? '#FFFFFF' : 'var(--text-navy)',
                fontSize: '0.775rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: 'var(--shadow-soft)',
              }}
            >
              {isFloorVisualization ? <LayoutGrid size={14} /> : <Map size={14} />}
              <span>{isFloorVisualization ? 'Grid View' : 'Visualizer'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
