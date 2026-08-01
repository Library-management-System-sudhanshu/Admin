import { useState, useEffect, useRef, useMemo } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/authSlice';
import type { RootState } from '../store';
import { useGetBranchesQuery, useGetMetricsQuery, useGetSaaSSubscriptionQuery } from '../store/api';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Armchair,
  ReceiptText,
  Library as LibraryIcon,
  MessageSquareWarning,
  Bell,
  MessageCircle,
  Settings,
  Building2,
  Menu,
  X,
  Search,
  ChevronDown,
  Plus,
  User,
  CreditCard,
  LogOut,
  Sparkles,
  SlidersHorizontal
} from 'lucide-react';
import './Layout.css';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);

  // States
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Refs for closing on outside click
  const profileRef = useRef<HTMLDivElement>(null);
  const quickAddRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Fetch branches & metrics
  const { data: branches } = useGetBranchesQuery(user?.workspaceId, { skip: !user?.workspaceId });
  const { data: metrics } = useGetMetricsQuery({});
  const { data: saasSub } = useGetSaaSSubscriptionQuery(user?.workspaceId, { 
    skip: !user?.workspaceId || user?.role === 'SUPER_ADMIN' 
  });

  // Dynamic Greeting based on current time
  const greeting = useMemo(() => {
    const hours = new Date().getHours();
    if (hours < 12) return 'Good Morning 👋';
    if (hours < 17) return 'Good Afternoon 👋';
    return 'Good Evening 👋';
  }, []);

  // Today's Date string
  const todayDate = useMemo(() => {
    return new Date().toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, []);

  const branchName = branches && branches.length > 0 ? branches[0].name : 'Main Branch';

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Close all dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (profileRef.current && !profileRef.current.contains(target)) {
        setIsProfileDropdownOpen(false);
      }
      if (quickAddRef.current && !quickAddRef.current.contains(target)) {
        setIsQuickAddOpen(false);
      }
      if (workspaceRef.current && !workspaceRef.current.contains(target)) {
        setIsWorkspaceOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(target)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close sidebar on route change (for mobile viewports)
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  // Sidebar Menu Items
  const menuItems = [
    { text: 'Dashboard', icon: <LayoutDashboard className="sidebar-link-icon" />, path: '/dashboard' },
    { text: 'New Admission', icon: <UserPlus className="sidebar-link-icon" />, path: '/new-admission' },
    { text: 'Students', icon: <Users className="sidebar-link-icon" />, path: '/students' },
    { text: 'Seat Map', icon: <Armchair className="sidebar-link-icon" />, path: '/seats' },
    { text: 'Billing & Payments', icon: <ReceiptText className="sidebar-link-icon" />, path: '/billing' },
    { text: 'Library', icon: <LibraryIcon className="sidebar-link-icon" />, path: '/library' },
    { text: 'Complaints', icon: <MessageSquareWarning className="sidebar-link-icon" />, path: '/complaints' },
    { text: 'Notices', icon: <Bell className="sidebar-link-icon" />, path: '/notices' },
    { text: 'WhatsApp', icon: <MessageCircle className="sidebar-link-icon" />, path: '/whatsapp' },
    { text: 'Settings', icon: <Settings className="sidebar-link-icon" />, path: '/settings' },
  ];

  if (user?.role === 'SUPER_ADMIN') {
    menuItems.push({ text: 'Workspaces', icon: <Building2 className="sidebar-link-icon" />, path: '/super-admin' });
  }

  return (
    <div className="layout-container">
      {/* 1. SOFT LIGHT SIDEBAR */}
      <aside className={`layout-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        
        {/* Sidebar Header Logo */}
        <div className="sidebar-header">
          <div 
            className="sidebar-logo-container" 
            onClick={() => navigate('/dashboard')} 
            style={{ cursor: 'pointer' }}
          >
            <div className="sidebar-logo-dot" />
            <div className="sidebar-logo" style={{ fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
              {user?.workspace?.name || 'N/A'}
            </div>
          </div>
          {isSidebarOpen && (
            <button className="mobile-menu-btn" onClick={toggleSidebar}>
              <X size={20} />
            </button>
          )}
        </div>

        {/* Workspace Switcher */}
        <div className="workspace-switcher-container" ref={workspaceRef} style={{ position: 'relative' }}>
          <div className="workspace-switcher" onClick={() => setIsWorkspaceOpen(!isWorkspaceOpen)}>
            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', overflow: 'hidden' }}>
              <span style={{ fontSize: '0.62rem', fontWeight: 600, color: 'var(--text-slate)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Active Branch</span>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-navy)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {branches && branches.length > 0 ? branches[0].name : 'Main Branch'}
              </span>
            </div>
            <ChevronDown size={14} style={{ color: 'var(--text-slate)' }} />
          </div>

          {/* Workspace Switcher Dropdown */}
          <div className={`profile-dropdown-menu ${isWorkspaceOpen ? 'show' : ''}`} style={{ left: '16px', right: '16px', width: 'auto', marginTop: '4px' }}>
            <div className="profile-dropdown-header">
              <span className="profile-dropdown-title">Switch Workspace</span>
            </div>
            {branches?.map((b: any) => (
              <button key={b.id} className="profile-dropdown-item" onClick={() => setIsWorkspaceOpen(false)}>
                <Building2 size={14} />
                <span>{b.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Search Bar Trigger */}
        <button className="sidebar-search-btn" onClick={() => navigate('/students')}>
          <Search size={14} />
          <span>Search anything...</span>
          <kbd className="topbar-kbd">⌘K</kbd>
        </button>

        {/* Main Menu Links */}
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

        {/* Bottom Profile Section */}
        <div className="sidebar-footer" ref={profileRef} style={{ position: 'relative' }}>
          <div className="sidebar-user-profile" onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}>
            <div className="sidebar-user-info-block">
              <div className="sidebar-avatar">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="sidebar-user-details">
                <span className="sidebar-user-name">{user?.name}</span>
                <span className="sidebar-user-role">
                  {user?.role === 'SUPER_ADMIN' ? 'Super Admin' : user?.role || 'Staff'}
                </span>
              </div>
            </div>
            <ChevronDown size={14} style={{ color: 'var(--text-slate)' }} />
          </div>

          {/* Profile Dropdown Settings Menu */}
          <div className={`profile-dropdown-menu ${isProfileDropdownOpen ? 'show' : ''}`} style={{ bottom: '110%', top: 'auto', left: '16px', right: '16px', width: 'auto' }}>
            <div className="profile-dropdown-header">
              <span className="profile-dropdown-title">{user?.name}</span>
              <span className="profile-dropdown-subtitle">{user?.email}</span>
            </div>
            <button className="profile-dropdown-item" onClick={() => { setIsProfileDropdownOpen(false); navigate('/profile'); }}>
              <User size={14} />
              <span>My Account</span>
            </button>
            <button className="profile-dropdown-item" onClick={() => { setIsProfileDropdownOpen(false); navigate('/settings'); }}>
              <SlidersHorizontal size={14} />
              <span>Workspace Settings</span>
            </button>
            <button className="profile-dropdown-item" onClick={() => { setIsProfileDropdownOpen(false); navigate('/profile?tab=subscription'); }}>
              <CreditCard size={14} />
              <span>Subscription</span>
            </button>
            <button className="profile-dropdown-item danger" onClick={() => { setIsProfileDropdownOpen(false); handleLogout(); }}>
              <LogOut size={14} />
              <span>Log out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* 2. MAIN WORKSPACE PANEL */}
      <div className="layout-main">
        
        {/* Header Appbar (72px) */}
        <header className="layout-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="mobile-menu-btn" onClick={toggleSidebar}>
              <Menu size={20} />
            </button>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-navy)', lineHeight: 1.25 }}>
                  {greeting}, {user?.name || 'User'}
                </span>
                {saasSub && (
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '6px',
                    background: saasSub.status === 'ACTIVE' ? '#dbeafe' : '#fef3c7',
                    color: saasSub.status === 'ACTIVE' ? '#1e40af' : '#b45309',
                    textTransform: 'uppercase',
                    border: saasSub.status === 'ACTIVE' ? '1px solid #bfdbfe' : '1px solid #fde68a'
                  }}>
                    {saasSub.saasPlan?.name || saasSub.status} Plan
                  </span>
                )}
              </div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-slate)', fontWeight: 500, marginTop: '4px' }}>
                {todayDate} • <span style={{ color: 'var(--status-emerald)', fontWeight: 600 }}>{branchName} is running smoothly today.</span>
              </span>
            </div>
          </div>

          {/* Topbar Actions */}
          <div className="topbar-actions">
            
            {/* Global Quick Search */}
            <button className="topbar-search-trigger" onClick={() => navigate('/students')}>
              <Search size={14} />
              <span className="topbar-search-text">Search students...</span>
              <kbd className="topbar-kbd">/</kbd>
            </button>

            {/* Quick Add Button */}
            <div className="quick-add-container" ref={quickAddRef} style={{ position: 'relative', zIndex: 1001 }}>
              <button className="topbar-btn" style={{ background: 'var(--accent-blue)', color: '#ffffff', borderRadius: '10px', display: 'flex', gap: '6px', fontSize: '0.78rem', fontWeight: 600, padding: '6px 12px' }} onClick={() => setIsQuickAddOpen(!isQuickAddOpen)}>
                <Plus size={14} />
                <span className="topbar-quick-add-text">Quick Add</span>
              </button>

              <div className={`profile-dropdown-menu ${isQuickAddOpen ? 'show' : ''}`} style={{ marginTop: '6px' }}>
                <button className="profile-dropdown-item" onClick={() => { setIsQuickAddOpen(false); navigate('/new-admission'); }}>
                  <UserPlus size={14} />
                  <span>New Admission</span>
                </button>
                <button className="profile-dropdown-item" onClick={() => { setIsQuickAddOpen(false); navigate('/seats'); }}>
                  <Armchair size={14} />
                  <span>Allocate Seat</span>
                </button>
                <button className="profile-dropdown-item" onClick={() => { setIsQuickAddOpen(false); navigate('/billing'); }}>
                  <ReceiptText size={14} />
                  <span>Collect Payment</span>
                </button>
              </div>
            </div>

            {/* Notifications Popover */}
            <div className="notifications-container" ref={notificationsRef} style={{ position: 'relative', zIndex: 1001 }}>
              <button className="topbar-btn" onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} style={{ position: 'relative' }}>
                <Bell size={18} />
                {metrics && metrics.expiringSubscriptions > 0 && (
                  <span style={{ position: 'absolute', top: '4px', right: '4px', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--status-red)' }} />
                )}
              </button>

              {/* Notifications Dropdown */}
              <div className={`profile-dropdown-menu ${isNotificationsOpen ? 'show' : ''}`} style={{ marginTop: '6px', width: '280px' }}>
                <div className="profile-dropdown-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="profile-dropdown-title">System Status</span>
                  {metrics && metrics.expiringSubscriptions > 0 && (
                    <span style={{ fontSize: '0.62rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--status-red)', padding: '2px 6px', borderRadius: '10px', fontWeight: 700 }}>
                      {metrics.expiringSubscriptions} alerts
                    </span>
                  )}
                </div>
                {metrics && metrics.expiringSubscriptions > 0 ? (
                  <button className="profile-dropdown-item" style={{ whiteSpace: 'normal', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '10px 12px', borderBottom: '1px solid rgba(15,23,42,0.03)' }} onClick={() => { setIsNotificationsOpen(false); navigate('/seats'); }}>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '2px' }}>
                      <Sparkles size={12} style={{ color: 'var(--status-amber)' }} />
                      <span style={{ fontWeight: 600, fontSize: '0.75rem', color: 'var(--text-navy)' }}>Expiring Subscriptions</span>
                    </div>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-slate)' }}>{metrics.expiringSubscriptions} students subscription will expire within the next 7 days.</span>
                  </button>
                ) : (
                  <div style={{ padding: '24px 12px', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-slate)' }}>
                    All student plans are running smoothly!
                  </div>
                )}
              </div>
            </div>

            {/* Profile Avatar Button */}
            <button className="topbar-btn" style={{ padding: '2px' }} onClick={() => navigate('/profile')}>
              <div className="sidebar-avatar" style={{ width: '32px', height: '32px', fontSize: '0.8rem' }}>
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
            </button>
          </div>
        </header>

        {/* Mobile top navigation header (Only on responsive viewports) */}
        <div className="mobile-only-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button className="mobile-menu-btn" onClick={toggleSidebar} aria-label="Toggle navigation menu">
              <Menu size={22} />
            </button>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-navy)', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
                {user?.workspace?.name || 'StudyFlow'}
              </span>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-slate)', fontWeight: 500 }}>
                {user?.name || 'User'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button className="topbar-btn" onClick={() => navigate('/students')} style={{ padding: '6px' }}>
              <Search size={18} />
            </button>
            <button className="topbar-btn" onClick={() => navigate('/profile')} style={{ padding: '2px' }}>
              <div className="sidebar-avatar" style={{ width: '32px', height: '32px', fontSize: '0.75rem' }}>
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
            </button>
          </div>
        </div>

        {/* Page Content Panel */}
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
            backgroundColor: 'rgba(15, 23, 42, 0.3)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            zIndex: 999
          }}
          onClick={toggleSidebar}
        />
      )}
    </div>
  );
}
