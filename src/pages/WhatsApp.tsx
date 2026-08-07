import {
  useGetWhatsAppTemplatesQuery,
  useCreateWhatsAppTemplateMutation,
  useSendWhatsAppBroadcastMutation,
  useGetWhatsAppLogsQuery,
  useGetBranchesQuery,
  useGetShiftsQuery,
  useGetStudentsQuery,
} from '../store/api';
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import { DatePicker } from '../components/ui/DatePicker';
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


const WHATSAPP_WINDOW_NAME = 'StudyFlowWhatsAppWindow';

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
  const [branchId, setBranchId] = useState('ALL');
  const [shiftId, setShiftId] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Custom variables
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [seatNumber, setSeatNumber] = useState('');
  const [holidayDate, setHolidayDate] = useState('');
  const [resumeDate, setResumeDate] = useState('');
  const [reason, setReason] = useState('');
  const [customMsg, setCustomMsg] = useState('');

  // Dynamic template creation states
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateText, setNewTemplateText] = useState('');
  const [customVars, setCustomVars] = useState<Record<string, string>>({});

  const [createTemplate, { isLoading: isCreatingTemplate }] = useCreateWhatsAppTemplateMutation();

  // Fetch students triggers & state
  const [fetchTrigger, setFetchTrigger] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Record<string, boolean>>({});

  const { data: studentsData, isFetching: isFetchingStudents, refetch: refetchStudents } = useGetStudentsQuery({
    branchId: branchId === 'ALL' ? undefined : branchId,
    filterShiftId: shiftId === 'ALL' ? undefined : shiftId,
    filterExpiration: statusFilter === 'ALL' ? undefined : statusFilter,
    limit: 1000,
  }, { skip: !fetchTrigger });

  useEffect(() => {
    if (studentsData?.students) {
      const selection: Record<string, boolean> = {};
      studentsData.students.forEach((s: any) => {
        selection[s.id] = true;
      });
      setSelectedStudentIds(selection);
    }
  }, [studentsData]);

  const handleFetch = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!fetchTrigger) {
      setFetchTrigger(true);
    } else {
      refetchStudents();
    }
  };


  const getStudentMessagePreview = (student: any) => {
    const t = templates?.find((x: any) => x.id === selectedTemplateId);
    if (!t) return '';
    let preview = t.text;
    preview = preview.replace('{{studentName}}', student.user?.name || 'Student');
    preview = preview.replace('{{amount}}', amount || '______');
    preview = preview.replace('{{dueDate}}', dueDate || '______');
    preview = preview.replace('{{endDate}}', endDate || '______');
    preview = preview.replace('{{seatNumber}}', seatNumber || '______');
    preview = preview.replace('{{branchName}}', student.branch?.name || '______');
    preview = preview.replace('{{holidayDate}}', holidayDate || '______');
    preview = preview.replace('{{resumeDate}}', resumeDate || '______');
    preview = preview.replace('{{reason}}', reason || '______');
    preview = preview.replace('{{message}}', customMsg || '______');

    const vars = extractTemplateVariables(t.text);
    vars.forEach((v) => {
      const val = customVars[v] || '______';
      preview = preview.replace(new RegExp(`\\{\\{${v}\\}\\}`, 'g'), val);
    });

    return preview;
  };

  const handleSendIndividual = (student: any) => {
    const message = getStudentMessagePreview(student);
    let phone = student.user?.mobile ? student.user.mobile.replace(/\D/g, '') : '';

    if (!phone) {
      alert('This student has no mobile number on file.');
      return;
    }
    if (phone.length === 10) {
      phone = '91' + phone;
    }

    const url = `https://web.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`;

    // Specifying window features (width, height) opens a dedicated popup window
    // which modern browsers reuse reliably under the same window name.
    const win = window.open(url, WHATSAPP_WINDOW_NAME, 'width=1000,height=750,resizable=yes,scrollbars=yes');

    if (win) {
      win.focus();
    } else {
      alert('Popup blocked — please allow popups for this site to send via WhatsApp Web.');
    }
  };




  const extractTemplateVariables = (text: string) => {
    if (!text) return [];
    const matches = text.match(/\{\{([^}]+)\}\}/g);
    if (!matches) return [];
    const standard = ['studentName', 'amount', 'dueDate', 'endDate', 'seatNumber', 'branchName', 'holidayDate', 'resumeDate', 'reason', 'message'];
    return matches
      .map(m => m.replace(/\{\{|\}\}/g, '').trim())
      .filter(v => !standard.includes(v));
  };

  const handleCreateTemplateSubmit = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!newTemplateName.trim() || !newTemplateText.trim()) {
      alert('Please fill out all fields.');
      return;
    }

    try {
      await createTemplate({
        name: newTemplateName,
        text: newTemplateText,
      }).unwrap();

      alert('Custom template created successfully!');
      setIsTemplateModalOpen(false);
      setNewTemplateName('');
      setNewTemplateText('');
    } catch (err: any) {
      alert(err?.data?.message || 'Failed to create template');
    }
  };

  const handleSend = async (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault();
    if (!selectedTemplateId) return;

    const selectedIds = Object.keys(selectedStudentIds).filter((key) => selectedStudentIds[key]);
    if (selectedIds.length === 0) {
      alert('Please select at least one student.');
      return;
    }

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
          ...customVars,
        },
        filters: {
          branchId: branchId === 'ALL' ? undefined : (branchId || undefined),
          shiftId: shiftId === 'ALL' ? undefined : (shiftId || undefined),
          status: statusFilter === 'ALL' ? undefined : statusFilter,
        },
        studentIds: selectedIds,
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
      setCustomVars({});
      setFetchTrigger(false);
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
    
    // Dynamic custom variables
    const vars = extractTemplateVariables(t.text);
    vars.forEach((v) => {
      const val = customVars[v] || '______';
      preview = preview.replace(new RegExp(`\\{\\{${v}\\}\\}`, 'g'), val);
    });
    
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
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.25fr 1fr' }, gap: 4, alignItems: 'start' }}>
            <Card sx={{ p: 3, borderRadius: 2.5, bgcolor: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', boxShadow: 'none' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Configure Campaign
            </Typography>
            {templatesLoading ? (
              <CircularProgress />
            ) : (
              <form onSubmit={handleSend}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '24px' }}>
                  <FormControl fullWidth required size="small" sx={{ ...inputStyle, marginBottom: 0 }}>
                    <InputLabel id="template-select-label">Select Template</InputLabel>
                    <Select
                      labelId="template-select-label"
                      value={selectedTemplateId}
                      label="Select Template"
                      onChange={(e) => {
                        setSelectedTemplateId(e.target.value);
                        setCustomVars({});
                      }}
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
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsTemplateModalOpen(true)}
                    style={{
                      whiteSpace: 'nowrap',
                      height: '40px',
                      padding: '0 16px',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    + New Template
                  </Button>
                </div>

                {/* Group Filters */}
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: 'var(--text-secondary)' }}>
                  Target Filters (Optional)
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2, mb: 3 }}>
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
                      <MenuItem value="ALL">All Branches</MenuItem>
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
                      <MenuItem value="ALL">All Shifts</MenuItem>
                      {shifts?.map((s: any) => (
                        <MenuItem key={s.id} value={s.id}>
                          {s.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl fullWidth size="small" sx={inputStyle}>
                    <InputLabel id="status-select-label">Filter by Status</InputLabel>
                    <Select 
                      labelId="status-select-label"
                      value={statusFilter} 
                      label="Filter by Status" 
                      onChange={(e) => setStatusFilter(e.target.value)}
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
                      <MenuItem value="ALL">All Statuses</MenuItem>
                      <MenuItem value="ACTIVE">Active Subscription</MenuItem>
                      <MenuItem value="EXPIRING_SOON">Expiring Soon (Next 7 Days)</MenuItem>
                      <MenuItem value="EXPIRED">Expired Subscription</MenuItem>
                      <MenuItem value="NO_SEAT">No Seat Allocated</MenuItem>
                    </Select>
                  </FormControl>
                </Box>



                {selectedTemplateId === 'renewal_reminder' && (
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
                    <DatePicker 
                      label="Expiry End Date" 
                      value={endDate} 
                      onChange={(val) => setEndDate(val)} 
                    />
                    <TextField sx={inputStyle} label="Seat Number" fullWidth size="small" value={seatNumber} onChange={(e) => setSeatNumber(e.target.value)} />
                  </Box>
                )}

                {selectedTemplateId === 'holiday_notice' && (
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, mb: 3 }}>
                    <DatePicker 
                      label="Holiday Date" 
                      value={holidayDate} 
                      onChange={(val) => setHolidayDate(val)} 
                    />
                    <DatePicker 
                      label="Resume Date" 
                      value={resumeDate} 
                      onChange={(val) => setResumeDate(val)} 
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

                {/* Dynamic Variables Inputs for Custom Templates */}
                {(() => {
                  const t = templates?.find((x: any) => x.id === selectedTemplateId);
                  if (!t) return null;
                  const vars = extractTemplateVariables(t.text);
                  if (vars.length === 0) return null;
                  return (
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
                      {vars.map((v) => (
                        <TextField
                          key={v}
                          sx={inputStyle}
                          label={`Variable: ${v}`}
                          fullWidth
                          size="small"
                          value={customVars[v] || ''}
                          onChange={(e) => setCustomVars({ ...customVars, [v]: e.target.value })}
                        />
                      ))}
                    </Box>
                  );
                })()}

                {/* Single Fetch / Re-Fetch Action */}
                <Button
                  type="button"
                  onClick={handleFetch}
                  variant="primary"
                  isLoading={isFetchingStudents}
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
                  }}
                >
                  {studentsData ? 'Re-Fetch Matching Students' : 'Fetch Students'}
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

        {/* Matching Students List Table Card */}
        {studentsData && studentsData.students && (
          <Card sx={{ p: 3, borderRadius: 2.5, bgcolor: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', boxShadow: 'none' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Matching Students List ({studentsData.students.length})
                </Typography>
                <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
                  Select which students will receive the broadcast message.
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const sel: Record<string, boolean> = {};
                    studentsData.students.forEach((s: any) => { sel[s.id] = true; });
                    setSelectedStudentIds(sel);
                  }}
                  style={{ borderRadius: '8px', padding: '6px 14px', fontSize: '0.85rem' }}
                >
                  Select All
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedStudentIds({})}
                  style={{ borderRadius: '8px', padding: '6px 14px', fontSize: '0.85rem' }}
                >
                  Clear All
                </Button>
              </Box>
            </Box>

            <TableContainer component={Paper} sx={{ borderRadius: 2, bgcolor: 'var(--bg-surface)', border: '1px solid var(--border-color)', boxShadow: 'none', mb: 3 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'var(--bg-surface-hover)' }}>
                    <TableCell align="center" sx={{ width: 50, borderBottom: '1px solid var(--border-color)' }}>Select</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)' }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)' }}>Mobile</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)' }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)' }}>Branch</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)' }}>Message Preview</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)' }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {studentsData.students.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 3, color: 'var(--text-secondary)' }}>
                        No students match the selected filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    studentsData.students.map((s: any) => {
                      const isSelected = !!selectedStudentIds[s.id];
                      const activeSub = s.subscriptions?.find((sub: any) => sub.status === 'ACTIVE');
                      const statusText = activeSub ? 'Active' : s.subscriptions?.length > 0 ? 'Expired' : 'No Plan';
                      const statusColor = activeSub ? 'success' : s.subscriptions?.length > 0 ? 'error' : 'default';

                      return (
                        <TableRow key={s.id} hover sx={{ '&:hover': { bgcolor: 'var(--bg-surface-hover) !important' } }}>
                          <TableCell align="center" sx={{ borderBottom: '1px solid var(--border-color)' }}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => setSelectedStudentIds({ ...selectedStudentIds, [s.id]: !isSelected })}
                              style={{ cursor: 'pointer' }}
                            />
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)' }}>{s.user?.name}</TableCell>
                          <TableCell sx={{ fontSize: '0.85rem', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)' }}>{s.user?.mobile || 'N/A'}</TableCell>
                          <TableCell sx={{ fontSize: '0.85rem', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)' }}>{s.user?.email || 'N/A'}</TableCell>
                          <TableCell sx={{ fontSize: '0.85rem', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)' }}>{s.branch?.name || 'N/A'}</TableCell>
                          <TableCell sx={{ borderBottom: '1px solid var(--border-color)' }}>
                            <Chip 
                              label={statusText} 
                              size="small" 
                              color={statusColor as any} 
                              variant="outlined" 
                            />
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.8rem', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)', maxWidth: 280, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={getStudentMessagePreview(s)}>
                            {selectedTemplateId ? getStudentMessagePreview(s) : '(No Template Selected)'}
                          </TableCell>
                          <TableCell align="center" sx={{ borderBottom: '1px solid var(--border-color)' }}>
                            <Button
                              type="button"
                              size="sm"
                              variant="primary"
                              onClick={() => handleSendIndividual(s)}
                              disabled={isSending || !selectedTemplateId}
                              style={{
                                padding: '4px 12px',
                                fontSize: '0.75rem',
                                borderRadius: '6px',
                                minWidth: '70px',
                                backgroundColor: 'var(--primary)',
                                borderColor: 'var(--primary)',
                              }}
                            >
                              Send
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 3 }}>
              <button
                type="button"
                onClick={handleFetch}
                disabled={isFetchingStudents}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {isFetchingStudents ? 'Re-fetching...' : 'Re-Fetch Students List'}
              </button>
              <Button
                type="button"
                onClick={(e) => handleSend(e)}
                variant="primary"
                isLoading={isSending}
                disabled={Object.values(selectedStudentIds).filter(Boolean).length === 0}
                style={{ 
                  padding: '10px 24px', 
                  borderRadius: '8px', 
                  backgroundColor: 'var(--accent-blue)',
                  borderColor: 'var(--accent-blue)',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <Send size={16} /> Send Campaign Broadcast ({Object.values(selectedStudentIds).filter(Boolean).length} Selected)
              </Button>
            </Box>
          </Card>
        )}
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

      {/* Custom WhatsApp Template Popup Dialog */}
      {isTemplateModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999999,
          padding: '16px'
        }}>
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '480px',
            padding: '24px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div>
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Create Custom WhatsApp Template
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: 'var(--text-secondary)' }}>
                Define placeholders like {"{{amount}}"} or {"{{dueDate}}"} to map variables. Keep {"{{studentName}}"} for student name.
              </Typography>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <TextField
                label="Template Name"
                required
                placeholder="e.g. Fee Overdue Alert"
                fullWidth
                size="small"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                sx={inputStyle}
              />

              <TextField
                label="Template Body Text"
                required
                placeholder="Hello {{studentName}}, please pay your fee of {{amount}} by {{dueDate}}. Thanks!"
                fullWidth
                multiline
                rows={4}
                value={newTemplateText}
                onChange={(e) => setNewTemplateText(e.target.value)}
                sx={inputStyle}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsTemplateModalOpen(false);
                  setNewTemplateName('');
                  setNewTemplateText('');
                }}
                style={{ borderRadius: '8px', padding: '6px 16px', fontSize: '0.85rem' }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                disabled={isCreatingTemplate}
                onClick={handleCreateTemplateSubmit}
                style={{ borderRadius: '8px', padding: '6px 16px', fontSize: '0.85rem' }}
              >
                {isCreatingTemplate ? 'Creating...' : 'Create Template'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Box>
  );
}
