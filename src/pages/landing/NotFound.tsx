import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';
import './Landing.css';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="landing-scope">
      
      <div className="landing-container subpage-centered-container">
        
        <span style={{ fontSize: '6rem', fontWeight: 950, color: 'var(--lp-primary)', lineHeight: 1, letterSpacing: '-0.05em' }}>
          404
        </span>
        
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginTop: '1rem', marginBottom: '0.75rem', letterSpacing: '-0.025em' }}>
          Page not found
        </h1>
        
        <p style={{ color: 'var(--lp-text-secondary)', fontSize: '1.05rem', maxWidth: '480px', lineHeight: 1.6, margin: '0 auto 2.5rem auto' }}>
          Sorry, the page you are looking for does not exist or has been moved to a different URL route directory.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button
            type="button"
            className="lp-btn-secondary"
            onClick={() => navigate(-1)}
            style={{ gap: '8px' }}
          >
            <ArrowLeft size={16} />
            <span>Go Back</span>
          </button>
          <button
            type="button"
            className="lp-btn-primary"
            onClick={() => navigate('/')}
            style={{ gap: '8px' }}
          >
            <Home size={16} />
            <span>Return Home</span>
          </button>
        </div>

      </div>

    </div>
  );
}
