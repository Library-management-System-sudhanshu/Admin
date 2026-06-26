import { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/authSlice';
import type { RootState } from '../store';
import {
  LayoutDashboard,
  Users,
  Armchair,
  ReceiptText,
  Library as LibraryIcon,
  MessageSquareWarning,
  MessageCircle,
  LogOut,
  Building2,
  Settings as SettingsIcon,
  Menu,
  X,
  Bell
} from 'lucide-react';
import './Layout.css';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close sidebar on route change on mobile
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const menuItems = [
    { text: 'Dashboard', icon: <LayoutDashboard className="sidebar-link-icon" />, path: '/' },
    { text: 'Students', icon: <Users className="sidebar-link-icon" />, path: '/students' },
    { text: 'Seat Map', icon: <Armchair className="sidebar-link-icon" />, path: '/seats' },
    { text: 'Billing & Payments', icon: <ReceiptText className="sidebar-link-icon" />, path: '/billing' },
    { text: 'Library', icon: <LibraryIcon className="sidebar-link-icon" />, path: '/library' },
    { text: 'Complaints', icon: <MessageSquareWarning className="sidebar-link-icon" />, path: '/complaints' },
    { text: 'Notices', icon: <Bell className="sidebar-link-icon" />, path: '/notices' },
    { text: 'WhatsApp', icon: <MessageCircle className="sidebar-link-icon" />, path: '/whatsapp' },
    { text: 'Settings', icon: <SettingsIcon className="sidebar-link-icon" />, path: '/settings' },
  ];

  if (user?.role === 'SUPER_ADMIN') {
    menuItems.push({ text: 'Workspaces', icon: <Building2 className="sidebar-link-icon" />, path: '/super-admin' });
  }

  return (
    <div className="layout-container">
      {/* Sidebar Navigation */}
      <aside className={`layout-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">STUDYFLOW</div>
          {isSidebarOpen && (
            <button className="mobile-menu-btn" onClick={toggleSidebar} style={{ position: 'absolute', right: '1rem', color: 'white' }}>
              <X size={24} />
            </button>
          )}
        </div>
        
        <nav className="sidebar-nav">
          {menuItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.text}
                to={item.path}
                className={`sidebar-link ${active ? 'active' : ''}`}
              >
                {item.icon}
                <span>{item.text}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer - User Profile & Logout */}
        <div className="sidebar-footer">
          <Link to="/profile" className="sidebar-user-profile" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="user-avatar sidebar-avatar">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="sidebar-user-details">
              <span className="sidebar-user-name">{user?.name}</span>
              <span className="sidebar-user-role">{user?.role}</span>
            </div>
          </Link>
          <button className="sidebar-logout-btn" onClick={handleLogout}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="layout-main">
        {/* Full Top App Bar (Only on Dashboard) */}
        {location.pathname === '/' && (
          <header className="layout-topbar">
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <button className="mobile-menu-btn" onClick={toggleSidebar}>
                <Menu size={24} />
              </button>
              <div className="topbar-title">StudyFlow</div>
            </div>
            
            <div className="topbar-actions">
              <div className="user-info">
                {user?.name} <span className="text-muted">({user?.role})</span>
              </div>
              
              <div className="user-menu-container" ref={menuRef} style={{ position: 'relative' }}>
                <button className="user-avatar-btn" onClick={toggleMenu}>
                  <div className="user-avatar">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                </button>
                
                <div className={`dropdown-menu ${isMenuOpen ? 'show' : ''}`}>
                  <button className="dropdown-item" onClick={() => { setIsMenuOpen(false); navigate('/profile'); }}>
                    <Users size={16} style={{ marginRight: '8px' }} /> Profile
                  </button>
                  <button className="dropdown-item" onClick={handleLogout}>
                    <LogOut size={16} style={{ marginRight: '8px' }} /> Logout
                  </button>
                </div>
              </div>
            </div>
          </header>
        )}

        {/* Mobile Header for other pages to ensure menu button is accessible */}
        {location.pathname !== '/' && (
          <div className="mobile-only-header">
            <button className="mobile-menu-btn" onClick={toggleSidebar} style={{ display: 'block' }}>
              <Menu size={24} />
            </button>
          </div>
        )}

        {/* Page Content */}
        <main className="layout-content">
          <Outlet />
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 90
          }}
          onClick={toggleSidebar}
        />
      )}
    </div>
  );
}

