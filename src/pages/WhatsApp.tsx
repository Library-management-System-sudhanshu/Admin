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
  Button,
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
import { Send as SendIcon } from '@mui/icons-material';

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
  const [holidayDate, setHolidayDate] = useState('');
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
          holidayDate,
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
      setHolidayDate('');
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
    preview = preview.replace('{{branchName}}', 'Main Branch');
    preview = preview.replace('{{holidayDate}}', holidayDate || '______');
    preview = preview.replace('{{reason}}', reason || '______');
    preview = preview.replace('{{message}}', customMsg || '______');
    return preview;
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, color: '#0F172A', mb: 4 }}>
        WhatsApp Communications
      </Typography>

      <Tabs value={tab} onChange={(_, val) => setTab(val)} sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
        <Tab label="Broadcast Console" />
        <Tab label="Dispatch Logs" />
      </Tabs>

      {tab === 0 && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 4 }}>
          <Card sx={{ p: 3, borderRadius: 2.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Configure Campaign
            </Typography>
            {templatesLoading ? (
              <CircularProgress />
            ) : (
              <form onSubmit={handleSend}>
                <FormControl fullWidth required sx={{ mb: 3 }}>
                  <InputLabel>Select Template</InputLabel>
                  <Select
                    value={selectedTemplateId}
                    label="Select Template"
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                  >
                    {templates?.map((t: any) => (
                      <MenuItem key={t.id} value={t.id}>
                        {t.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Group Filters */}
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: '#475569' }}>
                  Target Filters (Optional)
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Filter by Branch</InputLabel>
                    <Select value={branchId} label="Filter by Branch" onChange={(e) => setBranchId(e.target.value)}>
                      <MenuItem value="">All Branches</MenuItem>
                      {branches?.map((b: any) => (
                        <MenuItem key={b.id} value={b.id}>
                          {b.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl fullWidth size="small">
                    <InputLabel>Filter by Shift</InputLabel>
                    <Select value={shiftId} label="Filter by Shift" onChange={(e) => setShiftId(e.target.value)}>
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
                    <TextField label="Outstanding Amount" fullWidth size="small" value={amount} onChange={(e) => setAmount(e.target.value)} />
                    <TextField label="Due Date" fullWidth size="small" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                  </Box>
                )}

                {selectedTemplateId === 'holiday_notice' && (
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
                    <TextField label="Holiday Date" fullWidth size="small" value={holidayDate} onChange={(e) => setHolidayDate(e.target.value)} />
                    <TextField label="Reason" fullWidth size="small" value={reason} onChange={(e) => setReason(e.target.value)} />
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
                    sx={{ mb: 3 }}
                  />
                )}

                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<SendIcon />}
                  disabled={isSending || !selectedTemplateId}
                  fullWidth
                  size="large"
                >
                  Send Campaign Broadcast
                </Button>
              </form>
            )}
          </Card>

          {/* Message Preview */}
          <Card sx={{ p: 3, borderRadius: 2.5, bgcolor: '#DCF8C6', minHeight: 280, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="subtitle2" sx={{ color: '#075E54', fontWeight: 700, mb: 2 }}>
              WhatsApp Message Preview
            </Typography>
            <Paper sx={{ p: 2, borderRadius: 2.5, maxWidth: '90%', alignSelf: 'flex-start', bgcolor: '#FFFFFF', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {selectedTemplateId ? getTemplateTextPreview() : 'Please select a template to preview the message...'}
              </Typography>
            </Paper>
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
            <TableContainer component={Paper} sx={{ borderRadius: 2.5, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Recipient Mobile</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Message Content</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Sent Date</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Delivery Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logs?.map((log: any) => (
                    <TableRow key={log.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{log.recipient}</TableCell>
                      <TableCell sx={{ maxWidth: 400, fontSize: '0.85rem' }}>{log.message}</TableCell>
                      <TableCell sx={{ fontSize: '0.85rem' }}>{new Date(log.sentAt).toLocaleString()}</TableCell>
                      <TableCell>
                        <Chip label={log.status} size="small" color="success" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}
    </Box>
  );
}
