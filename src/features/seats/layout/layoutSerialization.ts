import type { Position, LayoutSpacer, LayoutGroup, Seat } from '../types';

/**
 * Safely parses the room.spacers JSON string into a LayoutSpacer array
 */
export function parseSpacers(spacersJson: string | undefined | null): LayoutSpacer[] {
  if (!spacersJson) return [];
  try {
    const parsed = JSON.parse(spacersJson);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

/**
 * Serializes spacers into JSON string for saving
 */
export function serializeSpacers(spacers: LayoutSpacer[]): string {
  return JSON.stringify(spacers);
}

/**
 * Extracts all group metadata stored inside spacers
 */
export function getRoomGroups(spacers: LayoutSpacer[]): LayoutGroup[] {
  const meta = spacers.find((s) => s.type === 'group_metadata');
  return meta?.groups || [];
}

/**
 * Finds the group containing a specific item (seat or spacer)
 */
export function getGroupForItem(itemId: string, spacers: LayoutSpacer[]): LayoutGroup | undefined {
  const groups = getRoomGroups(spacers);
  return groups.find((g) => g.memberIds.includes(itemId));
}

/**
 * Converts tempLayout absolute pixel coordinates into percentage positions for the API mutation
 */
export function serializeLayoutToApi(
  seats: Seat[],
  tempLayout: Record<string, Position>,
  canvasWidth: number,
  canvasHeight: number
): Array<{ seatId: string; x: number; y: number; rotation: number }> {
  return seats.map((seat) => {
    const pos = tempLayout[seat.id];
    const xPct = pos ? (pos.x / canvasWidth) * 100 : seat.x ?? 0;
    const yPct = pos ? (pos.y / canvasHeight) * 100 : seat.y ?? 0;
    const rotation = pos?.rotation !== undefined ? pos.rotation : seat.rotation || 0;

    return {
      seatId: seat.id,
      x: Math.round(xPct * 100) / 100,
      y: Math.round(yPct * 100) / 100,
      rotation,
    };
  });
}
