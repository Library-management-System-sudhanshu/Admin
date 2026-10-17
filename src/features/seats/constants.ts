import type { RoomStatusFilter, SeatSort } from './types';

export const STATUS_FILTER_OPTIONS: { value: RoomStatusFilter; label: string }[] = [
  { value: 'ALL', label: 'All Seats' },
  { value: 'AVAILABLE', label: 'Available' },
  { value: 'OCCUPIED', label: 'Occupied' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'BLOCKED', label: 'Blocked' },
];

export const SORT_OPTIONS: { value: SeatSort; label: string }[] = [
  { value: 'NUMBER', label: 'Seat Number' },
  { value: 'NAME', label: 'Student Name' },
  { value: 'RECENT', label: 'Recently Allocated' },
  { value: 'DEFAULT', label: 'Original Layout' },
];

export const LAYOUT_CONSTANTS = {
  GRID_SIZE: 20,
  SEAT_WIDTH: 52,
  SEAT_HEIGHT: 52,
  SPACER_MIN_WIDTH: 40,
  SPACER_MIN_HEIGHT: 40,
  DEFAULT_CANVAS_WIDTH: 1200,
  DEFAULT_CANVAS_HEIGHT: 800,
  MIN_ZOOM: 0.5,
  MAX_ZOOM: 2.0,
};
