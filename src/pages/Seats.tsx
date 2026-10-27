import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import {
  useGetSeatMapQuery,
  useGetBranchesQuery,
  useGetShiftsQuery,
  useGetStudentsQuery,
  useAllocateSeatMutation,
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
  useVerifyRazorpayMutation,
} from '../store/api';
import { formatYYYYMMDD, addDaysToDate, getTodayYYYYMMDD } from '../utils/dateUtils';
import {
  getStudentDisplayName,
  getStudentEmail,
  getStudentMobile,
} from '../utils/studentUtils';
import { getSeatStatusInfo } from '../utils/seatUtils';
import { getErrorMessage } from '../utils/errorUtils';
import { QueryFeedback } from '../components/feedback/QueryFeedback';
import { AllocateSeatModal } from '../components/AllocateSeatModal';
import { InvoiceReceiptModal } from '../components/InvoiceReceiptModal';
import { LayoutCreatorModal } from '../components/LayoutCreatorModal';
import {
  EditFloorModal,
  EditRoomModal,
  SeatsToolbar,
  SeatsStats,
  AllocationIntentBanner,
  SeatsWorkspace,
  SeatQuickActions,
  SeatDetailsDrawer,
  FloorNavigationTabs,
  SeatImportModal,
  AddDeskModal,
  LayoutCanvas,
  calculateWorkspaceStats,
  findExpiringSeats,
  indexSeats,
  useLayoutEditor,
  useSeatAllocationForm,
  useSeatRenewal,
} from '../features/seats';
import type { DrawerSection, RoomStatusFilter, SeatSort } from '../features/seats';
import { useAlert } from '../components/ui/AlertContext';
import { useToast } from '../components/ui/ToastContext';
import '../components/ui/Globals.css';

export default function Seats() {
  const { showAlert } = useAlert();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state: RootState) => state.auth);

  // Preselected student intent from navigation (e.g. from Student admission)
  const [preselectedStudent, setPreselectedStudent] = useState<{
    id: string;
    name: string;
    joiningDate?: string;
    shiftId?: string;
  } | null>(null);

  useEffect(() => {
    if (location.state?.preselectedStudentId || location.state?.preselectedJoiningDate) {
      setPreselectedStudent({
        id: location.state.preselectedStudentId || '',
        name: location.state.preselectedStudentName || 'Admitted Student',
        joiningDate: location.state.preselectedJoiningDate,
        shiftId: location.state.preselectedShiftId,
      });
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Branch data
  const { data: branches } = useGetBranchesQuery(user?.workspaceId, { skip: !user?.workspaceId });
  const [selectedBranch, setSelectedBranch] = useState('');

  useEffect(() => {
    if (branches && branches.length > 0 && !selectedBranch) {
      setSelectedBranch(branches[0].id);
    }
  }, [branches, selectedBranch]);

  // Seat Map data
  const {
    currentData: seatMap,
    isFetching: isMapFetching,
    error: mapError,
    refetch: refetchSeatMap,
  } = useGetSeatMapQuery(selectedBranch, {
    skip: !selectedBranch,
  });
  const isMapLoading = isMapFetching && !seatMap;

  // Shifts and students queries
  const { data: shifts } = useGetShiftsQuery(user?.workspaceId, { skip: !user?.workspaceId });
  const { data: studentsData } = useGetStudentsQuery({ status: 'APPROVED' });

  // Navigation states - Store selection IDs instead of stale objects (Phase 4)
  const [selectedFloorId, setSelectedFloorId] = useState<string | null>(null);

  useEffect(() => {
    if (seatMap && seatMap.length > 0) {
      if (!selectedFloorId || !seatMap.some((f: any) => f.id === selectedFloorId)) {
        setSelectedFloorId(seatMap[0].id);
      }
    } else {
      setSelectedFloorId(null);
    }
  }, [seatMap, selectedFloorId]);

  const activeFloorTab = useMemo(() => {
    if (!seatMap || !selectedFloorId) return 0;
    const idx = seatMap.findIndex((f: any) => f.id === selectedFloorId);
    return idx >= 0 ? idx : 0;
  }, [seatMap, selectedFloorId]);

  const currentFloor = useMemo(() => {
    if (!seatMap) return null;
    return seatMap.find((f: any) => f.id === selectedFloorId) || seatMap[0] || null;
  }, [seatMap, selectedFloorId]);

  // Seat selection by ID (Phase 4)
  const [selectedSeatId, setSelectedSeatId] = useState<string | null>(null);
  const seatsById = useMemo(() => indexSeats(seatMap ?? []), [seatMap]);
  const selectedSeat = useMemo(() => {
    return selectedSeatId ? seatsById.get(selectedSeatId) ?? null : null;
  }, [selectedSeatId, seatsById]);

  // Drawer Panel & Allocation Selection States
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerActiveSection, setDrawerActiveSection] = useState<DrawerSection>('DETAILS');
  const [selectedAllocationId, setSelectedAllocationId] = useState<string | null>(null);

  // Search, filter, and collapse state per room
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [highlightedSeatId, setHighlightedSeatId] = useState<string | null>(null);
  const [roomSearches, setRoomSearches] = useState<Record<string, string>>({});
  const [collapsedRooms, setCollapsedRooms] = useState<Record<string, boolean>>({});
  const [statusFilters, setStatusFilters] = useState<Record<string, RoomStatusFilter | string>>({});
  const [sortOptions, setSortOptions] = useState<Record<string, SeatSort | string>>({});

  // Creator form modal
  const [openCreator, setOpenCreator] = useState(false);
  const [creatorType, setCreatorType] = useState<'floor' | 'room' | 'seat'>('floor');
  const [parentId, setParentId] = useState<string>('');
  const [creatorName, setCreatorName] = useState('');

  // Edit Room Modal (ID-based)
  const [openEditRoomModal, setOpenEditRoomModal] = useState(false);
  const [editRoomName, setEditRoomName] = useState('');
  const [selectedRoomIdToEdit, setSelectedRoomIdToEdit] = useState<string | null>(null);
  const selectedRoomToEdit = useMemo(() => {
    if (!selectedRoomIdToEdit || !currentFloor?.rooms) return null;
    return currentFloor.rooms.find((r: any) => r.id === selectedRoomIdToEdit) || null;
  }, [selectedRoomIdToEdit, currentFloor]);

  // Edit Floor Modal (ID-based)
  const [openEditFloorModal, setOpenEditFloorModal] = useState(false);
  const [editFloorName, setEditFloorName] = useState('');
  const [selectedFloorIdToEdit, setSelectedFloorIdToEdit] = useState<string | null>(null);
  const selectedFloorToEdit = useMemo(() => {
    if (!selectedFloorIdToEdit || !seatMap) return null;
    return seatMap.find((f: any) => f.id === selectedFloorIdToEdit) || null;
  }, [selectedFloorIdToEdit, seatMap]);

  // Allocate Seat Modal (Popup) & Invoice Receipt
  const [openAllocateModal, setOpenAllocateModal] = useState(false);
  const [openInvoiceReceipt, setOpenInvoiceReceipt] = useState(false);
  const [createdInvoiceData, setCreatedInvoiceData] = useState<any>(null);
  const [openImportModal, setOpenImportModal] = useState(false);

  // Inline edit allocation dates state
  const [isEditingDates, setIsEditingDates] = useState(false);
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // API mutations
  const [allocateSeat] = useAllocateSeatMutation();
  const [createPayment, { isLoading: isCreatingPayment }] = useCreatePaymentMutation();
  const [verifyRazorpay] = useVerifyRazorpayMutation();
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

  // Modular Layout Arranger Hook (Phase 7 & 8)
  const layout = useLayoutEditor({
    seatMap,
    refetchSeatMap,
    addSeat,
    updateSeatLayout,
    showToast,
    isUpdatingLayout,
  });

  // Modular Allocation Form Hook (Phase 5 & 6)
  const allocation = useSeatAllocationForm({
    shifts,
    studentsData,
    selectedSeat,
    preselectedStudent,
    branches,
    selectedBranch,
    allocateSeat,
    vacateSeat,
    createPayment,
    showToast,
    onSuccess: (invoiceInfo) => {
      if (invoiceInfo) {
        setCreatedInvoiceData(invoiceInfo);
        setOpenInvoiceReceipt(true);
      }
      setIsDrawerOpen(false);
      setOpenAllocateModal(false);
      setPreselectedStudent(null);
    },
  });

  // Modular Renewal Workflow Hook (Phase 5 & 10)
  const renewal = useSeatRenewal({
    shifts,
    branches,
    selectedBranch,
    selectedSeat,
    selectedAllocationId,
    userWorkspaceName: user?.workspace?.name,
    vacateSeat,
    allocateSeat,
    createPayment,
    verifyRazorpay,
    showToast,
    onSuccess: (invoiceInfo) => {
      setCreatedInvoiceData(invoiceInfo);
      setIsDrawerOpen(false);
      setOpenInvoiceReceipt(true);
    },
  });

  // Statistics and notifications computed via pure functions (Phase 8)
  const seatCounts = useMemo(() => calculateWorkspaceStats(seatMap), [seatMap]);
  const expiringSeatsList = useMemo(() => findExpiringSeats(seatMap, 7), [seatMap]);

  // Global search highlighting and auto-scroll
  useEffect(() => {
    const query = globalSearchQuery.trim().toLowerCase();
    if (query && seatMap) {
      let matchedSeat: any = null;
      for (const floor of seatMap) {
        for (const room of floor.rooms || []) {
          for (const seat of room.seats || []) {
            const { isOccupied } = getSeatStatusInfo(seat);
            const activeAlloc = seat.allocations?.find(
              (a: any) => a.isActive && a.studentProfile && !a.studentProfile?.deletedAt
            );
            const match =
              (seat.number || seat.seatNumber || '').toLowerCase().includes(query) ||
              (isOccupied &&
                activeAlloc?.studentProfile &&
                getStudentDisplayName(activeAlloc.studentProfile).toLowerCase().includes(query));
            if (match) {
              matchedSeat = seat;
              break;
            }
          }
          if (matchedSeat) break;
        }
        if (matchedSeat) break;
      }
      if (matchedSeat) {
        setHighlightedSeatId(matchedSeat.id);
        const targetRoom = currentFloor?.rooms?.find((r: any) =>
          r.seats?.some((s: any) => s.id === matchedSeat.id)
        );
        if (targetRoom) {
          setCollapsedRooms((prev) => ({ ...prev, [targetRoom.id]: false }));
        }
      }
    } else {
      setHighlightedSeatId(null);
    }
  }, [globalSearchQuery, seatMap, currentFloor]);

  useEffect(() => {
    if (highlightedSeatId) {
      const element = document.getElementById(`seat-${highlightedSeatId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [highlightedSeatId]);

  // Filter available students for assign form
  const filteredStudents = useMemo(() => {
    if (!studentsData?.students) return [];
    const query = allocation.studentSearchQuery.trim().toLowerCase();

    const allocatedIds = new Set<string>();
    if (seatMap) {
      seatMap.forEach((floor: any) => {
        floor.rooms?.forEach((room: any) => {
          room.seats?.forEach((seat: any) => {
            seat.allocations?.forEach((alloc: any) => {
              if (alloc.isActive && alloc.studentProfileId) {
                allocatedIds.add(alloc.studentProfileId);
              }
            });
          });
        });
      });
    }

    return studentsData.students.filter((student: any) => {
      if (allocatedIds.has(student.id)) return false;
      if (!query) return true;
      const displayName = getStudentDisplayName(student).toLowerCase();
      const mobile = getStudentMobile(student);
      const email = getStudentEmail(student).toLowerCase();
      return displayName.includes(query) || mobile.includes(query) || email.includes(query);
    });
  }, [studentsData, allocation.studentSearchQuery, seatMap]);

  const displayedStudents = useMemo(() => {
    return filteredStudents.slice(0, 8);
  }, [filteredStudents]);

  // Sync dates when selected allocation changes
  useEffect(() => {
    if (selectedSeat && selectedAllocationId) {
      const alloc = selectedSeat.allocations?.find((a: any) => a.id === selectedAllocationId);
      if (alloc) {
        const isExpired = alloc.endDate ? new Date(alloc.endDate).getTime() < new Date().setHours(0, 0, 0, 0) : false;
        const start = isExpired ? getTodayYYYYMMDD() : (alloc.endDate ? addDaysToDate(alloc.endDate, 1) : getTodayYYYYMMDD());
        renewal.setRenewStartDate(start);
        renewal.setRenewShiftId(alloc.shiftId || '');
        setEditStartDate(formatYYYYMMDD(alloc.startDate));
        setEditEndDate(formatYYYYMMDD(alloc.endDate));
      }
    }
  }, [selectedAllocationId, selectedSeat]);

  // Seat click handler
  const handleSeatClick = (seat: any) => {
    setSelectedSeatId(seat?.id || null);

    if (preselectedStudent) {
      if (seat.status === 'BLOCKED') {
        showToast('This seat is blocked/maintenance and cannot be allocated.', 'warning');
        return;
      }
      setIsDrawerOpen(false);
      setOpenAllocateModal(true);
      return;
    }

    setDrawerActiveSection('DETAILS');
    setIsDrawerOpen(true);

    if (seat.status === 'AVAILABLE') {
      allocation.resetForm();
    } else if (seat.status === 'OCCUPIED') {
      const { activeAllocations } = getSeatStatusInfo(seat);
      if (activeAllocations.length > 0) {
        setSelectedAllocationId(activeAllocations[0].id);
        const activeAllocation = activeAllocations[0];
        const isExpired = activeAllocation.endDate ? new Date(activeAllocation.endDate).getTime() < new Date().setHours(0, 0, 0, 0) : false;
        const nextDay = isExpired ? getTodayYYYYMMDD() : (activeAllocation.endDate ? addDaysToDate(activeAllocation.endDate, 1) : getTodayYYYYMMDD());
        renewal.setRenewStartDate(nextDay);
        renewal.setRenewShiftId(activeAllocation.shiftId || '');
        setEditStartDate(formatYYYYMMDD(activeAllocation.startDate));
        setEditEndDate(formatYYYYMMDD(activeAllocation.endDate));
      } else {
        setSelectedAllocationId(null);
      }
      setIsEditingDates(false);
    }
  };

  const handleOpenAllocateModal = () => {
    if (!selectedSeat) return;
    setIsDrawerOpen(false);
    setOpenAllocateModal(true);
  };

  const handleAllocateModalSuccess = (invoiceInfo?: any) => {
    if (invoiceInfo) {
      setCreatedInvoiceData(invoiceInfo);
      setOpenInvoiceReceipt(true);
    }
    setOpenAllocateModal(false);
    setIsDrawerOpen(false);
    setPreselectedStudent(null);
  };

  // Submit vacate seat
  const handleVacateSeat = async () => {
    if (!selectedSeat) return;
    const activeAllocation = selectedSeat.allocations?.find((a: any) => a.id === selectedAllocationId);

    const sName = activeAllocation?.studentProfile
      ? getStudentDisplayName(activeAllocation.studentProfile)
      : 'this seat';
    const confirmed = await showAlert(`Are you sure you want to vacate ${sName}?`, {
      title: 'Vacate Seat',
      confirmText: 'Vacate Seat',
      cancelText: 'Cancel',
      type: 'danger',
    });
    if (!confirmed) return;

    try {
      await vacateSeat({
        id: selectedSeat.id,
        ...(activeAllocation?.studentProfileId ? { studentProfileId: activeAllocation.studentProfileId } : {}),
      }).unwrap();
      setIsDrawerOpen(false);
      setSelectedSeatId(null);
      showToast('Seat vacated successfully!', 'success');
    } catch (err: any) {
      showToast(err.data?.message || 'Failed to vacate seat', 'error');
    }
  };

  // Submit update dates
  const handleUpdateAllocationDates = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSeat || !selectedAllocationId) return;
    const activeAllocation = selectedSeat.allocations?.find((a: any) => a.id === selectedAllocationId);
    if (!activeAllocation) return;

    try {
      await updateAllocation({
        id: activeAllocation.id,
        startDate: editStartDate,
        endDate: editEndDate,
      }).unwrap();
      showToast('Subscription dates updated successfully!', 'success');
      setIsEditingDates(false);
      setIsDrawerOpen(false);
    } catch (err: any) {
      showToast(err?.data?.message || 'Failed to update subscription dates', 'error');
    }
  };

  // Creator handler for new Floor, Room, or Seat
  const handleCreate = async () => {
    try {
      if (creatorType === 'floor') {
        await addFloor({ branchId: selectedBranch, name: creatorName }).unwrap();
        showToast('Floor created successfully!', 'success');
      } else if (creatorType === 'room') {
        await addRoom({ floorId: parentId, name: creatorName }).unwrap();
        showToast('Room created successfully!', 'success');
      } else if (creatorType === 'seat') {
        if (creatorName.includes('-')) {
          const [startStr, endStr] = creatorName.split('-');
          const start = parseInt(startStr.trim(), 10);
          const end = parseInt(endStr.trim(), 10);
          if (!isNaN(start) && !isNaN(end) && start <= end && end - start <= 200) {
            for (let i = start; i <= end; i++) {
              await addSeat({ roomId: parentId, number: i.toString() }).unwrap();
            }
            showToast(`Seats ${start} to ${end} created!`, 'success');
          } else {
            await addSeat({ roomId: parentId, number: creatorName }).unwrap();
            showToast('Seat created!', 'success');
          }
        } else {
          await addSeat({ roomId: parentId, number: creatorName }).unwrap();
          showToast('Seat created!', 'success');
        }
      }
      setOpenCreator(false);
      setCreatorName('');
    } catch (err: any) {
      showToast(err.data?.message || 'Creation failed', 'error');
    }
  };

  const handleDeleteFloor = async (id: string) => {
    const confirmed = await showAlert('Are you sure you want to delete this floor and all its rooms and seats?', {
      type: 'danger',
    });
    if (!confirmed) return;
    try {
      await deleteFloor(id).unwrap();
      setSelectedFloorId(null);
      showToast('Floor deleted successfully!', 'success');
    } catch (err: any) {
      showToast(err.data?.message || 'Failed to delete floor', 'error');
    }
  };

  const handleDeleteRoom = async (id: string) => {
    const confirmed = await showAlert('Are you sure you want to delete this room and all its seats?', {
      type: 'danger',
    });
    if (!confirmed) return;
    try {
      await deleteRoom(id).unwrap();
      showToast('Room deleted successfully!', 'success');
    } catch (err: any) {
      showToast(err.data?.message || 'Failed to delete room', 'error');
    }
  };

  const handleDeleteSeat = async (id: string) => {
    const confirmed = await showAlert('Are you sure you want to delete this seat?', {
      title: 'Delete Seat',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
    });
    if (!confirmed) return;
    try {
      await deleteSeat(id).unwrap();
      setIsDrawerOpen(false);
      setSelectedSeatId(null);
      showToast('Seat deleted successfully!', 'success');
    } catch (err: any) {
      showToast(err.data?.message || 'Failed to delete seat', 'error');
    }
  };

  // Render Visualizer Canvas for Layout Arranger
  const renderVisualizationCanvas = (room: any) => {
    const roomWidth = layout.visualizerWidths[room.id] || room.canvasWidth || 1000;
    const roomHeight = layout.visualizerHeights[room.id] || room.canvasHeight || 450;
    const isEditingThisRoom = layout.activeRoomEditingId === room.id;

    return (
      <LayoutCanvas
        room={room}
        isEditing={isEditingThisRoom}
        roomWidth={roomWidth}
        roomHeight={roomHeight}
        tempLayout={layout.tempLayout}
        spacers={layout.spacers}
        selectedArrangeIds={layout.selectedArrangeIds}
        statusFilter={statusFilters[room.id] || 'ALL'}
        canUndo={layout.layoutHistory.length > 0}
        isSaving={isUpdatingLayout}
        dragSelectStart={layout.dragSelectStart}
        dragSelectEnd={layout.dragSelectEnd}
        onCanvasPointerDown={layout.handleCanvasPointerDown}
        onSeatPointerDown={layout.handlePointerDown}
        onSeatDoubleClick={(seat) => {
          layout.setEditingSeatId(seat.id);
          layout.setEditingSeatNumber(seat.number || seat.seatNumber || '');
        }}
        onSeatClick={handleSeatClick}
        onSpacerPointerDown={layout.handleSpacerPointerDown}
        onSpacerResizePointerDown={layout.handleResizePointerDown}
        onRemoveSpacer={(id) => {
          layout.pushToHistory();
          layout.setSpacers((prev) => prev.filter((s) => s.id !== id));
        }}
        onSelectGroup={(memberIds) => layout.setSelectedArrangeIds(memberIds)}
        onStartArrange={() => layout.initRoomArranging(room)}
        onAddSpacer={layout.handleAddSpacer}
        onOpenAddDesk={() => {
          if (room.seats && room.seats.length > 0) {
            const numbers = room.seats
              .map((s: any) => parseInt(s.number || s.seatNumber || '', 10))
              .filter((n: any) => !isNaN(n));
            if (numbers.length > 0) {
              const maxNum = Math.max(...numbers);
              layout.setDeskStartSeat(maxNum + 1);
            } else {
              layout.setDeskStartSeat(1);
            }
          } else {
            layout.setDeskStartSeat(1);
          }
          layout.setOpenAddDesk(true);
        }}
        onArrangeAscending={layout.handleArrangeAscending}
        onUndo={layout.handleUndo}
        onCancel={layout.handleCancelArranging}
        onSave={layout.handleSaveLayout}
        onAlign={layout.alignSelectedSeats}
        onAlignStraight={layout.alignSelectedSeatsStraight}
        onRotateSelection={layout.rotateSelectedSeats}
        onGroupAndLock={layout.handleGroupAndLock}
        onUngroup={layout.handleUngroup}
        onToggleLock={layout.handleToggleLock}
      />
    );
  };

  return (
    <div
      style={{
        width: '100%',
        minHeight: '100vh',
        backgroundColor: '#F7F8FA',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
      }}
    >
      {/* Intent banner when student is preselected from navigation */}
      {preselectedStudent && (
        <AllocationIntentBanner
          student={preselectedStudent}
          onCancel={() => setPreselectedStudent(null)}
        />
      )}

      {/* 1. TOP CONTROLS TOOLBAR */}
      <SeatsToolbar
        branches={branches}
        selectedBranch={selectedBranch}
        onBranchChange={(branchId: string) => {
          setSelectedBranch(branchId);
          setSelectedFloorId(null);
          setSelectedSeatId(null);
          setSelectedAllocationId(null);
          setIsDrawerOpen(false);
          layout.setIsFloorVisualization(false);
          layout.setActiveRoomEditingId(null);
        }}
        floors={seatMap || []}
        activeFloorIndex={activeFloorTab}
        onFloorChange={(idx: number) => {
          if (seatMap && seatMap[idx]) {
            setSelectedFloorId(seatMap[idx].id);
          }
          setSelectedSeatId(null);
          setSelectedAllocationId(null);
          setIsDrawerOpen(false);
          layout.setIsFloorVisualization(false);
          layout.setActiveRoomEditingId(null);
        }}
        currentFloor={currentFloor}
        onEditFloor={(floor) => {
          setSelectedFloorIdToEdit(floor.id);
          setEditFloorName(floor.name);
          setOpenEditFloorModal(true);
        }}
        onAddRoom={(floorId: string) => {
          setCreatorType('room');
          setParentId(floorId);
          setOpenCreator(true);
        }}
        isFloorVisualization={layout.isFloorVisualization}
        onToggleVisualization={() => {
          layout.setIsFloorVisualization(!layout.isFloorVisualization);
        }}
        globalSearchQuery={globalSearchQuery}
        onGlobalSearchChange={setGlobalSearchQuery}
        expiringSeats={expiringSeatsList}
        onSelectExpiringSeat={(seatId) => {
          const seatObj = seatsById.get(seatId);
          if (seatObj) {
            handleSeatClick(seatObj);
          }
        }}
        userAvatar={null}
        userInitials={user?.name?.charAt(0).toUpperCase() || 'U'}
        onNavigateProfile={() => navigate('/profile')}
      />

      {/* 2. STATS SECTION */}
      {selectedBranch && seatMap && (
        <SeatsStats
          stats={{
            total: seatCounts.total,
            occupied: seatCounts.occupied,
            available: seatCounts.available,
            maintenance: seatCounts.maintenance,
            expiringSoon: expiringSeatsList.length,
            occupancyRate:
              seatCounts.total > 0 ? Math.round((seatCounts.occupied / seatCounts.total) * 100) : 0,
          }}
          expiringCount={expiringSeatsList.length}
        />
      )}

      {selectedBranch && (
        <QueryFeedback
          error={mapError}
          fetching={isMapFetching && !!seatMap}
          onRetry={refetchSeatMap}
        />
      )}

      {/* 2.5 FLOOR NAVIGATION & QUICK ACTIONS BAR */}
      {selectedBranch && seatMap && seatMap.length > 0 && (
        <FloorNavigationTabs
          floors={seatMap}
          activeFloorId={selectedFloorId}
          onSelectFloor={(floorId) => {
            setSelectedFloorId(floorId);
            setSelectedSeatId(null);
            setSelectedAllocationId(null);
            setIsDrawerOpen(false);
            layout.setIsFloorVisualization(false);
            layout.setActiveRoomEditingId(null);
          }}
          onAddFloor={() => {
            setCreatorType('floor');
            setParentId('');
            setOpenCreator(true);
          }}
          onAddRoom={(floorId) => {
            setCreatorType('room');
            setParentId(floorId);
            setOpenCreator(true);
          }}
          onAddSeat={(floorId) => {
            setCreatorType('seat');
            const targetFloor = seatMap.find((f: any) => f.id === floorId);
            if (targetFloor?.rooms && targetFloor.rooms.length > 0) {
              setParentId(targetFloor.rooms[0].id);
            }
            setOpenCreator(true);
          }}
          onImportLayout={() => setOpenImportModal(true)}
          onEditFloor={(floor) => {
            setSelectedFloorIdToEdit(floor.id);
            setEditFloorName(floor.name);
            setOpenEditFloorModal(true);
          }}
          onDeleteFloor={handleDeleteFloor}
          isFloorVisualization={layout.isFloorVisualization}
          onToggleVisualization={() => {
            layout.setIsFloorVisualization(!layout.isFloorVisualization);
          }}
        />
      )}

      {/* 3. MAIN WORKSPACE */}
      <SeatsWorkspace
        isLoading={isMapLoading}
        mapError={mapError}
        seatMap={seatMap}
        currentFloor={currentFloor}
        branchName={branches?.find((b: any) => b.id === selectedBranch)?.name}
        onAddFloor={() => {
          setCreatorType('floor');
          setParentId('');
          setOpenCreator(true);
        }}
        onAddRoom={(floorId) => {
          setCreatorType('room');
          setParentId(floorId);
          setOpenCreator(true);
        }}
        onAddSeat={(roomId) => {
          setCreatorType('seat');
          setParentId(roomId);
          setOpenCreator(true);
        }}
        onImportLayout={() => setOpenImportModal(true)}
        collapsedRooms={collapsedRooms}
        onToggleCollapseRoom={(roomId) =>
          setCollapsedRooms((prev) => ({ ...prev, [roomId]: !prev[roomId] }))
        }
        roomSearches={roomSearches}
        onRoomSearchChange={(roomId, query) =>
          setRoomSearches((prev) => ({ ...prev, [roomId]: query }))
        }
        statusFilters={statusFilters}
        onStatusFilterChange={(roomId, status) =>
          setStatusFilters((prev) => ({ ...prev, [roomId]: status }))
        }
        sortOptions={sortOptions}
        onSortOptionChange={(roomId, sort) =>
          setSortOptions((prev) => ({ ...prev, [roomId]: sort }))
        }
        onRenameRoom={(room) => {
          setSelectedRoomIdToEdit(room.id);
          setEditRoomName(room.name);
          setOpenEditRoomModal(true);
        }}
        onDeleteRoom={handleDeleteRoom}
        onSelectSeat={handleSeatClick}
        highlightedSeatId={highlightedSeatId}
        isFloorVisualization={layout.isFloorVisualization}
        renderVisualizationCanvas={renderVisualizationCanvas}
        editingSeatId={layout.editingSeatId}
        editingSeatNumber={layout.editingSeatNumber}
        onEditNumberChange={layout.setEditingSeatNumber}
        onEditNumberSubmit={(newNumber) => {
          if (layout.editingSeatId) {
            layout.handleSeatNumberSwap(layout.editingSeatId, newNumber);
          }
        }}
        onEditNumberCancel={() => {
          layout.setEditingSeatId(null);
          layout.setEditingSeatNumber('');
        }}
      />

      {/* 4. RIGHT SLIDING DRAWER PANEL */}
      <SeatDetailsDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        selectedSeat={selectedSeat}
        branchName={branches?.find((b: any) => b.id === selectedBranch)?.name}
        floorName={currentFloor?.name}
        onOpenAllocateModal={handleOpenAllocateModal}
        selectedAllocationId={selectedAllocationId || ''}
        onSelectAllocationId={setSelectedAllocationId}
        drawerActiveSection={drawerActiveSection}
        onChangeDrawerActiveSection={setDrawerActiveSection}
        onNavigateToTransfer={(allocId, stId) =>
          navigate(`/transfer-seat?allocationId=${allocId}&studentId=${stId}`)
        }
        isEditingDates={isEditingDates}
        onToggleEditDates={() => {
          setIsEditingDates(!isEditingDates);
          if (selectedSeat) {
            const { activeAllocations } = getSeatStatusInfo(selectedSeat);
            const activeAllocation =
              activeAllocations.find((a: any) => a.id === selectedAllocationId) || activeAllocations[0];
            if (activeAllocation) {
              setEditStartDate(activeAllocation.startDate ? activeAllocation.startDate.split('T')[0] : '');
              setEditEndDate(activeAllocation.endDate ? activeAllocation.endDate.split('T')[0] : '');
            }
          }
        }}
        editStartDate={editStartDate}
        onChangeEditStartDate={setEditStartDate}
        editEndDate={editEndDate}
        onChangeEditEndDate={setEditEndDate}
        onSaveDates={handleUpdateAllocationDates}
        isUpdatingDates={isUpdatingAllocation}
        onVacateSeat={handleVacateSeat}
        isVacating={isVacating}
        shifts={shifts}
        renewShiftId={renewal.renewShiftId}
        onRenewShiftChange={renewal.setRenewShiftId}
        renewDuration={renewal.renewDuration}
        onRenewDurationChange={renewal.setRenewDuration}
        renewStartDate={renewal.renewStartDate}
        onRenewStartDateChange={renewal.setRenewStartDate}
        renewEndDate={renewal.renewEndDate}
        onRenewEndDateChange={renewal.setRenewEndDate}
        renewAmount={renewal.renewAmount}
        onRenewAmountChange={renewal.setRenewAmount}
        renewDiscount={renewal.renewDiscount}
        onRenewDiscountChange={renewal.handleDiscountChange}
        renewBasePrice={renewal.basePrice}
        renewPaymentMethod={renewal.renewPaymentMethod}
        onRenewPaymentMethodChange={renewal.setRenewPaymentMethod}
        onRenewSubmit={renewal.handleRenewSeat}
        isRenewing={renewal.isRenewing}
        assignFormProps={{
          studentSearchQuery: allocation.studentSearchQuery,
          setStudentSearchQuery: allocation.setStudentSearchQuery,
          studentProfileId: allocation.studentProfileId,
          setStudentProfileId: allocation.setStudentProfileId,
          showStudentDropdown: allocation.showStudentDropdown,
          setShowStudentDropdown: allocation.setShowStudentDropdown,
          isSearchFocused,
          setIsSearchFocused,
          displayedStudents,
          shiftId: allocation.shiftId,
          setShiftId: allocation.setShiftId,
          durationMode: allocation.durationMode,
          setDurationMode: (mode) => allocation.setDurationMode(mode as any),
          startDate: allocation.startDate,
          setStartDate: allocation.setStartDate,
          endDate: allocation.endDate,
          setEndDate: allocation.setEndDate,
          shouldGenerateInvoice: allocation.shouldGenerateInvoice,
          setShouldGenerateInvoice: allocation.setShouldGenerateInvoice,
          invoiceAmount: allocation.invoiceAmount,
          setInvoiceAmount: allocation.setInvoiceAmount,
          paymentMethod: allocation.paymentMethod,
          setPaymentMethod: allocation.setPaymentMethod,
          calculatedBaseAmount: allocation.calculatedBaseAmount,
          drawerDueAmount: allocation.dueAmount,
          isAllocating: allocation.isAllocating,
          isCreatingPayment,
          onSubmit: allocation.handleAllocate,
          onNavigateToShifts: () =>
            navigate('/billing?tab=shifts&action=add-shift', { state: { tab: 1, openCreateShift: true } }),
        }}
        onDeleteSeat={handleDeleteSeat}
        onUpdateSeatStatus={async (seatId, status) => {
          try {
            await updateSeatStatus({ id: seatId, status }).unwrap();
            setIsDrawerOpen(false);
            if (status === 'AVAILABLE') {
              setSelectedSeatId(null);
              showToast('Seat is now available!', 'success');
            } else {
              showToast('Seat marked under maintenance!', 'success');
            }
          } catch {
            showToast('Failed to update status', 'error');
          }
        }}
      />

      {/* 5. FLOATING QUICK ACTION BUTTON (FAB) */}
      <SeatQuickActions
        visible={!!selectedBranch}
        canAddRoom={!!currentFloor}
        canAddSeat={!!(currentFloor?.rooms && currentFloor.rooms.length > 0)}
        onAddFloor={() => {
          setCreatorType('floor');
          setParentId('');
          setOpenCreator(true);
        }}
        onAddRoom={() => {
          if (currentFloor) {
            setCreatorType('room');
            setParentId(currentFloor.id);
            setOpenCreator(true);
          } else {
            showToast('Please create a floor first', 'warning');
          }
        }}
        onAddSeat={() => {
          if (currentFloor?.rooms && currentFloor.rooms.length > 0) {
            setCreatorType('seat');
            setParentId(currentFloor.rooms[0].id);
            setOpenCreator(true);
          } else {
            showToast('Please create a room first', 'warning');
          }
        }}
        onImportLayout={() => {
          setOpenImportModal(true);
        }}
      />

      {/* Layout Creator Modal */}
      <LayoutCreatorModal
        isOpen={openCreator}
        onClose={() => setOpenCreator(false)}
        creatorType={creatorType}
        setCreatorType={setCreatorType}
        seatMap={seatMap}
        currentFloor={currentFloor}
        selectedBranch={selectedBranch}
        onOpenImport={() => setOpenImportModal(true)}
      />

      {/* Floor, Room & Seat Import Modal */}
      <SeatImportModal
        isOpen={openImportModal}
        onClose={() => setOpenImportModal(false)}
        seatMap={seatMap}
        selectedBranch={selectedBranch}
        initialFloorId={selectedFloorId || undefined}
        onSuccess={(targetFloorId) => {
          refetchSeatMap();
          if (targetFloorId) {
            setSelectedFloorId(targetFloorId);
          }
        }}
      />

      {/* Add Desk Modal */}
      <AddDeskModal
        isOpen={layout.openAddDesk && !!layout.activeRoomEditingId}
        onClose={() => layout.setOpenAddDesk(false)}
        room={
          seatMap?.flatMap((f: any) => f.rooms || []).find((r: any) => r.id === layout.activeRoomEditingId) || null
        }
        deskSeatCount={layout.deskSeatCount}
        setDeskSeatCount={layout.setDeskSeatCount}
        deskLayoutType={layout.deskLayoutType}
        setDeskLayoutType={layout.setDeskLayoutType}
        deskStartSeat={layout.deskStartSeat}
        setDeskStartSeat={layout.setDeskStartSeat}
        onSubmit={layout.handleCreateDeskLayout}
      />

      {/* Edit Floor Modal */}
      <EditFloorModal
        isOpen={openEditFloorModal}
        onClose={() => setOpenEditFloorModal(false)}
        floor={selectedFloorToEdit}
        onDelete={handleDeleteFloor}
        onSave={async (floorId, newName) => {
          try {
            await updateFloor({ id: floorId, name: newName }).unwrap();
            showToast('Floor name updated!', 'success');
          } catch (err: any) {
            showToast(getErrorMessage(err, 'Failed to update floor'), 'error');
          }
        }}
      />

      {/* Edit Room Name Modal */}
      <EditRoomModal
        isOpen={openEditRoomModal}
        onClose={() => setOpenEditRoomModal(false)}
        room={selectedRoomToEdit}
        onSave={async (roomId, newName) => {
          try {
            await updateRoom({ id: roomId, name: newName }).unwrap();
            showToast('Room name updated successfully!', 'success');
          } catch (err: any) {
            showToast(getErrorMessage(err, 'Failed to update room name'), 'error');
          }
        }}
      />

      {/* Allocate Seat Modal (Popup) */}
      <AllocateSeatModal
        isOpen={openAllocateModal}
        onClose={() => setOpenAllocateModal(false)}
        selectedSeat={selectedSeat}
        shifts={shifts}
        branches={branches}
        selectedBranch={selectedBranch}
        seatMap={seatMap}
        onSuccess={handleAllocateModalSuccess}
        preselectedStudentId={preselectedStudent?.id}
        preselectedJoiningDate={preselectedStudent?.joiningDate}
        preselectedShiftId={preselectedStudent?.shiftId}
      />

      {/* Invoice Receipt Modal */}
      <InvoiceReceiptModal
        isOpen={openInvoiceReceipt}
        onClose={() => setOpenInvoiceReceipt(false)}
        createdInvoiceData={createdInvoiceData}
      />
    </div>
  );
}
