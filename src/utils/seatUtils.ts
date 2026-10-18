/**
 * Seat Status & Allocation Date Utilities
 */

export interface SeatStatusInfo {
  isOccupied: boolean;
  isExpired: boolean;
  activeAllocations: any[];
  currentAllocations: any[];
  expiredAllocations: any[];
}

/**
 * Calculates a user-friendly expiration label based on the end date.
 *
 * @param endDateStr ISO date string or date value
 * @returns 'Expired', 'Ends today', or 'X days remaining'
 */
export const getDaysRemainingText = (endDateStr?: string | null): string => {
  if (!endDateStr) return 'No end date';
  const end = new Date(endDateStr);
  if (isNaN(end.getTime())) return 'Invalid date';

  const today = new Date();
  end.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const diffTime = end.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'Expired';
  if (diffDays === 0) return 'Ends today';
  return `${diffDays} days remaining`;
};

/**
 * Analyzes active vs expired allocations for a given seat.
 *
 * @param seat Seat object containing allocations list
 * @returns Breakdown of occupied/expired state and active allocations
 */
export const getSeatStatusInfo = (seat: any): SeatStatusInfo => {
  if (!seat) {
    return {
      isOccupied: false,
      isExpired: false,
      activeAllocations: [],
      currentAllocations: [],
      expiredAllocations: [],
    };
  }

  // Ensure allocations have a valid active student profile (not deleted or null)
  const activeAllocations =
    seat.allocations?.filter(
      (a: any) =>
        a.isActive &&
        a.studentProfile !== null &&
        !a.studentProfile?.deletedAt
    ) || [];

  const isAllocationExpired = (alloc: any) => {
    if (!alloc?.endDate) return false;
    const end = new Date(alloc.endDate);
    if (isNaN(end.getTime())) return false;

    const today = new Date();
    end.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return end.getTime() < today.getTime();
  };

  const currentAllocations = activeAllocations.filter((a: any) => !isAllocationExpired(a));
  const expiredAllocations = activeAllocations.filter((a: any) => isAllocationExpired(a));

  const isOccupied = currentAllocations.length > 0;
  const isExpired = currentAllocations.length === 0 && expiredAllocations.length > 0;

  return {
    isOccupied,
    isExpired,
    activeAllocations,
    currentAllocations,
    expiredAllocations,
  };
};

/** Availability for a proposed booking; historical records are never modified. */
export const getAvailableSeatShifts = (
  seat: any, shifts: any[] = [], startDate?: string, endDate?: string,
  studentProfileId?: string,
): any[] => {
  if (!seat) return [];
  const start = startDate ? new Date(startDate).getTime() : NaN;
  const end = endDate ? new Date(endDate).getTime() : NaN;
  const allocations = getSeatStatusInfo(seat).activeAllocations.filter((allocation: any) => {
    if (studentProfileId && allocation.studentProfileId === studentProfileId) return false;
    const from = new Date(allocation.startDate).getTime();
    const until = new Date(allocation.endDate).getTime();
    // Invalid/incomplete dates remain conservative; the server validates the booking.
    if (Number.isFinite(start) && Number.isFinite(end) && end > start) {
      return !(Number.isFinite(until) && until <= start) &&
        !(Number.isFinite(from) && from >= end);
    }
    return !Number.isFinite(until) || until > Date.now();
  });
  const ranges = (shift: any): number[][] => {
    const parse = (value: unknown) => typeof value === 'string' && /^(?:[01]\d|2[0-3]|24):[0-5]\d(?::00)?$/.test(value)
      ? Number(value.slice(0, 2)) * 60 + Number(value.slice(3, 5)) : NaN;
    const from = parse(shift?.startTime), until = parse(shift?.endTime);
    if (!Number.isFinite(from) || !Number.isFinite(until)) return [];
    if (from === until) return [[0, 1440]];
    return until > from ? [[from, until]] : [[from, 1440], [0, until]];
  };
  return shifts.filter((shift: any) => {
    const candidateBases = shift.type === 'CLUBBED' && shift.baseShiftIds?.length
      ? shifts.filter((base: any) => shift.baseShiftIds.includes(base.id))
      : [shift];

    return !allocations.some((allocation: any) => {
      const bookedId = allocation.shiftId || allocation.shift?.id;
      const booked = allocation.shift || shifts.find((s: any) => s.id === bookedId);
      if (!booked) return false;

      const bookedBases = booked.type === 'CLUBBED' && booked.baseShiftIds?.length
        ? shifts.filter((base: any) => booked.baseShiftIds.includes(base.id))
        : [booked];

      return candidateBases.some((c: any) =>
        bookedBases.some((b: any) =>
          c.id === b.id ||
          c.id === booked.id ||
          shift.id === b.id ||
          shift.id === booked.id ||
          ranges(c).some(([ca, cb]) =>
            ranges(b).some(([ba, bb]) => ca < bb && ba < cb)
          )
        )
      );
    });
  });
};
