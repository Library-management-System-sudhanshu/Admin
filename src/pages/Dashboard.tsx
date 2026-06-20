import { useGetMetricsQuery } from '../store/api';
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  LinearProgress,
} from '@mui/material';
import {
  People as PeopleIcon,
  EventSeat as SeatIcon,
  MonetizationOn as RevenueIcon,
  PriorityHigh as DueIcon,
  DateRange as ExpiryIcon,
} from '@mui/icons-material';
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

const COLORS = ['#10B981', '#E2E8F0'];

export default function Dashboard() {
  const { data: metrics, isLoading, error } = useGetMetricsQuery({});

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error || !metrics) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">Error loading dashboard metrics</Typography>
      </Box>
    );
  }

  const kpis = [
    { title: 'Active Students', value: metrics.activeStudents, icon: <PeopleIcon color="primary" />, color: '#E0F2FE' },
    { title: 'Occupied Seats', value: metrics.occupiedSeats, icon: <SeatIcon color="success" />, color: '#D1FAE5' },
    { title: 'Vacant Seats', value: metrics.vacantSeats, icon: <SeatIcon color="disabled" />, color: '#F1F5F9' },
    { title: 'Outstanding Dues', value: `₹${metrics.duePayments}`, icon: <DueIcon color="warning" />, color: '#FEF3C7' },
    { title: 'Monthly Revenue', value: `₹${metrics.monthlyRevenue}`, icon: <RevenueIcon color="success" />, color: '#DCFCE7' },
    { title: 'Expiring Seats (7 Days)', value: metrics.expiringSubscriptions, icon: <ExpiryIcon color="error" />, color: '#FEE2E2' },
  ];

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" sx={{ fontWeight: 700, color: '#0F172A', mb: 4 }}>
        Workspace Dashboard
      </Typography>

      {/* KPI Section */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 3, mb: 4 }}>
        {kpis.map((kpi, idx) => (
          <Card key={idx} sx={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', borderRadius: 2.5 }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', p: 3 }}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: kpi.color,
                  display: 'flex',
                  mr: 2.5,
                }}
              >
                {kpi.icon}
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                  {kpi.title}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5 }}>
                  {kpi.value}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Charts Section */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 4 }}>
        {/* Revenue Trend Area Chart */}
        <Card sx={{ p: 3, borderRadius: 2.5, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
            Revenue Performance Trend
          </Typography>
          <Box sx={{ width: '100%', height: 300 }}>
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
          </Box>
        </Card>

        {/* Occupancy Rate Pie Chart */}
        <Card sx={{ p: 3, borderRadius: 2.5, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            Occupancy Rates
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Total seat utilisation details
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', height: 200 }}>
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
            <Box sx={{ position: 'absolute', textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {metrics.occupancyRate}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Occupied
              </Typography>
            </Box>
          </Box>

          <Box sx={{ mt: 'auto' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">Seat Occupancy Bar</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{metrics.occupiedSeats} Seats</Typography>
            </Box>
            <LinearProgress variant="determinate" value={metrics.occupancyRate} color="success" sx={{ height: 8, borderRadius: 4 }} />
          </Box>
        </Card>
      </Box>
    </Box>
  );
}
