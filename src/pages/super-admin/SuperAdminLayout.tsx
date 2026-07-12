import { useState, useMemo } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/authSlice';
import type { RootState } from '../../store';
import {
  LayoutDashboard,
  Building2,
  Package,
  Settings,
  Menu,
  X,
  LogOut,
  ChevronDown
} from 'lucide-react';

export default function SuperAdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/super-admin/login');
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const menuItems = [
    { text: 'Dashboard', icon: <LayoutDashboard size={18} />, path: '/super-admin' },
    { text: 'Workspaces', icon: <Building2 size={18} />, path: '/super-admin/workspaces' },
    { text: 'SaaS Plans', icon: <Package size={18} />, path: '/super-admin/plans' },
    { text: 'Platform Settings', icon: <Settings size={18} />, path: '/super-admin/settings' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc', overflow: 'hidden' }}>
      <style dangerouslySetInnerHTML={{
        __html: `
        .sa-sidebar {
          width: 260px;
          background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
          color: white;
          display: flex;
          flex-direction: column;
          transition: transform 0.3s ease;
          position: fixed;
          top: 0;
          bottom: 0;
          left: 0;
          z-index: 50;
        }
        .sa-sidebar-header {
          height: 72px;
          display: flex;
          align-items: center;
          padding: 0 1.5rem;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .sa-logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-weight: 800;
          font-size: 1.1rem;
          letter-spacing: 0.05em;
          color: #f8fafc;
        }
        .sa-logo-mark {
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #0f172a;
          font-weight: 900;
        }
        .sa-nav {
          flex: 1;
          padding: 1.5rem 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .sa-nav-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          border-radius: 10px;
          color: #cbd5e1;
          text-decoration: none;
          font-weight: 600;
          font-size: 0.9rem;
          transition: all 0.2s ease;
        }
        .sa-nav-item:hover {
          background: rgba(255,255,255,0.05);
          color: #fff;
        }
        .sa-nav-item.active {
          background: rgba(245, 158, 11, 0.15);
          color: #fbbf24;
          border-left: 3px solid #fbbf24;
        }
        .sa-main {
          flex: 1;
          margin-left: 260px;
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }
        .sa-topbar {
          height: 72px;
          background: white;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 2rem;
          position: sticky;
          top: 0;
          z-index: 40;
        }
        .sa-content {
          padding: 2rem;
          flex: 1;
          overflow-y: auto;
        }
        @media (max-width: 768px) {
          .sa-sidebar {
            transform: translateX(-100%);
          }
          .sa-sidebar.open {
            transform: translateX(0);
          }
          .sa-main {
            margin-left: 0;
          }
        }
      `}} />

      {/* Sidebar */}
      <aside className={`sa-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sa-sidebar-header">
          <div className="sa-logo">
            <div className="sa-logo-mark">T</div>
            TRISHUL Inds.
          </div>
          {isSidebarOpen && (
            <button 
              onClick={toggleSidebar} 
              style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
          )}
        </div>

        <nav className="sa-nav">
          {menuItems.map(item => (
            <Link 
              key={item.text}
              to={item.path}
              className={`sa-nav-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => setIsSidebarOpen(false)}
            >
              {item.icon}
              <span>{item.text}</span>
            </Link>
          ))}
        </nav>

        <div style={{ padding: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <button 
            onClick={handleLogout}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', 
              padding: '0.75rem', background: 'transparent', border: 'none', color: '#ef4444', 
              fontWeight: 600, cursor: 'pointer', borderRadius: '10px' 
            }}
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="sa-main">
        <header className="sa-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button 
              className="mobile-menu-btn" 
              onClick={toggleSidebar}
              style={{ display: window.innerWidth > 768 ? 'none' : 'block', background: 'transparent', border: 'none', cursor: 'pointer' }}
            >
              <Menu size={20} />
            </button>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>Super Admin Portal</h2>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Platform Management & Billing</span>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>{user?.name}</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>System Admin</div>
            </div>
            <div style={{ 
              width: '36px', height: '36px', borderRadius: '50%', background: '#e2e8f0', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#475569' 
            }}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>
        
        <div className="sa-content">
          <Outlet />
        </div>
      </main>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          onClick={toggleSidebar}
          style={{ 
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40 
          }}
        />
      )}
    </div>
  );
}
