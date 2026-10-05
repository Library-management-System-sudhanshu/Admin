import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import {
  useGetPaymentsQuery,
  useGetCollectionReportQuery,
  useCreatePaymentMutation,
  useRecordManualPaymentMutation,
  useGetStudentsQuery,
  useGetShiftsQuery,
  useCreateShiftMutation,
  useUpdateShiftMutation,
  useDeleteShiftMutation,
  useClearStudentDuesMutation,
} from '../store/api';
import { useToast } from '../components/ui/ToastContext';
import { useAlert } from '../components/ui/AlertContext';
import { DatePicker } from '../components/ui/DatePicker';
import {
  Box,
  Typography,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Autocomplete,
  Drawer,
} from '@mui/material';
import {
  Check as PaidIcon,
  Receipt as InvoiceIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { Button } from '../components/ui/Button';
import { Plus, X, CreditCard, Calendar, User, History, Clock, Sun, SunMedium, Sunset, Moon, Users, IndianRupee, CheckCircle2 } from 'lucide-react';
import { styled, keyframes } from '@mui/material/styles';
import { Search, Download, TrendingUp, WalletCards, SlidersHorizontal, RotateCcw, ArrowUpRight, Info } from 'lucide-react';
import './Billing.css';

// Fade‑in animation for table rows
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const inputStyle = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '10px',
    '& fieldset': { borderColor: '#cbd5e1' },
    '&:hover fieldset': { borderColor: 'var(--primary)' },
    '&.Mui-focused fieldset': { borderColor: 'var(--primary)' },
  },
  '& .MuiInputLabel-root': {
    color: 'var(--text-secondary)',
    '&.Mui-focused': { color: 'var(--primary)' },
  },
};

const menuProps = {
  PaperProps: {
    sx: {
      bgcolor: 'var(--bg-surface)',
      border: '1px solid var(--border-color)',
      '& .MuiMenuItem-root': {
        color: 'var(--text-primary)',
        '&:hover': { bgcolor: 'var(--bg-surface-hover)' },
        '&.Mui-selected': { bgcolor: 'var(--primary-light)', color: 'var(--primary)' },
      },
    },
  },
} as any;

const AnimatedTableRow = styled(TableRow)(({ theme }) => ({
  animation: `${fadeIn} 0.5s ease-out`,
  '&:hover': { backgroundColor: theme.palette.action.hover },
  cursor: 'pointer',
}));

const HOURS = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
const PERIODS = ['AM', 'PM'];

const getDurationDays = (label: string): number => {
  const lower = (label || '').toLowerCase().trim();
  const numMatch = lower.match(/(\d+)/);
  const num = numMatch ? parseInt(numMatch[1], 10) : 30;

  if (lower.includes('year') || lower.includes('yr')) return num * 365;
  if (lower.includes('month') || lower.includes('m')) return num * 30;
  if (lower.includes('week') || lower.includes('wk')) return num * 7;
  if (lower.includes('day') || lower.includes('d')) return num;
  return num;
};

const getMinuteOptions = (currentMin: string) => {
  const base = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0'));
  if (currentMin && !base.includes(currentMin)) {
    base.push(currentMin);
    base.sort();
  }
  return base;
};

const parseTime = (timeStr: string) => {
  if (!timeStr) return { hour: '12', minute: '00', period: 'AM' };
  const [hhStr, mmStr] = timeStr.split(':');
  let hh = parseInt(hhStr, 10);
  const mm = mmStr || '00';
  
  let period = 'AM';
  if (hh >= 12) {
    period = 'PM';
    if (hh > 12) hh -= 12;
  } else if (hh === 0) {
    hh = 12;
  }
  
  return {
    hour: hh.toString(),
    minute: mm,
    period,
  };
};

const formatTo24h = (hour: string, minute: string, period: string) => {
  let hh = parseInt(hour, 10);
  if (period === 'PM' && hh < 12) hh += 12;
  if (period === 'AM' && hh === 12) hh = 0;
  const hhStr = hh.toString().padStart(2, '0');
  const mmStr = minute.padStart(2, '0');
  return `${hhStr}:${mmStr}`;
};

const calculateShiftDuration = (start24: string, end24: string) => {
  if (!start24 || !end24) return '';
  const [sH, sM] = start24.split(':').map(Number);
  const [eH, eM] = end24.split(':').map(Number);
  if (isNaN(sH) || isNaN(sM) || isNaN(eH) || isNaN(eM)) return '';
  let startMinutes = sH * 60 + sM;
  let endMinutes = eH * 60 + eM;
  if (endMinutes <= startMinutes) {
    endMinutes += 24 * 60;
  }
  const diffMinutes = endMinutes - startMinutes;
  const hours = Math.floor(diffMinutes / 60);
  const mins = diffMinutes % 60;
  if (mins === 0) return `${hours} Hours`;
  return `${hours}h ${mins}m`;
};

const PRESET_SHIFTS = [
  { id: 'morning', label: 'Morning', subText: '8 AM - 2 PM', name: 'Morning Shift', startTime: '08:00', endTime: '14:00', icon: Sun },
  { id: 'afternoon', label: 'Afternoon', subText: '2 PM - 8 PM', name: 'Afternoon Shift', startTime: '14:00', endTime: '20:00', icon: SunMedium },
  { id: 'evening', label: 'Evening', subText: '6 PM - 11 PM', name: 'Evening Shift', startTime: '18:00', endTime: '23:00', icon: Sunset },
  { id: 'night', label: 'Night', subText: '11 PM - 6 AM', name: 'Night Shift', startTime: '23:00', endTime: '06:00', icon: Moon },
  { id: 'fullday', label: 'Full Day', subText: '8 AM - 8 PM', name: 'Full Day Shift', startTime: '08:00', endTime: '20:00', icon: Clock },
  { id: 'custom', label: 'Custom', subText: 'Manual hours', name: '', startTime: '09:00', endTime: '17:00', icon: Clock }
];

export default function Billing() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state: RootState) => state.auth);
  const { showAlert } = useAlert();
  const [tab, setTab] = useState(0);

  const { data: payments, isLoading: paymentsLoading } = useGetPaymentsQuery({});
  const { data: report } = useGetCollectionReportQuery('monthly');
  const { data: studentsData } = useGetStudentsQuery({});

  const [clearDues, { isLoading: isClearingDues }] = useClearStudentDuesMutation();

  // Drawer States
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [clearDuesAmount, setClearDuesAmount] = useState('');
  const [clearDuesMethod, setClearDuesMethod] = useState<'CASH' | 'UPI'>('CASH');

  const handleClearDues = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayment?.studentProfile?.id) return;
    try {
      await clearDues({
        id: selectedPayment.studentProfile.id,
        amount: Number(clearDuesAmount),
        method: clearDuesMethod
      }).unwrap();
      showToast('Dues cleared successfully!', 'success');
      setIsDrawerOpen(false);
      setClearDuesAmount('');
    } catch (err: any) {
      showToast(err?.data?.message || 'Failed to clear dues', 'error');
    }
  };

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');

  // Filtered payments list
  const filteredPayments = React.useMemo(() => {
    if (!payments) return [];
    return payments.filter((payment: any) => {
      // 1. Search Query (Student name or Invoice ID)
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const studentName = payment.studentProfile?.user?.name?.toLowerCase() || '';
        const invoiceId = `inv-${payment.id.substring(0, 8).toLowerCase()}`;
        if (!studentName.includes(query) && !invoiceId.includes(query)) {
          return false;
        }
      }

      // 2. Status Filter
      if (statusFilter === 'NEEDS_ATTENTION') {
        if (payment.status !== 'UNPAID' && payment.status !== 'PARTIAL') return false;
      } else if (statusFilter !== 'ALL' && payment.status !== statusFilter) {
        return false;
      }

      // 3. Method Filter
      if (methodFilter !== 'ALL' && payment.method !== methodFilter) {
        return false;
      }

      // 4. Start Date Filter
      if (startDateFilter) {
        const pDate = new Date(payment.createdAt);
        pDate.setHours(0, 0, 0, 0);
        const sFilter = new Date(startDateFilter);
        sFilter.setHours(0, 0, 0, 0);
        if (pDate < sFilter) return false;
      }

      // 5. End Date Filter
      if (endDateFilter) {
        const pDate = new Date(payment.createdAt);
        pDate.setHours(0, 0, 0, 0);
        const eFilter = new Date(endDateFilter);
        eFilter.setHours(0, 0, 0, 0);
        if (pDate > eFilter) return false;
      }

      return true;
    });
  }, [payments, searchQuery, statusFilter, methodFilter, startDateFilter, endDateFilter]);

  const billingSummary = React.useMemo(() => {
    const records = payments || [];
    return {
      paid: records.filter((payment: any) => payment.status === 'PAID').length,
      pending: records.filter((payment: any) => payment.status === 'UNPAID' || payment.status === 'PARTIAL').length,
      total: records.length,
    };
  }, [payments]);

  const hasActiveFilters = Boolean(searchQuery || statusFilter !== 'ALL' || methodFilter !== 'ALL' || startDateFilter || endDateFilter);

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setMethodFilter('ALL');
    setStartDateFilter('');
    setEndDateFilter('');
  };

  const handleExportCSV = () => {
    if (!filteredPayments || filteredPayments.length === 0) {
      showToast('No payment records found to export', 'info');
      return;
    }
    
    // Define headers
    const headers = ['Invoice ID', 'Student Name', 'Amount (₹)', 'Payment Method', 'Date', 'Status'];
    
    // Map rows
    const rows = filteredPayments.map((payment: any) => [
      `INV-${payment.id.substring(0, 8).toUpperCase()}`,
      payment.studentProfile?.user?.name || 'N/A',
      payment.amount,
      payment.method,
      new Date(payment.createdAt).toLocaleDateString(),
      payment.status
    ]);
    
    // Combine to CSV format
    const csvContent = [
      headers.join(','),
      ...rows.map((row: any[]) => row.map((val: any) => `"${val}"`).join(','))
    ].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `studyflow_billing_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const [openCollect, setOpenCollect] = useState(false);
  const [studentProfileId, setStudentProfileId] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'CASH' | 'UPI' | 'RAZORPAY'>('CASH');
  const [selectedShiftId, setSelectedShiftId] = useState('');
  const [billingDurationMonths, setBillingDurationMonths] = useState<number>(1);

  // Toast
  const { showToast } = useToast();

  // Shifts API
  const { data: shifts, isLoading: shiftsLoading } = useGetShiftsQuery(user?.workspaceId, { skip: !user?.workspaceId });
  const [createShift] = useCreateShiftMutation();
  const [updateShift] = useUpdateShiftMutation();
  const [deleteShift] = useDeleteShiftMutation();

  const [openShiftModal, setOpenShiftModal] = useState(false);
  const [editShiftMode, setEditShiftMode] = useState(false);
  const [shiftFormData, setShiftFormData] = useState({
    id: '',
    name: '',
    startTime: '09:00',
    endTime: '17:00',
    capacity: '' as any,
    price: '' as any,
    price7Days: '' as any,
    price15Days: '' as any,
    price3Months: '' as any,
    price6Months: '' as any,
  });
  const [selectedPreset, setSelectedPreset] = useState<string>('custom');

  const [customPricingList, setCustomPricingList] = useState<{ label: string; price: number | string }[]>([
    { label: '7 Days', price: '' },
    { label: '15 Days', price: '' },
    { label: '1 Month', price: '' },
    { label: '2 Months', price: '' },
    { label: '3 Months', price: '' },
  ]);

  const handleAddPricingTier = (label?: string, price?: number | string) => {
    setCustomPricingList((prev) => [
      ...prev,
      { label: label || '1 Month', price: price !== undefined ? price : '' },
    ]);
  };

  const handleUpdatePricingTier = (index: number, field: 'label' | 'price', value: any) => {
    setCustomPricingList((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleRemovePricingTier = (index: number) => {
    setCustomPricingList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleApplyPreset = (presetId: string, currentFormData: any) => {
    setSelectedPreset(presetId);
    const preset = PRESET_SHIFTS.find(p => p.id === presetId);
    if (preset) {
      setShiftFormData({
        ...currentFormData,
        name: preset.name,
        startTime: preset.startTime,
        endTime: preset.endTime
      });
    }
  };

  const handleOpenCreateShift = () => {
    setEditShiftMode(false);
    setShiftFormData({
      id: '',
      name: '',
      startTime: '09:00',
      endTime: '17:00',
      capacity: '',
      price: '',
      price7Days: '',
      price15Days: '',
      price3Months: '',
      price6Months: '',
    });
    setCustomPricingList([
      { label: '7 Days', price: '' },
      { label: '15 Days', price: '' },
      { label: '1 Month', price: '' },
      { label: '2 Months', price: '' },
      { label: '3 Months', price: '' },
    ]);
    setSelectedPreset('custom');
    setOpenShiftModal(true);
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get('tab');
    const actionParam = searchParams.get('action');

    if (location.state?.tab !== undefined || tabParam === 'shifts') {
      const targetTab = location.state?.tab ?? (tabParam === 'shifts' ? 1 : 0);
      setTab(targetTab);
    }

    if (location.state?.openCreateShift || actionParam === 'add-shift') {
      handleOpenCreateShift();
    }
  }, [location]);

  const shiftStartParsed = parseTime(shiftFormData.startTime);
  const shiftEndParsed = parseTime(shiftFormData.endTime);

  const handleShiftStartChange = (field: 'hour' | 'minute' | 'period', value: string) => {
    const newTime = { ...shiftStartParsed, [field]: value };
    setShiftFormData(prev => ({
      ...prev,
      startTime: formatTo24h(newTime.hour, newTime.minute, newTime.period),
    }));
    setSelectedPreset('custom');
  };

  const handleShiftEndChange = (field: 'hour' | 'minute' | 'period', value: string) => {
    const newTime = { ...shiftEndParsed, [field]: value };
    setShiftFormData(prev => ({
      ...prev,
      endTime: formatTo24h(newTime.hour, newTime.minute, newTime.period),
    }));
    setSelectedPreset('custom');
  };

  const handleOpenEditShift = (shift: any) => {
    setEditShiftMode(true);
    setShiftFormData({
      ...shift,
      capacity: shift.capacity ?? '',
      price7Days: shift.price7Days ?? '',
      price15Days: shift.price15Days ?? '',
      price3Months: shift.price3Months ?? '',
      price6Months: shift.price6Months ?? '',
    });

    let initialTiers: { label: string; price: number | string }[] = [];
    if (Array.isArray(shift.customPricing) && shift.customPricing.length > 0) {
      initialTiers = shift.customPricing.map((t: any) => ({ label: t.label, price: t.price }));
    } else {
      if (shift.price7Days) initialTiers.push({ label: '7 Days', price: shift.price7Days });
      if (shift.price15Days) initialTiers.push({ label: '15 Days', price: shift.price15Days });
      if (shift.price) initialTiers.push({ label: '1 Month', price: shift.price });
      if (shift.price3Months) initialTiers.push({ label: '3 Months', price: shift.price3Months });
      if (shift.price6Months) initialTiers.push({ label: '6 Months', price: shift.price6Months });
      if (initialTiers.length === 0) {
        initialTiers = [
          { label: '7 Days', price: '' },
          { label: '15 Days', price: '' },
          { label: '1 Month', price: shift.price || '' },
        ];
      }
    }
    setCustomPricingList(initialTiers);
    const matchedPreset = PRESET_SHIFTS.find(p => p.name === shift.name && p.startTime === shift.startTime && p.endTime === shift.endTime);
    setSelectedPreset(matchedPreset ? matchedPreset.id : 'custom');
    setOpenShiftModal(true);
  };

  const handleSaveShift = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const cleanedCustomPricing = customPricingList
        .filter((item) => item.label.trim() !== '' && item.price !== '' && item.price !== null && !isNaN(Number(item.price)))
        .map((item) => ({
          label: item.label.trim(),
          price: parseFloat(item.price as string),
        }));

      // Sort in ascending order of duration length
      cleanedCustomPricing.sort((a, b) => getDurationDays(a.label) - getDurationDays(b.label));

      const getTierPrice = (labelText: string) => {
        const found = cleanedCustomPricing.find((t) => t.label.toLowerCase().includes(labelText.toLowerCase()));
        return found ? found.price : null;
      };

      const base1m = getTierPrice('1 month') || (cleanedCustomPricing.length > 0 ? cleanedCustomPricing[0].price : 0);
      const p7d = getTierPrice('7 day') || (shiftFormData.price7Days ? parseFloat(shiftFormData.price7Days as any) : null);
      const p15d = getTierPrice('15 day') || (shiftFormData.price15Days ? parseFloat(shiftFormData.price15Days as any) : null);
      const p3m = getTierPrice('3 month') || (shiftFormData.price3Months ? parseFloat(shiftFormData.price3Months as any) : null);
      const p6m = getTierPrice('6 month') || (shiftFormData.price6Months ? parseFloat(shiftFormData.price6Months as any) : null);

      const dataToSave = {
        ...shiftFormData,
        capacity: shiftFormData.capacity === '' || shiftFormData.capacity === null || shiftFormData.capacity === undefined ? null : parseInt(shiftFormData.capacity as any),
        price: base1m,
        price7Days: p7d,
        price15Days: p15d,
        price3Months: p3m,
        price6Months: p6m,
        customPricing: cleanedCustomPricing,
      };
      if (!editShiftMode || !dataToSave.id) {
        delete (dataToSave as any).id;
      }

      if (editShiftMode) {
        await updateShift({ id: shiftFormData.id, data: dataToSave }).unwrap();
        showToast('Shift updated successfully!', 'success');
      } else {
        await createShift({ workspaceId: user?.workspaceId, data: dataToSave }).unwrap();
        showToast('Shift created successfully!', 'success');
      }
      setOpenShiftModal(false);
    } catch (err) {
      showToast('Failed to save shift', 'error');
    }
  };

  const handleDeleteShift = async (id: string) => {
    const confirmed = await showAlert('Are you sure you want to delete this shift?', {
      title: 'Delete Shift',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
    });
    if (!confirmed) return;
    try {
      await deleteShift(id).unwrap();
      showToast('Shift deleted successfully!', 'success');
    } catch (err) {
      showToast('Failed to delete shift', 'error');
    }
  };

  const [createPayment, { isLoading: isCreating }] = useCreatePaymentMutation();
  const [recordManualPayment] = useRecordManualPaymentMutation();

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createPayment({
        studentProfileId,
        amount: Number(amount),
        method,
        shiftId: selectedShiftId || undefined,
        durationMonths: selectedShiftId ? billingDurationMonths : undefined,
      }).unwrap();
      setOpenCollect(false);
      setStudentProfileId('');
      setAmount('');
      setSelectedShiftId('');
      setBillingDurationMonths(1);
    } catch (err) {
      showToast('Error generating invoice', 'error');
    }
  };

  const handleRecordManual = async (id: string, payMethod: 'CASH' | 'UPI') => {
    await recordManualPayment({ id, method: payMethod });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'success';
      case 'PARTIAL':
        return 'warning';
      case 'UNPAID':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box className="billing-page">
      {/* Tabs & Collect Fee Action Row */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2, borderBottom: '1px solid #e2e8f0' }}>
        <Tabs value={tab} onChange={(_, val) => setTab(val)} className="billing-tabs" variant="scrollable" scrollButtons={false} sx={{ mb: 0, borderBottom: 'none' }}>
          <Tab label="Collection ledger" />
          <Tab label="Shifts & pricing" />
        </Tabs>
        <Button 
          variant="primary" 
          onClick={() => setOpenCollect(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 16px', fontSize: '0.82rem', borderRadius: '8px', fontWeight: 600, marginBottom: '6px' }}
        >
          <Plus size={16} /> <span>Collect Fee</span>
        </Button>
      </Box>

      {tab === 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Summary Metric */}
          <Box className="billing-stats-grid">
            <Card className="billing-hero-card">
              <Box className="billing-stat-icon"><TrendingUp size={20} /></Box>
              <Typography className="billing-stat-label">Collected this month</Typography>
              <Typography className="billing-stat-value">₹{Number(report?.totalCollected || 0).toLocaleString('en-IN')}</Typography>
              <Typography className="billing-stat-meta"><ArrowUpRight size={14} /> {report?.count || 0} successful transactions</Typography>
            </Card>
            <Card className="billing-stat-card">
              <Box className="billing-stat-icon blue"><WalletCards size={20} /></Box>
              <Typography className="billing-stat-label">Paid invoices</Typography>
              <Typography className="billing-stat-value dark">{billingSummary.paid}</Typography>
              <Typography className="billing-stat-meta neutral">of {billingSummary.total} total invoices</Typography>
            </Card>
            <Card
              className={`billing-stat-card billing-action-card ${statusFilter === 'NEEDS_ATTENTION' ? 'active' : ''}`}
              onClick={() => setStatusFilter(statusFilter === 'NEEDS_ATTENTION' ? 'ALL' : 'NEEDS_ATTENTION')}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  setStatusFilter(statusFilter === 'NEEDS_ATTENTION' ? 'ALL' : 'NEEDS_ATTENTION');
                }
              }}
              role="button"
              tabIndex={0}
              aria-pressed={statusFilter === 'NEEDS_ATTENTION'}
              aria-label="Filter invoices that need attention"
            >
              <Box className="billing-stat-icon amber"><Clock size={20} /></Box>
              <Typography className="billing-stat-label">Needs attention</Typography>
              <Typography className="billing-stat-value dark">{billingSummary.pending}</Typography>
              <Typography className="billing-stat-meta neutral">{statusFilter === 'NEEDS_ATTENTION' ? 'Showing attention items · click to clear' : 'Unpaid or partially paid · click to view'}</Typography>
            </Card>
          </Box>

          {/* Filters & Export Section */}
          <Card className="billing-filter-card">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
              <Box><Typography className="billing-section-title"><SlidersHorizontal size={17} /> Filter records</Typography><Typography className="billing-section-caption">Narrow down transactions by student, status, channel or date.</Typography></Box>
              <Box className="billing-filter-actions">
                {hasActiveFilters && <Button variant="text" onClick={clearFilters} className="billing-reset-button"><RotateCcw size={15} /> Reset</Button>}
                <Button variant="secondary" onClick={handleExportCSV} className="billing-export-button"><Download size={16} /> Export CSV</Button>
              </Box>
            </Box>
            <Box className="billing-filter-grid">
              <Box className="billing-filter-field billing-search-field">
                <Typography component="label" className="billing-filter-label">Search</Typography>
                <TextField
                  size="small"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Student or invoice ID"
                  fullWidth
                  slotProps={{ input: { startAdornment: <Search size={16} className="billing-search-icon" /> } }}
                />
              </Box>
              <Box className="billing-filter-field">
                <Typography component="label" className="billing-filter-label">Status</Typography>
                <FormControl size="small" fullWidth>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  displayEmpty
                >
                  <MenuItem value="ALL">All Statuses</MenuItem>
                  <MenuItem value="PAID">Paid</MenuItem>
                  <MenuItem value="PARTIAL">Partial</MenuItem>
                  <MenuItem value="UNPAID">Unpaid</MenuItem>
                  <MenuItem value="NEEDS_ATTENTION">Needs Attention</MenuItem>
                </Select>
                </FormControl>
              </Box>
              <Box className="billing-filter-field">
                <Typography component="label" className="billing-filter-label">Method</Typography>
                <FormControl size="small" fullWidth>
                <Select
                  value={methodFilter}
                  onChange={(e) => setMethodFilter(e.target.value)}
                  displayEmpty
                >
                  <MenuItem value="ALL">All Channels</MenuItem>
                  <MenuItem value="CASH">Cash</MenuItem>
                  <MenuItem value="UPI">UPI</MenuItem>
                  <MenuItem value="RAZORPAY">Razorpay</MenuItem>
                </Select>
                </FormControl>
              </Box>
              <DatePicker
                className="billing-date-field"
                label="From Date"
                value={startDateFilter}
                onChange={(val) => setStartDateFilter(val)}
                placeholder="From date"
              />
              <DatePicker
                className="billing-date-field"
                label="To Date"
                value={endDateFilter}
                onChange={(val) => setEndDateFilter(val)}
                placeholder="To date"
              />
            </Box>
          </Card>

          {/* Payments Table */}
          <Box>
            {paymentsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer component={Paper} className="billing-table-card">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Invoice ID</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Student</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Amount</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Method</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredPayments.map((payment: any, idx: number) => (
                      <AnimatedTableRow
                        key={payment.id}
                        hover
                        data-index={idx}
                        onClick={() => {
                          setSelectedPayment(payment);
                          setClearDuesAmount(
                            payment.studentProfile?.dueAmount?.toString() || ''
                          );
                          setIsDrawerOpen(true);
                        }}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                          INV-{payment.id.substring(0, 8).toUpperCase()}
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.9rem', fontWeight: 500 }}>
                          {payment.studentProfile?.user?.name}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.9rem' }}>₹{payment.amount}</TableCell>
                        <TableCell>
                          <Chip label={payment.method} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.85rem' }}>
                          {new Date(payment.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Chip label={payment.status} size="small" color={getStatusColor(payment.status)} />
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                            {payment.status === 'UNPAID' && (
                              <>
                                <Tooltip title="Record Cash Payment">
                                  <IconButton color="success" onClick={(e) => { e.stopPropagation(); handleRecordManual(payment.id, 'CASH'); }}>
                                    <PaidIcon />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Record UPI Payment">
                                  <IconButton color="primary" onClick={(e) => { e.stopPropagation(); handleRecordManual(payment.id, 'UPI'); }}>
                                    <PaidIcon />
                                  </IconButton>
                                </Tooltip>
                              </>
                            )}
                            {payment.invoiceUrl && (
                              <Tooltip title="Download Invoice">
                                <IconButton color="inherit" onClick={(e) => { e.stopPropagation(); window.open(payment.invoiceUrl, '_blank'); }}>
                                  <InvoiceIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                      </AnimatedTableRow>
                    ))}
                    {(!filteredPayments || filteredPayments.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 7, color: 'text.secondary' }}>
                          <Box className="billing-empty-state"><Box className="billing-empty-icon"><InvoiceIcon /></Box><Typography className="billing-empty-title">No transactions found</Typography><Typography className="billing-empty-copy">Try adjusting your filters or collect a new fee.</Typography>{hasActiveFilters && <Button variant="text" onClick={clearFilters}>Clear all filters</Button>}</Box>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        </Box>
      )}

      {tab === 1 && (
        <Card sx={{ p: 3, border: '1px solid #E2E8F0', boxShadow: 'none', borderRadius: 2.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>Shift Plans & Pricing Cards</Typography>
            <Button 
              variant="primary" 
              onClick={handleOpenCreateShift}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--accent-blue)', borderColor: 'var(--accent-blue)', borderRadius: '10px' }}
            >
              <Plus size={16} /> Create New Shift
            </Button>
          </Box>

          {shiftsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
              <CircularProgress />
            </Box>
          ) : !shifts || shifts.length === 0 ? (
            <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 3, border: '1px solid #E2E8F0', boxShadow: 'none' }}>
              <Typography color="text.secondary">No shift plans found. Create your first shift plan to get started.</Typography>
            </Paper>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(auto-fill, minmax(310px, 1fr))' }, gap: 2.5 }}>
              {shifts.map((shift: any) => {
                const timeLower = (shift.startTime || '').toLowerCase() + (shift.name || '').toLowerCase();
                let icon = <Sun size={20} style={{ color: '#f59e0b' }} />;
                let badgeBg = '#fef3c7';

                if (timeLower.includes('night') || timeLower.includes('evening') || parseInt(shift.startTime) >= 18) {
                  icon = <Moon size={20} style={{ color: '#6366f1' }} />;
                  badgeBg = '#e0e7ff';
                } else if (timeLower.includes('afternoon') || parseInt(shift.startTime) >= 12) {
                  icon = <SunMedium size={20} style={{ color: '#ea580c' }} />;
                  badgeBg = '#ffedd5';
                }

                return (
                  <Card
                    key={shift.id}
                    sx={{
                      p: 2.5,
                      borderRadius: 3,
                      border: '1px solid var(--border-color)',
                      bgcolor: 'var(--bg-surface)',
                      boxShadow: 'var(--shadow-sm)',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: 'var(--shadow-md)',
                        borderColor: 'var(--primary)',
                      },
                    }}
                  >
                    <Box>
                      {/* Card Top: Shift Icon, Name, Capacity */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box sx={{ width: 38, height: 38, borderRadius: '12px', bgcolor: badgeBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {icon}
                          </Box>
                          <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'var(--text-navy)', lineHeight: 1.2 }}>
                              {shift.name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'var(--text-slate)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', mt: 0.5 }}>
                              <Clock size={12} /> {shift.startTime} — {shift.endTime}
                            </Typography>
                          </Box>
                        </Box>
                        <Chip
                          label={shift.capacity ? `Cap: ${shift.capacity}` : 'Unlimited'}
                          size="small"
                          sx={{ fontSize: '0.7rem', fontWeight: 700, bgcolor: 'var(--bg-surface-hover)', color: 'var(--text-secondary)' }}
                        />
                      </Box>

                      {/* Dynamic Duration Pricing Tiers (Sorted Ascending with Daily Rate) */}
                      <Box sx={{ mb: 2.5 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: 'var(--text-slate)', mb: 1.25, display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '0.7rem' }}>
                          Configured Duration Pricing & Daily Rates
                        </Typography>

                        {(() => {
                          let rawTiers: { label: string; price: number }[] = Array.isArray(shift.customPricing) && shift.customPricing.length > 0
                            ? shift.customPricing
                            : [
                                ...(shift.price7Days ? [{ label: '7 Days', price: Number(shift.price7Days) }] : []),
                                ...(shift.price15Days ? [{ label: '15 Days', price: Number(shift.price15Days) }] : []),
                                ...(shift.price ? [{ label: '1 Month', price: Number(shift.price) }] : []),
                                ...(shift.price3Months ? [{ label: '3 Months', price: Number(shift.price3Months) }] : []),
                                ...(shift.price6Months ? [{ label: '6 Months', price: Number(shift.price6Months) }] : []),
                              ];

                          if (rawTiers.length === 0) {
                            return (
                              <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2, bgcolor: 'var(--bg-surface-hover)', border: '1px dashed var(--border-color)', boxShadow: 'none' }}>
                                <Typography variant="caption" sx={{ color: 'var(--text-slate)', fontStyle: 'italic' }}>
                                  No duration tiers added yet (Base: ₹{shift.price || 0}/month)
                                </Typography>
                              </Paper>
                            );
                          }

                          // Sort in ascending order of duration length
                          const sortedTiers = [...rawTiers].sort((a, b) => getDurationDays(a.label) - getDurationDays(b.label));

                          return (
                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(auto-fill, minmax(130px, 1fr))' }, gap: 1.25 }}>
                              {sortedTiers.map((t, idx) => {
                                const days = getDurationDays(t.label);
                                const dailyPrice = days > 0 ? Math.round(Number(t.price) / days) : 0;
                                const is1Month = t.label.toLowerCase().includes('1 month');

                                return (
                                  <Box
                                    key={idx}
                                    sx={{
                                      p: 1.5,
                                      borderRadius: '12px',
                                      bgcolor: is1Month ? '#eff6ff' : '#f8fafc',
                                      border: is1Month ? '1.5px solid #3b82f6' : '1px solid #e2e8f0',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      gap: 0.2,
                                      transition: 'all 0.15s ease',
                                      boxShadow: is1Month ? '0 2px 8px rgba(37, 99, 235, 0.08)' : 'none',
                                      '&:hover': {
                                        borderColor: '#3b82f6',
                                        transform: 'translateY(-1px)',
                                      },
                                    }}
                                  >
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: is1Month ? '#1d4ed8' : '#334155' }}>
                                        {t.label}
                                      </Typography>
                                      {is1Month && (
                                        <Typography sx={{ fontSize: '0.62rem', fontWeight: 800, color: '#2563eb', bgcolor: '#dbeafe', px: 0.8, py: 0.1, borderRadius: '4px' }}>
                                          Base
                                        </Typography>
                                      )}
                                    </Box>

                                    <Typography sx={{ fontSize: '1.05rem', fontWeight: 800, color: is1Month ? '#1e40af' : '#0f172a', mt: 0.2 }}>
                                      ₹{Number(t.price || 0).toLocaleString('en-IN')}
                                    </Typography>

                                    <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: is1Month ? '#2563eb' : '#64748b' }}>
                                      ~₹{dailyPrice}/day
                                    </Typography>
                                  </Box>
                                );
                              })}
                            </Box>
                          );
                        })()}
                      </Box>
                    </Box>

                    {/* Footer Actions */}
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, pt: 1.5, borderTop: '1px solid var(--border-color)' }}>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEditShift(shift)}
                        style={{ borderRadius: '8px', padding: '4px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <EditIcon style={{ fontSize: 13 }} /> Edit Plan
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteShift(shift.id)}
                        style={{ borderRadius: '8px', padding: '4px 8px', fontSize: '0.75rem', color: '#ef4444', borderColor: '#fca5a5' }}
                      >
                        <DeleteIcon style={{ fontSize: 13 }} />
                      </Button>
                    </Box>
                  </Card>
                );
              })}
            </Box>
          )}
        </Card>
      )}



      {/* Collect Fee Dialog */}
      <Dialog open={openCollect} onClose={() => setOpenCollect(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Generate Fee Bill</DialogTitle>
        <form onSubmit={handleCreateInvoice}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Autocomplete
              options={studentsData?.students || []}
              getOptionLabel={(option: any) => option.user?.name || ''}
              value={studentsData?.students.find((s: any) => s.id === studentProfileId) || null}
              onChange={(_event: any, newValue: any | null) => {
                setStudentProfileId(newValue ? newValue.id : '');
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Student"
                  required
                  fullWidth
                />
              )}
            />

            <FormControl fullWidth>
              <InputLabel>Link Seating Shift (Optional)</InputLabel>
              <Select
                value={selectedShiftId}
                label="Link Seating Shift (Optional)"
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedShiftId(val);
                  const shift = shifts?.find((s: any) => s.id === val);
                  if (shift) {
                    if (billingDurationMonths === 3) {
                      setAmount((shift.price3Months || (shift.price * 3)).toString());
                    } else if (billingDurationMonths === 6) {
                      setAmount((shift.price6Months || (shift.price * 6)).toString());
                    } else {
                      setAmount(shift.price.toString());
                    }
                  } else {
                    setAmount('');
                  }
                }}
              >
                <MenuItem value="">Custom / None</MenuItem>
                {shifts?.map((shift: any) => (
                  <MenuItem key={shift.id} value={shift.id}>
                    {shift.name} (₹{shift.price})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {selectedShiftId && (
              <FormControl fullWidth>
                <InputLabel>Plan Duration</InputLabel>
                <Select
                  value={billingDurationMonths}
                  label="Plan Duration"
                  onChange={(e) => {
                    const months = Number(e.target.value);
                    setBillingDurationMonths(months);
                    const shift = shifts?.find((s: any) => s.id === selectedShiftId);
                    if (shift) {
                      if (months === 3) {
                        setAmount((shift.price3Months || (shift.price * 3)).toString());
                      } else if (months === 6) {
                        setAmount((shift.price6Months || (shift.price * 6)).toString());
                      } else {
                        setAmount(shift.price.toString());
                      }
                    }
                  }}
                >
                  <MenuItem value={1}>1 Month (Monthly)</MenuItem>
                  <MenuItem value={3}>3 Months (Quarterly)</MenuItem>
                  <MenuItem value={6}>6 Months (Half-Yearly)</MenuItem>
                </Select>
              </FormControl>
            )}

            <TextField
              label="Billing Amount (₹)"
              type="number"
              fullWidth
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />

            <FormControl fullWidth required>
              <InputLabel>Payment Channel</InputLabel>
              <Select
                value={method}
                label="Payment Channel"
                onChange={(e: any) => setMethod(e.target.value)}
              >
                <MenuItem value="CASH">Cash Deposit</MenuItem>
                <MenuItem value="UPI">UPI Transfer</MenuItem>
                <MenuItem value="RAZORPAY">Razorpay Portal (Online)</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions sx={{ p: 2.5, gap: '0.75rem' }}>
            <Button type="button" variant="text" onClick={() => setOpenCollect(false)}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={isCreating}>
              Generate Bill
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Premium Slide-Over Right Sidebar Drawer for Create / Edit Shift */}
      <Drawer
        anchor="right"
        open={openShiftModal}
        onClose={() => setOpenShiftModal(false)}
        slotProps={{
          backdrop: {
            sx: {
              backgroundColor: 'rgba(15, 23, 42, 0.4)',
              backdropFilter: 'blur(4px)',
            },
          },
          paper: {
            sx: {
              width: { xs: '100%', sm: '540px', md: '620px' },
              boxShadow: '-10px 0 30px rgba(0,0,0,0.15)',
              borderLeft: '1px solid var(--border-color)',
              bgcolor: 'var(--bg-surface)',
              display: 'flex',
              flexDirection: 'column',
            },
          },
        }}
      >
        {/* Header */}
        <Box sx={{
          p: 3,
          pb: 2.5,
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justify: 'space-between',
          flexShrink: 0
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{
              width: 44,
              height: 44,
              borderRadius: '14px',
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.4) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justify: 'center',
              color: '#60a5fa',
              boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)'
            }}>
              <Clock size={22} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                {editShiftMode ? 'Edit Shift Settings' : 'Create New Shift Plan'}
              </Typography>
              <Typography sx={{ fontSize: '0.78rem', color: '#94a3b8', mt: 0.5 }}>
                Configure shift timings, seating capacity, and dynamic pricing tiers
              </Typography>
            </Box>
          </Box>
          <IconButton 
            onClick={() => setOpenShiftModal(false)} 
            sx={{ color: '#94a3b8', '&:hover': { color: '#ffffff', background: 'rgba(255,255,255,0.1)' } }}
          >
            <X size={18} />
          </IconButton>
        </Box>

        <form onSubmit={handleSaveShift} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5, overflowY: 'auto', flex: 1 }}>
            
            {/* Quick Presets Selection */}
            <Box>
              <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-slate)', textTransform: 'uppercase', letterSpacing: '0.06em', mb: 1.25, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={14} style={{ color: 'var(--accent-blue)' }} /> Quick Presets
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.25 }}>
                {PRESET_SHIFTS.map((preset) => {
                  const isSelected = selectedPreset === preset.id;
                  const IconComp = preset.icon || Clock;
                  return (
                    <Box
                      key={preset.id}
                      onClick={() => handleApplyPreset(preset.id, shiftFormData)}
                      sx={{
                        p: 1.25,
                        borderRadius: '12px',
                        border: isSelected ? '2px solid #2563eb' : '1px solid #e2e8f0',
                        background: isSelected ? 'rgba(37, 99, 235, 0.05)' : '#ffffff',
                        cursor: 'pointer',
                        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 0.4,
                        boxShadow: isSelected ? '0 4px 12px rgba(37, 99, 235, 0.12)' : 'none',
                        '&:hover': {
                          borderColor: isSelected ? '#2563eb' : '#cbd5e1',
                          transform: 'translateY(-1px)'
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <IconComp size={15} style={{ color: isSelected ? '#2563eb' : '#64748b' }} />
                        {isSelected && <CheckCircle2 size={13} style={{ color: '#2563eb' }} />}
                      </Box>
                      <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: isSelected ? '#1e293b' : '#334155' }}>
                        {preset.label}
                      </Typography>
                      <Typography sx={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 500 }}>
                        {preset.subText}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            </Box>

            {/* Shift Name */}
            <Box>
              <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-navy)', mb: 0.75 }}>
                Shift Name *
              </Typography>
              <TextField
                fullWidth
                placeholder="e.g. Morning Shift"
                required
                value={shiftFormData.name}
                onChange={(e) => {
                  setShiftFormData({ ...shiftFormData, name: e.target.value });
                  setSelectedPreset('custom');
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    backgroundColor: '#ffffff',
                    fontSize: '0.88rem',
                    '& fieldset': { borderColor: '#e2e8f0' },
                    '&:hover fieldset': { borderColor: '#cbd5e1' },
                    '&.Mui-focused fieldset': { borderColor: '#2563eb' }
                  }
                }}
              />
            </Box>

            {/* Time Range Schedule Card */}
            <Box sx={{
              p: 2,
              borderRadius: '16px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={15} style={{ color: '#2563eb' }} /> Shift Schedule
                </Typography>
                {shiftFormData.startTime && shiftFormData.endTime && (
                  <Box sx={{
                    px: 1.25,
                    py: 0.3,
                    borderRadius: '99px',
                    background: 'rgba(37, 99, 235, 0.1)',
                    color: '#2563eb',
                    fontSize: '0.72rem',
                    fontWeight: 700
                  }}>
                    Duration: {calculateShiftDuration(shiftFormData.startTime, shiftFormData.endTime)}
                  </Box>
                )}
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Box>
                  <Typography
                    component="label"
                    htmlFor="shift-start-time"
                    onClick={() => {
                      try {
                        (document.getElementById('shift-start-time') as HTMLInputElement)?.showPicker?.();
                      } catch {}
                    }}
                    sx={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b', mb: 0.5, display: 'block', cursor: 'pointer' }}
                  >
                    Start Time *
                  </Typography>
                  <input
                    id="shift-start-time"
                    type="time"
                    required
                    value={shiftFormData.startTime}
                    onChange={(e) => {
                      setShiftFormData(prev => ({ ...prev, startTime: e.target.value }));
                      setSelectedPreset('custom');
                    }}
                    onClick={(e) => {
                      try {
                        e.currentTarget.showPicker?.();
                      } catch {}
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      backgroundColor: '#ffffff',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      color: '#0f172a',
                      outline: 'none',
                      boxSizing: 'border-box',
                      cursor: 'pointer'
                    }}
                  />
                </Box>

                <Box>
                  <Typography
                    component="label"
                    htmlFor="shift-end-time"
                    onClick={() => {
                      try {
                        (document.getElementById('shift-end-time') as HTMLInputElement)?.showPicker?.();
                      } catch {}
                    }}
                    sx={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b', mb: 0.5, display: 'block', cursor: 'pointer' }}
                  >
                    End Time *
                  </Typography>
                  <input
                    id="shift-end-time"
                    type="time"
                    required
                    value={shiftFormData.endTime}
                    onChange={(e) => {
                      setShiftFormData(prev => ({ ...prev, endTime: e.target.value }));
                      setSelectedPreset('custom');
                    }}
                    onClick={(e) => {
                      try {
                        e.currentTarget.showPicker?.();
                      } catch {}
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      backgroundColor: '#ffffff',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      color: '#0f172a',
                      outline: 'none',
                      boxSizing: 'border-box',
                      cursor: 'pointer'
                    }}
                  />
                </Box>
              </Box>
            </Box>

            {/* Pricing Section — Dynamic Duration Tiers */}
            <Box sx={{
              p: 2.5,
              borderRadius: '16px',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              boxShadow: 'var(--shadow-sm)',
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <IndianRupee size={16} style={{ color: 'var(--primary)' }} /> Dynamic Duration Pricing Tiers
                </Typography>
                <Typography variant="caption" sx={{ color: 'var(--text-slate)', fontSize: '0.72rem' }}>
                  Add as many duration options as needed
                </Typography>
              </Box>

              <Box sx={{ mb: 2.5 }}>
                <TextField
                  fullWidth
                  label="Max Capacity (Optional)"
                  type="number"
                  placeholder="Leave blank for unlimited capacity"
                  value={shiftFormData.capacity ?? ''}
                  onChange={(e) => setShiftFormData({ ...shiftFormData, capacity: e.target.value === '' ? '' : parseInt(e.target.value) })}
                  sx={inputStyle}
                />
              </Box>

              {/* Quick Add Presets Row */}
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'var(--text-slate)', mb: 1, display: 'block', textTransform: 'uppercase', letterSpacing: '0.03em', fontSize: '0.7rem' }}>
                Quick Add Duration Preset:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {['7 Days', '15 Days', '1 Month', '2 Months', '3 Months', '4 Months', '5 Months', '6 Months', '12 Months'].map((presetLabel) => (
                  <Button
                    key={presetLabel}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (!customPricingList.some((t) => t.label.toLowerCase() === presetLabel.toLowerCase())) {
                        handleAddPricingTier(presetLabel, '');
                      }
                    }}
                    style={{ borderRadius: '6px', padding: '3px 10px', fontSize: '0.75rem', fontWeight: 600 }}
                  >
                    + {presetLabel}
                  </Button>
                ))}
              </Box>

              {/* Pricing Tiers List */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2 }}>
                {customPricingList.map((tier, idx) => (
                  <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, bgcolor: 'var(--bg-surface-hover)', p: 1.5, borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                    <TextField
                      label="Duration (e.g. 7 Days, 2 Months)"
                      size="small"
                      value={tier.label}
                      onChange={(e) => handleUpdatePricingTier(idx, 'label', e.target.value)}
                      sx={{ flex: 1.5, ...inputStyle }}
                    />
                    <TextField
                      label="Price (₹)"
                      type="number"
                      size="small"
                      placeholder="e.g. 100"
                      value={tier.price ?? ''}
                      onChange={(e) => handleUpdatePricingTier(idx, 'price', e.target.value === '' ? '' : parseFloat(e.target.value))}
                      sx={{ flex: 1, ...inputStyle }}
                    />
                    <IconButton
                      size="small"
                      onClick={() => handleRemovePricingTier(idx)}
                      sx={{ color: '#ef4444', p: 1, '&:hover': { bgcolor: '#fee2e2' } }}
                    >
                      <X size={16} />
                    </IconButton>
                  </Box>
                ))}
              </Box>

              <Button
                type="button"
                variant="outline"
                onClick={() => handleAddPricingTier('', '')}
                style={{ width: '100%', borderRadius: '8px', padding: '8px 0', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <Plus size={15} /> Add Custom Duration Tier
              </Button>
            </Box>
          </Box>

          {/* Footer Actions */}
          <Box sx={{ p: 2.5, px: 3, background: 'var(--bg-surface-hover)', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpenShiftModal(false)}
              style={{ borderRadius: '10px', padding: '8px 20px', color: 'var(--text-secondary)' }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                color: '#ffffff',
                borderRadius: '10px',
                padding: '10px 28px',
                fontWeight: 700,
                fontSize: '0.88rem',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
                border: 'none'
              }}
            >
              {editShiftMode ? 'Update Shift Plan' : 'Save Shift Plan'}
            </Button>
          </Box>
        </form>
      </Drawer>

      {/* LEDGER RECORD DETAIL DRAWER */}
      <div 
        className={`drawer-backdrop ${isDrawerOpen ? 'open' : ''}`}
        onClick={() => setIsDrawerOpen(false)}
      />
      <div className={`right-drawer-panel ${isDrawerOpen ? 'open' : ''}`}>
        {/* Drawer Header */}
        <div className="drawer-header" style={{ borderBottom: '1px solid rgba(15,23,42,0.06)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-navy)' }}>
              Transaction Ledger Detail
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-slate)' }}>
              Detailed invoice metrics & lifetime student records
            </span>
          </div>
          <button 
            onClick={() => setIsDrawerOpen(false)}
            style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-slate)', padding: '4px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer Body */}
        {selectedPayment && (
          <div className="drawer-body" style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Status & Amount Card */}
            <div style={{
              background: selectedPayment.status === 'PAID' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' :
                          selectedPayment.status === 'PARTIAL' ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' :
                          'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: '#ffffff',
              padding: '20px',
              borderRadius: '16px',
              boxShadow: 'var(--shadow-soft)',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.8 }}>
                INV-{selectedPayment.id.substring(0, 8).toUpperCase()}
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px', marginTop: '4px' }}>
                <span style={{ fontSize: '1.8rem', fontWeight: 800 }}>₹{selectedPayment.amount}</span>
                <span style={{ fontSize: '0.8rem', opacity: 0.9, marginLeft: '4px' }}>Collected</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.15)' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Channel: {selectedPayment.method}</span>
                <span style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: '#ffffff',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  textTransform: 'uppercase'
                }}>{selectedPayment.status}</span>
              </div>
            </div>

            {/* Student Profile Overview */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h5 style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-slate)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Student Information
              </h5>
              <div 
                onClick={() => {
                  if (selectedPayment?.studentProfile?.id) {
                    navigate('/students', { state: { selectedStudentId: selectedPayment.studentProfile.id } });
                  }
                }}
                style={{
                  background: '#f8fafc',
                  border: '1px solid rgba(15,23,42,0.05)',
                  borderRadius: '16px',
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                className="hover-card-blue"
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#eff6ff'; e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.2)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.borderColor = 'rgba(15,23,42,0.05)'; }}
              >
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: selectedPayment.studentProfile?.user?.avatar ? `url(${selectedPayment.studentProfile.user.avatar}) no-repeat center center / cover` : 'var(--accent-blue)',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {!selectedPayment.studentProfile?.user?.avatar && selectedPayment.studentProfile?.user?.name?.charAt(0).toUpperCase()}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selectedPayment.studentProfile?.user?.name}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-slate)', marginTop: '2px' }}>
                    {selectedPayment.studentProfile?.user?.mobile}
                  </span>
                </div>
              </div>
            </div>

            {/* Remaining Dues Payment Block */}
            {selectedPayment.studentProfile?.dueAmount > 0 && (
              <div style={{
                background: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)',
                border: '1px solid #fecdd3',
                borderRadius: '16px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#be123c' }}>Remaining Dues:</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#be123c' }}>₹{selectedPayment.studentProfile.dueAmount}</span>
                </div>
                <form onSubmit={handleClearDues} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <input
                    type="number"
                    required
                    max={selectedPayment.studentProfile.dueAmount}
                    value={clearDuesAmount}
                    onChange={(e) => setClearDuesAmount(e.target.value)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '10px',
                      border: '1px solid #fca5a5',
                      fontSize: '0.8rem',
                      color: 'var(--text-navy)',
                      flex: 1,
                      outline: 'none',
                      backgroundColor: '#ffffff'
                    }}
                  />
                  <select
                    value={clearDuesMethod}
                    onChange={(e: any) => setClearDuesMethod(e.target.value)}
                    style={{
                      padding: '8px',
                      borderRadius: '10px',
                      border: '1px solid #fca5a5',
                      fontSize: '0.8rem',
                      color: 'var(--text-navy)',
                      backgroundColor: '#ffffff',
                      outline: 'none'
                    }}
                  >
                    <option value="CASH">Cash</option>
                    <option value="UPI">UPI</option>
                  </select>
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={isClearingDues}
                    style={{
                      borderRadius: '10px',
                      padding: '8px 16px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      backgroundColor: '#e11d48',
                      borderColor: '#e11d48'
                    }}
                  >
                    Pay Dues
                  </Button>
                </form>
              </div>
            )}

            {/* Student's Payment History */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
              <h5 style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-slate)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <History size={13} />
                Lifetime Payment Ledger
              </h5>
              <div style={{
                border: '1px solid rgba(15,23,42,0.06)',
                borderRadius: '16px',
                overflow: 'hidden',
                background: '#ffffff'
              }}>
                <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                  {payments
                    ?.filter((p: any) => p.studentProfile?.id === selectedPayment.studentProfile?.id)
                    ?.map((p: any, idx: number) => {
                      const totalList = payments.filter((x: any) => x.studentProfile?.id === selectedPayment.studentProfile?.id);
                      return (
                        <div 
                          key={p.id} 
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '12px 16px',
                            borderBottom: idx !== totalList.length - 1 ? '1px solid rgba(15,23,42,0.04)' : 'none',
                            background: p.id === selectedPayment.id ? '#f8fafc' : 'transparent',
                            fontSize: '0.8rem'
                          }}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                            <span style={{ fontWeight: 600, color: 'var(--text-navy)' }}>
                              ₹{p.amount} ({p.method})
                            </span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-slate)', marginTop: '2px' }}>
                              {new Date(p.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <span style={{
                            color: p.status === 'PAID' ? 'var(--status-emerald)' :
                                   p.status === 'PARTIAL' ? 'var(--status-gold)' :
                                   'var(--status-red)',
                            fontWeight: 700,
                            fontSize: '0.725rem',
                            textTransform: 'uppercase'
                          }}>{p.status}</span>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </Box>
  );
}
