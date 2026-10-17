import React, { useState } from 'react';
import { Plus, Layers, DoorOpen, Armchair, FileText } from 'lucide-react';

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

  if (!visible) return null;

  return (
    <div className={`fab-container ${isOpen ? 'expanded' : ''}`}>
      <div className="fab-menu">
        <button
          type="button"
          className="fab-item"
          onClick={() => {
            onAddFloor();
            setIsOpen(false);
          }}
          title="Add Floor"
        >
          <Layers size={16} /> <span>Floor</span>
        </button>

        {canAddRoom && (
          <button
            type="button"
            className="fab-item"
            onClick={() => {
              onAddRoom();
              setIsOpen(false);
            }}
            title="Add Room"
          >
            <DoorOpen size={16} /> <span>Room</span>
          </button>
        )}

        {canAddSeat && (
          <button
            type="button"
            className="fab-item"
            onClick={() => {
              onAddSeat();
              setIsOpen(false);
            }}
            title="Add Seat"
          >
            <Armchair size={16} /> <span>Seat</span>
          </button>
        )}

        {onImportLayout && (
          <button
            type="button"
            className="fab-item"
            onClick={() => {
              onImportLayout();
              setIsOpen(false);
            }}
            title="Import Batch Configuration"
          >
            <FileText size={16} /> <span>Import</span>
          </button>
        )}
      </div>

      <button
        type="button"
        className="fab-main-btn"
        onClick={() => setIsOpen(!isOpen)}
        style={{ transform: isOpen ? 'rotate(135deg)' : 'rotate(0)' }}
        title="Quick Creation Hub"
      >
        <Plus size={24} />
      </button>
    </div>
  );
};
