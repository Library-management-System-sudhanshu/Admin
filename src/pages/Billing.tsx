import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import {
  useGetPlansQuery,
  useGetPaymentsQuery,
  useGetCollectionReportQuery,
  useCreatePaymentMutation,
  useRecordManualPaymentMutation,
  useGetStudentsQuery,
  useGetShiftsQuery,
  useCreateShiftMutation,
  useUpdateShiftMutation,
  useDeleteShiftMutation,
} from '../store/api';
import { useToast } from '../components/ui/ToastContext';
import {
  Box,
  Typography,
  Card,
  CardContent,
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
import { Plus } from 'lucide-react';

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
  const { user } = useSelector((state: RootState) => state.auth);
  const [tab, setTab] = useState(0);

  const { data: plans, isLoading: plansLoading } = useGetPlansQuery(user?.workspaceId, { skip: !user?.workspaceId });
  const { data: payments, isLoading: paymentsLoading } = useGetPaymentsQuery({});
  const { data: report } = useGetCollectionReportQuery('monthly');
  const { data: studentsData } = useGetStudentsQuery({});

  const [openCollect, setOpenCollect] = useState(false);
  const [studentProfileId, setStudentProfileId] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'CASH' | 'UPI' | 'RAZORPAY'>('CASH');
  const [selectedPlanId, setSelectedPlanId] = useState('');

  // Toast
  const { showToast } = useToast();

  // Shifts API
  const { data: shifts, isLoading: shiftsLoading } = useGetShiftsQuery(user?.workspaceId, { skip: !user?.workspaceId });
  const [createShift] = useCreateShiftMutation();
  const [updateShift] = useUpdateShiftMutation();
  const [deleteShift] = useDeleteShiftMutation();

  const [openShiftModal, setOpenShiftModal] = useState(false);
  const [editShiftMode, setEditShiftMode] = useState(false);
  const [shiftFormData, setShiftFormData] = useState({ id: '', name: '', startTime: '09:00', endTime: '17:00', capacity: '' as any, price: 0 });

  const handleOpenCreateShift = () => {
    setEditShiftMode(false);
    setShiftFormData({ id: '', name: '', startTime: '09:00', endTime: '17:00', capacity: '' as any, price: 0 });
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
    setShiftFormData({ ...shift, capacity: shift.capacity ?? '' });
    setOpenShiftModal(true);
  };

  const handleSaveShift = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dataToSave = {
        ...shiftFormData,
        capacity: shiftFormData.capacity === '' || shiftFormData.capacity === null || shiftFormData.capacity === undefined ? null : parseInt(shiftFormData.capacity as any),
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
        subscriptionPlanId: selectedPlanId || undefined,
      }).unwrap();
      setOpenCollect(false);
      setStudentProfileId('');
      setAmount('');
      setSelectedPlanId('');
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
        <Tab label="Subscription Plans" />
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
                    {payments?.map((payment: any) => (
                      <TableRow key={payment.id} hover>
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
                                  <IconButton color="success" onClick={() => handleRecordManual(payment.id, 'CASH')}>
                                    <PaidIcon />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Record UPI Payment">
                                  <IconButton color="primary" onClick={() => handleRecordManual(payment.id, 'UPI')}>
                                    <PaidIcon />
                                  </IconButton>
                                </Tooltip>
                              </>
                            )}
                            {payment.invoiceUrl && (
                              <Tooltip title="Download Invoice">
                                <IconButton color="inherit" onClick={() => window.open(payment.invoiceUrl, '_blank')}>
                                  <InvoiceIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
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
                      <TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary' }}>
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

      {tab === 2 && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 3 }}>
          {plansLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5, width: '100%' }}>
              <CircularProgress />
            </Box>
          ) : (
            plans?.map((plan: any) => (
              <Card key={plan.id} sx={{ borderRadius: 2.5, border: '1px solid #E2E8F0', boxShadow: 'none' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A' }}>
                    {plan.name}
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: '#2563EB', mt: 2, mb: 1 }}>
                    ₹{plan.price}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Duration: {plan.durationDays} Days
                  </Typography>
                </CardContent>
              </Card>
            ))
          )}
        </Box>
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
              <InputLabel>Link Plan Package (Optional)</InputLabel>
              <Select
                value={selectedPlanId}
                label="Link Plan Package (Optional)"
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedPlanId(val);
                  const plan = plans?.find((p: any) => p.id === val);
                  if (plan) {
                    setAmount(plan.price.toString());
                  }
                }}
              >
                <MenuItem value="">Custom / None</MenuItem>
                {plans?.map((plan: any) => (
                  <MenuItem key={plan.id} value={plan.id}>
                    {plan.name} (₹{plan.price})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

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
            <Box sx={{ display: 'flex', gap: 2 }}>
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
                value={shiftFormData.price}
                onChange={(e) => setShiftFormData({ ...shiftFormData, price: parseFloat(e.target.value) || 0 })}
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
    </Box>
  );
}
