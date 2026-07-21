import { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../store/authSlice';
import type { RootState } from '../../store';
import { Menu, X, ArrowRight } from 'lucide-react';
import './Landing.css';

export default function LandingLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { token } = useSelector((state: RootState) => state.auth);
  
  const [isSticky, setIsSticky] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Track scroll position to toggle sticky navbar styling
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsSticky(true);
      } else {
        setIsSticky(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    // Scroll to top on route change
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  const navLinks = [
    { text: 'Features', path: '/features' },
    { text: 'Pricing', path: '/pricing' },
    { text: 'About', path: '/about' },
    { text: 'Help Center', path: '/help' },
    { text: 'Contact', path: '/contact' },
  ];

  return (
    <div className="landing-scope">
      
      {/* 1. Navbar */}
      <nav className={`lp-navbar ${isSticky ? 'sticky' : ''}`}>
        <div className="landing-container lp-navbar-container">
          
          {/* Logo Brand */}
          <Link to="/" className="lp-logo-link">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lp-logo-icon">
              <path d="M12 2v19" />
              <path d="M5 6v4c0 3.87 3.13 7 7 7s7-3.13 7-7V6" />
              <path d="M9 11h6" />
            </svg>
            <span>TRISHUL</span>
          </Link>

          {/* Links (Desktop) */}
          <div className="lp-nav-links">
            {navLinks.map((link) => {
              const active = location.pathname === link.path;
              return (
                <Link
                  key={link.text}
                  to={link.path}
                  className={`lp-nav-item ${active ? 'active' : ''}`}
                >
                  {link.text}
                </Link>
              );
            })}
          </div>

          {/* Actions (Desktop) */}
          <div className="lp-nav-actions">
            {token ? (
              <>
                <button
                  type="button"
                  className="lp-btn-login"
                  onClick={handleLogout}
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
                >
                  Sign Out
                </button>
                <button
                  type="button"
                  className="lp-btn-primary"
                  onClick={() => navigate('/dashboard')}
                >
                  <span>Go to Dashboard</span>
                  <ArrowRight size={14} />
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="lp-btn-login">
                  Login
                </Link>
                <button
                  type="button"
                  className="lp-btn-primary"
                  onClick={() => navigate('/login')}
                >
                  <span>Get Started</span>
                  <ArrowRight size={14} />
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="mobile-menu-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

        </div>
      </nav>

      {/* Mobile Drawer Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="lp-mobile-backdrop"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Drawer Menu */}
      <aside className={`lp-mobile-nav-drawer ${isMobileMenuOpen ? 'open' : ''}`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <span style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '0.05em' }}>TRISHUL</span>
          <button 
            type="button" 
            style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X size={22} />
          </button>
        </div>
        <nav className="lp-mobile-nav-links">
          {navLinks.map((link) => {
            const active = location.pathname === link.path;
            return (
              <Link
                key={link.text}
                to={link.path}
                className={`lp-mobile-nav-item ${active ? 'active' : ''}`}
              >
                {link.text}
              </Link>
            );
          })}
        </nav>
        <div className="lp-mobile-nav-actions">
          {token ? (
            <>
              <button
                type="button"
                className="lp-btn-secondary"
                onClick={handleLogout}
              >
                Sign Out
              </button>
              <button
                type="button"
                className="lp-btn-primary"
                onClick={() => navigate('/dashboard')}
              >
                <span>Go to Dashboard</span>
                <ArrowRight size={14} />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="lp-btn-secondary" style={{ textAlign: 'center' }}>
                Login
              </Link>
              <button
                type="button"
                className="lp-btn-primary"
                onClick={() => navigate('/login')}
              >
                <span>Get Started</span>
                <ArrowRight size={14} />
              </button>
            </>
          )}
        </div>
      </aside>

      {/* 2. Main Page Render */}
      <main style={{ position: 'relative', zIndex: 10 }}>
        <Outlet />
      </main>

      {/* 3. Footer */}
      <footer className="lp-footer">
        <div className="landing-container">
          
          <div className="lp-footer-grid">
            
            <div className="lp-footer-brand-col">
              <Link to="/" className="lp-logo-link" style={{ fontSize: '1.25rem' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lp-logo-icon">
                  <path d="M12 2v19" />
                  <path d="M5 6v4c0 3.87 3.13 7 7 7s7-3.13 7-7V6" />
                  <path d="M9 11h6" />
                </svg>
                <span>TRISHUL</span>
              </Link>
              <p className="lp-footer-brand-desc">
                The complete operating system for modern libraries and study halls. Streamline seats, billing, operations, and growth.
              </p>
              
              <div className="lp-footer-socials">
                <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="lp-footer-social-link">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
                </a>
                <a href="https://instagram.com" target="_blank" rel="noreferrer" className="lp-footer-social-link">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                </a>
                <a href="https://facebook.com" target="_blank" rel="noreferrer" className="lp-footer-social-link">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                </a>
                <a href="https://twitter.com" target="_blank" rel="noreferrer" className="lp-footer-social-link">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/></svg>
                </a>
                <a href="https://github.com" target="_blank" rel="noreferrer" className="lp-footer-social-link">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>
                </a>
              </div>
            </div>

            <div className="lp-footer-col">
              <h4>Product</h4>
              <ul className="lp-footer-links">
                <li><Link to="/features" className="lp-footer-link-item">Features</Link></li>
                <li><Link to="/pricing" className="lp-footer-link-item">Pricing</Link></li>
                <li><Link to="/coming-soon" className="lp-footer-link-item">Releases</Link></li>
                <li><Link to="/coming-soon" className="lp-footer-link-item">Roadmap</Link></li>
              </ul>
            </div>

            <div className="lp-footer-col">
              <h4>Company</h4>
              <ul className="lp-footer-links">
                <li><Link to="/about" className="lp-footer-link-item">About Us</Link></li>
                <li><Link to="/coming-soon" className="lp-footer-link-item">Careers</Link></li>
                <li><Link to="/coming-soon" className="lp-footer-link-item">Blog</Link></li>
                <li><Link to="/contact" className="lp-footer-link-item">Press</Link></li>
              </ul>
            </div>

            <div className="lp-footer-col">
              <h4>Resources</h4>
              <ul className="lp-footer-links">
                <li><Link to="/help" className="lp-footer-link-item">Help Center</Link></li>
                <li><Link to="/contact" className="lp-footer-link-item">Contact Us</Link></li>
                <li><Link to="/coming-soon" className="lp-footer-link-item">Community</Link></li>
                <li><Link to="/coming-soon" className="lp-footer-link-item">Partners</Link></li>
              </ul>
            </div>

            <div className="lp-footer-col">
              <h4>Legal</h4>
              <ul className="lp-footer-links">
                <li><Link to="/privacy" className="lp-footer-link-item">Privacy Policy</Link></li>
                <li><Link to="/terms" className="lp-footer-link-item">Terms & Conditions</Link></li>
                <li><Link to="/refund" className="lp-footer-link-item">Refund Policy</Link></li>
                <li><Link to="/cookies" className="lp-footer-link-item">Cookie Policy</Link></li>
              </ul>
            </div>

          </div>

          <div className="lp-footer-bottom">
            <span>© 2026 TRISHUL. All Rights Reserved.</span>
            <span>Designed for Modern Library Operations.</span>
          </div>

        </div>
      </footer>

    </div>
  );
}
