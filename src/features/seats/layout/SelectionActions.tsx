import React, { useState } from 'react';
import { MoreVertical, Link2, Lock, Unlock } from 'lucide-react';

export interface SelectionActionsProps {
  selectedCount: number;
  position: { x: number; y: number };
  onAlign: (direction: 'horizontal' | 'vertical') => void;
  onAlignStraight: (direction: 'horizontal' | 'vertical') => void;
  onRotate: () => void;
  onGroupAndLock: () => void;
  onUngroup: () => void;
  onToggleLock: (lock: boolean) => void;
  hasGrouped: boolean;
  hasLockedGroup: boolean;
  hasUnlockedGroup: boolean;
}

export const SelectionActions: React.FC<SelectionActionsProps> = ({
  selectedCount,
  position,
  onAlign,
  onAlignStraight,
  onRotate,
  onGroupAndLock,
  onUngroup,
  onToggleLock,
  hasGrouped,
  hasLockedGroup,
  hasUnlockedGroup,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      style={{
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translateX(-100%)',
        zIndex: 110,
      }}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setShowMenu(!showMenu);
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'var(--accent-blue)',
          color: '#ffffff',
          border: 'none',
          padding: '6px 12px',
          borderRadius: '20px',
          fontSize: '0.7rem',
          fontWeight: 700,
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)',
          transition: 'all 0.2s ease',
          outline: 'none',
        }}
      >
        <span>Selection ({selectedCount})</span>
        <MoreVertical size={12} />
      </button>

      {showMenu && (
        <div
          style={{
            position: 'absolute',
            top: '32px',
            right: 0,
            background: '#ffffff',
            border: '1px solid var(--border-card)',
            borderRadius: '12px',
            boxShadow: 'var(--shadow-lg)',
            width: '180px',
            padding: '6px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            zIndex: 120,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => {
              onAlign('horizontal');
              setShowMenu(false);
            }}
            style={menuItemStyle}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            ↔ Align Horizontally
          </button>
          <button
            type="button"
            onClick={() => {
              onAlign('vertical');
              setShowMenu(false);
            }}
            style={menuItemStyle}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            ↕ Align Vertically
          </button>
          <button
            type="button"
            onClick={() => {
              onAlignStraight('horizontal');
              setShowMenu(false);
            }}
            style={menuItemStyle}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            📏 Align Straight (Horiz)
          </button>
          <button
            type="button"
            onClick={() => {
              onAlignStraight('vertical');
              setShowMenu(false);
            }}
            style={menuItemStyle}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            📏 Align Straight (Vert)
          </button>
          <button
            type="button"
            onClick={() => {
              onRotate();
              setShowMenu(false);
            }}
            style={{
              ...menuItemStyle,
              borderTop: '1px solid #f1f5f9',
              marginTop: '2px',
              paddingTop: '6px',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            ↻ Rotate Faces
          </button>

          {selectedCount >= 2 && !hasGrouped && (
            <>
              <div style={{ borderTop: '1px solid #f1f5f9', margin: '4px 0' }} />
              <button
                type="button"
                onClick={() => {
                  onGroupAndLock();
                  setShowMenu(false);
                }}
                style={{ ...menuItemStyle, color: 'var(--accent-blue)' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <Link2 size={12} /> Group & Lock
              </button>
            </>
          )}

          {hasGrouped && (
            <>
              <div style={{ borderTop: '1px solid #f1f5f9', margin: '4px 0' }} />
              <button
                type="button"
                onClick={() => {
                  onUngroup();
                  setShowMenu(false);
                }}
                style={{ ...menuItemStyle, color: '#ef4444' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <Link2 size={12} style={{ opacity: 0.7 }} /> Ungroup Items
              </button>
            </>
          )}

          {hasLockedGroup && (
            <button
              type="button"
              onClick={() => {
                onToggleLock(false);
                setShowMenu(false);
              }}
              style={{ ...menuItemStyle, color: 'var(--status-emerald)' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <Unlock size={12} /> Unlock Group
            </button>
          )}

          {hasUnlockedGroup && !hasLockedGroup && (
            <button
              type="button"
              onClick={() => {
                onToggleLock(true);
                setShowMenu(false);
              }}
              style={{ ...menuItemStyle, color: '#ef4444' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <Lock size={12} /> Lock Group
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const menuItemStyle: React.CSSProperties = {
  width: '100%',
  textAlign: 'left',
  background: 'none',
  border: 'none',
  padding: '6px 10px',
  borderRadius: '8px',
  fontSize: '0.7rem',
  color: 'var(--text-navy)',
  cursor: 'pointer',
  fontWeight: 600,
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
};
