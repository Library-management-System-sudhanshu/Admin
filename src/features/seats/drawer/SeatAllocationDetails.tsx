import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Edit2,
  Clock,
  Eye,
  EyeOff,
  LogOut,
} from 'lucide-react';
import { AllocationDatesForm } from './AllocationDatesForm';
import { getStudentDisplayName, getStudentInitials, getStudentMobile, getStudentEmail } from '../../../utils/studentUtils';
import { getDaysRemainingText } from '../../../utils/seatUtils';
import { formatPlanDuration } from '../../../utils/dateUtils';

export interface SeatAllocationDetailsProps {
  allocation: any;
  isEditingDates: boolean;
  onToggleEditDates: () => void;
  editStartDate: string;
  onEditStartDateChange: (val: string) => void;
  editEndDate: string;
  onEditEndDateChange: (val: string) => void;
  onSaveDates: (e: React.FormEvent) => void;
  isUpdatingDates?: boolean;
  onVacateSeat: () => void;
  isVacating?: boolean;
}

export const SeatAllocationDetails: React.FC<SeatAllocationDetailsProps> = ({
  allocation,
  isEditingDates,
  onToggleEditDates,
  editStartDate,
  onEditStartDateChange,
  editEndDate,
  onEditEndDateChange,
  onSaveDates,
  isUpdatingDates = false,
  onVacateSeat,
  isVacating = false,
}) => {
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const student = allocation.studentProfile;
  const nameInit = getStudentInitials(student);
  const latestPayment =
    student?.payments && student.payments.length > 0
      ? [...student.payments].sort(
          (a: any, b: any) =>
            new Date(b.paidAt || b.createdAt).getTime() - new Date(a.paidAt || a.createdAt).getTime()
        )[0]
      : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Student Details Card */}
      <div
        className="glass-card"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          padding: '12px',
          background: '#eff6ff',
          borderColor: 'rgba(37, 99, 235, 0.15)',
          borderRadius: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                backgroundColor: 'var(--accent-blue)',
                color: 'white',
                fontWeight: 700,
                fontSize: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {nameInit}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <span
                style={{
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  color: 'var(--text-navy)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {getStudentDisplayName(student)}
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-slate)' }}>
                ID: STD-{student?.id?.slice(0, 4).toUpperCase() || 'XXXX'}
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-slate)', marginTop: '1px' }}>
                {getStudentMobile(student)}
              </span>
              <span
                style={{
                  fontSize: '0.7rem',
                  color: 'var(--text-slate)',
                  marginTop: '1px',
                  textTransform: 'lowercase',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {getStudentEmail(student)}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
            style={{
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              color: 'var(--accent-blue)',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isDetailsExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>

        {/* Collapsible Extra Details */}
        {isDetailsExpanded && (
          <div
            style={{
              borderTop: '1px solid rgba(37, 99, 235, 0.1)',
              paddingTop: '10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
              <span style={{ color: 'var(--text-slate)' }}>Guardian Name:</span>
              <span style={{ fontWeight: 600, color: 'var(--text-navy)' }}>
                {student?.guardianName || 'N/A'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
              <span style={{ color: 'var(--text-slate)' }}>Guardian Mobile:</span>
              <span style={{ fontWeight: 600, color: 'var(--text-navy)' }}>
                {student?.guardianMobile || 'N/A'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
              <span style={{ color: 'var(--text-slate)' }}>Aadhar Card:</span>
              <span style={{ fontWeight: 600, color: 'var(--text-navy)' }}>
                {student?.aadharNumber || 'N/A'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
              <span style={{ color: 'var(--text-slate)' }}>Subscription Start:</span>
              <span style={{ fontWeight: 600, color: 'var(--text-navy)' }}>
                {allocation.startDate ? new Date(allocation.startDate).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
              <span style={{ color: 'var(--text-slate)' }}>Password:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    fontWeight: 600,
                    color: 'var(--text-navy)',
                    fontFamily: 'monospace',
                    fontSize: '0.82rem',
                  }}
                >
                  {showPassword ? student?.user?.rawPassword || 'Student@123' : '••••••••'}
                </span>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Hide Password' : 'Show Password'}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '2px 4px',
                    color: 'var(--accent-blue)',
                    display: 'flex',
                    alignItems: 'center',
                    borderRadius: '4px',
                  }}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Subscription Info and dates */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h5 style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-slate)', textTransform: 'uppercase' }}>
            Subscription Dates
          </h5>
          <button
            type="button"
            onClick={onToggleEditDates}
            style={{
              border: 'none',
              background: 'none',
              color: 'var(--accent-blue)',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Edit2 size={12} /> {isEditingDates ? 'Cancel' : 'Edit'}
          </button>
        </div>

        {isEditingDates ? (
          <AllocationDatesForm
            startDate={editStartDate}
            endDate={editEndDate}
            onStartDateChange={onEditStartDateChange}
            onEndDateChange={onEditEndDateChange}
            onSubmit={onSaveDates}
            isLoading={isUpdatingDates}
          />
        ) : (
          <div
            style={{
              background: '#ffffff',
              padding: '12px',
              borderRadius: '12px',
              border: '1px solid var(--border-card)',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #f1f5f9', paddingBottom: '4px', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-slate)' }}>Shift Batch:</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-blue)' }}>
                {allocation.shift?.name}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-slate)' }}>Plan Duration:</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-navy)' }}>
                {formatPlanDuration(allocation.startDate, allocation.endDate)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-slate)' }}>Start date:</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-navy)' }}>
                {new Date(allocation.startDate).toLocaleDateString()}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-slate)' }}>End date:</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-navy)' }}>
                {new Date(allocation.endDate).toLocaleDateString()}
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                color: 'var(--accent-blue)',
                fontSize: '0.75rem',
                fontWeight: 700,
                marginTop: '4px',
                borderTop: '1px solid #f1f5f9',
                paddingTop: '6px',
              }}
            >
              <Clock size={12} />
              <span>{getDaysRemainingText(allocation.endDate)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Last Payment Status Details */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <h5 style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-slate)', textTransform: 'uppercase' }}>
          Last Invoice Payment
        </h5>
        {latestPayment ? (
          <div
            style={{
              background: '#ffffff',
              padding: '12px',
              borderRadius: '12px',
              border: '1px solid var(--border-card)',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-slate)' }}>Amount:</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-navy)' }}>
                ₹{latestPayment.amount}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-slate)' }}>Method:</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-navy)' }}>
                {latestPayment.method}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-slate)' }}>Status:</span>
              {(() => {
                const paid = Number(latestPayment.amount || 0);
                const due = latestPayment.dueAmount !== undefined ? Number(latestPayment.dueAmount) : 0;
                const effStatus = latestPayment.status === 'PAID'
                  ? 'PAID'
                  : latestPayment.status === 'PARTIAL' || (paid > 0 && due > 0) || (latestPayment.status === 'UNPAID' && paid > 0)
                  ? 'PARTIAL'
                  : 'UNPAID';
                const color = effStatus === 'PAID' ? 'var(--status-emerald)' : effStatus === 'PARTIAL' ? '#d97706' : 'var(--status-red)';
                return (
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color }}>
                    {effStatus}
                  </span>
                );
              })()}
            </div>
          </div>
        ) : (
          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-slate)' }}>
            No payment record found
          </p>
        )}
      </div>

      {/* Vacate Seat Action */}
      <div style={{ borderTop: '1px solid var(--border-card)', paddingTop: '16px', marginTop: '16px' }}>
        <button
          type="button"
          onClick={onVacateSeat}
          disabled={isVacating}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '10px',
            borderRadius: '12px',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            backgroundColor: '#fef2f2',
            color: 'var(--status-red)',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'background 150ms ease',
          }}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#fee2e2')}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#fef2f2')}
        >
          <LogOut size={14} style={{ transform: 'rotate(180deg)' }} /> Vacate Seat Pod
        </button>
      </div>
    </div>
  );
};
