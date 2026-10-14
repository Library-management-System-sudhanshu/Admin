export type UserRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'STAFF' | 'SUPER_ADMIN';

export interface WorkspaceSummary {
  id: string;
  name: string;
  address: string;
  pincode?: string;
  gstNumber?: string;
  subdomain: string;
  logo?: string;
  [key: string]: any;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole | string;
  mobile?: string;
  phone?: string;
  avatar?: string;
  password?: string;
  workspaceId?: string;
  branchId?: string;
  workspace?: WorkspaceSummary;
  [key: string]: any;
}

export interface AuthCredentials {
  user: User;
  accessToken: string;
  refreshToken?: string;
  requiresWorkspaceInfo?: boolean;
}
