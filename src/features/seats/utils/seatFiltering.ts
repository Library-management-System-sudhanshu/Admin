import type { Seat, RoomStatusFilter, SeatSort } from '../types';
import { getSeatStatusInfo } from '../../../utils/seatUtils';
import { getStudentDisplayName } from '../../../utils/studentUtils';

export interface FilterAndSortSeatsOptions {
  search?: string;
  status?: RoomStatusFilter | string;
  sort?: SeatSort | string;
}

/**
 * Filters and sorts seats within a room based on search text, status, and sort criteria.
 */
export const filterAndSortSeats = (
  seats: Seat[] = [],
  options: FilterAndSortSeatsOptions = {}
): Seat[] => {
  const { search = '', status = 'ALL', sort = 'NUMBER' } = options;
  const query = search.trim().toLowerCase();

  return seats
    .filter((seat) => {
      const { isOccupied, isExpired, activeAllocations } = getSeatStatusInfo(seat);
      const activeAlloc = activeAllocations.find((a: any) => a.isActive);

      // Status filter
      if (status !== 'ALL') {
        if (status === 'AVAILABLE') {
          if (isOccupied || seat.status === 'BLOCKED' || seat.status === 'MAINTENANCE') {
            return false;
          }
        } else if (status === 'OCCUPIED') {
          if (!isOccupied) return false;
        } else if (status === 'BLOCKED' || status === 'MAINTENANCE') {
          if (seat.status !== 'BLOCKED' && seat.status !== 'MAINTENANCE') return false;
        }
      }

      // Search filter
      if (query) {
        const seatNumMatch = (seat.number || seat.seatNumber || '').toLowerCase().includes(query);
        const studentName = activeAlloc?.studentProfile
          ? getStudentDisplayName(activeAlloc.studentProfile).toLowerCase()
          : '';
        const studentMatch = isOccupied && studentName.includes(query);
        if (!seatNumMatch && !studentMatch) return false;
      }

      return true;
    })
    .sort((a, b) => {
      const numA = a.number || a.seatNumber || '';
      const numB = b.number || b.seatNumber || '';

      if (sort === 'NUMBER') {
        return numA.localeCompare(numB, undefined, { numeric: true });
      }

      if (sort === 'NAME') {
        const { activeAllocations: allocsA } = getSeatStatusInfo(a);
        const { activeAllocations: allocsB } = getSeatStatusInfo(b);
        const aAlloc = allocsA.find((al: any) => al.isActive);
        const bAlloc = allocsB.find((al: any) => al.isActive);
        const aName = getStudentDisplayName(aAlloc?.studentProfile);
        const bName = getStudentDisplayName(bAlloc?.studentProfile);
        if (!aName && bName) return 1;
        if (aName && !bName) return -1;
        return aName.localeCompare(bName);
      }

      if (sort === 'RECENT') {
        const { activeAllocations: allocsA } = getSeatStatusInfo(a);
        const { activeAllocations: allocsB } = getSeatStatusInfo(b);
        const aAlloc = allocsA.find((al: any) => al.isActive);
        const bAlloc = allocsB.find((al: any) => al.isActive);
        const aTime = aAlloc?.createdAt ? new Date(aAlloc.createdAt).getTime() : 0;
        const bTime = bAlloc?.createdAt ? new Date(bAlloc.createdAt).getTime() : 0;
        return bTime - aTime;
      }

      return 0;
    });
};
