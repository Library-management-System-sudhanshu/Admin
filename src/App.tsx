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
import { AlertProvider } from './components/ui/AlertContext';

export default function App() {
  return (
    <AlertProvider>
      <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/students" element={<Students />} />
            <Route path="/seats" element={<Seats />} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/library" element={<Library />} />
            <Route path="/complaints" element={<Complaints />} />
            <Route path="/notices" element={<Notices />} />
            <Route path="/whatsapp" element={<WhatsApp />} />
            <Route path="/settings" element={<Settings />} />

            {/* Super Admin Restricted */}
            <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']} />}>
              <Route path="/super-admin" element={<SuperAdmin />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
    </AlertProvider>
  );
}
