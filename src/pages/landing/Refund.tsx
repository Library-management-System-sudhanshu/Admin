import './Landing.css';

export default function Refund() {
  return (
    <div className="landing-scope">
      
      <section className="subpage-hero">
        <div className="landing-container">
          <span className="lp-section-tag">Legal Terms</span>
          <h1 className="subpage-hero-title">Refund Policy</h1>
          <p className="subpage-hero-desc">Last Updated: July 19, 2026</p>
        </div>
      </section>

      <section className="landing-section-py" style={{ paddingTop: '1rem' }}>
        <div className="landing-container">
          <div className="legal-content-card">
            
            <div className="legal-section">
              <h3>1. Trial Period</h3>
              <p>We provide a 14-day free trial containing full Professional plan configurations to let you evaluate our seat mapping, WhatsApp notifications, and billing modules. No payment method is required for the initial setup.</p>
            </div>

            <div className="legal-section">
              <h3>2. Subscription Cancellations</h3>
              <p>You can cancel your subscription plan at any time directly through the Workspace Settings dashboard page. Upon cancellation, your workspace will remain fully functional until the end of your current active billing cycle.</p>
            </div>

            <div className="legal-section">
              <h3>3. Refund Eligibility</h3>
              <p>As a software-as-a-service (SaaS) provider, Trishul subscription fees are non-refundable once billed. If you experience technical errors or payment discrepancies, please contact support@trishulsaas.com within 7 days of the billing date to request manual audits.</p>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}
