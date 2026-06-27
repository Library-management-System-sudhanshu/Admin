import { useMemo, useState } from 'react';
import { useGetMetricsQuery } from '../store/api';
import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Users,
  Armchair,
  Banknote,
  AlertCircle,
  CalendarClock,
  Loader2,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  UserPlus,
  Bookmark,
  Clock,
  CreditCard,
  MessageCircle,
  Library,
  Frown,
  Activity,
  ChevronRight,
  AlertTriangle,
  FileText
} from 'lucide-react';

const COLORS = ['#2563EB', '#E2E8F0'];

// Mini Sparkline Component
const Sparkline = ({ data, stroke }: { data: number[]; stroke: string }) => {
  if (!data || data.length === 0) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data
    .map((val, idx) => {
      const x = (idx / (data.length - 1)) * 60;
      const y = 22 - ((val - min) / range) * 16;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg width="60" height="24" style={{ overflow: 'visible' }}>
      <polyline fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  );
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: metrics, isLoading, error } = useGetMetricsQuery({});
  const [hoveredAction, setHoveredAction] = useState<number | null>(null);

  // Dynamic Greeting based on current time
  const greeting = useMemo(() => {
    const hours = new Date().getHours();
    if (hours < 12) return 'Good Morning 👋';
    if (hours < 17) return 'Good Afternoon 👋';
    return 'Good Evening 👋';
  }, []);

  // Today's Date string
  const todayDate = useMemo(() => {
    return new Date().toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, []);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: 'var(--accent-blue)' }}>
        <Loader2 className="spinner" size={48} />
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div style={{ padding: '24px', background: '#ffffff', borderRadius: '16px', border: '1px solid var(--border-card)', textAlign: 'center' }}>
        <Frown size={40} style={{ color: 'var(--status-red)', marginBottom: '12px' }} />
        <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-navy)' }}>Error Loading Dashboard</h3>
        <p style={{ color: 'var(--text-slate)', fontSize: '0.875rem', margin: 0 }}>Failed to fetch system metrics. Please try reloading.</p>
      </div>
    );
  }

  // Premium Metric Cards configurations
  const kpis = [
    {
      title: 'Active Students',
      value: metrics.activeStudents,
      icon: <Users size={20} />,
      gradient: 'linear-gradient(135deg, rgba(37, 99, 235, 0.1), rgba(37, 99, 235, 0.02))',
      iconColor: '#2563EB',
      trend: '+4%',
      trendUp: true,
      sparkData: [50, 55, 52, 58, 62, 60, metrics.activeStudents],
      path: '/students',
      state: { filterExpiration: 'ACTIVE' },
    },
    {
      title: 'Occupied Seats',
      value: metrics.occupiedSeats,
      icon: <Armchair size={20} />,
      gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.02))',
      iconColor: '#10B981',
      trend: '+8%',
      trendUp: true,
      sparkData: [30, 32, 35, 38, 41, 40, metrics.occupiedSeats],
      path: '/seats',
    },
    {
      title: 'Vacant Seats',
      value: metrics.vacantSeats,
      icon: <Armchair size={20} />,
      gradient: 'linear-gradient(135deg, rgba(100, 116, 139, 0.1), rgba(100, 116, 139, 0.02))',
      iconColor: '#64748B',
      trend: '-5%',
      trendUp: false,
      sparkData: [45, 43, 40, 38, 35, 36, metrics.vacantSeats],
      path: '/seats',
    },
    {
      title: 'Outstanding Dues',
      value: `₹${metrics.duePayments}`,
      icon: <AlertCircle size={20} />,
      gradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(245, 158, 11, 0.02))',
      iconColor: '#F59E0B',
      trend: '-12%',
      trendUp: true, // Decreasing dues is good
      sparkData: [5000, 4800, 4200, 4600, 3900, 3200, metrics.duePayments],
      path: '/billing',
    },
    {
      title: 'Monthly Revenue',
      value: `₹${metrics.monthlyRevenue}`,
      icon: <Banknote size={20} />,
      gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.02))',
      iconColor: '#10B981',
      trend: '+15%',
      trendUp: true,
      sparkData: [22000, 24000, 23500, 25000, 27000, 26800, metrics.monthlyRevenue],
      path: '/billing',
    },
    {
      title: 'Expiring Plan (7d)',
      value: metrics.expiringSubscriptions,
      icon: <CalendarClock size={20} />,
      gradient: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.02))',
      iconColor: '#EF4444',
      trend: '+2',
      trendUp: false, // More expirations is warning
      sparkData: [2, 4, 3, 5, 2, 6, metrics.expiringSubscriptions],
      path: '/students',
      state: { filterExpiration: 'EXPIRING_SOON' },
    },
  ];

  // Quick Action Config
  const quickActions = [
    { title: 'Add Student', desc: 'Register a new student profile', icon: <UserPlus size={16} />, color: '#3b82f6', path: '/students' },
    { title: 'Assign Seat', desc: 'Reserve or allocate seat to student', icon: <Bookmark size={16} />, color: '#10b981', path: '/seats' },
    { title: 'Create Shift', desc: 'Configure timings and room rules', icon: <Clock size={16} />, color: '#8b5cf6', path: '/settings' },
    { title: 'Collect Payment', desc: 'Issue invoice or mark payments', icon: <CreditCard size={16} />, color: '#f59e0b', path: '/billing' },
    { title: 'WhatsApp Broadcast', desc: 'Send reminders or custom notices', icon: <MessageCircle size={16} />, color: '#10b981', path: '/whatsapp' },
    { title: 'Library Entry', desc: 'Track check-in/check-out logs', icon: <Library size={16} />, color: '#ec4899', path: '/library' },
  ];

  // Mock Activity Feed (High SaaS Fidelity)
  const activities = [
    { title: 'Student assigned', desc: 'Rohan Sharma allocated to Seat A12 (Branch Main)', time: '10 mins ago', type: 'student' },
    { title: 'Payment received', desc: 'Collected ₹1,200 subscription dues from Aditi Roy', time: '1 hr ago', type: 'payment' },
    { title: 'Seat shift completed', desc: 'Shifted Kabir Singh from Room 1: B15 to Room 1: A02', time: '3 hrs ago', type: 'shift' },
    { title: 'Complaint submitted', desc: 'AC cooling issue reported in Room 2 (A/C Hall)', time: '5 hrs ago', type: 'complaint' },
    { title: 'Renewal completed', desc: 'Plan renewed for Harsh Vardhan (6 Months)', time: 'Yesterday', type: 'renewal' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '3fr 1.25fr', gap: '32px', width: '100%', alignItems: 'start' }} className="animate-fade-in">
      
      {/* LEFT COLUMN: Main dashboard space */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {/* 1. WELCOME SECTION */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '8px' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-navy)', letterSpacing: '-0.025em' }}>
                {greeting}, Rakesh
              </h1>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-slate)', fontWeight: 500 }}>
                {todayDate} • <span style={{ color: 'var(--status-emerald)', fontWeight: 600 }}>Main Branch is running smoothly today.</span>
              </span>
            </div>
          </div>
        </div>

        {/* 2. KPI GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          {kpis.map((kpi, idx) => (
            <div
              key={idx}
              onClick={() => navigate(kpi.path, { state: kpi.state })}
              style={{
                background: '#ffffff',
                border: '1px solid var(--border-card)',
                borderRadius: '18px',
                padding: '20px',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-soft)',
                transition: 'all 200ms ease',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                position: 'relative',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-hover)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--shadow-soft)';
              }}
            >
              {/* Card Header: Icon & Trend */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: kpi.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', color: kpi.iconColor }}>
                  {kpi.icon}
                </div>
                
                {/* Trend indicators */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '12px', background: kpi.trendUp ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: kpi.trendUp ? 'var(--status-emerald)' : 'var(--status-red)' }}>
                  {kpi.trendUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                  <span>{kpi.trend}</span>
                </div>
              </div>

              {/* Number and Label */}
              <div>
                <h3 style={{ margin: '0 0 2px 0', fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-navy)', letterSpacing: '-0.02em' }}>
                  {kpi.value}
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-slate)', fontWeight: 500 }}>
                  {kpi.title}
                </span>
              </div>

              {/* Mini Sparkline graph */}
              <div style={{ position: 'absolute', bottom: '16px', right: '20px' }}>
                <Sparkline data={kpi.sparkData} stroke={kpi.iconColor} />
              </div>
            </div>
          ))}
        </div>

        {/* 3. QUICK ACTIONS */}
        <div style={{ background: '#ffffff', border: '1px solid var(--border-card)', borderRadius: '18px', padding: '24px', boxShadow: 'var(--shadow-soft)' }}>
          <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-navy)', margin: '0 0 16px 0', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            Quick Actions
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            {quickActions.map((act, idx) => (
              <div
                key={idx}
                onClick={() => navigate(act.path)}
                onMouseEnter={() => setHoveredAction(idx)}
                onMouseLeave={() => setHoveredAction(null)}
                style={{
                  padding: '16px',
                  borderRadius: '14px',
                  background: hoveredAction === idx ? '#f8fafc' : '#ffffff',
                  border: '1px solid var(--border-card)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'all 200ms ease',
                }}
              >
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(15, 23, 42, 0.03)', color: act.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {act.icon}
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <h4 style={{ margin: '0 0 2px 0', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-navy)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {act.title}
                    {hoveredAction === idx && <ArrowUpRight size={10} style={{ color: 'var(--text-slate)' }} />}
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-slate)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {act.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4. ANALYTICS CHARTS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
          
          {/* Revenue Performance Trend */}
          <div style={{ background: '#ffffff', border: '1px solid var(--border-card)', borderRadius: '18px', padding: '24px', boxShadow: 'var(--shadow-soft)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-navy)', margin: '0 0 2px 0' }}>
                  Revenue Stream
                </h2>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-slate)' }}>Performance metrics by billing cycle</span>
              </div>
              <div style={{ display: 'flex', gap: '12px', fontSize: '0.72rem', fontWeight: 600 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-navy)' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-blue)' }} /> Direct Bank
                </span>
              </div>
            </div>

            <div style={{ width: '100%', height: '220px' }}>
              <ResponsiveContainer>
                <AreaChart data={metrics.revenueTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: 'var(--text-navy)', border: 'none', borderRadius: '8px', color: '#ffffff', fontSize: '0.75rem', fontWeight: 600 }} />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#2563EB"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Occupancy Rate */}
          <div style={{ background: '#ffffff', border: '1px solid var(--border-card)', borderRadius: '18px', padding: '24px', boxShadow: 'var(--shadow-soft)', display: 'flex', flexDirection: 'column' }}>
            <div>
              <h2 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-navy)', margin: '0 0 2px 0' }}>
                Occupancy Rates
              </h2>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-slate)' }}>Total study space utilisation bounds</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', height: '170px', marginTop: '10px' }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={metrics.occupancyTrend}
                    innerRadius={54}
                    outerRadius={68}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {metrics.occupancyTrend.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', textAlign: 'center' }}>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-navy)', margin: 0, letterSpacing: '-0.02em' }}>
                  {metrics.occupancyRate}%
                </h2>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-slate)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Occupied
                </span>
              </div>
            </div>

            <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid rgba(15,23,42,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.78rem' }}>
                <span style={{ color: 'var(--text-slate)', fontWeight: 500 }}>Seat Utilization</span>
                <span style={{ color: 'var(--text-navy)', fontWeight: 700 }}>{metrics.occupiedSeats} Seats occupied</span>
              </div>
              <div style={{ width: '100%', height: '6px', backgroundColor: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${metrics.occupancyRate}%`, backgroundColor: 'var(--accent-blue)', borderRadius: '3px' }} />
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* RIGHT COLUMN: Summary & Activity TIMELINE Panel */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* 1. TODAY'S SUMMARY */}
        <div style={{ background: '#ffffff', border: '1px solid var(--border-card)', borderRadius: '18px', padding: '20px', boxShadow: 'var(--shadow-soft)' }}>
          <h2 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-navy)', margin: '0 0 16px 0', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            Today's Summary
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', borderBottom: '1px solid rgba(15,23,42,0.03)', paddingBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                <AlertTriangle size={14} style={{ color: 'var(--status-red)' }} />
                <span style={{ fontSize: '0.78rem', color: 'var(--text-slate)', fontWeight: 500 }}>Pending Payments</span>
              </div>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-navy)' }}>₹{metrics.duePayments}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', borderBottom: '1px solid rgba(15,23,42,0.03)', paddingBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                <Clock size={14} style={{ color: 'var(--status-amber)' }} />
                <span style={{ fontSize: '0.78rem', color: 'var(--text-slate)', fontWeight: 500 }}>Expiring Seats (7d)</span>
              </div>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-navy)' }}>{metrics.expiringSubscriptions}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingBottom: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                <Users size={14} style={{ color: 'var(--accent-blue)' }} />
                <span style={{ fontSize: '0.78rem', color: 'var(--text-slate)', fontWeight: 500 }}>Avg Attendance</span>
              </div>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-navy)' }}>92%</span>
            </div>

          </div>
        </div>

        {/* 2. RECENT ACTIVITY TIMELINE */}
        <div style={{ background: '#ffffff', border: '1px solid var(--border-card)', borderRadius: '18px', padding: '20px', boxShadow: 'var(--shadow-soft)' }}>
          <h2 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-navy)', margin: '0 0 16px 0', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            Recent Activity
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', paddingLeft: '12px', borderLeft: '1.5px solid rgba(15, 23, 42, 0.05)' }}>
            {activities.map((act, idx) => (
              <div key={idx} style={{ position: 'relative' }}>
                
                {/* Timeline node dot */}
                <div style={{
                  position: 'absolute',
                  left: '-17px',
                  top: '4px',
                  width: '9px',
                  height: '9px',
                  borderRadius: '50%',
                  backgroundColor: act.type === 'student' ? 'var(--accent-blue)' : act.type === 'payment' ? 'var(--status-emerald)' : act.type === 'shift' ? 'var(--status-purple)' : 'var(--status-amber)',
                  border: '2px solid #ffffff',
                }} />

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-navy)' }}>{act.title}</span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-slate)' }}>{act.time}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-slate)', lineHeight: 1.3 }}>
                    {act.desc}
                  </p>
                </div>

              </div>
            ))}
          </div>
        </div>

        {/* 3. QUICK LINKS REPORTS */}
        <div style={{ background: '#ffffff', border: '1px solid var(--border-card)', borderRadius: '18px', padding: '20px', boxShadow: 'var(--shadow-soft)' }}>
          <h2 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-navy)', margin: '0 0 16px 0', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            System Reports
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { label: 'Export Dues Receipt', date: 'Monthly Billing', icon: <FileText size={14} /> },
              { label: 'Attendance Audit logs', date: 'Daily Check-in', icon: <Activity size={14} /> }
            ].map((report, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  border: '1px solid rgba(15, 23, 42, 0.03)',
                  cursor: 'pointer',
                  transition: 'background 150ms ease',
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#f8fafc'}
                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ color: 'var(--text-slate)' }}>{report.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-navy)' }}>{report.label}</div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-slate)' }}>{report.date}</div>
                </div>
                <ChevronRight size={14} style={{ color: '#cbd5e1' }} />
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
