import { Link } from 'react-router-dom';
import './Landing.css';

const sections = [
  {
    "title": "Who we are and when this policy applies",
    "paragraphs": [
      "Trishul is a study hall and library management platform. In this policy, “Trishul”, “we”, “us” and “our” refer to the business providing the platform, based in Varanasi, Uttar Pradesh, India. This policy explains how information is handled through our website, administration dashboard and connected app features.",
      "It applies to workspace owners, managers, staff, students, guardians and people who contact us. A study hall or library using Trishul is a separate business. It decides why student records are collected and how its admissions, attendance, fees and library services are managed. We process those workspace records to provide the platform on its behalf; we manage our own account, subscription and support information for operating our business."
    ]
  },
  {
    "title": "Account and business information",
    "paragraphs": [
      "When an account or workspace is created, we collect the details supplied, including name, email address, mobile number, password credentials, user role and workspace or branch association. A workspace may also provide its name, address, pincode, logo and GST details. We use these details to create accounts, authenticate users, assign access, set up branches, administer subscriptions and communicate about the service.",
      "Where Google sign-in is used, the sign-in flow supplies an account identifier and profile information such as name, email address and profile image. Password-based accounts store a password hash rather than the original password."
    ]
  },
  {
    "title": "Student, attendance and library records",
    "paragraphs": [
      "A student or an authorised workspace user may provide a student’s name, contact information, photograph, gender, address, joining date, admission status, guardian name and guardian mobile number. The platform also supports an optional Aadhaar-number field. These details support student registration, identification, guardian contact and admission administration. Aadhaar is not required to create a Trishul business account; an optional field does not give a library permission to collect it without a lawful purpose and appropriate notice.",
      "As the service is used, records may include branch, room, seat and shift allocations, membership plans, renewal dates, dues, QR identifiers, attendance dates, check-in and check-out times, and attendance method. Library records may include books issued, issue dates, return dates and related charges. We use these records to operate the relevant workspace features and produce attendance, occupancy, membership and financial reports."
    ]
  },
  {
    "title": "Payments and billing information",
    "paragraphs": [
      "We process subscription and fee records, amounts, due dates, payment status, payment method, transaction or order references, and invoice or receipt details. These records support billing, payment reconciliation, renewals and resolving payment disputes. Cash and UPI payments recorded by a library are included in its billing records.",
      "Where online checkout is enabled, Razorpay processes the payment and returns payment references and status information used to update the service. Payment credentials entered in its checkout are handled by the payment provider under its own terms and privacy policy. Do not send card security codes, UPI PINs, banking passwords or payment OTPs to Trishul support."
    ]
  },
  {
    "title": "Messages, complaints and notifications",
    "paragraphs": [
      "We process support enquiries, complaint categories and descriptions, resolution status, notices, broadcast content, recipient phone numbers, message timestamps and delivery status. These support complaint handling, announcements, fee and renewal reminders, and service communication.",
      "Connected apps may register a push-notification token, device type and device name. These are used to deliver notices and alerts through Firebase Cloud Messaging. When WhatsApp messaging is enabled, recipient numbers and message content pass through the configured messaging service and WhatsApp. A workspace is responsible for having permission to contact its recipients and for the content it sends."
    ]
  },
  {
    "title": "Browser storage and technical information",
    "paragraphs": [
      "The dashboard uses browser local storage to retain sign-in tokens and account details so that your session can continue between visits. Signing out removes those stored sign-in details. You can also clear browser storage, which may sign you out or reset preferences. This storage is separate from cookies.",
      "Our service infrastructure may process technical connection and diagnostic information, such as IP addresses, request times, device or browser information and error records, to deliver the service, investigate failures and prevent misuse. This policy does not grant permission for unrelated advertising or tracking."
    ]
  },
  {
    "title": "Why we process information",
    "paragraphs": [
      "We use information for the specific services described above, to respond to requests, maintain accounts, investigate suspicious activity, resolve disputes and meet applicable legal obligations. Where consent is required, the party collecting the information must obtain it for the relevant purpose. Optional information should only be supplied when needed for the feature or service being used.",
      "Providing information for an account or membership does not automatically authorise unrelated promotional messages. If essential information is not provided, or permission needed for a feature is withdrawn, that feature may no longer be available. We explain any relevant effect when handling your request."
    ]
  },
  {
    "title": "Who can receive information",
    "paragraphs": [
      "Workspace owners and authorised managers or staff can access records needed for their assigned work. Platform administrators may access information for administration, support, maintenance or investigating misuse. Be aware that information you submit to your library, including complaints and payment records, may be visible to its authorised team.",
      "Information needed to operate a feature may be processed by hosting and infrastructure providers, Google sign-in services, Firebase, Razorpay and configured messaging providers. Their own services may also be subject to their privacy policies. We do not sell or rent student records or personal information for third-party marketing.",
      "We may disclose relevant information when legally required, in response to a valid request from a competent authority, or as necessary to investigate fraud, protect rights or address security incidents. If the platform business is transferred, relevant records may be transferred subject to applicable law and notice where required."
    ]
  },
  {
    "title": "Storage, retention and deletion",
    "paragraphs": [
      "Information is retained while needed to operate the account or workspace, provide the requested services, reconcile transactions, resolve disputes or satisfy applicable legal requirements. Retention depends on the type of record and the purpose for which it is held. Workspace closure or the removal of a student from the dashboard does not necessarily erase all associated records immediately.",
      "Some records are marked as deleted before permanent removal. Related billing, attendance or transaction records may remain where there is a continuing lawful need. Contact us to request deletion or ask about a particular record. We will assess the request, coordinate with the relevant workspace where necessary, and explain any information that must be retained and why.",
      "Hosting and third-party services may process information in India or other countries depending on the service and its configuration. We do not promise that all information stays in India. Transfers remain subject to applicable legal restrictions."
    ]
  },
  {
    "title": "Security",
    "paragraphs": [
      "The platform uses controls including password hashing, authenticated access and workspace or role-based access rules. These measures do not eliminate every risk: no online service can guarantee absolute security or uninterrupted availability. Keep credentials confidential, limit staff access to what is needed and sign out on shared devices.",
      "If you suspect unauthorised access or an information-security incident, contact us promptly using the details below. We will investigate and provide any notifications required by applicable law. Do not include passwords, complete Aadhaar numbers or payment secrets in a support message."
    ]
  },
  {
    "title": "Your choices and privacy requests",
    "paragraphs": [
      "You may contact us to request access to information about you, correction of inaccurate details, deletion of information, withdrawal of consent, or help with a privacy complaint. We handle requests in accordance with applicable law and any rights in force at the time. For records maintained by your library, contact its administrator as well; we can help identify the appropriate route.",
      "You can control app notifications through your device settings and ask your workspace to stop optional messages. Turning off notifications may prevent reminders or alerts from reaching you. Account closure and deletion requests can be submitted by email even if an in-app option is unavailable.",
      "Include your name, registered email or mobile number, workspace or library name, and a description of your request. We may ask for proportionate verification to prevent unauthorised disclosure. If we cannot fulfil all or part of a request, we will explain the reason and any available next steps. This policy does not restrict your right to approach a competent authority or use remedies available under applicable law."
    ]
  },
  {
    "title": "Children and guardian information",
    "paragraphs": [
      "Business account holders must be at least 18 years old and authorised to manage their workspace. A library enrolling a student under 18 must ensure appropriate parent or lawful guardian involvement and obtain any consent required by applicable law before entering the child’s information. Merely entering a guardian’s name or number is not verification of consent.",
      "Only information necessary for the student’s membership and services should be entered. If you believe a child’s information has been submitted without appropriate authority, contact the library and us so that the record can be reviewed and appropriate action taken."
    ]
  },
  {
    "title": "Updates to this policy",
    "paragraphs": [
      "We may revise this policy when features, data practices or legal requirements change. The latest version will be available on this page with its updated date. Where a change requires notice or fresh consent, we will provide that notice or seek consent as applicable; publication alone does not replace a required consent process."
    ]
  }
];

export default function Privacy() {
  return (
    <main className="landing-scope">
      <section className="subpage-hero">
        <div className="landing-container">
          <span className="lp-section-tag">Trishul · Legal</span>
          <h1 className="subpage-hero-title">Privacy Policy</h1>
          <p className="subpage-hero-desc">How we handle information across our study hall and library management services.</p>
          <p className="subpage-hero-desc">Last updated: <time dateTime="2026-10-05">5 October 2026</time></p>
        </div>
      </section>

      <section className="landing-section-py" style={{ paddingTop: '1rem' }} aria-label="Privacy Policy">
        <div className="landing-container">
          <article className="legal-content-card">
            <nav aria-label="Legal page navigation" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
              <Link to="/login">Back to login</Link>
              <Link to="/terms">Terms & Conditions</Link>
              <a href="#legal-contact">Contact us</a>
            </nav>

            {sections.map((section, index) => (
              <section className="legal-section" key={section.title} aria-labelledby={`privacy-section-${index + 1}`}>
                <h2 id={`privacy-section-${index + 1}`} style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.75rem' }}>
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
              <p>For privacy questions, information requests or grievances, contact Trishul using the details below. Please include your registered contact details and workspace name so we can identify the relevant account.</p>
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
