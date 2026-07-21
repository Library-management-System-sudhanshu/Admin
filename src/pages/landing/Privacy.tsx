import './Landing.css';

export default function Privacy() {
  return (
    <div className="landing-scope">
      
      <section className="subpage-hero">
        <div className="landing-container">
          <span className="lp-section-tag">Legal Terms</span>
          <h1 className="subpage-hero-title">Privacy Policy</h1>
          <p className="subpage-hero-desc">Last Updated: July 19, 2026</p>
        </div>
      </section>

      <section className="landing-section-py" style={{ paddingTop: '1rem' }}>
        <div className="landing-container">
          <div className="legal-content-card">
            
            <div className="legal-section">
              <h3>1. Data We Collect</h3>
              <p>We collect information you provide directly to us when creating a workspace, registering a student member, or submitting payment transactions. This includes names, email addresses, contact details, physical branch addresses, pincodes, and GST details.</p>
            </div>

            <div className="legal-section">
              <h3>2. How We Use Your Data</h3>
              <p>We use this information to operate, maintain, and provide the features of the Trishul Study Hall & Library Management platform. This includes sending fee reminders over WhatsApp/SMS, processing invoices, managing seat layouts, and generating consolidated analytics reports.</p>
            </div>

            <div className="legal-section">
              <h3>3. Data Sharing & Security</h3>
              <p>We do not sell your personal or student databases to third parties. We employ industry-standard encryption protocols (SSL/TLS) to secure all payment queries, user accounts, and student files, maintaining regular automated cloud backups to prevent data loss.</p>
            </div>

            <div className="legal-section">
              <h3>4. Contact Us</h3>
              <p>If you have any questions regarding our Privacy Policy or data storage practices, please reach out to us at privacy@trishulsaas.com.</p>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}
