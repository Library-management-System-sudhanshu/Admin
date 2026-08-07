import { useState } from 'react';
import { Mail, Phone, MapPin, Clock, MessageSquare } from 'lucide-react';
import { useToast } from '../../components/ui/ToastContext';
import './Landing.css';

export default function Contact() {
  const { showToast } = useToast();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim() || !subject.trim()) {
      showToast('Please fill out all required fields.', 'error');
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      showToast('Thank you! Your message has been sent successfully. Our support team will respond shortly.', 'success');
      setName('');
      setEmail('');
      setPhone('');
      setSubject('');
      setMessage('');
      setIsSubmitting(false);
    }, 1500);
  };

  return (
    <div className="landing-scope">
      
      {/* Subpage Hero */}
      <section className="subpage-hero">
        <div className="landing-container">
          <span className="lp-section-tag">Support Center</span>
          <h1 className="subpage-hero-title">We are here to help you succeed.</h1>
          <p className="subpage-hero-desc">
            Have questions about seat mapping, subscriptions, or onboarding? Contact our operations specialists.
          </p>
        </div>
      </section>

      {/* Grid Content */}
      <section className="landing-section-py" style={{ paddingTop: '1rem' }}>
        <div className="landing-container">
          
          <div className="lp-contact-grid" style={{ marginBottom: '5rem' }}>
            
            {/* Info Col */}
            <div className="lp-contact-info-col">
              <div className="lp-contact-header">
                <h3>Contact Information</h3>
                <p>Reach out to us via email, phone, or visit our Noida office. Alternatively, start a live WhatsApp chat for faster replies.</p>
              </div>

              <div className="lp-contact-details">
                <div className="lp-contact-detail-item">
                  <Mail size={18} className="lp-contact-icon" />
                  <div className="lp-contact-text-block">
                    <span className="lp-contact-label">EMAIL ADDRESS</span>
                    <span className="lp-contact-val">support@trishulsaas.com</span>
                  </div>
                </div>

                <div className="lp-contact-detail-item">
                  <Phone size={18} className="lp-contact-icon" />
                  <div className="lp-contact-text-block">
                    <span className="lp-contact-label">PHONE LINES</span>
                    <span className="lp-contact-val">+91 98765 43210 (Sales)</span>
                    <span className="lp-contact-val">+91 98765 43211 (Support)</span>
                  </div>
                </div>

                <div className="lp-contact-detail-item">
                  <MapPin size={18} className="lp-contact-icon" />
                  <div className="lp-contact-text-block">
                    <span className="lp-contact-label">HEADQUARTERS</span>
                    <span className="lp-contact-val">Sector 62, Noida, Uttar Pradesh, 201301</span>
                  </div>
                </div>

                <div className="lp-contact-detail-item">
                  <Clock size={18} className="lp-contact-icon" />
                  <div className="lp-contact-text-block">
                    <span className="lp-contact-label">SUPPORT HOURS</span>
                    <span className="lp-contact-val">Monday - Saturday (9:00 AM - 7:00 PM IST)</span>
                    <span className="lp-contact-val">Emergency Support: 24/7 (Professional & Enterprise plans)</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="whatsapp-button"
                onClick={() => {
                  window.open('https://api.whatsapp.com/send?phone=919876543210&text=Hello,%20I%20have%20an%20inquiry%20about%20Trishul%20Study%20Hall%20OS.', '_blank');
                }}
              >
                <span>Chat on WhatsApp</span>
              </button>
            </div>

            {/* Form Col */}
            <div className="lp-contact-form-card">
              <form onSubmit={handleSubmit}>
                <div className="lp-form-row">
                  <div className="lp-form-group">
                    <label className="lp-form-label">Full Name *</label>
                    <input
                      type="text"
                      required
                      className="lp-form-input"
                      placeholder="e.g. Rahul Kumar"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="lp-form-group">
                    <label className="lp-form-label">Phone Number</label>
                    <input
                      type="tel"
                      className="lp-form-input"
                      placeholder="e.g. +91 9999999999"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div className="lp-form-group">
                  <label className="lp-form-label">Email Address *</label>
                  <input
                    type="email"
                    required
                    className="lp-form-input"
                    placeholder="name@business.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value.toLowerCase())}
                  />
                </div>

                <div className="lp-form-group">
                  <label className="lp-form-label">Subject *</label>
                  <input
                    type="text"
                    required
                    className="lp-form-input"
                    placeholder="e.g. Custom Demo Request / Setup Help"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>

                <div className="lp-form-group" style={{ marginBottom: '1.5rem' }}>
                  <label className="lp-form-label">Your Message *</label>
                  <textarea
                    required
                    className="lp-form-input"
                    style={{ minHeight: '130px', resize: 'vertical', fontFamily: 'inherit' }}
                    placeholder="Provide details about your study hall capacities or queries..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="lp-btn-primary lp-form-submit-btn"
                >
                  {isSubmitting ? 'Submitting Form...' : 'Send Message'}
                </button>
              </form>
            </div>

          </div>

          {/* Simulated Google Map */}
          <div className="lp-compare-card trishul-core" style={{ padding: '2rem', textAlign: 'center', background: 'rgba(15, 23, 42, 0.2)' }}>
            <MapPin size={24} style={{ color: 'var(--lp-primary)', marginBottom: '0.75rem' }} />
            <h4 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>Noida Sector 62 Office Campus</h4>
            <p style={{ color: 'var(--lp-text-secondary)', fontSize: '0.85rem', margin: '0 auto 1.5rem auto', maxWidth: '450px' }}>
              We are located in Sector 62 Noida, next to major transit lanes. Stop by for an in-person software consultation.
            </p>
            <div style={{ height: '300px', background: 'rgba(2, 6, 23, 0.45)', border: '1px solid var(--lp-border)', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '0.88rem', color: 'var(--lp-text-secondary)', fontWeight: 500 }}>
                [ Interactive Map Placeholder - Sector 62 Noida Campus ]
              </span>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}
