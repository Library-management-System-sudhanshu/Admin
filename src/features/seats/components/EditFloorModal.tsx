import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';

interface EditFloorModalProps {
  isOpen: boolean;
  onClose: () => void;
  floor: { id: string; name: string } | null;
  onDelete: (floorId: string) => Promise<void> | void;
  onSave: (floorId: string, newName: string) => Promise<void> | void;
}

export const EditFloorModal: React.FC<EditFloorModalProps> = ({
  isOpen,
  onClose,
  floor,
  onDelete,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (floor?.name) {
      setName(floor.name);
    }
  }, [floor, isOpen]);

  if (!floor) return null;

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setIsSaving(true);
    try {
      await onSave(floor.id, trimmed);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    onClose();
    await onDelete(floor.id);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Floor - ${floor.name}`}
      maxWidth="sm"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Input
          label="Floor Name"
          value={name}
          required
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Ground Floor"
        />

        <div
          style={{
            margin: '20px -24px -24px -24px',
            padding: '16px 24px',
            backgroundColor: '#F8FAFC',
            borderTop: '1px solid var(--border-card)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <button
            type="button"
            onClick={handleDelete}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--status-red)',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 600,
              padding: '6px 12px',
              borderRadius: '10px',
            }}
          >
            Delete Floor
          </button>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'none',
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
      </div>
    </Modal>
  );
};
