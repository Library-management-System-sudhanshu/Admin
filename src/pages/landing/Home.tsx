import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '../../components/ui/ToastContext';
import { 
  Armchair, Users, ReceiptText, Clock, Building2, LayoutDashboard, 
  SlidersHorizontal, LineChart, Bell, Database, CheckCircle, XCircle, 
  HelpCircle, Mail, Phone, MapPin, TrendingUp, UserCheck, ChevronDown, Check,
  ArrowRight, ShieldCheck, Zap, Sparkles, Smile, Star
} from 'lucide-react';
import './Landing.css';

export default function Home() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  // FAQ states
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Pricing Toggle (false = monthly, true = yearly with 20% discount)
  const [isYearly, setIsYearly] = useState(false);

  // Live product preview tab state
  const [activeTab, setActiveTab] = useState(0);

  // Contact Form state
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [isContactSubmitting, setIsContactSubmitting] = useState(false);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactEmail.trim() || !contactMessage.trim()) {
      showToast('Please fill out all required fields.', 'error');
      return;
    }
    setIsContactSubmitting(true);
    setTimeout(() => {
      showToast('Thank you! Your message has been sent successfully. Our team will get back to you shortly.', 'success');
      setContactName('');
      setContactEmail('');
      setContactPhone('');
      setContactMessage('');
      setIsContactSubmitting(false);
    }, 1500);
  };

  // 1. Seat Grid Sample data
  const seatCols = 8;
  const seatRows = 4;
  const occupiedSeeds = [1, 4, 7, 9, 11, 14, 18, 22, 23, 27, 30];

  // 2. Product preview tab data
  const previewTabsData = [
    {
      title: 'Seat Management',
      badge: 'Real-Time Layout',
      headline: 'Visual layout control for zero seat conflicts.',
      desc: 'Customize your library or study hall room floor plan in minutes. Assign seats, manage shifts (Morning, Evening, Night, Full Day), block specific seats for maintenance, and let students book visually.',
      bullets: [
        'Interactive drag-and-drop floor plan designer',
        'Shift-wise seat allocation and multi-session booking',
        'Real-time seat occupancy heatmaps'
      ],
      graphicType: 'seatmap'
    },
    {
      title: 'Analytics & Insights',
      badge: 'Business Growth',
      headline: 'Understand occupancy patterns and revenue leakage.',
      desc: 'Get deep insights into which shifts are most popular, branch-wise performance comparisons, revenue metrics, expense logs, and student retention percentages from one aggregated dashboard.',
      bullets: [
        'Occupancy forecasting based on historical check-ins',
        'Detailed payment collections and invoice tracking',
        'Branch-wise profit and loss comparison reports'
      ],
      graphicType: 'analytics'
    },
    {
      title: 'Billing & Invoicing',
      badge: 'Automated Payments',
      headline: 'GST-ready invoicing and automated fee reminders.',
      desc: 'Set up custom subscription plans. Accept fees online, generate professional invoice receipts automatically, configure pending fee reminders over SMS/WhatsApp, and track cash, UPI, and bank transfers.',
      bullets: [
        '1-click GST invoices and digital receipts sharing',
        'Automatic WhatsApp fee alerts before membership expiry',
        'Comprehensive cashbook and expense management'
      ],
      graphicType: 'billing'
    },
    {
      title: 'Attendance & Staff',
      badge: 'Operations Control',
      headline: 'Track student check-ins and staff check-outs.',
      desc: 'Implement automatic QR code scanning, RFID check-ins, or manual attendance portals. Log staff hours, manage login permissions for branch managers, and verify member credentials instantly.',
      bullets: [
        'Secure QR code check-ins for students',
        'Detailed daily attendance logs with shift overrides',
        'Staff logins with branch-level security controls'
      ],
      graphicType: 'attendance'
    }
  ];

  // 3. Pricing plans definition
  const plans = [
    {
      name: 'Starter',
      desc: 'Perfect for small reading rooms or single branch study halls.',
      priceMonthly: 1200,
      priceYearly: 960,
      features: [
        'Up to 50 Seats configuration',
        'Standard Membership management',
        'Cash & Manual billing log',
        'Daily Attendance tracking',
        'Email Support',
        'No GST Billing',
        'No WhatsApp Integration'
      ]
    },
    {
      name: 'Professional',
      desc: 'Best for growing study halls requiring automated collections & billing.',
      priceMonthly: 2400,
      priceYearly: 1920,
      popular: true,
      features: [
        'Up to 150 Seats configuration',
        'Advanced Membership shift management',
        'Automated Invoice generation (GST-ready)',
        'Automatic WhatsApp fee alerts',
        'UPI & Online fee collection links',
        'Expense tracker & Cashbook',
        'Priority 24/7 Chat Support'
      ]
    },
    {
      name: 'Enterprise',
      desc: 'Built for multi-branch networks and large coaching reading rooms.',
      priceMonthly: 4500,
      priceYearly: 3600,
      features: [
        'Unlimited Seats & Rooms',
        'Multi-Branch Consolidated analytics',
        'Staff Roles & Permission management',
        'Consolidated Revenue audits',
        'API & Custom Integration access',
        'Dedicated Account Manager',
        'Custom SMS & Sender ID configuration'
      ]
    }
  ];

  // 4. FAQ list
  const faqs = [
    {
      q: 'How does Trishul simplify study hall management?',
      a: 'Trishul centralizes your entire business operation in a single portal. It replaces manual registers, Excel spreadsheets, and scattered WhatsApp chats with automated seat maps, real-time check-in logs, GST-ready invoicing, and automated SMS reminders for pending fees.'
    },
    {
      q: 'Can I manage multiple branches under a single login?',
      a: 'Absolutely. Trishul has native multi-branch support. As an owner, you can view combined revenues and branch-wise occupancy stats, while assigning specific branch managers access restricted solely to their branch.'
    },
    {
      q: 'Can students select and book seats online?',
      a: 'Yes. Trishul provides interactive seat maps that let you allocate specific seats for specific shifts (e.g. 8 AM - 2 PM, 2 PM - 8 PM, or Full Day). You can easily share payment links and automatically assign seats once payment is verified.'
    },
    {
      q: 'Is my database secure and backed up?',
      a: 'We prioritize data security above all else. Your study hall records are encrypted and hosted on premium cloud servers with daily automated backups, ensuring 99.9% uptime and zero risk of data loss.'
    },
    {
      q: 'Can I migrate my existing student data from Excel sheets?',
      a: 'Yes, we provide instant Excel import tools. You can download our standard format template, paste your current student lists with contact details, upload it, and get started in less than 5 minutes.'
    },
    {
      q: 'Do you provide training and support?',
      a: 'Yes. We offer free online onboarding, training videos, and dedicated chat/phone support. Professional and Enterprise plan subscribers receive priority support with custom response guarantees.'
    }
  ];

  return (
    <div className="landing-scope">
      
      {/* Glow ambient blobs */}
      <div className="landing-glow-blob landing-glow-1" />
      <div className="landing-glow-blob landing-glow-2" />
      <div className="landing-glow-blob landing-glow-3" />

      {/* ================= HERO SECTION ================= */}
      <section className="lp-hero">
        <div className="landing-container lp-hero-grid">
          
          {/* Text Info */}
          <div className="lp-hero-text-side">
            <div className="lp-hero-tag">
              <Sparkles size={13} style={{ marginRight: '4px' }} />
              <span>TRISHUL OS v2.0</span>
            </div>
            
            <h1 className="lp-hero-headline">
              The Complete Operating System for Modern Study Halls.
            </h1>
            
            <p className="lp-hero-subheadline">
              Run your library like a professional SaaS business. Automate shift bookings, track student check-ins, collect payments, and manage multiple branches from one unified dashboard.
            </p>
            
            <div className="lp-hero-ctas">
              <button 
                type="button" 
                className="lp-btn-primary" 
                onClick={() => navigate('/login')}
                style={{ padding: '0.8rem 1.75rem', fontSize: '0.95rem' }}
              >
                <span>Start Free Trial</span>
                <ArrowRight size={16} />
              </button>
              <button 
                type="button" 
                className="lp-btn-secondary"
                onClick={() => {
                  window.location.href = '#contact';
                }}
                style={{ padding: '0.8rem 1.75rem', fontSize: '0.95rem' }}
              >
                Book Demo
              </button>
            </div>
          </div>

          {/* Interactive Graphics (Right Side) */}
          <div className="lp-hero-preview-side">
            <div className="lp-dashboard-preview">
              
              {/* Widget 1: Seat Map */}
              <div className="lp-preview-card lp-preview-seatmap">
                <div className="widget-title-row">
                  <span className="widget-label" style={{ fontSize: '0.65rem' }}>Live Seat map</span>
                  <span className="widget-value-badge">
                    <span className="live-dot" /> 29 / 40 Available
                  </span>
                </div>
                <div className="seat-grid-lp">
                  {Array.from({ length: seatRows * seatCols }).map((_, i) => {
                    const isOcc = occupiedSeeds.includes(i);
                    return (
                      <div
                        key={i}
                        className={`seat-lp-cell ${isOcc ? 'occ' : 'avail'}`}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Widget 2: Occupancy Gauge */}
              <div className="lp-preview-card lp-preview-occupancy">
                <span className="widget-label" style={{ fontSize: '0.65rem' }}>Live Occupancy</span>
                <div className="occupancy-circle-container">
                  <svg className="circle-progress-svg">
                    <defs>
                      <linearGradient id="circle-gradient" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#3B82F6" />
                        <stop offset="100%" stopColor="#2563EB" />
                      </linearGradient>
                    </defs>
                    <circle className="circle-bg" cx="45" cy="45" r="40" />
                    <circle className="circle-fill" cx="45" cy="45" r="40" />
                  </svg>
                  <div style={{ position: 'absolute', top: '56px', fontSize: '1.15rem', fontWeight: 800 }}>
                    82%
                  </div>
                  <span style={{ fontSize: '0.65rem', color: 'var(--lp-text-secondary)', marginTop: '4px' }}>Active Shifts</span>
                </div>
              </div>

              {/* Widget 3: Monthly Collection Sparkline */}
              <div className="lp-preview-card lp-preview-analytics">
                <div className="widget-title-row">
                  <span className="widget-label" style={{ fontSize: '0.65rem' }}>Monthly Revenue</span>
                  <span className="revenue-trend">
                    <TrendingUp size={12} style={{ marginRight: '3px' }} /> +12.4%
                  </span>
                </div>
                <div className="revenue-value" style={{ fontSize: '1.35rem', margin: '0.1rem 0' }}>
                  ₹1,84,500
                </div>
                <svg className="sparkline-svg-lp" viewBox="0 0 300 60">
                  <path
                    className="sparkline-line-lp"
                    d="M 0 50 Q 50 35 100 45 T 200 15 T 300 5"
                  />
                </svg>
              </div>

              {/* Widget 4: Quick Metrics */}
              <div className="lp-preview-card lp-preview-collection">
                <div className="metrics-list" style={{ gap: '0.4rem' }}>
                  <div className="metric-row">
                    <span className="metric-name" style={{ fontSize: '0.72rem' }}>
                      <Users size={12} style={{ color: 'var(--lp-secondary)', marginRight: '4px' }} /> Active Members
                    </span>
                    <span className="metric-value" style={{ fontSize: '0.78rem' }}>342</span>
                  </div>
                  <div className="metric-row">
                    <span className="metric-name" style={{ fontSize: '0.72rem' }}>
                      <ReceiptText size={12} style={{ color: 'var(--lp-success)', marginRight: '4px' }} /> Today Fee
                    </span>
                    <span className="metric-value" style={{ fontSize: '0.78rem' }}>₹12,400</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ================= TRUST SECTION ================= */}
      <section className="lp-trust">
        <div className="landing-container lp-trust-grid">
          <div className="lp-trust-title-col">
            Trusted by the most professional Study Hall businesses
          </div>
          <div className="lp-trust-stats">
            <div className="lp-trust-item">
              <span className="lp-trust-number">500+</span>
              <span className="lp-trust-label">Study Halls</span>
            </div>
            <div className="lp-trust-item">
              <span className="lp-trust-number">10k+</span>
              <span className="lp-trust-label">Students Managed</span>
            </div>
            <div className="lp-trust-item">
              <span className="lp-trust-number">99.9%</span>
              <span className="lp-trust-label">System Uptime</span>
            </div>
          </div>
        </div>
      </section>

      {/* ================= FEATURES SECTION ================= */}
      <section id="features" className="landing-section-py">
        <div className="landing-container">
          
          <div className="lp-section-header">
            <span className="lp-section-tag">Core Features</span>
            <h2 className="lp-section-title">Everything you need to run your Study Hall.</h2>
            <p className="lp-section-desc">
              Ditch manual registers and paper billing. Trishul automates your day-to-day operations so you can focus on expansion.
            </p>
          </div>

          <div className="lp-features-grid">
            
            <div className="lp-feature-card">
              <div className="lp-feature-icon-wrapper">
                <Armchair size={20} />
              </div>
              <h3>Seat Management</h3>
              <p>Visual floor plan layout configurations. Avoid double bookings and allocate specific seats shift-wise.</p>
            </div>

            <div className="lp-feature-card">
              <div className="lp-feature-icon-wrapper">
                <Users size={20} />
              </div>
              <h3>Member Management</h3>
              <p>Store student profiles, contact info, shift allocations, ID cards, and history in a centralized database.</p>
            </div>

            <div className="lp-feature-card">
              <div className="lp-feature-icon-wrapper">
                <ReceiptText size={20} />
              </div>
              <h3>Online Fee Collection</h3>
              <p>Accept payments via UPI, NetBanking, and cards. Track cash collections and generate automated receipts.</p>
            </div>

            <div className="lp-feature-card">
              <div className="lp-feature-icon-wrapper">
                <Clock size={20} />
              </div>
              <h3>Attendance Tracking</h3>
              <p>Implement secure check-ins via QR codes or custom RFID logs to track live presence and shift violations.</p>
            </div>

            <div className="lp-feature-card">
              <div className="lp-feature-icon-wrapper">
                <Building2 size={20} />
              </div>
              <h3>Branch Management</h3>
              <p>Manage multiple reading rooms and physical branches under a single dashboard with location filters.</p>
            </div>

            <div className="lp-feature-card">
              <div className="lp-feature-icon-wrapper">
                <LayoutDashboard size={20} />
              </div>
              <h3>Real-Time Dashboard</h3>
              <p>Instantly check live occupancy rates, collections, checking queues, and branch stats at a glance.</p>
            </div>

            <div className="lp-feature-card">
              <div className="lp-feature-icon-wrapper">
                <SlidersHorizontal size={20} />
              </div>
              <h3>Staff Management</h3>
              <p>Assign specific permissions to managers and accountants, logging their workspace edits and log-in times.</p>
            </div>

            <div className="lp-feature-card">
              <div className="lp-feature-icon-wrapper">
                <LineChart size={20} />
              </div>
              <h3>Reports & Analytics</h3>
              <p>Understand P&L, identify popular slots, download payment summaries, and track monthly growth.</p>
            </div>

            <div className="lp-feature-card">
              <div className="lp-feature-icon-wrapper">
                <Bell size={20} />
              </div>
              <h3>Automatic Alerts</h3>
              <p>Auto-send fee reminders, membership expirations, and notices over SMS and WhatsApp directly.</p>
            </div>

          </div>

        </div>
      </section>

      {/* ================= WHY CHOOSE TRISHUL (COMPARISON) ================= */}
      <section className="landing-section-py" style={{ background: 'rgba(15, 23, 42, 0.1)' }}>
        <div className="landing-container">
          
          <div className="lp-section-header">
            <span className="lp-section-tag">Comparison</span>
            <h2 className="lp-section-title">Upgrade from registers to an automated OS.</h2>
            <p className="lp-section-desc">
              See how Trishul completely modernizes your operations compared to traditional management methods.
            </p>
          </div>

          <div className="lp-comparison-grid">
            
            {/* Traditional Card */}
            <div className="lp-compare-card traditional">
              <div className="lp-compare-header">
                <span className="lp-compare-title">Traditional Management</span>
                <span className="lp-compare-badge">Outdated</span>
              </div>
              <div className="lp-compare-list">
                <div className="lp-compare-item">
                  <XCircle size={18} className="lp-compare-item-icon" style={{ color: 'var(--lp-danger)' }} />
                  <span>Manual attendance sheets that students can easily manipulate.</span>
                </div>
                <div className="lp-compare-item">
                  <XCircle size={18} className="lp-compare-item-icon" style={{ color: 'var(--lp-danger)' }} />
                  <span>Messy Excel files that get outdated or deleted accidentally.</span>
                </div>
                <div className="lp-compare-item">
                  <XCircle size={18} className="lp-compare-item-icon" style={{ color: 'var(--lp-danger)' }} />
                  <span>Double seat booking confusion and verbal argument headaches.</span>
                </div>
                <div className="lp-compare-item">
                  <XCircle size={18} className="lp-compare-item-icon" style={{ color: 'var(--lp-danger)' }} />
                  <span>Tracking pending fee dues via notebooks and manual reminders.</span>
                </div>
                <div className="lp-compare-item">
                  <XCircle size={18} className="lp-compare-item-icon" style={{ color: 'var(--lp-danger)' }} />
                  <span>No analytics on slot occupancy, retention, or branch comparisons.</span>
                </div>
              </div>
            </div>

            {/* Trishul Card */}
            <div className="lp-compare-card trishul-core">
              <div className="lp-compare-header">
                <span className="lp-compare-title">TRISHUL Cloud Platform</span>
                <span className="lp-compare-badge">Modern OS</span>
              </div>
              <div className="lp-compare-list">
                <div className="lp-compare-item">
                  <CheckCircle size={18} className="lp-compare-item-icon" style={{ color: 'var(--lp-success)' }} />
                  <span>Secure QR Code/RFID check-ins to monitor exact presence.</span>
                </div>
                <div className="lp-compare-item">
                  <CheckCircle size={18} className="lp-compare-item-icon" style={{ color: 'var(--lp-success)' }} />
                  <span>Secure cloud storage with automated daily backups.</span>
                </div>
                <div className="lp-compare-item">
                  <CheckCircle size={18} className="lp-compare-item-icon" style={{ color: 'var(--lp-success)' }} />
                  <span>Real-time visual seat map showing precise shift allocations.</span>
                </div>
                <div className="lp-compare-item">
                  <CheckCircle size={18} className="lp-compare-item-icon" style={{ color: 'var(--lp-success)' }} />
                  <span>Automatic fee reminders sent directly via SMS and WhatsApp.</span>
                </div>
                <div className="lp-compare-item">
                  <CheckCircle size={18} className="lp-compare-item-icon" style={{ color: 'var(--lp-success)' }} />
                  <span>Rich dashboards for revenue analysis, check-ins, and shift popularities.</span>
                </div>
                <div className="lp-compare-item">
                  <CheckCircle size={18} className="lp-compare-item-icon" style={{ color: 'var(--lp-success)' }} />
                  <span>Multi-branch management under one consolidated dashboard.</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ================= LIVE PRODUCT PREVIEW ================= */}
      <section className="landing-section-py">
        <div className="landing-container">
          
          <div className="lp-section-header">
            <span className="lp-section-tag">Interactive Preview</span>
            <h2 className="lp-section-title">Take a tour of the dashboard.</h2>
            <p className="lp-section-desc">
              Explore how Trishul looks and handles different key operations. Click the tabs below to inspect screenshots and features.
            </p>
          </div>

          {/* Tabs */}
          <div className="lp-preview-tabs">
            {previewTabsData.map((tab, idx) => (
              <button
                key={tab.title}
                className={`lp-preview-tab-btn ${activeTab === idx ? 'active' : ''}`}
                onClick={() => setActiveTab(idx)}
              >
                {tab.title}
              </button>
            ))}
          </div>

          {/* Tab Showcase Card */}
          <div className="lp-preview-showcase">
            <div className="preview-showcase-grid">
              
              <div className="showcase-text">
                <span className="lp-compare-badge" style={{ color: 'var(--lp-secondary)', background: 'rgba(59, 130, 246, 0.1)', marginBottom: '0.75rem', display: 'inline-block' }}>
                  {previewTabsData[activeTab].badge}
                </span>
                <h3>{previewTabsData[activeTab].headline}</h3>
                <p>{previewTabsData[activeTab].desc}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {previewTabsData[activeTab].bullets.map((bullet, i) => (
                    <div key={i} className="showcase-bullet">
                      <Check size={14} className="showcase-bullet-icon" />
                      <span>{bullet}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="showcase-graphic">
                {previewTabsData[activeTab].graphicType === 'seatmap' && (
                  <div>
                    <div className="widget-title-row" style={{ borderBottom: '1px solid var(--lp-border)', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>Interactive Layout Panel (Room A)</span>
                      <span className="widget-value-badge">Edit mode</span>
                    </div>
                    <div className="seat-grid-lp" style={{ gridTemplateColumns: 'repeat(10, 1fr)' }}>
                      {Array.from({ length: 30 }).map((_, i) => {
                        const occupied = [3, 8, 12, 15, 19, 21, 27].includes(i);
                        return (
                          <div
                            key={i}
                            className={`seat-lp-cell ${occupied ? 'occ' : 'avail'}`}
                            style={{ padding: '2px' }}
                          />
                        );
                      })}
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', fontSize: '0.72rem', color: 'var(--lp-text-secondary)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.3)' }} /> Available
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'rgba(239, 68, 68, 0.35)', border: '1px solid rgba(239, 68, 68, 0.5)' }} /> Occupied
                      </span>
                    </div>
                  </div>
                )}

                {previewTabsData[activeTab].graphicType === 'analytics' && (
                  <div>
                    <div className="widget-title-row" style={{ marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>Occupancy Trend (Morning vs Evening Shift)</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--lp-success)' }}>+18% Peak slots</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', height: '110px', gap: '1.25rem', padding: '0.5rem 0', borderBottom: '1px solid var(--lp-border)' }}>
                      {[40, 65, 80, 85, 70, 95, 88].map((h, i) => (
                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                          <div style={{ width: '100%', height: `${h}px`, background: i === 5 ? 'var(--lp-primary)' : 'rgba(255, 255, 255, 0.08)', borderRadius: '4px 4px 0 0', position: 'relative' }} />
                          <span style={{ fontSize: '0.62rem', color: 'var(--lp-text-secondary)' }}>Day {i + 1}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {previewTabsData[activeTab].graphicType === 'billing' && (
                  <div>
                    <div className="widget-title-row" style={{ borderBottom: '1px solid var(--lp-border)', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>Invoices & Cashbook</span>
                      <span className="widget-value-badge" style={{ color: 'var(--lp-primary)', background: 'rgba(37,99,235,0.1)' }}>UPI Active</span>
                    </div>
                    <div className="metrics-list" style={{ gap: '0.5rem' }}>
                      {[
                        { title: 'Inv #1092 - Rajesh Kumar', price: '₹1,500', status: 'Paid', statusColor: '#22c55e' },
                        { title: 'Inv #1091 - Priya Sharma', price: '₹2,400', status: 'Paid', statusColor: '#22c55e' },
                        { title: 'Inv #1090 - Amit Verma', price: '₹1,500', status: 'Pending', statusColor: '#f59e0b' }
                      ].map((item, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', padding: '4px 0' }}>
                          <span style={{ fontWeight: 500 }}>{item.title}</span>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <span style={{ color: 'var(--lp-text-secondary)' }}>{item.price}</span>
                            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: item.statusColor, background: `${item.statusColor}15`, padding: '1px 6px', borderRadius: '4px' }}>
                              {item.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {previewTabsData[activeTab].graphicType === 'attendance' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div className="widget-title-row" style={{ borderBottom: '1px solid var(--lp-border)', paddingBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>Live Check-in Feed</span>
                      <span className="live-dot" />
                    </div>
                    <div className="metrics-list" style={{ gap: '0.55rem' }}>
                      {[
                        { name: 'Karan Malhotra', time: '12:34 PM', action: 'Checked In', iconColor: '#22c55e' },
                        { name: 'Sneha Patel', time: '12:31 PM', action: 'Checked In', iconColor: '#22c55e' },
                        { name: 'Rahul Joshi', time: '12:15 PM', action: 'Checked Out', iconColor: '#ef4444' }
                      ].map((log, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: log.iconColor }} />
                            <span style={{ fontWeight: 500 }}>{log.name}</span>
                          </div>
                          <span style={{ color: 'var(--lp-text-secondary)', fontSize: '0.72rem' }}>{log.action} • {log.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section className="landing-section-py" style={{ background: 'rgba(15, 23, 42, 0.1)' }}>
        <div className="landing-container">
          
          <div className="lp-section-header">
            <span className="lp-section-tag">Process</span>
            <h2 className="lp-section-title">Get set up in 5 simple steps.</h2>
            <p className="lp-section-desc">
              Onboarding your study hall or library has never been simpler. Follow this progression to start managing members.
            </p>
          </div>

          <div className="lp-steps-container">
            
            <div className="lp-step-item">
              <div className="lp-step-num">1</div>
              <span className="lp-step-title">Register Hall</span>
              <p className="lp-step-desc">Create your admin account and define details for all active physical branches.</p>
            </div>

            <div className="lp-step-item">
              <div className="lp-step-num">2</div>
              <span className="lp-step-title">Configure Seats</span>
              <p className="lp-step-desc">Design your floor layout, create different rooms, and assign seat capacities shift-wise.</p>
            </div>

            <div className="lp-step-item">
              <div className="lp-step-num">3</div>
              <span className="lp-step-title">Add Members</span>
              <p className="lp-step-desc">Import existing student details from Excel sheets or add new registrations manually.</p>
            </div>

            <div className="lp-step-item">
              <div className="lp-step-num">4</div>
              <span className="lp-step-title">Collect Fees</span>
              <p className="lp-step-desc">Allocate slots, generate invoices, share secure UPI/card links, and log fee payments.</p>
            </div>

            <div className="lp-step-item">
              <div className="lp-step-num">5</div>
              <span className="lp-step-title">Track Everything</span>
              <p className="lp-step-desc">Monitor live occupancy rates, collect logs, manage daily attendance, and track growth.</p>
            </div>

          </div>

        </div>
      </section>

      {/* ================= BENEFITS SECTION ================= */}
      <section className="landing-section-py">
        <div className="landing-container">
          
          <div className="lp-section-header">
            <span className="lp-section-tag">Value Proposition</span>
            <h2 className="lp-section-title">Designed to boost your business efficiency.</h2>
            <p className="lp-section-desc">
              Trishul helps study hall owners save time and generate higher revenue through complete operational visibility.
            </p>
          </div>

          <div className="lp-benefits-grid">
            
            <div className="lp-benefit-item">
              <div className="lp-benefit-num">01</div>
              <div>
                <h3 className="lp-benefit-title">Save Hours Weekly</h3>
                <p className="lp-benefit-desc">Automate admissions, fee alerts, and receipts. Our users save an average of 20+ hours of manual administrative work every single week.</p>
              </div>
            </div>

            <div className="lp-benefit-item">
              <div className="lp-benefit-num">02</div>
              <div>
                <h3 className="lp-benefit-title">Increase Monthly Revenue</h3>
                <p className="lp-benefit-desc">Say goodbye to fee leakages. Automate renewal notifications over SMS/WhatsApp so students renew their membership on time.</p>
              </div>
            </div>

            <div className="lp-benefit-item">
              <div className="lp-benefit-num">03</div>
              <div>
                <h3 className="lp-benefit-title">Eliminate Management Headaches</h3>
                <p className="lp-benefit-desc">Centralize your shifts, seat layouts, billing registers, check-in histories, and branch databases under a single cloud system.</p>
              </div>
            </div>

            <div className="lp-benefit-item">
              <div className="lp-benefit-num">04</div>
              <div>
                <h3 className="lp-benefit-title">Premium Student Experience</h3>
                <p className="lp-benefit-desc">Give students a high-fidelity visual layout map to choose their favorite slots, check live occupancy, and receive instant digital receipts.</p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ================= PRICING SECTION ================= */}
      <section id="pricing" className="landing-section-py" style={{ background: 'rgba(15, 23, 42, 0.1)' }}>
        <div className="landing-container">
          
          <div className="lp-section-header">
            <span className="lp-section-tag">Simple Pricing</span>
            <h2 className="lp-section-title">Choose the plan that fits your business.</h2>
            <p className="lp-section-desc">
              All plans include free onboarding training. Save 20% by switching to yearly billing.
            </p>
          </div>

          {/* Monthly/Yearly toggle */}
          <div className="pricing-toggle-container">
            <span className={`pricing-toggle-label ${!isYearly ? 'active' : ''}`}>Monthly</span>
            <div 
              className={`pricing-toggle-switch ${isYearly ? 'yearly' : ''}`}
              onClick={() => setIsYearly(!isYearly)}
            />
            <span className={`pricing-toggle-label ${isYearly ? 'active' : ''}`}>Yearly Billing</span>
            <span className="pricing-toggle-discount">Save 20%</span>
          </div>

          <div className="lp-pricing-grid">
            {plans.map((plan) => {
              const price = isYearly ? plan.priceYearly : plan.priceMonthly;
              return (
                <div key={plan.name} className={`lp-pricing-card ${plan.popular ? 'popular' : ''}`}>
                  {plan.popular && <div className="popular-badge">Most Popular</div>}
                  
                  <span className="pricing-plan-name">{plan.name}</span>
                  <p className="pricing-plan-desc">{plan.desc}</p>
                  
                  <div className="pricing-price-row">
                    <span className="pricing-amount">₹{price}</span>
                    <span className="pricing-period">/ month</span>
                  </div>

                  <div className="pricing-features-list">
                    {plan.features.map((feature, i) => (
                      <div key={i} className="pricing-feature-item">
                        <Check size={14} className="pricing-feature-icon" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    className={`lp-btn-primary`}
                    onClick={() => navigate('/login')}
                    style={{ width: '100%', justifyContent: 'center', marginTop: 'auto', padding: '0.75rem' }}
                  >
                    <span>Get Started</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ================= TESTIMONIALS SECTION ================= */}
      <section className="landing-section-py">
        <div className="landing-container">
          
          <div className="lp-section-header">
            <span className="lp-section-tag">Testimonials</span>
            <h2 className="lp-section-title">What other Library owners are saying.</h2>
            <p className="lp-section-desc">
              Hear from library and reading room business owners who upgraded their daily management workflow.
            </p>
          </div>

          <div className="lp-testimonials-grid">
            
            <div className="lp-testimonial-card">
              <div className="testimonial-stars">
                {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
              </div>
              <p className="testimonial-quote">
                "Moving from paper registers to Trishul has been a game-changer. I save at least 3 hours daily on manual billing and seat assignments. The automatic WhatsApp reminders are brilliant."
              </p>
              <div className="testimonial-user">
                <div className="testimonial-avatar">RM</div>
                <div className="testimonial-meta">
                  <span className="testimonial-name">Rajesh Mishra</span>
                  <span className="testimonial-business">Royal Library, Lucknow</span>
                </div>
              </div>
            </div>

            <div className="lp-testimonial-card">
              <div className="testimonial-stars">
                {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
              </div>
              <p className="testimonial-quote">
                "Managing 3 branches was a logistical nightmare. Trishul consolidated my entire revenue, occupancy, and manager logs in one single login. I can audit my business from anywhere."
              </p>
              <div className="testimonial-user">
                <div className="testimonial-avatar">AS</div>
                <div className="testimonial-meta">
                  <span className="testimonial-name">Abhishek Singh</span>
                  <span className="testimonial-business">Apex Study Spaces, Patna</span>
                </div>
              </div>
            </div>

            <div className="lp-testimonial-card">
              <div className="testimonial-stars">
                {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
              </div>
              <p className="testimonial-quote">
                "Our students absolutely love the visual seat booking flow. It gives them the premium feel of a coworking space, and billing disputes have completely dropped to zero."
              </p>
              <div className="testimonial-user">
                <div className="testimonial-avatar">PD</div>
                <div className="testimonial-meta">
                  <span className="testimonial-name">Priya Deshmukh</span>
                  <span className="testimonial-business">Prerna Reading Rooms, Pune</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ================= FAQ SECTION ================= */}
      <section className="landing-section-py" style={{ background: 'rgba(15, 23, 42, 0.1)' }}>
        <div className="landing-container">
          
          <div className="lp-section-header">
            <span className="lp-section-tag">Questions</span>
            <h2 className="lp-section-title">Frequently Asked Questions.</h2>
            <p className="lp-section-desc">
              Have questions about Trishul? Find quick answers to the most common inquiries.
            </p>
          </div>

          <div className="lp-faq-container">
            {faqs.map((faq, idx) => (
              <div key={idx} className={`lp-faq-item ${activeFaq === idx ? 'active' : ''}`}>
                <button
                  type="button"
                  className="lp-faq-question"
                  onClick={() => toggleFaq(idx)}
                >
                  <span>{faq.q}</span>
                  <ChevronDown size={18} className="lp-faq-chevron" />
                </button>
                <div className="lp-faq-answer">
                  <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--lp-text-secondary)', lineHeight: 1.6 }}>
                    {faq.a}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ================= ABOUT US SUMMARY ================= */}
      <section className="landing-section-py">
        <div className="landing-container lp-about-grid">
          
          <div className="lp-about-text">
            <span className="lp-section-tag">About Us</span>
            <h2 className="lp-section-title" style={{ fontSize: '2.1rem' }}>Modernizing Reading Rooms for the Next Generation.</h2>
            <p style={{ fontSize: '0.95rem', color: 'var(--lp-text-secondary)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
              Study halls and libraries are critical hubs for students preparing for competitive exams, civil services, and academic degrees. Yet, the technology supporting these owners has been stuck in the past.
            </p>
            <p style={{ fontSize: '0.95rem', color: 'var(--lp-text-secondary)', lineHeight: 1.6 }}>
              We built Trishul to empower small library and study hall entrepreneurs with the same high-fidelity cloud tools enjoyed by modern enterprise coworking spaces. We are committed to helping you scale your business seamlessly.
            </p>
          </div>

          <div className="lp-about-blocks">
            <div className="lp-about-card">
              <h4>
                <ShieldCheck size={16} className="lp-feature-icon-wrapper" style={{ width: '24px', height: '24px', borderRadius: '4px', padding: 0 }} /> Our Mission
              </h4>
              <p>To eliminate operational complexities for reading room owners across the country.</p>
            </div>
            <div className="lp-about-card">
              <h4>
                <Zap size={16} className="lp-feature-icon-wrapper" style={{ width: '24px', height: '24px', borderRadius: '4px', padding: 0 }} /> Our Vision
              </h4>
              <p>To build the default cloud operating system powering community spaces and libraries.</p>
            </div>
          </div>

        </div>
      </section>

      {/* ================= CONTACT SECTION ================= */}
      <section id="contact" className="landing-section-py" style={{ background: 'rgba(15, 23, 42, 0.1)' }}>
        <div className="landing-container lp-contact-grid">
          
          <div className="lp-contact-info-col">
            <div className="lp-contact-header">
              <span className="lp-section-tag">Get in Touch</span>
              <h3>Need a custom quote or a live demo walkthrough?</h3>
              <p>Our study hall operations specialists will reach out within 2 hours to answer your questions.</p>
            </div>

            <div className="lp-contact-details">
              <div className="lp-contact-detail-item">
                <Mail size={18} className="lp-contact-icon" />
                <div className="lp-contact-text-block">
                  <span className="lp-contact-label">EMAIL US</span>
                  <span className="lp-contact-val">contact@trishulsaas.com</span>
                </div>
              </div>
              <div className="lp-contact-detail-item">
                <Phone size={18} className="lp-contact-icon" />
                <div className="lp-contact-text-block">
                  <span className="lp-contact-label">CALL US</span>
                  <span className="lp-contact-val">+91 98765 43210</span>
                </div>
              </div>
              <div className="lp-contact-detail-item">
                <MapPin size={18} className="lp-contact-icon" />
                <div className="lp-contact-text-block">
                  <span className="lp-contact-label">OFFICE LOCATION</span>
                  <span className="lp-contact-val">Sector 62, Noida, Uttar Pradesh, 201301</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="whatsapp-button"
              onClick={() => {
                window.open('https://api.whatsapp.com/send?phone=919876543210&text=Hello,%20I%20am%20interested%20in%20Trishul%20Study%20Hall%20OS.', '_blank');
              }}
            >
              <span>Chat on WhatsApp</span>
            </button>
          </div>

          {/* Form */}
          <div className="lp-contact-form-card">
            <form onSubmit={handleContactSubmit}>
              <div className="lp-form-row">
                <div className="lp-form-group">
                  <label className="lp-form-label">Your Name</label>
                  <input
                    type="text"
                    required
                    className="lp-form-input"
                    placeholder="Full Name"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                  />
                </div>
                <div className="lp-form-group">
                  <label className="lp-form-label">Phone Number</label>
                  <input
                    type="tel"
                    className="lp-form-input"
                    placeholder="e.g. +91 9999999999"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="lp-form-group">
                <label className="lp-form-label">Email Address</label>
                <input
                  type="email"
                  required
                  className="lp-form-input"
                  placeholder="name@business.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                />
              </div>

              <div className="lp-form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="lp-form-label">How can we help?</label>
                <textarea
                  required
                  className="lp-form-input"
                  style={{ minHeight: '110px', resize: 'vertical', fontFamily: 'inherit' }}
                  placeholder="Tell us about your study hall slots or capacity size..."
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={isContactSubmitting}
                className="lp-btn-primary lp-form-submit-btn"
              >
                {isContactSubmitting ? 'Sending Request...' : 'Send Message'}
              </button>
            </form>
          </div>

        </div>
      </section>

      {/* ================= FINAL CALL TO ACTION ================= */}
      <section className="landing-section-py">
        <div className="landing-container">
          
          <div className="lp-cta-banner">
            <h2 className="lp-cta-title">Ready to modernize your Study Hall?</h2>
            <p className="lp-cta-desc">
              Join hundreds of library owners nationwide who use Trishul to eliminate admin overhead and increase collections.
            </p>
            <div className="lp-cta-actions">
              <button
                type="button"
                className="lp-btn-primary"
                onClick={() => navigate('/login')}
                style={{ padding: '0.8rem 2rem', fontSize: '0.95rem' }}
              >
                <span>Get Started Now</span>
                <ArrowRight size={16} />
              </button>
              <button
                type="button"
                className="lp-btn-secondary"
                onClick={() => {
                  window.location.href = '#contact';
                }}
                style={{ padding: '0.8rem 2rem', fontSize: '0.95rem' }}
              >
                Request Custom Demo
              </button>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}
