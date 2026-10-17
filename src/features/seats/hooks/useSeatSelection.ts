import { useState, useMemo } from 'react';
import type { Seat, SeatAllocation, DrawerSection } from '../types';

export function useSeatSelection(seatsById: Map<string, Seat>) {
  const [selectedSeatId, setSelectedSeatId] = useState<string | null>(null);
  const [selectedAllocationId, setSelectedAllocationId] = useState<string>('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerActiveSection, setDrawerActiveSection] = useState<DrawerSection>('DETAILS');

  const selectedSeat = useMemo(() => {
    return selectedSeatId ? seatsById.get(selectedSeatId) || null : null;
  }, [selectedSeatId, seatsById]);

  const selectSeat = (seatId: string) => {
    setSelectedSeatId(seatId);
    const seat = seatsById.get(seatId);
    const activeAllocations = seat?.allocations?.filter((a: any) => a.isActive) || [];
    if (activeAllocations.length > 0) {
      setSelectedAllocationId(activeAllocations[0].id);
    } else {
      setSelectedAllocationId('');
    }
    setDrawerActiveSection('DETAILS');
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
  };

  const clearSelection = () => {
    setSelectedSeatId(null);
    setSelectedAllocationId('');
    setIsDrawerOpen(false);
  };

  return {
    selectedSeatId,
    setSelectedSeatId,
    selectedAllocationId,
    setSelectedAllocationId,
    selectedSeat,
    isDrawerOpen,
    setIsDrawerOpen,
    drawerActiveSection,
    setDrawerActiveSection,
    selectSeat,
    closeDrawer,
    clearSelection,
  };
}
