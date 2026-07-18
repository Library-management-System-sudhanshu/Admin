import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
} from '@mui/material';
import {
  Check as PaidIcon,
  Receipt as InvoiceIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { Button } from '../components/ui/Button';
import { Plus, X, CreditCard, Calendar, User, History } from 'lucide-react';

const HOURS = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
const PERIODS = ['AM', 'PM'];

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

export default function Billing() {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
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
      if (statusFilter !== 'ALL' && payment.status !== statusFilter) {
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
      ...rows.map(row => row.map(val => `"${val}"`).join(','))
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
  const [shiftFormData, setShiftFormData] = useState({ id: '', name: '', startTime: '09:00', endTime: '17:00', capacity: '' as any, price: '' as any, price3Months: '' as any, price6Months: '' as any });

  const handleOpenCreateShift = () => {
    setEditShiftMode(false);
    setShiftFormData({ id: '', name: '', startTime: '09:00', endTime: '17:00', capacity: '' as any, price: '' as any, price3Months: '' as any, price6Months: '' as any });
    setOpenShiftModal(true);
  };

  const shiftStartParsed = parseTime(shiftFormData.startTime);
  const shiftEndParsed = parseTime(shiftFormData.endTime);

  const handleShiftStartChange = (field: 'hour' | 'minute' | 'period', value: string) => {
    const newTime = { ...shiftStartParsed, [field]: value };
    setShiftFormData({
      ...shiftFormData,
      startTime: formatTo24h(newTime.hour, newTime.minute, newTime.period),
    });
  };

  const handleShiftEndChange = (field: 'hour' | 'minute' | 'period', value: string) => {
    const newTime = { ...shiftEndParsed, [field]: value };
    setShiftFormData({
      ...shiftFormData,
      endTime: formatTo24h(newTime.hour, newTime.minute, newTime.period),
    });
  };

  const handleOpenEditShift = (shift: any) => {
    setEditShiftMode(true);
    setShiftFormData({ ...shift, capacity: shift.capacity ?? '', price3Months: shift.price3Months ?? '', price6Months: shift.price6Months ?? '' });
    setOpenShiftModal(true);
  };

  const handleSaveShift = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dataToSave = {
        ...shiftFormData,
        capacity: shiftFormData.capacity === '' || shiftFormData.capacity === null || shiftFormData.capacity === undefined ? null : parseInt(shiftFormData.capacity as any),
        price: shiftFormData.price === '' || shiftFormData.price === null || shiftFormData.price === undefined ? 0 : parseFloat(shiftFormData.price as any),
        price3Months: shiftFormData.price3Months === '' || shiftFormData.price3Months === null || shiftFormData.price3Months === undefined ? null : parseFloat(shiftFormData.price3Months as any),
        price6Months: shiftFormData.price6Months === '' || shiftFormData.price6Months === null || shiftFormData.price6Months === undefined ? null : parseFloat(shiftFormData.price6Months as any),
      };
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
    if (!window.confirm('Are you sure you want to delete this shift?')) return;
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
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#0F172A' }}>
          Billing & Subscriptions
        </Typography>
        <Button 
          variant="primary" 
          onClick={() => setOpenCollect(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--accent-blue)', borderColor: 'var(--accent-blue)' }}
        >
          <Plus size={18} /> Collect Fee / Invoice
        </Button>
      </Box>

      {/* Tabs */}
      <Tabs value={tab} onChange={(_, val) => setTab(val)} sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
        <Tab label="Collection Ledger" />
        <Tab label="Seating Shifts & Pricing" />
      </Tabs>

      {tab === 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {/* Summary Metric */}
          <Card sx={{ bgcolor: '#0F172A', color: '#FFFFFF', p: 3, borderRadius: 2.5 }}>
            <Typography variant="subtitle2" sx={{ color: '#94A3B8', fontWeight: 600 }}>
              This Month's Collections
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 700, mt: 1, color: '#38BDF8' }}>
              ₹{report?.totalCollected || 0}
            </Typography>
            <Typography variant="caption" sx={{ color: '#94A3B8', mt: 1, display: 'block' }}>
              Across {report?.count || 0} successful transactions
            </Typography>
          </Card>

          {/* Filters & Export Section */}
          <Card sx={{ p: 3, border: '1px solid #E2E8F0', boxShadow: 'none', borderRadius: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#0F172A' }}>
                Filter Ledger Records
              </Typography>
              <Button
                variant="secondary"
                onClick={handleExportCSV}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', borderRadius: '10px' }}
              >
                Export CSV
              </Button>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '2fr 1fr 1fr 1.5fr 1.5fr' }, gap: 2 }}>
              <TextField
                label="Search Student / Invoice ID"
                size="small"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g. John Doe, INV-..."
                fullWidth
              />
              <FormControl size="small" fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="ALL">All Statuses</MenuItem>
                  <MenuItem value="PAID">Paid</MenuItem>
                  <MenuItem value="PARTIAL">Partial</MenuItem>
                  <MenuItem value="UNPAID">Unpaid</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" fullWidth>
                <InputLabel>Method</InputLabel>
                <Select
                  value={methodFilter}
                  label="Method"
                  onChange={(e) => setMethodFilter(e.target.value)}
                >
                  <MenuItem value="ALL">All Channels</MenuItem>
                  <MenuItem value="CASH">Cash</MenuItem>
                  <MenuItem value="UPI">UPI</MenuItem>
                  <MenuItem value="RAZORPAY">Razorpay</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="From Date"
                type="date"
                size="small"
                value={startDateFilter}
                onChange={(e) => setStartDateFilter(e.target.value)}
                {...({ 
                  InputLabelProps: { shrink: true }, 
                  slotProps: { 
                    inputLabel: { shrink: true },
                    htmlInput: {
                      onClick: (e: any) => {
                        if (typeof e.target.showPicker === 'function') {
                          e.target.showPicker();
                        }
                      }
                    }
                  } 
                } as any)}
                fullWidth
              />
              <TextField
                label="To Date"
                type="date"
                size="small"
                value={endDateFilter}
                onChange={(e) => setEndDateFilter(e.target.value)}
                {...({ 
                  InputLabelProps: { shrink: true }, 
                  slotProps: { 
                    inputLabel: { shrink: true },
                    htmlInput: {
                      onClick: (e: any) => {
                        if (typeof e.target.showPicker === 'function') {
                          e.target.showPicker();
                        }
                      }
                    }
                  } 
                } as any)}
                fullWidth
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
              <TableContainer component={Paper} sx={{ borderRadius: 2.5, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
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
                    {filteredPayments?.map((payment: any) => (
                      <TableRow 
                        key={payment.id} 
                        hover
                        onClick={() => {
                          setSelectedPayment(payment);
                          setClearDuesAmount(payment.studentProfile?.dueAmount?.toString() || '');
                          setIsDrawerOpen(true);
                        }}
                        style={{ cursor: 'pointer' }}
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
                      </TableRow>
                    ))}
                    {(!filteredPayments || filteredPayments.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                          No ledger records match the selected filters.
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
            <Typography variant="h6" sx={{ fontWeight: 600 }}>Shifts & Pricing</Typography>
            <Button 
              variant="primary" 
              onClick={handleOpenCreateShift}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--accent-blue)', borderColor: 'var(--accent-blue)', borderRadius: '10px' }}
            >
              <Plus size={16} /> Add Shift
            </Button>
          </Box>

          {shiftsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid #E2E8F0', borderRadius: 2 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Shift Name</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Start Time</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>End Time</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Capacity</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Monthly Price</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>3-Month Price</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>6-Month Price</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {shifts?.map((shift: any) => (
                    <TableRow key={shift.id} hover>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.9rem' }}>{shift.name}</TableCell>
                      <TableCell sx={{ fontSize: '0.875rem' }}>{shift.startTime}</TableCell>
                      <TableCell sx={{ fontSize: '0.875rem' }}>{shift.endTime}</TableCell>
                      <TableCell sx={{ fontSize: '0.875rem' }}>{shift.capacity ?? 'Unlimited'}</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.9rem' }}>₹{shift.price}</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.9rem', color: 'text.secondary' }}>
                        {shift.price3Months ? `₹${shift.price3Months}` : '—'}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.9rem', color: 'text.secondary' }}>
                        {shift.price6Months ? `₹${shift.price6Months}` : '—'}
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                          <IconButton size="small" color="primary" onClick={() => handleOpenEditShift(shift)}>
                            <EditIcon />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => handleDeleteShift(shift.id)}>
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!shifts || shifts.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                        No shifts found. Create your first shift to get started.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
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

      {/* Add/Edit Shift Dialog */}
      <Dialog open={openShiftModal} onClose={() => setOpenShiftModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>{editShiftMode ? 'Edit Shift' : 'Add New Shift'}</DialogTitle>
        <form onSubmit={handleSaveShift}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <TextField
              label="Shift Name (e.g. Morning Batch)"
              fullWidth
              required
              value={shiftFormData.name}
              onChange={(e) => setShiftFormData({ ...shiftFormData, name: e.target.value })}
            />
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3 }}>
              <Box>
                <Typography variant="caption" sx={{ display: 'block', mb: 1, fontWeight: 600, color: 'text.secondary' }}>
                  Start Time
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <FormControl fullWidth required size="small">
                    <InputLabel>Hour</InputLabel>
                    <Select
                      value={shiftStartParsed.hour}
                      label="Hour"
                      onChange={(e) => handleShiftStartChange('hour', e.target.value)}
                    >
                      {HOURS.map((h) => (
                        <MenuItem key={h} value={h}>{h}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl fullWidth required size="small">
                    <InputLabel>Minute</InputLabel>
                    <Select
                      value={shiftStartParsed.minute}
                      label="Minute"
                      onChange={(e) => handleShiftStartChange('minute', e.target.value)}
                    >
                      {getMinuteOptions(shiftStartParsed.minute).map((m) => (
                        <MenuItem key={m} value={m}>{m}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl fullWidth required size="small">
                    <InputLabel>AM/PM</InputLabel>
                    <Select
                      value={shiftStartParsed.period}
                      label="AM/PM"
                      onChange={(e) => handleShiftStartChange('period', e.target.value)}
                    >
                      {PERIODS.map((p) => (
                        <MenuItem key={p} value={p}>{p}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              </Box>

              <Box>
                <Typography variant="caption" sx={{ display: 'block', mb: 1, fontWeight: 600, color: 'text.secondary' }}>
                  End Time
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <FormControl fullWidth required size="small">
                    <InputLabel>Hour</InputLabel>
                    <Select
                      value={shiftEndParsed.hour}
                      label="Hour"
                      onChange={(e) => handleShiftEndChange('hour', e.target.value)}
                    >
                      {HOURS.map((h) => (
                        <MenuItem key={h} value={h}>{h}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl fullWidth required size="small">
                    <InputLabel>Minute</InputLabel>
                    <Select
                      value={shiftEndParsed.minute}
                      label="Minute"
                      onChange={(e) => handleShiftEndChange('minute', e.target.value)}
                    >
                      {getMinuteOptions(shiftEndParsed.minute).map((m) => (
                        <MenuItem key={m} value={m}>{m}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl fullWidth required size="small">
                    <InputLabel>AM/PM</InputLabel>
                    <Select
                      value={shiftEndParsed.period}
                      label="AM/PM"
                      onChange={(e) => handleShiftEndChange('period', e.target.value)}
                    >
                      {PERIODS.map((p) => (
                        <MenuItem key={p} value={p}>{p}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              </Box>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField
                label="Capacity (Optional)"
                type="number"
                fullWidth
                value={shiftFormData.capacity ?? ''}
                onChange={(e) => setShiftFormData({ ...shiftFormData, capacity: e.target.value === '' ? '' : parseInt(e.target.value) })}
              />
              <TextField
                label="Monthly Price (₹)"
                type="number"
                fullWidth
                required
                value={shiftFormData.price ?? ''}
                onChange={(e) => setShiftFormData({ ...shiftFormData, price: e.target.value === '' ? '' : parseFloat(e.target.value) })}
              />
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField
                label="3-Month Price (₹) - Optional"
                type="number"
                fullWidth
                placeholder="Discounted price"
                value={shiftFormData.price3Months ?? ''}
                onChange={(e) => setShiftFormData({ ...shiftFormData, price3Months: e.target.value === '' ? '' : parseFloat(e.target.value) })}
              />
              <TextField
                label="6-Month Price (₹) - Optional"
                type="number"
                fullWidth
                placeholder="Discounted price"
                value={shiftFormData.price6Months ?? ''}
                onChange={(e) => setShiftFormData({ ...shiftFormData, price6Months: e.target.value === '' ? '' : parseFloat(e.target.value) })}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2.5, gap: '0.75rem' }}>
            <Button type="button" variant="text" onClick={() => setOpenShiftModal(false)}>Cancel</Button>
            <Button type="submit" variant="primary">
              Save Shift
            </Button>
          </DialogActions>
        </form>
      </Dialog>

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
