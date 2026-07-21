import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Info, ArrowRight, Star } from 'lucide-react';
import './Landing.css';

export default function Pricing() {
  const navigate = useNavigate();
  const [isYearly, setIsYearly] = useState(false);

  const plans = [
    {
      name: 'Starter',
      priceMonthly: 1200,
      priceYearly: 960,
      desc: 'Perfect for small reading rooms or single branch study halls.',
      buttonText: 'Start Free Trial',
      popular: false,
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
      priceMonthly: 2400,
      priceYearly: 1920,
      desc: 'Best for growing study halls requiring automated collections & billing.',
      buttonText: 'Go Professional',
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
      priceMonthly: 4500,
      priceYearly: 3600,
      desc: 'Built for multi-branch networks and large coaching reading rooms.',
      buttonText: 'Contact Sales',
      popular: false,
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

  // Feature matrix categories for details list
  const matrix = [
    { category: 'Capacity & Allocation', items: [
      { name: 'Seats Configuration Limit', starter: '50 Seats', prof: '150 Seats', ent: 'Unlimited' },
      { name: 'Room Layout Mapping', starter: '1 Room', prof: 'Up to 3 Rooms', ent: 'Unlimited' },
      { name: 'Shift Slots Allocation', starter: 'Basic Shifts', prof: 'Custom Shifts', ent: 'Unlimited Shifts' }
    ]},
    { category: 'Billing & Collection', items: [
      { name: 'GST Invoice Generation', starter: 'No', prof: 'Yes', ent: 'Yes' },
      { name: 'SMS/WhatsApp Dues alerts', starter: 'No', prof: 'Yes (Standard)', ent: 'Yes (Custom Sender ID)' },
      { name: 'UPI & Payments Integration', starter: 'No', prof: 'Yes', ent: 'Yes' },
      { name: 'Expense Logs & Ledger', starter: 'Yes', prof: 'Yes', ent: 'Yes' }
    ]},
    { category: 'Integrations & Access', items: [
      { name: 'QR Code Attendance Feed', starter: 'No', prof: 'Yes', ent: 'Yes' },
      { name: 'Multi-Branch Syncing', starter: 'No', prof: 'Yes (Up to 3)', ent: 'Yes (Unlimited)' },
      { name: 'Staff Management', starter: 'No', prof: 'Yes', ent: 'Yes' },
      { name: 'Custom Developer APIs', starter: 'No', prof: 'No', ent: 'Yes' }
    ]}
  ];

  return (
    <div className="landing-scope">
      
      {/* Subpage Hero */}
      <section className="subpage-hero">
        <div className="landing-container">
          <span className="lp-section-tag">Flexible Pricing</span>
          <h1 className="subpage-hero-title">Transparent plans for libraries of all sizes.</h1>
          <p className="subpage-hero-desc">
            Scale your reading room with predictable pricing. Get started on a 14-day free trial.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="landing-section-py" style={{ paddingTop: '1rem' }}>
        <div className="landing-container">
          
          {/* Monthly/Yearly toggle */}
          <div className="pricing-toggle-container">
            <span className={`pricing-toggle-label ${!isYearly ? 'active' : ''}`}>Monthly Billing</span>
            <div 
              className={`pricing-toggle-switch ${isYearly ? 'yearly' : ''}`}
              onClick={() => setIsYearly(!isYearly)}
            />
            <span className={`pricing-toggle-label ${isYearly ? 'active' : ''}`}>Yearly Billing</span>
            <span className="pricing-toggle-discount">Save 20%</span>
          </div>

          <div className="lp-pricing-grid" style={{ marginBottom: '5.5rem' }}>
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
                    <span>{plan.buttonText}</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Features Comparison Matrix */}
          <div className="lp-section-header" style={{ marginBottom: '3rem' }}>
            <h2 className="lp-section-title" style={{ fontSize: '1.85rem' }}>Compare Plans & Limits</h2>
            <p className="lp-section-desc">Get a detailed comparison of everything included in Starter, Professional, and Enterprise plans.</p>
          </div>

          <div className="lp-compare-card trishul-core" style={{ padding: '2rem 2.5rem', marginBottom: '4rem', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--lp-border)' }}>
                  <th style={{ padding: '12px 8px', fontSize: '0.9rem', fontWeight: 800 }}>Feature Name</th>
                  <th style={{ padding: '12px 8px', fontSize: '0.9rem', fontWeight: 800, width: '150px' }}>Starter</th>
                  <th style={{ padding: '12px 8px', fontSize: '0.9rem', fontWeight: 800, width: '150px' }}>Professional</th>
                  <th style={{ padding: '12px 8px', fontSize: '0.9rem', fontWeight: 800, width: '150px' }}>Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {matrix.map((cat, idx) => (
                  <React.Fragment key={idx}>
                    <tr>
                      <td colSpan={4} style={{ padding: '16px 8px 8px 8px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--lp-secondary)', letterSpacing: '0.08em' }}>
                        {cat.category}
                      </td>
                    </tr>
                    {cat.items.map((item, itemIdx) => (
                      <tr key={itemIdx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '12px 8px', fontSize: '0.85rem', fontWeight: 500 }}>{item.name}</td>
                        <td style={{ padding: '12px 8px', fontSize: '0.85rem', color: 'var(--lp-text-secondary)' }}>{item.starter}</td>
                        <td style={{ padding: '12px 8px', fontSize: '0.85rem', color: 'var(--lp-text-primary)', fontWeight: 600 }}>{item.prof}</td>
                        <td style={{ padding: '12px 8px', fontSize: '0.85rem', color: 'var(--lp-text-secondary)' }}>{item.ent}</td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </section>

    </div>
  );
}
