import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';

interface AuthenticatedRouteProps {
  allowedRoles?: string[];
}

/**
 * AuthenticatedRoute (AuthRoute)
 * Protects post-login application screens.
 * Only accessible to users with a valid authentication token.
 * Redirects unauthenticated users to /login (or /super-admin/login for super-admin routes).
 */
export default function AuthenticatedRoute({ allowedRoles }: AuthenticatedRouteProps) {
  const { user, token, logoutReason } = useSelector((state: RootState) => state.auth);
  const location = useLocation();

  if (!token) {
    const reason = logoutReason ? `?${logoutReason}=true` : '';
    if (location.pathname.startsWith('/super-admin')) {
      return <Navigate to={`/super-admin/login${reason}`} replace />;
    }
    return <Navigate to={`/login${reason}`} replace />;
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

  // Role-based authorization check
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

// Aliases for flexibility and naming conventions
export { AuthenticatedRoute as AuthRoute, AuthenticatedRoute as ProtectedRoute };
