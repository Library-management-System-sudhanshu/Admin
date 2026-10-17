import { useState, useCallback } from 'react';
import type { RoomStatusFilter, SeatSort } from '../types';

export function useRoomFilters() {
  const [roomSearchQueries, setRoomSearchQueries] = useState<Record<string, string>>({});
  const [statusFilters, setStatusFilters] = useState<Record<string, RoomStatusFilter>>({});
  const [sortPreferences, setSortPreferences] = useState<Record<string, SeatSort>>({});
  const [collapsedRooms, setCollapsedRooms] = useState<Record<string, boolean>>({});

  const setRoomSearch = useCallback((roomId: string, query: string) => {
    setRoomSearchQueries((prev) => ({ ...prev, [roomId]: query }));
  }, []);

  const setRoomStatus = useCallback((roomId: string, status: RoomStatusFilter) => {
    setStatusFilters((prev) => ({ ...prev, [roomId]: status }));
  }, []);

  const setRoomSort = useCallback((roomId: string, sort: SeatSort) => {
    setSortPreferences((prev) => ({ ...prev, [roomId]: sort }));
  }, []);

  const toggleRoomCollapse = useCallback((roomId: string) => {
    setCollapsedRooms((prev) => ({ ...prev, [roomId]: !prev[roomId] }));
  }, []);

  const resetRoomFilters = useCallback((roomId: string) => {
    setRoomSearchQueries((prev) => ({ ...prev, [roomId]: '' }));
    setStatusFilters((prev) => ({ ...prev, [roomId]: 'ALL' }));
    setSortPreferences((prev) => ({ ...prev, [roomId]: 'NUMBER' }));
  }, []);

  return {
    roomSearchQueries,
    setRoomSearch,
    statusFilters,
    setRoomStatus,
    sortPreferences,
    setRoomSort,
    collapsedRooms,
    toggleRoomCollapse,
    resetRoomFilters,
  };
}
