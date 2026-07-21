import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Sparkles } from 'lucide-react';
import { useToast } from '../../components/ui/ToastContext';
import './Landing.css';

export default function ComingSoon() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setIsSubmitting(true);
    setTimeout(() => {
      showToast('Thank you! You have been subscribed successfully to our feature releases newsletter.', 'success');
      setEmail('');
      setIsSubmitting(false);
    }, 1200);
  };

  return (
    <div className="landing-scope">
      
      <div className="landing-container subpage-centered-container">
        
        <div className="lp-hero-tag" style={{ marginBottom: '1.5rem' }}>
          <Sparkles size={13} style={{ marginRight: '4px' }} />
          <span>IN DEVELOPMENT</span>
        </div>
        
        <h1 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '1rem', letterSpacing: '-0.03em' }}>
          Exciting changes are on the way.
        </h1>
        
        <p style={{ color: 'var(--lp-text-secondary)', fontSize: '1.1rem', maxWidth: '550px', lineHeight: 1.6, margin: '0 auto 1.5rem auto' }}>
          We are currently building this feature module (such as advanced analytics logs, integrated SMS templates, or dashboard widgets). Sign up to receive email notifications when it launches.
        </p>

        <form onSubmit={handleSubscribe} className="coming-soon-email-box">
          <input
            type="email"
            required
            className="lp-form-input"
            style={{ flexGrow: 1 }}
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="lp-btn-primary"
            style={{ padding: '0.65rem 1.25rem' }}
          >
            Notify Me
          </button>
        </form>

        <button
          type="button"
          className="lp-btn-secondary"
          onClick={() => navigate(-1)}
          style={{ marginTop: '2.5rem', gap: '8px' }}
        >
          <ArrowLeft size={16} />
          <span>Go Back</span>
        </button>

      </div>

    </div>
  );
}
