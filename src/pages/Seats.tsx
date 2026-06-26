import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import {
  useGetSeatMapQuery,
  useGetBranchesQuery,
  useGetShiftsQuery,
  useGetStudentsQuery,
  useAllocateSeatMutation,
  useTransferSeatMutation,
  useUpdateAllocationMutation,
  useAddFloorMutation,
  useAddRoomMutation,
  useAddSeatMutation,
  useDeleteFloorMutation,
  useDeleteRoomMutation,
  useDeleteSeatMutation,
  useVacateSeatMutation,
  useUpdateSeatStatusMutation,
  useUpdateSeatLayoutMutation,
  useUpdateFloorMutation,
  useUpdateRoomMutation,
  useCreatePaymentMutation,
  useGetPlansQuery,
} from '../store/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Select } from '../components/ui/Select';
import { useAlert } from '../components/ui/AlertContext';
import '../components/ui/Globals.css';
import {
  Plus,
  Layers,
  DoorOpen,
  Trash2,
  Loader2,
  Search,
  ChevronDown,
  Edit2,
  UserCog,
  LogOut,
  Clock,
  Map,
  LayoutGrid
} from 'lucide-react';

const getDaysRemainingText = (endDateStr: string) => {
  if (!endDateStr) return 'No end date';
  const end = new Date(endDateStr);
  const today = new Date();
  end.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const diffTime = end.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'Expired';
  if (diffDays === 0) return 'Ends today';
  return `Ends in ${diffDays} days`;
};

export default function Seats() {
  const { showAlert } = useAlert();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const { data: branches } = useGetBranchesQuery(user?.workspaceId, { skip: !user?.workspaceId });
  const [selectedBranch, setSelectedBranch] = useState('');

  const { data: seatMap, isLoading: isMapLoading } = useGetSeatMapQuery(selectedBranch, {
    skip: !selectedBranch,
  });
  const { data: shifts } = useGetShiftsQuery(user?.workspaceId, { skip: !user?.workspaceId });
  const { data: studentsData } = useGetStudentsQuery({ status: 'APPROVED' });
  const { data: plans } = useGetPlansQuery(user?.workspaceId, { skip: !user?.workspaceId });

  // Navigation states
  const [activeFloorTab, setActiveFloorTab] = useState(0);
  const currentFloor = seatMap?.[activeFloorTab];

  // Dialog states
  const [openAllocate, setOpenAllocate] = useState(false);
  const [openTransfer, setOpenTransfer] = useState(false);
  const [selectedSeat, setSelectedSeat] = useState<any>(null);

  // Allocation forms
  const [studentProfileId, setStudentProfileId] = useState('');
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [shiftId, setShiftId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [durationMode, setDurationMode] = useState<number | 'flex'>(1); // 1-6 months, or 'flex'

  // Billing/Invoice states
  const [shouldGenerateInvoice, setShouldGenerateInvoice] = useState(true);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI' | 'RAZORPAY'>('CASH');

  // Success Invoice Receipt Modal states
  const [openInvoiceReceipt, setOpenInvoiceReceipt] = useState(false);
  const [createdInvoiceData, setCreatedInvoiceData] = useState<any>(null);

  // Renewal form states
  const [renewPlanId, setRenewPlanId] = useState('');
  const [renewShiftId, setRenewShiftId] = useState('');
  const [renewStartDate, setRenewStartDate] = useState('');
  const [renewEndDate, setRenewEndDate] = useState('');
  const [renewPaymentMethod, setRenewPaymentMethod] = useState<'CASH' | 'UPI' | 'RAZORPAY'>('UPI');
  const [renewAmount, setRenewAmount] = useState('');
  const [isRenewing, setIsRenewing] = useState(false);

  // Edit current allocation states
  const [isEditingDates, setIsEditingDates] = useState(false);
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [roomSearches, setRoomSearches] = useState<Record<string, string>>({});
  const [collapsedRooms, setCollapsedRooms] = useState<Record<string, boolean>>({});


  useEffect(() => {
    if (renewPlanId && plans) {
      const plan = plans.find((p: any) => p.id === renewPlanId);
      if (plan && renewStartDate) {
        const start = new Date(renewStartDate);
        if (!isNaN(start.getTime())) {
          start.setDate(start.getDate() + (plan.durationDays || 30));
          setRenewEndDate(start.toISOString().split('T')[0]);
          setRenewAmount(plan.price.toString());
        }
      }
    }
  }, [renewPlanId, renewStartDate, plans]);

  useEffect(() => {
    if (durationMode === 'flex') {
      return;
    }
    if (startDate && typeof durationMode === 'number') {
      const date = new Date(startDate);
      if (!isNaN(date.getTime())) {
        date.setMonth(date.getMonth() + durationMode);
        setEndDate(date.toISOString().split('T')[0]);
      }
    } else {
      setEndDate('');
    }
  }, [startDate, durationMode]);

  // Calculate auto-filled amount based on shift and duration
  const calculatedBaseAmount = useMemo(() => {
    if (!shiftId || !shifts) return 0;
    const shift = shifts.find((s: any) => s.id === shiftId);
    if (!shift) return 0;

    const basePrice = shift.price || 0;

    if (typeof durationMode === 'number') {
      return basePrice * durationMode;
    } else if (durationMode === 'flex' && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        const diffTime = end.getTime() - start.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 0) {
          return Math.round(basePrice * (diffDays / 30));
        }
      }
    }
    return basePrice;
  }, [shiftId, shifts, durationMode, startDate, endDate]);

  useEffect(() => {
    if (calculatedBaseAmount > 0) {
      setInvoiceAmount(calculatedBaseAmount.toString());
    } else {
      setInvoiceAmount('');
    }
  }, [calculatedBaseAmount]);

  // Transfer forms
  const [targetSeatId, setTargetSeatId] = useState('');
  const [targetFloorId, setTargetFloorId] = useState('');
  const [targetRoomId, setTargetRoomId] = useState('');

  // Creator forms
  const [openCreator, setOpenCreator] = useState(false);
  const [creatorType, setCreatorType] = useState<'floor' | 'room' | 'seat'>('floor');
  const [parentId, setParentId] = useState<string>('');
  const [creatorName, setCreatorName] = useState('');

  const [openMaintenance, setOpenMaintenance] = useState(false);

  // Edit/Delete Floor states
  const [isFloorDropdownOpen, setIsFloorDropdownOpen] = useState(false);
  const [openEditFloorModal, setOpenEditFloorModal] = useState(false);
  const [editFloorName, setEditFloorName] = useState('');
  const [selectedFloorToEdit, setSelectedFloorToEdit] = useState<any>(null);

  // Edit Room states
  const [openEditRoomModal, setOpenEditRoomModal] = useState(false);
  const [editRoomName, setEditRoomName] = useState('');
  const [selectedRoomToEdit, setSelectedRoomToEdit] = useState<any>(null);

  const [allocateSeat, { isLoading: isAllocating }] = useAllocateSeatMutation();
  const [createPayment, { isLoading: isCreatingPayment }] = useCreatePaymentMutation();
  const [transferSeat, { isLoading: isTransferring }] = useTransferSeatMutation();
  const [updateAllocation, { isLoading: isUpdatingAllocation }] = useUpdateAllocationMutation();
  const [vacateSeat, { isLoading: isVacating }] = useVacateSeatMutation();
  const [addFloor] = useAddFloorMutation();
  const [addRoom] = useAddRoomMutation();
  const [addSeat] = useAddSeatMutation();
  const [deleteFloor] = useDeleteFloorMutation();
  const [deleteRoom] = useDeleteRoomMutation();
  const [deleteSeat] = useDeleteSeatMutation();
  const [updateSeatStatus] = useUpdateSeatStatusMutation();
  const [updateFloor] = useUpdateFloorMutation();
  const [updateRoom] = useUpdateRoomMutation();
  const [updateSeatLayout, { isLoading: isUpdatingLayout }] = useUpdateSeatLayoutMutation();

  // Floor Visualization layout states
  const [isFloorVisualization, setIsFloorVisualization] = useState(false);
  const [tempLayout, setTempLayout] = useState<Record<string, { x: number; y: number }>>({});
  const [activeRoomEditingId, setActiveRoomEditingId] = useState<string | null>(null);

  // Helper to calculate default layout coordinates if null (spread in rows of 10)
  const getSeatPosition = (seat: any, index: number) => {
    if (tempLayout[seat.id]) {
      return tempLayout[seat.id];
    }
    if (seat.x !== null && seat.y !== null && seat.x !== undefined && seat.y !== undefined) {
      return { x: seat.x, y: seat.y };
    }
    const cols = 10;
    const row = Math.floor(index / cols);
    const col = index % cols;
    const x = col * 9 + 5;
    const y = row * 12 + 5;
    return { x, y };
  };

  // Pointer drag handler
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>, seatId: string) => {
    if (activeRoomEditingId === null) return;
    e.preventDefault();
    const element = e.currentTarget;
    element.setPointerCapture(e.pointerId);
    
    const container = element.parentElement;
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    const seatRect = element.getBoundingClientRect();
    
    const offsetX = e.clientX - seatRect.left;
    const offsetY = e.clientY - seatRect.top;
    
    const handlePointerMove = (moveEvent: PointerEvent) => {
      let newLeftPercent = ((moveEvent.clientX - containerRect.left - offsetX) / containerRect.width) * 100;
      let newTopPercent = ((moveEvent.clientY - containerRect.top - offsetY) / containerRect.height) * 100;
      
      newLeftPercent = Math.max(0, Math.min(92, newLeftPercent));
      newTopPercent = Math.max(0, Math.min(88, newTopPercent));
      
      // Grid snapping to 2.5%
      const snapVal = 2.5;
      newLeftPercent = Math.round(newLeftPercent / snapVal) * snapVal;
      newTopPercent = Math.round(newTopPercent / snapVal) * snapVal;
      
      setTempLayout(prev => ({
        ...prev,
        [seatId]: { x: newLeftPercent, y: newTopPercent }
      }));
    };
    
    const handlePointerUp = (upEvent: PointerEvent) => {
      element.releasePointerCapture(upEvent.pointerId);
      element.removeEventListener('pointermove', handlePointerMove);
      element.removeEventListener('pointerup', handlePointerUp);
    };
    
    element.addEventListener('pointermove', handlePointerMove);
    element.addEventListener('pointerup', handlePointerUp);
  };

  const handleSaveLayout = async (room: any) => {
    const layoutPayload = room.seats.map((seat: any, idx: number) => {
      const pos = getSeatPosition(seat, idx);
      return { id: seat.id, x: pos.x, y: pos.y };
    });

    try {
      await updateSeatLayout({ roomId: room.id, layout: layoutPayload }).unwrap();
      showAlert('Seat positions saved successfully!');
      setActiveRoomEditingId(null);
      setTempLayout({});
    } catch (err: any) {
      showAlert(err.data?.message || 'Failed to save seat layout');
    }
  };

  const seatCounts = useMemo(() => {
    if (!seatMap) return { available: 0, occupied: 0, maintenance: 0, total: 0 };
    let available = 0, occupied = 0, maintenance = 0;
    seatMap.forEach((floor: any) => {
      floor.rooms?.forEach((room: any) => {
        room.seats?.forEach((seat: any) => {
          if (seat.status === 'AVAILABLE') available++;
          else if (seat.status === 'OCCUPIED') occupied++;
          else if (seat.status === 'BLOCKED') maintenance++;
        });
      });
    });
    return { available, occupied, maintenance, total: available + occupied + maintenance };
  }, [seatMap]);

  useEffect(() => {
    if (branches && branches.length > 0 && !selectedBranch) {
      setSelectedBranch(branches[0].id);
    }
  }, [branches, selectedBranch]);

  const filteredStudents = useMemo(() => {
    if (!studentsData?.students) return [];
    const query = studentSearchQuery.trim().toLowerCase();
    return studentsData.students.filter((student: any) => {
      if (!query) return true;
      return (
        student.user?.name?.toLowerCase().includes(query) ||
        student.user?.mobile?.includes(query) ||
        student.user?.email?.toLowerCase().includes(query)
      );
    });
  }, [studentsData, studentSearchQuery]);

  const displayedStudents = useMemo(() => {
    return filteredStudents.slice(0, 8);
  }, [filteredStudents]);

  useEffect(() => {
    if (!openAllocate) {
      setStudentProfileId('');
      setStudentSearchQuery('');
      setShowStudentDropdown(false);
      setShiftId('');
      setStartDate('');
      setEndDate('');
      setDurationMode(1);
      setShouldGenerateInvoice(true);
      setSelectedPlanId('');
      setInvoiceAmount('');
      setPaymentMethod('CASH');
    } else {
      const today = new Date().toISOString().split('T')[0];
      setStartDate(today);
      if (shifts && shifts.length > 0) {
        setShiftId(shifts[0].id);
      }
    }
  }, [openAllocate, shifts]);

  useEffect(() => {
    if (openTransfer) {
      if (currentFloor) {
        setTargetFloorId(currentFloor.id);
        if (currentFloor.rooms && currentFloor.rooms.length > 0) {
          setTargetRoomId(currentFloor.rooms[0].id);
        }
      }
    } else {
      setTargetFloorId('');
      setTargetRoomId('');
      setTargetSeatId('');
    }
  }, [openTransfer, currentFloor]);

  const handleSeatClick = (seat: any) => {
    setSelectedSeat(seat);
    if (seat.status === 'AVAILABLE') {
      setOpenAllocate(true);
    } else if (seat.status === 'OCCUPIED') {
      const activeAllocation = seat.allocations?.find((a: any) => a.isActive);
      if (activeAllocation) {
        const nextDay = new Date(activeAllocation.endDate);
        nextDay.setDate(nextDay.getDate() + 1);
        setRenewStartDate(nextDay.toISOString().split('T')[0]);
        setRenewShiftId(activeAllocation.shiftId || '');
        setEditStartDate(activeAllocation.startDate ? activeAllocation.startDate.split('T')[0] : '');
        setEditEndDate(activeAllocation.endDate ? activeAllocation.endDate.split('T')[0] : '');
      }
      setIsEditingDates(false);
      setRenewPlanId('');
      setRenewEndDate('');
      setRenewAmount('');
      setRenewPaymentMethod('UPI');
      setOpenTransfer(true);
    } else if (seat.status === 'BLOCKED') {
      setOpenMaintenance(true);
    }
  };

  const handleRenewSeat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSeat) return;
    const activeAllocation = selectedSeat.allocations?.find((a: any) => a.isActive);
    if (!activeAllocation) return;

    setIsRenewing(true);
    try {
      // 1. Vacate current seat allocation to make it AVAILABLE
      await vacateSeat(selectedSeat.id).unwrap();

      // 2. Allocate seat to same student with new details
      await allocateSeat({
        studentProfileId: activeAllocation.studentProfileId,
        seatId: selectedSeat.id,
        shiftId: renewShiftId,
        startDate: renewStartDate,
        endDate: renewEndDate,
      }).unwrap();

      // 3. Create payment transaction for renewal
      const paymentResult = await createPayment({
        studentProfileId: activeAllocation.studentProfileId,
        amount: Number(renewAmount),
        method: renewPaymentMethod,
        subscriptionPlanId: renewPlanId || undefined,
      }).unwrap();

      // Show success receipt modal
      const invoiceInfo = {
        payment: paymentResult.payment,
        student: activeAllocation.studentProfile,
        seatNumber: selectedSeat?.number,
        shift: shifts?.find((s: any) => s.id === renewShiftId),
        startDate: renewStartDate,
        endDate: renewEndDate,
        branchName: branches?.find((b: any) => b.id === selectedBranch)?.name,
        originalAmount: Number(renewAmount),
        payableAmount: Number(renewAmount),
      };
      setCreatedInvoiceData(invoiceInfo);
      setOpenTransfer(false);
      setOpenInvoiceReceipt(true);
      showAlert('Seat renewed successfully!', { title: 'Success' });
    } catch (err: any) {
      showAlert(err?.data?.message || 'Seat renewal failed', { title: 'Error' });
    } finally {
      setIsRenewing(false);
    }
  };

  const handleUpdateAllocationDates = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSeat) return;
    const activeAllocation = selectedSeat.allocations?.find((a: any) => a.isActive);
    if (!activeAllocation) return;

    try {
      await updateAllocation({
        id: activeAllocation.id,
        startDate: editStartDate,
        endDate: editEndDate,
      }).unwrap();
      showAlert('Subscription dates updated successfully!', { title: 'Success' });
      setIsEditingDates(false);
      setOpenTransfer(false);
    } catch (err: any) {
      showAlert(err?.data?.message || 'Failed to update subscription dates', { title: 'Error' });
    }
  };

  const handleAllocate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // 1. Allocate the seat
      await allocateSeat({
        studentProfileId,
        seatId: selectedSeat.id,
        shiftId,
        startDate,
        endDate,
      }).unwrap();

      // 2. Generate invoice if requested
      if (shouldGenerateInvoice) {
        const paymentResult = await createPayment({
          studentProfileId,
          amount: Number(invoiceAmount),
          method: paymentMethod,
          subscriptionPlanId: selectedPlanId || undefined,
        }).unwrap();

        // Prepare the detailed receipt data
        const invoiceInfo = {
          payment: paymentResult.payment,
          student: studentsData?.students?.find((s: any) => s.id === studentProfileId),
          seatNumber: selectedSeat?.number,
          shift: shifts?.find((s: any) => s.id === shiftId),
          startDate,
          endDate,
          branchName: branches?.find((b: any) => b.id === selectedBranch)?.name,
          originalAmount: calculatedBaseAmount,
          payableAmount: Number(invoiceAmount),
        };
        setCreatedInvoiceData(invoiceInfo);
        setOpenInvoiceReceipt(true);
      } else {
        showAlert('Seat allocated successfully!');
      }

      setOpenAllocate(false);
      setStudentProfileId('');
      setShiftId('');
      setStartDate('');
      setEndDate('');
    } catch (err: any) {
      showAlert(err.data?.message || 'Seat allocation failed');
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    const activeAllocation = selectedSeat?.allocations?.find((a: any) => a.isActive);
    if (!activeAllocation) return;

    try {
      await transferSeat({
        allocationId: activeAllocation.id,
        targetSeatId,
      }).unwrap();
      setOpenTransfer(false);
      setTargetSeatId('');
    } catch (err) {
      showAlert('Seat transfer failed');
    }
  };

  const handleVacateSeat = async () => {
    if (!selectedSeat) return;
    try {
      await vacateSeat(selectedSeat.id).unwrap();
      setOpenTransfer(false);
      setSelectedSeat(null);
    } catch (err: any) {
      showAlert(err.data?.message || 'Failed to vacate seat');
    }
  };

  const handleCreate = async () => {
    try {
      if (creatorType === 'floor') {
        await addFloor({ branchId: selectedBranch, name: creatorName }).unwrap();
      } else if (creatorType === 'room') {
        await addRoom({ floorId: parentId, name: creatorName }).unwrap();
      } else if (creatorType === 'seat') {
        if (creatorName.includes('-')) {
          const [startStr, endStr] = creatorName.split('-');
          const start = parseInt(startStr.trim(), 10);
          const end = parseInt(endStr.trim(), 10);
          if (!isNaN(start) && !isNaN(end) && start <= end && end - start <= 200) {
            for (let i = start; i <= end; i++) {
              await addSeat({ roomId: parentId, number: i.toString() }).unwrap();
            }
          } else {
            await addSeat({ roomId: parentId, number: creatorName }).unwrap();
          }
        } else {
          await addSeat({ roomId: parentId, number: creatorName }).unwrap();
        }
      }
      setOpenCreator(false);
      setCreatorName('');
    } catch (err) {
      showAlert('Creation failed');
    }
  };

  const handleDeleteFloor = async (id: string) => {
    const confirmed = await showAlert('Are you sure you want to delete this floor and all its rooms and seats?', { type: 'danger' });
    if (!confirmed) return;
    try {
      await deleteFloor(id).unwrap();
      setActiveFloorTab(0);
    } catch (err: any) {
      showAlert(err.data?.message || 'Failed to delete floor');
    }
  };

  const handleDeleteRoom = async (id: string) => {
    const confirmed = await showAlert('Are you sure you want to delete this room and all its seats?', { type: 'danger' });
    if (!confirmed) return;
    try {
      await deleteRoom(id).unwrap();
    } catch (err: any) {
      showAlert(err.data?.message || 'Failed to delete room');
    }
  };

  const handleDeleteSeat = async (id: string) => {
    const confirmed = await showAlert('Are you sure you want to delete this seat?', { type: 'danger' });
    if (!confirmed) return;
    try {
      await deleteSeat(id).unwrap();
      setOpenAllocate(false);
    } catch (err: any) {
      showAlert(err.data?.message || 'Failed to delete seat');
    }
  };

  // Modern, clean status design logic (white background, colored accent)
  const getSeatStyle = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return { accent: 'var(--success)', iconColor: 'var(--success)' };
      case 'OCCUPIED':
        return { accent: 'var(--primary)', iconColor: 'var(--primary)' };
      case 'RESERVED':
        return { accent: 'var(--warning)', iconColor: 'var(--warning)' };
      default:
        return { accent: 'var(--text-muted)', iconColor: 'var(--text-muted)' };
    }
  };

  return (
    <div style={{ width: '100%' }}>      {/* Header & Controls in one sleek row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <h1 className="page-title" style={{ margin: 0 }}>Interactive Seat Map</h1>
            
            <Select
              value={selectedBranch}
              onChange={(val) => {
                setSelectedBranch(val);
                setActiveFloorTab(0);
              }}
              placeholder="Select Branch"
              style={{ width: '200px' }}
              options={branches?.map((b: any) => ({
                value: b.id,
                label: b.name,
              })) || []}
            />

            {/* Custom Floor Selector Dropdown */}
            {selectedBranch && seatMap && seatMap.length > 0 && (
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setIsFloorDropdownOpen(!isFloorDropdownOpen)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.5rem',
                    padding: '0.4rem 0.75rem',
                    fontSize: '0.875rem',
                    backgroundColor: '#ffffff',
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    width: '180px',
                    height: '34px',
                    fontWeight: 500,
                    color: '#0f172a',
                    textAlign: 'left'
                  }}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {seatMap[activeFloorTab]?.name || 'Select Floor'}
                  </span>
                  <ChevronDown size={16} style={{ color: '#64748b', flexShrink: 0 }} />
                </button>

                {isFloorDropdownOpen && (
                  <>
                    <div 
                      onClick={() => setIsFloorDropdownOpen(false)}
                      style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 999,
                        background: 'transparent'
                      }}
                    />
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      backgroundColor: '#ffffff',
                      border: '1px solid var(--border-color)',
                      borderRadius: '0.5rem',
                      boxShadow: 'var(--shadow-lg)',
                      zIndex: 1000,
                      marginTop: '0.25rem',
                      maxHeight: '200px',
                      overflowY: 'auto',
                    }}>
                      {seatMap.map((floor: any, idx: number) => (
                        <div
                          key={floor.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.5rem 0.75rem',
                            cursor: 'pointer',
                            backgroundColor: activeFloorTab === idx ? 'var(--bg-surface-hover)' : 'transparent',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseOver={(e) => {
                            if (activeFloorTab !== idx) e.currentTarget.style.backgroundColor = '#f8fafc';
                          }}
                          onMouseOut={(e) => {
                            if (activeFloorTab !== idx) e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          <span
                            onClick={() => {
                              setActiveFloorTab(idx);
                              setIsFloorDropdownOpen(false);
                            }}
                            style={{
                              flex: 1,
                              fontSize: '0.875rem',
                              color: activeFloorTab === idx ? 'var(--primary)' : '#0f172a',
                              fontWeight: activeFloorTab === idx ? 600 : 400,
                            }}
                          >
                            {floor.name}
                          </span>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent choosing floor when clicking edit
                              setEditFloorName(floor.name);
                              setSelectedFloorToEdit(floor);
                              setOpenEditFloorModal(true);
                              setIsFloorDropdownOpen(false);
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#64748b',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '0.25rem',
                              borderRadius: '0.25rem',
                              transition: 'all 0.15s ease',
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.color = 'var(--primary)';
                              e.currentTarget.style.backgroundColor = 'rgba(37, 99, 235, 0.08)';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.color = '#64748b';
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                            title="Edit Floor"
                          >
                            <Edit2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
          
          {/* Seat Summary Component */}
          {selectedBranch && seatMap && (
            <div style={{
              display: 'flex',
              gap: '1rem',
              marginTop: '1.25rem',
              marginBottom: '1rem',
              width: '100%',
              flexWrap: 'nowrap'
            }}>
              {/* Total Seats */}
              <Card
                elevation="sm"
                style={{
                  padding: '1rem 1.25rem',
                  border: '1px solid var(--border-color)',
                  borderTop: '4px solid #64748b',
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: '0.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.35rem',
                  flex: 1,
                  minWidth: 0
                }}
              >
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Total Seats</span>
                <span style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1 }}>{seatCounts.total}</span>
              </Card>

              {/* Available */}
              <Card
                elevation="sm"
                style={{
                  padding: '1rem 1.25rem',
                  border: '1px solid var(--border-color)',
                  borderTop: '4px solid var(--success)',
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: '0.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.35rem',
                  flex: 1,
                  minWidth: 0
                }}
              >
                <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Available</span>
                <span style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--success)', lineHeight: 1.1 }}>{seatCounts.available}</span>
              </Card>

              {/* Occupied */}
              <Card
                elevation="sm"
                style={{
                  padding: '1rem 1.25rem',
                  border: '1px solid var(--border-color)',
                  borderTop: '4px solid var(--primary)',
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: '0.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.35rem',
                  flex: 1,
                  minWidth: 0
                }}
              >
                <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Occupied</span>
                <span style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--primary)', lineHeight: 1.1 }}>{seatCounts.occupied}</span>
              </Card>

              {/* Maintenance */}
              <Card
                elevation="sm"
                style={{
                  padding: '1rem 1.25rem',
                  border: '1px solid var(--border-color)',
                  borderTop: '4px solid var(--text-muted)',
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: '0.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.35rem',
                  flex: 1,
                  minWidth: 0
                }}
              >
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Maintenance</span>
                <span style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-muted)', lineHeight: 1.1 }}>{seatCounts.maintenance}</span>
              </Card>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {selectedBranch && seatMap && seatMap.length > 0 && (
            <Button
              variant={isFloorVisualization ? "primary" : "outline"}
              size="sm"
              onClick={() => {
                if (activeRoomEditingId) {
                  const confirm = window.confirm("You have unsaved layout changes. Are you sure you want to exit visualization mode?");
                  if (!confirm) return;
                  setActiveRoomEditingId(null);
                  setTempLayout({});
                }
                setIsFloorVisualization(!isFloorVisualization);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: isFloorVisualization ? '#14213d' : '#ffffff',
                color: isFloorVisualization ? '#ffffff' : '#0f172a',
                borderColor: '#cbd5e1'
              }}
            >
              {isFloorVisualization ? <LayoutGrid size={16} /> : <Map size={16} />}
              {isFloorVisualization ? "Grid View" : "Floor Visualization"}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setCreatorType('floor');
              setOpenCreator(true);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Layers size={16} /> + Floor
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setCreatorType('room');
              setOpenCreator(true);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <DoorOpen size={16} /> + Room
          </Button>
          <Button
            variant="primary"
            size="sm"
            style={{ backgroundColor: '#14213d', borderColor: '#14213d', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            onClick={() => {
              setCreatorType('seat');
              setOpenCreator(true);
            }}
          >
            <Plus size={16} /> Add Seat
          </Button>
        </div>
      </div>

      {/* Map Loader */}
      {isMapLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '3rem', color: 'var(--primary)' }}>
          <Loader2 className="spinner" size={40} />
        </div>
      ) : !seatMap || seatMap.length === 0 ? (
        <div style={{ padding: '4rem 2rem', textAlign: 'center', backgroundColor: 'var(--bg-surface)', borderRadius: '1rem', border: '1px solid var(--border-color)' }}>
          <p className="text-muted">No floor configuration found for this branch.</p>
        </div>
      ) : (
        <div>


          {/* Rooms Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {currentFloor?.rooms.map((room: any) => {
              const query = (roomSearches[room.id] || '').trim().toLowerCase();
              let matchCount = 0;
              if (query) {
                matchCount = room.seats?.filter((seat: any) => {
                  const isOccupied = seat.status === 'OCCUPIED';
                  const activeAllocation = seat.allocations?.find((a: any) => a.isActive);
                  return seat.number.toLowerCase().includes(query) ||
                    (isOccupied && (
                      activeAllocation?.studentProfile?.user?.name?.toLowerCase().includes(query) ||
                      activeAllocation?.studentProfile?.user?.email?.toLowerCase().includes(query) ||
                      activeAllocation?.studentProfile?.user?.mobile?.includes(query)
                    ));
                }).length || 0;
              }

              return (
                <Card key={room.id} elevation="sm" style={{ padding: '1.5rem', border: '1px solid var(--border-color)', overflow: 'visible' }}>
                  
                  {/* Room Header & Actions */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: collapsedRooms[room.id] ? '0' : '1.5rem',
                    borderBottom: collapsedRooms[room.id] ? 'none' : '1px solid var(--border-color)',
                    paddingBottom: collapsedRooms[room.id] ? '0' : '1rem',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    transition: 'all 0.2s ease'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                      {/* Collapse/Expand Toggle Button */}
                      <button
                        type="button"
                        onClick={() => setCollapsedRooms(prev => ({ ...prev, [room.id]: !prev[room.id] }))}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '0.25rem',
                          borderRadius: '0.25rem',
                          transition: 'all 0.15s ease',
                          marginRight: '-0.25rem'
                        }}
                        title={collapsedRooms[room.id] ? "Expand Room" : "Collapse Room"}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <ChevronDown
                          size={18}
                          style={{
                            transform: collapsedRooms[room.id] ? 'rotate(-90deg)' : 'rotate(0deg)',
                            transition: 'transform 0.25s ease',
                            color: '#64748b'
                          }}
                        />
                      </button>

                      <div style={{ padding: '0.5rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '0.5rem' }}>
                        <DoorOpen size={20} color="var(--primary)" />
                      </div>
                      <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>{room.name}</h3>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', background: 'var(--bg-main)', padding: '0.25rem 0.6rem', borderRadius: '1rem', border: '1px solid var(--border-color)' }}>
                        {room.seats?.length || 0} Seats
                      </span>


                      {/* Room Specific Search Bar (Left side) */}
                      <div style={{ position: 'relative', width: '220px', marginLeft: '0.5rem' }}>
                        <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                        <input
                          type="text"
                          placeholder="Search seat or student..."
                          value={roomSearches[room.id] || ''}
                          onChange={(e) => setRoomSearches(prev => ({ ...prev, [room.id]: e.target.value }))}
                          style={{
                            width: '100%',
                            padding: '0.35rem 0.75rem 0.35rem 2rem',
                            fontSize: '0.8rem',
                            borderRadius: '0.375rem',
                            border: '1px solid var(--border-color)',
                            backgroundColor: '#ffffff',
                            color: 'var(--text-primary)',
                            outline: 'none',
                            transition: 'all 0.15s ease',
                            height: '32px',
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = 'var(--primary)';
                            e.target.style.boxShadow = '0 0 0 2px rgba(37, 99, 235, 0.15)';
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = 'var(--border-color)';
                            e.target.style.boxShadow = 'none';
                          }}
                        />
                        {(roomSearches[room.id] || '') && (
                          <button
                            type="button"
                            onClick={() => setRoomSearches(prev => ({ ...prev, [room.id]: '' }))}
                            style={{
                              position: 'absolute',
                              right: '8px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: '#94a3b8',
                              fontSize: '1rem',
                              fontWeight: 'bold',
                              padding: '0 4px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            &times;
                          </button>
                        )}
                      </div>

                      {/* Search Matches Count badge */}
                      {query && (
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: matchCount > 0 ? 'var(--success)' : 'var(--danger)',
                          backgroundColor: matchCount > 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          padding: '0.25rem 0.6rem',
                          borderRadius: '1rem',
                          border: matchCount > 0 ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)',
                          whiteSpace: 'nowrap',
                        }}>
                          {matchCount} {matchCount === 1 ? 'match' : 'matches'}
                        </span>
                      )}
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {isFloorVisualization ? (
                        activeRoomEditingId === room.id ? (
                        <>
                          <Button
                            variant="primary"
                            size="sm"
                            style={{ backgroundColor: 'var(--success)', borderColor: 'var(--success)' }}
                            onClick={() => handleSaveLayout(room)}
                            disabled={isUpdatingLayout}
                          >
                            {isUpdatingLayout ? <Loader2 className="spinner" size={14} /> : "Save Layout"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setActiveRoomEditingId(null);
                              setTempLayout({});
                            }}
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        activeRoomEditingId === null && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setActiveRoomEditingId(room.id);
                              const initialLayout: Record<string, { x: number; y: number }> = {};
                              room.seats?.forEach((seat: any, idx: number) => {
                                initialLayout[seat.id] = getSeatPosition(seat, idx);
                              });
                              setTempLayout(initialLayout);
                            }}
                          >
                            Arrange Seats
                          </Button>
                        )
                      )
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setParentId(room.id);
                            setCreatorType('seat');
                            setOpenCreator(true);
                          }}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}
                        >
                          <Plus size={14} /> Add Seat
                        </Button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRoomToEdit(room);
                            setEditRoomName(room.name);
                            setOpenEditRoomModal(true);
                          }}
                          style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '0.5rem', display: 'flex', alignItems: 'center', borderRadius: '0.25rem', transition: 'all 0.15s ease' }}
                          title="Edit Room Name"
                          onMouseOver={(e) => {
                            e.currentTarget.style.color = 'var(--primary)';
                            e.currentTarget.style.backgroundColor = 'rgba(37, 99, 235, 0.08)';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.color = '#64748b';
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteRoom(room.id)}
                          style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.5rem', display: 'flex', alignItems: 'center', borderRadius: '0.25rem' }}
                          title="Delete Room"
                          onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
                          onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {!collapsedRooms[room.id] && (
                  <>
                    {/* Clean, Modern White Seats Grid / Visual Map */}
                {isFloorVisualization ? (
                  <div style={{
                    position: 'relative',
                    width: '100%',
                    height: '450px',
                    backgroundColor: '#f8fafc',
                    border: activeRoomEditingId === room.id ? '2px dashed var(--primary)' : '1px solid var(--border-color)',
                    borderRadius: '0.75rem',
                    backgroundImage: 'radial-gradient(#cbd5e1 1.5px, transparent 1.5px)',
                    backgroundSize: '20px 20px',
                    overflow: 'visible',
                    transition: 'all 0.2s ease',
                  }}>
                    {activeRoomEditingId === room.id && (
                      <div style={{
                        position: 'absolute',
                        top: '12px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        backgroundColor: 'rgba(15, 23, 42, 0.85)',
                        color: '#ffffff',
                        padding: '0.4rem 0.8rem',
                        borderRadius: '0.375rem',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        zIndex: 10,
                        pointerEvents: 'none',
                        boxShadow: 'var(--shadow-md)',
                      }}>
                        💡 Drag seats to arrange. They snap to grid lines.
                      </div>
                    )}
                    {[...(room.seats || [])].sort((a: any, b: any) => a.number.localeCompare(b.number, undefined, { numeric: true })).map((seat: any, idx: number) => {
                      const position = getSeatPosition(seat, idx);
                      const style = getSeatStyle(seat.status);
                      const activeAllocation = seat.allocations?.find((a: any) => a.isActive);
                      const isOccupied = seat.status === 'OCCUPIED';
                      const isEditingThisRoom = activeRoomEditingId === room.id;
                      
                      let isExpiringSoon = false;
                      let daysLeft = 0;
                      let isCritical = false;
                      if (isOccupied && activeAllocation?.endDate) {
                        const end = new Date(activeAllocation.endDate);
                        const today = new Date();
                        end.setHours(0, 0, 0, 0);
                        today.setHours(0, 0, 0, 0);
                        const diffTime = end.getTime() - today.getTime();
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        if (diffDays >= 0 && diffDays <= 7) {
                          isExpiringSoon = true;
                          daysLeft = diffDays;
                          isCritical = diffDays <= 3;
                        }
                      }

                      const formattedEnd = activeAllocation?.endDate 
                        ? new Date(activeAllocation.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) 
                        : 'N/A';

                      const query = (roomSearches[room.id] || '').trim().toLowerCase();
                      const matchesSearch = !query || 
                        seat.number.toLowerCase().includes(query) ||
                        (isOccupied && (
                          activeAllocation?.studentProfile?.user?.name?.toLowerCase().includes(query) ||
                          activeAllocation?.studentProfile?.user?.email?.toLowerCase().includes(query) ||
                          activeAllocation?.studentProfile?.user?.mobile?.includes(query)
                        ));

                      return (
                        <div
                          key={seat.id}
                          className="seat-container-hover"
                          onPointerDown={(e) => {
                            if (isEditingThisRoom) {
                              handlePointerDown(e, seat.id);
                            }
                          }}
                          onClick={() => {
                            if (!isEditingThisRoom) {
                              handleSeatClick(seat);
                            }
                          }}
                          style={{
                            position: 'absolute',
                            left: `${position.x}%`,
                            top: `${position.y}%`,
                            width: '64px',
                            height: '64px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: '#ffffff',
                            border: isEditingThisRoom ? `2px dashed ${style.accent}` : `1px solid var(--border-color)`,
                            borderTop: `4px solid ${style.accent}`,
                            borderRadius: '0.5rem',
                            cursor: isEditingThisRoom ? 'move' : 'pointer',
                            boxShadow: query && matchesSearch 
                              ? '0 0 0 3px rgba(37, 99, 235, 0.45), var(--shadow-md)' 
                              : isEditingThisRoom ? 'var(--shadow-md)' : 'var(--shadow-sm)',
                            transition: isEditingThisRoom ? 'none' : 'all 0.15s ease',
                            touchAction: 'none',
                            userSelect: 'none',
                            zIndex: isEditingThisRoom ? 5 : 2,
                            opacity: query && !matchesSearch ? 0.3 : 1,
                            transform: query && matchesSearch ? 'scale(1.05)' : 'none',
                          }}
                          onMouseOver={(e) => {
                            if (!isEditingThisRoom && !query) {
                              e.currentTarget.style.transform = 'translateY(-2px)';
                              e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                            }
                          }}
                          onMouseOut={(e) => {
                            if (!isEditingThisRoom && !query) {
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                            }
                          }}
                        >
                          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: isOccupied && activeAllocation ? '0.1rem' : '0' }}>
                            {seat.number}
                          </span>
                          {isOccupied && activeAllocation && (
                            <span style={{ fontSize: '0.6rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '58px', textAlign: 'center' }}>
                              {activeAllocation.studentProfile?.user?.name?.split(' ')[0] || 'N/A'}
                            </span>
                          )}
                          {isExpiringSoon && (
                            <span className={`expiring-badge ${isCritical ? 'critical' : 'warning'}`}>
                              {daysLeft}d
                            </span>
                          )}
                          <div className="custom-tooltip">
                            {isOccupied && activeAllocation ? (
                              <>
                                <strong>{activeAllocation.studentProfile?.user?.name}</strong>
                                <span>Ends: {formattedEnd}</span>
                              </>
                            ) : seat.status === 'BLOCKED' ? (
                              <strong>Maintenance</strong>
                            ) : (
                              <strong>Available</strong>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    {[...(room.seats || [])].sort((a: any, b: any) => a.number.localeCompare(b.number, undefined, { numeric: true })).map((seat: any) => {
                      const style = getSeatStyle(seat.status);
                      const isOccupied = seat.status === 'OCCUPIED';
                      const activeAllocation = seat.allocations?.find((a: any) => a.isActive);

                      let isExpiringSoon = false;
                      let daysLeft = 0;
                      let isCritical = false;
                      if (isOccupied && activeAllocation?.endDate) {
                        const end = new Date(activeAllocation.endDate);
                        const today = new Date();
                        end.setHours(0, 0, 0, 0);
                        today.setHours(0, 0, 0, 0);
                        const diffTime = end.getTime() - today.getTime();
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        if (diffDays >= 0 && diffDays <= 7) {
                          isExpiringSoon = true;
                          daysLeft = diffDays;
                          isCritical = diffDays <= 3;
                        }
                      }

                      const formattedEnd = activeAllocation?.endDate 
                        ? new Date(activeAllocation.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) 
                        : 'N/A';

                      const query = (roomSearches[room.id] || '').trim().toLowerCase();
                      const matchesSearch = !query || 
                        seat.number.toLowerCase().includes(query) ||
                        (isOccupied && (
                          activeAllocation?.studentProfile?.user?.name?.toLowerCase().includes(query) ||
                          activeAllocation?.studentProfile?.user?.email?.toLowerCase().includes(query) ||
                          activeAllocation?.studentProfile?.user?.mobile?.includes(query)
                        ));

                      return (
                        <div
                          key={seat.id}
                          className="seat-container-hover"
                          onClick={() => handleSeatClick(seat)}
                          style={{
                            width: '72px',
                            height: '72px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: '#ffffff',
                            border: `1px solid var(--border-color)`,
                            borderTop: `4px solid ${style.accent}`,
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            boxShadow: query && matchesSearch ? '0 0 0 3px rgba(37, 99, 235, 0.45), var(--shadow-md)' : 'var(--shadow-sm)',
                            transition: 'all 0.15s ease',
                            position: 'relative',
                            opacity: query && !matchesSearch ? 0.3 : 1,
                            transform: query && matchesSearch ? 'scale(1.05)' : 'none',
                          }}
                          onMouseOver={(e) => {
                            if (!isExpiringSoon && !query) {
                              e.currentTarget.style.transform = 'translateY(-2px)';
                              e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                            }
                          }}
                          onMouseOut={(e) => {
                            if (!isExpiringSoon && !query) {
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                            }
                          }}
                        >
                          <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: isOccupied && activeAllocation ? '0.15rem' : '0' }}>
                            {seat.number}
                          </span>
                          {isOccupied && activeAllocation && (
                            <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '64px', textAlign: 'center' }}>
                              {activeAllocation.studentProfile?.user?.name?.split(' ')[0] || 'N/A'}
                            </span>
                          )}
                          {isExpiringSoon && (
                            <span className={`expiring-badge ${isCritical ? 'critical' : 'warning'}`}>
                              {daysLeft}d
                            </span>
                          )}
                          <div className="custom-tooltip">
                            {isOccupied && activeAllocation ? (
                              <>
                                <strong>{activeAllocation.studentProfile?.user?.name}</strong>
                                <span>Ends: {formattedEnd}</span>
                              </>
                            ) : seat.status === 'BLOCKED' ? (
                              <strong>Maintenance</strong>
                            ) : (
                              <strong>Available</strong>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                  </>
                )}
              </Card>
            );
          })}
          </div>
        </div>
      )}

      {/* Allocation Modal */}
      <Modal
        isOpen={openAllocate}
        onClose={() => setOpenAllocate(false)}
        title={`Allocate Seat ${selectedSeat?.number}`}
        maxWidth="md"
      >
        <form onSubmit={handleAllocate}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Search Student Input */}
            {(!studentsData?.students || studentsData.students.length === 0) ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '1.5rem', border: '1px dashed var(--border-color)', borderRadius: '0.5rem', backgroundColor: 'var(--bg-surface-hover)' }}>
                <p className="text-muted" style={{ margin: 0 }}>No unallocated students available.</p>
                <Button variant="outline" size="sm" onClick={() => navigate('/students')} type="button">
                  <Plus size={16} style={{ marginRight: '0.25rem' }} /> Add Student
                </Button>
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                <label className="custom-input-label" style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', color: '#475569', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>
                  Search Student
                </label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: '#f1f5f9',
                  borderRadius: '0.5rem',
                  padding: '0.25rem 0.75rem',
                  border: isSearchFocused ? '1px solid var(--primary)' : '1px solid transparent',
                  boxShadow: isSearchFocused ? '0 0 0 3px var(--primary-light)' : 'none',
                  transition: 'all 0.15s ease',
                }}>
                  <Search size={18} style={{ color: '#94a3b8', marginRight: '0.5rem' }} />
                  <input
                    type="text"
                    placeholder="Name or Registration ID"
                    value={studentSearchQuery}
                    onChange={(e) => {
                      setStudentSearchQuery(e.target.value);
                      setShowStudentDropdown(true);
                      if (studentProfileId) setStudentProfileId('');
                    }}
                    onFocus={() => {
                      setShowStudentDropdown(true);
                      setIsSearchFocused(true);
                    }}
                    onBlur={() => {
                      setIsSearchFocused(false);
                      setTimeout(() => setShowStudentDropdown(false), 200);
                    }}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      outline: 'none',
                      width: '100%',
                      padding: '0.5rem 0',
                      fontSize: '0.875rem',
                      color: '#0f172a',
                    }}
                  />
                </div>

                {/* Dropdown list of students */}
                {showStudentDropdown && displayedStudents.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    backgroundColor: '#ffffff',
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.5rem',
                    boxShadow: 'var(--shadow-lg)',
                    zIndex: 1000,
                    marginTop: '0.25rem',
                    maxHeight: '200px',
                    overflowY: 'auto',
                  }}>
                    {displayedStudents.map((student: any) => (
                      <div
                        key={student.id}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setStudentProfileId(student.id);
                          setStudentSearchQuery(student.user?.name || '');
                          setShowStudentDropdown(false);
                        }}
                        style={{
                          padding: '0.75rem 1rem',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          borderBottom: '1px solid #f1f5f9',
                          transition: 'background-color 0.15s ease',
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a' }}>
                          {student.user?.name}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          {student.user?.email || 'No Email'} • {student.user?.mobile || 'No Mobile'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {showStudentDropdown && studentSearchQuery.trim() !== '' && displayedStudents.length === 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    backgroundColor: '#ffffff',
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.5rem',
                    boxShadow: 'var(--shadow-lg)',
                    zIndex: 1000,
                    marginTop: '0.25rem',
                    padding: '1rem',
                    textAlign: 'center',
                    color: '#64748b',
                    fontSize: '0.875rem',
                  }}>
                    No students found
                  </div>
                )}
              </div>
            )}

            {/* Shift & Duration Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              
              {/* Shift Selection */}
              <div>
                <label className="custom-input-label" style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', color: '#475569', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>
                  Shift
                </label>
                {(!shifts || shifts.length === 0) ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', border: '1px dashed var(--border-color)', borderRadius: '0.5rem', backgroundColor: '#f8fafc' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>No shifts configured.</span>
                    <Button variant="outline" size="sm" onClick={() => navigate('/settings')} type="button" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                      + Add Shift
                    </Button>
                  </div>
                ) : (
                  <Select
                    value={shiftId}
                    onChange={(val) => setShiftId(val)}
                    placeholder="Select shift"
                    options={shifts.map((shift: any) => ({
                      value: shift.id,
                      label: `${shift.name} (${shift.startTime} - ${shift.endTime})`,
                    }))}
                  />
                )}
              </div>

              {/* Duration Selector */}
              <div>
                <label className="custom-input-label" style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', color: '#475569', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>
                  Duration
                </label>
                <div style={{
                  display: 'flex',
                  gap: '0.5rem',
                  height: '38px',
                }}>
                  {/* Months Dropdown */}
                  <Select
                    value={typeof durationMode === 'number' ? durationMode : ''}
                    onChange={(val) => setDurationMode(val)}
                    placeholder="Select months"
                    style={{
                      flex: 2,
                    }}
                    options={[
                      { value: 1, label: '1 Month' },
                      { value: 2, label: '2 Months' },
                      { value: 3, label: '3 Months' },
                      { value: 4, label: '4 Months' },
                      { value: 5, label: '5 Months' },
                      { value: 6, label: '6 Months' },
                    ]}
                  />

                  {/* Flex Button */}
                  <button
                    type="button"
                    onClick={() => setDurationMode('flex')}
                    style={{
                      flex: 1,
                      border: durationMode === 'flex' ? '2px solid #2f2fd1' : '1px solid #cbd5e1',
                      borderRadius: '0.5rem',
                      background: durationMode === 'flex' ? '#2f2fd1' : '#ffffff',
                      color: durationMode === 'flex' ? '#ffffff' : '#0f172a',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      height: '38px',
                    }}
                  >
                    Flex
                  </button>
                </div>
              </div>
            </div>

            {/* Start Date & End Date Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              
              {/* Start Date Input */}
              <div>
                <label className="custom-input-label" style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', color: '#475569', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>
                  Start Date
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="custom-input"
                    style={{
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      padding: '0.625rem 0.75rem',
                      borderColor: '#cbd5e1',
                      color: '#0f172a',
                      width: '100%',
                    }}
                  />
                </div>
              </div>

              {/* End Date Input */}
              <div>
                <label className="custom-input-label" style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', color: '#475569', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>
                  End Date
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type="date"
                    required
                    disabled={durationMode !== 'flex'}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="custom-input"
                    style={{
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      padding: '0.625rem 0.75rem',
                      borderColor: '#cbd5e1',
                      color: '#0f172a',
                      width: '100%',
                      backgroundColor: durationMode !== 'flex' ? '#f1f5f9' : '#ffffff',
                      cursor: durationMode !== 'flex' ? 'not-allowed' : 'text',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Billing & Subscription Details section */}
            <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '0.5rem 0' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                id="generate-invoice-checkbox"
                checked={shouldGenerateInvoice}
                onChange={(e) => setShouldGenerateInvoice(e.target.checked)}
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '0.25rem',
                  border: '1px solid #cbd5e1',
                  cursor: 'pointer',
                }}
              />
              <label
                htmlFor="generate-invoice-checkbox"
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#0f172a',
                  cursor: 'pointer',
                }}
              >
                Generate Fee Invoice for this booking
              </label>
            </div>

            {shouldGenerateInvoice && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {/* Select Plan */}
                  <div>
                    <label className="custom-input-label" style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', color: '#475569', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>
                      Link Subscription Plan
                    </label>
                    <Select
                      value={selectedPlanId}
                      onChange={(val) => {
                        setSelectedPlanId(val);
                        const plan = plans?.find((p: any) => p.id === val);
                        if (plan) {
                          setInvoiceAmount(plan.price.toString());
                        }
                      }}
                      placeholder="Select plan (Optional)"
                      options={[
                        { value: '', label: 'Custom / None' },
                        ...(plans?.map((p: any) => ({
                          value: p.id,
                          label: `${p.name} (₹${p.price})`,
                        })) || []),
                      ]}
                    />
                  </div>

                  {/* Payment Channel */}
                  <div>
                    <label className="custom-input-label" style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', color: '#475569', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>
                      Payment Channel
                    </label>
                    <Select
                      value={paymentMethod}
                      onChange={(val: any) => setPaymentMethod(val)}
                      placeholder="Select channel"
                      options={[
                        { value: 'CASH', label: 'Cash Deposit' },
                        { value: 'UPI', label: 'UPI Transfer' },
                        { value: 'RAZORPAY', label: 'Razorpay Portal (Online)' },
                      ]}
                    />
                  </div>
                </div>

                {/* Amount field */}
                <div>
                  <label className="custom-input-label" style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', color: '#475569', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>
                    Billing Amount (₹)
                  </label>
                  <input
                    type="number"
                    required={shouldGenerateInvoice}
                    placeholder="e.g. 1500"
                    value={invoiceAmount}
                    onChange={(e) => setInvoiceAmount(e.target.value)}
                    className="custom-input"
                    style={{
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      padding: '0.625rem 0.75rem',
                      borderColor: '#cbd5e1',
                      color: '#0f172a',
                      width: '100%',
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Dialog Footer */}
          <div className="modal-form-footer" style={{
            margin: '2rem -1.5rem -1.5rem -1.5rem',
            padding: '1.25rem 1.5rem',
            backgroundColor: '#f8f9fd',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            {/* Delete / Maintenance actions on the left side, styled very subtly */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => handleDeleteSeat(selectedSeat?.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--danger)',
                  cursor: 'pointer',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  padding: '0.25rem 0.5rem',
                  borderRadius: '0.25rem',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.08)'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                Delete Seat
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await updateSeatStatus({ id: selectedSeat?.id, status: 'BLOCKED' }).unwrap();
                    setOpenAllocate(false);
                    setSelectedSeat(null);
                  } catch (err: any) {
                    showAlert(err.data?.message || 'Failed to mark seat as maintenance');
                  }
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  padding: '0.25rem 0.5rem',
                  borderRadius: '0.25rem',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(71, 85, 105, 0.08)'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                Mark Maintenance
              </button>
            </div>

            {/* Cancel & Assign Seat actions on the right side */}
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => setOpenAllocate(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#475569',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  padding: '0.5rem 1.125rem',
                  borderRadius: '0.375rem',
                  transition: 'all 0.15s ease',
                }}
                onMouseOver={(e) => e.currentTarget.style.color = '#0f172a'}
                onMouseOut={(e) => e.currentTarget.style.color = '#475569'}
              >
                Cancel
              </button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isAllocating || isCreatingPayment}
                disabled={!studentProfileId || !shiftId || !startDate || !endDate || (shouldGenerateInvoice && !invoiceAmount)}
                style={{
                  backgroundColor: '#2f2fd1',
                  borderColor: '#2f2fd1',
                  borderRadius: '0.5rem',
                  padding: '0.625rem 1.25rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  boxShadow: '0 4px 6px -1px rgba(47, 47, 209, 0.2), 0 2px 4px -2px rgba(47, 47, 209, 0.2)',
                }}
              >
                Assign Seat
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Maintenance Modal */}
      <Modal
        isOpen={openMaintenance}
        onClose={() => setOpenMaintenance(false)}
        title={`Seat ${selectedSeat?.number} - Maintenance`}
        maxWidth="sm"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <p className="text-muted" style={{ margin: 0 }}>This seat is currently under maintenance. You can mark it as available or delete it.</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
            <Button type="button" variant="text" style={{ color: 'var(--danger)' }} onClick={() => handleDeleteSeat(selectedSeat?.id)}>
              Delete Seat
            </Button>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <Button type="button" variant="text" onClick={() => setOpenMaintenance(false)}>Close</Button>
              <Button 
                type="button" 
                variant="primary" 
                onClick={async () => {
                  try {
                    await updateSeatStatus({ id: selectedSeat?.id, status: 'AVAILABLE' }).unwrap();
                    setOpenMaintenance(false);
                    setSelectedSeat(null);
                  } catch (err: any) {
                    showAlert(err.data?.message || 'Failed to mark seat as available');
                  }
                }}
              >
                Mark Available
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Manage Seat / Transfer / Renewal Modal */}
      <Modal
        isOpen={openTransfer}
        onClose={() => setOpenTransfer(false)}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UserCog size={20} style={{ color: 'var(--primary)' }} />
            <span>Manage Seat {selectedSeat?.number}</span>
          </div>
        }
        maxWidth="lg"
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '2rem', minHeight: '400px' }}>
          
          {/* Left Side: Occupant Details & Last Payment */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', borderRight: '1px solid var(--border-color)', paddingRight: '2rem' }}>
            {(() => {
              const activeAllocation = selectedSeat?.allocations?.find((a: any) => a.isActive);
              if (!activeAllocation) return null;
              const currentRoomName = currentFloor?.rooms?.find((r: any) => r.seats?.some((s: any) => s.id === selectedSeat?.id))?.name || 'N/A';
              const nameInitials = activeAllocation.studentProfile?.user?.name?.charAt(0).toUpperCase() || 'U';

              const latestPayment = activeAllocation.studentProfile?.payments && activeAllocation.studentProfile.payments.length > 0
                ? [...activeAllocation.studentProfile.payments].sort((a: any, b: any) => new Date(b.paidAt || b.createdAt).getTime() - new Date(a.paidAt || a.createdAt).getTime())[0]
                : null;

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', height: '100%' }}>
                  {/* Occupant Card */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1.25rem',
                    padding: '1.25rem',
                    backgroundColor: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    borderRadius: '0.75rem',
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      backgroundColor: '#3b82f6',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '1.25rem',
                      border: '2px solid #ffffff',
                    }}>
                      {nameInitials}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1rem', fontWeight: 700, color: '#1e3a8a' }}>
                          {activeAllocation.studentProfile?.user?.name}
                        </span>
                        <span style={{
                          fontSize: '0.625rem',
                          fontWeight: 700,
                          color: '#ffffff',
                          backgroundColor: '#10b981',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '0.25rem',
                          textTransform: 'uppercase',
                        }}>
                          Active
                        </span>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: '#1e40af' }}>
                        Reg: STD-{activeAllocation.studentProfile?.id?.slice(0, 4).toUpperCase() || 'XXXX'}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#1e40af', opacity: 0.8 }}>
                        {activeAllocation.shift?.name || 'N/A'} Shift • {currentRoomName}
                      </span>
                    </div>
                  </div>

                  {/* Allocation Dates */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', margin: 0 }}>
                        Current Subscription
                      </h4>
                      {!isEditingDates && (
                        <button
                          type="button"
                          onClick={() => setIsEditingDates(true)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--primary)',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '0.25rem',
                            backgroundColor: 'var(--primary-light)',
                          }}
                        >
                          Edit Dates
                        </button>
                      )}
                    </div>

                    {isEditingDates ? (
                      <form onSubmit={handleUpdateAllocationDates} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', backgroundColor: 'var(--bg-main)', padding: '1rem', borderRadius: '0.5rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                          <div>
                            <label style={{ fontSize: '0.65rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>
                              Start Date
                            </label>
                            <input
                              type="date"
                              required
                              value={editStartDate}
                              onChange={(e) => setEditStartDate(e.target.value)}
                              className="custom-input"
                              style={{ padding: '0.375rem', fontSize: '0.8rem' }}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.65rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>
                              End Date
                            </label>
                            <input
                              type="date"
                              required
                              value={editEndDate}
                              onChange={(e) => setEditEndDate(e.target.value)}
                              className="custom-input"
                              style={{ padding: '0.375rem', fontSize: '0.8rem' }}
                            />
                          </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.25rem' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setIsEditingDates(false);
                              setEditStartDate(activeAllocation.startDate ? activeAllocation.startDate.split('T')[0] : '');
                              setEditEndDate(activeAllocation.endDate ? activeAllocation.endDate.split('T')[0] : '');
                            }}
                            style={{
                              backgroundColor: '#ffffff',
                              border: '1px solid #cbd5e1',
                              color: '#475569',
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              padding: '0.35rem 0.75rem',
                              borderRadius: '0.375rem',
                            }}
                          >
                            Cancel
                          </button>
                          <Button
                            type="submit"
                            variant="primary"
                            isLoading={isUpdatingAllocation}
                            style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', borderRadius: '0.375rem' }}
                          >
                            Save
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', backgroundColor: 'var(--bg-main)', padding: '1rem', borderRadius: '0.5rem' }}>
                          <div>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>START DATE</span>
                            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{activeAllocation.startDate ? new Date(activeAllocation.startDate).toLocaleDateString() : 'N/A'}</span>
                          </div>
                          <div>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>END DATE</span>
                            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{activeAllocation.endDate ? new Date(activeAllocation.endDate).toLocaleDateString() : 'N/A'}</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', color: '#2563eb', fontSize: '0.8rem', fontWeight: 600, marginTop: '0.5rem', paddingLeft: '0.25rem' }}>
                          <Clock size={14} style={{ marginRight: '0.25rem' }} />
                          <span>{getDaysRemainingText(activeAllocation.endDate)}</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Last Payment Details */}
                  <div>
                    <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                      Last Payment Details
                    </h4>
                    {latestPayment ? (
                      <div style={{ backgroundColor: 'var(--bg-main)', padding: '1rem', borderRadius: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Amount Paid:</span>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>₹{latestPayment.amount}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Method:</span>
                          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)' }}>{latestPayment.method}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Date:</span>
                          <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                            {latestPayment.paidAt ? new Date(latestPayment.paidAt).toLocaleDateString() : new Date(latestPayment.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Status:</span>
                          <span style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: latestPayment.status === 'PAID' ? 'var(--success)' : 'var(--warning)',
                          }}>{latestPayment.status}</span>
                        </div>
                      </div>
                    ) : (
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>No payment history found.</p>
                    )}
                  </div>

                  {/* Vacate Button at the bottom */}
                  <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
                    <Button
                      type="button"
                      onClick={handleVacateSeat}
                      isLoading={isVacating}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        backgroundColor: '#ffffff',
                        border: '1px solid #fca5a5',
                        color: 'var(--danger)',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        padding: '0.625rem',
                        borderRadius: '0.5rem',
                        boxShadow: 'none',
                      }}
                    >
                      <LogOut size={16} style={{ transform: 'rotate(180deg)' }} />
                      Vacate Seat
                    </Button>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Right Side: Quick Action Forms (Transfer & Renew) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            
            {/* Action 1: Transfer Seat */}
            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                Transfer Seat
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Move student to an available seat in any floor or room.
              </p>
              
              <form onSubmit={handleTransfer} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>
                      Floor
                    </label>
                    <Select
                      value={targetFloorId}
                      onChange={(val) => {
                        setTargetFloorId(val);
                        const floorObj = seatMap?.find((f: any) => f.id === val);
                        if (floorObj?.rooms && floorObj.rooms.length > 0) {
                          setTargetRoomId(floorObj.rooms[0].id);
                        } else {
                          setTargetRoomId('');
                          setTargetSeatId('');
                        }
                      }}
                      placeholder="Floor"
                      options={seatMap?.map((floor: any) => ({
                        value: floor.id,
                        label: floor.name,
                      })) || []}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>
                      Room
                    </label>
                    <Select
                      value={targetRoomId}
                      onChange={(val) => {
                        setTargetRoomId(val);
                        setTargetSeatId('');
                      }}
                      placeholder="Room"
                      disabled={!targetFloorId}
                      options={seatMap?.find((f: any) => f.id === targetFloorId)?.rooms?.map((room: any) => ({
                        value: room.id,
                        label: room.name,
                      })) || []}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>
                      Seat
                    </label>
                    <Select
                      value={targetSeatId}
                      onChange={(val) => setTargetSeatId(val)}
                      placeholder="Seat"
                      disabled={!targetRoomId}
                      options={seatMap
                        ?.find((f: any) => f.id === targetFloorId)
                        ?.rooms?.find((r: any) => r.id === targetRoomId)
                        ?.seats?.filter((s: any) => s.status === 'AVAILABLE')
                        ?.map((s: any) => ({
                          value: s.id,
                          label: s.number,
                        })) || []}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={!targetSeatId || isTransferring}
                    isLoading={isTransferring}
                    style={{ fontSize: '0.8rem', padding: '0.45rem 1.25rem', borderRadius: '0.375rem', backgroundColor: '#2f2fd1', borderColor: '#2f2fd1' }}
                  >
                    Confirm Transfer
                  </Button>
                </div>
              </form>
            </div>

            {/* Action 2: Renew Subscription */}
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                Renew Subscription & Seat
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Renew seat allocation and log the payment.
              </p>

              <form onSubmit={handleRenewSeat} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>
                      Plan
                    </label>
                    <Select
                      value={renewPlanId}
                      onChange={(val) => setRenewPlanId(val)}
                      placeholder="Select Plan"
                      options={plans?.map((p: any) => ({
                        value: p.id,
                        label: `${p.name} (₹${p.price})`,
                      })) || []}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>
                      Shift
                    </label>
                    <Select
                      value={renewShiftId}
                      onChange={(val) => setRenewShiftId(val)}
                      placeholder="Shift"
                      options={shifts?.map((s: any) => ({
                        value: s.id,
                        label: s.name,
                      })) || []}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>
                      Start Date
                    </label>
                    <input
                      type="date"
                      required
                      value={renewStartDate}
                      onChange={(e) => setRenewStartDate(e.target.value)}
                      className="custom-input"
                      style={{ padding: '0.5rem', fontSize: '0.85rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>
                      End Date
                    </label>
                    <input
                      type="date"
                      required
                      value={renewEndDate}
                      onChange={(e) => setRenewEndDate(e.target.value)}
                      className="custom-input"
                      style={{ padding: '0.5rem', fontSize: '0.85rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>
                      Payment Method
                    </label>
                    <Select
                      value={renewPaymentMethod}
                      onChange={(val: any) => setRenewPaymentMethod(val)}
                      placeholder="Payment Method"
                      options={[
                        { value: 'UPI', label: 'UPI' },
                        { value: 'CASH', label: 'Cash' },
                        { value: 'RAZORPAY', label: 'Razorpay' }
                      ]}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>
                      Amount (₹)
                    </label>
                    <input
                      type="number"
                      required
                      value={renewAmount}
                      onChange={(e) => setRenewAmount(e.target.value)}
                      className="custom-input"
                      style={{ padding: '0.5rem', fontSize: '0.85rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={!renewPlanId || !renewShiftId || !renewStartDate || !renewEndDate || isRenewing}
                    isLoading={isRenewing}
                    style={{ fontSize: '0.8rem', padding: '0.45rem 1.25rem', borderRadius: '0.375rem', backgroundColor: 'var(--success)', borderColor: 'var(--success)' }}
                  >
                    Confirm Renewal
                  </Button>
                </div>
              </form>
            </div>

          </div>

        </div>
      </Modal>

      {/* Layout Creator Modal */}
      <Modal
        isOpen={openCreator}
        onClose={() => setOpenCreator(false)}
        title={creatorType === 'room' ? 'Add Room' : creatorType === 'seat' ? 'Add Seat' : 'Add Floor'}
        maxWidth="sm"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {creatorType === 'room' && (
            (!seatMap || seatMap.length === 0) ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '1.5rem', border: '1px dashed var(--border-color)', borderRadius: '0.5rem', backgroundColor: 'var(--bg-surface-hover)' }}>
                <p className="text-muted" style={{ margin: 0 }}>No floors exist yet.</p>
                <Button variant="outline" size="sm" onClick={() => setCreatorType('floor')}>
                  <Plus size={16} style={{ marginRight: '0.25rem' }} /> Add Floor
                </Button>
              </div>
            ) : (
              <div>
                <label className="custom-input-label">Target Floor</label>
                <Select
                  value={parentId}
                  onChange={(val) => setParentId(val)}
                  placeholder="Select floor"
                  options={seatMap.map((f: any) => ({
                    value: f.id,
                    label: f.name,
                  }))}
                />
              </div>
            )
          )}

          {creatorType === 'seat' && (
            (!currentFloor?.rooms || currentFloor.rooms.length === 0) ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '1.5rem', border: '1px dashed var(--border-color)', borderRadius: '0.5rem', backgroundColor: 'var(--bg-surface-hover)' }}>
                <p className="text-muted" style={{ margin: 0 }}>No rooms exist on this floor.</p>
                <Button variant="outline" size="sm" onClick={() => setCreatorType('room')}>
                  <Plus size={16} style={{ marginRight: '0.25rem' }} /> Add Room
                </Button>
              </div>
            ) : (
              <div>
                <label className="custom-input-label">Target Room</label>
                <Select
                  value={parentId}
                  onChange={(val) => setParentId(val)}
                  placeholder="Select room"
                  options={currentFloor.rooms.map((r: any) => ({
                    value: r.id,
                    label: r.name,
                  }))}
                />
              </div>
            )
          )}

          <Input
            label={
              creatorType === 'seat'
                ? 'Seat Number (e.g. A-1 or 1-60)'
                : creatorType === 'room'
                  ? 'Room Name (e.g. Hall A)'
                  : 'Floor Name (e.g. Ground Floor)'
            }
            required
            value={creatorName}
            onChange={(e) => setCreatorName(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
          <Button
            variant="text"
            onClick={() => {
              if (creatorType === 'room') {
                setCreatorType('seat');
              } else {
                setOpenCreator(false);
              }
            }}
          >
            {creatorType === 'room' ? 'Proceed to Seat' : 'Cancel'}
          </Button>
          <Button onClick={handleCreate} variant="primary">
            Create
          </Button>
        </div>
      </Modal>

      {/* Edit Floor Modal */}
      <Modal
        isOpen={openEditFloorModal}
        onClose={() => setOpenEditFloorModal(false)}
        title={`Edit Floor - ${selectedFloorToEdit?.name}`}
        maxWidth="sm"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <Input
            label="Floor Name"
            value={editFloorName}
            required
            onChange={(e) => setEditFloorName(e.target.value)}
            placeholder="e.g. Ground Floor"
          />

          <div style={{
            margin: '2rem -1.5rem -1.5rem -1.5rem',
            padding: '1.25rem 1.5rem',
            backgroundColor: '#f8f9fd',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            {/* Delete Floor Action on the left */}
            <button
              type="button"
              onClick={async () => {
                if (selectedFloorToEdit) {
                  setOpenEditFloorModal(false);
                  await handleDeleteFloor(selectedFloorToEdit.id);
                }
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--danger)',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 500,
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                transition: 'background-color 0.15s ease',
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.08)'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              Delete Floor
            </button>

            {/* Cancel & Save Actions on the right */}
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => setOpenEditFloorModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#475569',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  padding: '0.5rem 1.125rem',
                  borderRadius: '0.375rem',
                  transition: 'all 0.15s ease',
                }}
                onMouseOver={(e) => e.currentTarget.style.color = '#0f172a'}
                onMouseOut={(e) => e.currentTarget.style.color = '#475569'}
              >
                Cancel
              </button>
              <Button
                variant="primary"
                disabled={!editFloorName.trim()}
                onClick={async () => {
                  if (selectedFloorToEdit && editFloorName.trim()) {
                    try {
                      await updateFloor({ id: selectedFloorToEdit.id, name: editFloorName.trim() }).unwrap();
                      setOpenEditFloorModal(false);
                    } catch (err: any) {
                      showAlert(err.data?.message || 'Failed to update floor name');
                    }
                  }
                }}
                style={{
                  backgroundColor: '#2f2fd1',
                  borderColor: '#2f2fd1',
                  borderRadius: '0.5rem',
                  padding: '0.625rem 1.25rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                }}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Edit Room Name Modal */}
      <Modal
        isOpen={openEditRoomModal}
        onClose={() => setOpenEditRoomModal(false)}
        title="Edit Room Name"
        maxWidth="sm"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', color: '#475569', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>
              Room Name
            </label>
            <Input
              type="text"
              value={editRoomName}
              onChange={(e) => setEditRoomName(e.target.value)}
              placeholder="e.g. Room A"
              autoFocus
            />
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setOpenEditRoomModal(false)}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: '#475569',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 600,
                padding: '0.5rem 1.125rem',
                borderRadius: '0.375rem',
                transition: 'all 0.15s ease',
              }}
              onMouseOver={(e) => e.currentTarget.style.color = '#0f172a'}
              onMouseOut={(e) => e.currentTarget.style.color = '#475569'}
            >
              Cancel
            </button>
            <Button
              variant="primary"
              disabled={!editRoomName.trim()}
              onClick={async () => {
                if (selectedRoomToEdit && editRoomName.trim()) {
                  try {
                    await updateRoom({ id: selectedRoomToEdit.id, name: editRoomName.trim() }).unwrap();
                    setOpenEditRoomModal(false);
                    showAlert('Room name updated successfully!', { title: 'Success' });
                  } catch (err: any) {
                    showAlert(err.data?.message || 'Failed to update room name');
                  }
                }
              }}
              style={{
                backgroundColor: 'var(--primary)',
                borderColor: 'var(--primary)',
                borderRadius: '0.5rem',
                padding: '0.625rem 1.25rem',
                fontSize: '0.875rem',
                fontWeight: 600,
              }}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>


      {/* Invoice Receipt Modal */}
      <Modal
        isOpen={openInvoiceReceipt}
        onClose={() => setOpenInvoiceReceipt(false)}
        title="Fee Receipt & Invoice"
        maxWidth="md"
      >
        {createdInvoiceData && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <style dangerouslySetInnerHTML={{ __html: `
              @media print {
                /* Hide everything in the document */
                body * {
                  visibility: hidden !important;
                }
                /* Show only the print area and its children */
                #studyflow-invoice-print-area,
                #studyflow-invoice-print-area * {
                  visibility: visible !important;
                }
                /* Fix print area positioning and remove borders */
                #studyflow-invoice-print-area {
                  position: absolute !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: 100% !important;
                  border: none !important;
                  padding: 0 !important;
                  margin: 0 !important;
                  box-shadow: none !important;
                  background: white !important;
                }
              }
            `}} />
            
            {/* Printable Area */}
            <div 
              id="studyflow-invoice-print-area"
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid var(--border-color)',
                borderRadius: '0.75rem',
                padding: '2rem',
                color: '#1e293b',
              }}
            >
              {/* Header: Company Details & Invoice Info */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #f1f5f9', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '-0.025em' }}>StudyFlow</h2>
                  <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 500 }}>Library & Study Space Management</span>
                  {createdInvoiceData.branchName && (
                    <div style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '0.25rem' }}>
                      <strong>Branch:</strong> {createdInvoiceData.branchName}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ 
                    display: 'inline-block', 
                    fontSize: '0.75rem', 
                    fontWeight: 700, 
                    textTransform: 'uppercase', 
                    backgroundColor: createdInvoiceData.payment.status === 'PAID' ? '#dcfce7' : '#fee2e2',
                    color: createdInvoiceData.payment.status === 'PAID' ? '#15803d' : '#b91c1c',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '1rem',
                    marginBottom: '0.5rem'
                  }}>
                    {createdInvoiceData.payment.status}
                  </span>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                    INV-{createdInvoiceData.payment.id.substring(0, 8).toUpperCase()}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                    Date: {new Date(createdInvoiceData.payment.createdAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
              </div>

              {/* Bill To & Seat Information Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                <div>
                  <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bill To</h4>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a' }}>
                    {createdInvoiceData.student?.user?.name || 'N/A'}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#475569', marginTop: '0.25rem' }}>
                    <strong>Phone:</strong> {createdInvoiceData.student?.user?.mobile || 'N/A'}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#475569', marginTop: '0.125rem' }}>
                    <strong>Email:</strong> {createdInvoiceData.student?.user?.email || 'No Email'}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#475569', marginTop: '0.125rem' }}>
                    <strong>Reg ID:</strong> STD-{createdInvoiceData.student?.id?.slice(0, 4).toUpperCase() || 'XXXX'}
                  </div>
                </div>
                <div>
                  <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Booking Details</h4>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a' }}>
                    Seat {createdInvoiceData.seatNumber || 'N/A'}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#475569', marginTop: '0.25rem' }}>
                    <strong>Shift:</strong> {createdInvoiceData.shift?.name || 'N/A'} ({createdInvoiceData.shift?.startTime || ''} - {createdInvoiceData.shift?.endTime || ''})
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#475569', marginTop: '0.125rem' }}>
                    <strong>Duration:</strong> {new Date(createdInvoiceData.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} - {new Date(createdInvoiceData.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
              </div>

              {/* Itemized Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                    <th style={{ padding: '0.75rem 0', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Description</th>
                    <th style={{ padding: '0.75rem 0', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '1rem 0', fontSize: '0.875rem' }}>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>Seat Booking Subscription Fee</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                        Seat {createdInvoiceData.seatNumber} | {createdInvoiceData.shift?.name} Shift ({createdInvoiceData.startDate} to {createdInvoiceData.endDate})
                      </div>
                    </td>
                    <td style={{ padding: '1rem 0', fontSize: '0.875rem', fontWeight: 600, color: '#0f172a', textAlign: 'right' }}>
                      ₹{(createdInvoiceData.originalAmount ?? createdInvoiceData.payment.amount).toFixed(2)}
                    </td>
                  </tr>
                  
                  {createdInvoiceData.originalAmount !== undefined && 
                   createdInvoiceData.payableAmount !== undefined && 
                   createdInvoiceData.originalAmount !== createdInvoiceData.payableAmount && (
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.75rem 0', fontSize: '0.875rem', color: '#475569' }}>
                        Adjustment / Discount
                      </td>
                      <td style={{ padding: '0.75rem 0', fontSize: '0.875rem', fontWeight: 600, color: createdInvoiceData.payableAmount < createdInvoiceData.originalAmount ? '#15803d' : '#b91c1c', textAlign: 'right' }}>
                        {createdInvoiceData.payableAmount < createdInvoiceData.originalAmount ? '-' : '+'}₹{Math.abs(createdInvoiceData.originalAmount - createdInvoiceData.payableAmount).toFixed(2)}
                      </td>
                    </tr>
                  )}

                  <tr>
                    <td style={{ padding: '1rem 0 0 0', fontSize: '0.875rem', fontWeight: 700, color: '#0f172a' }}>Total Payable Amount</td>
                    <td style={{ padding: '1rem 0 0 0', fontSize: '1.125rem', fontWeight: 800, color: 'var(--primary)', textAlign: 'right' }}>
                      ₹{(createdInvoiceData.payableAmount ?? createdInvoiceData.payment.amount).toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Footer Terms */}
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    <strong>Payment Method:</strong> {createdInvoiceData.payment.method}
                  </div>
                  {createdInvoiceData.payment.transactionId && (
                    <div style={{ fontSize: '0.6875rem', color: '#64748b', marginTop: '0.125rem' }}>
                      <strong>Txn ID:</strong> {createdInvoiceData.payment.transactionId}
                    </div>
                  )}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>
                  Thank you for booking with StudyFlow!
                </div>
              </div>
            </div>

            {/* Actions Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
              <Button
                variant="outline"
                onClick={() => setOpenInvoiceReceipt(false)}
                style={{ borderRadius: '0.5rem', fontWeight: 600 }}
              >
                Close
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  window.print();
                }}
                style={{
                  backgroundColor: '#2f2fd1',
                  borderColor: '#2f2fd1',
                  borderRadius: '0.5rem',
                  fontWeight: 600,
                  boxShadow: '0 4px 6px -1px rgba(47, 47, 209, 0.2)',
                }}
              >
                Print Invoice
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

