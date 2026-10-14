import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';

interface EditRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: { id: string; name: string } | null;
  onSave: (roomId: string, newName: string) => Promise<void> | void;
}

export const EditRoomModal: React.FC<EditRoomModalProps> = ({
  isOpen,
  onClose,
  room,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (room?.name) {
      setName(room.name);
    }
  }, [room, isOpen]);

  if (!room) return null;

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setIsSaving(true);
    try {
      await onSave(room.id, trimmed);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Room Name"
      maxWidth="sm"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              color: 'var(--text-slate)',
              textTransform: 'uppercase',
              marginBottom: '6px',
              display: 'block',
            }}
          >
            Room Name
          </label>
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Room A"
            autoFocus
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: '#475569',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 600,
              padding: '6px 12px',
            }}
          >
            Cancel
          </button>
          <Button
            variant="primary"
            disabled={!name.trim() || isSaving}
            onClick={handleSave}
            style={{
              backgroundColor: 'var(--accent-blue)',
              borderColor: 'var(--accent-blue)',
              borderRadius: '12px',
            }}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
