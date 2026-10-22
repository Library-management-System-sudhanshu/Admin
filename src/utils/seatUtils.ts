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
    const parse = (value: unknown): number => {
      if (typeof value !== 'string') return NaN;
      const match = value.trim().match(/^([0-1]?[0-9]|2[0-4]):([0-5][0-9])(?::[0-5][0-9])?$/);
      if (!match) return NaN;
      return Number(match[1]) * 60 + Number(match[2]);
    };
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

export interface SeatShiftAvailabilityResult {
  isAvailable: boolean;
  reason?: string;
  conflictingStudent?: string;
  conflictingShift?: string;
}

/**
 * Checks whether a specific seat is available for a target shift,
 * taking into account clubbed shifts and time overlaps while ignoring
 * the current student's existing allocation being transferred.
 */
export const checkSeatShiftAvailability = (
  seat: any,
  targetShift: any,
  allShifts: any[] = [],
  studentProfileId?: string,
  startDate?: string,
  endDate?: string,
): SeatShiftAvailabilityResult => {
  if (!seat) {
    return { isAvailable: false, reason: 'Seat not found' };
  }

  if (seat.status === 'BLOCKED' || seat.status === 'MAINTENANCE') {
    return { isAvailable: false, reason: seat.status === 'BLOCKED' ? 'Blocked' : 'Under Maintenance' };
  }

  if (!targetShift) {
    return { isAvailable: true };
  }

  const start = startDate ? new Date(startDate).getTime() : NaN;
  const end = endDate ? new Date(endDate).getTime() : NaN;

  // Active allocations on this seat, excluding the transferring student's own booking
  const activeAllocations = getSeatStatusInfo(seat).activeAllocations.filter((alloc: any) => {
    if (studentProfileId && (alloc.studentProfileId === studentProfileId || alloc.studentProfile?.id === studentProfileId)) {
      return false;
    }
    const from = new Date(alloc.startDate).getTime();
    const until = new Date(alloc.endDate).getTime();
    if (Number.isFinite(start) && Number.isFinite(end) && end > start) {
      return !(Number.isFinite(until) && until <= start) &&
             !(Number.isFinite(from) && from >= end);
    }
    return !Number.isFinite(until) || until > Date.now();
  });

  if (activeAllocations.length === 0) {
    return { isAvailable: true };
  }

  const parseTime = (value: unknown): number => {
    if (typeof value !== 'string') return NaN;
    const match = value.trim().match(/^([0-1]?[0-9]|2[0-4]):([0-5][0-9])(?::[0-5][0-9])?$/);
    if (!match) return NaN;
    return Number(match[1]) * 60 + Number(match[2]);
  };

  const getRanges = (shift: any): number[][] => {
    const from = parseTime(shift?.startTime);
    const until = parseTime(shift?.endTime);
    if (!Number.isFinite(from) || !Number.isFinite(until)) return [];
    if (from === until) return [[0, 1440]];
    return until > from ? [[from, until]] : [[from, 1440], [0, until]];
  };

  const getBaseShifts = (shift: any): any[] => {
    if (shift.type === 'CLUBBED' && Array.isArray(shift.baseShiftIds) && shift.baseShiftIds.length > 0) {
      const bases = allShifts.filter((b: any) => shift.baseShiftIds.includes(b.id));
      if (bases.length > 0) return bases;
    }
    return [shift];
  };

  const candidateBases = getBaseShifts(targetShift);

  for (const alloc of activeAllocations) {
    const bookedId = alloc.shiftId || alloc.shift?.id;
    const booked = alloc.shift || allShifts.find((s: any) => s.id === bookedId);
    if (!booked) continue;

    const bookedBases = getBaseShifts(booked);

    const hasOverlap = candidateBases.some((c: any) =>
      bookedBases.some((b: any) => {
        if (c.id === b.id || c.id === booked.id || targetShift.id === b.id || targetShift.id === booked.id) {
          return true;
        }
        const cRanges = getRanges(c);
        const bRanges = getRanges(b);
        return cRanges.some(([ca, cb]) =>
          bRanges.some(([ba, bb]) => ca < bb && ba < cb)
        );
      })
    );

    if (hasOverlap) {
      const studentName =
        alloc.studentProfile?.user?.name ||
        alloc.studentProfile?.name ||
        'Another student';
      const shiftName = booked.name || 'Shift';
      return {
        isAvailable: false,
        reason: `Occupied by ${studentName} (${shiftName})`,
        conflictingStudent: studentName,
        conflictingShift: shiftName,
      };
    }
  }

  return { isAvailable: true };
};
