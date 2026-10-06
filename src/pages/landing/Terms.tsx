import { Link } from 'react-router-dom';
import './Landing.css';

const sections = [
  {
    "title": "About Trishul and these terms",
    "paragraphs": [
      "Trishul provides software for study halls and libraries to manage workspaces, branches, students, seats, shifts, attendance, memberships, fees, book lending, complaints and communications. In these terms, “Trishul”, “we”, “us” and “our” refer to the business providing the platform, based in Varanasi, Uttar Pradesh, India. “You” means the person using the service and, where applicable, the business they are authorised to represent.",
      "By creating an account, purchasing a platform subscription or using the service, you agree to these Terms & Conditions. If you do not agree, do not create an account or continue using the service. A separately signed agreement may set additional terms for your business; it takes priority to the extent of an express conflict."
    ]
  },
  {
    "title": "Eligibility, accounts and access",
    "paragraphs": [
      "You must be at least 18 years old and have authority to enter into an agreement to create or administer a business workspace. Student access for anyone under 18 must be arranged with the involvement of a parent or lawful guardian and the relevant library, as required by applicable law.",
      "Provide accurate account and business details and keep them current. Protect your credentials, assign appropriate roles to staff, remove access when it is no longer needed and notify us promptly of suspected unauthorised use. You are responsible for activity you authorise and for reasonable care of your account; this does not remove our responsibility for our own acts or omissions."
    ]
  },
  {
    "title": "Platform services and library responsibilities",
    "paragraphs": [
      "Available features depend on your subscription and configured integrations. Trishul provides management software; the individual study hall or library provides the physical premises, seats, facilities and membership services. Each operator sets and administers its admissions, opening hours, seat allocations, shifts, fee plans, lending rules and on-site policies.",
      "Library operators are responsible for their premises, staff, safety arrangements, lawful operation and the accuracy of information entered into the platform. Students should raise issues about facilities, admissions, seat availability, membership charges or book returns with their library. Contact Trishul for platform account, technical or platform-subscription issues."
    ]
  },
  {
    "title": "Student records and permitted data use",
    "paragraphs": [
      "Only collect, upload or use personal information that you are entitled to process for a stated, lawful purpose. Workspace operators must provide appropriate privacy notices, obtain permissions where required, keep records accurate and limit staff access. This includes guardian information, photographs and any optional identity information.",
      "The presence of an Aadhaar field does not authorise unnecessary or unlawful collection. Operators must establish a lawful need and follow applicable requirements before collecting identity information. Do not upload another person’s records without authority or use student information for unrelated marketing, profiling, harassment or sale.",
      "Our Privacy Policy explains how platform information is handled. Accepting these terms does not replace any separate notice or consent required for processing personal information."
    ]
  },
  {
    "title": "Subscriptions, trials and fees",
    "paragraphs": [
      "Platform subscription prices, features, limits, billing period and any trial conditions are those presented in the applicable offer or checkout. Check these details before paying. Any taxes or additional charges must be disclosed as applicable. A trial ends on its stated expiry date and continued paid access requires the relevant subscription.",
      "Student membership fees collected by a library are separate from the library’s subscription to Trishul. A payment recorded in the dashboard should be checked against actual funds received. Reports and invoices depend on the information entered and do not replace your accounting or tax responsibilities.",
      "If a platform subscription expires or remains unpaid, access to paid features may be restricted. Contact us if you believe a restriction is incorrect. A future price or material plan change will be communicated before it applies to a new purchase or renewal; it does not retrospectively change an already paid period."
    ]
  },
  {
    "title": "Payments, cancellation and refunds",
    "paragraphs": [
      "Where enabled, online payments are processed through Razorpay and are subject to its applicable payment terms. Payment status may depend on confirmation from the provider. Do not treat an unverified or pending transaction as a completed payment.",
      "Contact us using the details below to request cancellation of a platform subscription, report a duplicate or failed charge, or request a refund review. Include your registered email, workspace name, payment date, amount and transaction reference. Do not share payment passwords, PINs or OTPs.",
      "Refund and cancellation eligibility depends on the terms disclosed for your purchase and applicable law. Cancellation does not by itself establish a right to a refund for a completed period. Nothing in these terms excludes a refund or other remedy that the law requires. Refunds of fees charged by an independent library must be requested from that library under its membership terms and applicable law."
    ]
  },
  {
    "title": "Acceptable use",
    "paragraphs": [
      "Do not use Trishul for unlawful activity, impersonation, fraudulent admissions or payments, false attendance entries, abusive communications or infringement of another person’s rights. Do not upload malicious content, attempt to bypass permissions, access another workspace without authorisation, interfere with service operation or extract information you are not entitled to access.",
      "You must not share access to evade subscription limits, resell platform access without permission, or copy or reverse engineer the software except where applicable law expressly permits it. Report suspected vulnerabilities privately through our contact details and avoid accessing or disclosing other users’ data."
    ]
  },
  {
    "title": "Messages, reminders and safety alerts",
    "paragraphs": [
      "Workspace operators are responsible for the content, accuracy, recipients and lawful basis of their notices, fee reminders and broadcasts. Obtain any required recipient permission and honour applicable opt-out requests. Do not send spam, misleading demands or unlawful content.",
      "Push notifications and WhatsApp messages depend on device permissions, internet connectivity and external services. Delivery may be delayed or fail. In-app safety alerts are supplementary communication tools and must not be relied on as the only emergency warning system or as a substitute for emergency services and on-site safety procedures."
    ]
  },
  {
    "title": "Your content and our intellectual property",
    "paragraphs": [
      "You retain your rights in records, logos and other content that you lawfully upload. You authorise us to host, process, display and transmit that content as needed to provide the service, support your account and meet applicable legal obligations. This permission does not transfer ownership of your content to us.",
      "The platform software, design, branding and other materials supplied by Trishul are owned by us or our licensors. Subject to these terms and your subscription, you receive a limited, non-exclusive right to use the service for its intended purpose. No other ownership or licence is granted."
    ]
  },
  {
    "title": "Third-party services",
    "paragraphs": [
      "Some features depend on services such as Google sign-in, Firebase notifications, Razorpay checkout or configured WhatsApp messaging. Their availability and applicable terms may affect those features. You are responsible for complying with third-party terms that apply to your use. We remain responsible for our own obligations and do not guarantee the independent operation of third-party services."
    ]
  },
  {
    "title": "Availability, changes and records",
    "paragraphs": [
      "We may maintain, update or change the platform, and interruptions may occur because of maintenance, technical failures or events outside reasonable control. We do not guarantee that every feature will always be available or error-free. We will seek to give reasonable notice of planned changes that materially affect your paid service.",
      "Keep copies of important business records and check reports, dues, invoices and allocations before relying on them. Contact support about available record-access options before closing a workspace. Do not assume that the platform provides a permanent archive or a guaranteed recovery service."
    ]
  },
  {
    "title": "Suspension and termination",
    "paragraphs": [
      "You may request account or workspace closure by contacting us. We may restrict or suspend access where reasonably necessary to address non-payment, a material breach of these terms, unlawful use, a security threat or a legal requirement. Where practicable, we will explain the reason and give an opportunity to resolve the issue; urgent protective action may require immediate restriction.",
      "Closure does not cancel valid outstanding payment obligations. Data handling after closure follows our Privacy Policy and applicable law; closure does not necessarily mean immediate permanent deletion of every record. You may contact us to request access to, correction of or deletion of relevant information."
    ]
  },
  {
    "title": "Service limitations and liability",
    "paragraphs": [
      "To the extent permitted by law, the service is provided on an “as available” basis without a guarantee of uninterrupted operation, a particular business outcome, increased revenue or error-free records. We are not responsible for an independent library’s physical services or for inaccuracies caused by information supplied by its users.",
      "To the extent permitted by law, neither party is liable to the other for indirect or consequential loss arising from use of the service. This does not exclude liability for fraud, wilful misconduct or any liability that cannot lawfully be excluded. Nothing here limits mandatory consumer rights, data-protection rights or remedies for which exclusion is prohibited by law."
    ]
  },
  {
    "title": "Indian law and resolving concerns",
    "paragraphs": [
      "These terms are governed by the laws of India. Please first contact us with the details of a concern so that we can try to resolve it. This does not prevent you from seeking urgent relief or exercising a statutory right.",
      "Subject to mandatory law and the jurisdiction of competent consumer forums or other authorities, disputes may be brought before courts having jurisdiction in Varanasi, Uttar Pradesh, India. These terms do not remove a right to use another competent forum where the law provides it."
    ]
  },
  {
    "title": "Changes and general provisions",
    "paragraphs": [
      "We may update these terms as the service or applicable requirements change. The revised version and updated date will be published on this page. Material changes affecting an ongoing service will be communicated as appropriate, and agreement will be sought where required. Changes do not retrospectively remove rights relating to an earlier purchase.",
      "If a provision is unenforceable, the remaining provisions continue to apply to the extent permitted by law. A delay in enforcing a provision does not waive it. Contact us if you need clarification before using or purchasing the service."
    ]
  }
];

export default function Terms() {
  return (
    <main className="landing-scope">
      <section className="subpage-hero">
        <div className="landing-container">
          <span className="lp-section-tag">Trishul · Legal</span>
          <h1 className="subpage-hero-title">Terms &amp; Conditions</h1>
          <p className="subpage-hero-desc">The terms for using Trishul as a library operator, staff member or student.</p>
          <p className="subpage-hero-desc">Last updated: <time dateTime="2026-10-05">5 October 2026</time></p>
        </div>
      </section>

      <section className="landing-section-py" style={{ paddingTop: '1rem' }} aria-label="Terms &amp; Conditions">
        <div className="landing-container">
          <article className="legal-content-card">
            <nav aria-label="Legal page navigation" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
              <Link to="/login">Back to login</Link>
              <Link to="/privacy">Privacy Policy</Link>
              <a href="#legal-contact">Contact us</a>
            </nav>

            {sections.map((section, index) => (
              <section className="legal-section" key={section.title} aria-labelledby={`terms-section-${index + 1}`}>
                <h2 id={`terms-section-${index + 1}`} style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                  {index + 1}. {section.title}
                </h2>
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph} style={{ marginBottom: '0.75rem' }}>{paragraph}</p>
                ))}
              </section>
            ))}

            <section className="legal-section" id="legal-contact" aria-labelledby="legal-contact-title" style={{ scrollMarginTop: '6rem' }}>
              <h2 id="legal-contact-title" style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                {sections.length + 1}. Contact and grievance support
              </h2>
              <p>For account, subscription, payment or terms-related concerns, contact Trishul using the details below. Please include your registered contact details and workspace name so we can identify the relevant account.</p>
              <address style={{ fontStyle: 'normal', lineHeight: 1.8, marginTop: '1rem', overflowWrap: 'anywhere' }}>
                <strong>Trishul</strong><br />
                Email: <a href="mailto:mauryasudhanshu930@gmail.com">mauryasudhanshu930@gmail.com</a><br />
                Phone: <a href="tel:+918840839079">+91 88408 39079</a><br />
                Address: Varanasi, Uttar Pradesh, India
              </address>
            </section>
          </article>
        </div>
      </section>
    </main>
  );
}
