import type { Seat, Position, LayoutSpacer } from '../types';

export const SEAT_SIZE = 78;
export const SEAT_COLLISION_SIZE = 90; // 78px width + 12px gap
export const SNAP_PX = 15;

/**
 * Default coordinate calculation returning percentages for non-arranging view
 */
export function getSeatPosition(seat: any, index: number): Position {
  if (seat.x !== null && seat.y !== null && seat.x !== undefined && seat.y !== undefined) {
    return { x: seat.x, y: seat.y };
  }
  const cols = 10;
  const row = Math.floor(index / cols);
  const col = index % cols;
  const x = col * 9 + 5;
  const y = row * 12 + 15;
  return { x, y };
}

/**
 * Converts seat coordinates into absolute pixels on the editor canvas
 */
export function getSeatPixelPosition(
  seat: any,
  index: number,
  canvasWidth: number,
  canvasHeight: number,
  tempLayout?: Record<string, Position>
): Position {
  if (tempLayout && tempLayout[seat.id]) {
    return tempLayout[seat.id];
  }
  if (seat.x !== null && seat.y !== null && seat.x !== undefined && seat.y !== undefined) {
    return {
      x: (seat.x / 100) * canvasWidth,
      y: (seat.y / 100) * canvasHeight,
    };
  }
  const cols = 10;
  const row = Math.floor(index / cols);
  const col = index % cols;
  const xPct = col * 9 + 5;
  const yPct = row * 12 + 15;
  return {
    x: (xPct / 100) * canvasWidth,
    y: (yPct / 100) * canvasHeight,
  };
}

/**
 * Resolves overlaps between seats and spacers using relaxation passes
 */
export function resolveCollisions(
  currentTempLayout: Record<string, Position>,
  currentSpacers: LayoutSpacer[],
  seats: Seat[],
  roomWidth: number,
  roomHeight: number
): Record<string, Position> {
  const resolvedLayout: Record<string, Position> = { ...currentTempLayout };
  const seatSize = SEAT_SIZE;

  // Ensure all seats have an entry
  seats.forEach((seat, idx) => {
    if (!resolvedLayout[seat.id]) {
      resolvedLayout[seat.id] = getSeatPixelPosition(seat, idx, roomWidth, roomHeight);
    }
  });

  // Run three relaxation passes to push seats away from spacers and each other
  for (let iter = 0; iter < 3; iter++) {
    // 1. Resolve Seat-to-Spacer Collisions
    seats.forEach((seat) => {
      const seatPos = resolvedLayout[seat.id];
      if (!seatPos) return;

      let seatX = seatPos.x;
      let seatY = seatPos.y;

      currentSpacers.forEach((spacer) => {
        if (spacer.type === 'group_metadata') return;
        const spacerW = spacer.w || seatSize;
        const spacerH = spacer.h || seatSize;

        const overlapLeft = seatX + seatSize - spacer.x;
        const overlapRight = spacer.x + spacerW - seatX;
        const overlapTop = seatY + seatSize - spacer.y;
        const overlapBottom = spacer.y + spacerH - seatY;

        if (overlapLeft > 0 && overlapRight > 0 && overlapTop > 0 && overlapBottom > 0) {
          const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

          if (minOverlap === overlapLeft) {
            seatX = spacer.x - seatSize;
          } else if (minOverlap === overlapRight) {
            seatX = spacer.x + spacerW;
          } else if (minOverlap === overlapTop) {
            seatY = spacer.y - seatSize;
          } else {
            seatY = spacer.y + spacerH;
          }

          seatX = Math.round(seatX / SNAP_PX) * SNAP_PX;
          seatY = Math.round(seatY / SNAP_PX) * SNAP_PX;

          seatX = Math.max(0, Math.min(roomWidth - seatSize, seatX));
          seatY = Math.max(60, Math.min(roomHeight - seatSize, seatY));
        }
      });

      resolvedLayout[seat.id] = { ...seatPos, x: seatX, y: seatY };
    });

    // 2. Resolve Seat-to-Seat Collisions
    for (let i = 0; i < seats.length; i++) {
      const seatA = seats[i];
      const posA = resolvedLayout[seatA.id];
      if (!posA) continue;

      for (let j = i + 1; j < seats.length; j++) {
        const seatB = seats[j];
        const posB = resolvedLayout[seatB.id];
        if (!posB) continue;

        const overlapX = SEAT_COLLISION_SIZE - Math.abs(posA.x - posB.x);
        const overlapY = SEAT_COLLISION_SIZE - Math.abs(posA.y - posB.y);

        if (overlapX > 0 && overlapY > 0) {
          if (overlapX < overlapY) {
            const pushX = overlapX / 2;
            if (posA.x < posB.x) {
              posA.x -= pushX;
              posB.x += pushX;
            } else {
              posA.x += pushX;
              posB.x -= pushX;
            }
          } else {
            const pushY = overlapY / 2;
            if (posA.y < posB.y) {
              posA.y -= pushY;
              posB.y += pushY;
            } else {
              posA.y += pushY;
              posB.y -= pushY;
            }
          }

          posA.x = Math.round(posA.x / SNAP_PX) * SNAP_PX;
          posA.y = Math.round(posA.y / SNAP_PX) * SNAP_PX;
          posB.x = Math.round(posB.x / SNAP_PX) * SNAP_PX;
          posB.y = Math.round(posB.y / SNAP_PX) * SNAP_PX;

          posA.x = Math.max(0, Math.min(roomWidth - seatSize, posA.x));
          posA.y = Math.max(60, Math.min(roomHeight - seatSize, posA.y));
          posB.x = Math.max(0, Math.min(roomWidth - seatSize, posB.x));
          posB.y = Math.max(60, Math.min(roomHeight - seatSize, posB.y));
        }
      }
    }
  }

  return resolvedLayout;
}
