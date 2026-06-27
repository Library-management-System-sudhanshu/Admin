import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import {
  useGetWhatsAppTemplatesQuery,
  useSendWhatsAppBroadcastMutation,
  useGetWhatsAppLogsQuery,
  useGetBranchesQuery,
  useGetShiftsQuery,
} from '../store/api';
import {
  Box,
  Typography,
  Card,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
} from '@mui/material';
import { Button } from '../components/ui/Button';
import { Send } from 'lucide-react';

const inputStyle = {
  '& .MuiOutlinedInput-root': {
    color: 'var(--text-primary)',
    backgroundColor: 'var(--bg-surface)',
    '& fieldset': {
      borderColor: 'var(--border-color)',
    },
    '&:hover fieldset': {
      borderColor: 'var(--primary)',
    },
    '&.Mui-focused fieldset': {
      borderColor: 'var(--primary)',
    },
  },
  '& .MuiInputLabel-root': {
    color: 'var(--text-secondary)',
    '&.Mui-focused': {
      color: 'var(--primary)',
    }
  },
  '& .MuiSelect-select': {
    color: 'var(--text-primary)',
  },
  '& .MuiMenuItem-root': {
    color: 'var(--text-primary)',
    backgroundColor: 'var(--bg-surface)',
  }
};

export default function WhatsApp() {
  const { user } = useSelector((state: RootState) => state.auth);
  const [tab, setTab] = useState(0);

  const { data: templates, isLoading: templatesLoading } = useGetWhatsAppTemplatesQuery({});
  const { data: logs, isLoading: logsLoading } = useGetWhatsAppLogsQuery({});
  const { data: branches } = useGetBranchesQuery(user?.workspaceId, { skip: !user?.workspaceId });
  const { data: shifts } = useGetShiftsQuery(user?.workspaceId, { skip: !user?.workspaceId });

  const [sendBroadcast, { isLoading: isSending }] = useSendWhatsAppBroadcastMutation();

  // Selected config
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [shiftId, setShiftId] = useState('');

  // Custom variables
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [seatNumber, setSeatNumber] = useState('');
  const [holidayDate, setHolidayDate] = useState('');
  const [resumeDate, setResumeDate] = useState('');
  const [reason, setReason] = useState('');
  const [customMsg, setCustomMsg] = useState('');

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplateId) return;

    try {
      await sendBroadcast({
        templateId: selectedTemplateId,
        customVariables: {
          amount,
          dueDate,
          endDate,
          seatNumber,
          holidayDate,
          resumeDate,
          reason,
          message: customMsg,
        },
        filters: {
          branchId: branchId || undefined,
          shiftId: shiftId || undefined,
        },
      }).unwrap();
      alert('Broadcast dispatch triggered successfully!');
      // Reset variables
      setAmount('');
      setDueDate('');
      setEndDate('');
      setSeatNumber('');
      setHolidayDate('');
      setResumeDate('');
      setReason('');
      setCustomMsg('');
    } catch (err) {
      alert('Broadcast failed');
    }
  };

  const getTemplateTextPreview = () => {
    const t = templates?.find((x: any) => x.id === selectedTemplateId);
    if (!t) return '';
    let preview = t.text;
    preview = preview.replace('{{studentName}}', 'John Doe');
    preview = preview.replace('{{amount}}', amount || '______');
    preview = preview.replace('{{dueDate}}', dueDate || '______');
    preview = preview.replace('{{endDate}}', endDate || '______');
    preview = preview.replace('{{seatNumber}}', seatNumber || '______');
    preview = preview.replace('{{branchName}}', 'Main Branch');
    preview = preview.replace('{{holidayDate}}', holidayDate || '______');
    preview = preview.replace('{{resumeDate}}', resumeDate || '______');
    preview = preview.replace('{{reason}}', reason || '______');
    preview = preview.replace('{{message}}', customMsg || '______');
    return preview;
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, color: 'var(--text-primary)', mb: 4 }}>
        WhatsApp Communications
      </Typography>

      <Tabs 
        value={tab} 
        onChange={(_, val) => setTab(val)} 
        sx={{ 
          borderBottom: 1, 
          borderColor: 'var(--border-color)', 
          mb: 4,
          '& .MuiTabs-indicator': { bgcolor: 'var(--primary)' }
        }}
      >
        <Tab label="Broadcast Console" sx={{ color: 'var(--text-secondary)', '&.Mui-selected': { color: 'var(--primary)' } }} />
        <Tab label="Dispatch Logs" sx={{ color: 'var(--text-secondary)', '&.Mui-selected': { color: 'var(--primary)' } }} />
        <Tab label="Automated Reminders" sx={{ color: 'var(--text-secondary)', '&.Mui-selected': { color: 'var(--primary)' } }} />
      </Tabs>

      {tab === 0 && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.25fr 1fr' }, gap: 4, alignItems: 'start' }}>
          <Card sx={{ p: 3, borderRadius: 2.5, bgcolor: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', boxShadow: 'none' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Configure Campaign
            </Typography>
            {templatesLoading ? (
              <CircularProgress />
            ) : (
              <form onSubmit={handleSend}>
                <FormControl fullWidth required size="small" sx={{ mb: 3, ...inputStyle }}>
                  <InputLabel id="template-select-label">Select Template</InputLabel>
                  <Select
                    labelId="template-select-label"
                    value={selectedTemplateId}
                    label="Select Template"
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          bgcolor: 'var(--bg-surface)',
                          border: '1px solid var(--border-color)',
                          '& .MuiMenuItem-root': {
                            color: 'var(--text-primary)',
                            '&:hover': { bgcolor: 'var(--bg-surface-hover)' },
                            '&.Mui-selected': { bgcolor: 'var(--primary-light)', color: 'var(--primary)' }
                          }
                        }
                      }
                    } as any}
                  >
                    {templates?.map((t: any) => (
                      <MenuItem key={t.id} value={t.id}>
                        {t.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Group Filters */}
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: 'var(--text-secondary)' }}>
                  Target Filters (Optional)
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
                  <FormControl fullWidth size="small" sx={inputStyle}>
                    <InputLabel id="branch-select-label">Filter by Branch</InputLabel>
                    <Select 
                      labelId="branch-select-label"
                      value={branchId} 
                      label="Filter by Branch" 
                      onChange={(e) => setBranchId(e.target.value)}
                      MenuProps={{
                        PaperProps: {
                          sx: {
                            bgcolor: 'var(--bg-surface)',
                            border: '1px solid var(--border-color)',
                            '& .MuiMenuItem-root': {
                              color: 'var(--text-primary)',
                              '&:hover': { bgcolor: 'var(--bg-surface-hover)' }
                            }
                          }
                        }
                      } as any}
                    >
                      <MenuItem value="">All Branches</MenuItem>
                      {branches?.map((b: any) => (
                        <MenuItem key={b.id} value={b.id}>
                          {b.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl fullWidth size="small" sx={inputStyle}>
                    <InputLabel id="shift-select-label">Filter by Shift</InputLabel>
                    <Select 
                      labelId="shift-select-label"
                      value={shiftId} 
                      label="Filter by Shift" 
                      onChange={(e) => setShiftId(e.target.value)}
                      MenuProps={{
                        PaperProps: {
                          sx: {
                            bgcolor: 'var(--bg-surface)',
                            border: '1px solid var(--border-color)',
                            '& .MuiMenuItem-root': {
                              color: 'var(--text-primary)',
                              '&:hover': { bgcolor: 'var(--bg-surface-hover)' }
                            }
                          }
                        }
                      } as any}
                    >
                      <MenuItem value="">All Shifts</MenuItem>
                      {shifts?.map((s: any) => (
                        <MenuItem key={s.id} value={s.id}>
                          {s.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                {/* Variables depending on templates */}
                {selectedTemplateId === 'fee_reminder' && (
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
                    <TextField sx={inputStyle} label="Outstanding Amount" fullWidth size="small" value={amount} onChange={(e) => setAmount(e.target.value)} />
                    <TextField 
                      sx={inputStyle as any} 
                      label="Due Date" 
                      type="date" 
                      fullWidth 
                      size="small" 
                      slotProps={{ inputLabel: { shrink: true } } as any} 
                      value={dueDate} 
                      onChange={(e) => setDueDate(e.target.value)} 
                    />
                  </Box>
                )}

                {selectedTemplateId === 'renewal_reminder' && (
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
                    <TextField 
                      sx={inputStyle as any} 
                      label="Expiry End Date" 
                      type="date" 
                      fullWidth 
                      size="small" 
                      slotProps={{ inputLabel: { shrink: true } } as any} 
                      value={endDate} 
                      onChange={(e) => setEndDate(e.target.value)} 
                    />
                    <TextField sx={inputStyle} label="Seat Number" fullWidth size="small" value={seatNumber} onChange={(e) => setSeatNumber(e.target.value)} />
                  </Box>
                )}

                {selectedTemplateId === 'holiday_notice' && (
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, mb: 3 }}>
                    <TextField 
                      sx={inputStyle as any} 
                      label="Holiday Date" 
                      type="date" 
                      fullWidth 
                      size="small" 
                      slotProps={{ inputLabel: { shrink: true } } as any} 
                      value={holidayDate} 
                      onChange={(e) => setHolidayDate(e.target.value)} 
                    />
                    <TextField 
                      sx={inputStyle as any} 
                      label="Resume Date" 
                      type="date" 
                      fullWidth 
                      size="small" 
                      slotProps={{ inputLabel: { shrink: true } } as any} 
                      value={resumeDate} 
                      onChange={(e) => setResumeDate(e.target.value)} 
                    />
                    <TextField sx={inputStyle} label="Reason" fullWidth size="small" value={reason} onChange={(e) => setReason(e.target.value)} />
                  </Box>
                )}

                {selectedTemplateId === 'general_notice' && (
                  <TextField
                    label="Announcement Message"
                    fullWidth
                    multiline
                    rows={3}
                    value={customMsg}
                    onChange={(e) => setCustomMsg(e.target.value)}
                    sx={{ mb: 3, ...inputStyle }}
                  />
                )}

                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isSending}
                  disabled={!selectedTemplateId}
                  fullWidth
                  style={{ 
                    padding: '12px 0', 
                    borderRadius: '10px', 
                    backgroundColor: 'var(--accent-blue)',
                    borderColor: 'var(--accent-blue)',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <Send size={16} /> Send Campaign Broadcast
                </Button>
              </form>
            )}
          </Card>

          {/* Message Preview (Mock Mobile Screen) */}
          <Card 
            sx={{ 
              borderRadius: 3, 
              border: '1px solid var(--border-color)', 
              boxShadow: 'var(--shadow-md)',
              overflow: 'hidden', 
              display: 'flex', 
              flexDirection: 'column',
              height: '100%',
              minHeight: 380,
              bgcolor: 'var(--bg-surface)'
            }}
          >
            {/* WhatsApp Header */}
            <Box sx={{ bgcolor: '#075E54', px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: '#128C7E', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '1rem' }}>
                SF
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 600, lineHeight: 1.2 }}>
                  StudyFlow Broadcast
                </Typography>
                <Typography variant="caption" sx={{ color: '#85E3B2', fontSize: '0.75rem' }}>
                  online
                </Typography>
              </Box>
            </Box>

            {/* Chat Body */}
            <Box 
              sx={{ 
                flex: 1, 
                bgcolor: '#efeae2', 
                p: 2, 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'flex-start',
                gap: 1.5,
                backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")',
                backgroundSize: 'cover',
              }}
            >
              {/* WhatsApp Chat Bubble */}
              <Box 
                sx={{ 
                  alignSelf: 'flex-end', 
                  maxWidth: '85%', 
                  bgcolor: '#d9fdd3', 
                  color: '#303030',
                  p: 1.5, 
                  borderRadius: '8px 0px 8px 8px',
                  boxShadow: '0 1px 0.5px rgba(0,0,0,0.13)',
                  position: 'relative',
                  mb: 1
                }}
              >
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', fontSize: '0.875rem', pr: 4, pb: 1, color: '#303030' }}>
                  {selectedTemplateId ? getTemplateTextPreview() : 'Please select a template to preview the message...'}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.25, position: 'absolute', bottom: 4, right: 6 }}>
                  <Typography variant="caption" sx={{ fontSize: '0.65rem', color: '#667781' }}>
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Typography>
                  <svg width="16" height="11" viewBox="0 0 16 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4.5 9.5L1.5 6.5L0.5 7.5L4.5 11.5L13 3L12 2L4.5 9.5Z" fill="#53bdeb"/>
                    <path d="M7.5 9.5L9.5 7.5L8.5 6.5L7.5 7.5L7.5 9.5Z" fill="#53bdeb"/>
                    <path d="M15 3L14 2L9.5 6.5L10.5 7.5L15 3Z" fill="#53bdeb"/>
                  </svg>
                </Box>
              </Box>
            </Box>
          </Card>
        </Box>
      )}

      {tab === 1 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {logsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper} sx={{ borderRadius: 2.5, bgcolor: 'var(--bg-surface)', border: '1px solid var(--border-color)', boxShadow: 'none' }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'var(--bg-surface-hover)' }}>
                    <TableCell sx={{ fontWeight: 600, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)' }}>Recipient Mobile</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)' }}>Message Content</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)' }}>Sent Date</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)' }}>Delivery Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logs?.map((log: any) => (
                    <TableRow key={log.id} hover sx={{ '&:hover': { bgcolor: 'var(--bg-surface-hover) !important' } }}>
                      <TableCell sx={{ fontWeight: 600, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)' }}>{log.recipient}</TableCell>
                      <TableCell sx={{ maxWidth: 400, fontSize: '0.85rem', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)' }}>{log.message}</TableCell>
                      <TableCell sx={{ fontSize: '0.85rem', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)' }}>{new Date(log.sentAt).toLocaleString()}</TableCell>
                      <TableCell sx={{ borderBottom: '1px solid var(--border-color)' }}>
                        <Chip 
                          label={log.status} 
                          size="small" 
                          color={log.status === 'SENT' || log.status === 'SUCCESS' ? 'success' : 'error'} 
                          variant="outlined" 
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}

      {tab === 2 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 800 }}>
          <Card sx={{ p: 4, borderRadius: 3, bgcolor: 'var(--bg-surface)', border: '1px solid var(--border-color)', boxShadow: 'none' }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: 'var(--text-primary)' }}>
              Scheduled Automations
            </Typography>
            <Typography variant="body1" sx={{ color: 'var(--text-secondary)', mb: 4 }}>
              StudyFlow automatically monitors student subscriptions and fee payments in the background to send necessary WhatsApp reminders.
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Fee Reminder Status */}
              <Box sx={{ p: 3, border: '1px solid var(--border-color)', borderRadius: 2, bgcolor: 'var(--bg-surface-hover)' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>Fee Due Reminders</Typography>
                  <Chip label="Active" color="success" size="small" />
                </Box>
                <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                  Sends a friendly WhatsApp message 2 days before a student's unpaid fee is due.
                </Typography>
              </Box>

              {/* Renewal Status */}
              <Box sx={{ p: 3, border: '1px solid var(--border-color)', borderRadius: 2, bgcolor: 'var(--bg-surface-hover)' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>Plan Renewal Alerts</Typography>
                  <Chip label="Active" color="success" size="small" />
                </Box>
                <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                  Sends an alert 3 days before a student's subscription plan expires, encouraging them to renew their seat.
                </Typography>
              </Box>
            </Box>

            <Box sx={{ mt: 4, p: 2, bgcolor: 'var(--primary-light)', borderRadius: 2, display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <Typography variant="body2" sx={{ color: 'var(--primary-dark)', fontWeight: 500 }}>
                💡 These reminders run automatically every day at 09:00 AM server time. Ensure student profiles have valid mobile numbers configured.
              </Typography>
            </Box>
          </Card>
        </Box>
      )}
    </Box>
  );
}
