import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { user, token } = useSelector((state: RootState) => state.auth);
  const location = useLocation();

  if (!token) {
    if (location.pathname.startsWith('/super-admin')) {
      return <Navigate to="/super-admin/login" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  // If the owner has not initialized their workspace yet, restrict them to the setup-workspace screen
  if (user && user.role !== 'SUPER_ADMIN' && !user.workspaceId) {
    if (location.pathname !== '/setup-workspace') {
      return <Navigate to="/setup-workspace" replace />;
    }
  }

  // Redirect SUPER_ADMIN from tenant routes to the super admin dashboard
  if (user && user.role === 'SUPER_ADMIN' && !location.pathname.startsWith('/super-admin')) {
    return <Navigate to="/super-admin" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
