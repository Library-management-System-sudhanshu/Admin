import { useState } from 'react';
import { Search, HelpCircle, Armchair, ReceiptText, Users, SlidersHorizontal, Key } from 'lucide-react';
import './Landing.css';

export default function Help() {
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    {
      title: 'Account Setup',
      icon: <Key size={18} style={{ color: 'var(--lp-primary)' }} />,
      desc: 'Learn how to set up your primary workspace owner account, configure your profile, and add additional branch managers.'
    },
    {
      title: 'Seat Allocation',
      icon: <Armchair size={18} style={{ color: 'var(--lp-primary)' }} />,
      desc: 'Step-by-step guides to design room layouts, assign shift slots (Morning/Evening/Full Day), and lock specific seats.'
    },
    {
      title: 'GST & Billing',
      icon: <ReceiptText size={18} style={{ color: 'var(--lp-primary)' }} />,
      desc: 'Guides to configure subscription packages, log manual payments, issue digital receipts, and sync online payment links.'
    },
    {
      title: 'Member Management',
      icon: <Users size={18} style={{ color: 'var(--lp-primary)' }} />,
      desc: 'Understand how to import student profiles using Excel sheets, assign card QR codes, and review payment history logs.'
    },
    {
      title: 'WhatsApp Notifications',
      icon: <SlidersHorizontal size={18} style={{ color: 'var(--lp-primary)' }} />,
      desc: 'Learn how to trigger automated SMS/WhatsApp alerts, customize sender templates, and manage expiry warning schedules.'
    },
    {
      title: 'System Security',
      icon: <HelpCircle size={18} style={{ color: 'var(--lp-primary)' }} />,
      desc: 'Read about data encryption standards, daily cloud backup processes, and restoring student database logs.'
    }
  ];

  const filteredCategories = categories.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="landing-scope">
      
      {/* Hero section with search box */}
      <section className="subpage-hero" style={{ paddingBottom: '5rem' }}>
        <div className="landing-container">
          <span className="lp-section-tag">Knowledge Base</span>
          <h1 className="subpage-hero-title">How can we help you today?</h1>
          <p className="subpage-hero-desc">
            Search our knowledge base for seat allocations, custom bills, or notifications setup.
          </p>

          <div className="help-search-wrapper">
            <Search size={18} className="help-search-icon" />
            <input
              type="text"
              className="help-search-input"
              placeholder="Search help topics (e.g. seat map, GST invoice, QR code)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="landing-section-py" style={{ paddingTop: '0rem' }}>
        <div className="landing-container">
          
          <div className="lp-section-header" style={{ marginBottom: '2.5rem' }}>
            <h2 className="lp-section-title" style={{ fontSize: '1.75rem' }}>Help Categories</h2>
            <p className="lp-section-desc">Select a category below to browse matching step-by-step setup guides.</p>
          </div>

          <div className="help-categories-grid" style={{ marginBottom: '5.5rem' }}>
            {filteredCategories.length > 0 ? (
              filteredCategories.map((c) => (
                <div key={c.title} className="help-category-card">
                  <div className="help-category-title">
                    <div className="lp-feature-icon-wrapper" style={{ width: '28px', height: '28px', borderRadius: '4px', padding: 0 }}>
                      {c.icon}
                    </div>
                    <span>{c.title}</span>
                  </div>
                  <p className="help-category-desc">{c.desc}</p>
                  <span style={{ fontSize: '0.75rem', color: 'var(--lp-primary)', fontWeight: 600, marginTop: 'auto' }}>
                    Browse Articles →
                  </span>
                </div>
              ))
            ) : (
              <div style={{ gridColumn: 'span 3', textAlign: 'center', padding: '3rem', color: 'var(--lp-text-secondary)', fontSize: '0.9rem' }}>
                No help topics found matching "{searchQuery}".
              </div>
            )}
          </div>

          {/* Still Need Help banner */}
          <div className="lp-compare-card trishul-core" style={{ padding: '2.5rem', textAlign: 'center' }}>
            <HelpCircle size={24} style={{ color: 'var(--lp-primary)', marginBottom: '0.75rem' }} />
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Still need assistance?</h3>
            <p style={{ color: 'var(--lp-text-secondary)', fontSize: '0.88rem', margin: '0 auto 1.5rem auto', maxWidth: '480px' }}>
              If you did not find the article you were looking for, reach out to our customer success team for a live remote desktop setup.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
              <button
                type="button"
                className="lp-btn-primary"
                onClick={() => {
                  window.location.href = '/contact';
                }}
              >
                Open Support Ticket
              </button>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}
