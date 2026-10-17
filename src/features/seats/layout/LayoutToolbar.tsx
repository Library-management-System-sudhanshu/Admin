import React from 'react';
import { History } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

export interface LayoutToolbarProps {
  isEditing: boolean;
  canUndo: boolean;
  isSaving?: boolean;
  onStartArrange: () => void;
  onAddSpacer: () => void;
  onOpenAddDesk: () => void;
  onArrangeAscending: () => void;
  onUndo: () => void;
  onCancel: () => void;
  onSave: () => void;
}

export const LayoutToolbar: React.FC<LayoutToolbarProps> = ({
  isEditing,
  canUndo,
  isSaving = false,
  onStartArrange,
  onAddSpacer,
  onOpenAddDesk,
  onArrangeAscending,
  onUndo,
  onCancel,
  onSave,
}) => {
  return (
    <div
      style={{
        position: 'absolute',
        top: '12px',
        right: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        zIndex: 10,
        background: 'rgba(255,255,255,0.95)',
        padding: '6px 12px',
        borderRadius: '12px',
        border: '1px solid var(--border-card)',
        boxShadow: 'var(--shadow-soft)',
      }}
    >
      {isEditing ? (
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <Button
            variant="outline"
            size="sm"
            style={{
              padding: '4px 10px',
              height: '28px',
              fontSize: '0.7rem',
              color: 'var(--accent-blue)',
              borderColor: 'var(--accent-blue)',
            }}
            onClick={onAddSpacer}
          >
            + Space
          </Button>
          <Button
            variant="primary"
            size="sm"
            style={{
              padding: '4px 10px',
              height: '28px',
              fontSize: '0.7rem',
              backgroundColor: '#000000',
              borderColor: '#000000',
              color: '#ffffff',
            }}
            onClick={onOpenAddDesk}
          >
            + Add Desk
          </Button>
          <Button
            variant="outline"
            size="sm"
            style={{
              padding: '4px 10px',
              height: '28px',
              fontSize: '0.7rem',
              color: 'var(--accent-blue)',
              borderColor: 'var(--accent-blue)',
            }}
            onClick={onArrangeAscending}
          >
            Ascending
          </Button>
          <Button
            variant="outline"
            size="sm"
            style={{
              padding: '4px 10px',
              height: '28px',
              fontSize: '0.7rem',
              color: 'var(--text-navy)',
              borderColor: 'var(--border-color)',
            }}
            onClick={onUndo}
            disabled={!canUndo}
          >
            <History size={12} style={{ marginRight: '4px' }} />
            Undo
          </Button>
          <Button
            variant="outline"
            size="sm"
            style={{ padding: '4px 10px', height: '28px', fontSize: '0.7rem' }}
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            style={{
              padding: '4px 10px',
              height: '28px',
              fontSize: '0.7rem',
              backgroundColor: 'var(--status-emerald)',
              borderColor: 'var(--status-emerald)',
            }}
            onClick={onSave}
            isLoading={isSaving}
          >
            Save
          </Button>
        </div>
      ) : (
        <button
          onClick={onStartArrange}
          style={{
            padding: '5px 10px',
            borderRadius: '8px',
            border: '1px solid var(--accent-blue)',
            background: 'transparent',
            fontSize: '0.7rem',
            fontWeight: 700,
            color: 'var(--accent-blue)',
            cursor: 'pointer',
          }}
        >
          Arrange Seats
        </button>
      )}
    </div>
  );
};
