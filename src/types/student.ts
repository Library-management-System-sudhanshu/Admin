export type StudentStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'BLOCKED';

export interface StudentAllocation {
  id: string;
  seatId?: string;
  shiftId?: string;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
  seat?: {
    id?: string;
    seatNumber?: string;
    number?: string;
    roomId?: string;
    [key: string]: any;
  };
  shift?: {
    id?: string;
    name?: string;
    startTime?: string;
    endTime?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface Student {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  aadharNumber?: string;
  photo?: string;
  status?: StudentStatus | string;
  admissionDate?: string;
  joiningDate?: string;
  guardianName?: string;
  guardianMobile?: string;
  branchId?: string;
  workspaceId?: string;
  dues?: number;
  branch?: {
    id?: string;
    name?: string;
    [key: string]: any;
  };
  user?: {
    id?: string;
    name?: string;
    email?: string;
    mobile?: string;
    rawPassword?: string;
    [key: string]: any;
  };
  subscriptions?: any[];
  payments?: any[];
  allocations?: StudentAllocation[];
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

export interface PaginatedStudents {
  students: Student[];
  total: number;
}
