import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import { 
  useGetStudentByIdQuery, 
  useGetSeatMapQuery, 
  useGetShiftsQuery,
  useTransferSeatMutation 
} from '../store/api';
import { useToast } from '../components/ui/ToastContext';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Card } from '../components/ui/Card';
import { 
  ArrowLeft, 
  Armchair, 
  Building2, 
  Layers, 
  Landmark, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  Filter,
  Search,
  Calendar,
  Sparkles,
  RefreshCw,
  UserCheck
} from 'lucide-react';
import { LoadingState } from '../components/feedback/LoadingState';
import { QueryFeedback } from '../components/feedback/QueryFeedback';
import { getStudentDisplayName, getStudentInitials, getStudentEmail, getStudentMobile } from '../utils/studentUtils';
import { formatTo12hString, calculateShiftDuration, formatDateDisplay } from '../utils/dateUtils';
import { checkSeatShiftAvailability, getDaysRemainingText } from '../utils/seatUtils';
import '../components/ui/Globals.css';

export default function TransferSeat() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const allocationId = searchParams.get('allocationId') || '';
  const studentId = searchParams.get('studentId') || '';

  const { user } = useSelector((state: RootState) => state.auth);

  // 1. Fetch Student Details
  const { 
    currentData: student, 
    isFetching: isStudentLoading, 
    error: studentError, 
    refetch: retryStudent 
  } = useGetStudentByIdQuery(studentId, { skip: !studentId });

  // 2. Fetch Seat Map for Student's Branch
  const branchId = student?.branchId || '';
  const { 
    currentData: seatMap, 
    isFetching: isSeatMapLoading, 
    error: seatError, 
    refetch: retrySeats 
  } = useGetSeatMapQuery(branchId, { skip: !branchId });

  // 3. Fetch Library Shifts for Workspace
  const workspaceId = student?.workspaceId || user?.workspaceId || '';
  const { 
    data: shifts, 
    isFetching: isShiftsLoading,
    error: shiftsError,
    refetch: retryShifts
  } = useGetShiftsQuery(workspaceId, { skip: !workspaceId });

  // Transfer mutation
  const [transferSeat, { isLoading: isTransferring }] = useTransferSeatMutation();

  // Find active allocation details
  const activeAllocation = useMemo(() => {
    if (!student?.allocations) return null;
    if (allocationId) {
      const match = student.allocations.find((a: any) => a.id === allocationId && a.isActive);
      if (match) return match;
    }
    return student.allocations.find((a: any) => a.isActive) || null;
  }, [student, allocationId]);

  // Selection states
  const [targetShiftId, setTargetShiftId] = useState('');
  const [targetFloorId, setTargetFloorId] = useState('');
  const [targetRoomId, setTargetRoomId] = useState('');
  const [targetSeatId, setTargetSeatId] = useState('');
  const [filterMode, setFilterMode] = useState<'ALL' | 'AVAILABLE' | 'OCCUPIED'>('ALL');
  const [seatSearch, setSeatSearch] = useState('');

  // Initialize targetShiftId with current shift
  useEffect(() => {
    if (activeAllocation?.shiftId && !targetShiftId) {
      setTargetShiftId(activeAllocation.shiftId);
    }
  }, [activeAllocation, targetShiftId]);

  // Pre-select student's current floor, room, and seat when seatMap loads
  useEffect(() => {
    if (seatMap && seatMap.length > 0 && !targetFloorId) {
      if (activeAllocation?.seatId) {
        for (const floor of seatMap) {
          for (const room of floor.rooms || []) {
            if (room.seats?.some((s: any) => s.id === activeAllocation.seatId)) {
              setTargetFloorId(floor.id);
              setTargetRoomId(room.id);
              setTargetSeatId(activeAllocation.seatId);
              return;
            }
          }
        }
      }
      setTargetFloorId(seatMap[0].id);
      if (seatMap[0].rooms && seatMap[0].rooms.length > 0) {
        setTargetRoomId(seatMap[0].rooms[0].id);
      }
    }
  }, [seatMap, targetFloorId, activeAllocation]);

  // Handle floor changes
  const handleFloorChange = (floorId: string) => {
    setTargetFloorId(floorId);
    setTargetSeatId('');
    const floor = seatMap?.find((f: any) => f.id === floorId);
    if (floor?.rooms && floor.rooms.length > 0) {
      setTargetRoomId(floor.rooms[0].id);
    } else {
      setTargetRoomId('');
    }
  };

  // Dropdown options
  const floorOptions = useMemo(() => {
    return seatMap?.map((f: any) => ({ value: f.id, label: f.name })) || [];
  }, [seatMap]);

  const roomOptions = useMemo(() => {
    const floor = seatMap?.find((f: any) => f.id === targetFloorId);
    return floor?.rooms?.map((r: any) => ({ value: r.id, label: r.name })) || [];
  }, [seatMap, targetFloorId]);

  // Target shift object
  const targetShift = useMemo(() => {
    return shifts?.find((s: any) => s.id === targetShiftId) || activeAllocation?.shift || null;
  }, [shifts, targetShiftId, activeAllocation]);

  // Current Room seats
  const currentRoom = useMemo(() => {
    const floor = seatMap?.find((f: any) => f.id === targetFloorId);
    return floor?.rooms?.find((r: any) => r.id === targetRoomId) || null;
  }, [seatMap, targetFloorId, targetRoomId]);

  const allRoomSeats = useMemo(() => {
    return currentRoom?.seats || [];
  }, [currentRoom]);

  // Evaluate each seat for availability in targetShift
  const evaluatedSeats = useMemo(() => {
    return allRoomSeats.map((seat: any) => {
      const isCurrentSeat = seat.id === activeAllocation?.seatId;
      const availability = checkSeatShiftAvailability(
        seat,
        targetShift,
        shifts || [],
        student?.id,
        activeAllocation?.startDate,
        activeAllocation?.endDate,
      );

      return {
        ...seat,
        isCurrentSeat,
        isAvailable: availability.isAvailable,
        conflictReason: availability.reason,
        conflictingStudent: availability.conflictingStudent,
        conflictingShift: availability.conflictingShift,
      };
    });
  }, [allRoomSeats, targetShift, shifts, student, activeAllocation]);

  // Summary counts
  const availableCount = useMemo(() => {
    return evaluatedSeats.filter((s: any) => s.isAvailable).length;
  }, [evaluatedSeats]);

  const occupiedCount = useMemo(() => {
    return evaluatedSeats.filter((s: any) => !s.isAvailable && s.status !== 'BLOCKED').length;
  }, [evaluatedSeats]);

  // Filtered seats for display
  const displayedSeats = useMemo(() => {
    return evaluatedSeats.filter((seat: any) => {
      if (seatSearch.trim()) {
        const q = seatSearch.trim().toLowerCase();
        if (!seat.number?.toLowerCase().includes(q)) return false;
      }
      if (filterMode === 'AVAILABLE') {
        return seat.isAvailable;
      }
      if (filterMode === 'OCCUPIED') {
        return !seat.isAvailable && seat.status !== 'BLOCKED';
      }
      return true;
    });
  }, [evaluatedSeats, seatSearch, filterMode]);

  // Find target seat object
  const targetSeatObj = useMemo(() => {
    if (!targetSeatId) return null;
    for (const f of seatMap || []) {
      for (const r of f.rooms || []) {
        const found = r.seats?.find((s: any) => s.id === targetSeatId);
        if (found) return { ...found, roomName: r.name, floorName: f.name };
      }
    }
    return null;
  }, [seatMap, targetSeatId]);

  // Transfer classification & validation
  const isSeatChanged = Boolean(targetSeatId && targetSeatId !== activeAllocation?.seatId);
  const isShiftChanged = Boolean(targetShiftId && targetShiftId !== activeAllocation?.shiftId);
  const isTargetSeatAvailable = useMemo(() => {
    if (!targetSeatId) return false;
    const evaluated = evaluatedSeats.find((s: any) => s.id === targetSeatId);
    if (evaluated) return evaluated.isAvailable;
    // If seat is in another room or floor
    if (targetSeatObj) {
      const avail = checkSeatShiftAvailability(
        targetSeatObj,
        targetShift,
        shifts || [],
        student?.id,
        activeAllocation?.startDate,
        activeAllocation?.endDate,
      );
      return avail.isAvailable;
    }
    return false;
  }, [targetSeatId, evaluatedSeats, targetSeatObj, targetShift, shifts, student, activeAllocation]);

  const canSubmit = (isSeatChanged || isShiftChanged) && isTargetSeatAvailable;

  const handleConfirmTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allocationId || !canSubmit) return;

    try {
      await transferSeat({
        allocationId,
        targetSeatId: targetSeatId || activeAllocation?.seatId,
        targetShiftId: targetShiftId || activeAllocation?.shiftId,
      }).unwrap();

      showToast('Student seat / shift transferred successfully!', 'success');
      navigate('/seats');
    } catch (err: any) {
      showToast(err?.data?.message || 'Failed to transfer seat', 'error');
    }
  };

  // Loading & error states
  if ((isStudentLoading && !student) || (isSeatMapLoading && !seatMap) || (isShiftsLoading && !shifts)) {
    return <LoadingState label="Loading student, seat map & shift details…" />;
  }
  if (studentError) return <QueryFeedback error={studentError} fetching={isStudentLoading} onRetry={retryStudent} />;
  if (seatError) return <QueryFeedback error={seatError} fetching={isSeatMapLoading} onRetry={retrySeats} />;
  if (shiftsError) return <QueryFeedback error={shiftsError} fetching={isShiftsLoading} onRetry={retryShifts} />;

  if (!student || !activeAllocation) {
    return (
      <div style={{ maxWidth: '600px', margin: '40px auto', padding: '24px', textAlign: 'center' }}>
        <Card style={{ padding: '36px', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Armchair size={36} color="var(--text-slate)" />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-navy)', margin: 0 }}>No Active Seat Found</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-slate)', lineHeight: 1.5, margin: 0 }}>
            This student does not currently have an active seat allocation. You can only transfer students who are currently seated.
          </p>
          <Button variant="primary" onClick={() => navigate('/seats')}>
            Go to Seat Map
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', maxWidth: '1100px', margin: '0 auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Top Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button 
            onClick={() => navigate(-1)} 
            style={{ 
              border: '1px solid #e2e8f0', 
              background: '#ffffff', 
              boxShadow: 'var(--shadow-soft)', 
              cursor: 'pointer', 
              padding: '8px 14px', 
              borderRadius: '10px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              color: 'var(--text-navy)', 
              fontSize: '0.875rem', 
              fontWeight: 600,
              transition: 'background-color 0.15s ease'
            }}
          >
            <ArrowLeft size={16} /> Back to Seats
          </button>
          <div>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-navy)', margin: 0 }}>
              Seat & Shift Timing Transfer
            </h1>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-slate)', margin: '2px 0 0' }}>
              Transfer seat, switch shift timings, or both. Seat availability adapts dynamically to shifts and clubbed schedules.
            </p>
          </div>
        </div>
      </div>

      {/* Student Profile & Current Booking Overview */}
      <Card style={{ padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', alignItems: 'center' }}>
          
          {/* Student Identifiers */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ 
              width: '56px', 
              height: '56px', 
              borderRadius: '16px', 
              backgroundColor: 'var(--accent-blue)', 
              color: '#ffffff', 
              fontWeight: 800, 
              fontSize: '1.35rem', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
            }}>
              {getStudentInitials(student)}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-navy)' }}>
                {getStudentDisplayName(student)}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-slate)' }}>
                {getStudentMobile(student)} • {getStudentEmail(student)}
              </span>
              <span style={{ fontSize: '0.725rem', color: 'var(--accent-blue)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                <UserCheck size={13} /> Active Student
              </span>
            </div>
          </div>

          {/* Current Seat & Shift Details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: '#f8fafc', padding: '14px 18px', borderRadius: '14px', border: '1px solid #f1f5f9' }}>
            <div>
              <span style={{ fontSize: '0.675rem', fontWeight: 700, color: 'var(--text-slate)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Current Seat
              </span>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-blue)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Armchair size={18} /> Seat {activeAllocation.seat?.number || 'N/A'}
              </div>
            </div>
            <div>
              <span style={{ fontSize: '0.675rem', fontWeight: 700, color: 'var(--text-slate)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Current Shift
              </span>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-navy)', marginTop: '2px' }}>
                {activeAllocation.shift?.name || 'Assigned Shift'}
              </div>
              <div style={{ fontSize: '0.725rem', color: 'var(--text-slate)', marginTop: '2px' }}>
                {formatTo12hString(activeAllocation.shift?.startTime)} - {formatTo12hString(activeAllocation.shift?.endTime)}
              </div>
            </div>
          </div>

          {/* Validity Badge */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '8px' }}>
            <span style={{ fontSize: '0.725rem', color: 'var(--text-slate)', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Calendar size={13} /> Validity Period:
            </span>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-navy)' }}>
              {formatDateDisplay(activeAllocation.startDate)} to {formatDateDisplay(activeAllocation.endDate)}
            </span>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#059669', backgroundColor: '#ecfdf5', padding: '2px 8px', borderRadius: '6px', alignSelf: 'flex-start' }}>
              {getDaysRemainingText(activeAllocation.endDate)}
            </span>
          </div>

        </div>
      </Card>

      {/* Main Two-Column Workflow */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 340px) 1fr', gap: '24px', alignItems: 'start' }}>
        
        {/* Left Column: Shift Timing Selection & Transfer Preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* STEP 1: Select Shift / Timing */}
          <Card style={{ padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={18} color="var(--accent-blue)" />
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-navy)' }}>
                  1. Target Shift Timing
                </h3>
              </div>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', backgroundColor: 'rgba(37, 99, 235, 0.08)', color: 'var(--accent-blue)' }}>
                Timing Transfer
              </span>
            </div>

            <p style={{ fontSize: '0.775rem', color: 'var(--text-slate)', margin: 0, lineHeight: 1.4 }}>
              Select the shift timing for the student. You can keep the current shift or switch to any other library shift.
            </p>

            {/* List of Shifts */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '340px', overflowY: 'auto', paddingRight: '2px' }}>
              {shifts && shifts.length > 0 ? (
                shifts.map((s: any) => {
                  const isSelected = targetShiftId === s.id;
                  const isCurrent = activeAllocation.shiftId === s.id;
                  const duration = calculateShiftDuration(s.startTime, s.endTime);
                  const isClubbed = s.type === 'CLUBBED';

                  return (
                    <div
                      key={s.id}
                      onClick={() => setTargetShiftId(s.id)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '12px',
                        border: isSelected ? '2px solid var(--accent-blue)' : '1px solid #e2e8f0',
                        backgroundColor: isSelected ? 'rgba(37, 99, 235, 0.04)' : '#ffffff',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        position: 'relative'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input 
                            type="radio" 
                            name="targetShift" 
                            checked={isSelected} 
                            onChange={() => setTargetShiftId(s.id)} 
                            style={{ cursor: 'pointer', accentColor: 'var(--accent-blue)' }} 
                          />
                          <span style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-navy)' }}>
                            {s.name}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {isCurrent && (
                            <span style={{ fontSize: '0.65rem', fontWeight: 700, backgroundColor: '#f1f5f9', color: 'var(--text-slate)', padding: '2px 6px', borderRadius: '4px' }}>
                              Current
                            </span>
                          )}
                          {isClubbed && (
                            <span style={{ fontSize: '0.65rem', fontWeight: 700, backgroundColor: '#fef3c7', color: '#92400e', padding: '2px 6px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <Sparkles size={10} /> Clubbed
                            </span>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-slate)', paddingLeft: '22px' }}>
                        <span>{formatTo12hString(s.startTime)} - {formatTo12hString(s.endTime)}</span>
                        {duration && <span style={{ fontWeight: 600 }}>{duration}</span>}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-slate)', fontSize: '0.8rem', border: '1px dashed #cbd5e1', borderRadius: '10px' }}>
                  No shifts found for this library.
                </div>
              )}
            </div>
          </Card>

          {/* Transfer Summary & Action Confirmation */}
          <Card style={{ padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-navy)', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
              Transfer Summary
            </h3>

            {/* From -> To Comparison */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
              
              {/* From */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-slate)', minWidth: '45px', textTransform: 'uppercase' }}>FROM:</span>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-navy)' }}>
                    Seat {activeAllocation.seat?.number || 'N/A'}
                  </span>
                  <span style={{ fontSize: '0.725rem', color: 'var(--text-slate)' }}>
                    {activeAllocation.shift?.name} ({formatTo12hString(activeAllocation.shift?.startTime)} - {formatTo12hString(activeAllocation.shift?.endTime)})
                  </span>
                </div>
              </div>

              {/* Arrow divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-blue)', paddingLeft: '45px' }}>
                <ArrowRight size={16} />
              </div>

              {/* To */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent-blue)', minWidth: '45px', textTransform: 'uppercase' }}>TO:</span>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: targetSeatObj ? 'var(--accent-blue)' : '#94a3b8' }}>
                    {targetSeatObj ? `Seat ${targetSeatObj.number} (${targetSeatObj.roomName})` : 'Select a seat from map'}
                  </span>
                  <span style={{ fontSize: '0.725rem', color: 'var(--text-navy)' }}>
                    {targetShift ? `${targetShift.name} (${formatTo12hString(targetShift.startTime)} - ${formatTo12hString(targetShift.endTime)})` : 'Select shift'}
                  </span>
                </div>
              </div>

            </div>

            {/* Status change explanation */}
            <div>
              {isSeatChanged && isShiftChanged ? (
                <div style={{ padding: '8px 12px', borderRadius: '8px', backgroundColor: 'rgba(37, 99, 235, 0.08)', color: 'var(--accent-blue)', fontSize: '0.775rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={14} /> Changing seat and updating shift timing
                </div>
              ) : isSeatChanged ? (
                <div style={{ padding: '8px 12px', borderRadius: '8px', backgroundColor: 'rgba(37, 99, 235, 0.08)', color: 'var(--accent-blue)', fontSize: '0.775rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <RefreshCw size={14} /> Transferring seat (Shift timing unchanged)
                </div>
              ) : isShiftChanged ? (
                <div style={{ padding: '8px 12px', borderRadius: '8px', backgroundColor: '#ecfdf5', color: '#059669', fontSize: '0.775rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={14} /> Changing shift timing on current seat
                </div>
              ) : (
                <div style={{ padding: '8px 12px', borderRadius: '8px', backgroundColor: '#f1f5f9', color: 'var(--text-slate)', fontSize: '0.75rem' }}>
                  Select a different seat or shift timing to enable transfer.
                </div>
              )}
            </div>

            {/* Transfer Rules */}
            <div style={{ fontSize: '0.725rem', color: 'var(--text-slate)', display: 'flex', flexDirection: 'column', gap: '4px', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
              <span style={{ fontWeight: 700, color: 'var(--text-navy)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Landmark size={13} color="var(--accent-blue)" /> Transfer Rules:
              </span>
              <span>• Transfers apply immediately upon confirmation.</span>
              <span>• Vacated slot is made instantly available for others.</span>
              <span>• Clubbed shift overlap rules are strictly enforced.</span>
            </div>

            {/* Confirm Transfer Button */}
            <Button
              type="button"
              variant="primary"
              onClick={handleConfirmTransfer}
              disabled={!canSubmit || isTransferring}
              isLoading={isTransferring}
              style={{
                width: '100%',
                padding: '12px',
                fontWeight: 700,
                fontSize: '0.875rem',
                backgroundColor: canSubmit ? 'var(--accent-blue)' : undefined,
                borderColor: canSubmit ? 'var(--accent-blue)' : undefined,
              }}
            >
              {isSeatChanged && isShiftChanged
                ? 'Confirm Seat & Timing Transfer'
                : isSeatChanged
                ? 'Confirm Seat Transfer'
                : isShiftChanged
                ? 'Confirm Shift Timing Change'
                : 'Choose a Seat or Shift to Transfer'}
            </Button>
          </Card>

        </div>

        {/* Right Column: Floor/Room Selection and Shift-Aware Seat Map */}
        <Card style={{ padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Armchair size={20} color="var(--accent-blue)" />
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-navy)' }}>
                  2. Room & Seat Map
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.775rem', color: 'var(--text-slate)' }}>
                  Showing vacant seats for <strong style={{ color: 'var(--accent-blue)' }}>{targetShift?.name || 'Selected Shift'}</strong>
                </p>
              </div>
            </div>

            {/* Vacancy counter badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '4px 10px', borderRadius: '8px', backgroundColor: '#ecfdf5', color: '#059669', border: '1px solid #d1fae5' }}>
                {availableCount} Available
              </span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '4px 10px', borderRadius: '8px', backgroundColor: '#fef2f2', color: '#b91c1c', border: '1px solid #fee2e2' }}>
                {occupiedCount} Occupied
              </span>
            </div>
          </div>

          {/* Floor & Room Selectors */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-slate)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Layers size={14} /> Floor
              </label>
              <Select
                value={targetFloorId}
                onChange={handleFloorChange}
                placeholder="Select Floor"
                options={floorOptions}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-slate)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Building2 size={14} /> Room
              </label>
              <Select
                value={targetRoomId}
                onChange={(val) => { setTargetRoomId(val); setTargetSeatId(''); }}
                placeholder="Select Room"
                disabled={!targetFloorId}
                options={roomOptions}
              />
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', backgroundColor: '#f8fafc', padding: '10px 14px', borderRadius: '12px' }}>
            
            {/* Quick Filter Tabs */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Filter size={14} color="var(--text-slate)" />
              {(['ALL', 'AVAILABLE', 'OCCUPIED'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setFilterMode(mode)}
                  style={{
                    border: 'none',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    fontSize: '0.725rem',
                    fontWeight: filterMode === mode ? 700 : 500,
                    cursor: 'pointer',
                    backgroundColor: filterMode === mode ? 'var(--accent-blue)' : '#ffffff',
                    color: filterMode === mode ? '#ffffff' : 'var(--text-slate)',
                    boxShadow: filterMode === mode ? '0 2px 6px rgba(37,99,235,0.25)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {mode === 'ALL' ? `All (${evaluatedSeats.length})` : mode === 'AVAILABLE' ? `Available (${availableCount})` : `Occupied (${occupiedCount})`}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '4px 10px' }}>
              <Search size={13} color="var(--text-slate)" />
              <input
                type="text"
                placeholder="Search seat #..."
                value={seatSearch}
                onChange={(e) => setSeatSearch(e.target.value)}
                style={{ border: 'none', outline: 'none', fontSize: '0.75rem', width: '100px', color: 'var(--text-navy)' }}
              />
            </div>

          </div>

          {/* Legend */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', fontSize: '0.7rem', color: 'var(--text-slate)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981' }} /> Vacant in this shift
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ef4444' }} /> Occupied / Overlap
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--accent-blue)' }} /> Selected Target
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '3px', border: '2px dashed var(--accent-blue)' }} /> Current Student Seat
            </span>
          </div>

          {/* Dynamic Seat Grid */}
          <div style={{ minHeight: '260px' }}>
            {displayedSeats.length > 0 ? (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', 
                gap: '12px', 
                maxHeight: '440px', 
                overflowY: 'auto', 
                padding: '4px' 
              }}>
                {displayedSeats.map((seat: any) => {
                  const isSelected = targetSeatId === seat.id;
                  const isCurrent = seat.isCurrentSeat;
                  const isAvailable = seat.isAvailable;
                  const isBlocked = seat.status === 'BLOCKED' || seat.status === 'MAINTENANCE';

                  let borderColor = '#e2e8f0';
                  let bgColor = '#ffffff';
                  let textColor = 'var(--text-navy)';
                  let cursor = 'pointer';

                  if (isBlocked) {
                    borderColor = '#cbd5e1';
                    bgColor = '#f1f5f9';
                    textColor = '#94a3b8';
                    cursor = 'not-allowed';
                  } else if (isSelected) {
                    borderColor = 'var(--accent-blue)';
                    bgColor = 'rgba(37, 99, 235, 0.08)';
                    textColor = 'var(--accent-blue)';
                  } else if (isAvailable) {
                    borderColor = '#a7f3d0';
                    bgColor = '#f0fdf4';
                    textColor = '#065f46';
                  } else {
                    borderColor = '#fecaca';
                    bgColor = '#fef2f2';
                    textColor = '#991b1b';
                    cursor = 'not-allowed';
                  }

                  return (
                    <div
                      key={seat.id}
                      onClick={() => {
                        if (isBlocked) return;
                        if (!isAvailable && !isCurrent) {
                          showToast(seat.conflictReason || 'Seat is occupied during this shift timing', 'error');
                          return;
                        }
                        if (isCurrent && !isAvailable) {
                          showToast(seat.conflictReason || 'Current seat has an overlapping allocation during this shift timing', 'error');
                          return;
                        }
                        setTargetSeatId(seat.id);
                      }}
                      title={seat.conflictReason || (isAvailable ? 'Available for selection' : '')}
                      style={{
                        padding: '12px 8px',
                        borderRadius: '12px',
                        border: isSelected ? '2px solid var(--accent-blue)' : `1px solid ${borderColor}`,
                        backgroundColor: bgColor,
                        color: textColor,
                        textAlign: 'center',
                        cursor,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'all 0.15s ease',
                        boxShadow: isSelected ? '0 4px 12px rgba(37,99,235,0.2)' : 'none',
                        position: 'relative',
                        outline: isCurrent ? '2px dashed var(--accent-blue)' : 'none',
                        outlineOffset: '2px'
                      }}
                    >
                      {/* Current Seat Badge */}
                      {isCurrent && (
                        <span style={{ 
                          fontSize: '0.6rem', 
                          fontWeight: 800, 
                          backgroundColor: 'var(--accent-blue)', 
                          color: '#ffffff', 
                          padding: '1px 5px', 
                          borderRadius: '4px',
                          textTransform: 'uppercase'
                        }}>
                          Current
                        </span>
                      )}

                      {/* Seat Number */}
                      <span style={{ fontSize: '1rem', fontWeight: 800 }}>
                        {seat.number}
                      </span>

                      {/* Seat Status Indicator */}
                      {isBlocked ? (
                        <span style={{ fontSize: '0.625rem', fontWeight: 600, color: '#94a3b8' }}>
                          Blocked
                        </span>
                      ) : isSelected ? (
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <CheckCircle2 size={11} /> Selected
                        </span>
                      ) : isAvailable ? (
                        <span style={{ fontSize: '0.625rem', fontWeight: 700, color: '#059669' }}>
                          Vacant
                        </span>
                      ) : (
                        <span 
                          style={{ 
                            fontSize: '0.6rem', 
                            fontWeight: 700, 
                            color: '#dc2626',
                            maxWidth: '90px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                          title={seat.conflictReason}
                        >
                          Occupied
                        </span>
                      )}

                      {/* If Occupied, display conflicting shift tag */}
                      {!isAvailable && seat.conflictingShift && (
                        <span 
                          style={{ 
                            fontSize: '0.575rem', 
                            color: '#991b1b', 
                            backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                            padding: '1px 4px', 
                            borderRadius: '3px',
                            maxWidth: '85px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                          title={seat.conflictReason}
                        >
                          {seat.conflictingShift}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-slate)', border: '1px dashed #cbd5e1', borderRadius: '14px', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                <AlertCircle size={32} color="var(--text-slate)" />
                <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>No seats found matching filter</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-slate)' }}>Try selecting another room or clearing search filter</span>
              </div>
            )}
          </div>

        </Card>

      </div>

    </div>
  );
}
