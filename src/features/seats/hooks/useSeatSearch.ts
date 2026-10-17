import { useState, useMemo } from 'react';
import type { Seat } from '../types';

export function useSeatSearch(allSeats: Seat[]) {
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedSeatId, setHighlightedSeatId] = useState<string | null>(null);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.trim().toLowerCase();

    return allSeats.filter((seat) => {
      const seatNum = (seat.number || seat.seatNumber || '').toLowerCase();
      if (seatNum.includes(query)) return true;

      const hasStudentMatch = seat.allocations?.some((alloc) => {
        const student = alloc.studentProfile;
        if (!student) return false;
        const name = (student.user?.name || student.name || '').toLowerCase();
        const email = (student.user?.email || student.email || '').toLowerCase();
        const mobile = (student.user?.mobile || student.mobile || '').toLowerCase();
        return name.includes(query) || email.includes(query) || mobile.includes(query);
      });

      return !!hasStudentMatch;
    });
  }, [allSeats, searchQuery]);

  return {
    searchQuery,
    setSearchQuery,
    highlightedSeatId,
    setHighlightedSeatId,
    searchResults,
  };
}
