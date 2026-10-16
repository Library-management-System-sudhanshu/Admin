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
