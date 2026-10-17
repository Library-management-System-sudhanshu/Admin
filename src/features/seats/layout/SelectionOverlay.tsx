import React from 'react';
import type { Position } from '../types';

export interface SelectionOverlayProps {
  start: Position | null;
  end: Position | null;
}

export const SelectionOverlay: React.FC<SelectionOverlayProps> = ({ start, end }) => {
  if (!start || !end) return null;

  const boxX = Math.min(start.x, end.x);
  const boxY = Math.min(start.y, end.y);
  const boxW = Math.abs(start.x - end.x);
  const boxH = Math.abs(start.y - end.y);

  return (
    <div
      style={{
        position: 'absolute',
        left: `${boxX}px`,
        top: `${boxY}px`,
        width: `${boxW}px`,
        height: `${boxH}px`,
        border: '1.5px dashed #2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.15)',
        pointerEvents: 'none',
        zIndex: 100,
        borderRadius: '4px',
      }}
    />
  );
};
