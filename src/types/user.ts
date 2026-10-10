export type UserRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'STAFF' | 'SUPER_ADMIN';

export interface WorkspaceSummary {
  id: string;
  name: string;
  address: string;
  pincode?: string;
  gstNumber?: string;
  subdomain: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole | string;
  workspaceId?: string;
  branchId?: string;
  workspace?: WorkspaceSummary;
}

export interface AuthCredentials {
  user: User;
  accessToken: string;
  refreshToken?: string;
  requiresWorkspaceInfo?: boolean;
}
