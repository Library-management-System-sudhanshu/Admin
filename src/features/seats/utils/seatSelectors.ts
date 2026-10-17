import type { Seat, Room, Floor, SeatStatsData, ExpiringSeatEntry } from '../types';
import { getSeatStatusInfo } from '../../../utils/seatUtils';
import { getStudentDisplayName } from '../../../utils/studentUtils';

/**
 * Computes statistics for a given floor.
 */
export const calculateFloorStats = (floor?: Floor | null): SeatStatsData => {
  if (!floor || !floor.rooms) {
    return { total: 0, occupied: 0, available: 0, maintenance: 0, expiringSoon: 0, occupancyRate: 0 };
  }

  let total = 0;
  let occupied = 0;
  let maintenance = 0;

  floor.rooms.forEach((room) => {
    room.seats?.forEach((seat) => {
      total++;
      const { isOccupied } = getSeatStatusInfo(seat);
      if (seat.status === 'MAINTENANCE' || seat.status === 'BLOCKED') {
        maintenance++;
      } else if (isOccupied) {
        occupied++;
      }
    });
  });

  const available = Math.max(0, total - occupied - maintenance);
  const occupancyRate = total > 0 ? Math.round((occupied / total) * 100) : 0;

  return {
    total,
    occupied,
    available,
    maintenance,
    expiringSoon: 0,
    occupancyRate,
  };
};

/**
 * Computes overall statistics across all floors in a branch.
 */
export const calculateWorkspaceStats = (floors?: Floor[] | null): SeatStatsData => {
  if (!floors || floors.length === 0) {
    return { total: 0, occupied: 0, available: 0, maintenance: 0, expiringSoon: 0, occupancyRate: 0 };
  }

  let total = 0;
  let occupied = 0;
  let maintenance = 0;

  floors.forEach((floor) => {
    floor.rooms?.forEach((room) => {
      room.seats?.forEach((seat) => {
        total++;
        const { isOccupied } = getSeatStatusInfo(seat);
        if (seat.status === 'MAINTENANCE' || seat.status === 'BLOCKED') {
          maintenance++;
        } else if (isOccupied) {
          occupied++;
        }
      });
    });
  });

  const available = Math.max(0, total - occupied - maintenance);
  const occupancyRate = total > 0 ? Math.round((occupied / total) * 100) : 0;

  return {
    total,
    occupied,
    available,
    maintenance,
    expiringSoon: 0,
    occupancyRate,
  };
};

/**
 * Finds all seats expiring within the given threshold (default: 7 days).
 */
export const findExpiringSeats = (
  seatMap?: Floor[] | null,
  daysThreshold: number = 7
): Array<{
  seatId: string;
  seatNumber: string;
  studentName: string;
  daysLeft: number;
  roomName: string;
  floorName: string;
}> => {
  if (!seatMap) return [];
  const list: Array<{
    seatId: string;
    seatNumber: string;
    studentName: string;
    daysLeft: number;
    roomName: string;
    floorName: string;
  }> = [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  seatMap.forEach((floor) => {
    floor.rooms?.forEach((room) => {
      room.seats?.forEach((seat) => {
        const { isOccupied, activeAllocations } = getSeatStatusInfo(seat);
        if (isOccupied) {
          const activeAlloc = activeAllocations.find((a: any) => a.isActive);
          if (activeAlloc?.endDate) {
            const end = new Date(activeAlloc.endDate);
            end.setHours(0, 0, 0, 0);
            const diffDays = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays >= 0 && diffDays <= daysThreshold) {
              list.push({
                seatId: seat.id,
                seatNumber: seat.number || seat.seatNumber || 'N/A',
                studentName: getStudentDisplayName(activeAlloc.studentProfile),
                daysLeft: diffDays,
                roomName: room.name,
                floorName: floor.name,
              });
            }
          }
        }
      });
    });
  });

  return list.sort((a, b) => a.daysLeft - b.daysLeft);
};

/**
 * Creates an index Map of seatId -> Seat for efficient lookup.
 */
export const indexSeats = (floors?: Floor[] | null): Map<string, Seat> => {
  const map = new Map<string, Seat>();
  if (!floors) return map;

  floors.forEach((floor) => {
    floor.rooms?.forEach((room) => {
      room.seats?.forEach((seat) => {
        if (seat.id) {
          map.set(seat.id, seat);
        }
      });
    });
  });

  return map;
};
