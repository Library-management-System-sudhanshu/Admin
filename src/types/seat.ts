export type SeatStatus = 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'BLOCKED';

export interface Shift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  price?: number;
  branchId?: string;
}

export interface Seat {
  id: string;
  seatNumber: string;
  status: SeatStatus | string;
  roomId?: string;
  branchId?: string;
  price?: number;
  currentStudent?: {
    id: string;
    name: string;
    phone: string;
  };
  shiftId?: string;
  x?: number;
  y?: number;
}

export interface Room {
  id: string;
  name: string;
  floorId?: string;
  branchId?: string;
  seats: Seat[];
}

export interface Floor {
  id: string;
  name: string;
  branchId?: string;
  rooms: Room[];
}

export interface SeatMapResponse {
  branchId: string;
  floors: Floor[];
  totalSeats: number;
  occupiedSeats: number;
  availableSeats: number;
}

export interface AllocateSeatRequest {
  seatId: string;
  studentId: string;
  shiftId: string;
  startDate: string;
  endDate?: string;
  amount?: number;
  paymentMethod?: string;
}
