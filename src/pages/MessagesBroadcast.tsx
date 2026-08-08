import {
  useGetWhatsAppTemplatesQuery,
  useCreateWhatsAppTemplateMutation,
  useSendWhatsAppBroadcastMutation,
  useGetWhatsAppLogsQuery,
  useSendSmsBroadcastMutation,
  useGetSmsLogsQuery,
  useSendEmailBroadcastMutation,
  useGetEmailLogsQuery,
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
} from '@mui/material';
import { Button } from '../components/ui/Button';
import { Send, MessageCircle, Smartphone, Mail, Megaphone, ChevronRight } from 'lucide-react';

/* ─── Shared Styles ─── */
const inputStyle = {
  '& .MuiOutlinedInput-root': {
    color: 'var(--text-primary)',
    backgroundColor: 'var(--bg-surface)',
    '& fieldset': { borderColor: 'var(--border-color)' },
    '&:hover fieldset': { borderColor: 'var(--primary)' },
    '&.Mui-focused fieldset': { borderColor: 'var(--primary)' },
  },
  '& .MuiInputLabel-root': {
    color: 'var(--text-secondary)',
    '&.Mui-focused': { color: 'var(--primary)' },
  },
  '& .MuiSelect-select': { color: 'var(--text-primary)' },
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

/* ─── Channel Config ─── */
const channels = [
  { key: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, color: '#25D366', lightBg: 'rgba(37,211,102,0.08)' },
  { key: 'sms', label: 'SMS', icon: Smartphone, color: '#6366f1', lightBg: 'rgba(99,102,241,0.08)' },
  { key: 'email', label: 'Email', icon: Mail, color: '#f43f5e', lightBg: 'rgba(244,63,94,0.08)' },
] as const;

type ChannelKey = typeof channels[number]['key'];

const WHATSAPP_WINDOW_NAME = 'StudyFlowWhatsAppWindow';

const PREDEFINED_EMAIL_TEMPLATES = [
  {
    id: 'fee_reminder',
    name: 'Fee Payment Reminder',
    subject: 'Fee Payment Reminder - StudyFlow',
    body: `<div style="font-family: Arial, sans-serif; padding: 20px; color: #333; line-height: 1.6;">
  <h2 style="color: #2563eb; margin-top: 0;">Fee Payment Reminder</h2>
  <p>Dear <strong>{{studentName}}</strong>,</p>
  <p>This is a friendly reminder that your subscription fee for <strong>{{branchName}}</strong> is due soon.</p>
  <p>Please clear your pending dues at the desk counter or via our portal to ensure your seat remains reserved without interruption.</p>
  <br/>
  <p style="margin-bottom: 0;">Best regards,<br/><strong>Team StudyFlow</strong></p>
</div>`,
  },
  {
    id: 'renewal_alert',
    name: 'Subscription Expiry & Renewal Alert',
    subject: 'Your Study Hall Seat Subscription is Expiring Soon',
    body: `<div style="font-family: Arial, sans-serif; padding: 20px; color: #333; line-height: 1.6;">
  <h2 style="color: #d97706; margin-top: 0;">Subscription Expiring Soon</h2>
  <p>Hello <strong>{{studentName}}</strong>,</p>
  <p>Your seat subscription plan at <strong>{{branchName}}</strong> will expire shortly.</p>
  <p>To retain your assigned study desk and shift timings, please renew your plan as soon as possible.</p>
  <br/>
  <p style="margin-bottom: 0;">Thank you for studying with us!<br/><strong>Team StudyFlow</strong></p>
</div>`,
  },
  {
    id: 'holiday_notice',
    name: 'Holiday & Facility Closure Notice',
    subject: 'Holiday Announcement - {{branchName}}',
    body: `<div style="font-family: Arial, sans-serif; padding: 20px; color: #333; line-height: 1.6;">
  <h2 style="color: #dc2626; margin-top: 0;">Holiday Announcement</h2>
  <p>Dear Students,</p>
  <p>Please note that <strong>{{branchName}}</strong> will remain closed for upcoming holidays.</p>
  <p>Normal study hall access and shift schedules will resume promptly after the break.</p>
  <br/>
  <p style="margin-bottom: 0;">Warm regards,<br/><strong>StudyFlow Management</strong></p>
</div>`,
  },
  {
    id: 'general_announcement',
    name: 'General Announcement',
    subject: 'Important Notice for All Students',
    body: `<div style="font-family: Arial, sans-serif; padding: 20px; color: #333; line-height: 1.6;">
  <h2 style="color: #0f172a; margin-top: 0;">Important Notice</h2>
  <p>Dear <strong>{{studentName}}</strong>,</p>
  <p>We have a quick announcement regarding library rules and facilities. Please keep your study area clean, maintain silence, and follow branch guidelines at all times.</p>
  <br/>
  <p style="margin-bottom: 0;">Thank you for your cooperation!<br/><strong>Team StudyFlow</strong></p>
</div>`,
  },
  {
    id: 'welcome_onboarding',
    name: 'Welcome & Admission Onboarding',
    subject: 'Welcome to StudyFlow - Registration Confirmed',
    body: `<div style="font-family: Arial, sans-serif; padding: 20px; color: #333; line-height: 1.6;">
  <h2 style="color: #16a34a; margin-top: 0;">Welcome to StudyFlow!</h2>
  <p>Dear <strong>{{studentName}}</strong>,</p>
  <p>We are excited to welcome you to <strong>{{branchName}}</strong>! Your seat registration has been successfully processed.</p>
  <p>If you need assistance with wifi, locker access, or shift schedules, please speak with our staff desk.</p>
  <br/>
  <p style="margin-bottom: 0;">Happy Learning,<br/><strong>Team StudyFlow</strong></p>
</div>`,
  },
];

/* ─── Shared Student Filter + Table Component ─── */
function StudentFilterPanel({
  branches, shifts, branchId, setBranchId, shiftId, setShiftId, statusFilter, setStatusFilter,
  studentsData, isFetchingStudents, handleFetch, fetchTrigger,
  selectedStudentIds, setSelectedStudentIds,
  renderMessagePreview, renderAction, channelLabel,
}: any) {
  return (
    <>
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: 'var(--text-secondary)' }}>
        Target Filters (Optional)
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2, mb: 3 }}>
        <FormControl fullWidth size="small" sx={inputStyle}>
          <InputLabel id="branch-filter">Filter by Branch</InputLabel>
          <Select labelId="branch-filter" value={branchId} label="Filter by Branch" onChange={(e) => setBranchId(e.target.value)} MenuProps={menuProps}>
            <MenuItem value="ALL">All Branches</MenuItem>
            {branches?.map((b: any) => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl fullWidth size="small" sx={inputStyle}>
          <InputLabel id="shift-filter">Filter by Shift</InputLabel>
          <Select labelId="shift-filter" value={shiftId} label="Filter by Shift" onChange={(e) => setShiftId(e.target.value)} MenuProps={menuProps}>
            <MenuItem value="ALL">All Shifts</MenuItem>
            {shifts?.map((s: any) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl fullWidth size="small" sx={inputStyle}>
          <InputLabel id="status-filter">Filter by Status</InputLabel>
          <Select labelId="status-filter" value={statusFilter} label="Filter by Status" onChange={(e) => setStatusFilter(e.target.value)} MenuProps={menuProps}>
            <MenuItem value="ALL">All Statuses</MenuItem>
            <MenuItem value="ACTIVE">Active Subscription</MenuItem>
            <MenuItem value="EXPIRING_SOON">Expiring Soon (Next 7 Days)</MenuItem>
            <MenuItem value="EXPIRED">Expired Subscription</MenuItem>
            <MenuItem value="NO_SEAT">No Seat Allocated</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Button
        type="button" onClick={handleFetch} variant="primary"
        isLoading={isFetchingStudents}
        fullWidth
        style={{
          padding: '12px 0', borderRadius: '10px',
          backgroundColor: 'var(--accent-blue)', borderColor: 'var(--accent-blue)',
          fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {studentsData ? 'Re-Fetch Matching Students' : 'Fetch Students'}
      </Button>

      {studentsData && studentsData.students && (
        <Box sx={{ mt: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Matching Students ({studentsData.students.length})
              </Typography>
              <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
                Select which students will receive the {channelLabel} broadcast.
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button type="button" variant="outline" onClick={() => {
                const sel: Record<string, boolean> = {};
                studentsData.students.forEach((s: any) => { sel[s.id] = true; });
                setSelectedStudentIds(sel);
              }} style={{ borderRadius: '8px', padding: '5px 12px', fontSize: '0.8rem' }}>Select All</Button>
              <Button type="button" variant="outline" onClick={() => setSelectedStudentIds({})} style={{ borderRadius: '8px', padding: '5px 12px', fontSize: '0.8rem' }}>Clear</Button>
            </Box>
          </Box>

          <Box sx={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <TableContainer component={Paper} sx={{ borderRadius: 2, bgcolor: 'var(--bg-surface)', border: '1px solid var(--border-color)', boxShadow: 'none' }}>
              <Table size="small" sx={{ minWidth: 640 }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'var(--bg-surface-hover)' }}>
                    <TableCell align="center" sx={{ width: 40, borderBottom: '1px solid var(--border-color)' }}></TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)' }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)' }}>Contact</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)' }}>Branch</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)' }}>Status</TableCell>
                    {renderMessagePreview && <TableCell sx={{ fontWeight: 600, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)' }}>Preview</TableCell>}
                    {renderAction && <TableCell align="center" sx={{ fontWeight: 600, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)' }}>Action</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {studentsData.students.length === 0 ? (
                    <TableRow><TableCell colSpan={7} align="center" sx={{ py: 3, color: 'var(--text-secondary)' }}>No students match the selected filters.</TableCell></TableRow>
                  ) : studentsData.students.map((s: any) => {
                    const isSelected = !!selectedStudentIds[s.id];
                    const activeSub = s.subscriptions?.find((sub: any) => sub.status === 'ACTIVE');
                    const statusText = activeSub ? 'Active' : s.subscriptions?.length > 0 ? 'Expired' : 'No Plan';
                    const statusColor = activeSub ? 'success' : s.subscriptions?.length > 0 ? 'error' : 'default';
                    return (
                      <TableRow key={s.id} hover sx={{ '&:hover': { bgcolor: 'var(--bg-surface-hover) !important' } }}>
                        <TableCell align="center" sx={{ borderBottom: '1px solid var(--border-color)' }}>
                          <input type="checkbox" checked={isSelected} onChange={() => setSelectedStudentIds({ ...selectedStudentIds, [s.id]: !isSelected })} style={{ cursor: 'pointer', accentColor: 'var(--primary)' }} />
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)' }}>{s.user?.name}</TableCell>
                        <TableCell sx={{ fontSize: '0.85rem', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                          <div>{s.user?.mobile || '—'}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.user?.email || '—'}</div>
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.85rem', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)' }}>{s.branch?.name || 'N/A'}</TableCell>
                        <TableCell sx={{ borderBottom: '1px solid var(--border-color)' }}>
                          <Chip label={statusText} size="small" color={statusColor as any} variant="outlined" />
                        </TableCell>
                        {renderMessagePreview && <TableCell sx={{ fontSize: '0.8rem', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)', maxWidth: 220, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{renderMessagePreview(s)}</TableCell>}
                        {renderAction && <TableCell align="center" sx={{ borderBottom: '1px solid var(--border-color)' }}>{renderAction(s)}</TableCell>}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Box>
      )}
    </>
  );
}

/* ─── Dispatch Logs Table ─── */
function LogsTable({ logs, isLoading, showSubject }: { logs: any[]; isLoading: boolean; showSubject?: boolean }) {
  if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}><CircularProgress /></Box>;
  if (!logs || logs.length === 0) return (
    <Box sx={{ textAlign: 'center', py: 6, color: 'var(--text-secondary)' }}>
      <Typography variant="body2">No broadcast logs yet. Send your first message!</Typography>
    </Box>
  );
  return (
    <Box sx={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
      <TableContainer component={Paper} sx={{ borderRadius: 2.5, bgcolor: 'var(--bg-surface)', border: '1px solid var(--border-color)', boxShadow: 'none' }}>
        <Table sx={{ minWidth: 560 }}>
          <TableHead>
            <TableRow sx={{ bgcolor: 'var(--bg-surface-hover)' }}>
              <TableCell sx={{ fontWeight: 600, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)' }}>Recipient</TableCell>
              {showSubject && <TableCell sx={{ fontWeight: 600, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)' }}>Subject</TableCell>}
              <TableCell sx={{ fontWeight: 600, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)' }}>Message</TableCell>
              <TableCell sx={{ fontWeight: 600, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)' }}>Sent</TableCell>
              <TableCell sx={{ fontWeight: 600, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)' }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logs.map((log: any) => (
              <TableRow key={log.id} hover sx={{ '&:hover': { bgcolor: 'var(--bg-surface-hover) !important' } }}>
                <TableCell sx={{ fontWeight: 600, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)' }}>{log.recipient}</TableCell>
                {showSubject && <TableCell sx={{ fontSize: '0.85rem', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)' }}>{log.subject || '—'}</TableCell>}
                <TableCell sx={{ maxWidth: 340, fontSize: '0.85rem', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{log.message}</TableCell>
                <TableCell sx={{ fontSize: '0.85rem', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)', whiteSpace: 'nowrap' }}>{new Date(log.sentAt).toLocaleString()}</TableCell>
                <TableCell sx={{ borderBottom: '1px solid var(--border-color)' }}>
                  <Chip label={log.status} size="small" color={log.status === 'SENT' || log.status === 'SUCCESS' ? 'success' : 'error'} variant="outlined" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

/* ════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════════════════════════════ */
export default function MessagesBroadcast() {
  const { user } = useSelector((state: RootState) => state.auth);
  const [activeChannel, setActiveChannel] = useState<ChannelKey>('whatsapp');
  const [subTab, setSubTab] = useState<'compose' | 'logs' | 'automation'>('compose');

  /* ─── Data Queries ─── */
  const { data: templates, isLoading: templatesLoading } = useGetWhatsAppTemplatesQuery({});
  const { data: whatsappLogs, isLoading: waLogsLoading } = useGetWhatsAppLogsQuery({});
  const { data: smsLogs, isLoading: smsLogsLoading } = useGetSmsLogsQuery({});
  const { data: emailLogs, isLoading: emailLogsLoading } = useGetEmailLogsQuery({});
  const { data: branches } = useGetBranchesQuery(user?.workspaceId, { skip: !user?.workspaceId });
  const { data: shifts } = useGetShiftsQuery(user?.workspaceId, { skip: !user?.workspaceId });

  /* ─── Mutations ─── */
  const [sendWhatsApp, { isLoading: isSendingWa }] = useSendWhatsAppBroadcastMutation();
  const [sendSms, { isLoading: isSendingSms }] = useSendSmsBroadcastMutation();
  const [sendEmail, { isLoading: isSendingEmail }] = useSendEmailBroadcastMutation();
  const [createTemplate, { isLoading: isCreatingTemplate }] = useCreateWhatsAppTemplateMutation();

  /* ─── Shared filter/student state ─── */
  const [branchId, setBranchId] = useState('ALL');
  const [shiftId, setShiftId] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
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
      studentsData.students.forEach((s: any) => { selection[s.id] = true; });
      setSelectedStudentIds(selection);
    }
  }, [studentsData]);

  const handleFetch = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!fetchTrigger) setFetchTrigger(true);
    else refetchStudents();
  };

  /* ─── WhatsApp State ─── */
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [seatNumber, setSeatNumber] = useState('');
  const [holidayDate, setHolidayDate] = useState('');
  const [resumeDate, setResumeDate] = useState('');
  const [reason, setReason] = useState('');
  const [customMsg, setCustomMsg] = useState('');
  const [customVars, setCustomVars] = useState<Record<string, string>>({});
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateText, setNewTemplateText] = useState('');

  /* ─── SMS State ─── */
  const [smsMessage, setSmsMessage] = useState('');

  /* ─── Email State ─── */
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [fromEmail, setFromEmail] = useState('');
  const [selectedEmailTemplate, setSelectedEmailTemplate] = useState('');

  const handleEmailTemplateChange = (tmplId: string) => {
    setSelectedEmailTemplate(tmplId);
    const tmpl = PREDEFINED_EMAIL_TEMPLATES.find((t) => t.id === tmplId);
    if (tmpl) {
      setEmailSubject(tmpl.subject);
      setEmailBody(tmpl.body);
    }
  };

  /* ─── WhatsApp Helpers ─── */
  const extractTemplateVariables = (text: string) => {
    if (!text) return [];
    const matches = text.match(/\{\{([^}]+)\}\}/g);
    if (!matches) return [];
    const standard = ['studentName', 'amount', 'dueDate', 'endDate', 'seatNumber', 'branchName', 'holidayDate', 'resumeDate', 'reason', 'message'];
    return matches.map((m) => m.replace(/\{\{|\}\}/g, '').trim()).filter((v) => !standard.includes(v));
  };

  const getTemplateTextPreview = (student?: any) => {
    const t = templates?.find((x: any) => x.id === selectedTemplateId);
    if (!t) return '';
    let preview = t.text;
    preview = preview.replace('{{studentName}}', student?.user?.name || 'John Doe');
    preview = preview.replace('{{amount}}', amount || '______');
    preview = preview.replace('{{dueDate}}', dueDate || '______');
    preview = preview.replace('{{endDate}}', endDate || '______');
    preview = preview.replace('{{seatNumber}}', seatNumber || '______');
    preview = preview.replace('{{branchName}}', student?.branch?.name || 'Main Branch');
    preview = preview.replace('{{holidayDate}}', holidayDate || '______');
    preview = preview.replace('{{resumeDate}}', resumeDate || '______');
    preview = preview.replace('{{reason}}', reason || '______');
    preview = preview.replace('{{message}}', customMsg || '______');
    const vars = extractTemplateVariables(t.text);
    vars.forEach((v) => { preview = preview.replace(new RegExp(`\\{\\{${v}\\}\\}`, 'g'), customVars[v] || '______'); });
    return preview;
  };

  const handleSendIndividualWa = (student: any) => {
    const message = getTemplateTextPreview(student);
    let phone = student.user?.mobile ? student.user.mobile.replace(/\D/g, '') : '';
    if (!phone) { alert('This student has no mobile number on file.'); return; }
    if (phone.length === 10) phone = '91' + phone;
    const url = `https://web.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`;
    const win = window.open(url, WHATSAPP_WINDOW_NAME, 'width=1000,height=750,resizable=yes,scrollbars=yes');
    if (win) win.focus();
    else alert('Popup blocked — please allow popups for this site to send via WhatsApp Web.');
  };

  const handleSendWaBroadcast = async (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault();
    if (!selectedTemplateId) return;
    const selectedIds = Object.keys(selectedStudentIds).filter((k) => selectedStudentIds[k]);
    if (selectedIds.length === 0) { alert('Please select at least one student.'); return; }
    try {
      await sendWhatsApp({
        templateId: selectedTemplateId,
        customVariables: { amount, dueDate, endDate, seatNumber, holidayDate, resumeDate, reason, message: customMsg, ...customVars },
        filters: { branchId: branchId === 'ALL' ? undefined : branchId, shiftId: shiftId === 'ALL' ? undefined : shiftId, status: statusFilter === 'ALL' ? undefined : statusFilter },
        studentIds: selectedIds,
      }).unwrap();
      alert('WhatsApp broadcast triggered successfully!');
      setAmount(''); setDueDate(''); setEndDate(''); setSeatNumber(''); setHolidayDate(''); setResumeDate(''); setReason(''); setCustomMsg(''); setCustomVars({}); setFetchTrigger(false);
    } catch { alert('Broadcast failed'); }
  };

  const handleCreateTemplate = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!newTemplateName.trim() || !newTemplateText.trim()) { alert('Please fill out all fields.'); return; }
    try {
      await createTemplate({ name: newTemplateName, text: newTemplateText }).unwrap();
      alert('Template created successfully!');
      setIsTemplateModalOpen(false); setNewTemplateName(''); setNewTemplateText('');
    } catch (err: any) { alert(err?.data?.message || 'Failed to create template'); }
  };

  /* ─── SMS Send ─── */
  const handleSendSmsBroadcast = async () => {
    if (!smsMessage.trim()) { alert('Please enter a message.'); return; }
    const selectedIds = Object.keys(selectedStudentIds).filter((k) => selectedStudentIds[k]);
    if (selectedIds.length === 0) { alert('Please select at least one student.'); return; }
    try {
      await sendSms({
        message: smsMessage,
        filters: { branchId: branchId === 'ALL' ? undefined : branchId, shiftId: shiftId === 'ALL' ? undefined : shiftId, status: statusFilter === 'ALL' ? undefined : statusFilter },
        studentIds: selectedIds,
      }).unwrap();
      alert('SMS broadcast triggered successfully!');
      setSmsMessage(''); setFetchTrigger(false);
    } catch { alert('SMS broadcast failed'); }
  };

  /* ─── Email Send ─── */
  const handleSendEmailBroadcast = async () => {
    if (!emailSubject.trim() || !emailBody.trim()) { alert('Please enter subject and body.'); return; }
    if (!fromEmail.trim()) { alert('Please enter a sender email address.'); return; }
    const selectedIds = Object.keys(selectedStudentIds).filter((k) => selectedStudentIds[k]);
    if (selectedIds.length === 0) { alert('Please select at least one student.'); return; }
    try {
      await sendEmail({
        subject: emailSubject,
        message: emailBody,
        fromEmail,
        filters: { branchId: branchId === 'ALL' ? undefined : branchId, shiftId: shiftId === 'ALL' ? undefined : shiftId, status: statusFilter === 'ALL' ? undefined : statusFilter },
        studentIds: selectedIds,
      }).unwrap();
      alert('Email broadcast triggered successfully!');
      setEmailSubject(''); setEmailBody(''); setFetchTrigger(false);
    } catch { alert('Email broadcast failed'); }
  };

  /* ─── Current channel info ─── */
  const ch = channels.find((c) => c.key === activeChannel)!;
  const isSending = activeChannel === 'whatsapp' ? isSendingWa : activeChannel === 'sms' ? isSendingSms : isSendingEmail;

  /* ════════════════════════════════════════════════════════════
     RENDER
     ════════════════════════════════════════════════════════════ */
  return (
    <Box sx={{ pb: 4 }}>

      {/* ── Channel Selector (Pill Tabs) ── */}
      <Box sx={{
        display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap',
        p: '4px', borderRadius: '14px', bgcolor: 'var(--bg-surface)',
        border: '1px solid var(--border-color)', width: 'fit-content',
      }}>
        {channels.map((c) => {
          const Icon = c.icon;
          const isActive = activeChannel === c.key;
          return (
            <button
              key={c.key}
              onClick={() => { setActiveChannel(c.key); setSubTab('compose'); setFetchTrigger(false); setSelectedStudentIds({}); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 20px', borderRadius: '10px', border: 'none',
                cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem',
                fontFamily: 'inherit', transition: 'all 0.2s ease',
                background: isActive ? c.color : 'transparent',
                color: isActive ? '#fff' : 'var(--text-secondary)',
                boxShadow: isActive ? `0 2px 8px ${c.color}40` : 'none',
              }}
            >
              <Icon size={16} />
              {c.label}
            </button>
          );
        })}
      </Box>

      {/* ── Sub-Tab Navigation ── */}
      <Box sx={{ display: 'flex', gap: 0, mb: 3, borderBottom: '2px solid var(--border-color)' }}>
        {(['compose', 'logs', ...(activeChannel === 'whatsapp' ? ['automation'] : [])] as const).map((t) => {
          const label = t === 'compose' ? 'Broadcast Console' : t === 'logs' ? 'Dispatch Logs' : 'Automated Reminders';
          const isActive = subTab === t;
          return (
            <button
              key={t}
              onClick={() => setSubTab(t as any)}
              style={{
                padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer',
                fontWeight: isActive ? 700 : 500, fontSize: '0.85rem', fontFamily: 'inherit',
                color: isActive ? ch.color : 'var(--text-secondary)',
                borderBottom: isActive ? `2px solid ${ch.color}` : '2px solid transparent',
                marginBottom: '-2px', transition: 'all 0.2s ease',
              }}
            >
              {label}
            </button>
          );
        })}
      </Box>

      {/* ════════════════════════════════════════════════════════
          COMPOSE TAB
         ════════════════════════════════════════════════════════ */}
      {subTab === 'compose' && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.25fr 1fr' }, gap: 3, alignItems: 'start' }}>

            {/* Left — Compose Panel */}
            <Card sx={{ p: 3, borderRadius: 3, bgcolor: 'var(--bg-surface)', border: '1px solid var(--border-color)', boxShadow: 'none' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: ch.lightBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ch.icon size={18} style={{ color: ch.color }} />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>Compose {ch.label}</Typography>
                  <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>Configure your broadcast message</Typography>
                </Box>
              </Box>

              {/* ── WhatsApp Compose ── */}
              {activeChannel === 'whatsapp' && (
                <>
                  {templatesLoading ? <CircularProgress /> : (
                    <>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '20px' }}>
                        <FormControl fullWidth required size="small" sx={{ ...inputStyle, marginBottom: 0 }}>
                          <InputLabel id="template-select">Select Template</InputLabel>
                          <Select labelId="template-select" value={selectedTemplateId} label="Select Template"
                            onChange={(e) => { setSelectedTemplateId(e.target.value); setCustomVars({}); }} MenuProps={menuProps}>
                            {templates?.map((t: any) => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
                          </Select>
                        </FormControl>
                        <Button type="button" variant="outline" onClick={() => setIsTemplateModalOpen(true)}
                          style={{ whiteSpace: 'nowrap', height: '40px', padding: '0 16px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          + New
                        </Button>
                      </div>

                      {selectedTemplateId === 'renewal_reminder' && (
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
                          <DatePicker label="Expiry End Date" value={endDate} onChange={(val) => setEndDate(val)} />
                          <TextField sx={inputStyle} label="Seat Number" fullWidth size="small" value={seatNumber} onChange={(e) => setSeatNumber(e.target.value)} />
                        </Box>
                      )}
                      {selectedTemplateId === 'holiday_notice' && (
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2, mb: 3 }}>
                          <DatePicker label="Holiday Date" value={holidayDate} onChange={(val) => setHolidayDate(val)} />
                          <DatePicker label="Resume Date" value={resumeDate} onChange={(val) => setResumeDate(val)} />
                          <TextField sx={inputStyle} label="Reason" fullWidth size="small" value={reason} onChange={(e) => setReason(e.target.value)} />
                        </Box>
                      )}
                      {selectedTemplateId === 'general_notice' && (
                        <TextField label="Announcement Message" fullWidth multiline rows={3} value={customMsg} onChange={(e) => setCustomMsg(e.target.value)} sx={{ mb: 3, ...inputStyle }} />
                      )}

                      {/* Dynamic custom vars */}
                      {(() => {
                        const t = templates?.find((x: any) => x.id === selectedTemplateId);
                        if (!t) return null;
                        const vars = extractTemplateVariables(t.text);
                        if (vars.length === 0) return null;
                        return (
                          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
                            {vars.map((v) => (
                              <TextField key={v} sx={inputStyle} label={`Variable: ${v}`} fullWidth size="small" value={customVars[v] || ''} onChange={(e) => setCustomVars({ ...customVars, [v]: e.target.value })} />
                            ))}
                          </Box>
                        );
                      })()}
                    </>
                  )}
                </>
              )}

              {/* ── SMS Compose ── */}
              {activeChannel === 'sms' && (
                <>
                  <TextField
                    label="SMS Message"
                    placeholder="Hello {{studentName}}, your seat at our study hall is confirmed..."
                    fullWidth multiline rows={4}
                    value={smsMessage}
                    onChange={(e) => setSmsMessage(e.target.value)}
                    sx={{ mb: 1, ...inputStyle }}
                    helperText="Use {{studentName}} to personalize. Max 160 chars recommended per segment."
                  />
                  <Typography variant="caption" sx={{ color: smsMessage.length > 160 ? 'var(--danger)' : 'var(--text-muted)', display: 'block', mb: 2, textAlign: 'right' }}>
                    {smsMessage.length} / 160 characters
                  </Typography>
                </>
              )}

              {/* ── Email Compose ── */}
              {activeChannel === 'email' && (
                <>
                  <FormControl fullWidth size="small" sx={{ mb: 2, ...inputStyle }}>
                    <InputLabel id="email-template-label">Select Predefined Email Template (Optional)</InputLabel>
                    <Select
                      labelId="email-template-label"
                      value={selectedEmailTemplate}
                      label="Select Predefined Email Template (Optional)"
                      onChange={(e) => handleEmailTemplateChange(e.target.value)}
                      MenuProps={menuProps}
                    >
                      <MenuItem value="">
                        <em>Custom Email (No Template Selected)</em>
                      </MenuItem>
                      {PREDEFINED_EMAIL_TEMPLATES.map((tmpl) => (
                        <MenuItem key={tmpl.id} value={tmpl.id}>
                          {tmpl.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <TextField
                    label="Sender Email (From)"
                    placeholder="noreply@yourdomain.com or onboarding@resend.dev"
                    fullWidth size="small"
                    value={fromEmail}
                    onChange={(e) => setFromEmail(e.target.value)}
                    sx={{ mb: 2, ...inputStyle }}
                    helperText="Must be a verified Resend domain or use onboarding@resend.dev for testing."
                  />
                  <TextField
                    label="Email Subject"
                    placeholder="Important update from StudyFlow"
                    fullWidth size="small"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    sx={{ mb: 2, ...inputStyle }}
                  />
                  <TextField
                    label="Email Body (HTML supported)"
                    placeholder="<h2>Hello {{studentName}}</h2><p>Your subscription is expiring soon...</p>"
                    fullWidth multiline rows={6}
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    sx={{ mb: 2, ...inputStyle }}
                    helperText="Use {{studentName}} or {{branchName}} for personalization. Rich HTML is supported."
                  />
                </>
              )}

              {/* ── Student Filters ── */}
              <Box sx={{ mt: 2 }}>
                <StudentFilterPanel
                  branches={branches} shifts={shifts}
                  branchId={branchId} setBranchId={setBranchId}
                  shiftId={shiftId} setShiftId={setShiftId}
                  statusFilter={statusFilter} setStatusFilter={setStatusFilter}
                  studentsData={studentsData} isFetchingStudents={isFetchingStudents}
                  handleFetch={handleFetch} fetchTrigger={fetchTrigger}
                  selectedStudentIds={selectedStudentIds} setSelectedStudentIds={setSelectedStudentIds}
                  channelLabel={ch.label}
                  renderMessagePreview={activeChannel === 'whatsapp' ? (s: any) => (selectedTemplateId ? getTemplateTextPreview(s) : '(No Template)') : undefined}
                  renderAction={activeChannel === 'whatsapp' ? (s: any) => (
                    <Button type="button" size="sm" variant="primary" onClick={() => handleSendIndividualWa(s)}
                      disabled={isSending || !selectedTemplateId}
                      style={{ padding: '4px 10px', fontSize: '0.75rem', borderRadius: '6px', backgroundColor: '#25D366', borderColor: '#25D366' }}>
                      Send
                    </Button>
                  ) : undefined}
                />
              </Box>

              {/* ── Send Button ── */}
              {studentsData && studentsData.students && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                  <Button
                    type="button" variant="primary" isLoading={isSending}
                    disabled={Object.values(selectedStudentIds).filter(Boolean).length === 0 || (activeChannel === 'whatsapp' && !selectedTemplateId)}
                    onClick={(e) => {
                      if (activeChannel === 'whatsapp') handleSendWaBroadcast(e);
                      else if (activeChannel === 'sms') handleSendSmsBroadcast();
                      else handleSendEmailBroadcast();
                    }}
                    style={{
                      padding: '10px 24px', borderRadius: '10px',
                      backgroundColor: ch.color, borderColor: ch.color,
                      fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem',
                    }}
                  >
                    <Send size={16} />
                    Send {ch.label} Broadcast ({Object.values(selectedStudentIds).filter(Boolean).length} Selected)
                  </Button>
                </Box>
              )}
            </Card>

            {/* Right — Preview Panel */}
            <Card sx={{
              borderRadius: 3, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-md)',
              overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 380, bgcolor: 'var(--bg-surface)',
            }}>
              {/* Preview Header */}
              <Box sx={{ bgcolor: ch.color, px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '0.85rem' }}>
                  <ch.icon size={18} />
                </Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 600, lineHeight: 1.2 }}>
                    {ch.label} Preview
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.72rem' }}>
                    How your message will appear
                  </Typography>
                </Box>
              </Box>

              {/* Preview Body */}
              <Box sx={{
                flex: 1, p: 2.5, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', gap: 1.5,
                bgcolor: activeChannel === 'whatsapp' ? '#efeae2' : 'var(--bg-main)',
                backgroundImage: activeChannel === 'whatsapp' ? 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")' : 'none',
                backgroundSize: 'cover',
              }}>
                {activeChannel === 'whatsapp' && (
                  <Box sx={{
                    alignSelf: 'flex-end', maxWidth: '85%', bgcolor: '#d9fdd3', color: '#303030',
                    p: 1.5, borderRadius: '8px 0px 8px 8px',
                    boxShadow: '0 1px 0.5px rgba(0,0,0,0.13)', position: 'relative',
                  }}>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', fontSize: '0.875rem', pr: 4, pb: 1, color: '#303030' }}>
                      {selectedTemplateId ? getTemplateTextPreview() : 'Select a template to preview...'}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.25, position: 'absolute', bottom: 4, right: 6 }}>
                      <Typography variant="caption" sx={{ fontSize: '0.65rem', color: '#667781' }}>
                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Typography>
                      <svg width="16" height="11" viewBox="0 0 16 11" fill="none"><path d="M4.5 9.5L1.5 6.5L0.5 7.5L4.5 11.5L13 3L12 2L4.5 9.5Z" fill="#53bdeb"/><path d="M7.5 9.5L9.5 7.5L8.5 6.5L7.5 7.5L7.5 9.5Z" fill="#53bdeb"/><path d="M15 3L14 2L9.5 6.5L10.5 7.5L15 3Z" fill="#53bdeb"/></svg>
                    </Box>
                  </Box>
                )}

                {activeChannel === 'sms' && (
                  <Box sx={{
                    maxWidth: '80%', bgcolor: 'var(--bg-surface)', p: 2, borderRadius: '16px 16px 16px 4px',
                    border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)',
                  }}>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                      {smsMessage || 'Compose your SMS message to preview...'}
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', textAlign: 'right', mt: 1, color: 'var(--text-muted)', fontSize: '0.65rem' }}>
                      {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                  </Box>
                )}

                {activeChannel === 'email' && (
                  <Box sx={{
                    bgcolor: 'var(--bg-surface)', borderRadius: '12px',
                    border: '1px solid var(--border-color)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)',
                  }}>
                    <Box sx={{ bgcolor: 'var(--bg-surface-hover)', px: 2, py: 1.5, borderBottom: '1px solid var(--border-color)' }}>
                      <Typography variant="caption" sx={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>From: {fromEmail || 'sender@domain.com'}</Typography>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'var(--text-primary)', mt: 0.5 }}>
                        {emailSubject || 'Email Subject'}
                      </Typography>
                    </Box>
                    <Box sx={{ p: 2 }}>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', fontSize: '0.875rem', color: 'var(--text-primary)' }}
                        dangerouslySetInnerHTML={{ __html: emailBody || '<span style="color:var(--text-muted)">Compose your email to preview...</span>' }}
                      />
                    </Box>
                  </Box>
                )}
              </Box>
            </Card>
          </Box>
        </Box>
      )}

      {/* ════════════════════════════════════════════════════════
          LOGS TAB
         ════════════════════════════════════════════════════════ */}
      {subTab === 'logs' && (
        <Box>
          {activeChannel === 'whatsapp' && <LogsTable logs={whatsappLogs || []} isLoading={waLogsLoading} />}
          {activeChannel === 'sms' && <LogsTable logs={smsLogs || []} isLoading={smsLogsLoading} />}
          {activeChannel === 'email' && <LogsTable logs={emailLogs || []} isLoading={emailLogsLoading} showSubject />}
        </Box>
      )}

      {/* ════════════════════════════════════════════════════════
          AUTOMATION TAB (WhatsApp Only)
         ════════════════════════════════════════════════════════ */}
      {subTab === 'automation' && activeChannel === 'whatsapp' && (
        <Box sx={{ maxWidth: 800 }}>
          <Card sx={{ p: 4, borderRadius: 3, bgcolor: 'var(--bg-surface)', border: '1px solid var(--border-color)', boxShadow: 'none' }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: 'var(--text-primary)' }}>
              Scheduled Automations
            </Typography>
            <Typography variant="body1" sx={{ color: 'var(--text-secondary)', mb: 4 }}>
              StudyFlow automatically monitors student subscriptions and fee payments in the background to send necessary WhatsApp reminders.
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box sx={{ p: 3, border: '1px solid var(--border-color)', borderRadius: 2, bgcolor: 'var(--bg-surface-hover)' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>Fee Due Reminders</Typography>
                  <Chip label="Active" color="success" size="small" />
                </Box>
                <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                  Sends a friendly WhatsApp message 2 days before a student's unpaid fee is due.
                </Typography>
              </Box>
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
            <Box sx={{ mt: 4, p: 2, bgcolor: 'var(--primary-light)', borderRadius: 2 }}>
              <Typography variant="body2" sx={{ color: 'var(--primary-dark)', fontWeight: 500 }}>
                💡 These reminders run automatically every day at 09:00 AM server time. Ensure student profiles have valid mobile numbers configured.
              </Typography>
            </Box>
          </Card>
        </Box>
      )}

      {/* ════════════════════════════════════════════════════════
          TEMPLATE CREATION MODAL (WhatsApp)
         ════════════════════════════════════════════════════════ */}
      {isTemplateModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999999, padding: '16px',
        }}>
          <div style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '16px',
            width: '100%', maxWidth: '480px', padding: '24px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', gap: '16px',
          }}>
            <div>
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'var(--text-primary)' }}>Create WhatsApp Template</Typography>
              <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: 'var(--text-secondary)' }}>
                Use {"{{amount}}"}, {"{{dueDate}}"}, {"{{studentName}}"} etc. as placeholders.
              </Typography>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <TextField label="Template Name" required placeholder="e.g. Fee Overdue Alert" fullWidth size="small" value={newTemplateName} onChange={(e) => setNewTemplateName(e.target.value)} sx={inputStyle} />
              <TextField label="Template Body Text" required placeholder="Hello {{studentName}}, please pay..." fullWidth multiline rows={4} value={newTemplateText} onChange={(e) => setNewTemplateText(e.target.value)} sx={inputStyle} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
              <Button type="button" variant="outline" onClick={() => { setIsTemplateModalOpen(false); setNewTemplateName(''); setNewTemplateText(''); }} style={{ borderRadius: '8px', padding: '6px 16px', fontSize: '0.85rem' }}>Cancel</Button>
              <Button type="button" variant="primary" disabled={isCreatingTemplate} onClick={handleCreateTemplate} style={{ borderRadius: '8px', padding: '6px 16px', fontSize: '0.85rem' }}>
                {isCreatingTemplate ? 'Creating...' : 'Create Template'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Box>
  );
}
