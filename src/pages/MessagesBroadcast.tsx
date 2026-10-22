import { LoadingState } from '../components/feedback/LoadingState';
import { QueryFeedback } from '../components/feedback/QueryFeedback';
import {
  useGetWhatsAppTemplatesQuery,
  useCreateWhatsAppTemplateMutation,
  useSendSmsBroadcastMutation,
  useSendEmailBroadcastMutation,
  useGetEmailStatsQuery,
  useGetBranchesQuery,
  useGetShiftsQuery,
  useGetStudentsQuery,
} from '../store/api';
import {
  getLocalBroadcastLogs,
  saveLocalBroadcastLog,
  saveMultipleLocalBroadcastLogs,
  deleteLocalBroadcastLog,
  clearLocalBroadcastLogs,
  getTimeUntilExpiration,
  type BroadcastLogItem,
} from '../utils/broadcastLogsStorage';
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import { DatePicker } from '../components/ui/DatePicker';
import { useToast } from '../components/ui/ToastContext';
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
  Grid,
  LinearProgress,
  Tooltip,
  IconButton,
} from '@mui/material';
import { Button } from '../components/ui/Button';
import { Send, MessageCircle, Smartphone, Mail, Megaphone, ChevronRight, ChevronLeft, Search, CheckCircle2, ExternalLink, ArrowRight, X, Phone, Play, Calendar, Clock, DollarSign, AlertTriangle, Sparkles, Filter, Users, Info, RefreshCw, Trash2, ShieldCheck, Check } from 'lucide-react';

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

const PREDEFINED_WHATSAPP_TEMPLATES = [
  {
    id: 'fee_reminder',
    name: '💳 Fee Payment Reminder',
    text: 'Hello {{studentName}},\n\nThis is a friendly reminder that your study hall fee of ₹{{amount}} for {{branchName}} is due on {{dueDate}}. Please clear the dues to ensure uninterrupted seat access.\n\nBest regards,\nTeam StudyFlow',
  },
  {
    id: 'renewal_reminder',
    name: '⏳ Subscription Expiry & Renewal Alert',
    text: 'Hello {{studentName}},\n\nYour library seat subscription (Seat #{{seatNumber}}) at {{branchName}} is expiring on {{endDate}}. Please renew your seat promptly to retain your preferred slot.\n\nWarm regards,\nTeam StudyFlow',
  },
  {
    id: 'holiday_notice',
    name: '🏖️ Holiday & Branch Closure Notice',
    text: 'Dear Students,\n\nPlease note that {{branchName}} will remain closed on {{holidayDate}} due to {{reason}}. Normal study hall timings will resume promptly on {{resumeDate}}.\n\nThank you for your cooperation,\nStudyFlow Management',
  },
  {
    id: 'general_notice',
    name: '📢 General Announcement',
    text: 'Important Notice for Students of {{branchName}}:\n\n{{message}}\n\nPlease maintain discipline, silence, and hygiene inside the study area.\n\nBest regards,\nStudyFlow Management',
  },
  {
    id: 'welcome_onboarding',
    name: '🎉 Welcome & Registration Confirmed',
    text: 'Welcome to StudyFlow, {{studentName}}!\n\nYour seat registration at {{branchName}} has been successfully confirmed. Happy learning and all the very best with your exam preparation!\n\nFor Wi-Fi or locker assistance, visit the front desk.\nTeam StudyFlow',
  },
  {
    id: 'custom_message',
    name: '✍️ Custom WhatsApp Message (Write Free Text)',
    text: 'Hello {{studentName}},\n\n{{message}}\n\nBest regards,\nTeam StudyFlow',
  },
];

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

/* ─── Dynamic Student Calculation Helpers ─── */
export function getStudentFeeDetails(student: any, fallbackAmount?: string) {
  const due = Number(student?.dueAmount);
  if (!isNaN(due) && due > 0) {
    return {
      amount: String(due),
      rawAmount: due,
      displayAmount: `₹${due.toLocaleString('en-IN')}`,
      source: 'Pending Dues',
      isDue: true,
      badgeColor: '#dc2626',
      badgeBg: 'rgba(220, 38, 38, 0.08)',
    };
  }

  // Active / primary subscription plan price
  const activeSub = student?.subscriptions?.find((s: any) => s.status === 'ACTIVE') || student?.subscriptions?.[0];
  const planPrice = Number(activeSub?.plan?.price || activeSub?.subscriptionPlan?.price);
  if (!isNaN(planPrice) && planPrice > 0) {
    return {
      amount: String(planPrice),
      rawAmount: planPrice,
      displayAmount: `₹${planPrice.toLocaleString('en-IN')}`,
      source: activeSub?.plan?.name ? `${activeSub.plan.name}` : 'Plan Fee',
      isDue: false,
      badgeColor: '#0284c7',
      badgeBg: 'rgba(2, 132, 199, 0.08)',
    };
  }

  // Fallback manual amount if provided
  if (fallbackAmount && fallbackAmount.trim() && !isNaN(Number(fallbackAmount))) {
    const val = Number(fallbackAmount);
    return {
      amount: String(val),
      rawAmount: val,
      displayAmount: `₹${val.toLocaleString('en-IN')}`,
      source: 'Manual Fallback',
      isDue: false,
      badgeColor: '#475569',
      badgeBg: 'rgba(71, 85, 105, 0.08)',
    };
  }

  return {
    amount: '1200',
    rawAmount: 1200,
    displayAmount: '₹1,200',
    source: 'Standard Rate',
    isDue: false,
    badgeColor: '#64748b',
    badgeBg: 'rgba(100, 116, 139, 0.08)',
  };
}

export function getStudentExpiryDetails(student: any, fallbackDueDate?: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const activeAlloc = student?.allocations?.find((a: any) => a.isActive && a.endDate) || student?.allocations?.[0];
  const activeSub = student?.subscriptions?.find((s: any) => s.status === 'ACTIVE' && s.endDate) || student?.subscriptions?.[0];

  const rawDate = activeAlloc?.endDate || activeSub?.endDate;
  if (!rawDate) {
    if (fallbackDueDate && fallbackDueDate.trim()) {
      return {
        formattedDate: fallbackDueDate.trim(),
        diffDays: null,
        isExpired: false,
        isExpiringSoon: false,
        label: 'Manual Date',
        urgency: 'normal' as const,
        chipColor: '#475569',
        chipBg: 'rgba(71, 85, 105, 0.08)',
        rawDate: null,
      };
    }
    return {
      formattedDate: 'Due Soon',
      diffDays: null,
      isExpired: false,
      isExpiringSoon: false,
      label: 'No End Date',
      urgency: 'none' as const,
      chipColor: '#94a3b8',
      chipBg: 'rgba(148, 163, 184, 0.08)',
      rawDate: null,
    };
  }

  const d = new Date(rawDate);
  if (isNaN(d.getTime())) {
    return {
      formattedDate: 'Due Soon',
      diffDays: null,
      isExpired: false,
      isExpiringSoon: false,
      label: 'Invalid Date',
      urgency: 'none' as const,
      chipColor: '#94a3b8',
      chipBg: 'rgba(148, 163, 184, 0.08)',
      rawDate: null,
    };
  }

  const formattedDate = d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const targetDate = new Date(d);
  targetDate.setHours(0, 0, 0, 0);
  const diffDays = Math.round((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const past = Math.abs(diffDays);
    return {
      formattedDate,
      diffDays,
      isExpired: true,
      isExpiringSoon: false,
      label: `Expired ${past}d ago`,
      urgency: 'expired' as const,
      chipColor: '#b91c1c',
      chipBg: 'rgba(185, 28, 28, 0.12)',
      rawDate: d,
    };
  }
  if (diffDays === 0) {
    return {
      formattedDate,
      diffDays,
      isExpired: false,
      isExpiringSoon: true,
      label: '⚡ Expires Today',
      urgency: 'urgent' as const,
      chipColor: '#dc2626',
      chipBg: 'rgba(220, 38, 38, 0.12)',
      rawDate: d,
    };
  }
  if (diffDays === 1) {
    return {
      formattedDate,
      diffDays,
      isExpired: false,
      isExpiringSoon: true,
      label: '⚡ Expires Tomorrow (1d)',
      urgency: 'urgent' as const,
      chipColor: '#dc2626',
      chipBg: 'rgba(220, 38, 38, 0.12)',
      rawDate: d,
    };
  }
  if (diffDays <= 3) {
    return {
      formattedDate,
      diffDays,
      isExpired: false,
      isExpiringSoon: true,
      label: `⏰ Expires in ${diffDays} days`,
      urgency: 'urgent' as const,
      chipColor: '#ea580c',
      chipBg: 'rgba(234, 88, 12, 0.12)',
      rawDate: d,
    };
  }
  if (diffDays <= 5) {
    return {
      formattedDate,
      diffDays,
      isExpired: false,
      isExpiringSoon: false,
      label: `📅 Expires in ${diffDays} days`,
      urgency: 'warning' as const,
      chipColor: '#d97706',
      chipBg: 'rgba(217, 119, 6, 0.12)',
      rawDate: d,
    };
  }
  if (diffDays <= 7) {
    return {
      formattedDate,
      diffDays,
      isExpired: false,
      isExpiringSoon: false,
      label: `🗓️ Expires in ${diffDays} days`,
      urgency: 'warning' as const,
      chipColor: '#0284c7',
      chipBg: 'rgba(2, 132, 199, 0.12)',
      rawDate: d,
    };
  }
  return {
    formattedDate,
    diffDays,
    isExpired: false,
    isExpiringSoon: false,
    label: `Expires in ${diffDays} days`,
    urgency: 'normal' as const,
    chipColor: '#16a34a',
    chipBg: 'rgba(22, 163, 74, 0.12)',
    rawDate: d,
  };
}

export function getStudentSeatNumber(student: any, fallbackSeat?: string) {
  const activeAlloc = student?.allocations?.find((a: any) => a.isActive);
  return (
    activeAlloc?.seat?.number ||
    activeAlloc?.seat?.seatNumber ||
    student?.seat?.number ||
    student?.seat?.seatNumber ||
    fallbackSeat ||
    '—'
  );
}

/* ─── Target Audience & Filter Controls (Left Compose Column) ─── */
function StudentFilterControls({
  branches,
  shifts,
  branchId,
  setBranchId,
  shiftId,
  setShiftId,
  statusFilter,
  setStatusFilter,
  expiryWindow,
  setExpiryWindow,
  totalMatching,
  isFetchingStudents,
  handleFetch,
  selectedTemplateId,
}: {
  branches: any[];
  shifts: any[];
  branchId: string;
  setBranchId: (id: string) => void;
  shiftId: string;
  setShiftId: (id: string) => void;
  statusFilter: string;
  setStatusFilter: (st: string) => void;
  expiryWindow: string;
  setExpiryWindow: (w: string) => void;
  totalMatching: number;
  isFetchingStudents: boolean;
  handleFetch: (e?: React.MouseEvent) => void;
  selectedTemplateId: string;
}) {
  const isFeeReminder = selectedTemplateId === 'fee_reminder' || selectedTemplateId === 'renewal_reminder';

  return (
    <Card sx={{
      p: 2.5,
      borderRadius: 3,
      bgcolor: 'var(--bg-surface)',
      border: '1px solid var(--border-color)',
      boxShadow: 'var(--shadow-sm)',
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <Box sx={{
            width: 34, height: 34, borderRadius: '8px',
            bgcolor: 'var(--primary-light)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--primary)',
          }}>
            <Filter size={18} />
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
              Target Audience & Expiry Filter
            </Typography>
            <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
              Filter by branch, shift, subscription status, or dynamic expiry window
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            size="small"
            label={`${totalMatching} Matching Students`}
            sx={{ fontWeight: 700, fontSize: '0.75rem', bgcolor: 'var(--primary-light)', color: 'var(--primary)' }}
          />
          <Button
            type="button"
            onClick={handleFetch}
            variant="outline"
            isLoading={isFetchingStudents}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <RefreshCw size={14} />
            Re-Sync List
          </Button>
        </Box>
      </Box>

      {/* Filter Row */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1.35fr' }, gap: 1.5, mb: 2 }}>
        <FormControl fullWidth size="small" sx={inputStyle}>
          <InputLabel id="branch-filter">Branch</InputLabel>
          <Select labelId="branch-filter" value={branchId} label="Branch" onChange={(e) => setBranchId(e.target.value)} MenuProps={menuProps}>
            <MenuItem value="ALL">All Branches</MenuItem>
            {branches?.map((b: any) => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
          </Select>
        </FormControl>

        <FormControl fullWidth size="small" sx={inputStyle}>
          <InputLabel id="shift-filter">Shift</InputLabel>
          <Select labelId="shift-filter" value={shiftId} label="Shift" onChange={(e) => setShiftId(e.target.value)} MenuProps={menuProps}>
            <MenuItem value="ALL">All Shifts</MenuItem>
            {shifts?.map((s: any) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
          </Select>
        </FormControl>

        <FormControl fullWidth size="small" sx={inputStyle}>
          <InputLabel id="status-filter">Subscription Status</InputLabel>
          <Select labelId="status-filter" value={statusFilter} label="Subscription Status" onChange={(e) => setStatusFilter(e.target.value)} MenuProps={menuProps}>
            <MenuItem value="ALL">All Statuses</MenuItem>
            <MenuItem value="EXPIRING_SOON">Expiring Soon</MenuItem>
            <MenuItem value="ACTIVE">Active Subscription</MenuItem>
            <MenuItem value="EXPIRED">Expired Subscription</MenuItem>
            <MenuItem value="NO_SEAT">No Seat Allocated</MenuItem>
          </Select>
        </FormControl>

        {/* Dynamic Expiry Window Dropdown */}
        <FormControl fullWidth size="small" sx={{
          ...inputStyle,
          '& .MuiOutlinedInput-root': {
            ...inputStyle['& .MuiOutlinedInput-root'],
            borderColor: isFeeReminder ? '#25D366' : 'var(--border-color)',
            bgcolor: isFeeReminder ? 'rgba(37, 211, 102, 0.04)' : 'var(--bg-surface)',
          },
        }}>
          <InputLabel id="expiry-window-filter" sx={{ fontWeight: 600 }}>
            ⏳ Expiry / Due Window
          </InputLabel>
          <Select
            labelId="expiry-window-filter"
            value={expiryWindow}
            label="⏳ Expiry / Due Window"
            onChange={(e) => {
              const val = e.target.value;
              setExpiryWindow(val);
              if (['1', '3', '5', '7', '15', '30'].includes(val)) {
                setStatusFilter('EXPIRING_SOON');
              } else if (val === 'HAS_DUES') {
                setStatusFilter('HAS_DUES');
              } else if (val === 'EXPIRED') {
                setStatusFilter('EXPIRED');
              } else if (val === 'ACTIVE') {
                setStatusFilter('ACTIVE');
              } else if (val === 'ALL') {
                setStatusFilter('ALL');
              }
            }}
            MenuProps={menuProps}
          >
            <MenuItem value="1">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Clock size={15} color="#dc2626" />
                <span>⚡ Within 1 Day (Tomorrow)</span>
              </Box>
            </MenuItem>
            <MenuItem value="3">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Clock size={15} color="#ea580c" />
                <span>⏰ Within 3 Days (Recommended)</span>
              </Box>
            </MenuItem>
            <MenuItem value="5">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Calendar size={15} color="#d97706" />
                <span>📅 Within 5 Days</span>
              </Box>
            </MenuItem>
            <MenuItem value="7">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Calendar size={15} color="#0284c7" />
                <span>🗓️ Within 7 Days</span>
              </Box>
            </MenuItem>
            <MenuItem value="15">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Calendar size={15} color="#6366f1" />
                <span>🗓️ Within 15 Days</span>
              </Box>
            </MenuItem>
            <MenuItem value="30">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Calendar size={15} color="#64748b" />
                <span>🗓️ Within 30 Days</span>
              </Box>
            </MenuItem>
            <MenuItem value="HAS_DUES">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <DollarSign size={15} color="#dc2626" />
                <span>💰 Outstanding Dues Only (&gt; ₹0)</span>
              </Box>
            </MenuItem>
            <MenuItem value="EXPIRED">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AlertTriangle size={15} color="#b91c1c" />
                <span>⚠️ Already Expired</span>
              </Box>
            </MenuItem>
            <MenuItem value="ACTIVE">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Users size={15} color="#16a34a" />
                <span>🟢 All Active Subscriptions</span>
              </Box>
            </MenuItem>
            <MenuItem value="ALL">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Users size={15} color="#64748b" />
                <span>👥 All Students (No Window)</span>
              </Box>
            </MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Quick Filter Pill Buttons */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2.5, flexWrap: 'wrap', alignItems: 'center' }}>
        <Typography variant="caption" sx={{ color: 'var(--text-secondary)', fontWeight: 600, mr: 0.5 }}>
          Quick Expiry:
        </Typography>
        {[
          { key: '1', label: '⚡ 1 Day (Tomorrow)', color: '#dc2626' },
          { key: '3', label: '⏰ 3 Days', color: '#ea580c' },
          { key: '5', label: '📅 5 Days', color: '#d97706' },
          { key: '7', label: '🗓️ 7 Days', color: '#0284c7' },
          { key: 'HAS_DUES', label: '💰 Has Dues', color: '#dc2626' },
          { key: 'EXPIRED', label: '⚠️ Expired', color: '#b91c1c' },
          { key: 'ALL', label: '👥 All', color: '#475569' },
        ].map((pill) => {
          const isSelected = expiryWindow === pill.key;
          return (
            <button
              key={pill.key}
              type="button"
              onClick={() => {
                setExpiryWindow(pill.key);
                if (['1', '3', '5', '7', '15', '30'].includes(pill.key)) {
                  setStatusFilter('EXPIRING_SOON');
                } else if (pill.key === 'HAS_DUES') {
                  setStatusFilter('HAS_DUES');
                } else if (pill.key === 'EXPIRED') {
                  setStatusFilter('EXPIRED');
                } else if (pill.key === 'ALL') {
                  setStatusFilter('ALL');
                }
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '4px 11px',
                borderRadius: '16px',
                border: isSelected ? `1.5px solid ${pill.color}` : '1px solid var(--border-color)',
                backgroundColor: isSelected ? pill.color : 'var(--bg-surface)',
                color: isSelected ? '#ffffff' : 'var(--text-primary)',
                fontSize: '0.76rem',
                fontWeight: isSelected ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {pill.label}
            </button>
          );
        })}
      </Box>

      {/* Fetch / Refresh Action Bar */}
      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
        <Button
          type="button"
          onClick={handleFetch}
          variant="primary"
          isLoading={isFetchingStudents}
          style={{
            flex: 1,
            padding: '10px 0',
            borderRadius: '10px',
            backgroundColor: 'var(--accent-blue)',
            borderColor: 'var(--accent-blue)',
            fontWeight: 600,
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <RefreshCw size={15} />
          {totalMatching > 0 ? 'Re-Sync Student List' : 'Fetch Targeted Students'}
        </Button>
      </Box>
    </Card>
  );
}

/* ─── Target Recipients & Dispatch Console (Full Width Console below WhatsApp Preview) ─── */
function TargetRecipientsConsole({
  students,
  selectedStudentIds,
  setSelectedStudentIds,
  channelLabel,
  activeChannel,
  selectedTemplateId,
  fallbackAmount,
  fallbackDueDate,
  previewStudentIndex,
  onSelectPreviewStudent,
  onSendSingle,
  onSendBroadcast,
  isSending,
  sentStudentIds,
}: {
  students: any[];
  selectedStudentIds: Record<string, boolean>;
  setSelectedStudentIds: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  channelLabel: string;
  activeChannel: 'whatsapp' | 'sms' | 'email';
  selectedTemplateId: string;
  fallbackAmount?: string;
  fallbackDueDate?: string;
  previewStudentIndex: number;
  onSelectPreviewStudent: (index: number) => void;
  onSendSingle?: (student: any) => void;
  onSendBroadcast: (e: React.MouseEvent) => void;
  isSending: boolean;
  sentStudentIds: Record<string, boolean>;
}) {
  const [searchTerm, setSearchTerm] = useState('');

  const selectedCount = Object.values(selectedStudentIds).filter(Boolean).length;
  const isFeeReminder = selectedTemplateId === 'fee_reminder' || selectedTemplateId === 'renewal_reminder';

  // Real-time search filter
  const filteredDisplayStudents = React.useMemo(() => {
    if (!students) return [];
    if (!searchTerm.trim()) return students;
    const q = searchTerm.toLowerCase().trim();
    return students.filter((s: any) => {
      const name = (s.displayName || s.user?.name || s.name || '').toLowerCase();
      const phone = (s.user?.phone || s.user?.mobile || s.contactMobile || s.phone || '').toLowerCase();
      const seat = (s.seat?.seatNumber || s.seatNumber || '').toLowerCase();
      const roll = (s.user?.rollNumber || s.rollNumber || '').toLowerCase();
      const branch = (s.branch?.name || '').toLowerCase();
      return name.includes(q) || phone.includes(q) || seat.includes(q) || roll.includes(q) || branch.includes(q);
    });
  }, [students, searchTerm]);

  // Total pending dues sum
  const totalDuesSum = React.useMemo(() => {
    if (!students) return 0;
    return students.reduce((sum: number, s: any) => {
      const feeInfo = getStudentFeeDetails(s, fallbackAmount);
      return sum + (feeInfo.rawAmount || 0);
    }, 0);
  }, [students, fallbackAmount]);

  const handleSelectAll = () => {
    const next: Record<string, boolean> = {};
    filteredDisplayStudents.forEach((s: any) => { next[s.id] = true; });
    setSelectedStudentIds((prev) => ({ ...prev, ...next }));
  };

  const handleDeselectAll = () => {
    if (searchTerm.trim()) {
      const next = { ...selectedStudentIds };
      filteredDisplayStudents.forEach((s: any) => { delete next[s.id]; });
      setSelectedStudentIds(next);
    } else {
      setSelectedStudentIds({});
    }
  };

  return (
    <Card sx={{
      mt: 0,
      borderRadius: 3,
      border: '1px solid var(--border-color)',
      boxShadow: 'var(--shadow-md)',
      bgcolor: 'var(--bg-surface)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Console Header Bar */}
      <Box sx={{
        p: 2,
        borderBottom: '1px solid var(--border-color)',
        bgcolor: 'var(--bg-surface)',
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap' }}>
            <Box sx={{
              width: 34, height: 34, borderRadius: '8px',
              bgcolor: 'rgba(37, 211, 102, 0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#16a34a',
            }}>
              <Users size={18} />
            </Box>
            <div>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                Target Recipients ({students?.length || 0})
              </Typography>
              <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
                {isFeeReminder
                  ? 'Dynamic dues calculated per student from live enrollment profile.'
                  : `Select students to include in the ${channelLabel} broadcast.`}
              </Typography>
            </div>
          </Box>

          {/* Badges: Selected & Total Dues */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            {selectedCount > 0 && (
              <Chip
                size="small"
                label={`${selectedCount} Selected`}
                sx={{ fontWeight: 700, bgcolor: 'var(--primary-light)', color: 'var(--primary)' }}
              />
            )}
            {totalDuesSum > 0 && (
              <Chip
                size="small"
                icon={<DollarSign size={13} style={{ marginLeft: 6 }} />}
                label={`Total Dues: ₹${totalDuesSum.toLocaleString('en-IN')}`}
                sx={{
                  fontWeight: 700,
                  bgcolor: 'rgba(234, 88, 12, 0.12)',
                  color: '#ea580c',
                  border: '1px solid rgba(234, 88, 12, 0.25)',
                }}
              />
            )}
          </Box>
        </Box>

        {/* Search & Bulk Selection Toolbar */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5, flexWrap: 'wrap' }}>
          <Box sx={{ position: 'relative', flex: 1, minWidth: 220 }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search recipient name, phone, seat, roll..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '7px 32px 7px 34px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-main)',
                color: 'var(--text-primary)',
                fontSize: '0.82rem',
                outline: 'none',
              }}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                style={{
                  position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                }}
              >
                <X size={14} />
              </button>
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Button
              type="button"
              variant="outline"
              onClick={handleSelectAll}
              disabled={filteredDisplayStudents.length === 0}
              style={{ borderRadius: '8px', padding: '5px 12px', fontSize: '0.78rem', fontWeight: 600 }}
            >
              Select All ({filteredDisplayStudents.length})
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleDeselectAll}
              disabled={selectedCount === 0}
              style={{ borderRadius: '8px', padding: '5px 12px', fontSize: '0.78rem' }}
            >
              Clear
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Helper Tip */}
      <Box sx={{
        px: 2, py: 0.75,
        bgcolor: 'rgba(59, 130, 246, 0.05)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontSize: '0.72rem', color: 'var(--text-secondary)',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Sparkles size={12} color="var(--primary)" />
          <span>Click any student row to inspect their personalized message in the preview box above.</span>
        </Box>
        {filteredDisplayStudents.length !== (students?.length || 0) && (
          <span style={{ fontWeight: 600, color: 'var(--primary)' }}>
            Showing {filteredDisplayStudents.length} of {students?.length || 0}
          </span>
        )}
      </Box>

      {/* Recipient Table */}
      {!students || students.length === 0 ? (
        <Box sx={{ p: 4, textAlign: 'center', color: 'var(--text-muted)' }}>
          <Users size={36} style={{ margin: '0 auto 10px', opacity: 0.35 }} />
          <Typography variant="body2" sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>
            No Students Found Matching Filter
          </Typography>
          <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
            Adjust the Branch, Shift, or Expiry Window filters on the left and click "Fetch Targeted Students".
          </Typography>
        </Box>
      ) : filteredDisplayStudents.length === 0 ? (
        <Box sx={{ p: 3, textAlign: 'center', color: 'var(--text-muted)' }}>
          <Typography variant="body2">No students match your search query "{searchTerm}".</Typography>
        </Box>
      ) : (
        <TableContainer sx={{ maxHeight: 420, overflowY: 'auto' }}>
          <Table size="small" stickyHeader sx={{ minWidth: 620 }}>
            <TableHead>
              <TableRow sx={{ '& th': { bgcolor: 'var(--bg-surface-hover)', fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)' } }}>
                <TableCell align="center" sx={{ width: 42, px: 1 }}>
                  <input
                    type="checkbox"
                    checked={filteredDisplayStudents.length > 0 && filteredDisplayStudents.every((s: any) => selectedStudentIds[s.id])}
                    onChange={(e) => {
                      if (e.target.checked) handleSelectAll();
                      else handleDeselectAll();
                    }}
                    style={{ cursor: 'pointer', width: 15, height: 15 }}
                  />
                </TableCell>
                <TableCell sx={{ minWidth: 170 }}>Student</TableCell>
                <TableCell sx={{ minWidth: 120 }}>Seat & Branch</TableCell>
                <TableCell sx={{ minWidth: 130 }}>Status / Expiry</TableCell>
                <TableCell sx={{ minWidth: 100 }}>Fee Amount</TableCell>
                <TableCell align="center" sx={{ width: 110 }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredDisplayStudents.map((s: any, idx: number) => {
                const isSelected = !!selectedStudentIds[s.id];
                const isCurrentPreview = idx === previewStudentIndex;
                const isSent = !!sentStudentIds[s.id];
                const studentName = s.displayName || s.user?.name || s.name || 'Student';
                const phone = s.user?.phone || s.user?.mobile || s.contactMobile || s.phone || '—';
                const branchName = s.branch?.name || (s.branchId ? `Branch #${s.branchId}` : '—');
                const seatNum = getStudentSeatNumber(s);
                const feeInfo = getStudentFeeDetails(s, fallbackAmount);
                const expiryInfo = getStudentExpiryDetails(s, fallbackDueDate);

                return (
                  <TableRow
                    key={s.id || idx}
                    hover
                    onClick={() => onSelectPreviewStudent(idx)}
                    sx={{
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease',
                      bgcolor: isCurrentPreview
                        ? 'rgba(37, 211, 102, 0.08)'
                        : isSelected
                        ? 'rgba(59, 130, 246, 0.03)'
                        : 'inherit',
                      borderLeft: isCurrentPreview ? '3px solid #25D366' : '3px solid transparent',
                      '&:hover': {
                        bgcolor: isCurrentPreview
                          ? 'rgba(37, 211, 102, 0.12)'
                          : 'var(--bg-surface-hover)',
                      },
                    }}
                  >
                    {/* Checkbox */}
                    <TableCell
                      align="center"
                      sx={{ px: 1, borderBottom: '1px solid var(--border-color)' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          setSelectedStudentIds((prev) => ({
                            ...prev,
                            [s.id]: e.target.checked,
                          }));
                        }}
                        style={{ cursor: 'pointer', width: 15, height: 15 }}
                      />
                    </TableCell>

                    {/* Student Name & Phone */}
                    <TableCell sx={{ borderBottom: '1px solid var(--border-color)', py: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                        <Box sx={{
                          width: 30, height: 30, borderRadius: '50%',
                          bgcolor: isCurrentPreview ? '#25D366' : 'var(--primary-light)',
                          color: isCurrentPreview ? '#fff' : 'var(--primary)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: '0.75rem', flexShrink: 0,
                        }}>
                          {studentName.charAt(0).toUpperCase()}
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.82rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {studentName}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'var(--text-secondary)', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Phone size={10} />
                            {phone}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>

                    {/* Seat & Branch */}
                    <TableCell sx={{ borderBottom: '1px solid var(--border-color)', py: 1 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <span style={{
                            padding: '1px 6px', borderRadius: '4px',
                            backgroundColor: seatNum !== '—' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(148, 163, 184, 0.1)',
                            color: seatNum !== '—' ? '#6366f1' : '#64748b',
                            fontWeight: 700, fontSize: '0.72rem',
                          }}>
                            Seat #{seatNum}
                          </span>
                        </Box>
                        <Typography variant="caption" sx={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                          {branchName}
                        </Typography>
                      </Box>
                    </TableCell>

                    {/* Status & Expiry */}
                    <TableCell sx={{ borderBottom: '1px solid var(--border-color)', py: 1 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                        {expiryInfo.diffDays !== null ? (
                          <span style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            padding: '2px 7px',
                            borderRadius: '10px',
                            backgroundColor: expiryInfo.chipBg,
                            color: expiryInfo.chipColor,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            width: 'fit-content',
                          }}>
                            {expiryInfo.isExpired && <AlertTriangle size={11} />}
                            {expiryInfo.label}
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                            Active
                          </span>
                        )}
                        <Typography variant="caption" sx={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>
                          Due: {expiryInfo.formattedDate}
                        </Typography>
                      </Box>
                    </TableCell>

                    {/* Fee Due */}
                    <TableCell sx={{ borderBottom: '1px solid var(--border-color)', py: 1 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.84rem', color: feeInfo.isDue ? '#dc2626' : 'var(--text-primary)' }}>
                          {feeInfo.displayAmount}
                        </span>
                        <span style={{
                          fontSize: '0.65rem',
                          fontWeight: 600,
                          padding: '1px 5px',
                          borderRadius: '4px',
                          backgroundColor: feeInfo.badgeBg,
                          color: feeInfo.badgeColor,
                          width: 'fit-content',
                        }}>
                          {feeInfo.source}
                        </span>
                      </Box>
                    </TableCell>

                    {/* Action (Individual WhatsApp send) */}
                    <TableCell
                      align="center"
                      sx={{ borderBottom: '1px solid var(--border-color)', py: 1 }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {activeChannel === 'whatsapp' ? (
                        <Button
                          type="button"
                          size="sm"
                          variant={isSent ? 'outline' : 'primary'}
                          onClick={() => onSendSingle && onSendSingle(s)}
                          disabled={isSending}
                          style={{
                            padding: '4px 8px',
                            fontSize: '0.72rem',
                            borderRadius: '6px',
                            backgroundColor: isSent ? 'transparent' : '#25D366',
                            borderColor: '#25D366',
                            color: isSent ? '#25D366' : '#ffffff',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                          title="Open WhatsApp chat with personalized message"
                        >
                          {isSent ? <CheckCircle2 size={12} /> : <Send size={12} />}
                          {isSent ? 'Sent' : 'Open WA'}
                        </Button>
                      ) : (
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          Ready
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Sticky Bottom Action Bar */}
      <Box sx={{
        p: 2,
        bgcolor: 'var(--bg-surface-hover)',
        borderTop: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 1.5,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.82rem' }}>
            {selectedCount} student{selectedCount !== 1 ? 's' : ''} selected
          </Typography>
          <Typography variant="caption" sx={{ color: 'var(--text-secondary)', display: { xs: 'none', sm: 'inline' } }}>
            • Ready for batch dispatch
          </Typography>
        </Box>

        <Button
          type="button"
          variant="primary"
          isLoading={isSending}
          disabled={selectedCount === 0}
          onClick={onSendBroadcast}
          style={{
            padding: '9px 20px',
            borderRadius: '8px',
            backgroundColor: activeChannel === 'whatsapp' ? '#25D366' : 'var(--primary)',
            borderColor: activeChannel === 'whatsapp' ? '#25D366' : 'var(--primary)',
            fontWeight: 700,
            fontSize: '0.84rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: activeChannel === 'whatsapp' ? '0 2px 8px rgba(37,211,102,0.35)' : 'none',
          }}
        >
          <Send size={15} />
          {activeChannel === 'whatsapp'
            ? `Open WhatsApp Broadcast (${selectedCount} Selected) 🚀`
            : `Send ${channelLabel} Broadcast (${selectedCount} Selected)`}
        </Button>
      </Box>
    </Card>
  );
}

/* ─── Dispatch Logs Table (Device Local Storage, Auto-purged after 24h) ─── */
function LogsTable({
  logs,
  onDeleteLog,
  onClearLogs,
  selectedFilterChannel,
  onChangeFilterChannel,
}: {
  logs: BroadcastLogItem[];
  onDeleteLog: (id: string) => void;
  onClearLogs: () => void;
  selectedFilterChannel: 'all' | 'whatsapp' | 'sms' | 'email';
  onChangeFilterChannel: (ch: 'all' | 'whatsapp' | 'sms' | 'email') => void;
}) {
  const filteredLogs = selectedFilterChannel === 'all'
    ? logs
    : logs.filter((l) => l.channel === selectedFilterChannel);

  const waCount = logs.filter((l) => l.channel === 'whatsapp').length;
  const smsCount = logs.filter((l) => l.channel === 'sms').length;
  const emailCount = logs.filter((l) => l.channel === 'email').length;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {/* ── Privacy & 24H Auto-Purge Banner ── */}
      <Card sx={{
        p: 2.5,
        borderRadius: 3,
        bgcolor: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        boxShadow: 'none',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 260, flex: 1 }}>
          <Box sx={{
            width: 44,
            height: 44,
            borderRadius: '12px',
            bgcolor: 'rgba(34, 197, 94, 0.1)',
            color: '#16a34a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <ShieldCheck size={24} />
          </Box>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                Device-Level Local Storage
              </Typography>
              <Chip
                icon={<Clock size={12} />}
                label="Auto-Purged After 24 Hours"
                size="small"
                sx={{
                  height: 22,
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  bgcolor: 'rgba(234, 179, 8, 0.12)',
                  color: '#ca8a04',
                  border: '1px solid rgba(234, 179, 8, 0.25)',
                }}
              />
            </Box>
            <Typography variant="caption" sx={{ color: 'var(--text-secondary)', display: 'block', mt: 0.5, lineHeight: 1.4 }}>
              Broadcast and dispatch logs are stored exclusively in your browser's local storage and are <strong>never uploaded to the backend server</strong>. All entries are automatically deleted 24 hours after dispatch.
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
          <Chip
            label={`${logs.length} ${logs.length === 1 ? 'Log' : 'Logs'} on Device`}
            size="small"
            sx={{ fontWeight: 700, fontSize: '0.75rem', bgcolor: 'var(--bg-surface-hover)', color: 'var(--text-primary)' }}
          />
          {logs.length > 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={onClearLogs}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                fontSize: '0.8rem',
                color: '#ef4444',
                borderColor: 'rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
              }}
            >
              <Trash2 size={14} />
              Clear All Logs
            </Button>
          )}
        </Box>
      </Card>

      {/* ── Channel Filter Tabs ── */}
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        p: '4px',
        bgcolor: 'var(--bg-surface)',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        width: 'fit-content',
        flexWrap: 'wrap',
      }}>
        {[
          { key: 'all', label: 'All Logs', count: logs.length },
          { key: 'whatsapp', label: 'WhatsApp', count: waCount, color: '#25D366' },
          { key: 'sms', label: 'SMS', count: smsCount, color: '#6366f1' },
          { key: 'email', label: 'Email', count: emailCount, color: '#f43f5e' },
        ].map((tab) => {
          const isSelected = selectedFilterChannel === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onChangeFilterChannel(tab.key as any)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                background: isSelected ? 'var(--primary)' : 'transparent',
                color: isSelected ? '#fff' : 'var(--text-secondary)',
                fontWeight: isSelected ? 700 : 500,
                fontSize: '0.82rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
              <span style={{
                fontSize: '0.72rem',
                padding: '1px 6px',
                borderRadius: '999px',
                backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : 'var(--bg-surface-hover)',
                color: isSelected ? '#fff' : 'var(--text-secondary)',
              }}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </Box>

      {/* ── Logs List / Table ── */}
      {filteredLogs.length === 0 ? (
        <Card sx={{ p: 6, textAlign: 'center', bgcolor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 3, boxShadow: 'none' }}>
          <Box sx={{ width: 48, height: 48, borderRadius: '50%', bgcolor: 'var(--bg-surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2, color: 'var(--text-secondary)' }}>
            <ShieldCheck size={24} />
          </Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'var(--text-primary)', mb: 0.5 }}>
            No {selectedFilterChannel !== 'all' ? selectedFilterChannel.toUpperCase() : 'broadcast'} logs on this device
          </Typography>
          <Typography variant="body2" sx={{ color: 'var(--text-secondary)', maxWidth: 450, mx: 'auto', fontSize: '0.85rem' }}>
            Messages you dispatch will be recorded locally right here and will automatically self-delete after 24 hours.
          </Typography>
        </Card>
      ) : (
        <Box sx={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <TableContainer component={Paper} sx={{ borderRadius: 2.5, bgcolor: 'var(--bg-surface)', border: '1px solid var(--border-color)', boxShadow: 'none' }}>
            <Table sx={{ minWidth: 700 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: 'var(--bg-surface-hover)' }}>
                  <TableCell sx={{ fontWeight: 600, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', py: 1.5 }}>Channel</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', py: 1.5 }}>Recipient</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', py: 1.5 }}>Message</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', py: 1.5 }}>Dispatched</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', py: 1.5 }}>Auto-Purge</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', py: 1.5 }}>Status</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', py: 1.5 }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredLogs.map((log) => {
                  const chColor = log.channel === 'whatsapp' ? '#25D366' : log.channel === 'sms' ? '#6366f1' : '#f43f5e';
                  const ChIcon = log.channel === 'whatsapp' ? MessageCircle : log.channel === 'sms' ? Smartphone : Mail;
                  return (
                    <TableRow key={log.id} hover sx={{ '&:hover': { bgcolor: 'var(--bg-surface-hover) !important' } }}>
                      <TableCell sx={{ borderBottom: '1px solid var(--border-color)', py: 1.5 }}>
                        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, px: 1.2, py: 0.5, borderRadius: '6px', bgcolor: `${chColor}15`, color: chColor, fontWeight: 700, fontSize: '0.75rem' }}>
                          <ChIcon size={13} />
                          {log.channel === 'whatsapp' ? 'WhatsApp' : log.channel.toUpperCase()}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ borderBottom: '1px solid var(--border-color)', py: 1.5 }}>
                        <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                          {log.recipientName}
                        </Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {log.recipientContact}
                        </Typography>
                        {(log.branchName || log.seatNumber || log.feeAmount) && (
                          <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                            {log.branchName && (
                              <Chip label={log.branchName} size="small" sx={{ height: 18, fontSize: '0.65rem', bgcolor: 'var(--bg-surface-hover)' }} />
                            )}
                            {log.seatNumber && (
                              <Chip label={`Seat ${log.seatNumber}`} size="small" sx={{ height: 18, fontSize: '0.65rem', bgcolor: 'var(--bg-surface-hover)' }} />
                            )}
                            {log.feeAmount && (
                              <Chip label={`₹${log.feeAmount}`} size="small" sx={{ height: 18, fontSize: '0.65rem', bgcolor: 'rgba(34,197,94,0.1)', color: '#16a34a', fontWeight: 700 }} />
                            )}
                          </Box>
                        )}
                      </TableCell>
                      <TableCell sx={{ maxWidth: 280, borderBottom: '1px solid var(--border-color)', py: 1.5 }}>
                        {log.subject && (
                          <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', mb: 0.25 }}>
                            {log.subject}
                          </Typography>
                        )}
                        <Tooltip title={log.message} arrow>
                          <Typography sx={{
                            fontSize: '0.8rem',
                            color: 'var(--text-secondary)',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            cursor: 'help',
                          }}>
                            {log.message}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.8rem', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)', py: 1.5, whiteSpace: 'nowrap' }}>
                        {new Date(log.sentAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </TableCell>
                      <TableCell sx={{ borderBottom: '1px solid var(--border-color)', py: 1.5, whiteSpace: 'nowrap' }}>
                        <Chip
                          icon={<Clock size={11} />}
                          label={getTimeUntilExpiration(log.sentAt).label}
                          size="small"
                          sx={{
                            height: 22,
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            bgcolor: 'rgba(234, 179, 8, 0.1)',
                            color: '#ca8a04',
                            border: '1px solid rgba(234, 179, 8, 0.25)',
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ borderBottom: '1px solid var(--border-color)', py: 1.5 }}>
                        <Chip
                          label={log.status === 'OPENED_WA' ? 'Opened in WA' : log.status}
                          size="small"
                          color={log.status === 'OPENED_WA' || log.status === 'SENT' || log.status === 'SUCCESS' ? 'success' : 'default'}
                          variant="outlined"
                          sx={{ height: 22, fontSize: '0.72rem', fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ borderBottom: '1px solid var(--border-color)', py: 1.5 }}>
                        <IconButton
                          size="small"
                          onClick={() => onDeleteLog(log.id)}
                          sx={{ color: 'var(--text-secondary)', '&:hover': { color: '#ef4444' } }}
                          title="Delete log from device"
                        >
                          <Trash2 size={16} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Box>
  );
}

/* ════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════════════════════════════ */
export default function MessagesBroadcast() {
  const { showToast } = useToast();
  const { user } = useSelector((state: RootState) => state.auth);
  const [activeChannel, setActiveChannel] = useState<ChannelKey>('whatsapp');
  const [subTab, setSubTab] = useState<'compose' | 'logs' | 'automation'>('compose');

  /* ─── Data Queries ─── */
  const { data: templates, isLoading: templatesLoading } = useGetWhatsAppTemplatesQuery({}, { skip: activeChannel !== 'whatsapp' });
  const { data: emailStats } = useGetEmailStatsQuery({}, { skip: activeChannel !== 'email' });
  const { data: branches } = useGetBranchesQuery(user?.workspaceId, { skip: !user?.workspaceId });
  const { data: shifts } = useGetShiftsQuery(user?.workspaceId, { skip: !user?.workspaceId });

  /* ─── Device-Level Local Storage Logs (24h Auto-Purge) ─── */
  const [deviceLogs, setDeviceLogs] = useState<BroadcastLogItem[]>(() => getLocalBroadcastLogs());
  const [logsChannelFilter, setLogsChannelFilter] = useState<'all' | 'whatsapp' | 'sms' | 'email'>('all');

  useEffect(() => {
    const refreshLogs = () => {
      setDeviceLogs(getLocalBroadcastLogs());
    };
    refreshLogs();

    const handleLogsUpdated = () => refreshLogs();
    window.addEventListener('studyflow_broadcast_logs_updated', handleLogsUpdated);
    window.addEventListener('storage', handleLogsUpdated);
    const interval = setInterval(refreshLogs, 30000);

    return () => {
      window.removeEventListener('studyflow_broadcast_logs_updated', handleLogsUpdated);
      window.removeEventListener('storage', handleLogsUpdated);
      clearInterval(interval);
    };
  }, []);

  const handleDeleteDeviceLog = (id: string) => {
    deleteLocalBroadcastLog(id);
    setDeviceLogs(getLocalBroadcastLogs());
    showToast('Log entry removed from device storage.', 'info');
  };

  const handleClearDeviceLogs = () => {
    if (window.confirm('Are you sure you want to clear all message logs stored on this device?')) {
      clearLocalBroadcastLogs();
      setDeviceLogs([]);
      showToast('All local message logs cleared from device.', 'info');
    }
  };

  /* ─── Mutations ─── */
  const [sendSms, { isLoading: isSendingSms }] = useSendSmsBroadcastMutation();
  const [sendEmail, { isLoading: isSendingEmail }] = useSendEmailBroadcastMutation();
  const [createTemplate, { isLoading: isCreatingTemplate }] = useCreateWhatsAppTemplateMutation();

  /* ─── Shared filter/student state ─── */
  const [branchId, setBranchId] = useState('ALL');
  const [shiftId, setShiftId] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('EXPIRING_SOON');
  const [expiryWindow, setExpiryWindow] = useState('3'); // Default: within 3 days for fee reminders
  const [fetchTrigger, setFetchTrigger] = useState(true); // Automatically load students
  const [selectedStudentIds, setSelectedStudentIds] = useState<Record<string, boolean>>({});
  const [previewStudentIndex, setPreviewStudentIndex] = useState(0);

  const queryDays = !isNaN(Number(expiryWindow)) && (statusFilter === 'EXPIRING_SOON' || statusFilter === 'ALL')
    ? Number(expiryWindow)
    : undefined;

  const { data: studentsData, isFetching: isFetchingStudents, refetch: refetchStudents } = useGetStudentsQuery({
    branchId: branchId === 'ALL' ? undefined : branchId,
    filterShiftId: shiftId === 'ALL' ? undefined : shiftId,
    filterExpiration: statusFilter === 'ALL' || statusFilter === 'HAS_DUES' ? undefined : statusFilter,
    days: queryDays,
    limit: 1000,
  }, { skip: !fetchTrigger });

  /* ─── WhatsApp State ─── */
  const [selectedTemplateId, setSelectedTemplateId] = useState('fee_reminder');
  const [directPhone, setDirectPhone] = useState('');
  const [broadcastQueue, setBroadcastQueue] = useState<any[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [isBroadcastQueueOpen, setIsBroadcastQueueOpen] = useState(false);
  const [sentStudentIds, setSentStudentIds] = useState<Record<string, boolean>>({});
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

  // Auto-switch filter when template changes
  const handleWhatsAppTemplateChange = (tmplId: string) => {
    setSelectedTemplateId(tmplId);
    setCustomVars({});
    if (tmplId === 'fee_reminder' || tmplId === 'renewal_reminder') {
      setStatusFilter('EXPIRING_SOON');
      if (expiryWindow === 'ALL') {
        setExpiryWindow('3');
      }
      setFetchTrigger(true);
    }
  };

  /* ─── In-Memory Dynamic Student Filtering ─── */
  const filteredStudents = React.useMemo(() => {
    if (!studentsData?.students) return [];
    let list: any[] = [...studentsData.students];

    // Branch filter
    if (branchId !== 'ALL') {
      list = list.filter((s: any) => s.branchId === branchId || s.branch?.id === branchId);
    }

    // Shift filter
    if (shiftId !== 'ALL') {
      list = list.filter((s: any) => {
        const activeAlloc = s.allocations?.find((a: any) => a.isActive);
        return activeAlloc?.shiftId === shiftId;
      });
    }

    // Special status filters
    if (expiryWindow === 'HAS_DUES' || statusFilter === 'HAS_DUES') {
      return list.filter((s: any) => Number(s.dueAmount) > 0);
    }
    if (expiryWindow === 'EXPIRED' || statusFilter === 'EXPIRED') {
      return list.filter((s: any) => {
        const exp = getStudentExpiryDetails(s);
        return exp.urgency === 'expired';
      });
    }
    if (expiryWindow === 'ACTIVE' || statusFilter === 'ACTIVE') {
      return list.filter((s: any) => {
        const exp = getStudentExpiryDetails(s);
        return exp.urgency !== 'expired' && exp.diffDays !== null;
      });
    }
    if (expiryWindow === 'ALL' && statusFilter === 'ALL') {
      return list;
    }

    // Expiry Window numeric days filter (1, 3, 5, 7, 15, 30 days)
    const maxDays = Number(expiryWindow);
    if (!isNaN(maxDays)) {
      return list.filter((s: any) => {
        const exp = getStudentExpiryDetails(s);
        // Expiring within window: from today (or slightly overdue -1d) up to maxDays
        return exp.diffDays !== null && exp.diffDays >= -1 && exp.diffDays <= maxDays;
      });
    }

    return list;
  }, [studentsData, branchId, shiftId, expiryWindow, statusFilter]);

  // Keep selection synchronized with current filtered students
  useEffect(() => {
    if (filteredStudents.length > 0) {
      const selection: Record<string, boolean> = {};
      filteredStudents.forEach((s: any) => { selection[s.id] = true; });
      setSelectedStudentIds(selection);
    } else {
      setSelectedStudentIds({});
    }
  }, [filteredStudents]);

  const handleFetch = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!fetchTrigger) setFetchTrigger(true);
    else refetchStudents();
  };

  const allWhatsAppTemplates = React.useMemo(() => {
    const backendList = Array.isArray(templates) ? templates : [];
    const combined = [...PREDEFINED_WHATSAPP_TEMPLATES];
    backendList.forEach((bt: any) => {
      if (!combined.some((t) => t.id === bt.id)) {
        combined.push(bt);
      }
    });
    return combined;
  }, [templates]);

  /* ─── SMS State ─── */
  const [smsMessage, setSmsMessage] = useState('');

  /* ─── Email State ─── */
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [fromEmail, setFromEmail] = useState('StudyFlow <no-reply@trishulindustries.online>');
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

  const openWhatsAppUrl = (phone: string, message: string) => {
    let cleanPhone = (phone || '').replace(/\D/g, '').replace(/^0+/, '');
    if (!cleanPhone) {
      showToast('No valid mobile number found for this recipient.', 'warning');
      return false;
    }
    if (cleanPhone.length === 10) {
      cleanPhone = '91' + cleanPhone;
    }
    const encoded = encodeURIComponent(message);
    const url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}`;
    const win = window.open(url, '_blank');
    if (win) {
      win.focus();
      return true;
    } else {
      window.location.href = url;
      return true;
    }
  };

  const getTemplateTextPreview = (student?: any) => {
    const t = allWhatsAppTemplates.find((x: any) => x.id === selectedTemplateId) || allWhatsAppTemplates[0];
    if (!t) return customMsg || 'Hello! This is an announcement from StudyFlow.';
    let preview = t.text;

    if (student) {
      const studentName = student.displayName || student.user?.name || student.name || 'Student';
      const feeInfo = getStudentFeeDetails(student, amount);
      const expiryInfo = getStudentExpiryDetails(student, dueDate || endDate);
      const studentSeat = getStudentSeatNumber(student, seatNumber);
      const branchName = student.branch?.name || (branches && branches[0]?.name) || 'Main Branch';

      preview = preview.replace(/\{\{studentName\}\}/g, studentName);
      preview = preview.replace(/\{\{amount\}\}/g, feeInfo.amount);
      preview = preview.replace(/\{\{dueDate\}\}/g, expiryInfo.formattedDate);
      preview = preview.replace(/\{\{endDate\}\}/g, expiryInfo.formattedDate);
      preview = preview.replace(/\{\{seatNumber\}\}/g, studentSeat);
      preview = preview.replace(/\{\{branchName\}\}/g, branchName);
      preview = preview.replace(/\{\{holidayDate\}\}/g, holidayDate || '______');
      preview = preview.replace(/\{\{resumeDate\}\}/g, resumeDate || '______');
      preview = preview.replace(/\{\{reason\}\}/g, reason || '______');
      preview = preview.replace(/\{\{message\}\}/g, customMsg || '______');
      const vars = extractTemplateVariables(t.text);
      vars.forEach((v) => { preview = preview.replace(new RegExp(`\\{\\{${v}\\}\\}`, 'g'), customVars[v] || '______'); });
      return preview;
    }

    // Default right panel preview: sample from selected preview index student or fallback placeholder
    const sample = filteredStudents[previewStudentIndex] || filteredStudents[0];
    if (sample) {
      const studentName = sample.displayName || sample.user?.name || sample.name || 'Rahul Sharma';
      const feeInfo = getStudentFeeDetails(sample, amount);
      const expiryInfo = getStudentExpiryDetails(sample, dueDate || endDate);
      const studentSeat = getStudentSeatNumber(sample, seatNumber);
      const branchName = sample.branch?.name || (branches && branches[0]?.name) || 'Main Branch';

      preview = preview.replace(/\{\{studentName\}\}/g, studentName);
      preview = preview.replace(/\{\{amount\}\}/g, feeInfo.amount);
      preview = preview.replace(/\{\{dueDate\}\}/g, expiryInfo.formattedDate);
      preview = preview.replace(/\{\{endDate\}\}/g, expiryInfo.formattedDate);
      preview = preview.replace(/\{\{seatNumber\}\}/g, studentSeat);
      preview = preview.replace(/\{\{branchName\}\}/g, branchName);
    } else {
      preview = preview.replace(/\{\{studentName\}\}/g, 'Rahul Sharma');
      preview = preview.replace(/\{\{amount\}\}/g, amount || '1,200');
      preview = preview.replace(/\{\{dueDate\}\}/g, dueDate || '24 Oct 2026');
      preview = preview.replace(/\{\{endDate\}\}/g, endDate || '24 Oct 2026');
      preview = preview.replace(/\{\{seatNumber\}\}/g, seatNumber || 'A-12');
      preview = preview.replace(/\{\{branchName\}\}/g, (branches && branches[0]?.name) || 'Main Branch');
    }

    preview = preview.replace(/\{\{holidayDate\}\}/g, holidayDate || '______');
    preview = preview.replace(/\{\{resumeDate\}\}/g, resumeDate || '______');
    preview = preview.replace(/\{\{reason\}\}/g, reason || '______');
    preview = preview.replace(/\{\{message\}\}/g, customMsg || '______');
    const vars = extractTemplateVariables(t.text);
    vars.forEach((v) => { preview = preview.replace(new RegExp(`\\{\\{${v}\\}\\}`, 'g'), customVars[v] || '______'); });
    return preview;
  };

  const handleSendIndividualWa = (student: any) => {
    const message = getTemplateTextPreview(student);
    const phone = student.user?.mobile || student.contactMobile;
    if (!phone) {
      showToast(`This student (${student.user?.name || student.name || 'Student'}) has no mobile number on file.`, 'warning');
      return;
    }
    const ok = openWhatsAppUrl(phone, message);
    if (ok) {
      setSentStudentIds((prev) => ({ ...prev, [student.id]: true }));
      const feeInfo = getStudentFeeDetails(student, amount);
      const expiryInfo = getStudentExpiryDetails(student, dueDate || endDate);
      const studentSeat = getStudentSeatNumber(student, seatNumber);

      // Save strictly to local device storage (auto-deletes after 24 hours, no backend logs)
      saveLocalBroadcastLog({
        channel: 'whatsapp',
        recipient: phone,
        recipientName: student.displayName || student.user?.name || student.name || 'Student',
        recipientContact: phone,
        message,
        status: 'OPENED_WA',
        branchName: student.branch?.name,
        seatNumber: studentSeat,
        feeAmount: feeInfo.amount,
        dueDate: expiryInfo.formattedDate,
      });

      showToast(`Opening WhatsApp for ${student.user?.name || phone}...`, 'success');
    }
  };

  const handleDirectSendWa = () => {
    if (!directPhone.trim()) {
      showToast('Please enter a mobile number to open WhatsApp.', 'warning');
      return;
    }
    const sampleStudent = {
      user: { name: 'Direct Contact', mobile: directPhone },
      branch: { name: (branches && branches[0]?.name) || 'StudyFlow' },
    };
    const message = getTemplateTextPreview(sampleStudent);
    const ok = openWhatsAppUrl(directPhone, message);
    if (ok) {
      // Save strictly to local device storage (auto-deletes after 24 hours, no backend logs)
      saveLocalBroadcastLog({
        channel: 'whatsapp',
        recipient: directPhone,
        recipientName: 'Direct Contact',
        recipientContact: directPhone,
        message,
        status: 'OPENED_WA',
        branchName: (branches && branches[0]?.name) || 'StudyFlow',
      });
      showToast(`Opening WhatsApp with your message...`, 'success');
    }
  };

  const handleSendWaBroadcast = async (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault();
    if (!selectedTemplateId) { showToast('Please select a WhatsApp template.', 'warning'); return; }
    const selectedStudents = filteredStudents.filter((s: any) => selectedStudentIds[s.id]);
    if (selectedStudents.length === 0) {
      showToast('Please select at least one student recipient.', 'warning');
      return;
    }

    // Single student selected: open WhatsApp chat directly!
    if (selectedStudents.length === 1) {
      const student = selectedStudents[0];
      const message = getTemplateTextPreview(student);
      const phone = student.user?.mobile || student.contactMobile;
      if (!phone) {
        showToast(`This student (${student.user?.name || student.name || ''}) has no mobile number on file.`, 'warning');
        return;
      }
      const ok = openWhatsAppUrl(phone, message);
      if (ok) {
        setSentStudentIds((prev) => ({ ...prev, [student.id]: true }));
        const feeInfo = getStudentFeeDetails(student, amount);
        const expiryInfo = getStudentExpiryDetails(student, dueDate || endDate);
        const studentSeat = getStudentSeatNumber(student, seatNumber);

        // Save strictly to local device storage (auto-deletes after 24 hours, no backend logs)
        saveLocalBroadcastLog({
          channel: 'whatsapp',
          recipient: phone,
          recipientName: student.displayName || student.user?.name || student.name || 'Student',
          recipientContact: phone,
          message,
          status: 'OPENED_WA',
          branchName: student.branch?.name,
          seatNumber: studentSeat,
          feeAmount: feeInfo.amount,
          dueDate: expiryInfo.formattedDate,
        });

        showToast(`Opening WhatsApp for ${student.user?.name || phone}...`, 'success');
      }
      return;
    }

    // Multiple students: open first recipient immediately and open sequential queue assistant
    setBroadcastQueue(selectedStudents);
    setQueueIndex(0);
    setIsBroadcastQueueOpen(true);

    const first = selectedStudents[0];
    const firstPhone = first.user?.mobile || first.contactMobile;
    if (firstPhone) {
      const firstMessage = getTemplateTextPreview(first);
      openWhatsAppUrl(firstPhone, firstMessage);
      setSentStudentIds((prev) => ({ ...prev, [first.id]: true }));
      const feeInfo = getStudentFeeDetails(first, amount);
      const expiryInfo = getStudentExpiryDetails(first, dueDate || endDate);
      const studentSeat = getStudentSeatNumber(first, seatNumber);

      // Save strictly to local device storage (auto-deletes after 24 hours, no backend logs)
      saveLocalBroadcastLog({
        channel: 'whatsapp',
        recipient: firstPhone,
        recipientName: first.displayName || first.user?.name || first.name || 'Student',
        recipientContact: firstPhone,
        message: firstMessage,
        status: 'OPENED_WA',
        branchName: first.branch?.name,
        seatNumber: studentSeat,
        feeAmount: feeInfo.amount,
        dueDate: expiryInfo.formattedDate,
      });

      showToast(`Opening WhatsApp for 1st recipient: ${first.user?.name || 'Student'}...`, 'success');
    }
  };

  const handleCreateTemplate = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!newTemplateName.trim() || !newTemplateText.trim()) { showToast('Please fill out all template fields.', 'warning'); return; }
    try {
      await createTemplate({ name: newTemplateName, text: newTemplateText }).unwrap();
      showToast('Template created successfully!', 'success');
      setIsTemplateModalOpen(false); setNewTemplateName(''); setNewTemplateText('');
    } catch (err: any) { showToast(err?.data?.message || 'Failed to create template', 'error'); }
  };

  /* ─── SMS Send ─── */
  const handleSendSmsBroadcast = async () => {
    if (!smsMessage.trim()) { showToast('Please enter an SMS message.', 'warning'); return; }
    const selectedIds = Object.keys(selectedStudentIds).filter((k) => selectedStudentIds[k]);
    if (selectedIds.length === 0) { showToast('Please select at least one student recipient.', 'warning'); return; }
    const targetStudents = filteredStudents.filter((s: any) => selectedStudentIds[s.id]);
    try {
      await sendSms({
        message: smsMessage,
        filters: { branchId: branchId === 'ALL' ? undefined : branchId, shiftId: shiftId === 'ALL' ? undefined : shiftId, status: statusFilter === 'ALL' ? undefined : statusFilter },
        studentIds: selectedIds,
      }).unwrap();

      // Save to local device storage (auto-deletes after 24 hours)
      saveMultipleLocalBroadcastLogs(targetStudents.map((s: any) => ({
        channel: 'sms',
        recipient: s.user?.mobile || s.contactMobile || 'SMS',
        recipientName: s.displayName || s.user?.name || s.name || 'Student',
        recipientContact: s.user?.mobile || s.contactMobile || 'SMS',
        message: smsMessage,
        status: 'SENT',
        branchName: s.branch?.name,
      })));

      showToast('SMS broadcast triggered successfully!', 'success');
      setSmsMessage(''); setFetchTrigger(false);
    } catch (err: any) { showToast(err?.data?.message || 'SMS broadcast failed', 'error'); }
  };

  /* ─── Email Send ─── */
  const handleSendEmailBroadcast = async () => {
    if (!emailSubject.trim() || !emailBody.trim()) { showToast('Please enter email subject and body.', 'warning'); return; }
    if (!fromEmail.trim()) { showToast('Please enter a sender email address.', 'warning'); return; }
    const selectedIds = Object.keys(selectedStudentIds).filter((k) => selectedStudentIds[k]);
    if (selectedIds.length === 0) { showToast('Please select at least one student recipient.', 'warning'); return; }
    const targetStudents = filteredStudents.filter((s: any) => selectedStudentIds[s.id]);
    try {
      const res = await sendEmail({
        subject: emailSubject,
        message: emailBody,
        fromEmail,
        filters: { branchId: branchId === 'ALL' ? undefined : branchId, shiftId: shiftId === 'ALL' ? undefined : shiftId, status: statusFilter === 'ALL' ? undefined : statusFilter },
        studentIds: selectedIds,
      }).unwrap();

      // Save to local device storage (auto-deletes after 24 hours)
      saveMultipleLocalBroadcastLogs(targetStudents.map((s: any) => ({
        channel: 'email',
        recipient: s.user?.email || s.email || 'Email',
        recipientName: s.displayName || s.user?.name || s.name || 'Student',
        recipientContact: s.user?.email || s.email || 'Email',
        subject: emailSubject,
        message: emailBody.replace(/<[^>]+>/g, ' '),
        status: 'SENT',
        branchName: s.branch?.name,
      })));

      if (res.sentCount > 0 && res.failedCount === 0) {
        showToast(`Email broadcast sent successfully to ${res.sentCount} recipient(s)!`, 'success');
      } else if (res.sentCount > 0 && res.failedCount > 0) {
        showToast(`Email sent to ${res.sentCount} recipient(s), but ${res.failedCount} failed.`, 'warning');
      } else {
        showToast('Failed to send email broadcast. Please check recipient addresses or domain config.', 'error');
      }
      setEmailSubject(''); setEmailBody(''); setFetchTrigger(false);
    } catch (err: any) { showToast(err?.data?.message || err?.message || 'Email broadcast failed', 'error'); }
  };

  /* ─── Current channel info ─── */
  const ch = channels.find((c) => c.key === activeChannel)!;
  const isSending = activeChannel === 'sms' ? isSendingSms : activeChannel === 'email' ? isSendingEmail : false;

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
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3, alignItems: 'stretch' }}>

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
                  {/* Direct WhatsApp Quick Send Card */}
                  <Box sx={{
                    p: 2,
                    mb: 3,
                    borderRadius: '12px',
                    bgcolor: 'rgba(37, 211, 102, 0.05)',
                    border: '1px solid rgba(37, 211, 102, 0.25)',
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <MessageCircle size={16} color="#25D366" />
                        <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          Direct WhatsApp Quick Send
                        </Typography>
                      </Box>
                      <Typography sx={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                        Send composed message immediately to any mobile number
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                      <TextField
                        size="small"
                        placeholder="Enter 10-digit mobile number (e.g. 9876543210)"
                        value={directPhone}
                        onChange={(e) => setDirectPhone(e.target.value)}
                        sx={{ flex: 1, ...inputStyle }}
                        slotProps={{
                          input: {
                            startAdornment: (
                              <Box component="span" sx={{ color: 'var(--text-secondary)', fontSize: '0.85rem', mr: 1, fontWeight: 600 }}>
                                +91
                              </Box>
                            ),
                          },
                        }}
                      />
                      <Button
                        type="button"
                        variant="primary"
                        onClick={handleDirectSendWa}
                        style={{
                          backgroundColor: '#25D366',
                          borderColor: '#25D366',
                          color: '#fff',
                          padding: '8px 16px',
                          fontWeight: 600,
                          fontSize: '0.85rem',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <Send size={15} />
                        Open WhatsApp
                      </Button>
                    </Box>
                  </Box>

                  {templatesLoading ? <CircularProgress /> : (
                    <>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '20px' }}>
                        <FormControl fullWidth required size="small" sx={{ ...inputStyle, marginBottom: 0 }}>
                          <InputLabel id="template-select">Select WhatsApp Template</InputLabel>
                          <Select labelId="template-select" value={selectedTemplateId} label="Select WhatsApp Template"
                            onChange={(e) => handleWhatsAppTemplateChange(e.target.value)} MenuProps={menuProps}>
                            {allWhatsAppTemplates.map((t: any) => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
                          </Select>
                        </FormControl>
                        <Button type="button" variant="outline" onClick={() => setIsTemplateModalOpen(true)}
                          style={{ whiteSpace: 'nowrap', height: '40px', padding: '0 16px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          + New
                        </Button>
                      </div>

                      {/* 💳 Dynamic Fee Payment Reminder Controls */}
                      {selectedTemplateId === 'fee_reminder' && (
                        <Box sx={{
                          mb: 3, p: 2.5, borderRadius: '14px',
                          bgcolor: 'rgba(37, 211, 102, 0.05)',
                          border: '1px solid rgba(37, 211, 102, 0.25)',
                        }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Sparkles size={17} color="#16a34a" />
                              <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                Dynamic Per-Student Fee & Expiry Auto-Calculation
                              </Typography>
                            </Box>
                            <Chip
                              label="AUTOMATIC & DYNAMIC"
                              size="small"
                              sx={{ fontSize: '0.68rem', fontWeight: 800, bgcolor: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0' }}
                            />
                          </Box>
                          <Typography sx={{ fontSize: '0.78rem', color: 'var(--text-secondary)', mb: 2 }}>
                            Each student's message dynamically injects their exact pending dues (or active subscription plan fee), their personal due/expiry date, and seat number. Select which expiry window to target below:
                          </Typography>

                          {/* Expiry Window Selector directly inside Fee Reminder card */}
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: 'var(--text-secondary)', display: 'block', mb: 1 }}>
                              Target Students Expiring Within:
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                              {[
                                { key: '1', label: '⚡ 1 Day (Tomorrow)', icon: Clock },
                                { key: '3', label: '⏰ 3 Days (Recommended)', icon: Clock },
                                { key: '5', label: '📅 5 Days', icon: Calendar },
                                { key: '7', label: '🗓️ 7 Days', icon: Calendar },
                                { key: 'HAS_DUES', label: '💰 Has Dues > ₹0', icon: DollarSign },
                                { key: 'EXPIRED', label: '⚠️ Overdue / Expired', icon: AlertTriangle },
                                { key: 'ALL', label: '👥 All Students', icon: Users },
                              ].map((opt) => {
                                const isSelected = expiryWindow === opt.key;
                                return (
                                  <button
                                    key={opt.key}
                                    type="button"
                                    onClick={() => {
                                      setExpiryWindow(opt.key);
                                      if (['1', '3', '5', '7', '15', '30'].includes(opt.key)) {
                                        setStatusFilter('EXPIRING_SOON');
                                      } else if (opt.key === 'HAS_DUES') {
                                        setStatusFilter('HAS_DUES');
                                      } else if (opt.key === 'EXPIRED') {
                                        setStatusFilter('EXPIRED');
                                      } else if (opt.key === 'ALL') {
                                        setStatusFilter('ALL');
                                      }
                                    }}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '5px',
                                      padding: '6px 12px',
                                      borderRadius: '8px',
                                      fontSize: '0.78rem',
                                      fontWeight: isSelected ? 700 : 500,
                                      border: isSelected ? '1.5px solid #25D366' : '1px solid var(--border-color)',
                                      backgroundColor: isSelected ? '#25D366' : 'var(--bg-surface)',
                                      color: isSelected ? '#ffffff' : 'var(--text-primary)',
                                      cursor: 'pointer',
                                      transition: 'all 0.15s ease',
                                    }}
                                  >
                                    <opt.icon size={13} />
                                    {opt.label}
                                  </button>
                                );
                              })}
                            </Box>
                          </Box>

                          {/* Optional Overrides */}
                          <Box sx={{ pt: 1.5, borderTop: '1px dashed var(--border-color)', mt: 1 }}>
                            <Typography variant="caption" sx={{ color: 'var(--text-muted)', display: 'block', mb: 1 }}>
                              Optional Fallbacks (Used only if a student has no fee or plan recorded):
                            </Typography>
                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                              <TextField
                                sx={inputStyle}
                                label="Default Fee Fallback (₹)"
                                placeholder="Auto-detected per student if blank"
                                fullWidth
                                size="small"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                              />
                              <DatePicker
                                label="Default Due Date Fallback"
                                value={dueDate}
                                onChange={(val) => setDueDate(val)}
                              />
                            </Box>
                          </Box>
                        </Box>
                      )}

                      {/* ⏳ Dynamic Subscription Renewal Alert Controls */}
                      {selectedTemplateId === 'renewal_reminder' && (
                        <Box sx={{
                          mb: 3, p: 2.5, borderRadius: '14px',
                          bgcolor: 'rgba(2, 132, 199, 0.05)',
                          border: '1px solid rgba(2, 132, 199, 0.25)',
                        }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Clock size={17} color="#0284c7" />
                              <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                Dynamic Subscription Expiry & Seat Renewal
                              </Typography>
                            </Box>
                            <Chip label="SEAT & EXPIRY AUTO-DETECTED" size="small" sx={{ fontSize: '0.68rem', fontWeight: 800, bgcolor: '#e0f2fe', color: '#0369a1' }} />
                          </Box>
                          <Typography sx={{ fontSize: '0.78rem', color: 'var(--text-secondary)', mb: 2 }}>
                            Each message automatically injects the student's assigned seat number, branch, and exact plan end date.
                          </Typography>
                          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                            <DatePicker label="Fallback Expiry Date (Optional)" value={endDate} onChange={(val) => setEndDate(val)} />
                            <TextField sx={inputStyle} label="Fallback Seat Number (Optional)" placeholder="Auto-detected per student" fullWidth size="small" value={seatNumber} onChange={(e) => setSeatNumber(e.target.value)} />
                          </Box>
                        </Box>
                      )}

                      {selectedTemplateId === 'holiday_notice' && (
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2, mb: 3 }}>
                          <DatePicker label="Holiday Date" value={holidayDate} onChange={(val) => setHolidayDate(val)} />
                          <DatePicker label="Resume Date" value={resumeDate} onChange={(val) => setResumeDate(val)} />
                          <TextField sx={inputStyle} label="Reason / Occasion" placeholder="e.g. Festival Break" fullWidth size="small" value={reason} onChange={(e) => setReason(e.target.value)} />
                        </Box>
                      )}

                      {(selectedTemplateId === 'general_notice' || selectedTemplateId === 'custom_message') && (
                        <TextField
                          label={selectedTemplateId === 'custom_message' ? 'Custom WhatsApp Message' : 'Announcement Message'}
                          placeholder="Type your message text here... Personalize with {{studentName}}, {{branchName}}."
                          fullWidth
                          multiline
                          rows={3}
                          value={customMsg}
                          onChange={(e) => setCustomMsg(e.target.value)}
                          sx={{ mb: 3, ...inputStyle }}
                          helperText="Use {{studentName}} and {{branchName}} tags for dynamic personalization"
                        />
                      )}

                      {/* Dynamic custom vars */}
                      {(() => {
                        const t = allWhatsAppTemplates.find((x: any) => x.id === selectedTemplateId);
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
                  {/* Email Usage & Quota Tracker Card */}
                  <Box sx={{
                    p: 2.5,
                    mb: 2.5,
                    borderRadius: '12px',
                    bgcolor: 'var(--card-bg, #ffffff)',
                    border: '1px solid var(--border-color, #e2e8f0)',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{
                          width: 38,
                          height: 38,
                          borderRadius: '10px',
                          bgcolor: 'rgba(99, 102, 241, 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justify: 'center',
                          color: '#6366f1',
                        }}>
                          <Mail size={20} />
                        </Box>
                        <Box>
                          <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            Email Usage & Quota Tracker
                          </Typography>
                          <Typography sx={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            Resend Free Tier Quota Limits & Live Dispatch Counter
                          </Typography>
                        </Box>
                      </Box>
                      <Chip
                        label={`Total Sent: ${emailStats?.totalCount || 0}`}
                        size="small"
                        sx={{ fontWeight: 700, fontSize: '0.75rem', bgcolor: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}
                      />
                    </Box>

                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                      <Box sx={{ p: 1.5, borderRadius: '8px', border: '1px solid var(--border-color)', bgcolor: 'rgba(248, 250, 252, 0.5)' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                          <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            Daily Limit (Today)
                          </Typography>
                          <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: (emailStats?.dailyCount || 0) >= 100 ? '#ef4444' : '#10b981' }}>
                            {emailStats?.dailyCount || 0} / {emailStats?.dailyLimit || 100}
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(100, (((emailStats?.dailyCount || 0) / (emailStats?.dailyLimit || 100)) * 100))}
                          sx={{
                            height: 7,
                            borderRadius: 4,
                            bgcolor: '#e2e8f0',
                            '& .MuiLinearProgress-bar': {
                              bgcolor: (emailStats?.dailyCount || 0) >= 90 ? '#ef4444' : (emailStats?.dailyCount || 0) >= 70 ? '#f59e0b' : '#10b981',
                              borderRadius: 4,
                            },
                          }}
                        />
                        <Typography sx={{ fontSize: '0.7rem', color: 'var(--text-secondary)', mt: 0.5 }}>
                          {emailStats?.dailyRemaining ?? 100} remaining today
                        </Typography>
                      </Box>

                      <Box sx={{ p: 1.5, borderRadius: '8px', border: '1px solid var(--border-color)', bgcolor: 'rgba(248, 250, 252, 0.5)' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                          <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            Monthly Quota (This Month)
                          </Typography>
                          <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: (emailStats?.monthlyCount || 0) >= 3000 ? '#ef4444' : '#6366f1' }}>
                            {emailStats?.monthlyCount || 0} / {emailStats?.monthlyLimit || 3000}
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(100, (((emailStats?.monthlyCount || 0) / (emailStats?.monthlyLimit || 3000)) * 100))}
                          sx={{
                            height: 7,
                            borderRadius: 4,
                            bgcolor: '#e2e8f0',
                            '& .MuiLinearProgress-bar': {
                              bgcolor: (emailStats?.monthlyCount || 0) >= 2700 ? '#ef4444' : (emailStats?.monthlyCount || 0) >= 2100 ? '#f59e0b' : '#6366f1',
                              borderRadius: 4,
                            },
                          }}
                        />
                        <Typography sx={{ fontSize: '0.7rem', color: 'var(--text-secondary)', mt: 0.5 }}>
                          {emailStats?.monthlyRemaining ?? 3000} remaining this month
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  {/* Resend Domain Active Status Card */}
                  <Box sx={{
                    p: 2,
                    mb: 2.5,
                    borderRadius: '12px',
                    bgcolor: 'rgba(16, 185, 129, 0.06)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justify: 'space-between',
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{
                        width: 36,
                        height: 36,
                        borderRadius: '10px',
                        bgcolor: 'rgba(16, 185, 129, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justify: 'center',
                        color: '#10b981',
                      }}>
                        <Mail size={18} />
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          Verified Domain: <span style={{ color: '#10b981' }}>trishulindustries.online</span>
                        </Typography>
                        <Typography sx={{ fontSize: '0.73rem', color: 'var(--text-secondary)', mt: 0.2 }}>
                          Sending via Resend API (`no-reply@trishulindustries.online`)
                        </Typography>
                      </Box>
                    </Box>
                    <Chip
                      label="ACTIVE & VERIFIED"
                      size="small"
                      sx={{
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        bgcolor: '#d1fae5',
                        color: '#047857',
                        border: '1px solid #a7f3d0',
                      }}
                    />
                  </Box>

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
                    placeholder="e.g. StudyFlow <no-reply@trishulindustries.online>"
                    fullWidth size="small"
                    value={fromEmail}
                    onChange={(e) => setFromEmail(e.target.value)}
                    sx={{ mb: 2, ...inputStyle }}
                    helperText="Active Verified Resend Domain: trishulindustries.online"
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
            </Card>

            {/* Right Column — Live Message Preview Box */}
            <Card sx={{
              borderRadius: 3, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-md)',
              overflow: 'hidden', display: 'flex', flexDirection: 'column', bgcolor: 'var(--bg-surface)',
            }}>
              {/* Preview Header */}
              <Box sx={{
                bgcolor: ch.color, px: 2, py: 1.5,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1,
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{
                    width: 34, height: 34, borderRadius: '50%',
                    bgcolor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: 'bold', fontSize: '0.85rem',
                  }}>
                    <ch.icon size={17} />
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 600, lineHeight: 1.2 }}>
                      {ch.label} Preview
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.7rem' }}>
                      Live personalized preview with resolved student variables
                    </Typography>
                  </Box>
                </Box>

                {/* Student Switcher Navigation (Prev / Next) */}
                {filteredStudents.length > 0 && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, bgcolor: 'rgba(0,0,0,0.18)', borderRadius: '20px', px: 1, py: 0.25 }}>
                    <IconButton
                      size="small"
                      disabled={previewStudentIndex <= 0}
                      onClick={() => setPreviewStudentIndex((prev) => Math.max(0, prev - 1))}
                      sx={{ color: 'white', p: 0.25, '&.Mui-disabled': { color: 'rgba(255,255,255,0.3)' } }}
                      title="Previous student"
                    >
                      <ChevronLeft size={16} />
                    </IconButton>
                    <Typography variant="caption" sx={{ color: 'white', fontWeight: 700, fontSize: '0.72rem', px: 0.5 }}>
                      Student {previewStudentIndex + 1} of {filteredStudents.length}
                    </Typography>
                    <IconButton
                      size="small"
                      disabled={previewStudentIndex >= filteredStudents.length - 1}
                      onClick={() => setPreviewStudentIndex((prev) => Math.min(filteredStudents.length - 1, prev + 1))}
                      sx={{ color: 'white', p: 0.25, '&.Mui-disabled': { color: 'rgba(255,255,255,0.3)' } }}
                      title="Next student"
                    >
                      <ChevronRight size={16} />
                    </IconButton>
                  </Box>
                )}
              </Box>

              {/* Preview Body */}
              <Box sx={{
                p: 2.25, display: 'flex', flexDirection: 'column', gap: 1.5,
                bgcolor: activeChannel === 'whatsapp' ? '#efeae2' : 'var(--bg-main)',
                backgroundImage: activeChannel === 'whatsapp' ? 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")' : 'none',
                backgroundSize: 'cover',
              }}>
                {activeChannel === 'whatsapp' && (
                  <>
                    {/* Active Preview Student Pill */}
                    {filteredStudents.length > 0 && (
                      <Box sx={{
                        p: 1.25, borderRadius: '8px',
                        bgcolor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(4px)',
                        border: '1px solid rgba(0,0,0,0.08)',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        fontSize: '0.75rem', color: '#1e293b', flexWrap: 'wrap', gap: 0.5,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                          <Sparkles size={14} color="#16a34a" />
                          <span>Previewing for: <strong>{filteredStudents[previewStudentIndex]?.user?.name || filteredStudents[previewStudentIndex]?.displayName || filteredStudents[previewStudentIndex]?.name || 'Student'}</strong></span>
                        </Box>
                        <span style={{ fontWeight: 700, color: '#0284c7', fontSize: '0.72rem' }}>
                          {getStudentFeeDetails(filteredStudents[previewStudentIndex], amount).displayAmount} • Due {getStudentExpiryDetails(filteredStudents[previewStudentIndex], dueDate || endDate).formattedDate}
                        </span>
                      </Box>
                    )}

                    {/* WhatsApp Chat Bubble */}
                    <Box sx={{
                      alignSelf: 'flex-end', maxWidth: '88%', bgcolor: '#d9fdd3', color: '#303030',
                      p: 1.75, borderRadius: '8px 0px 8px 8px',
                      boxShadow: '0 1px 1px rgba(0,0,0,0.12)', position: 'relative',
                    }}>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', fontSize: '0.85rem', pr: 4, pb: 1, color: '#303030', lineHeight: 1.45 }}>
                        {selectedTemplateId ? getTemplateTextPreview() : 'Select a template to preview...'}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.25, position: 'absolute', bottom: 4, right: 6 }}>
                        <Typography variant="caption" sx={{ fontSize: '0.65rem', color: '#667781' }}>
                          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                        <svg width="16" height="11" viewBox="0 0 16 11" fill="none"><path d="M4.5 9.5L1.5 6.5L0.5 7.5L4.5 11.5L13 3L12 2L4.5 9.5Z" fill="#53bdeb"/><path d="M7.5 9.5L9.5 7.5L8.5 6.5L7.5 7.5L7.5 9.5Z" fill="#53bdeb"/><path d="M15 3L14 2L9.5 6.5L10.5 7.5L15 3Z" fill="#53bdeb"/></svg>
                      </Box>
                    </Box>

                    {/* WhatsApp Quick Action Button */}
                    <Box sx={{ pt: 0.5, display: 'flex', justifyContent: 'center' }}>
                      <Button
                        type="button"
                        variant="primary"
                        onClick={() => {
                          const msg = getTemplateTextPreview();
                          const currStudent = filteredStudents[previewStudentIndex];
                          const phone = directPhone.trim() || (currStudent && (currStudent.user?.mobile || currStudent.contactMobile || currStudent.user?.phone || currStudent.phone)) || '';
                          if (!phone) {
                            showToast('Enter a number in "Direct Quick Send" on the left or select a student from the table below.', 'info');
                          }
                          openWhatsAppUrl(phone || '', msg);
                        }}
                        style={{
                          backgroundColor: '#25D366',
                          borderColor: '#25D366',
                          color: '#fff',
                          padding: '7px 18px',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          borderRadius: '8px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 2px 8px rgba(37,211,102,0.3)',
                        }}
                      >
                        <ExternalLink size={13} />
                        Open This Preview in WhatsApp
                      </Button>
                    </Box>
                  </>
                )}

                {activeChannel === 'sms' && (
                  <Box sx={{
                    maxWidth: '85%', bgcolor: 'var(--bg-surface)', p: 2, borderRadius: '16px 16px 16px 4px',
                    border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)',
                  }}>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                      {smsMessage || 'Compose your SMS message on the left to preview...'}
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
                    <Box sx={{ bgcolor: 'var(--bg-surface-hover)', px: 2, py: 1.25, borderBottom: '1px solid var(--border-color)' }}>
                      <Typography variant="caption" sx={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>From: {fromEmail || 'StudyFlow <no-reply@trishulindustries.online>'}</Typography>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'var(--text-primary)', mt: 0.25, fontSize: '0.85rem' }}>
                        {emailSubject || 'Email Subject'}
                      </Typography>
                    </Box>
                    <Box sx={{ p: 2 }}>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', fontSize: '0.82rem', color: 'var(--text-primary)' }}
                        dangerouslySetInnerHTML={{ __html: emailBody || '<span style="color:var(--text-muted)">Compose your email on the left to preview...</span>' }}
                      />
                    </Box>
                  </Box>
                )}
              </Box>
            </Card>

          </Box>

          {/* ── FULL WIDTH SECTION 1: Target Audience & Expiry Filter ── */}
          <StudentFilterControls
            branches={branches}
            shifts={shifts}
            branchId={branchId}
            setBranchId={setBranchId}
            shiftId={shiftId}
            setShiftId={setShiftId}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            expiryWindow={expiryWindow}
            setExpiryWindow={setExpiryWindow}
            totalMatching={filteredStudents.length}
            isFetchingStudents={isFetchingStudents}
            handleFetch={handleFetch}
            selectedTemplateId={selectedTemplateId}
          />

          {/* ── FULL WIDTH SECTION 2: Target Recipients Console ── */}
          <TargetRecipientsConsole
            students={filteredStudents}
            selectedStudentIds={selectedStudentIds}
            setSelectedStudentIds={setSelectedStudentIds}
            channelLabel={ch.label}
            activeChannel={activeChannel}
            selectedTemplateId={selectedTemplateId}
            fallbackAmount={amount}
            fallbackDueDate={dueDate || endDate}
            previewStudentIndex={previewStudentIndex}
            onSelectPreviewStudent={(idx) => setPreviewStudentIndex(idx)}
            onSendSingle={handleSendIndividualWa}
            onSendBroadcast={(e) => {
              if (activeChannel === 'whatsapp') handleSendWaBroadcast(e);
              else if (activeChannel === 'sms') handleSendSmsBroadcast();
              else handleSendEmailBroadcast();
            }}
            isSending={isSending}
            sentStudentIds={sentStudentIds}
          />

        </Box>
      )}

      {/* ════════════════════════════════════════════════════════
          LOGS TAB
         ════════════════════════════════════════════════════════ */}
      {subTab === 'logs' && (
        <Box>
          <LogsTable
            logs={deviceLogs}
            onDeleteLog={handleDeleteDeviceLog}
            onClearLogs={handleClearDeviceLogs}
            selectedFilterChannel={logsChannelFilter}
            onChangeFilterChannel={setLogsChannelFilter}
          />
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

      {/* ════════════════════════════════════════════════════════
          BROADCAST DISPATCH QUEUE MODAL (WhatsApp)
         ════════════════════════════════════════════════════════ */}
      {isBroadcastQueueOpen && broadcastQueue.length > 0 && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(5px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999999, padding: '16px',
        }}>
          <div style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '16px',
            width: '100%', maxWidth: '540px', padding: '24px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column', gap: '20px',
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: 'rgba(37,211,102,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#25D366' }}>
                  <MessageCircle size={22} />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                    WhatsApp Broadcast Dispatcher
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
                    Recipient {Math.min(queueIndex + 1, broadcastQueue.length)} of {broadcastQueue.length}
                  </Typography>
                </Box>
              </Box>
              <button
                type="button"
                onClick={() => setIsBroadcastQueueOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </Box>

            {/* Progress Bar */}
            <Box>
              <LinearProgress
                variant="determinate"
                value={Math.round((Object.keys(sentStudentIds).filter(id => broadcastQueue.some(s => s.id === id)).length / broadcastQueue.length) * 100)}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: 'var(--border-color)',
                  '& .MuiLinearProgress-bar': { bgcolor: '#25D366', borderRadius: 4 },
                }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                <Typography sx={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                  {Object.keys(sentStudentIds).filter(id => broadcastQueue.some(s => s.id === id)).length} of {broadcastQueue.length} opened in WhatsApp
                </Typography>
                <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#25D366' }}>
                  {Math.round((Object.keys(sentStudentIds).filter(id => broadcastQueue.some(s => s.id === id)).length / broadcastQueue.length) * 100)}%
                </Typography>
              </Box>
            </Box>

            {/* Current Student Card */}
            {queueIndex < broadcastQueue.length ? (
              (() => {
                const curr = broadcastQueue[queueIndex];
                const currMsg = getTemplateTextPreview(curr);
                const currPhone = curr.user?.mobile || curr.contactMobile || '';
                const currFee = getStudentFeeDetails(curr, amount);
                const currExp = getStudentExpiryDetails(curr, dueDate || endDate);
                const currSeat = getStudentSeatNumber(curr);
                return (
                  <Box sx={{ p: 2.5, borderRadius: '12px', bgcolor: 'var(--bg-surface-hover)', border: '1px solid var(--border-color)' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                      <Box>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                          {curr.user?.name || curr.displayName || curr.name || 'Student'}
                        </Typography>
                        <Typography sx={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                          📱 {currPhone || 'No mobile number'} • 🏢 {curr.branch?.name || 'Branch'} • 🪑 Seat #{currSeat}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mt: 0.75, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', backgroundColor: currFee.badgeBg, color: currFee.badgeColor }}>
                            Fee: {currFee.displayAmount} ({currFee.source})
                          </span>
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', backgroundColor: currExp.chipBg, color: currExp.chipColor }}>
                            Due: {currExp.formattedDate} ({currExp.label})
                          </span>
                        </Box>
                      </Box>
                      <Chip
                        label={sentStudentIds[curr.id] ? 'Opened in WhatsApp' : 'Ready to Send'}
                        size="small"
                        color={sentStudentIds[curr.id] ? 'success' : 'default'}
                        variant="outlined"
                      />
                    </Box>

                    <Box sx={{ p: 1.5, borderRadius: '8px', bgcolor: 'var(--bg-surface)', border: '1px solid var(--border-color)', maxHeight: 110, overflowY: 'auto', mb: 2 }}>
                      <Typography sx={{ fontSize: '0.8rem', whiteSpace: 'pre-wrap', color: 'var(--text-primary)' }}>
                        {currMsg}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          if (queueIndex < broadcastQueue.length - 1) {
                            setQueueIndex(queueIndex + 1);
                          } else {
                            setIsBroadcastQueueOpen(false);
                            showToast('Broadcast queue completed!', 'success');
                          }
                        }}
                        style={{ borderRadius: '8px', padding: '8px 16px', fontSize: '0.85rem' }}
                      >
                        Skip
                      </Button>
                      <Button
                        type="button"
                        variant="primary"
                        onClick={() => {
                          if (currPhone) {
                            openWhatsAppUrl(currPhone, currMsg);
                            setSentStudentIds((prev) => ({ ...prev, [curr.id]: true }));
                            const feeInfo = getStudentFeeDetails(curr, amount);
                            const expiryInfo = getStudentExpiryDetails(curr, dueDate || endDate);
                            const studentSeat = getStudentSeatNumber(curr, seatNumber);

                            saveLocalBroadcastLog({
                              channel: 'whatsapp',
                              recipient: currPhone,
                              recipientName: curr.displayName || curr.user?.name || curr.name || 'Student',
                              recipientContact: currPhone,
                              message: currMsg,
                              status: 'OPENED_WA',
                              branchName: curr.branch?.name,
                              seatNumber: studentSeat,
                              feeAmount: feeInfo.amount,
                              dueDate: expiryInfo.formattedDate,
                            });
                          } else {
                            showToast('Student has no mobile number.', 'warning');
                          }
                          if (queueIndex < broadcastQueue.length - 1) {
                            setQueueIndex(queueIndex + 1);
                          } else {
                            setIsBroadcastQueueOpen(false);
                            showToast('All messages opened in WhatsApp!', 'success');
                          }
                        }}
                        style={{
                          backgroundColor: '#25D366',
                          borderColor: '#25D366',
                          color: '#fff',
                          borderRadius: '8px',
                          padding: '8px 20px',
                          fontWeight: 600,
                          fontSize: '0.85rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <Send size={15} />
                        Open WhatsApp & Next ➡️
                      </Button>
                    </Box>
                  </Box>
                );
              })()
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CheckCircle2 size={48} color="#25D366" style={{ margin: '0 auto 12px' }} />
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                  All Recipients Processed!
                </Typography>
                <Typography sx={{ fontSize: '0.85rem', color: 'var(--text-secondary)', mt: 1, mb: 3 }}>
                  You have completed opening WhatsApp chats for all {broadcastQueue.length} selected recipients.
                </Typography>
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => setIsBroadcastQueueOpen(false)}
                  style={{ borderRadius: '8px', padding: '8px 24px', backgroundColor: '#25D366', borderColor: '#25D366' }}
                >
                  Done
                </Button>
              </Box>
            )}
          </div>
        </div>
      )}
    </Box>
  );
}
