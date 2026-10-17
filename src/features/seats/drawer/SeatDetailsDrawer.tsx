import React from 'react';
import { X, Plus, Wrench } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { AssignSeatForm } from './AssignSeatForm';
import type { AssignSeatFormProps } from './AssignSeatForm';
import { SeatAllocationDetails } from './SeatAllocationDetails';
import { RenewSeatForm } from './RenewSeatForm';
import { getSeatStatusInfo } from '../../../utils/seatUtils';
import { getStudentDisplayName } from '../../../utils/studentUtils';
import type { Seat, Shift, DrawerSection } from '../types';

export interface SeatDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSeat: Seat | null;
  branchName?: string;
  floorName?: string;
  onOpenAllocateModal: () => void;
  // Allocation state
  selectedAllocationId: string;
  onSelectAllocationId: (id: string) => void;
  drawerActiveSection: DrawerSection;
  onChangeDrawerActiveSection: (section: DrawerSection) => void;
  onNavigateToTransfer: (allocationId: string, studentId: string) => void;
  // Date edit state
  isEditingDates: boolean;
  onToggleEditDates: () => void;
  editStartDate: string;
  onChangeEditStartDate: (val: string) => void;
  editEndDate: string;
  onChangeEditEndDate: (val: string) => void;
  onSaveDates: (e: React.FormEvent) => void;
  isUpdatingDates?: boolean;
  onVacateSeat: () => void;
  isVacating?: boolean;
  // Renewal form
  shifts?: Shift[];
  renewShiftId: string;
  onRenewShiftChange: (id: string) => void;
  renewDuration: number | string;
  onRenewDurationChange: (dur: number | string) => void;
  renewStartDate: string;
  onRenewStartDateChange: (d: string) => void;
  renewEndDate: string;
  onRenewEndDateChange: (d: string) => void;
  renewAmount: string;
  onRenewAmountChange: (amt: string) => void;
  renewPaymentMethod: 'UPI' | 'CASH' | 'RAZORPAY';
  onRenewPaymentMethodChange: (m: 'UPI' | 'CASH' | 'RAZORPAY') => void;
  onRenewSubmit: (e: React.FormEvent) => void;
  isRenewing?: boolean;
  // Assign form props
  assignFormProps: Omit<AssignSeatFormProps, 'selectedSeat' | 'shifts'>;
  // Seat actions
  onDeleteSeat: (seatId: string) => void;
  onUpdateSeatStatus: (seatId: string, status: 'AVAILABLE' | 'BLOCKED') => void;
}

export const SeatDetailsDrawer: React.FC<SeatDetailsDrawerProps> = ({
  isOpen,
  onClose,
  selectedSeat,
  branchName = '',
  floorName = '',
  onOpenAllocateModal,
  selectedAllocationId,
  onSelectAllocationId,
  drawerActiveSection,
  onChangeDrawerActiveSection,
  onNavigateToTransfer,
  isEditingDates,
  onToggleEditDates,
  editStartDate,
  onChangeEditStartDate,
  editEndDate,
  onChangeEditEndDate,
  onSaveDates,
  isUpdatingDates = false,
  onVacateSeat,
  isVacating = false,
  shifts = [],
  renewShiftId,
  onRenewShiftChange,
  renewDuration,
  onRenewDurationChange,
  renewStartDate,
  onRenewStartDateChange,
  renewEndDate,
  onRenewEndDateChange,
  renewAmount,
  onRenewAmountChange,
  renewPaymentMethod,
  onRenewPaymentMethodChange,
  onRenewSubmit,
  isRenewing = false,
  assignFormProps,
  onDeleteSeat,
  onUpdateSeatStatus,
}) => {
  if (!selectedSeat) return null;

  const statusInfo = getSeatStatusInfo(selectedSeat);
  const isOccupied = statusInfo.isOccupied;
  const isExpired = statusInfo.isExpired;
  const activeAllocations = statusInfo.currentAllocations || [];
  const activeAllocation =
    activeAllocations.find((a: any) => a.id === selectedAllocationId) || activeAllocations[0];

  const getStatusLabel = () => {
    if (selectedSeat.status === 'BLOCKED') return 'Maintenance';
    if (isExpired) return 'Expired';
    return selectedSeat.status.charAt(0) + selectedSeat.status.slice(1).toLowerCase();
  };

  return (
    <>
      <div className={`drawer-backdrop ${isOpen ? 'open' : ''}`} onClick={onClose} />
      <div className={`right-drawer-panel ${isOpen ? 'open' : ''}`}>
        {/* Header */}
        <div className="drawer-header">
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: '1.15rem',
                fontWeight: 800,
                color: 'var(--text-navy)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              Seat {selectedSeat.number || selectedSeat.seatNumber}
              <span
                className={`status-pill ${isExpired ? 'expired' : selectedSeat.status.toLowerCase()}`}
                style={isExpired ? { backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--status-red)' } : undefined}
              >
                {getStatusLabel()}
              </span>
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-slate)' }}>
              Branch: {branchName} • Floor: {floorName}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {selectedSeat.status !== 'BLOCKED' && (
              <button
                type="button"
                onClick={onOpenAllocateModal}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 12px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: 'var(--accent-blue)',
                  color: '#ffffff',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-soft)',
                  transition: 'opacity 150ms ease',
                }}
              >
                <Plus size={14} />
                <span>Add Student</span>
              </button>
            )}
            <button
              onClick={onClose}
              style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-slate)', padding: '4px' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="drawer-body">
          {/* Available / Unoccupied State */}
          {(selectedSeat.status === 'AVAILABLE' || (selectedSeat.status === 'OCCUPIED' && !isOccupied)) && (
            <>
              <AssignSeatForm {...assignFormProps} selectedSeat={selectedSeat} shifts={shifts} />
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  borderTop: '1px solid var(--border-card)',
                  paddingTop: '12px',
                  marginTop: '16px',
                }}
              >
                <button
                  type="button"
                  onClick={() => onDeleteSeat(selectedSeat.id)}
                  style={{
                    flex: 1,
                    background: 'none',
                    border: '1px solid rgba(239, 68, 68, 0.15)',
                    color: 'var(--status-red)',
                    borderRadius: '10px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    padding: '8px',
                    cursor: 'pointer',
                  }}
                >
                  Delete Seat
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateSeatStatus(selectedSeat.id, 'BLOCKED')}
                  style={{
                    flex: 1,
                    background: 'none',
                    border: '1px solid rgba(245, 158, 11, 0.15)',
                    color: 'var(--status-amber)',
                    borderRadius: '10px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    padding: '8px',
                    cursor: 'pointer',
                  }}
                >
                  Block Seat
                </button>
              </div>
            </>
          )}

          {/* Occupied State */}
          {selectedSeat.status === 'OCCUPIED' && isOccupied && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Multi-occupant tabs */}
              {activeAllocations.length > 1 && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    borderBottom: '1px solid rgba(15,23,42,0.05)',
                    paddingBottom: '12px',
                    marginBottom: '4px',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.675rem',
                      fontWeight: 700,
                      color: 'var(--text-slate)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.02em',
                    }}
                  >
                    Current Occupants
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {activeAllocations.map((alloc: any) => {
                      const isCurrent = alloc.id === (activeAllocation?.id);
                      return (
                        <div
                          key={alloc.id}
                          onClick={() => onSelectAllocationId(alloc.id)}
                          style={{
                            padding: '8px 12px',
                            borderRadius: '10px',
                            border: isCurrent ? '1.5px solid var(--accent-blue)' : '1px solid rgba(15,23,42,0.08)',
                            backgroundColor: isCurrent ? '#f0fdf4' : '#ffffff',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            transition: 'all 150ms ease',
                          }}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-navy)' }}>
                              {getStudentDisplayName(alloc.studentProfile)}
                            </span>
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-slate)' }}>
                              Shift: {alloc.shift?.name}
                            </span>
                          </div>
                          <span
                            style={{
                              fontSize: '0.6rem',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              backgroundColor: isCurrent ? 'var(--accent-blue)' : '#f1f5f9',
                              color: isCurrent ? '#ffffff' : 'var(--text-slate)',
                              fontWeight: 600,
                            }}
                          >
                            {isCurrent ? 'Viewing' : 'Select'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Sub-tab navigation */}
              <div style={{ display: 'flex', background: '#F1F5F9', padding: '4px', borderRadius: '12px', gap: '4px' }}>
                {(['DETAILS', 'TRANSFER', 'RENEW', 'ASSIGN'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      if (tab === 'TRANSFER') {
                        if (activeAllocation) {
                          onNavigateToTransfer(activeAllocation.id, activeAllocation.studentProfileId);
                        }
                      } else {
                        onChangeDrawerActiveSection(tab);
                      }
                    }}
                    style={{
                      flex: 1,
                      border: 'none',
                      padding: '6px',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: drawerActiveSection === tab ? '#ffffff' : 'transparent',
                      color: drawerActiveSection === tab ? 'var(--text-navy)' : 'var(--text-slate)',
                      cursor: 'pointer',
                      transition: 'all 150ms ease',
                    }}
                  >
                    {tab === 'DETAILS' ? 'Details' : tab === 'TRANSFER' ? 'Transfer' : tab === 'RENEW' ? 'Renew' : 'Assign'}
                  </button>
                ))}
              </div>

              {/* DETAILS Tab */}
              {drawerActiveSection === 'DETAILS' && activeAllocation && (
                <SeatAllocationDetails
                  allocation={activeAllocation}
                  isEditingDates={isEditingDates}
                  onToggleEditDates={onToggleEditDates}
                  editStartDate={editStartDate}
                  onEditStartDateChange={onChangeEditStartDate}
                  editEndDate={editEndDate}
                  onEditEndDateChange={onChangeEditEndDate}
                  onSaveDates={onSaveDates}
                  isUpdatingDates={isUpdatingDates}
                  onVacateSeat={onVacateSeat}
                  isVacating={isVacating}
                />
              )}

              {/* RENEW Tab */}
              {drawerActiveSection === 'RENEW' && (
                <RenewSeatForm
                  shifts={shifts}
                  renewShiftId={renewShiftId}
                  onShiftChange={onRenewShiftChange}
                  renewDuration={renewDuration}
                  onDurationChange={onRenewDurationChange}
                  renewStartDate={renewStartDate}
                  onStartDateChange={onRenewStartDateChange}
                  renewEndDate={renewEndDate}
                  onEndDateChange={onRenewEndDateChange}
                  renewAmount={renewAmount}
                  onAmountChange={onRenewAmountChange}
                  renewPaymentMethod={renewPaymentMethod}
                  onPaymentMethodChange={onRenewPaymentMethodChange}
                  onSubmit={onRenewSubmit}
                  isRenewing={isRenewing}
                />
              )}

              {/* ASSIGN Tab */}
              {drawerActiveSection === 'ASSIGN' && (
                <AssignSeatForm {...assignFormProps} selectedSeat={selectedSeat} shifts={shifts} />
              )}
            </div>
          )}

          {/* Blocked / Maintenance State */}
          {selectedSeat.status === 'BLOCKED' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--status-amber)' }}>
                <Wrench size={18} />
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>Seat Under Maintenance</h4>
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-slate)' }}>
                This seat is marked blocked or under maintenance and cannot be assigned to students.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                <Button
                  type="button"
                  variant="primary"
                  style={{ backgroundColor: 'var(--status-emerald)', borderColor: 'var(--status-emerald)' }}
                  onClick={() => onUpdateSeatStatus(selectedSeat.id, 'AVAILABLE')}
                >
                  Mark Available
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  style={{ color: 'var(--status-red)', borderColor: 'rgba(239,68,68,0.3)' }}
                  onClick={() => onDeleteSeat(selectedSeat.id)}
                >
                  Delete Seat Permanently
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="drawer-footer">
          <Button variant="outline" size="sm" onClick={onClose} style={{ borderRadius: '10px' }}>
            Close Panel
          </Button>
        </div>
      </div>
    </>
  );
};
