import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
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
import SuperAdmin from './pages/SuperAdmin';

import theme from './theme';

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
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
    </ThemeProvider>
  );
}
