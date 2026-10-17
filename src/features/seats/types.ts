import type { Seat as BaseSeat, Room as BaseRoom, Floor as BaseFloor, Shift as BaseShift, SeatStatus as BaseSeatStatus } from '../../types/seat';

export type SeatStatus = BaseSeatStatus | 'RESERVED';

export type RoomStatusFilter = 'ALL' | 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'BLOCKED';

export type SeatSort = 'NUMBER' | 'NAME' | 'RECENT' | 'DEFAULT';

export type DrawerSection = 'DETAILS' | 'TRANSFER' | 'RENEW' | 'ASSIGN';

export type ViewMode = 'GRID' | 'LAYOUT';

export interface StudentProfileSummary {
  id: string;
  user?: {
    name?: string;
    mobile?: string;
    email?: string;
    avatar?: string;
  };
  name?: string;
  mobile?: string;
  email?: string;
  dueAmount?: number | string;
  [key: string]: any;
}

export interface SeatAllocation {
  id: string;
  seatId: string;
  studentProfileId?: string;
  studentProfile?: StudentProfileSummary;
  shiftId?: string;
  shift?: BaseShift;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
  [key: string]: any;
}

export interface Seat extends Omit<BaseSeat, 'status' | 'seatNumber'> {
  id: string;
  number?: string;
  seatNumber?: string;
  status: SeatStatus | string;
  roomId?: string;
  floorId?: string;
  branchId?: string;
  allocations?: SeatAllocation[];
  row?: number;
  column?: number;
  type?: string;
  x?: number;
  y?: number;
  rotation?: number;
  [key: string]: any;
}

export interface Room extends Omit<BaseRoom, 'seats'> {
  id: string;
  name: string;
  floorId?: string;
  branchId?: string;
  seats: Seat[];
  layout?: any;
  sortOrder?: number;
  isBlocked?: boolean;
  [key: string]: any;
}

export interface Floor extends Omit<BaseFloor, 'rooms'> {
  id: string;
  name: string;
  branchId?: string;
  rooms: Room[];
  sortOrder?: number;
  [key: string]: any;
}

export interface SeatStatsData {
  total: number;
  occupied: number;
  available: number;
  maintenance: number;
  expiringSoon: number;
  occupancyRate: number;
}

export interface ExpiringSeatEntry {
  seat: Seat;
  allocation: SeatAllocation;
  studentName: string;
  daysRemaining: number;
  daysText: string;
}

export interface Position {
  x: number;
  y: number;
  rotation?: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface LayoutItem {
  id: string;
  type: 'seat' | 'spacer' | 'desk';
  position: Position;
  size?: Size;
  label?: string;
  groupId?: string;
  locked?: boolean;
}

export interface LayoutDraft {
  items: Record<string, LayoutItem>;
  groups?: Record<string, string[]>;
}

export interface Shift extends BaseShift {
  price3Months?: number;
  price6Months?: number;
  [key: string]: any;
}

export interface LayoutGroup {
  id: string;
  locked?: boolean;
  memberIds: string[];
}

export interface LayoutSpacer {
  id: string;
  x: number;
  y: number;
  w?: number;
  h?: number;
  type?: string;
  groups?: LayoutGroup[];
}

export type LayoutAction =
  | { type: 'MOVE_ITEMS'; positions: Record<string, Position> }
  | { type: 'RESIZE_SPACER'; id: string; size: Size }
  | { type: 'GROUP_SELECTION'; groupName?: string }
  | { type: 'UNGROUP_SELECTION' }
  | { type: 'SET_SELECTION'; ids: string[] }
  | { type: 'COMMIT_GESTURE' }
  | { type: 'UNDO' }
  | { type: 'RESET'; draft: LayoutDraft };

