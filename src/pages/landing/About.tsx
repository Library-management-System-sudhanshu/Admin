import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Zap, Users, ShieldAlert, Award, Star } from 'lucide-react';
import './Landing.css';

export default function About() {
  const navigate = useNavigate();

  return (
    <div className="landing-scope">
      
      {/* Subpage Hero */}
      <section className="subpage-hero">
        <div className="landing-container">
          <span className="lp-section-tag">Our Backstory</span>
          <h1 className="subpage-hero-title">We are on a mission to modernize community study spaces.</h1>
          <p className="subpage-hero-desc">
            Trishul was founded to help library and study hall owners manage their seats, students, and billing with premium, cloud-based software.
          </p>
        </div>
      </section>

      {/* Grid Content */}
      <section className="landing-section-py" style={{ paddingTop: '2rem' }}>
        <div className="landing-container">
          
          <div className="lp-about-grid" style={{ marginBottom: '5rem' }}>
            <div>
              <h2 style={{ fontSize: '2rem', marginBottom: '1.25rem' }}>Why we built Trishul</h2>
              <p style={{ color: 'var(--lp-text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1rem' }}>
                Community reading rooms and study halls are essential infrastructure for millions of students preparing for civil services, medical entries, coaching exams, and career transitions. They provide quiet focus zones where students spend 10 to 14 hours every single day.
              </p>
              <p style={{ color: 'var(--lp-text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                Despite their critical role, we observed that study hall owners were stuck using notebooks, messy registers, and scattered Excel sheets to manage seats, shifting slot timings, and outstanding dues. This operational overload led to administrative errors, payment leakages, and client arguments. Trishul was built to replace these manual processes with a premium, automated OS.
              </p>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="lp-feature-card">
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <Award size={20} className="lp-feature-icon-wrapper" style={{ width: '32px', height: '32px', padding: 0, borderRadius: '6px' }} />
                  <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Enterprise Standard</h3>
                </div>
                <p style={{ margin: 0 }}>Providing local library entrepreneurs with the same high-standard software used by multi-billion dollar coworking chains globally.</p>
              </div>

              <div className="lp-feature-card">
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <Star size={20} className="lp-feature-icon-wrapper" style={{ width: '32px', height: '32px', padding: 0, borderRadius: '6px' }} />
                  <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Student First UX</h3>
                </div>
                <p style={{ margin: 0 }}>Providing a smooth visual seat map and digital invoice receipt experience for the modern generation of reading room members.</p>
              </div>
            </div>
          </div>

          {/* Mission and Vision Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '5rem' }}>
            <div className="lp-compare-card trishul-core" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '1rem' }}>
                <ShieldCheck size={20} style={{ color: 'var(--lp-secondary)' }} />
                <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Our Mission</h3>
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--lp-text-secondary)', lineHeight: 1.6, margin: 0 }}>
                To empower library owners with cloud automation that cuts down admin overhead, saves hours of manual work, and helps scale branches seamlessly.
              </p>
            </div>

            <div className="lp-compare-card trishul-core" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '1rem' }}>
                <Zap size={20} style={{ color: 'var(--lp-secondary)' }} />
                <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Our Vision</h3>
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--lp-text-secondary)', lineHeight: 1.6, margin: 0 }}>
                To become the industry standard cloud infrastructure powering community libraries, academic reading spaces, and modern coworking centers nationwide.
              </p>
            </div>

            <div className="lp-compare-card trishul-core" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '1rem' }}>
                <Users size={20} style={{ color: 'var(--lp-secondary)' }} />
                <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Our Commitment</h3>
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--lp-text-secondary)', lineHeight: 1.6, margin: 0 }}>
                Continuous product innovation, secure cloud storage with daily backups, and robust 24/7 client support to ensure your business operations run smoothly.
              </p>
            </div>
          </div>

          {/* CTA Banner */}
          <div className="lp-cta-banner">
            <h2 className="lp-cta-title">Join 500+ Modern Libraries Today</h2>
            <p className="lp-cta-desc">
              Experience the difference an automated cloud platform can make to your daily management and revenue operations.
            </p>
            <div className="lp-cta-actions" style={{ justifyContent: 'center' }}>
              <button
                type="button"
                className="lp-btn-primary"
                onClick={() => navigate('/login')}
              >
                <span>Start Your Free Trial</span>
              </button>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}
