import { lazyPage } from './lazyPage';
import AdminTheme from '../theme/AdminTheme';
import { PageBoundary } from './PageBoundary';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from '../components/Layout';
import AuthenticatedRoute from '../components/AuthenticatedRoute';
import UnauthenticatedRoute from '../components/UnauthenticatedRoute';
import Login from '../pages/Login';
import SuperAdminLayout from '../pages/super-admin/SuperAdminLayout';
import SuperAdminLogin from '../pages/super-admin/SuperAdminLogin';
import SaaSBillingGuard from '../components/SaaSBillingGuard';
import LandingLayout from '../pages/landing/LandingLayout';
import Home from '../pages/landing/Home';
import About from '../pages/landing/About';
import Contact from '../pages/landing/Contact';
import Pricing from '../pages/landing/Pricing';
import Features from '../pages/landing/Features';
import Privacy from '../pages/landing/Privacy';
import Terms from '../pages/landing/Terms';
import Refund from '../pages/landing/Refund';
import Cookies from '../pages/landing/Cookies';
import Help from '../pages/landing/Help';
import ComingSoon from '../pages/landing/ComingSoon';
import NotFound from '../pages/landing/NotFound';

const Dashboard = lazyPage(() => import('../pages/Dashboard'));
const Students = lazyPage(() => import('../pages/Students'));
const Seats = lazyPage(() => import('../pages/Seats'));
const Billing = lazyPage(() => import('../pages/Billing'));
const Library = lazyPage(() => import('../pages/Library'));
const Complaints = lazyPage(() => import('../pages/Complaints'));
const MessagesBroadcast = lazyPage(() => import('../pages/MessagesBroadcast'));
const Settings = lazyPage(() => import('../pages/Settings'));
const Notices = lazyPage(() => import('../pages/Notices'));
const SuperAdminDashboard = lazyPage(() => import('../pages/super-admin/SuperAdminDashboard'));
const WorkspacesList = lazyPage(() => import('../pages/super-admin/WorkspacesList'));
const SaaSPlans = lazyPage(() => import('../pages/super-admin/SaaSPlans'));
const SaaSPlanForm = lazyPage(() => import('../pages/super-admin/SaaSPlanForm'));
const PlatformSettings = lazyPage(() => import('../pages/super-admin/PlatformSettings'));
const WorkspaceDetail = lazyPage(() => import('../pages/super-admin/WorkspaceDetail'));
const WorkspaceStudents = lazyPage(() => import('../pages/super-admin/workspace-details/WorkspaceStudents'));
const WorkspaceRooms = lazyPage(() => import('../pages/super-admin/workspace-details/WorkspaceRooms'));
const WorkspaceBilling = lazyPage(() => import('../pages/super-admin/workspace-details/WorkspaceBilling'));
const WorkspaceBranches = lazyPage(() => import('../pages/super-admin/workspace-details/WorkspaceBranches'));
const Profile = lazyPage(() => import('../pages/Profile'));
const TransferSeat = lazyPage(() => import('../pages/TransferSeat'));
const NewAdmission = lazyPage(() => import('../pages/NewAdmission'));
const CalendarDemo = lazyPage(() => import('../pages/CalendarDemo'));
const SetupWorkspace = lazyPage(() => import('../pages/SetupWorkspace'));

export default function AppRoutes() {
  return (
    <PageBoundary animate={false}>
      <Routes>
        {/* =========================================================
            1. UNAUTHENTICATED ROUTES (UnauthRoute)
            Accessible before login. If an already-authenticated user
            visits these or taps Back from dashboard, they are bounced
            straight to their dashboard.
           ========================================================= */}
        <Route element={<UnauthenticatedRoute />}>
          {/* Landing homepage */}
          <Route path="/" element={<Home />} />

          {/* Public marketing pages */}
          <Route element={<LandingLayout />}>
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/features" element={<Features />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/refund" element={<Refund />} />
            <Route path="/cookies" element={<Cookies />} />
            <Route path="/help" element={<Help />} />
            <Route path="/coming-soon" element={<ComingSoon />} />
          </Route>

          {/* Auth pages */}
          <Route path="/login" element={<Login />} />
          <Route path="/super-admin/login" element={<SuperAdminLogin />} />
        </Route>

        {/* =========================================================
            2. AUTHENTICATED ROUTES (AuthRoute)
            Protected workspace routes requiring active authentication.
            Unauthenticated users are redirected to /login.
           ========================================================= */}
        <Route element={<AuthenticatedRoute />}>
          <Route element={<AdminTheme />}>
            <Route path="/setup-workspace" element={<SetupWorkspace />} />

            <Route element={<SaaSBillingGuard><Layout /></SaaSBillingGuard>}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/new-admission" element={<NewAdmission />} />
              <Route path="/students" element={<Students />} />
              <Route path="/seats" element={<Seats />} />
              <Route path="/billing" element={<Billing />} />
              <Route path="/library" element={<Library />} />
              <Route path="/complaints" element={<Complaints />} />
              <Route path="/notices" element={<Notices />} />
              <Route path="/messages" element={<MessagesBroadcast />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/transfer-seat" element={<TransferSeat />} />
              <Route path="/calendar" element={<CalendarDemo />} />
            </Route>

            {/* Super Admin Layout */}
            <Route element={<AuthenticatedRoute allowedRoles={['SUPER_ADMIN']} />}>
              <Route element={<SuperAdminLayout />}>
                <Route path="/super-admin" element={<SuperAdminDashboard />} />
                <Route path="/super-admin/workspaces" element={<WorkspacesList />} />
                <Route path="/super-admin/workspaces/:id" element={<WorkspaceDetail />} />
                <Route path="/super-admin/workspaces/:id/students" element={<WorkspaceStudents />} />
                <Route path="/super-admin/workspaces/:id/rooms" element={<WorkspaceRooms />} />
                <Route path="/super-admin/workspaces/:id/billing" element={<WorkspaceBilling />} />
                <Route path="/super-admin/workspaces/:id/branches" element={<WorkspaceBranches />} />
                <Route path="/super-admin/plans" element={<SaaSPlans />} />
                <Route path="/super-admin/plans/new" element={<SaaSPlanForm />} />
                <Route path="/super-admin/plans/edit/:id" element={<SaaSPlanForm />} />
                <Route path="/super-admin/settings" element={<PlatformSettings />} />
              </Route>
            </Route>
          </Route>
        </Route>

        {/* Common / Fallback */}
        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </PageBoundary>
  );
}
