import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDown, ArrowRight, ArrowUpRight, Armchair, Bell, BookOpen, Building2,
  Check, ChevronDown, FileSpreadsheet, Layers3, LayoutDashboard,
  Menu, MessageCircle, ReceiptText, ScanLine, ShieldCheck, Sparkles,
  TrendingUp, Users, X,
} from 'lucide-react';
import './Home.css';

const features = [
  { icon: Armchair, title: 'A place for every student.', text: 'Build room layouts, allocate seats by shift, and manage seat transfers from a visual workspace.', tag: 'Seats & shifts', tone: 'mint' },
  { icon: Users, title: 'Know your members.', text: 'Manage admissions, student profiles, guardian details, approvals, memberships and renewal dates.', tag: 'Student management', tone: 'lilac' },
  { icon: ReceiptText, title: 'Keep every fee in view.', text: 'Track paid, partial and outstanding fees. Record cash or UPI payments, create receipts and use Razorpay checkout where enabled.', tag: 'Billing & payments', tone: 'peach' },
  { icon: ScanLine, title: 'Make attendance simple.', text: 'Keep check-in and check-out records with manual, QR-code and app check-in workflows.', tag: 'Attendance', tone: 'blue' },
  { icon: BookOpen, title: 'Books, beautifully organised.', text: 'Maintain your catalogue, issue books, track returns and keep borrowing records connected to students.', tag: 'Library management', tone: 'peach' },
  { icon: Building2, title: 'More branches. One workspace.', text: 'Organise branches, floors and rooms, with owner, manager and staff roles for your team.', tag: 'Multi-branch operations', tone: 'mint' },
  { icon: Bell, title: 'Keep everyone in the loop.', text: 'Publish notices and send push notifications or WhatsApp broadcasts and fee reminders where integrations are configured.', tag: 'Notices & messaging', tone: 'lilac' },
  { icon: MessageCircle, title: 'Turn feedback into action.', text: 'Track student complaints from open to resolved, so facility, internet and seat issues have a clear next step.', tag: 'Complaint management', tone: 'blue' },
  { icon: LayoutDashboard, title: 'See the bigger picture.', text: 'Review collections, dues, memberships and occupancy in your dashboard. Manage plans and workspace settings in one place.', tag: 'Reports & administration', tone: 'mint' },
];
const previews = [
  { label: 'Seat planning', icon: Armchair, title: 'See your space. Find their place.', text: 'Know which seats are occupied and which are available. Organise allocations around your rooms and shifts, with fewer registers to juggle.', bullets: ['Visual room layouts', 'Shift-based allocations', 'Seat transfers and availability'] },
  { label: 'Fee tracking', icon: ReceiptText, title: 'A clearer picture of every payment.', text: 'Keep receipts, payment status and outstanding balances together. Spend less time searching through separate payment notes.', bullets: ['Paid, partial and unpaid records', 'Cash, UPI and online payment records', 'Invoices, receipts and renewal dates'] },
  { label: 'Student records', icon: Users, title: 'The details that keep your hall moving.', text: 'Bring student information and memberships into one organised view, from a new admission to their next renewal.', bullets: ['Admissions and profile management', 'Branch and membership information', 'Approval and renewal tracking'] },
];
const faqs = [
  ['Who is Trishul built for?', 'Trishul is built for study hall owners, reading rooms and lending libraries. It brings the daily work of managing students, seats, memberships, payments and books into one workspace.'],
  ['Can I manage more than one branch?', 'Yes. The platform supports workspaces with branches, floors and rooms, along with owner, manager and staff roles. Feature availability and limits depend on your plan.'],
  ['Does it support online payments and reminders?', 'Razorpay checkout is supported where enabled. You can also record cash and UPI payments. WhatsApp messages and push notifications depend on the relevant integrations, configuration and recipient permissions.'],
  ['Are the numbers in the preview real?', 'The seat map, student names and payment amounts on this page are illustrative demo data. They let you explore the experience without accessing any real student or business records.'],
  ['How do I get started or choose a plan?', 'Create an account to set up your workspace, or contact us to discuss your library and the available plans. Check the features, price and billing period shown for your plan before purchasing.'],
  ['When will the future features be available?', 'The roadmap shows ideas we are exploring, not features included in a current subscription. Scope and timing may change. Tell us which would help your library most.'],
];

function Brand() {
  return <span className="th-brand"><svg viewBox="0 0 40 40" fill="none" aria-hidden="true"><rect width="40" height="40" rx="12" fill="currentColor" /><path d="M12 12v8c0 5 3.5 7 8 7s8-2 8-7v-8M20 10v22" stroke="white" strokeWidth="2.7" strokeLinecap="round" /><path d="m9 15 3-3 3 3m10 0 3-3 3 3m-14-2 3-3 3 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg><span>trishul<span className="th-brand-dot">.</span></span></span>;
}

function StudyRoom() {
  const scene = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState(6);
  const occupied = [1, 2, 4, 7, 8, 10, 13, 14, 16, 19, 20, 23];
  function move(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== 'mouse' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    scene.current?.style.setProperty('--tilt-x', `${(event.clientX - bounds.left - bounds.width / 2) / 60}deg`);
    scene.current?.style.setProperty('--tilt-y', `${-(event.clientY - bounds.top - bounds.height / 2) / 75}deg`);
  }
  function reset() {
    scene.current?.style.setProperty('--tilt-x', '0deg');
    scene.current?.style.setProperty('--tilt-y', '0deg');
  }
  return <div className="th-scene" ref={scene} onPointerMove={move} onPointerLeave={reset}>
    <div className="th-scene-grid" aria-hidden="true" />
    <div className="th-scene-top"><span><span className="th-status-dot" /> A little more organised.</span><span>INTERACTIVE PREVIEW</span></div>
    <div className="th-room-stage">
      <div className="th-room">
        <div className="th-room-wall th-wall-back" aria-hidden="true"><span /><span /><span /></div>
        <div className="th-room-wall th-wall-side" aria-hidden="true" />
        <div className="th-room-floor"><span className="th-floor-label">THE READING ROOM</span><div className="th-desks">
          {Array.from({ length: 24 }, (_, i) => i + 1).map(n => <button type="button" key={n} onClick={() => setSelected(n)} aria-pressed={selected === n} aria-label={`Preview seat A${String(n).padStart(2, '0')}, ${occupied.includes(n) ? 'occupied' : 'available'}`} className={`th-desk ${occupied.includes(n) ? 'is-occupied' : ''} ${selected === n ? 'is-selected' : ''}`}><span className="th-desk-top"><span className="th-desk-book" /></span><span className="th-chair" /><span className="th-desk-number">{String(n).padStart(2, '0')}</span></button>)}
        </div><div className="th-plant th-plant-one" aria-hidden="true"><i /><i /><i /></div><div className="th-plant th-plant-two" aria-hidden="true"><i /><i /><i /></div></div>
      </div>
    </div>
    <div className="th-float th-float-member"><span className="th-icon-bubble"><Users size={18} /></span><div><strong>Everything in its place.</strong><small>Students. Seats. A calmer day.</small></div><Check size={16} /></div>
    <div className="th-float th-float-seat" aria-live="polite"><span className="th-icon-bubble"><Armchair size={20} /></span><div><small>SEAT A{String(selected).padStart(2, '0')}</small><strong>{occupied.includes(selected) ? 'Currently occupied' : 'Ready for a new member'}</strong></div><span className={`th-seat-status ${occupied.includes(selected) ? 'occupied' : ''}`} /></div>
    <div className="th-scene-bottom"><span><i /> Available <i /> Occupied</span><span>Tap a desk to explore <ArrowUpRight size={14} /></span></div>
  </div>;
}

function ProductPreview({ active }: { active: number }) {
  return <div className="th-product-window">
    <div className="th-window-top"><Brand /><span>Demo workspace <span className="th-demo-pill">SAMPLE DATA</span></span></div>
    <div className="th-product-body"><aside aria-hidden="true"><LayoutDashboard /><Armchair className={active === 0 ? 'selected' : ''} /><ReceiptText className={active === 1 ? 'selected' : ''} /><Users className={active === 2 ? 'selected' : ''} /><Bell /></aside>
      <div className="th-product-content">
        <div className="th-product-heading"><div><small>YOUR WORKSPACE, AT A GLANCE</small><h3>{['Room overview', 'Fee overview', 'Your students'][active]}</h3></div><span className="th-demo-pill">Main branch</span></div>
        {active === 0 ? <><div className="th-mini-stats"><div><small>Total seats</small><strong>24</strong></div><div><small>Occupied</small><strong>12</strong></div><div><small>Available</small><strong>12</strong></div></div><div className="th-flat-seats">{Array.from({ length: 24 }, (_, i) => <span key={i} className={i % 4 < 2 ? 'taken' : ''}><Armchair size={18} /><small>A{String(i + 1).padStart(2, '0')}</small></span>)}</div><div className="th-preview-note"><span className="th-status-dot" /> Morning shift <span>Room 01 · Sample layout</span></div></> : active === 1 ? <><div className="th-mini-stats"><div><small>Collected</small><strong>₹18,000</strong></div><div><small>Outstanding</small><strong>₹4,500</strong></div></div><div className="th-demo-table"><div><span>Student</span><span>Amount</span><span>Status</span></div>{[['Aarav S.', '₹1,500', 'Paid'], ['Priya M.', '₹1,500', 'Paid'], ['Rohan K.', '₹750', 'Partial'], ['Ananya R.', '₹1,500', 'Unpaid']].map(row => <div key={row[0]}><strong>{row[0]}</strong><span>{row[1]}</span><span className={`th-payment-status ${row[2].toLowerCase()}`}>{row[2]}</span></div>)}</div></> : <><div className="th-mini-stats"><div><small>Members</small><strong>24</strong></div><div><small>Renewing soon</small><strong>03</strong></div></div><div className="th-student-list">{[['AS', 'Aarav Sharma', 'Morning shift', 'mint'], ['PM', 'Priya Mishra', 'Full day', 'lilac'], ['RK', 'Rohan Kumar', 'Evening shift', 'peach']].map(row => <div key={row[0]}><span className={`th-avatar ${row[3]}`}>{row[0]}</span><span><strong>{row[1]}</strong><small>{row[2]}</small></span><span className="th-demo-pill">Active</span></div>)}</div></>}
      </div>
    </div>
  </div>;
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activePreview, setActivePreview] = useState(0);
  const home = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'Trishul — A better day for your library';
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
    }), { threshold: 0.08 });
    home.current?.querySelectorAll('.th-reveal').forEach(element => observer.observe(element));
    return () => { observer.disconnect(); document.title = previousTitle; };
  }, []);
  useEffect(() => {
    if (!menuOpen) return;
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') { setMenuOpen(false); document.getElementById('th-menu-button')?.focus(); } };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [menuOpen]);
  const preview = previews[activePreview];
  return <div className="trishul-home" ref={home}>
    <a className="th-skip" href="#main-content">Skip to content</a>
    <header className="th-header"><div className="th-container th-nav">
      <Link to="/" aria-label="Trishul home"><Brand /></Link>
      <nav className={`th-nav-links ${menuOpen ? 'is-open' : ''}`} id="th-navigation" aria-label="Main navigation">
        {[['Features', '#features'], ['How it works', '#how-it-works'], ['What’s next', '#roadmap'], ['FAQs', '#faqs']].map(([label, url]) => <a key={url} href={url} onClick={() => setMenuOpen(false)}>{label}</a>)}
        <Link className="th-mobile-login" to="/login">Log in <ArrowUpRight size={16} /></Link>
      </nav>
      <div className="th-nav-actions"><Link className="th-login" to="/login">Log in</Link><Link className="th-button th-button-dark th-button-small" to="/login">Get started <ArrowUpRight size={15} /></Link><button className="th-menu-toggle" id="th-menu-button" type="button" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={menuOpen} aria-controls="th-navigation" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button></div>
    </div></header>
    <main id="main-content">
      <section className="th-hero th-container">
        <div className="th-hero-copy"><div className="th-eyebrow"><span className="th-status-dot" /> LESS ADMIN. MORE POSSIBILITY.</div><h1>A better day<br />for your <span>library.</span></h1><p>From the first check-in to the last seat filled. Bring students, seats, fees and everyday operations together with Trishul.</p><div className="th-hero-actions"><Link className="th-button th-button-dark" to="/login">Organise your workspace <ArrowUpRight size={18} /></Link><a className="th-text-link" href="#explore">Take a closer look <ArrowDown size={17} /></a></div><div className="th-hero-footnote"><span><Check size={14} /> Built for study halls</span><span><Check size={14} /> Made for libraries</span></div></div>
        <StudyRoom />
        <div className="th-hero-caption"><span>YOUR SPACE. BEAUTIFULLY CONNECTED.</span><span>A little less paperwork. A lot more clarity.</span><span>01 — EXPLORE TRISHUL</span></div>
      </section>
      <div className="th-capability-strip"><div className="th-container"><span>One workspace.<br /><strong>Every part of your day.</strong></span>{[[Armchair, 'Seats & shifts'], [Users, 'Students'], [ReceiptText, 'Payments'], [BookOpen, 'Books'], [Building2, 'Branches']].map(([Icon, label]) => { const ItemIcon = Icon as typeof Armchair; return <span key={String(label)}><ItemIcon size={21} />{String(label)}</span>; })}</div></div>
      <section className="th-section th-container" id="explore">
        <div className="th-section-heading th-reveal"><div><span className="th-eyebrow">A CLEARER WAY TO WORK</span><h2>Your whole day.<br />One shared picture.</h2></div><p>Less switching between notebooks and spreadsheets. More time for the people who come to your space to learn.</p></div>
        <div className="th-explore th-reveal"><div className="th-explore-copy"><div className="th-preview-tabs" aria-label="Explore product features">{previews.map((item, i) => <button type="button" key={item.label} aria-pressed={activePreview === i} aria-controls="th-preview-panel" onClick={() => setActivePreview(i)}><item.icon size={16} />{item.label}</button>)}</div><div id="th-preview-panel" aria-live="polite"><span className="th-step-number">0{activePreview + 1} / THE EVERYDAY, SIMPLIFIED</span><h3>{preview.title}</h3><p>{preview.text}</p><ul>{preview.bullets.map(text => <li key={text}><Check size={16} />{text}</li>)}</ul></div><Link to="/login" className="th-text-link">Explore your workspace <ArrowRight size={17} /></Link></div><ProductPreview active={activePreview} /></div>
      </section>
      <section className="th-features-section" id="features"><div className="th-container th-section"><div className="th-section-heading th-reveal"><div><span className="th-eyebrow">SMALL DETAILS. BIG DIFFERENCE.</span><h2>Built around the way<br />your library works.</h2></div><p>The essentials for running your space, thoughtfully brought together. Available features depend on your plan and configuration.</p></div><div className="th-feature-grid">{features.map((feature, i) => <article key={feature.tag} className="th-feature th-reveal" style={{ '--delay': `${i % 3 * 60}ms` } as CSSProperties}><div className={`th-feature-icon ${feature.tone}`}><feature.icon size={23} strokeWidth={1.7} /></div><span className="th-feature-tag">{feature.tag}</span><h3>{feature.title}</h3><p>{feature.text}</p><span className="th-feature-number">0{i + 1}</span></article>)}</div><div className="th-safety-note"><ShieldCheck size={22} /><p><strong>A more connected team.</strong> Role-based access helps organise responsibilities. In-app safety alerts provide an additional communication channel alongside your on-site emergency procedures.</p></div></div></section>
      <section className="th-section th-container" id="how-it-works"><div className="th-section-heading th-reveal"><div><span className="th-eyebrow">FROM SETUP TO EVERYDAY</span><h2>Make room for<br />a simpler routine.</h2></div><a href="mailto:mauryasudhanshu930@gmail.com?subject=Help%20getting%20started%20with%20Trishul" className="th-text-link">Let’s talk about your library <ArrowUpRight size={17} /></a></div><div className="th-steps">{[{ icon: Building2, title: 'Make it your space', text: 'Create your workspace. Add branches, rooms, shifts and membership plans.' }, { icon: Users, title: 'Bring your people in', text: 'Add your students, assign seats and give your team the right access.' }, { icon: Layers3, title: 'Find your daily rhythm', text: 'Manage attendance, record fees, share notices and keep an eye on what needs attention.' }].map((step, i) => <article className="th-step th-reveal" key={step.title}><div><span>0{i + 1}</span><step.icon size={24} /></div><h3>{step.title}</h3><p>{step.text}</p></article>)}</div></section>
      <section className="th-roadmap-section" id="roadmap"><div className="th-container th-section"><div className="th-section-heading th-reveal"><div><span className="th-eyebrow"><Sparkles size={14} /> ROOM TO GROW</span><h2>A thoughtful look<br />at what comes next.</h2></div><p>We’re exploring ways to make your day even easier. These are proposed additions, not currently available features or release commitments.</p></div><div className="th-roadmap-grid">{[{ icon: FileSpreadsheet, title: 'An easier move from Excel', text: 'Guided spreadsheet imports to help bring existing student records into your workspace.' }, { icon: TrendingUp, title: 'Insights that look ahead', text: 'Occupancy trends and renewal insights to help you plan the next chapter of your business.' }, { icon: ScanLine, title: 'More ways to check in', text: 'Explore compatible RFID and biometric attendance integrations for your space.' }].map((item, i) => <article className="th-roadmap-card th-reveal" key={item.title}><div><item.icon size={25} strokeWidth={1.5} /><span>EXPLORING</span></div><span className="th-roadmap-index">0{i + 1}</span><h3>{item.title}</h3><p>{item.text}</p></article>)}</div><a className="th-text-link" href="mailto:mauryasudhanshu930@gmail.com?subject=My%20feature%20idea%20for%20Trishul">What would help your library? Tell us <ArrowUpRight size={17} /></a></div></section>
      <section className="th-section th-container th-faq-section" id="faqs"><div className="th-reveal"><span className="th-eyebrow">GOOD QUESTIONS.</span><h2>A little more<br />clarity.</h2><p>Have something else in mind?</p><a className="th-text-link" href="mailto:mauryasudhanshu930@gmail.com">Talk to us <ArrowUpRight size={16} /></a></div><div className="th-faq-list">{faqs.map(([question, answer]) => <details key={question} className="th-reveal"><summary>{question}<ChevronDown size={18} /></summary><p>{answer}</p></details>)}</div></section>
      <section className="th-container th-cta-wrap"><div className="th-cta th-reveal"><div className="th-cta-orbit" aria-hidden="true"><span /><span /><span /><BookOpen size={55} strokeWidth={1} /></div><div><span className="th-eyebrow">YOUR NEXT CHAPTER STARTS HERE.</span><h2>A well-run space.<br />A better place to learn.</h2><p>Bring a little more clarity to your everyday with Trishul.</p><div className="th-hero-actions"><Link className="th-button th-button-dark" to="/login">Get started <ArrowUpRight size={18} /></Link><a className="th-text-link" href="tel:+918840839079">Let’s have a conversation <ArrowRight size={17} /></a></div></div></div></section>
    </main>
    <footer className="th-footer th-container"><div className="th-footer-top"><div><Link to="/" aria-label="Trishul home"><Brand /></Link><p>Thoughtful tools for<br />spaces that inspire learning.</p></div><div><h3>Explore</h3><a href="#features">Features</a><a href="#how-it-works">How it works</a><a href="#roadmap">What’s next</a></div><div><h3>The details</h3><Link to="/privacy">Privacy Policy</Link><Link to="/terms">Terms & Conditions</Link><Link to="/login">Log in to Trishul</Link></div><div><h3>Let’s connect</h3><a href="mailto:mauryasudhanshu930@gmail.com">mauryasudhanshu930@gmail.com</a><a href="tel:+918840839079">+91 88408 39079</a><span>Varanasi, Uttar Pradesh, India</span></div></div><div className="th-footer-bottom"><span>© {new Date().getFullYear()} Trishul. All rights reserved.</span><span>Made for the spaces where futures take shape. <ArrowUpRight size={14} /></span></div></footer>
  </div>;
}
