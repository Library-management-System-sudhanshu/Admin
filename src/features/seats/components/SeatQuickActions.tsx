import React, { useState, useEffect, useRef } from 'react';
import { Plus, Layers, DoorOpen, Armchair, FileSpreadsheet } from 'lucide-react';

export interface SeatQuickActionsProps {
  visible?: boolean;
  canAddRoom?: boolean;
  canAddSeat?: boolean;
  onAddFloor: () => void;
  onAddRoom: () => void;
  onAddSeat: () => void;
  onImportLayout?: () => void;
}

export const SeatQuickActions: React.FC<SeatQuickActionsProps> = ({
  visible = true,
  canAddRoom = false,
  canAddSeat = false,
  onAddFloor,
  onAddRoom,
  onAddSeat,
  onImportLayout,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!visible) return null;

  return (
    <>
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.2)',
            backdropFilter: 'blur(2px)',
            WebkitBackdropFilter: 'blur(2px)',
            zIndex: 899,
            transition: 'opacity 0.2s ease',
          }}
        />
      )}
      <div
        ref={containerRef}
        className={`fab-container ${isOpen ? 'expanded' : ''}`}
        style={{ zIndex: 900 }}
      >
        <div className="fab-menu-options">
          {onImportLayout && (
            <button
              type="button"
              className="fab-option-btn import-btn"
              onClick={() => {
                onImportLayout();
                setIsOpen(false);
              }}
              title="Import Floors, Rooms & Seats via CSV/Excel or Paste"
            >
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                }}
              >
                <FileSpreadsheet size={15} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}>
                <span style={{ fontWeight: 700, fontSize: '0.825rem', color: 'var(--text-navy)' }}>
                  Import Setup
                </span>
                <span style={{ fontSize: '0.675rem', color: '#64748B' }}>
                  Excel, CSV or Paste
                </span>
              </div>
            </button>
          )}

          {canAddSeat && (
            <button
              type="button"
              className="fab-option-btn"
              onClick={() => {
                onAddSeat();
                setIsOpen(false);
              }}
              title="Add Single or Bulk Seats"
            >
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                }}
              >
                <Armchair size={15} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}>
                <span style={{ fontWeight: 700, fontSize: '0.825rem', color: 'var(--text-navy)' }}>
                  Add Seats
                </span>
                <span style={{ fontSize: '0.675rem', color: '#64748B' }}>
                  e.g. 1-50 or A1-A20
                </span>
              </div>
            </button>
          )}

          {canAddRoom && (
            <button
              type="button"
              className="fab-option-btn"
              onClick={() => {
                onAddRoom();
                setIsOpen(false);
              }}
              title="Add Room to Active Floor"
            >
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                }}
              >
                <DoorOpen size={15} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}>
                <span style={{ fontWeight: 700, fontSize: '0.825rem', color: 'var(--text-navy)' }}>
                  Add Room
                </span>
                <span style={{ fontSize: '0.675rem', color: '#64748B' }}>
                  Hall or Study Section
                </span>
              </div>
            </button>
          )}

          <button
            type="button"
            className="fab-option-btn"
            onClick={() => {
              onAddFloor();
              setIsOpen(false);
            }}
            title="Add New Floor"
          >
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
              }}
            >
              <Layers size={15} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}>
              <span style={{ fontWeight: 700, fontSize: '0.825rem', color: 'var(--text-navy)' }}>
                Add Floor
              </span>
              <span style={{ fontSize: '0.675rem', color: '#64748B' }}>
                New Building Level
              </span>
            </div>
          </button>
        </div>

        <button
          type="button"
          className="fab-main-btn"
          onClick={() => setIsOpen(!isOpen)}
          style={{
            transform: isOpen ? 'rotate(135deg)' : 'rotate(0deg)',
            backgroundColor: isOpen ? '#dc2626' : 'var(--accent-blue)',
            boxShadow: isOpen
              ? '0 8px 24px rgba(220, 38, 38, 0.4)'
              : '0 8px 24px rgba(37, 99, 235, 0.4)',
          }}
          title={isOpen ? 'Close Menu' : 'Quick Actions Hub'}
        >
          <Plus size={24} />
        </button>
      </div>
    </>
  );
};
