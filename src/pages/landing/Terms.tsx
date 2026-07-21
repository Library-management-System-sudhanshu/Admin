import './Landing.css';

export default function Terms() {
  return (
    <div className="landing-scope">
      
      <section className="subpage-hero">
        <div className="landing-container">
          <span className="lp-section-tag">Legal Terms</span>
          <h1 className="subpage-hero-title">Terms & Conditions</h1>
          <p className="subpage-hero-desc">Last Updated: July 19, 2026</p>
        </div>
      </section>

      <section className="landing-section-py" style={{ paddingTop: '1rem' }}>
        <div className="landing-container">
          <div className="legal-content-card">
            
            <div className="legal-section">
              <h3>1. Agreement to Terms</h3>
              <p>By registering for a Trishul account, creating a workspace, or using our Study Hall & Library Management dashboard, you agree to comply with and be bound by these terms. If you disagree with any part, you may not access our services.</p>
            </div>

            <div className="legal-section">
              <h3>2. Account Registration & Workspace</h3>
              <p>You must provide accurate and complete details when setting up your workspace branch. You are responsible for keeping your login credentials secure, and you assume full liability for all actions performed within your tenant administration panel.</p>
            </div>

            <div className="legal-section">
              <h3>3. Fees & Subscription Plans</h3>
              <p>We charge monthly or yearly subscription fees based on your selected package (Starter, Professional, or Enterprise). Failure to make timely subscription payments may result in workspace suspension and temporary restriction of access to student databases.</p>
            </div>

            <div className="legal-section">
              <h3>4. Modifications to Services</h3>
              <p>Trishul reserves the right to modify, updates, or suspend specific dashboard modules or integrations at any time, with reasonable prior notifications sent to workspace administrators for any major updates.</p>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}
