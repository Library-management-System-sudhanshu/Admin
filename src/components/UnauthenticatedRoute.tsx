import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';

/**
 * UnauthenticatedRoute (UnauthRoute)
 * Guards routes meant exclusively for users who are NOT logged in yet
 * (such as Landing Homepage, Marketing pages, Login, SuperAdminLogin).
 * 
 * If an already-authenticated user tries to access any of these routes
 * (or taps the browser Back button from dashboard back to pre-login screens),
 * they are automatically bounced straight to their active dashboard.
 */
export default function UnauthenticatedRoute() {
  const { user, token } = useSelector((state: RootState) => state.auth);

  if (token) {
    if (user?.role === 'SUPER_ADMIN') {
      return <Navigate to="/super-admin" replace />;
    }
    if (user && user.role !== 'SUPER_ADMIN' && !user.workspaceId) {
      return <Navigate to="/setup-workspace" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

// Aliases for flexibility and naming conventions
export { UnauthenticatedRoute as UnauthRoute, UnauthenticatedRoute as GuestRoute };
