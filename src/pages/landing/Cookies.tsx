import './Landing.css';

export default function Cookies() {
  return (
    <div className="landing-scope">
      
      <section className="subpage-hero">
        <div className="landing-container">
          <span className="lp-section-tag">Legal Terms</span>
          <h1 className="subpage-hero-title">Cookie Policy</h1>
          <p className="subpage-hero-desc">Last Updated: July 19, 2026</p>
        </div>
      </section>

      <section className="landing-section-py" style={{ paddingTop: '1rem' }}>
        <div className="landing-container">
          <div className="legal-content-card">
            
            <div className="legal-section">
              <h3>1. Use of Cookies</h3>
              <p>We use essential cookies to maintain security authentication sessions when you log in to your tenant dashboard, and to remember local visual settings (such as sidebar toggle status and active branch selections).</p>
            </div>

            <div className="legal-section">
              <h3>2. Analytical Tracking</h3>
              <p>We log aggregate usage statistics (such as page visit patterns and dashboard response times) using privacy-focused third-party analytics cookies to improve the speed, performance, and accessibility of Trishul.</p>
            </div>

            <div className="legal-section">
              <h3>3. Managing Cookies</h3>
              <p>You can block or disable cookies through your browser settings. However, please note that disabling essential cookies will prevent you from signing in to the study hall admin panel.</p>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}
