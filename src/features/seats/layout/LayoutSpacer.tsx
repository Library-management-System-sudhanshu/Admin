import React from 'react';
import { Lock, Link2 } from 'lucide-react';
import type { LayoutSpacer as LayoutSpacerType } from '../types';

export interface LayoutSpacerProps {
  spacer: LayoutSpacerType;
  isSelected?: boolean;
  isLocked?: boolean;
  isGrouped?: boolean;
  isEditing?: boolean;
  onPointerDown?: (e: React.PointerEvent, id: string) => void;
  onResizePointerDown?: (e: React.PointerEvent, id: string) => void;
  onRemove?: (id: string) => void;
  onSelectGroup?: (memberIds: string[]) => void;
  groupMemberIds?: string[];
}

export const LayoutSpacer: React.FC<LayoutSpacerProps> = ({
  spacer,
  isSelected = false,
  isLocked = false,
  isGrouped = false,
  isEditing = false,
  onPointerDown,
  onResizePointerDown,
  onRemove,
  onSelectGroup,
  groupMemberIds = [],
}) => {
  const isDesk = spacer.type === 'desk';
  const width = spacer.w || 78;
  const height = spacer.h || 78;

  if (!isEditing) {
    // Non-editing view mode
    return (
      <div
        style={{
          position: 'absolute',
          left: `${spacer.x}px`,
          top: `${spacer.y}px`,
          width: `${width}px`,
          height: `${height}px`,
          borderRadius: isDesk ? '6px' : '12px',
          border: isDesk ? 'none' : '1.5px dashed #cbd5e1',
          backgroundColor: isDesk ? '#000000' : 'rgba(241, 245, 249, 0.5)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1,
          boxSizing: 'border-box',
          padding: '4px',
          overflow: 'hidden',
          pointerEvents: 'none',
        }}
      >
        <span style={{ fontSize: '0.65rem', fontWeight: 700, color: isDesk ? '#ffffff' : '#94a3b8' }}>
          {isDesk ? 'Desk' : 'Walking Area'}
        </span>
      </div>
    );
  }

  return (
    <div
      onPointerDown={(e) => {
        if (isLocked) {
          e.stopPropagation();
          if (onSelectGroup && groupMemberIds.length > 0) {
            onSelectGroup(groupMemberIds);
          }
          return;
        }
        e.stopPropagation();
        onPointerDown?.(e, spacer.id);
      }}
      style={{
        position: 'absolute',
        left: `${spacer.x}px`,
        top: `${spacer.y}px`,
        width: `${width}px`,
        height: `${height}px`,
        borderRadius: isDesk ? '6px' : '12px',
        border: isSelected ? '2px solid var(--accent-blue)' : isDesk ? 'none' : '2px dashed #cbd5e1',
        backgroundColor: isDesk
          ? isSelected
            ? '#1e293b'
            : '#000000'
          : isSelected
          ? 'rgba(239, 246, 255, 0.95)'
          : 'rgba(241, 245, 249, 0.95)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: isLocked ? 'not-allowed' : 'move',
        zIndex: isSelected ? 5 : 4,
        boxSizing: 'border-box',
        padding: '4px',
        overflow: 'hidden',
        boxShadow: isSelected ? '0 0 0 3px rgba(37, 99, 235, 0.25), var(--shadow-soft)' : 'var(--shadow-soft)',
      }}
    >
      {/* Group & Lock Badges */}
      {isLocked && (
        <div
          style={{
            position: 'absolute',
            top: '4px',
            left: '4px',
            zIndex: 10,
            color: '#ef4444',
            backgroundColor: 'rgba(255,255,255,0.85)',
            borderRadius: '4px',
            padding: '2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
          title="Locked in Group"
        >
          <Lock size={10} />
        </div>
      )}

      {isGrouped && !isLocked && (
        <div
          style={{
            position: 'absolute',
            top: '4px',
            left: '4px',
            zIndex: 10,
            color: '#2563eb',
            backgroundColor: 'rgba(255,255,255,0.85)',
            borderRadius: '4px',
            padding: '2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
          title="Grouped"
        >
          <Link2 size={10} />
        </div>
      )}

      {/* Delete button */}
      {!isLocked && onRemove && (
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onRemove(spacer.id);
          }}
          style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            background: 'none',
            border: 'none',
            color: isDesk ? '#f87171' : '#ef4444',
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: 800,
            padding: '0 4px',
            zIndex: 10,
          }}
          title={isDesk ? 'Remove Desk' : 'Remove Spacer'}
        >
          &times;
        </button>
      )}

      <span style={{ fontSize: '0.65rem', fontWeight: 700, color: isDesk ? '#ffffff' : '#94a3b8', zIndex: 1 }}>
        {isDesk ? 'Desk' : 'Space'}
      </span>

      <span
        style={{
          fontSize: '0.55rem',
          color: isDesk ? 'rgba(255,255,255,0.7)' : '#cbd5e1',
          zIndex: 1,
          marginTop: '2px',
        }}
      >
        {width} x {height}
      </span>

      {/* Resize handle */}
      {!isLocked && onResizePointerDown && (
        <div
          onPointerDown={(e) => {
            e.stopPropagation();
            onResizePointerDown(e, spacer.id);
          }}
          style={{
            position: 'absolute',
            right: '0',
            bottom: '0',
            width: '14px',
            height: '14px',
            cursor: 'se-resize',
            background: `linear-gradient(135deg, transparent 40%, ${isDesk ? '#ffffff' : '#cbd5e1'} 40%)`,
            borderBottomRightRadius: isDesk ? '4px' : '10px',
            zIndex: 15,
          }}
        />
      )}
    </div>
  );
};
