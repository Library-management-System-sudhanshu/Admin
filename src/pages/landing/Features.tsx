import { useNavigate } from 'react-router-dom';
import { 
  Armchair, Users, ReceiptText, Clock, Building2, LayoutDashboard, 
  LineChart, Bell, Database, Check, ShieldCheck, Zap 
} from 'lucide-react';
import './Landing.css';

export default function Features() {
  const navigate = useNavigate();

  const detailsList = [
    {
      title: 'Seat Allocation & Shift Management',
      icon: <Armchair size={24} />,
      desc: 'Build customized room layouts and map out individual desks. Assign seats shift-wise to maximize capacity utilization and eliminate student friction.',
      items: [
        'Shift splits: Morning, Evening, Night, or Full Day allocations.',
        'Visual floor plan showing live, blocked, and reserved seats.',
        'Seat lock capabilities to prevent booking overlapping.'
      ]
    },
    {
      title: 'Automated Billing & GST Invoices',
      icon: <ReceiptText size={24} />,
      desc: 'Simplify fee collection. Set up custom price subscription plans, share UPI collection links, and automatically generate GST-ready invoice receipts.',
      items: [
        'Automatic WhatsApp & SMS due alerts sent before subscription expiry.',
        'UPI, NetBanking, card payments logging and cash drawer audits.',
        'Detailed cashbook ledger tracking expenses and net collections.'
      ]
    },
    {
      title: 'QR Attendance & Check-In Feed',
      icon: <Clock size={24} />,
      desc: 'Monitor entry and exit timings automatically. Students scan a custom QR code at the desk or gate to log attendance and shifts.',
      items: [
        'Live attendance logs indicating check-in lists in real-time.',
        'Identify shift-time violations and unauthorized seat occupancies.',
        'Centralized log database accessible from any device.'
      ]
    },
    {
      title: 'Multi-Branch Synchronization',
      icon: <Building2 size={24} />,
      desc: 'Audit your entire library network under one dashboard. Compare individual locations, allocate slots, and monitor consolidated analytics.',
      items: [
        'Separate logins for managers with specific location restrictions.',
        'Consolidated revenue audits and branch profit comparisons.',
        'Easy branch transfer of student profiles with allocation histories.'
      ]
    }
  ];

  return (
    <div className="landing-scope">
      
      {/* Subpage Hero */}
      <section className="subpage-hero">
        <div className="landing-container">
          <span className="lp-section-tag">Product Core</span>
          <h1 className="subpage-hero-title">Powerful tools to scale your Library business.</h1>
          <p className="subpage-hero-desc">
            Trishul integrates seats layout, membership directories, payment processing, check-in feeds, and multi-branch audits in one cloud database.
          </p>
        </div>
      </section>

      {/* Feature Sections */}
      <section className="landing-section-py" style={{ paddingTop: '1rem' }}>
        <div className="landing-container">
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5rem', marginBottom: '5.5rem' }}>
            {detailsList.map((f, idx) => {
              const isEven = idx % 2 === 0;
              return (
                <div 
                  key={f.title}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '4rem',
                    alignItems: 'center'
                  }}
                  className="preview-showcase-grid"
                >
                  
                  {/* Text panel */}
                  <div style={{ order: isEven ? 1 : 2 }}>
                    <div className="lp-feature-icon-wrapper" style={{ marginBottom: '1.25rem' }}>
                      {f.icon}
                    </div>
                    <h2 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '1rem' }}>{f.title}</h2>
                    <p style={{ color: 'var(--lp-text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                      {f.desc}
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {f.items.map((item, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem' }}>
                          <Check size={14} style={{ color: 'var(--lp-success)', flexShrink: 0 }} />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Visual representation */}
                  <div style={{ order: isEven ? 2 : 1, padding: '2.5rem', background: 'rgba(15, 23, 42, 0.25)' }} className="lp-compare-card trishul-core">
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '1.5rem' }}>
                      <ShieldCheck size={20} style={{ color: 'var(--lp-secondary)' }} />
                      <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Trishul {f.title.split(' ')[0]} Module</h3>
                    </div>
                    
                    {idx === 0 && (
                      <div className="seat-grid-lp" style={{ gridTemplateColumns: 'repeat(8, 1fr)' }}>
                        {Array.from({ length: 24 }).map((_, i) => {
                          const occ = [1, 4, 9, 12, 17, 21].includes(i);
                          return (
                            <div
                              key={i}
                              className={`seat-lp-cell ${occ ? 'occ' : 'avail'}`}
                            />
                          );
                        })}
                      </div>
                    )}

                    {idx === 1 && (
                      <div className="metrics-list" style={{ gap: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', borderBottom: '1px solid var(--lp-border)', paddingBottom: '0.4rem' }}>
                          <strong>Active Plan Dues</strong>
                          <span style={{ color: 'var(--lp-secondary)', fontWeight: 600 }}>Reminders Active</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                          <span>Aman Gupta (Seat A10)</span>
                          <span style={{ color: 'var(--lp-danger)', fontWeight: 600 }}>Dues: ₹1,500</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                          <span>Renu Sharma (Seat B4)</span>
                          <span style={{ color: 'var(--lp-danger)', fontWeight: 600 }}>Dues: ₹2,400</span>
                        </div>
                      </div>
                    )}

                    {idx === 2 && (
                      <div className="metrics-list" style={{ gap: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', borderBottom: '1px solid var(--lp-border)', paddingBottom: '0.4rem' }}>
                          <strong>Attendance Feed Logs</strong>
                          <span className="live-dot" />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                          <span>Sunil Verma (11:00 AM)</span>
                          <span style={{ color: 'var(--lp-success)', fontWeight: 600 }}>Checked In</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                          <span>Priya Sen (10:45 AM)</span>
                          <span style={{ color: 'var(--lp-success)', fontWeight: 600 }}>Checked In</span>
                        </div>
                      </div>
                    )}

                    {idx === 3 && (
                      <div className="metrics-list" style={{ gap: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', borderBottom: '1px solid var(--lp-border)', paddingBottom: '0.4rem' }}>
                          <strong>Active Locations Grid</strong>
                          <span style={{ fontWeight: 600, color: 'var(--lp-secondary)' }}>All Syncing</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                          <span>Branch 1: Noida Sec 62</span>
                          <span style={{ fontWeight: 600 }}>88% Occupied</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                          <span>Branch 2: Delhi Mukherjee Nagar</span>
                          <span style={{ fontWeight: 600 }}>92% Occupied</span>
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              );
            })}
          </div>

          {/* CTA Banner */}
          <div className="lp-cta-banner">
            <h2 className="lp-cta-title">Upgrade Your Library Infrastructure</h2>
            <p className="lp-cta-desc">
              Experience the power of Trishul and eliminate operational friction in your reading room.
            </p>
            <div className="lp-cta-actions" style={{ justifyContent: 'center' }}>
              <button
                type="button"
                className="lp-btn-primary"
                onClick={() => navigate('/login')}
              >
                <span>Get Started Now</span>
              </button>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}
