import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Seats from './pages/Seats';
import Billing from './pages/Billing';
import Library from './pages/Library';
import Complaints from './pages/Complaints';
import WhatsApp from './pages/WhatsApp';
import Settings from './pages/Settings';
import Notices from './pages/Notices';
import SuperAdmin from './pages/SuperAdmin';
import Profile from './pages/Profile';
import TransferSeat from './pages/TransferSeat';
import NewAdmission from './pages/NewAdmission';
import SetupWorkspace from './pages/SetupWorkspace';
import { AlertProvider } from './components/ui/AlertContext';
import { ToastProvider } from './components/ui/ToastContext';

export default function App() {
  return (
    <AlertProvider>
      <ToastProvider>
        <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/setup-workspace" element={<SetupWorkspace />} />
            
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/new-admission" element={<NewAdmission />} />
              <Route path="/students" element={<Students />} />
              <Route path="/seats" element={<Seats />} />
              <Route path="/billing" element={<Billing />} />
              <Route path="/library" element={<Library />} />
              <Route path="/complaints" element={<Complaints />} />
              <Route path="/notices" element={<Notices />} />
              <Route path="/whatsapp" element={<WhatsApp />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/transfer-seat" element={<TransferSeat />} />

              {/* Super Admin Restricted */}
              <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']} />}>
                <Route path="/super-admin" element={<SuperAdmin />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      </ToastProvider>
    </AlertProvider>
  );
}
