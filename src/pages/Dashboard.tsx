import { useGetMetricsQuery } from '../store/api';
import { Card } from '../components/ui/Card';
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
  Loader2
} from 'lucide-react';

const COLORS = ['#10B981', '#E2E8F0'];

export default function Dashboard() {
  const { data: metrics, isLoading, error } = useGetMetricsQuery({});

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '5rem', color: 'var(--primary)' }}>
        <Loader2 className="spinner" size={60} />
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div style={{ padding: '1.5rem' }}>
        <p className="text-danger">Error loading dashboard metrics</p>
      </div>
    );
  }

  const kpis = [
    { title: 'Active Students', value: metrics.activeStudents, icon: <Users size={24} color="#2563eb" />, bgColor: '#eff6ff' },
    { title: 'Occupied Seats', value: metrics.occupiedSeats, icon: <Armchair size={24} color="#10b981" />, bgColor: '#d1fae5' },
    { title: 'Vacant Seats', value: metrics.vacantSeats, icon: <Armchair size={24} color="#94a3b8" />, bgColor: '#f1f5f9' },
    { title: 'Outstanding Dues', value: `₹${metrics.duePayments}`, icon: <AlertCircle size={24} color="#f59e0b" />, bgColor: '#fef3c7' },
    { title: 'Monthly Revenue', value: `₹${metrics.monthlyRevenue}`, icon: <Banknote size={24} color="#10b981" />, bgColor: '#dcfce7' },
    { title: 'Expiring Seats (7 Days)', value: metrics.expiringSubscriptions, icon: <CalendarClock size={24} color="#ef4444" />, bgColor: '#fee2e2' },
  ];

  return (
    <div style={{ width: '100%' }}>
      <h1 style={{ marginBottom: '2rem', fontSize: '1.75rem', fontWeight: 700 }}>
        Workspace Dashboard
      </h1>

      {/* KPI Section */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '1.5rem', 
        marginBottom: '2rem' 
      }}>
        {kpis.map((kpi, idx) => (
          <Card key={idx} elevation="sm" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{
                padding: '1rem',
                borderRadius: '0.75rem',
                backgroundColor: kpi.bgColor,
                display: 'flex',
                marginRight: '1.25rem',
              }}>
                {kpi.icon}
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500, marginBottom: '0.25rem' }}>
                  {kpi.title}
                </p>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
                  {kpi.value}
                </h2>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
        gap: '2rem' 
      }}>
        {/* Revenue Trend Area Chart */}
        <Card elevation="sm" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.5rem' }}>
            Revenue Performance Trend
          </h2>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer>
              <AreaChart data={metrics.revenueTrend}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#94A3B8" />
                <YAxis stroke="#94A3B8" />
                <Tooltip />
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
        </Card>

        {/* Occupancy Rate Pie Chart */}
        <Card elevation="sm" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.25rem' }}>
            Occupancy Rates
          </h2>
          <p className="text-muted" style={{ marginBottom: '1.5rem' }}>
            Total seat utilisation details
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', height: '200px' }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={metrics.occupancyTrend}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {metrics.occupancyTrend.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position: 'absolute', textAlign: 'center' }}>
              <h2 style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>
                {metrics.occupancyRate}%
              </h2>
              <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                Occupied
              </span>
            </div>
          </div>

          <div style={{ marginTop: 'auto', paddingTop: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.875rem' }}>Seat Occupancy Bar</span>
              <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{metrics.occupiedSeats} Seats</span>
            </div>
            <div style={{ 
              width: '100%', 
              height: '8px', 
              backgroundColor: 'var(--bg-surface-hover)', 
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{ 
                height: '100%', 
                width: `${metrics.occupancyRate}%`, 
                backgroundColor: 'var(--success)',
                borderRadius: '4px'
              }} />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

