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
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { AllocateSeatModal } from '../components/AllocateSeatModal';
import { InvoiceReceiptModal } from '../components/InvoiceReceiptModal';
import { LayoutCreatorModal } from '../components/LayoutCreatorModal';
import { Switch } from '../components/ui/Switch';
import { Select } from '../components/ui/Select';
import { useAlert } from '../components/ui/AlertContext';
import { useToast } from '../components/ui/ToastContext';
import '../components/ui/Globals.css';
import {
  Plus,
  Layers,
  DoorOpen,
  Trash2,
  Loader2,
  Search,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Edit2,
  LogOut,
  Clock,
  Map,
  LayoutGrid,
  Bell,
  CheckCircle,
  Users,
  Wrench,
  Sparkles,
  SlidersHorizontal,
  X,
  History,
  FileText,
  MoreVertical,
  HelpCircle,
  Building
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
  return `${diffDays} days remaining`;
};

const getSeatStatusInfo = (seat: any) => {
  if (!seat) return { isOccupied: false, isExpired: false, activeAllocations: [], currentAllocations: [], expiredAllocations: [] };
  const activeAllocations = seat.allocations?.filter((a: any) => a.isActive) || [];
  
  const isAllocationExpired = (alloc: any) => {
    if (!alloc.endDate) return false;
    const end = new Date(alloc.endDate);
    const today = new Date();
    end.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return end.getTime() < today.getTime();
  };

  const currentAllocations = activeAllocations.filter((a: any) => !isAllocationExpired(a));
  const expiredAllocations = activeAllocations.filter((a: any) => isAllocationExpired(a));

  const isOccupied = currentAllocations.length > 0;
  const isExpired = currentAllocations.length === 0 && expiredAllocations.length > 0;

  return {
    isOccupied,
    isExpired,
    activeAllocations,
    currentAllocations,
    expiredAllocations
  };
};

export default function Seats() {
  const { showAlert } = useAlert();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);

  
  // Branches API
  const { data: branches } = useGetBranchesQuery(user?.workspaceId, { skip: !user?.workspaceId });
  const [selectedBranch, setSelectedBranch] = useState('');

  // Seat Map API
  const { data: seatMap, isLoading: isMapLoading, refetch: refetchSeatMap } = useGetSeatMapQuery(selectedBranch, {
    skip: !selectedBranch,
  });
  
  const { data: shifts } = useGetShiftsQuery(user?.workspaceId, { skip: !user?.workspaceId });
  const { data: studentsData } = useGetStudentsQuery({ status: 'APPROVED' });

  // Navigation states
  const [activeFloorTab, setActiveFloorTab] = useState(0);
  const currentFloor = seatMap?.[activeFloorTab];

  // Drawer Panel & Selection States
  const [selectedSeat, setSelectedSeat] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerActiveSection, setDrawerActiveSection] = useState<'DETAILS' | 'TRANSFER' | 'RENEW'>('DETAILS');
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);

  // Search filter inputs
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [highlightedSeatId, setHighlightedSeatId] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [roomSearches, setRoomSearches] = useState<Record<string, string>>({});
  const [collapsedRooms, setCollapsedRooms] = useState<Record<string, boolean>>({});

  // Sorting & Filtering states inside rooms
  const [statusFilters, setStatusFilters] = useState<Record<string, string>>({}); // roomId -> status filter
  const [sortOptions, setSortOptions] = useState<Record<string, string>>({});     // roomId -> sort mode
  const [visualizerHeights, setVisualizerHeights] = useState<Record<string, number>>({}); // roomId -> height in px
  const [visualizerWidths, setVisualizerWidths] = useState<Record<string, number>>({});   // roomId -> width in px

  // Creator form modals
  const [openCreator, setOpenCreator] = useState(false);
  const [creatorType, setCreatorType] = useState<'floor' | 'room' | 'seat'>('floor');
  const [parentId, setParentId] = useState<string>('');
  const [creatorName, setCreatorName] = useState('');
  const [isFabOpen, setIsFabOpen] = useState(false);

  // Edit Room Modal
  const [openEditRoomModal, setOpenEditRoomModal] = useState(false);
  const [editRoomName, setEditRoomName] = useState('');
  const [selectedRoomToEdit, setSelectedRoomToEdit] = useState<any>(null);

  // Edit Floor Modal
  const [openEditFloorModal, setOpenEditFloorModal] = useState(false);
  const [editFloorName, setEditFloorName] = useState('');
  const [selectedFloorToEdit, setSelectedFloorToEdit] = useState<any>(null);

  // Allocate Seat Modal (Popup)
  const [openAllocateModal, setOpenAllocateModal] = useState(false);
  const [allocModalStudentId, setAllocModalStudentId] = useState('');
  const [allocModalSearchQuery, setAllocModalSearchQuery] = useState('');
  const [showModalStudentDropdown, setShowModalStudentDropdown] = useState(false);
  const [isModalSearchFocused, setIsModalSearchFocused] = useState(false);
  const [allocModalShiftId, setAllocModalShiftId] = useState('');
  const [allocModalStartDate, setAllocModalStartDate] = useState('');
  const [allocModalEndDate, setAllocModalEndDate] = useState('');
  const [allocModalDuration, setAllocModalDuration] = useState<number | 'flex'>(1);
  const [allocModalGenerateInvoice, setAllocModalGenerateInvoice] = useState(true);
  const [allocModalAmount, setAllocModalAmount] = useState('');
  const [allocModalPaymentMethod, setAllocModalPaymentMethod] = useState<'CASH' | 'UPI' | 'RAZORPAY'>('UPI');

  // Allocation variables
  const [studentProfileId, setStudentProfileId] = useState('');
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [shiftId, setShiftId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [durationMode, setDurationMode] = useState<number | 'flex'>(1);
  const [shouldGenerateInvoice, setShouldGenerateInvoice] = useState(true);

  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI' | 'RAZORPAY'>('CASH');

  // Success Receipt Modal
  const [openInvoiceReceipt, setOpenInvoiceReceipt] = useState(false);
  const [createdInvoiceData, setCreatedInvoiceData] = useState<any>(null);
  const [selectedAllocationId, setSelectedAllocationId] = useState<string | null>(null);

  // Renewal form

  const [renewShiftId, setRenewShiftId] = useState('');
  const [renewDuration, setRenewDuration] = useState<number>(1);
  const [spacers, setSpacers] = useState<{ id: string; x: number; y: number; w?: number; h?: number; type?: string }[]>([]);
  const [renewStartDate, setRenewStartDate] = useState('');
  const [renewEndDate, setRenewEndDate] = useState('');
  const [renewPaymentMethod, setRenewPaymentMethod] = useState<'CASH' | 'UPI' | 'RAZORPAY'>('UPI');
  const [renewAmount, setRenewAmount] = useState('');
  const [isRenewing, setIsRenewing] = useState(false);

  // Edit dates inline
  const [isEditingDates, setIsEditingDates] = useState(false);
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');


  // Room Header actions dropdown
  const [activeRoomMenuId, setActiveRoomMenuId] = useState<string | null>(null);

  // API mutations
  const [allocateSeat, { isLoading: isAllocating }] = useAllocateSeatMutation();
  const [createPayment, { isLoading: isCreatingPayment }] = useCreatePaymentMutation();
  const [verifyRazorpay] = useVerifyRazorpayMutation();
  const [updateAllocation, { isLoading: isUpdatingAllocation }] = useUpdateAllocationMutation();

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };
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

  // Floor coordinate visualization
  const [isFloorVisualization, setIsFloorVisualization] = useState(false);
  const [tempLayout, setTempLayout] = useState<Record<string, { x: number; y: number; rotation?: number }>>({});
  const [activeRoomEditingId, setActiveRoomEditingId] = useState<string | null>(null);

  // Undo History state for visual arranger
  const [layoutHistory, setLayoutHistory] = useState<Array<{
    tempLayout: Record<string, { x: number; y: number; rotation?: number }>;
    spacers: Array<{ id: string; x: number; y: number; w?: number; h?: number; type?: string }>;
    visualizerWidths: Record<string, number>;
    visualizerHeights: Record<string, number>;
  }>>([]);

  const pushToHistory = (
    currentLayout = tempLayout,
    currentSpacers = spacers,
    currentWidths = visualizerWidths,
    currentHeights = visualizerHeights
  ) => {
    setLayoutHistory(prev => [
      ...prev,
      {
        tempLayout: JSON.parse(JSON.stringify(currentLayout)),
        spacers: JSON.parse(JSON.stringify(currentSpacers)),
        visualizerWidths: { ...currentWidths },
        visualizerHeights: { ...currentHeights }
      }
    ]);
  };

  const handleUndo = () => {
    if (layoutHistory.length === 0) return;
    setLayoutHistory(prev => {
      const nextHistory = [...prev];
      const previousState = nextHistory.pop();
      if (previousState) {
        setTempLayout(previousState.tempLayout);
        setSpacers(previousState.spacers);
        setVisualizerWidths(previousState.visualizerWidths);
        setVisualizerHeights(previousState.visualizerHeights);
      }
      return nextHistory;
    });
  };
  const [selectedArrangeIds, setSelectedArrangeIds] = useState<string[]>([]);
  const [dragSelectStart, setDragSelectStart] = useState<{ x: number; y: number } | null>(null);
  const [dragSelectEnd, setDragSelectEnd] = useState<{ x: number; y: number } | null>(null);
  const [showSelectionMenu, setShowSelectionMenu] = useState(false);
  const [editingSeatId, setEditingSeatId] = useState<string | null>(null);
  const [editingSeatNumber, setEditingSeatNumber] = useState<string>('');
  const [openAddDesk, setOpenAddDesk] = useState(false);
  const [deskSeatCount, setDeskSeatCount] = useState<number | ''>(6);
  const [deskLayoutType, setDeskLayoutType] = useState<'one_side' | 'both_sides'>('both_sides');
  const [deskStartSeat, setDeskStartSeat] = useState<number | ''>(1);

  // Default coordinate helpers (returns percentages for viewing)
  const getSeatPosition = (seat: any, index: number) => {
    if (seat.x !== null && seat.y !== null && seat.x !== undefined && seat.y !== undefined) {
      return { x: seat.x, y: seat.y };
    }
    const cols = 10;
    const row = Math.floor(index / cols);
    const col = index % cols;
    const x = col * 9 + 5;
    const y = row * 12 + 15;
    return { x, y };
  };

  // Convert layout coordinates to absolute pixels (for Arrange mode)
  const getSeatPixelPosition = (seat: any, index: number, canvasWidth: number, canvasHeight: number) => {
    if (tempLayout[seat.id]) {
      return tempLayout[seat.id];
    }
    if (seat.x !== null && seat.y !== null && seat.x !== undefined && seat.y !== undefined) {
      return {
        x: (seat.x / 100) * canvasWidth,
        y: (seat.y / 100) * canvasHeight
      };
    }
    const cols = 10;
    const row = Math.floor(index / cols);
    const col = index % cols;
    const xPct = col * 9 + 5;
    const yPct = row * 12 + 15;
    return {
      x: (xPct / 100) * canvasWidth,
      y: (yPct / 100) * canvasHeight
    };
  };

  // Helper to push seats out of spacers and other seats areas
  const resolveCollisions = (
    currentTempLayout: Record<string, { x: number; y: number }>,
    currentSpacers: { id: string; x: number; y: number; w?: number; h?: number }[],
    room: any
  ) => {
    if (!room) return currentTempLayout;
    const resolvedLayout = { ...currentTempLayout };
    const roomWidth = visualizerWidths[room.id] || room.canvasWidth || 1000;
    const roomHeight = visualizerHeights[room.id] || room.canvasHeight || 450;
    const seatSize = 78;

    // Ensure all seats in the room have an entry in resolvedLayout
    room.seats?.forEach((seat: any, idx: number) => {
      if (!resolvedLayout[seat.id]) {
        resolvedLayout[seat.id] = getSeatPixelPosition(seat, idx, roomWidth, roomHeight);
      }
    });

    const seatsList = room.seats || [];

    // Run three passes to resolve cascading overlaps (relaxation loop)
    for (let iter = 0; iter < 3; iter++) {
      let anyCollisionResolved = false;

      // 1. Resolve Seat-to-Spacer Collisions
      seatsList.forEach((seat: any) => {
        const seatPos = resolvedLayout[seat.id];
        if (!seatPos) return;

        let seatX = seatPos.x;
        let seatY = seatPos.y;

        currentSpacers.forEach((spacer) => {
          const spacerW = spacer.w || 78;
          const spacerH = spacer.h || 78;

          // Check overlap on all 4 boundaries
          const overlapLeft = (seatX + seatSize) - spacer.x;
          const overlapRight = (spacer.x + spacerW) - seatX;
          const overlapTop = (seatY + seatSize) - spacer.y;
          const overlapBottom = (spacer.y + spacerH) - seatY;

          // If all overlaps are positive, the seat overlaps with the spacer
          if (overlapLeft > 0 && overlapRight > 0 && overlapTop > 0 && overlapBottom > 0) {
            // Find the minimum translation vector
            const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

            if (minOverlap === overlapLeft) {
              seatX = spacer.x - seatSize;
            } else if (minOverlap === overlapRight) {
              seatX = spacer.x + spacerW;
            } else if (minOverlap === overlapTop) {
              seatY = spacer.y - seatSize;
            } else {
              seatY = spacer.y + spacerH;
            }

            // Snap to grid
            const snapPx = 15;
            seatX = Math.round(seatX / snapPx) * snapPx;
            seatY = Math.round(seatY / snapPx) * snapPx;

            // Clamp inside bounds
            seatX = Math.max(0, Math.min(roomWidth - seatSize, seatX));
            seatY = Math.max(60, Math.min(roomHeight - seatSize, seatY));

            anyCollisionResolved = true;
          }
        });

        resolvedLayout[seat.id] = { x: seatX, y: seatY };
      });

      // 2. Resolve Seat-to-Seat Collisions
      const seatCollisionSize = 90; // 78px width + 12px gap
      for (let i = 0; i < seatsList.length; i++) {
        const seatA = seatsList[i];
        const posA = resolvedLayout[seatA.id];
        if (!posA) continue;

        for (let j = i + 1; j < seatsList.length; j++) {
          const seatB = seatsList[j];
          const posB = resolvedLayout[seatB.id];
          if (!posB) continue;

          // Check overlap between seat A and seat B
          const overlapX = seatCollisionSize - Math.abs(posA.x - posB.x);
          const overlapY = seatCollisionSize - Math.abs(posA.y - posB.y);

          if (overlapX > 0 && overlapY > 0) {
            // Push them apart along the axis of minimum overlap
            if (overlapX < overlapY) {
              const pushX = overlapX / 2;
              if (posA.x < posB.x) {
                posA.x -= pushX;
                posB.x += pushX;
              } else {
                posA.x += pushX;
                posB.x -= pushX;
              }
            } else {
              const pushY = overlapY / 2;
              if (posA.y < posB.y) {
                posA.y -= pushY;
                posB.y += pushY;
              } else {
                posA.y += pushY;
                posB.y -= pushY;
              }
            }

            // Snap to grid
            const snapPx = 15;
            posA.x = Math.round(posA.x / snapPx) * snapPx;
            posA.y = Math.round(posA.y / snapPx) * snapPx;
            posB.x = Math.round(posB.x / snapPx) * snapPx;
            posB.y = Math.round(posB.y / snapPx) * snapPx;

            // Clamp inside bounds
            posA.x = Math.max(0, Math.min(roomWidth - seatSize, posA.x));
            posA.y = Math.max(60, Math.min(roomHeight - seatSize, posA.y));
            posB.x = Math.max(0, Math.min(roomWidth - seatSize, posB.x));
            posB.y = Math.max(60, Math.min(roomHeight - seatSize, posB.y));

            anyCollisionResolved = true;
          }
        }
      }

      if (!anyCollisionResolved) break;
    }

    return resolvedLayout;
  };

  // Pointer drag visual layout coordinate snappings (supports auto-growing, auto-scrolling, and multi-seat drag)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>, seatId: string) => {
    if (activeRoomEditingId === null) return;
    const roomId = activeRoomEditingId;
    e.preventDefault();

    // Take snapshot for undo history
    const snapshot = {
      tempLayout: JSON.parse(JSON.stringify(tempLayout)),
      spacers: JSON.parse(JSON.stringify(spacers)),
      visualizerWidths: { ...visualizerWidths },
      visualizerHeights: { ...visualizerHeights }
    };

    const element = e.currentTarget;
    element.setPointerCapture(e.pointerId);
    
    const container = element.parentElement;
    if (!container) return;
    
    // We want the scroll container (which has overflow: auto)
    const scrollContainer = container.parentElement;
    
    // Lookup room defaults if visualizer state not initialized
    let roomObj: any = null;
    seatMap?.forEach((floor: any) => {
      floor.rooms?.forEach((rm: any) => {
        if (rm.id === roomId) {
          roomObj = rm;
        }
      });
    });

    const currentWidth = visualizerWidths[roomId] || roomObj?.canvasWidth || 1000;
    const currentHeight = visualizerHeights[roomId] || roomObj?.canvasHeight || 450;

    // Helper functions to retrieve seat models
    const findSeatById = (id: string) => roomObj?.seats?.find((s: any) => s.id === id);
    const findSeatIndexById = (id: string) => roomObj?.seats?.findIndex((s: any) => s.id === id) ?? 0;

    // Determine selection list
    let nextSelected = [...selectedArrangeIds];
    const isModifierPressed = e.shiftKey || e.ctrlKey || e.metaKey;
    const isAlreadySelected = nextSelected.includes(seatId);

    if (isModifierPressed) {
      if (isAlreadySelected) {
        nextSelected = nextSelected.filter(id => id !== seatId);
      } else {
        nextSelected.push(seatId);
      }
    } else {
      if (!isAlreadySelected) {
        nextSelected = [seatId];
      }
    }
    setSelectedArrangeIds(nextSelected);

    // Record starting coordinates of all elements in nextSelected
    const startPositions: Record<string, { x: number; y: number }> = {};
    nextSelected.forEach(id => {
      const seat = findSeatById(id);
      if (seat) {
        const pos = tempLayout[id] || getSeatPixelPosition(seat, findSeatIndexById(id), currentWidth, currentHeight);
        startPositions[id] = { x: pos.x, y: pos.y };
      } else {
        const spacer = spacers.find(s => s.id === id);
        if (spacer) {
          startPositions[id] = { x: spacer.x, y: spacer.y };
        }
      }
    });

    // We track drag starting mouse position
    const startMouseX = e.clientX;
    const startMouseY = e.clientY;
    let didDrag = false;
    
    const handlePointerMove = (moveEvent: PointerEvent) => {
      didDrag = true;
      const deltaX = moveEvent.clientX - startMouseX;
      const deltaY = moveEvent.clientY - startMouseY;
      
      // Get current canvas size
      const currentWidth = visualizerWidths[roomId] || roomObj?.canvasWidth || 1000;
      const currentHeight = visualizerHeights[roomId] || roomObj?.canvasHeight || 450;
      
      // Auto-expand canvas if dragging near/past bounds
      let nextWidth = currentWidth;
      let nextHeight = currentHeight;

      // Calculate candidate positions to see if we expand the canvas
      nextSelected.forEach(id => {
        if (startPositions[id]) {
          const leftPx = startPositions[id].x + deltaX;
          const topPx = startPositions[id].y + deltaY;
          
          let w = 80;
          let h = 80;
          const spacer = spacers.find(s => s.id === id);
          if (spacer) {
            w = spacer.w || 78;
            h = spacer.h || 78;
          }
          
          if (leftPx + w + 40 > nextWidth) {
            nextWidth = leftPx + w + 120;
          }
          if (topPx + h + 40 > nextHeight) {
            nextHeight = topPx + h + 120;
          }
        }
      });
      
      if (nextWidth !== currentWidth) {
        setVisualizerWidths(prev => ({ ...prev, [roomId]: nextWidth }));
      }
      if (nextHeight !== currentHeight) {
        setVisualizerHeights(prev => ({ ...prev, [roomId]: nextHeight }));
      }

      const snapPx = 15;
      
      // Also update spacers in-place so resolveCollisions has the new spacer positions!
      let updatedSpacers = [...spacers];
      let spacersChanged = false;
      
      updatedSpacers = spacers.map(sp => {
        if (nextSelected.includes(sp.id) && startPositions[sp.id]) {
          spacersChanged = true;
          let leftPx = startPositions[sp.id].x + deltaX;
          let topPx = startPositions[sp.id].y + deltaY;
          
          leftPx = Math.max(0, Math.min(nextWidth - (sp.w || 78), leftPx));
          topPx = Math.max(60, Math.min(nextHeight - (sp.h || 78), topPx));
          
          leftPx = Math.round(leftPx / snapPx) * snapPx;
          topPx = Math.round(topPx / snapPx) * snapPx;
          
          return { ...sp, x: leftPx, y: topPx };
        }
        return sp;
      });

      if (spacersChanged) {
        setSpacers(updatedSpacers);
      }

      setTempLayout(prev => {
        const nextLayout = { ...prev };
        nextSelected.forEach(id => {
          if (startPositions[id] && findSeatById(id)) {
            let leftPx = startPositions[id].x + deltaX;
            let topPx = startPositions[id].y + deltaY;

            // Bound checking (minimum 60, maximum canvas bounds minus seat size)
            leftPx = Math.max(0, Math.min(nextWidth - 80, leftPx));
            topPx = Math.max(60, Math.min(nextHeight - 80, topPx));
            
            // Grid snapping in pixels (snap to 15px)
            leftPx = Math.round(leftPx / snapPx) * snapPx;
            topPx = Math.round(topPx / snapPx) * snapPx;

            nextLayout[id] = {
              ...nextLayout[id],
              x: leftPx,
              y: topPx
            };
          }
        });
        return resolveCollisions(nextLayout, updatedSpacers, roomObj);
      });
      
      // Auto-scrolling the viewport
      if (scrollContainer) {
        const scrollRect = scrollContainer.getBoundingClientRect();
        const rightDiff = moveEvent.clientX - scrollRect.right;
        const leftDiff = moveEvent.clientX - scrollRect.left;
        const bottomDiff = moveEvent.clientY - scrollRect.bottom;
        const topDiff = moveEvent.clientY - scrollRect.top;
        
        if (rightDiff > -60) {
          scrollContainer.scrollLeft += 15;
        } else if (leftDiff < 60) {
          scrollContainer.scrollLeft -= 15;
        }
        
        if (bottomDiff > -60) {
          scrollContainer.scrollTop += 15;
        } else if (topDiff < 60) {
          scrollContainer.scrollTop -= 15;
        }
      }
    };
    
    const handlePointerUp = (upEvent: PointerEvent) => {
      element.releasePointerCapture(upEvent.pointerId);
      element.removeEventListener('pointermove', handlePointerMove);
      element.removeEventListener('pointerup', handlePointerUp);

      // If they clicked without dragging and did not use modifier key, select only this seat
      if (!didDrag && !isModifierPressed) {
        setSelectedArrangeIds([seatId]);
      }

      if (didDrag) {
        setLayoutHistory(prev => [...prev, snapshot]);
      }
    };
    
    element.addEventListener('pointermove', handlePointerMove);
    element.addEventListener('pointerup', handlePointerUp);
  };

  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activeRoomEditingId === null) return;
    
    // Only trigger if we clicked directly on the canvas background, not on a seat or spacer!
    if (e.target !== e.currentTarget) return;
    
    setShowSelectionMenu(false);
    e.preventDefault();
    const container = e.currentTarget;
    const rect = container.getBoundingClientRect();
    const startX = e.clientX - rect.left;
    const startY = e.clientY - rect.top;
    
    setDragSelectStart({ x: startX, y: startY });
    setDragSelectEnd({ x: startX, y: startY });

    const isModifier = e.shiftKey || e.ctrlKey || e.metaKey;
    const initialSelection = isModifier ? [...selectedArrangeIds] : [];
    
    container.setPointerCapture(e.pointerId);

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const currentRect = container.getBoundingClientRect();
      const currentX = Math.max(0, Math.min(currentRect.width, moveEvent.clientX - currentRect.left));
      const currentY = Math.max(0, Math.min(currentRect.height, moveEvent.clientY - currentRect.top));
      
      setDragSelectEnd({ x: currentX, y: currentY });

      // Determine bounding box of selection
      const boxX = Math.min(startX, currentX);
      const boxY = Math.min(startY, currentY);
      const boxW = Math.abs(startX - currentX);
      const boxH = Math.abs(startY - currentY);

      // Find which seats intersect this box
      const roomId = activeRoomEditingId;
      let roomObj: any = null;
      seatMap?.forEach((floor: any) => {
        floor.rooms?.forEach((rm: any) => {
          if (rm.id === roomId) {
            roomObj = rm;
          }
        });
      });

      if (!roomObj) return;
      const roomWidth = visualizerWidths[roomId] || roomObj.canvasWidth || 1000;
      const roomHeight = visualizerHeights[roomId] || roomObj.canvasHeight || 450;

      const intersectingIds: string[] = [];
      roomObj.seats?.forEach((seat: any, idx: number) => {
        const pos = getSeatPixelPosition(seat, idx, roomWidth, roomHeight);
        const seatW = 78;
        const seatH = 78;

        // Check AABB intersection
        const overlapX = Math.max(0, Math.min(pos.x + seatW, boxX + boxW) - Math.max(pos.x, boxX));
        const overlapY = Math.max(0, Math.min(pos.y + seatH, boxY + boxH) - Math.max(pos.y, boxY));

        if (overlapX > 0 && overlapY > 0) {
          intersectingIds.push(seat.id);
        }
      });

      // Check intersection with desk spacers
      spacers.forEach((sp) => {
        if (sp.type === 'desk') {
          const spW = sp.w || 78;
          const spH = sp.h || 78;
          const overlapX = Math.max(0, Math.min(sp.x + spW, boxX + boxW) - Math.max(sp.x, boxX));
          const overlapY = Math.max(0, Math.min(sp.y + spH, boxY + boxH) - Math.max(sp.y, boxY));

          if (overlapX > 0 && overlapY > 0) {
            intersectingIds.push(sp.id);
          }
        }
      });

      // Update selected seats
      if (isModifier) {
        const union = new Set([...initialSelection, ...intersectingIds]);
        setSelectedArrangeIds(Array.from(union));
      } else {
        setSelectedArrangeIds(intersectingIds);
      }
    };

    const handlePointerUp = (upEvent: PointerEvent) => {
      container.releasePointerCapture(upEvent.pointerId);
      container.removeEventListener('pointermove', handlePointerMove);
      container.removeEventListener('pointerup', handlePointerUp);
      
      setDragSelectStart(null);
      setDragSelectEnd(null);
    };

    container.addEventListener('pointermove', handlePointerMove);
    container.addEventListener('pointerup', handlePointerUp);
  };

  const alignSelectedSeats = (direction: 'horizontal' | 'vertical') => {
    if (selectedArrangeIds.length === 0 || activeRoomEditingId === null) return;
    pushToHistory();
    const roomId = activeRoomEditingId;

    // Lookup room defaults if visualizer state not initialized
    let roomObj: any = null;
    seatMap?.forEach((floor: any) => {
      floor.rooms?.forEach((rm: any) => {
        if (rm.id === roomId) {
          roomObj = rm;
        }
      });
    });
    if (!roomObj) return;

    const roomWidth = visualizerWidths[roomId] || roomObj.canvasWidth || 1000;
    const roomHeight = visualizerHeights[roomId] || roomObj.canvasHeight || 450;

    const findSeatById = (id: string) => roomObj?.seats?.find((s: any) => s.id === id);
    const findSeatIndexById = (id: string) => roomObj?.seats?.findIndex((s: any) => s.id === id) ?? 0;

    // Get selected seats positions
    const selectedSeats = selectedArrangeIds
      .map(id => {
        const seat = findSeatById(id);
        if (!seat) return null;
        const pos = tempLayout[id] || getSeatPixelPosition(seat, findSeatIndexById(id), roomWidth, roomHeight);
        return { id, x: pos.x, y: pos.y, seat };
      })
      .filter(Boolean) as Array<{ id: string; x: number; y: number; seat: any }>;

    if (selectedSeats.length === 0) return;

    if (direction === 'horizontal') {
      // Sort from left to right (by X coordinate)
      selectedSeats.sort((a, b) => a.x - b.x);

      // Anchor is the position of the leftmost seat
      const anchorX = selectedSeats[0].x;
      const anchorY = selectedSeats[0].y;
      const seatCollisionSize = 90; // 78px + 12px gap

      setTempLayout(prev => {
        const nextLayout = { ...prev };
        selectedSeats.forEach((item, index) => {
          let targetX = anchorX + index * seatCollisionSize;
          let targetY = anchorY;

          // Clamp
          targetX = Math.max(0, Math.min(roomWidth - 78, targetX));
          targetY = Math.max(60, Math.min(roomHeight - 78, targetY));

          nextLayout[item.id] = {
            ...nextLayout[item.id],
            x: targetX,
            y: targetY
          };
        });
        return resolveCollisions(nextLayout, spacers, roomObj);
      });
    } else {
      // Sort from top to bottom (by Y coordinate)
      selectedSeats.sort((a, b) => a.y - b.y);

      // Anchor is the position of the topmost seat
      const anchorX = selectedSeats[0].x;
      const anchorY = selectedSeats[0].y;
      const seatCollisionSize = 90; // 78px + 12px gap

      setTempLayout(prev => {
        const nextLayout = { ...prev };
        selectedSeats.forEach((item, index) => {
          let targetX = anchorX;
          let targetY = anchorY + index * seatCollisionSize;

          // Clamp
          targetX = Math.max(0, Math.min(roomWidth - 78, targetX));
          targetY = Math.max(60, Math.min(roomHeight - 78, targetY));

          nextLayout[item.id] = {
            ...nextLayout[item.id],
            x: targetX,
            y: targetY
          };
        });
        return resolveCollisions(nextLayout, spacers, roomObj);
      });
    }

    setShowSelectionMenu(false);
  };

  const alignStraight = (axis: 'horizontal' | 'vertical') => {
    if (selectedArrangeIds.length === 0 || activeRoomEditingId === null) return;
    pushToHistory();
    const roomId = activeRoomEditingId;

    // Lookup room defaults
    let roomObj: any = null;
    seatMap?.forEach((floor: any) => {
      floor.rooms?.forEach((rm: any) => {
        if (rm.id === roomId) {
          roomObj = rm;
        }
      });
    });
    if (!roomObj) return;

    const roomWidth = visualizerWidths[roomId] || roomObj.canvasWidth || 1000;
    const roomHeight = visualizerHeights[roomId] || roomObj.canvasHeight || 450;

    const findSeatById = (id: string) => roomObj?.seats?.find((s: any) => s.id === id);
    const findSeatIndexById = (id: string) => roomObj?.seats?.findIndex((s: any) => s.id === id) ?? 0;

    const selectedSeats = selectedArrangeIds
      .map(id => {
        const seat = findSeatById(id);
        if (!seat) return null;
        const pos = tempLayout[id] || getSeatPixelPosition(seat, findSeatIndexById(id), roomWidth, roomHeight);
        return { id, x: pos.x, y: pos.y };
      })
      .filter(Boolean) as Array<{ id: string; x: number; y: number }>;

    if (selectedSeats.length === 0) return;

    if (axis === 'horizontal') {
      const anchorY = selectedSeats[0].y;

      setTempLayout(prev => {
        const nextLayout = { ...prev };
        selectedSeats.forEach(item => {
          nextLayout[item.id] = {
            ...nextLayout[item.id],
            y: anchorY
          };
        });
        return resolveCollisions(nextLayout, spacers, roomObj);
      });
    } else {
      const anchorX = selectedSeats[0].x;

      setTempLayout(prev => {
        const nextLayout = { ...prev };
        selectedSeats.forEach(item => {
          nextLayout[item.id] = {
            ...nextLayout[item.id],
            x: anchorX
          };
        });
        return resolveCollisions(nextLayout, spacers, roomObj);
      });
    }

    setShowSelectionMenu(false);
  };

  const rotateSelectedSeats = () => {
    if (selectedArrangeIds.length === 0 || activeRoomEditingId === null) return;
    pushToHistory();
    const roomId = activeRoomEditingId;

    // Lookup room defaults
    let roomObj: any = null;
    seatMap?.forEach((floor: any) => {
      floor.rooms?.forEach((rm: any) => {
        if (rm.id === roomId) {
          roomObj = rm;
        }
      });
    });
    if (!roomObj) return;

    setTempLayout(prev => {
      const nextLayout = { ...prev };
      selectedArrangeIds.forEach(id => {
        const seat = roomObj?.seats?.find((s: any) => s.id === id);
        if (seat) {
          const currentSeatLayout = nextLayout[id] || { x: 0, y: 0 };
          const currentRotation = currentSeatLayout.rotation !== undefined ? currentSeatLayout.rotation : (seat.rotation || 0);
          const nextRotation = (currentRotation + 90) % 360;
          nextLayout[id] = {
            ...currentSeatLayout,
            rotation: nextRotation
          };
        }
      });
      return nextLayout;
    });

    setShowSelectionMenu(false);
  };

  const handleSeatNumberSwap = (sourceSeatId: string, targetNumber: string) => {
    setEditingSeatId(null);
    const trimmedNumber = targetNumber.trim();
    if (!trimmedNumber) return;

    const roomId = activeRoomEditingId;
    if (!roomId) return;

    pushToHistory();

    let roomObj: any = null;
    seatMap?.forEach((floor: any) => {
      floor.rooms?.forEach((rm: any) => {
        if (rm.id === roomId) {
          roomObj = rm;
        }
      });
    });
    if (!roomObj) return;

    const sourceSeat = roomObj.seats?.find((s: any) => s.id === sourceSeatId);
    if (!sourceSeat) return;

    if (sourceSeat.number === trimmedNumber) return;

    const targetSeat = roomObj.seats?.find((s: any) => s.number.toLowerCase() === trimmedNumber.toLowerCase());

    if (!targetSeat) {
      showToast(`Seat number "${trimmedNumber}" not found in this room!`, 'error');
      return;
    }

    const roomWidth = visualizerWidths[roomId] || roomObj.canvasWidth || 1000;
    const roomHeight = visualizerHeights[roomId] || roomObj.canvasHeight || 450;

    const sourceIdx = roomObj.seats.indexOf(sourceSeat);
    const targetIdx = roomObj.seats.indexOf(targetSeat);

    const sourcePos = tempLayout[sourceSeat.id] || getSeatPixelPosition(sourceSeat, sourceIdx, roomWidth, roomHeight);
    const targetPos = tempLayout[targetSeat.id] || getSeatPixelPosition(targetSeat, targetIdx, roomWidth, roomHeight);

    setTempLayout(prev => {
      const nextLayout = {
        ...prev,
        [sourceSeat.id]: {
          ...prev[sourceSeat.id],
          x: targetPos.x,
          y: targetPos.y
        },
        [targetSeat.id]: {
          ...prev[targetSeat.id],
          x: sourcePos.x,
          y: sourcePos.y
        }
      };
      return resolveCollisions(nextLayout, spacers, roomObj);
    });

    showToast(`Swapped positions of Seat ${sourceSeat.number} and Seat ${targetSeat.number}!`, 'success');
  };

  const handleResizePointerDown = (e: React.PointerEvent<HTMLDivElement>, spacerId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const handleElement = e.currentTarget;
    handleElement.setPointerCapture(e.pointerId);
    
    const spacerElement = handleElement.parentElement;
    if (!spacerElement) return;
    
    const startRect = spacerElement.getBoundingClientRect();
    const startWidth = startRect.width;
    const startHeight = startRect.height;
    const startX = e.clientX;
    const startY = e.clientY;

    // Take snapshot for undo
    const snapshot = {
      tempLayout: JSON.parse(JSON.stringify(tempLayout)),
      spacers: JSON.parse(JSON.stringify(spacers)),
      visualizerWidths: { ...visualizerWidths },
      visualizerHeights: { ...visualizerHeights }
    };
    let didDrag = false;
    
    const handlePointerMove = (moveEvent: PointerEvent) => {
      didDrag = true;
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      
      let newWidth = startWidth + deltaX;
      let newHeight = startHeight + deltaY;
      
      const snapPx = 15;
      newWidth = Math.round(Math.max(45, newWidth) / snapPx) * snapPx;
      newHeight = Math.round(Math.max(45, newHeight) / snapPx) * snapPx;
      
      // Find the active room object to resolve collisions against
      let roomObj: any = null;
      if (activeRoomEditingId) {
        seatMap?.forEach((floor: any) => {
          floor.rooms?.forEach((rm: any) => {
            if (rm.id === activeRoomEditingId) {
              roomObj = rm;
            }
          });
        });
      }
      
      setSpacers(prev => {
        const nextSpacers = prev.map(s => s.id === spacerId ? { ...s, w: newWidth, h: newHeight } : s);
        if (roomObj) {
          setTempLayout(currentTemp => resolveCollisions(currentTemp, nextSpacers, roomObj));
        }
        return nextSpacers;
      });
    };
    
    const handlePointerUp = (upEvent: PointerEvent) => {
      handleElement.releasePointerCapture(upEvent.pointerId);
      handleElement.removeEventListener('pointermove', handlePointerMove);
      handleElement.removeEventListener('pointerup', handlePointerUp);

      if (didDrag) {
        setLayoutHistory(prev => [...prev, snapshot]);
      }
    };
    
    handleElement.addEventListener('pointermove', handlePointerMove);
    handleElement.addEventListener('pointerup', handlePointerUp);
  };

  const handleSpacerPointerDown = (e: React.PointerEvent<HTMLDivElement>, spacerId: string) => {
    if (activeRoomEditingId === null) return;
    const roomId = activeRoomEditingId;
    e.preventDefault();

    // Take snapshot for undo
    const snapshot = {
      tempLayout: JSON.parse(JSON.stringify(tempLayout)),
      spacers: JSON.parse(JSON.stringify(spacers)),
      visualizerWidths: { ...visualizerWidths },
      visualizerHeights: { ...visualizerHeights }
    };

    const element = e.currentTarget;
    element.setPointerCapture(e.pointerId);
    
    const container = element.parentElement;
    if (!container) return;
    
    const scrollContainer = container.parentElement;
    
    let roomObj: any = null;
    seatMap?.forEach((floor: any) => {
      floor.rooms?.forEach((rm: any) => {
        if (rm.id === roomId) {
          roomObj = rm;
        }
      });
    });

    const currentWidth = visualizerWidths[roomId] || roomObj?.canvasWidth || 1000;
    const currentHeight = visualizerHeights[roomId] || roomObj?.canvasHeight || 450;

    const findSeatById = (id: string) => roomObj?.seats?.find((s: any) => s.id === id);
    const findSeatIndexById = (id: string) => roomObj?.seats?.findIndex((s: any) => s.id === id) ?? 0;

    // Determine selection list
    let nextSelected = [...selectedArrangeIds];
    const isModifierPressed = e.shiftKey || e.ctrlKey || e.metaKey;
    const isAlreadySelected = nextSelected.includes(spacerId);

    if (isModifierPressed) {
      if (isAlreadySelected) {
        nextSelected = nextSelected.filter(id => id !== spacerId);
      } else {
        nextSelected.push(spacerId);
      }
    } else {
      if (!isAlreadySelected) {
        nextSelected = [spacerId];
      }
    }
    setSelectedArrangeIds(nextSelected);

    // Record starting coordinates of all elements in nextSelected
    const startPositions: Record<string, { x: number; y: number }> = {};
    nextSelected.forEach(id => {
      const seat = findSeatById(id);
      if (seat) {
        const pos = tempLayout[id] || getSeatPixelPosition(seat, findSeatIndexById(id), currentWidth, currentHeight);
        startPositions[id] = { x: pos.x, y: pos.y };
      } else {
        const spacer = spacers.find(s => s.id === id);
        if (spacer) {
          startPositions[id] = { x: spacer.x, y: spacer.y };
        }
      }
    });

    // We track drag starting mouse position
    const startMouseX = e.clientX;
    const startMouseY = e.clientY;
    let didDrag = false;
    
    const handlePointerMove = (moveEvent: PointerEvent) => {
      didDrag = true;
      const deltaX = moveEvent.clientX - startMouseX;
      const deltaY = moveEvent.clientY - startMouseY;
      
      const currentWidth = visualizerWidths[roomId] || roomObj?.canvasWidth || 1000;
      const currentHeight = visualizerHeights[roomId] || roomObj?.canvasHeight || 450;
      
      let nextWidth = currentWidth;
      let nextHeight = currentHeight;

      // Calculate candidate bounds to see if we expand the canvas
      nextSelected.forEach(id => {
        if (startPositions[id]) {
          const leftPx = startPositions[id].x + deltaX;
          const topPx = startPositions[id].y + deltaY;
          
          let w = 80;
          let h = 80;
          const spacer = spacers.find(s => s.id === id);
          if (spacer) {
            w = spacer.w || 78;
            h = spacer.h || 78;
          }
          
          if (leftPx + w + 40 > nextWidth) {
            nextWidth = leftPx + w + 120;
          }
          if (topPx + h + 40 > nextHeight) {
            nextHeight = topPx + h + 120;
          }
        }
      });
      
      if (nextWidth !== currentWidth) {
        setVisualizerWidths(prev => ({ ...prev, [roomId]: nextWidth }));
      }
      if (nextHeight !== currentHeight) {
        setVisualizerHeights(prev => ({ ...prev, [roomId]: nextHeight }));
      }

      const snapPx = 15;
      
      // Update spacers in-place
      let updatedSpacers = [...spacers];
      let spacersChanged = false;
      
      updatedSpacers = spacers.map(sp => {
        if (nextSelected.includes(sp.id) && startPositions[sp.id]) {
          spacersChanged = true;
          let leftPx = startPositions[sp.id].x + deltaX;
          let topPx = startPositions[sp.id].y + deltaY;
          
          leftPx = Math.max(0, Math.min(nextWidth - (sp.w || 78), leftPx));
          topPx = Math.max(60, Math.min(nextHeight - (sp.h || 78), topPx));
          
          leftPx = Math.round(leftPx / snapPx) * snapPx;
          topPx = Math.round(topPx / snapPx) * snapPx;
          
          return { ...sp, x: leftPx, y: topPx };
        }
        return sp;
      });

      if (spacersChanged) {
        setSpacers(updatedSpacers);
      }

      setTempLayout(prev => {
        const nextLayout = { ...prev };
        nextSelected.forEach(id => {
          if (startPositions[id] && findSeatById(id)) {
            let leftPx = startPositions[id].x + deltaX;
            let topPx = startPositions[id].y + deltaY;

            leftPx = Math.max(0, Math.min(nextWidth - 80, leftPx));
            topPx = Math.max(60, Math.min(nextHeight - 80, topPx));
            
            leftPx = Math.round(leftPx / snapPx) * snapPx;
            topPx = Math.round(topPx / snapPx) * snapPx;

            nextLayout[id] = {
              ...nextLayout[id],
              x: leftPx,
              y: topPx
            };
          }
        });
        return resolveCollisions(nextLayout, updatedSpacers, roomObj);
      });
      
      if (scrollContainer) {
        const scrollRect = scrollContainer.getBoundingClientRect();
        const rightDiff = moveEvent.clientX - scrollRect.right;
        const leftDiff = moveEvent.clientX - scrollRect.left;
        const bottomDiff = moveEvent.clientY - scrollRect.bottom;
        const topDiff = moveEvent.clientY - scrollRect.top;
        
        if (rightDiff > -60) {
          scrollContainer.scrollLeft += 15;
        } else if (leftDiff < 60) {
          scrollContainer.scrollLeft -= 15;
        }
        
        if (bottomDiff > -60) {
          scrollContainer.scrollTop += 15;
        } else if (topDiff < 60) {
          scrollContainer.scrollTop -= 15;
        }
      }
    };
    
    const handlePointerUp = (upEvent: PointerEvent) => {
      element.releasePointerCapture(upEvent.pointerId);
      element.removeEventListener('pointermove', handlePointerMove);
      element.removeEventListener('pointerup', handlePointerUp);

      if (didDrag) {
        setLayoutHistory(prev => [...prev, snapshot]);
      }
    };
    
    element.addEventListener('pointermove', handlePointerMove);
    element.addEventListener('pointerup', handlePointerUp);
  };

  const handleArrangeAscending = (room: any) => {
    pushToHistory();
    const sortedSeats = [...(room.seats || [])].sort((a: any, b: any) =>
      a.number.localeCompare(b.number, undefined, { numeric: true, sensitivity: 'base' })
    );
    const cols = 10;
    const newLayout = { ...tempLayout };
    sortedSeats.forEach((seat: any, index: number) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      newLayout[seat.id] = {
        x: col * 95 + 40,
        y: row * 110 + 70
      };
    });
    setTempLayout(newLayout);
  };

  const handleSaveLayout = async (room: any) => {
    const rWidth = visualizerWidths[room.id] || room.canvasWidth || 1000;
    const rHeight = visualizerHeights[room.id] || room.canvasHeight || 450;
    
    // Find the bounding box of the seats in pixels
    let maxX = 0;
    let maxY = 0;
    
    const seatPixels = room.seats.map((seat: any, idx: number) => {
      const pos = getSeatPixelPosition(seat, idx, rWidth, rHeight);
      if (pos.x > maxX) maxX = pos.x;
      if (pos.y > maxY) maxY = pos.y;
      const rotation = tempLayout[seat.id]?.rotation !== undefined ? tempLayout[seat.id].rotation : (seat.rotation || 0);
      return { id: seat.id, x: pos.x, y: pos.y, rotation };
    });
    
    // Calculate trimmed bounds
    // Seat width is 80px, height is 80px. We want some margin (e.g. 120px)
    const padding = 120;
    const trimmedWidth = Math.max(800, maxX + padding);
    const trimmedHeight = Math.max(450, maxY + padding);
    
    // Normalize coordinates to percentages of trimmed bounds
    const layoutPayload = seatPixels.map((sp: any) => {
      const xPct = Math.max(0, Math.min(95, (sp.x / trimmedWidth) * 100));
      const yPct = Math.max(0, Math.min(95, (sp.y / trimmedHeight) * 100));
      return { id: sp.id, x: xPct, y: yPct, rotation: sp.rotation };
    });

    try {
      await updateSeatLayout({
        roomId: room.id,
        layout: layoutPayload,
        canvasWidth: trimmedWidth,
        canvasHeight: trimmedHeight,
        spacers: spacers
      }).unwrap();
      
      showToast('Seat positions and canvas bounds saved successfully!', 'success');
      setActiveRoomEditingId(null);
      setTempLayout({});
      setSelectedArrangeIds([]);
      setSpacers([]);
      setLayoutHistory([]);
      
      // Update local state to trimmed dimensions
      setVisualizerWidths(prev => ({ ...prev, [room.id]: trimmedWidth }));
      setVisualizerHeights(prev => ({ ...prev, [room.id]: trimmedHeight }));
    } catch (err: any) {
      showToast(err.data?.message || 'Failed to save seat layout', 'error');
    }
  };

  // Branch defaulting
  useEffect(() => {
    if (branches && branches.length > 0 && !selectedBranch) {
      setSelectedBranch(branches[0].id);
    }
  }, [branches, selectedBranch]);

  // Statistics summaries
  const seatCounts = useMemo(() => {
    if (!seatMap) return { available: 0, occupied: 0, maintenance: 0, total: 0 };
    let available = 0, occupied = 0, maintenance = 0;
    seatMap.forEach((floor: any) => {
      floor.rooms?.forEach((room: any) => {
        room.seats?.forEach((seat: any) => {
          const { isOccupied, isExpired } = getSeatStatusInfo(seat);
          if (seat.status === 'BLOCKED') maintenance++;
          else if (isOccupied) occupied++;
          else available++;
        });
      });
    });
    return { available, occupied, maintenance, total: available + occupied + maintenance };
  }, [seatMap]);

  // Expiring seats listing for notifications popover
  const expiringSeatsList = useMemo(() => {
    if (!seatMap) return [];
    const list: any[] = [];
    seatMap.forEach((floor: any) => {
      floor.rooms?.forEach((room: any) => {
        room.seats?.forEach((seat: any) => {
          if (seat.status === 'OCCUPIED') {
            const activeAlloc = seat.allocations?.find((a: any) => a.isActive);
            if (activeAlloc?.endDate) {
              const end = new Date(activeAlloc.endDate);
              const today = new Date();
              end.setHours(0, 0, 0, 0);
              today.setHours(0, 0, 0, 0);
              const diffDays = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              if (diffDays >= 0 && diffDays <= 7) {
                list.push({
                  seatId: seat.id,
                  seatNumber: seat.number,
                  studentName: activeAlloc.studentProfile?.user?.name,
                  daysLeft: diffDays,
                  roomName: room.name,
                  floorName: floor.name
                });
              }
            }
          }
        });
      });
    });
    return list.sort((a, b) => a.daysLeft - b.daysLeft);
  }, [seatMap]);

  // Global search highlighting and auto-scroll logic
  useEffect(() => {
    const query = globalSearchQuery.trim().toLowerCase();
    if (query && seatMap) {
      let matchedSeat: any = null;
      for (const floor of seatMap) {
        for (const room of floor.rooms) {
          for (const seat of room.seats) {
            const activeAlloc = seat.allocations?.find((a: any) => a.isActive);
            const isOccupied = seat.status === 'OCCUPIED';
            const match = seat.number.toLowerCase().includes(query) ||
              (isOccupied && activeAlloc?.studentProfile?.user?.name?.toLowerCase().includes(query));
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
        // Automatically expand the room card containing this seat
        const targetRoom = seatMap[activeFloorTab]?.rooms?.find((r: any) => 
          r.seats?.some((s: any) => s.id === matchedSeat.id)
        );
        if (targetRoom) {
          setCollapsedRooms(prev => ({ ...prev, [targetRoom.id]: false }));
        }
      }
    } else {
      setHighlightedSeatId(null);
    }
  }, [globalSearchQuery, seatMap, activeFloorTab]);

  useEffect(() => {
    if (highlightedSeatId) {
      const element = document.getElementById(`seat-${highlightedSeatId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [highlightedSeatId]);

  // Student list search inside Allocate form
  const filteredStudents = useMemo(() => {
    if (!studentsData?.students) return [];
    const query = studentSearchQuery.trim().toLowerCase();

    // Gather set of student profile IDs who already have active allocations
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
      // Exclude if already allocated to any seat
      if (allocatedIds.has(student.id)) return false;

      if (!query) return true;
      return (
        student.user?.name?.toLowerCase().includes(query) ||
        student.user?.mobile?.includes(query) ||
        student.user?.email?.toLowerCase().includes(query)
      );
    });
  }, [studentsData, studentSearchQuery, seatMap]);

  const displayedStudents = useMemo(() => {
    return filteredStudents.slice(0, 8);
  }, [filteredStudents]);

  // Modal Student filtering autocomplete
  const filteredModalStudents = useMemo(() => {
    if (!studentsData?.students) return [];
    if (!allocModalSearchQuery.trim()) return [];
    const query = allocModalSearchQuery.toLowerCase();
    return studentsData.students.filter((st: any) => {
      return (
        st.user?.name?.toLowerCase().includes(query) ||
        st.user?.email?.toLowerCase().includes(query) ||
        st.user?.mobile?.includes(query)
      );
    });
  }, [studentsData, allocModalSearchQuery]);

  const displayedModalStudents = useMemo(() => {
    return filteredModalStudents.slice(0, 8);
  }, [filteredModalStudents]);

  // DO NOT show the shifts already booked for this seat
  const availableShiftsForModal = useMemo(() => {
    if (!shifts || !selectedSeat) return [];
    const activeAllocations = selectedSeat.allocations?.filter((a: any) => a.isActive) || [];
    const occupiedShiftIds = activeAllocations.map((a: any) => a.shiftId);
    return shifts.filter((s: any) => !occupiedShiftIds.includes(s.id));
  }, [shifts, selectedSeat]);

  // Modal allocate duration calculations
  useEffect(() => {
    if (allocModalDuration === 'flex') return;
    if (allocModalStartDate && typeof allocModalDuration === 'number') {
      const date = new Date(allocModalStartDate);
      if (!isNaN(date.getTime())) {
        date.setMonth(date.getMonth() + allocModalDuration);
        setAllocModalEndDate(date.toISOString().split('T')[0]);
      }
    }
  }, [allocModalStartDate, allocModalDuration]);

  // Modal allocate amount calculations
  const calculatedModalBaseAmount = useMemo(() => {
    if (!allocModalShiftId || !shifts) return 0;
    const shift = shifts.find((s: any) => s.id === allocModalShiftId);
    if (!shift) return 0;

    const basePrice = shift.price || 0;
    if (typeof allocModalDuration === 'number') {
      if (allocModalDuration === 3 && shift.price3Months) {
        return shift.price3Months;
      }
      if (allocModalDuration === 6 && shift.price6Months) {
        return shift.price6Months;
      }
      return basePrice * allocModalDuration;
    } else if (allocModalDuration === 'flex' && allocModalStartDate && allocModalEndDate) {
      const start = new Date(allocModalStartDate);
      const end = new Date(allocModalEndDate);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        const diffTime = end.getTime() - start.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 0) {
          return Math.round(basePrice * (diffDays / 30));
        }
      }
    }
    return basePrice;
  }, [allocModalShiftId, shifts, allocModalDuration, allocModalStartDate, allocModalEndDate]);

  useEffect(() => {
    if (calculatedModalBaseAmount > 0) {
      setAllocModalAmount(calculatedModalBaseAmount.toString());
    } else {
      setAllocModalAmount('');
    }
  }, [calculatedModalBaseAmount]);

  // Submit Allocate Seat Modal (Popup)
  const handleModalAllocate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSeat) return;
    try {
      await allocateSeat({
        studentProfileId: allocModalStudentId,
        seatId: selectedSeat.id,
        shiftId: allocModalShiftId,
        startDate: allocModalStartDate,
        endDate: allocModalEndDate,
      }).unwrap();

      if (allocModalGenerateInvoice) {
        const paymentResult = await createPayment({
          studentProfileId: allocModalStudentId,
          amount: Number(allocModalAmount),
          method: allocModalPaymentMethod,
          shiftId: allocModalShiftId || undefined,
          durationMonths: typeof allocModalDuration === 'number' ? allocModalDuration : 1,
        }).unwrap();

        const invoiceInfo = {
          payment: paymentResult.payment,
          student: studentsData?.students?.find((s: any) => s.id === allocModalStudentId),
          seatNumber: selectedSeat?.number,
          shift: shifts?.find((s: any) => s.id === allocModalShiftId),
          startDate: allocModalStartDate,
          endDate: allocModalEndDate,
          branchName: branches?.find((b: any) => b.id === selectedBranch)?.name,
          originalAmount: calculatedModalBaseAmount,
          payableAmount: Number(allocModalAmount),
        };
        setCreatedInvoiceData(invoiceInfo);
        setOpenAllocateModal(false);
        setIsDrawerOpen(false);
        setOpenInvoiceReceipt(true);
      } else {
        showToast('Seat allocated successfully!', 'success');
        setOpenAllocateModal(false);
        setIsDrawerOpen(false);
      }
    } catch (err: any) {
      showToast(err.data?.message || 'Seat allocation failed', 'error');
    }
  };

  // Handle seat clicks
  const handleSeatClick = (seat: any) => {
    setSelectedSeat(seat);
    setDrawerActiveSection('DETAILS');
    setIsDrawerOpen(true);
    setIsDetailsExpanded(false);

    if (seat.status === 'AVAILABLE') {
      const today = new Date().toISOString().split('T')[0];
      setStartDate(today);
      const end = new Date(today);
      end.setMonth(end.getMonth() + 1);
      setEndDate(end.toISOString().split('T')[0]);
      setStudentProfileId('');
      setStudentSearchQuery('');
      if (shifts && shifts.length > 0) {
        setShiftId(shifts[0].id);
      }
      setDurationMode(1);
      setShouldGenerateInvoice(true);
      setInvoiceAmount('');
      setPaymentMethod('CASH');
    } else if (seat.status === 'OCCUPIED') {
      const activeAllocations = seat.allocations?.filter((a: any) => a.isActive) || [];
      if (activeAllocations.length > 0) {
        setSelectedAllocationId(activeAllocations[0].id);
        const activeAllocation = activeAllocations[0];
        const nextDay = new Date(activeAllocation.endDate);
        nextDay.setDate(nextDay.getDate() + 1);
        setRenewStartDate(nextDay.toISOString().split('T')[0]);
        setRenewShiftId(activeAllocation.shiftId || '');
        setEditStartDate(activeAllocation.startDate ? activeAllocation.startDate.split('T')[0] : '');
        setEditEndDate(activeAllocation.endDate ? activeAllocation.endDate.split('T')[0] : '');
      } else {
        setSelectedAllocationId(null);
      }
      setIsEditingDates(false);
      setRenewEndDate('');
      setRenewAmount('');
      setRenewDuration(1);
      setRenewPaymentMethod('UPI');
    }
  };

  const handleOpenAllocateModal = () => {
    if (!selectedSeat) return;
    const today = new Date().toISOString().split('T')[0];
    setStartDate(today);
    const end = new Date(today);
    end.setMonth(end.getMonth() + 1);
    setEndDate(end.toISOString().split('T')[0]);
    setStudentProfileId('');
    setStudentSearchQuery('');
    
    // Find active allocations to get booked shifts
    const activeAllocations = selectedSeat.allocations?.filter((a: any) => a.isActive) || [];
    const bookedShiftIds = activeAllocations.map((a: any) => a.shiftId || a.shift?.id);
    
    // Filter available shifts
    const availableShifts = shifts?.filter((s: any) => !bookedShiftIds.includes(s.id)) || [];
    
    if (availableShifts.length > 0) {
      setShiftId(availableShifts[0].id);
    } else {
      setShiftId('');
    }
    setDurationMode(1);
    setShouldGenerateInvoice(true);
    setInvoiceAmount('');
    setPaymentMethod('CASH');
    setOpenAllocateModal(true);
  };

  // Sync dates and renew states when selected allocation changes
  useEffect(() => {
    if (selectedSeat && selectedAllocationId) {
      const alloc = selectedSeat.allocations?.find((a: any) => a.id === selectedAllocationId);
      if (alloc) {
        const nextDay = new Date(alloc.endDate);
        nextDay.setDate(nextDay.getDate() + 1);
        setRenewStartDate(nextDay.toISOString().split('T')[0]);
        setRenewShiftId(alloc.shiftId || '');
        setEditStartDate(alloc.startDate ? alloc.startDate.split('T')[0] : '');
        setEditEndDate(alloc.endDate ? alloc.endDate.split('T')[0] : '');
      }
    }
  }, [selectedAllocationId, selectedSeat]);

  // Duration modes calculations
  useEffect(() => {
    if (durationMode === 'flex') return;
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

  const calculatedBaseAmount = useMemo(() => {
    if (!shiftId || !shifts) return 0;
    const shift = shifts.find((s: any) => s.id === shiftId);
    if (!shift) return 0;

    const basePrice = shift.price || 0;
    if (typeof durationMode === 'number') {
      if (durationMode === 3 && shift.price3Months) {
        return shift.price3Months;
      }
      if (durationMode === 6 && shift.price6Months) {
        return shift.price6Months;
      }
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

  useEffect(() => {
    if (renewShiftId && shifts) {
      const shift = shifts.find((s: any) => s.id === renewShiftId);
      if (shift && renewStartDate) {
        const start = new Date(renewStartDate);
        if (!isNaN(start.getTime())) {
          start.setMonth(start.getMonth() + renewDuration);
          setRenewEndDate(start.toISOString().split('T')[0]);
          
          let price = shift.price || 0;
          if (renewDuration === 3 && shift.price3Months) {
            price = shift.price3Months;
          } else if (renewDuration === 6 && shift.price6Months) {
            price = shift.price6Months;
          } else {
            price = price * renewDuration;
          }
          setRenewAmount(price.toString());
        }
      }
    }
  }, [renewShiftId, renewStartDate, renewDuration, shifts]);

  // Submit assign seat
  const handleAllocate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await allocateSeat({
        studentProfileId,
        seatId: selectedSeat.id,
        shiftId,
        startDate,
        endDate,
      }).unwrap();

      if (shouldGenerateInvoice) {
        const paymentResult = await createPayment({
          studentProfileId,
          amount: Number(invoiceAmount),
          method: paymentMethod,
          shiftId: shiftId || undefined,
          durationMonths: typeof durationMode === 'number' ? durationMode : undefined,
        }).unwrap();

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
        setIsDrawerOpen(false);
        setOpenAllocateModal(false);
        setOpenInvoiceReceipt(true);
      } else {
        showToast('Seat allocated successfully!', 'success');
        setIsDrawerOpen(false);
        setOpenAllocateModal(false);
      }
    } catch (err: any) {
      showToast(err.data?.message || 'Seat allocation failed', 'error');
    }
  };

  const handleAllocateModalSuccess = (invoiceInfo?: any) => {
    if (invoiceInfo) {
      setCreatedInvoiceData(invoiceInfo);
      setOpenInvoiceReceipt(true);
    }
    setOpenAllocateModal(false);
    setIsDrawerOpen(false);
  };

  // Submit vacate seat
  const handleVacateSeat = async () => {
    if (!selectedSeat || !selectedAllocationId) return;
    const activeAllocation = selectedSeat.allocations?.find((a: any) => a.id === selectedAllocationId);
    if (!activeAllocation) return;

    const confirmVacate = window.confirm(`Are you sure you want to vacate ${activeAllocation.studentProfile?.user?.name || 'this student'}?`);
    if (!confirmVacate) return;
    try {
      await vacateSeat({ id: selectedSeat.id, studentProfileId: activeAllocation.studentProfileId }).unwrap();
      setIsDrawerOpen(false);
      setSelectedSeat(null);
      showToast('Student vacated successfully!', 'success');
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



  // Submit Renewal
  const handleRenewSeat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSeat || !selectedAllocationId) return;
    const activeAllocation = selectedSeat.allocations?.find((a: any) => a.id === selectedAllocationId);
    if (!activeAllocation) return;

    setIsRenewing(true);
    try {
      await vacateSeat({ id: selectedSeat.id, studentProfileId: activeAllocation.studentProfileId }).unwrap();
      await allocateSeat({
        studentProfileId: activeAllocation.studentProfileId,
        seatId: selectedSeat.id,
        shiftId: renewShiftId,
        startDate: renewStartDate,
        endDate: renewEndDate,
      }).unwrap();

      const paymentResult = await createPayment({
        studentProfileId: activeAllocation.studentProfileId,
        amount: Number(renewAmount),
        method: renewPaymentMethod,
        shiftId: renewShiftId || undefined,
        durationMonths: renewDuration,
      }).unwrap();

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

      if (renewPaymentMethod === 'RAZORPAY' && paymentResult.razorpayOrder) {
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          showToast('Failed to load Razorpay SDK. Check internet connection.', 'error');
          setIsRenewing(false);
          return;
        }

        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_T9hh97PsK4bGuG',
          amount: paymentResult.razorpayOrder.amount,
          currency: paymentResult.razorpayOrder.currency,
          name: 'StudyFlow',
          description: `Seat ${selectedSeat.number} Renewal`,
          order_id: paymentResult.razorpayOrder.id,
          handler: async function (response: any) {
            try {
              const verifiedPayment = await verifyRazorpay({
                id: paymentResult.payment.id,
                transactionId: response.razorpay_payment_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              }).unwrap();

              showToast('Payment verified & seat renewed successfully!', 'success');
              setCreatedInvoiceData({
                ...invoiceInfo,
                payment: verifiedPayment,
              });
              setIsDrawerOpen(false);
              setOpenInvoiceReceipt(true);
            } catch (err: any) {
              showToast(err.data?.message || 'Payment verification failed', 'error');
            }
          },
          prefill: {
            name: activeAllocation.studentProfile?.user?.name || '',
            email: activeAllocation.studentProfile?.user?.email || '',
            contact: activeAllocation.studentProfile?.user?.mobile || '',
          },
          theme: {
            color: '#2563eb',
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } else {
        setCreatedInvoiceData(invoiceInfo);
        setIsDrawerOpen(false);
        setOpenInvoiceReceipt(true);
        showToast('Seat renewed successfully!', 'success');
      }
    } catch (err: any) {
      showToast(err?.data?.message || 'Seat renewal failed', 'error');
    } finally {
      setIsRenewing(false);
    }
  };

  // Creator handler (New Floor, Room, Seat)
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
    const confirmed = await showAlert('Are you sure you want to delete this floor and all its rooms and seats?', { type: 'danger' });
    if (!confirmed) return;
    try {
      await deleteFloor(id).unwrap();
      setActiveFloorTab(0);
      showToast('Floor deleted successfully!', 'success');
    } catch (err: any) {
      showToast(err.data?.message || 'Failed to delete floor', 'error');
    }
  };

  const handleDeleteRoom = async (id: string) => {
    const confirmed = await showAlert('Are you sure you want to delete this room and all its seats?', { type: 'danger' });
    if (!confirmed) return;
    try {
      await deleteRoom(id).unwrap();
      showToast('Room deleted successfully!', 'success');
    } catch (err: any) {
      showToast(err.data?.message || 'Failed to delete room', 'error');
    }
  };

  const handleDeleteSeat = async (id: string) => {
    const confirmed = window.confirm("Are you sure you want to delete this seat?");
    if (!confirmed) return;
    try {
      await deleteSeat(id).unwrap();
      setIsDrawerOpen(false);
      showToast('Seat deleted successfully!', 'success');
    } catch (err: any) {
      showToast(err.data?.message || 'Failed to delete seat', 'error');
    }
  };

  // Sorting & Filtering logic per room
  const getSortedSeats = (seats: any[], roomId: string) => {
    const roomFilter = statusFilters[roomId] || 'ALL';
    const roomSort = sortOptions[roomId] || 'NUMBER';

    // Search query per room
    const rSearch = (roomSearches[roomId] || '').trim().toLowerCase();

    let filtered = seats || [];
    
    // Apply search filter
    if (rSearch) {
      filtered = filtered.filter((seat: any) => {
        const isOccupied = seat.status === 'OCCUPIED';
        const activeAllocation = seat.allocations?.find((a: any) => a.isActive);
        return seat.number.toLowerCase().includes(rSearch) ||
          (isOccupied && (
            activeAllocation?.studentProfile?.user?.name?.toLowerCase().includes(rSearch) ||
            activeAllocation?.studentProfile?.user?.email?.toLowerCase().includes(rSearch) ||
            activeAllocation?.studentProfile?.user?.mobile?.includes(rSearch)
          ));
      });
    }

    // Apply status filter
    if (roomFilter !== 'ALL') {
      filtered = filtered.filter((s: any) => {
        const { isOccupied, isExpired } = getSeatStatusInfo(s);
        if (roomFilter === 'AVAILABLE') {
          return s.status === 'AVAILABLE' || isExpired;
        }
        if (roomFilter === 'OCCUPIED') {
          return isOccupied;
        }
        return s.status === roomFilter;
      });
    }

    // Apply Sorting
    return [...filtered].sort((a: any, b: any) => {
      if (roomSort === 'NUMBER') {
        return a.number.localeCompare(b.number, undefined, { numeric: true });
      }
      if (roomSort === 'NAME') {
        const aAlloc = a.allocations?.find((al: any) => al.isActive);
        const bAlloc = b.allocations?.find((al: any) => al.isActive);
        const aName = aAlloc?.studentProfile?.user?.name || '';
        const bName = bAlloc?.studentProfile?.user?.name || '';
        if (!aName && bName) return 1;
        if (aName && !bName) return -1;
        return aName.localeCompare(bName);
      }
      if (roomSort === 'RECENT') {
        const aAlloc = a.allocations?.find((al: any) => al.isActive);
        const bAlloc = b.allocations?.find((al: any) => al.isActive);
        const aTime = aAlloc ? new Date(aAlloc.createdAt).getTime() : 0;
        const bTime = bAlloc ? new Date(bAlloc.createdAt).getTime() : 0;
        return bTime - aTime;
      }
      return 0;
    });
  };

  const getSeatFaceStyle = (rotation: number) => {
    switch (rotation) {
      case 90:
        return {
          position: 'absolute' as const,
          top: 0,
          bottom: 0,
          right: 0,
          width: '5px',
          backgroundColor: '#2563eb',
          borderRadius: '0 8px 8px 0',
          zIndex: 5
        };
      case 180:
        return {
          position: 'absolute' as const,
          bottom: 0,
          left: 0,
          right: 0,
          height: '5px',
          backgroundColor: '#2563eb',
          borderRadius: '0 0 8px 8px',
          zIndex: 5
        };
      case 270:
        return {
          position: 'absolute' as const,
          top: 0,
          bottom: 0,
          left: 0,
          width: '5px',
          backgroundColor: '#2563eb',
          borderRadius: '8px 0 0 8px',
          zIndex: 5
        };
      case 0:
      default:
        return {
          position: 'absolute' as const,
          top: 0,
          left: 0,
          right: 0,
          height: '5px',
          backgroundColor: '#2563eb',
          borderRadius: '8px 8px 0 0',
          zIndex: 5
        };
    }
  };

  // Render Seat card helper
  const renderSeatCard = (seat: any, isFloorCanvas?: boolean, rotationVal?: number) => {
    const { isOccupied, isExpired, activeAllocations, currentAllocations, expiredAllocations } = getSeatStatusInfo(seat);

    let isExpiringSoon = false;
    let daysLeft = 99;
    let isCritical = false;
    
    currentAllocations.forEach((alloc: any) => {
      if (alloc.endDate) {
        const end = new Date(alloc.endDate);
        const today = new Date();
        end.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
        const diffTime = end.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays <= 7) {
          isExpiringSoon = true;
          if (diffDays < daysLeft) {
            daysLeft = diffDays;
          }
          if (diffDays <= 3) {
            isCritical = true;
          }
        }
      }
    });

    const isHighlighted = highlightedSeatId === seat.id;
    const seatClass = seat.status === 'BLOCKED' ? 'blocked' : seat.status === 'RESERVED' ? 'reserved' : isOccupied ? 'occupied' : 'available';

    const getShiftBadgeStyle = (shiftName: string) => {
      const name = shiftName.toLowerCase();
      if (name.includes('morning')) return { bg: '#e0f2fe', fg: '#0369a1', border: '#bae6fd', label: 'M' };
      if (name.includes('evening')) return { bg: '#ffedd5', fg: '#c2410c', border: '#fed7aa', label: 'E' };
      if (name.includes('night')) return { bg: '#faf5ff', fg: '#6b21a8', border: '#e9d5ff', label: 'N' };
      if (name.includes('afternoon')) return { bg: '#fef9c3', fg: '#854d0e', border: '#fef08a', label: 'A' };
      return { bg: '#f1f5f9', fg: '#475569', border: '#e2e8f0', label: shiftName.charAt(0).toUpperCase() };
    };

    return (
      <div
        key={seat.id}
        id={`seat-${seat.id}`}
        className={`seat-tile ${seatClass} seat-container-hover`}
        onClick={(e) => {
          if (activeRoomEditingId !== null) {
            e.stopPropagation();
            return;
          }
          handleSeatClick(seat);
        }}
        style={{
          width: '78px',
          height: '78px',
          border: isHighlighted ? '2px solid var(--accent-blue)' : undefined,
          boxShadow: isHighlighted ? '0 0 0 3px rgba(37, 99, 235, 0.25), var(--shadow-hover)' : undefined,
          transform: isHighlighted ? 'scale(1.05)' : undefined,
        }}
      >
        {isFloorCanvas && activeRoomEditingId !== null && (
          <button
            type="button"
            onPointerDown={(e) => {
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.stopPropagation();
              pushToHistory();
              setTempLayout(prev => {
                const currentSeatLayout = prev[seat.id] || { x: 0, y: 0 };
                const currentRotation = currentSeatLayout.rotation !== undefined ? currentSeatLayout.rotation : (seat.rotation || 0);
                const nextRotation = (currentRotation + 90) % 360;
                return {
                  ...prev,
                  [seat.id]: {
                    ...currentSeatLayout,
                    rotation: nextRotation
                  }
                };
              });
            }}
            style={{
              position: 'absolute',
              top: '-6px',
              left: '-6px',
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              border: '1.5px solid var(--accent-blue)',
              color: 'var(--accent-blue)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 15,
              fontSize: '0.6rem',
              fontWeight: 800,
              boxShadow: 'var(--shadow-soft)'
            }}
            title="Rotate Seat"
          >
            ↻
          </button>
        )}
        
        {isFloorCanvas ? (
          <div style={getSeatFaceStyle(rotationVal || 0)} />
        ) : (
          <div className="seat-tile-accent" />
        )}
        
        {/* Seat Number */}
        {editingSeatId === seat.id ? (
          <input
            type="text"
            value={editingSeatNumber}
            onChange={(e) => setEditingSeatNumber(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSeatNumberSwap(seat.id, editingSeatNumber);
              } else if (e.key === 'Escape') {
                setEditingSeatId(null);
              }
            }}
            onBlur={() => {
              handleSeatNumberSwap(seat.id, editingSeatNumber);
            }}
            autoFocus
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              width: '50px',
              height: '22px',
              textAlign: 'center',
              fontSize: '0.85rem',
              fontWeight: 700,
              color: 'var(--text-navy)',
              border: '2px solid var(--accent-blue)',
              borderRadius: '6px',
              outline: 'none',
              zIndex: 20,
              boxShadow: 'var(--shadow-soft)'
            }}
          />
        ) : (
          <span style={{
            position: 'absolute',
            top: '4px',
            right: '6px',
            fontSize: '0.625rem',
            fontWeight: 800,
            color: 'var(--text-slate)',
            opacity: 0.85,
            zIndex: 2
          }}>
            {seat.number}
          </span>
        )}

        {/* Occupant/Status indicator */}
        {isOccupied ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'center',
            width: '100%',
            paddingLeft: '8px',
            paddingRight: '8px',
            marginTop: '12px',
            gap: '2px',
            overflow: 'hidden',
            zIndex: 1
          }}>
            {currentAllocations.map((alloc: any) => {
              const badge = getShiftBadgeStyle(alloc.shift?.name || '');
              return (
                <div
                  key={alloc.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    gap: '2px',
                    lineHeight: '1.2'
                  }}
                  title={`${alloc.studentProfile?.user?.name} (${alloc.shift?.name})`}
                >
                  <span style={{
                    fontSize: '0.52rem',
                    fontWeight: 700,
                    color: 'var(--text-navy)',
                    maxWidth: '46px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {alloc.studentProfile?.user?.name?.split(' ')[0]}
                  </span>
                  <span
                    style={{
                      fontSize: '0.45rem',
                      fontWeight: 800,
                      backgroundColor: badge.bg,
                      color: badge.fg,
                      border: `1px solid ${badge.border}`,
                      padding: '0px 3px',
                      borderRadius: '4px',
                      lineHeight: '1',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: '10px',
                      height: '10px',
                      flexShrink: 0
                    }}
                  >
                    {badge.label}
                  </span>
                </div>
              );
            })}
          </div>
        ) : isExpired ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, marginTop: '8px', gap: '2px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px' }}>
              <span className="seat-dot available" style={{ width: '4px', height: '4px' }} />
              <span style={{ fontSize: '0.48rem', fontWeight: 700, color: 'var(--status-emerald)' }}>FREE</span>
            </div>
          </div>
        ) : seat.status === 'BLOCKED' ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, marginTop: '8px', gap: '2px' }}>
            <Wrench size={10} style={{ color: 'var(--status-amber)' }} />
            <span style={{ fontSize: '0.525rem', fontWeight: 700, color: 'var(--status-amber)' }}>MAINT</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, marginTop: '8px', gap: '2px' }}>
            <span className="seat-dot available" />
            <span style={{ fontSize: '0.525rem', fontWeight: 600, color: 'var(--status-emerald)' }}>FREE</span>
          </div>
        )}

        <div className="custom-tooltip" style={{ minWidth: 'auto', width: 'max-content', padding: '5px 8px', borderRadius: '8px' }}>
          {activeAllocations.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left' }}>
              <strong style={{ fontSize: '0.725rem', borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: '2px', marginBottom: '1px', display: 'block' }}>Occupants ({activeAllocations.length})</strong>
              {activeAllocations.map((alloc: any) => {
                const formattedEnd = alloc.endDate 
                  ? new Date(alloc.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) 
                  : 'N/A';
                return (
                  <div key={alloc.id} style={{ display: 'flex', flexDirection: 'column', fontSize: '0.75rem', lineHeight: '1.2' }}>
                    <span style={{ fontWeight: 700 }}>{alloc.studentProfile?.user?.name}</span>
                    <span style={{ opacity: 0.8, fontSize: '0.65rem' }}>Shift: {alloc.shift?.name}</span>
                    <span style={{ opacity: 0.8, fontSize: '0.65rem' }}>Ends: {formattedEnd}</span>
                  </div>
                );
              })}
            </div>
          ) : seat.status === 'BLOCKED' ? (
            <strong>Maintenance</strong>
          ) : (
            <strong>Available</strong>
          )}
        </div>
      </div>
    );
  };

  const renderAssignForm = () => {
    const activeAllocations = selectedSeat?.allocations?.filter((a: any) => a.isActive) || [];

    return (
      <form onSubmit={handleAllocate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-blue)', marginBottom: '4px' }}>
          <Sparkles size={16} />
          <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700 }}>Assign Student Seat</h4>
        </div>

        {/* Shared Seat Warning Alert */}
        {activeAllocations.length > 0 && (
          <div style={{ padding: '10px 12px', backgroundColor: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#b45309', display: 'flex', alignItems: 'center', gap: '4px' }}>
              ⚠️ Shared Seat Warning
            </span>
            <span style={{ fontSize: '0.675rem', color: '#b45309', lineHeight: '1.3' }}>
              This seat is already occupied during:
              <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                {activeAllocations.map((alloc: any) => (
                  <li key={alloc.id}>
                    <strong>{alloc.shift?.name}</strong>: {alloc.studentProfile?.user?.name}
                  </li>
                ))}
              </ul>
            </span>
          </div>
        )}

        {/* Student autocomplete search */}
        <div style={{ position: 'relative' }}>
          <label className="custom-input-label" style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-slate)', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>Search Student</label>
          <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: '12px', padding: '4px 12px', border: isSearchFocused ? '1px solid var(--accent-blue)' : '1px solid transparent', transition: 'all 150ms ease' }}>
            <Search size={16} style={{ color: '#94a3b8', marginRight: '6px' }} />
            <input
              type="text"
              placeholder="Name, email, phone..."
              value={studentSearchQuery}
              onChange={(e) => {
                setStudentSearchQuery(e.target.value);
                setShowStudentDropdown(true);
                if (studentProfileId) setStudentProfileId('');
              }}
              onFocus={() => { setShowStudentDropdown(true); setIsSearchFocused(true); }}
              onBlur={() => { setIsSearchFocused(false); setTimeout(() => setShowStudentDropdown(false), 250); }}
              style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', padding: '6px 0', fontSize: '0.85rem', color: 'var(--text-navy)' }}
            />
          </div>

          {showStudentDropdown && displayedStudents.length > 0 && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: '#ffffff', border: '1px solid var(--border-card)', borderRadius: '12px', boxShadow: 'var(--shadow-hover)', zIndex: 1000, marginTop: '4px', maxHeight: '180px', overflowY: 'auto' }}>
              {displayedStudents.map((st: any) => (
                <div
                  key={st.id}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setStudentProfileId(st.id);
                    setStudentSearchQuery(st.user?.name || '');
                    setShowStudentDropdown(false);
                  }}
                  style={{ padding: '8px 12px', cursor: 'pointer', display: 'flex', flexDirection: 'column', borderBottom: '1px solid #f1f5f9' }}
                >
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-navy)' }}>{st.user?.name}</span>
                  <span style={{ fontSize: '0.675rem', color: 'var(--text-slate)' }}>{st.user?.email || 'No email'} • {st.user?.mobile || 'No mobile'}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Shift select */}
        <div>
          <label className="custom-input-label" style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-slate)', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>Shift Schedule</label>
          {shifts && (
            <Select
              value={shiftId}
              onChange={(val) => setShiftId(val)}
              placeholder="Select schedule shift"
              options={shifts.map((s: any) => ({
                value: s.id,
                label: `${s.name} (${s.startTime} - ${s.endTime})`,
              }))}
            />
          )}
        </div>

        {/* Duration mode */}
        <div>
          <label className="custom-input-label" style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-slate)', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>Duration</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Select
              value={typeof durationMode === 'number' ? durationMode : ''}
              onChange={(val) => setDurationMode(Number(val))}
              placeholder="Months"
              style={{ flex: 1 }}
              options={[
                { value: 1, label: '1 Month' },
                { value: 2, label: '2 Months' },
                { value: 3, label: '3 Months' },
                { value: 6, label: '6 Months' }
              ]}
            />
            <button
              type="button"
              onClick={() => setDurationMode('flex')}
              style={{
                padding: '8px 16px',
                borderRadius: '12px',
                border: durationMode === 'flex' ? '2px solid var(--accent-blue)' : '1px solid rgba(15, 23, 42, 0.05)',
                backgroundColor: durationMode === 'flex' ? 'var(--accent-blue)' : '#ffffff',
                color: durationMode === 'flex' ? '#ffffff' : 'var(--text-navy)',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 150ms ease'
              }}
            >
              Flex Dates
            </button>
          </div>
        </div>

        {/* Dates Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <label style={{ fontSize: '0.675rem', fontWeight: 700, color: 'var(--text-slate)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Start Date</label>
            <input type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ padding: '8px 12px', borderRadius: '12px', border: '1px solid rgba(15, 23, 42, 0.05)', fontSize: '0.8rem', color: 'var(--text-navy)', width: '100%', outline: 'none' }} />
          </div>
          <div>
            <label style={{ fontSize: '0.675rem', fontWeight: 700, color: 'var(--text-slate)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>End Date</label>
            <input type="date" required disabled={durationMode !== 'flex'} value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ padding: '8px 12px', borderRadius: '12px', border: '1px solid rgba(15, 23, 42, 0.05)', fontSize: '0.8rem', color: 'var(--text-navy)', width: '100%', outline: 'none', backgroundColor: durationMode !== 'flex' ? '#f1f5f9' : '#ffffff', cursor: durationMode !== 'flex' ? 'not-allowed' : 'text' }} />
          </div>
        </div>

        {/* Generate Fee Invoice Switch */}
        <div style={{ margin: '6px 0' }}>
          <Switch
            checked={shouldGenerateInvoice}
            onChange={setShouldGenerateInvoice}
            label="Generate invoice & fee receipt"
            id="generate-invoice-drawer"
          />
        </div>

        {/* Invoicing details fields */}
        {shouldGenerateInvoice && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: '#F8FAFC', padding: '12px', borderRadius: '12px', border: '1px dashed rgba(15, 23, 42, 0.05)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-slate)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Amount (₹)</label>
                <input type="number" required={shouldGenerateInvoice} placeholder="e.g. 1500" value={invoiceAmount} onChange={(e) => setInvoiceAmount(e.target.value)} style={{ padding: '8px 12px', borderRadius: '12px', border: '1px solid rgba(15, 23, 42, 0.05)', fontSize: '0.8rem', width: '100%', outline: 'none' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-slate)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Method</label>
                <Select
                  value={paymentMethod}
                  onChange={(val: any) => setPaymentMethod(val)}
                  placeholder="Select channel"
                  options={[
                    { value: 'CASH', label: 'Cash' },
                    { value: 'UPI', label: 'UPI' },
                    { value: 'RAZORPAY', label: 'Online' }
                  ]}
                />
              </div>
            </div>
          </div>
        )}

        {/* Submit / Cancel actions */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
          <Button type="submit" variant="primary" style={{ flex: 1, backgroundColor: 'var(--accent-blue)', borderColor: 'var(--accent-blue)', borderRadius: '12px' }} disabled={!studentProfileId || !shiftId || !startDate || !endDate || (shouldGenerateInvoice && !invoiceAmount)} isLoading={isAllocating || isCreatingPayment}>
            Assign Student
          </Button>
        </div>
      </form>
    );
  };

  // Render classroom study hall grid layout representation
  const renderStudyHallGrid = (room: any) => {
    const sortedAndFiltered = getSortedSeats(room.seats, room.id);
    if (sortedAndFiltered.length === 0) {
      return (
        <div className="empty-state-container" style={{ padding: '24px' }}>
          <SlidersHorizontal size={24} style={{ color: '#94a3b8', marginBottom: '8px' }} />
          <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-navy)' }}>No matching seats</h4>
          <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: 'var(--text-slate)' }}>Try clearing your active filters or changing your query</p>
        </div>
      );
    }

    // Group seats by letter prefix if available, otherwise numeric chunks of 10
    const rows: Record<string, any[]> = {};
    sortedAndFiltered.forEach((seat: any) => {
      const match = seat.number.match(/^([A-Za-z]+)/);
      const prefix = match ? match[1].toUpperCase() : 'NUM';
      if (!rows[prefix]) {
        rows[prefix] = [];
      }
      rows[prefix].push(seat);
    });

    const rowKeys = Object.keys(rows).sort();

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>

        {rowKeys.map((rowKey, idx) => {
          const rowSeats = rows[rowKey];
          if (rowKey === 'NUM') {
            const chunks: any[][] = [];
            for (let i = 0; i < rowSeats.length; i += 10) {
              chunks.push(rowSeats.slice(i, i + 10));
            }
            return (
              <React.Fragment key={rowKey}>
                {chunks.map((chunk, chunkIdx) => (
                  <React.Fragment key={chunkIdx}>
                    <div className="study-hall-row">
                      <div className="study-hall-row-label">Row {chunkIdx + 1}</div>
                      <div className="study-hall-row-grid">
                        {chunk.map(seat => renderSeatCard(seat))}
                      </div>
                    </div>
                    {chunkIdx < chunks.length - 1 && (
                      <div className="walkway-separator">Walkway Gap</div>
                    )}
                  </React.Fragment>
                ))}
              </React.Fragment>
            );
          }

          return (
            <React.Fragment key={rowKey}>
              <div className="study-hall-row">
                <div className="study-hall-row-label">Row {rowKey}</div>
                <div className="study-hall-row-grid">
                  {rowSeats.map(seat => renderSeatCard(seat))}
                </div>
              </div>
              {idx < rowKeys.length - 1 && (
                <div className="walkway-separator">Walkway Gap</div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  return (
    <div style={{ width: '100%', minHeight: '100vh', backgroundColor: '#F7F8FA', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* 1. TOP HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid rgba(15, 23, 42, 0.05)', paddingBottom: '16px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.025em', display: 'flex', alignItems: 'center', gap: '8px' }}>
             Seat Map <Sparkles size={20} color="var(--accent-blue)" />
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.875rem', color: '#475569', fontWeight: 500 }}>
            Manage branches, floors, rooms and student.
          </p>
        </div>

        {/* Right side controls (Selectors & User) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'nowrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#ffffff', padding: '6px 10px', borderRadius: '20px', border: '1px solid rgba(15, 23, 42, 0.05)', boxShadow: 'var(--shadow-soft)' }}>
            <Building size={14} color="#64748B" />
            <select
              value={selectedBranch}
              onChange={(e) => {
                setSelectedBranch(e.target.value);
                setActiveFloorTab(0);
              }}
              style={{ border: 'none', background: 'transparent', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-navy)', outline: 'none', cursor: 'pointer' }}
            >
              {branches?.map((b: any) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          {selectedBranch && seatMap && seatMap.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#ffffff', padding: '4px 8px', borderRadius: '20px', border: '1px solid rgba(15, 23, 42, 0.05)', boxShadow: 'var(--shadow-soft)' }}>
              <Layers size={12} color="#64748B" />
              <select
                value={activeFloorTab}
                onChange={(e) => {
                  setActiveFloorTab(Number(e.target.value));
                }}
                style={{ border: 'none', background: 'transparent', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-navy)', outline: 'none', cursor: 'pointer', maxWidth: '100px' }}
              >
                {seatMap.map((floor: any, idx: number) => (
                  <option key={floor.id} value={idx}>{floor.name}</option>
                ))}
              </select>
              <button
                onClick={() => {
                  if (currentFloor) {
                    setEditFloorName(currentFloor.name);
                    setSelectedFloorToEdit(currentFloor);
                    setOpenEditFloorModal(true);
                  }
                }}
                style={{ background: 'none', border: 'none', padding: '2px', cursor: 'pointer', color: 'var(--text-slate)', display: 'flex', alignItems: 'center' }}
                title="Edit Floor"
              >
                <Edit2 size={12} />
              </button>
            </div>
          )}

          {selectedBranch && seatMap && seatMap.length > 0 && (
            <button
              onClick={() => {
                if (activeRoomEditingId) {
                  const exit = window.confirm("Exit visualization mode? Unsaved layouts will be discarded.");
                  if (!exit) return;
                  setActiveRoomEditingId(null);
                  setTempLayout({});
                  setLayoutHistory([]);
                }
                setIsFloorVisualization(!isFloorVisualization);
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '20px', border: '1px solid rgba(15, 23, 42, 0.05)', backgroundColor: isFloorVisualization ? 'var(--accent-blue)' : '#ffffff', color: isFloorVisualization ? '#ffffff' : 'var(--text-navy)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', boxShadow: 'var(--shadow-soft)' }}
            >
              {isFloorVisualization ? <LayoutGrid size={14} /> : <Map size={14} />}
              {isFloorVisualization ? "Grid View" : "Floor Visualizer"}
            </button>
          )}

          {/* Global search */}
          <div style={{ position: 'relative', width: '150px' }}>
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="Search seat, student..."
              value={globalSearchQuery}
              onChange={(e) => setGlobalSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 32px',
                fontSize: '0.8rem',
                borderRadius: '20px',
                border: '1px solid rgba(15, 23, 42, 0.05)',
                backgroundColor: '#ffffff',
                boxShadow: 'var(--shadow-soft)',
                outline: 'none',
                color: 'var(--text-navy)',
                transition: 'all 150ms ease'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--accent-blue)'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(15, 23, 42, 0.05)'}
            />
            {globalSearchQuery && (
              <button
                onClick={() => setGlobalSearchQuery('')}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', fontSize: '1rem', padding: '4px' }}
              >
                &times;
              </button>
            )}
          </div>

          {/* Notification bell */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: '#ffffff',
                border: '1px solid rgba(15, 23, 42, 0.05)',
                boxShadow: 'var(--shadow-soft)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--text-navy)',
                position: 'relative'
              }}
            >
              <Bell size={18} />
              {expiringSeatsList.length > 0 && (
                <span style={{ position: 'absolute', top: '-2px', right: '-2px', backgroundColor: 'var(--status-red)', color: 'white', fontSize: '0.6rem', fontWeight: 800, borderRadius: '50%', minWidth: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', border: '2px solid white' }}>
                  {expiringSeatsList.length}
                </span>
              )}
            </button>

            {/* Notification Popover Box */}
            {showNotifications && (
              <>
                <div onClick={() => setShowNotifications(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 998 }} />
                <div className="glass-card animate-fade-in" style={{ position: 'absolute', right: 0, top: '44px', width: '300px', padding: '12px', zIndex: 999, border: '1px solid var(--border-card)', maxHeight: '350px', overflowY: 'auto' }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-navy)', borderBottom: '1px solid var(--border-card)', paddingBottom: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>Expiring Subscriptions</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-slate)' }}>Next 7 days</span>
                  </h4>
                  {expiringSeatsList.length === 0 ? (
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-slate)', textAlign: 'center', padding: '16px 0' }}>No seats expiring soon!</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {expiringSeatsList.map((notif: any) => (
                        <div
                          key={notif.seatId}
                          onClick={() => {
                            const seatObj = seatMap[activeFloorTab]?.rooms
                              ?.flatMap((r: any) => r.seats)
                              ?.find((s: any) => s.id === notif.seatId);
                            if (seatObj) {
                              handleSeatClick(seatObj);
                              setShowNotifications(false);
                            }
                          }}
                          style={{ padding: '8px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #f1f5f9', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '2px' }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-navy)' }}>Seat {notif.seatNumber}</span>
                            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: notif.daysLeft <= 3 ? 'var(--status-red)' : 'var(--status-amber)' }}>
                              {notif.daysLeft}d left
                            </span>
                          </div>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-slate)' }}>{notif.studentName} ({notif.roomName})</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* User profile avatar */}
          <div
            onClick={() => navigate('/profile')}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent-blue)',
              color: 'white',
              fontSize: '0.9rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-soft)'
            }}
          >
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
        </div>
      </div>



      {/* 2. STATS SECTION (Premium Analytics Grid) */}
      {selectedBranch && seatMap && (
        <div className="stats-premium-grid">
          {/* Card 1: Total */}
          <div className="glass-card stats-premium-card" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-slate)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Capacity</span>
              <Building size={16} color="var(--accent-blue)" style={{ opacity: 0.8 }} />
            </div>
            <div style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-navy)' }}>{seatCounts.total}</div>
            <span style={{ fontSize: '0.675rem', color: 'var(--text-slate)', fontWeight: 500 }}>Configured study hall limits</span>
          </div>

          {/* Card 2: Available */}
          <div className="glass-card stats-premium-card emerald" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--status-emerald)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Available</span>
              <CheckCircle size={16} color="var(--status-emerald)" style={{ opacity: 0.8 }} />
            </div>
            <div style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-navy)' }}>{seatCounts.available}</div>
            <span style={{ fontSize: '0.675rem', color: 'var(--status-emerald)', fontWeight: 700 }}>
              {seatCounts.total > 0 ? Math.round((seatCounts.available / seatCounts.total) * 100) : 0}% available slots
            </span>
          </div>

          {/* Card 3: Occupied */}
          <div className="glass-card stats-premium-card red" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--status-red)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Occupied</span>
              <Users size={16} color="var(--status-red)" style={{ opacity: 0.8 }} />
            </div>
            <div style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-navy)' }}>{seatCounts.occupied}</div>
            <span style={{ fontSize: '0.675rem', color: 'var(--status-red)', fontWeight: 700 }}>
              {seatCounts.total > 0 ? Math.round((seatCounts.occupied / seatCounts.total) * 100) : 0}% live utilization
            </span>
          </div>

          {/* Card 4: Maintenance */}
          <div className="glass-card stats-premium-card amber" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--status-amber)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Maintenance</span>
              <Wrench size={16} color="var(--status-amber)" style={{ opacity: 0.8 }} />
            </div>
            <div style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-navy)' }}>{seatCounts.maintenance}</div>
            <span style={{ fontSize: '0.675rem', color: 'var(--text-slate)', fontWeight: 500 }}>Blocked / Out of service</span>
          </div>
        </div>
      )}

      {/* 3. MAIN CONTENT WORKSPACE (Accordion System) */}
      {isMapLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '64px', color: 'var(--accent-blue)' }}>
          <Loader2 className="spinner" size={40} />
        </div>
      ) : !seatMap || seatMap.length === 0 ? (
        <div className="empty-state-container">
          <HelpCircle size={48} style={{ color: '#94a3b8', marginBottom: '16px' }} />
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-navy)' }}>No floors configured</h3>
          <p style={{ margin: '8px 0 16px 0', fontSize: '0.875rem', color: 'var(--text-slate)', maxWidth: '400px' }}>
            You haven't added any floors or seat layouts in this branch yet. Create one to get started.
          </p>
          <Button onClick={() => { setCreatorType('floor'); setOpenCreator(true); }} variant="primary" style={{ backgroundColor: 'var(--accent-blue)' }}>
            Add Your First Floor
          </Button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {currentFloor?.rooms?.map((room: any) => {
            const isExpanded = !collapsedRooms[room.id];
            
            const total = room.seats?.length || 0;
            const occupied = room.seats?.filter((s: any) => {
              const { isOccupied } = getSeatStatusInfo(s);
              return isOccupied;
            }).length || 0;
            const percent = total > 0 ? Math.round((occupied / total) * 100) : 0;

            return (
              <div key={room.id} className={`room-accordion ${isExpanded ? 'expanded' : ''}`}>
                
                {/* ROOM ACCORDION HEADER */}
                <div 
                  className="room-accordion-header"
                  onClick={() => setCollapsedRooms(prev => ({ ...prev, [room.id]: !prev[room.id] }))}
                >
                  
                  {/* Left Controls */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                    <ChevronDown size={18} className="room-chevron-icon" />
                    
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(37, 99, 235, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-blue)', flexShrink: 0 }}>
                      <DoorOpen size={18} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                      <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-navy)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {room.name}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                        <span style={{ fontSize: '0.675rem', fontWeight: 600, color: '#64748B', background: '#F1F5F9', padding: '1px 6px', borderRadius: '4px' }}>
                          {total} Seats
                        </span>
                        <span className={`status-pill ${percent >= 80 ? 'occupied' : 'available'}`} style={{ padding: '1px 6px', fontSize: '0.65rem' }}>
                          {percent}% Occupancy
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Center Progress Bar */}
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', padding: '0 24px', maxWidth: '300px' }}>
                    <div className="room-progress-track">
                      <div className="room-progress-fill" style={{ width: `${percent}%` }} />
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-slate)' }}>{percent}%</span>
                  </div>

                  {/* Right Actions */}
                  <div 
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }}
                    onClick={(e) => e.stopPropagation()} // stop expanding accordion when clicking actions
                  >
                    
                    {/* Inline Room Search */}
                    <div style={{ position: 'relative', width: '160px' }}>
                      <Search size={12} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                      <input
                        type="text"
                        placeholder="Search room..."
                        value={roomSearches[room.id] || ''}
                        onChange={(e) => setRoomSearches(prev => ({ ...prev, [room.id]: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '6px 10px 6px 26px',
                          fontSize: '0.75rem',
                          borderRadius: '16px',
                          border: '1px solid rgba(15, 23, 42, 0.05)',
                          outline: 'none',
                          color: 'var(--text-navy)'
                        }}
                      />
                    </div>

                    <button
                      onClick={() => {
                        setParentId(room.id);
                        setCreatorType('seat');
                        setOpenCreator(true);
                      }}
                      style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', border: '1px solid rgba(15, 23, 42, 0.05)', background: '#ffffff', borderRadius: '16px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-navy)', cursor: 'pointer', transition: 'background 150ms ease' }}
                      onMouseOver={(e) => e.currentTarget.style.background = '#f8fafc'}
                      onMouseOut={(e) => e.currentTarget.style.background = '#ffffff'}
                    >
                      <Plus size={12} /> Add Seat
                    </button>

                    {/* Room dropdown actions */}
                    <button
                      onClick={() => setActiveRoomMenuId(activeRoomMenuId === room.id ? null : room.id)}
                      style={{ border: 'none', background: 'none', color: '#64748B', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                      <MoreVertical size={16} />
                    </button>

                    {/* Action dropdown popup */}
                    {activeRoomMenuId === room.id && (
                      <>
                        <div 
                          onClick={() => setActiveRoomMenuId(null)}
                          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100 }}
                        />
                        <div style={{
                          position: 'absolute',
                          right: 0,
                          top: '100%',
                          backgroundColor: '#ffffff',
                          border: '1px solid var(--border-card)',
                          borderRadius: '8px',
                          boxShadow: 'var(--shadow-hover)',
                          zIndex: 101,
                          minWidth: '120px',
                          padding: '4px 0',
                          display: 'flex',
                          flexDirection: 'column'
                        }}>
                          <button
                            onClick={() => {
                              setSelectedRoomToEdit(room);
                              setEditRoomName(room.name);
                              setOpenEditRoomModal(true);
                              setActiveRoomMenuId(null);
                            }}
                            style={{ border: 'none', background: 'none', padding: '8px 12px', fontSize: '0.8rem', textAlign: 'left', cursor: 'pointer', color: 'var(--text-navy)', display: 'flex', alignItems: 'center', gap: '6px' }}
                          >
                            <Edit2 size={12} /> Rename
                          </button>
                          <button
                            onClick={() => {
                              handleDeleteRoom(room.id);
                              setActiveRoomMenuId(null);
                            }}
                            style={{ border: 'none', background: 'none', padding: '8px 12px', fontSize: '0.8rem', textAlign: 'left', cursor: 'pointer', color: 'var(--status-red)', display: 'flex', alignItems: 'center', gap: '6px' }}
                          >
                            <Trash2 size={12} /> Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* ACCORDION BODY (Visible when expanded) */}
                {isExpanded && (
                  <div className="room-accordion-body">
                                      {/* BREADCRUMBS & FILTERS TOOLBAR */}
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      gap: '16px', 
                      flexWrap: 'wrap', 
                      marginBottom: '16px',
                      borderBottom: '1px solid rgba(15, 23, 42, 0.04)',
                      paddingBottom: '12px'
                    }}>
                      {/* Left: Breadcrumbs */}
                      <div className="breadcrumb-container" style={{ margin: 0, padding: 0, border: 'none' }}>
                        <span className="breadcrumb-item">{branches?.find((b: any) => b.id === selectedBranch)?.name}</span>
                        <ChevronRight size={10} />
                        <span className="breadcrumb-item">{currentFloor?.name}</span>
                        <ChevronRight size={10} />
                        <span style={{ color: 'var(--text-navy)', fontWeight: 600 }}>{room.name}</span>
                      </div>

                      {/* Right: Status Filters & Sort By Dropdown */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        {/* Status Filter Dropdown */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: 500, color: 'var(--text-slate)' }}>Status:</span>
                          <select
                            value={statusFilters[room.id] || 'ALL'}
                            onChange={(e) => setStatusFilters(prev => ({ ...prev, [room.id]: e.target.value }))}
                            style={{
                              border: '1px solid rgba(15, 23, 42, 0.05)',
                              borderRadius: '8px',
                              padding: '3px 6px',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              color: 'var(--text-navy)',
                              outline: 'none',
                              cursor: 'pointer',
                              background: '#ffffff'
                            }}
                          >
                            <option value="ALL">All Seats</option>
                            <option value="AVAILABLE">Available</option>
                            <option value="OCCUPIED">Occupied</option>
                            <option value="BLOCKED">Maintenance</option>
                          </select>
                        </div>

                        {/* Sort Dropdown */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: 500, color: 'var(--text-slate)' }}>Sort:</span>
                          <select
                            value={sortOptions[room.id] || 'NUMBER'}
                            onChange={(e) => setSortOptions(prev => ({ ...prev, [room.id]: e.target.value }))}
                            style={{
                              border: '1px solid rgba(15, 23, 42, 0.05)',
                              borderRadius: '8px',
                              padding: '3px 6px',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              color: 'var(--text-navy)',
                              outline: 'none',
                              cursor: 'pointer',
                              background: '#ffffff'
                            }}
                          >
                            <option value="NUMBER">Number</option>
                            <option value="NAME">Name</option>
                            <option value="RECENT">Recent</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* SEAT GRID / MAP SECTION */}
                    {isFloorVisualization ? (
                      // Absolute layout Canvas
                      (() => {
                        const roomWidth = visualizerWidths[room.id] || room.canvasWidth || 1000;
                        const roomHeight = visualizerHeights[room.id] || room.canvasHeight || 450;
                        const isEditingThisRoom = activeRoomEditingId === room.id;
                        
                        return (
                          <div style={{
                            position: 'relative',
                            width: '100%',
                            borderRadius: '16px',
                            border: isEditingThisRoom ? '2px dashed var(--accent-blue)' : '1px solid var(--border-card)',
                            backgroundColor: '#f8fafc',
                            overflow: 'hidden'
                          }}>
                            {/* Scrollable Canvas Viewport */}
                            <div style={{
                              width: '100%',
                              overflow: 'auto',
                              borderRadius: '15px'
                            }}>
                               <div 
                                 onPointerDown={handleCanvasPointerDown}
                                 style={{
                                   position: 'relative',
                                   width: `${roomWidth}px`,
                                   height: `${roomHeight}px`,
                                   backgroundImage: 'radial-gradient(#cbd5e1 1.5px, transparent 1.5px)',
                                   backgroundSize: '20px 20px',
                                   overflow: 'visible',
                                   transition: isEditingThisRoom ? 'none' : 'width 150ms ease, height 150ms ease',
                                 }}
                               >
                                 {[...(room.seats || [])].sort((a: any, b: any) => a.number.localeCompare(b.number, undefined, { numeric: true })).map((seat: any, idx: number) => {
                                   const isEditingThisRoom = activeRoomEditingId === room.id;
                                   const position = isEditingThisRoom
                                     ? getSeatPixelPosition(seat, idx, roomWidth, roomHeight)
                                     : getSeatPosition(seat, idx);
                                   const rotation = isEditingThisRoom
                                     ? (tempLayout[seat.id]?.rotation || 0)
                                     : (seat.rotation || 0);
                                   const matchesFilter = statusFilters[room.id] === 'ALL' || !statusFilters[room.id] || seat.status === statusFilters[room.id];
                                   if (!matchesFilter) return null;

                                   return (
                                     <div
                                       key={seat.id}
                                       onPointerDown={(e) => { if (isEditingThisRoom) { e.stopPropagation(); handlePointerDown(e, seat.id); } }}
                                       onDoubleClick={(e) => {
                                         if (isEditingThisRoom) {
                                           e.stopPropagation();
                                           setEditingSeatId(seat.id);
                                           setEditingSeatNumber(seat.number);
                                         }
                                       }}
                                       onClick={(e) => { if (isEditingThisRoom) { e.stopPropagation(); } else { handleSeatClick(seat); } }}
                                       style={{
                                         position: 'absolute',
                                         left: isEditingThisRoom ? `${position.x}px` : `${position.x}%`,
                                         top: isEditingThisRoom ? `${position.y}px` : `${position.y}%`,
                                         touchAction: 'none',
                                         cursor: isEditingThisRoom ? 'move' : 'pointer',
                                         zIndex: isEditingThisRoom ? (selectedArrangeIds.includes(seat.id) ? 6 : 5) : 2,
                                         transition: isEditingThisRoom ? 'none' : 'all 0.15s ease',
                                         outline: isEditingThisRoom && selectedArrangeIds.includes(seat.id) ? '3px solid var(--accent-blue)' : undefined,
                                         outlineOffset: '2px',
                                         borderRadius: '8px'
                                       }}
                                     >
                                       {renderSeatCard(seat, true, rotation)}
                                     </div>
                                   );
                                 })}

                                 {isEditingThisRoom && spacers.map((spacer) => {
                                    const isDesk = spacer.type === 'desk';
                                    const isSelected = selectedArrangeIds.includes(spacer.id);
                                    return (
                                      <div
                                        key={spacer.id}
                                        onPointerDown={(e) => { e.stopPropagation(); handleSpacerPointerDown(e, spacer.id); }}
                                        style={{
                                          position: 'absolute',
                                          left: `${spacer.x}px`,
                                          top: `${spacer.y}px`,
                                          width: `${spacer.w || 78}px`,
                                          height: `${spacer.h || 78}px`,
                                          borderRadius: isDesk ? '6px' : '12px',
                                          border: isSelected ? '2px solid var(--accent-blue)' : (isDesk ? 'none' : '2px dashed #cbd5e1'),
                                          backgroundColor: isDesk
                                            ? (isSelected ? '#1e293b' : '#000000')
                                            : (isSelected ? 'rgba(239, 246, 255, 0.95)' : 'rgba(241, 245, 249, 0.95)'),
                                          display: 'flex',
                                          flexDirection: 'column',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          cursor: 'move',
                                          zIndex: isSelected ? 5 : 4,
                                          boxSizing: 'border-box',
                                          padding: '4px',
                                          overflow: 'hidden',
                                          boxShadow: isSelected ? '0 0 0 3px rgba(37, 99, 235, 0.25), var(--shadow-soft)' : 'var(--shadow-soft)'
                                        }}
                                      >
                                        {/* Delete Spacer button */}
                                        <button
                                          type="button"
                                          onPointerDown={(e) => {
                                            e.stopPropagation();
                                          }}
                                          onMouseDown={(e) => {
                                            e.stopPropagation();
                                          }}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            pushToHistory();
                                            setSpacers(prev => prev.filter(s => s.id !== spacer.id));
                                          }}
                                          style={{
                                            position: 'absolute',
                                            top: '4px',
                                            right: '4px',
                                            background: 'none',
                                            border: 'none',
                                            color: isDesk ? '#f87171' : '#ef4444',
                                            cursor: 'pointer',
                                            fontSize: '0.85rem',
                                            fontWeight: 800,
                                            padding: '0 4px',
                                            zIndex: 10
                                          }}
                                          title={isDesk ? "Remove Desk" : "Remove Spacer"}
                                        >
                                          &times;
                                        </button>

                                        <span style={{ fontSize: '0.65rem', fontWeight: 700, color: isDesk ? '#ffffff' : '#94a3b8', zIndex: 1 }}>
                                          {isDesk ? 'Desk' : 'Space'}
                                        </span>
                                        
                                        {/* Visual drag boundary dimensions */}
                                        <span style={{ fontSize: '0.55rem', color: isDesk ? 'rgba(255,255,255,0.7)' : '#cbd5e1', zIndex: 1, marginTop: '2px' }}>
                                          {spacer.w || 78} x {spacer.h || 78}
                                        </span>

                                        {/* Resize drag handle at bottom-right corner */}
                                        <div
                                          onPointerDown={(e) => { pushToHistory(); handleResizePointerDown(e, spacer.id); }}
                                          style={{
                                            position: 'absolute',
                                            right: '0',
                                            bottom: '0',
                                            width: '14px',
                                            height: '14px',
                                            cursor: 'se-resize',
                                            background: `linear-gradient(135deg, transparent 40%, ${isDesk ? '#ffffff' : '#cbd5e1'} 40%)`,
                                            borderBottomRightRadius: isDesk ? '4px' : '10px',
                                            zIndex: 15,
                                          }}
                                        />
                                      </div>
                                    );
                                  })}

                                  {/* Render saved spacers in View Mode (Non-editing) */}
                                  {!isEditingThisRoom && room.spacers && (() => {
                                    try {
                                      const parsedSpacers = JSON.parse(room.spacers);
                                      if (!Array.isArray(parsedSpacers)) return null;
                                      return parsedSpacers.map((spacer: any) => {
                                        const isDesk = spacer.type === 'desk';
                                        return (
                                          <div
                                            key={spacer.id}
                                            style={{
                                              position: 'absolute',
                                              left: `${spacer.x}px`,
                                              top: `${spacer.y}px`,
                                              width: `${spacer.w || 78}px`,
                                              height: `${spacer.h || 78}px`,
                                              borderRadius: isDesk ? '6px' : '12px',
                                              border: isDesk ? 'none' : '1.5px dashed #cbd5e1',
                                              backgroundColor: isDesk ? '#000000' : 'rgba(241, 245, 249, 0.5)',
                                              display: 'flex',
                                              flexDirection: 'column',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              zIndex: 1,
                                              boxSizing: 'border-box',
                                              padding: '4px',
                                              overflow: 'hidden',
                                              pointerEvents: 'none'
                                            }}
                                          >
                                            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: isDesk ? '#ffffff' : '#94a3b8' }}>
                                              {isDesk ? 'Desk' : 'Walking Area'}
                                            </span>
                                          </div>
                                        );
                                      });
                                    } catch (e) {
                                      return null;
                                    }
                                  })()}

                                  {/* Selection Box Visualizer */}
                                  {dragSelectStart && dragSelectEnd && (() => {
                                    const boxX = Math.min(dragSelectStart.x, dragSelectEnd.x);
                                    const boxY = Math.min(dragSelectStart.y, dragSelectEnd.y);
                                    const boxW = Math.abs(dragSelectStart.x - dragSelectEnd.x);
                                    const boxH = Math.abs(dragSelectStart.y - dragSelectEnd.y);
                                    return (
                                      <div
                                        style={{
                                          position: 'absolute',
                                          left: `${boxX}px`,
                                          top: `${boxY}px`,
                                          width: `${boxW}px`,
                                          height: `${boxH}px`,
                                          border: '1.5px dashed #2563eb',
                                          backgroundColor: 'rgba(37, 99, 235, 0.15)',
                                          pointerEvents: 'none',
                                          zIndex: 100,
                                          borderRadius: '4px'
                                        }}
                                      />
                                    );
                                  })()}

                                  {/* Selection Menu Toolbar */}
                                  {isEditingThisRoom && selectedArrangeIds.length > 0 && (() => {
                                    let minX = Infinity;
                                    let minY = Infinity;
                                    let maxX = -Infinity;
                                    let maxY = -Infinity;
                                    
                                    selectedArrangeIds.forEach(id => {
                                      const seat = room.seats?.find((s: any) => s.id === id);
                                      if (seat) {
                                        const pos = tempLayout[id] || getSeatPixelPosition(seat, room.seats.indexOf(seat), roomWidth, roomHeight);
                                        if (pos.x < minX) minX = pos.x;
                                        if (pos.y < minY) minY = pos.y;
                                        if (pos.x + 78 > maxX) maxX = pos.x + 78;
                                        if (pos.y + 78 > maxY) maxY = pos.y + 78;
                                      } else {
                                        const spacer = spacers.find((s: any) => s.id === id);
                                        if (spacer) {
                                          const w = spacer.w || 78;
                                          const h = spacer.h || 78;
                                          if (spacer.x < minX) minX = spacer.x;
                                          if (spacer.y < minY) minY = spacer.y;
                                          if (spacer.x + w > maxX) maxX = spacer.x + w;
                                          if (spacer.y + h > maxY) maxY = spacer.y + h;
                                        }
                                      }
                                    });

                                    if (minX === Infinity) return null;

                                    return (
                                      <div
                                        onPointerDown={(e) => e.stopPropagation()}
                                        onMouseDown={(e) => e.stopPropagation()}
                                        style={{
                                          position: 'absolute',
                                          left: `${maxX}px`,
                                          top: `${minY - 45}px`,
                                          transform: 'translateX(-100%)',
                                          zIndex: 110,
                                        }}
                                      >
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setShowSelectionMenu(!showSelectionMenu);
                                          }}
                                          style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            background: 'var(--accent-blue)',
                                            color: '#ffffff',
                                            border: 'none',
                                            padding: '6px 12px',
                                            borderRadius: '20px',
                                            fontSize: '0.7rem',
                                            fontWeight: 700,
                                            cursor: 'pointer',
                                            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)',
                                            transition: 'all 0.2s ease',
                                            outline: 'none'
                                          }}
                                        >
                                          <span>Selection ({selectedArrangeIds.length})</span>
                                          <MoreVertical size={12} />
                                        </button>

                                        {showSelectionMenu && (
                                          <div
                                            style={{
                                              position: 'absolute',
                                              top: '32px',
                                              right: 0,
                                              background: '#ffffff',
                                              border: '1px solid var(--border-card)',
                                              borderRadius: '12px',
                                              boxShadow: 'var(--shadow-lg)',
                                              width: '180px',
                                              padding: '6px',
                                              display: 'flex',
                                              flexDirection: 'column',
                                              gap: '4px',
                                              zIndex: 120,
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            <button
                                              type="button"
                                              onClick={() => { pushToHistory(); alignSelectedSeats('horizontal'); }}
                                              style={{
                                                width: '100%',
                                                textAlign: 'left',
                                                background: 'none',
                                                border: 'none',
                                                padding: '6px 10px',
                                                borderRadius: '8px',
                                                fontSize: '0.7rem',
                                                color: 'var(--text-navy)',
                                                cursor: 'pointer',
                                                fontWeight: 600,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px'
                                              }}
                                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                            >
                                              ↔ Align Horizontally
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => { pushToHistory(); alignSelectedSeats('vertical'); }}
                                              style={{
                                                width: '100%',
                                                textAlign: 'left',
                                                background: 'none',
                                                border: 'none',
                                                padding: '6px 10px',
                                                borderRadius: '8px',
                                                fontSize: '0.7rem',
                                                color: 'var(--text-navy)',
                                                cursor: 'pointer',
                                                fontWeight: 600,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px'
                                              }}
                                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                            >
                                              ↕ Align Vertically
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => { pushToHistory(); alignStraight('horizontal'); }}
                                              style={{
                                                width: '100%',
                                                textAlign: 'left',
                                                background: 'none',
                                                border: 'none',
                                                padding: '6px 10px',
                                                borderRadius: '8px',
                                                fontSize: '0.7rem',
                                                color: 'var(--text-navy)',
                                                cursor: 'pointer',
                                                fontWeight: 600,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px'
                                              }}
                                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                            >
                                              📏 Align Straight (Horiz)
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => { pushToHistory(); alignStraight('vertical'); }}
                                              style={{
                                                width: '100%',
                                                textAlign: 'left',
                                                background: 'none',
                                                border: 'none',
                                                padding: '6px 10px',
                                                borderRadius: '8px',
                                                fontSize: '0.7rem',
                                                color: 'var(--text-navy)',
                                                cursor: 'pointer',
                                                fontWeight: 600,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px'
                                              }}
                                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                            >
                                              📏 Align Straight (Vert)
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => { pushToHistory(); rotateSelectedSeats(); }}
                                              style={{
                                                width: '100%',
                                                textAlign: 'left',
                                                background: 'none',
                                                border: 'none',
                                                padding: '6px 10px',
                                                borderRadius: '8px',
                                                fontSize: '0.7rem',
                                                color: 'var(--text-navy)',
                                                cursor: 'pointer',
                                                fontWeight: 600,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                borderTop: '1px solid #f1f5f9',
                                                marginTop: '2px',
                                                paddingTop: '6px'
                                              }}
                                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                            >
                                              ↻ Rotate Faces
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })()}
                               </div>
                            </div>


                            {/* Floating Arrange Toolbar */}
                            <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', alignItems: 'center', gap: '12px', zIndex: 10, background: 'rgba(255,255,255,0.95)', padding: '6px 12px', borderRadius: '12px', border: '1px solid var(--border-card)', boxShadow: 'var(--shadow-soft)' }}>
                              
                              {isEditingThisRoom ? (
                                 <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                   <Button
                                     variant="outline"
                                     size="sm"
                                     style={{ padding: '4px 10px', height: '28px', fontSize: '0.7rem', color: 'var(--accent-blue)', borderColor: 'var(--accent-blue)' }}
                                     onClick={() => {
                                        const nextSpacerId = `spacer-${Date.now()}`;
                                        const newSpacer = { id: nextSpacerId, x: 100, y: 100 };
                                        pushToHistory();
                                        setSpacers(prev => {
                                          const nextSpacers = [...prev, newSpacer];
                                          setTempLayout(currentTemp => resolveCollisions(currentTemp, nextSpacers, room));
                                          return nextSpacers;
                                        });
                                      }}
                                   >
                                     + Space
                                   </Button>
                                   <Button
                                      variant="primary"
                                      size="sm"
                                      style={{ padding: '4px 10px', height: '28px', fontSize: '0.7rem', backgroundColor: '#000000', borderColor: '#000000', color: '#ffffff' }}
                                      onClick={() => {
                                        // Auto-detect a reasonable default starting seat number
                                        if (room.seats && room.seats.length > 0) {
                                          const numbers = room.seats.map((s: any) => parseInt(s.number, 10)).filter((n: any) => !isNaN(n));
                                          if (numbers.length > 0) {
                                            const maxNum = Math.max(...numbers);
                                            setDeskStartSeat(maxNum + 1);
                                          } else {
                                            setDeskStartSeat(1);
                                          }
                                        } else {
                                          setDeskStartSeat(1);
                                        }
                                        setOpenAddDesk(true);
                                      }}
                                    >
                                      + Add Desk
                                    </Button>
                                   <Button
                                     variant="outline"
                                     size="sm"
                                     style={{ padding: '4px 10px', height: '28px', fontSize: '0.7rem', color: 'var(--accent-blue)', borderColor: 'var(--accent-blue)' }}
                                     onClick={() => { pushToHistory(); handleArrangeAscending(room); }}
                                   >
                                     Ascending
                                   </Button>
                                   <Button
                                      variant="outline"
                                      size="sm"
                                      style={{ padding: '4px 10px', height: '28px', fontSize: '0.7rem', color: 'var(--text-navy)', borderColor: 'var(--border-color)' }}
                                      onClick={handleUndo}
                                      disabled={layoutHistory.length === 0}
                                    >
                                      <History size={12} style={{ marginRight: '4px' }} />
                                      Undo
                                    </Button>
                                   <Button variant="outline" size="sm" style={{ padding: '4px 10px', height: '28px', fontSize: '0.7rem' }} onClick={() => { setActiveRoomEditingId(null); setTempLayout({}); setSpacers([]); setSelectedArrangeIds([]); setLayoutHistory([]); }}>Cancel</Button>
                                   <Button variant="primary" size="sm" style={{ padding: '4px 10px', height: '28px', fontSize: '0.7rem', backgroundColor: 'var(--status-emerald)', borderColor: 'var(--status-emerald)' }} onClick={() => { handleSaveLayout(room); }} disabled={isUpdatingLayout}>Save</Button>
                                 </div>
                              ) : (
                                activeRoomEditingId === null && (
                                  <button
                                    onClick={() => {
                                      setActiveRoomEditingId(room.id);
                                      const currentW = visualizerWidths[room.id] || room.canvasWidth || 1000;
                                      const currentH = visualizerHeights[room.id] || room.canvasHeight || 450;
                                      const initialLayout: Record<string, { x: number; y: number }> = {};
                                      room.seats?.forEach((seat: any, idx: number) => {
                                        initialLayout[seat.id] = getSeatPixelPosition(seat, idx, currentW, currentH);
                                      });
                                      setTempLayout(initialLayout);
                                      if (room.spacers) {
                                        try {
                                          setSpacers(JSON.parse(room.spacers));
                                        } catch (e) {
                                          setSpacers([]);
                                        }
                                      } else {
                                        setSpacers([]);
                                      }
                                      setLayoutHistory([]);
                                    }}
                                    style={{ padding: '5px 10px', borderRadius: '8px', border: '1px solid var(--accent-blue)', background: 'transparent', fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent-blue)', cursor: 'pointer' }}
                                  >
                                    Arrange Seats
                                  </button>
                                )
                              )}
                            </div>
                          </div>
                        );
                      })()
                    ) : (
                      // Grid View resembling study hall layout
                      renderStudyHallGrid(room)
                    )}

                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 4. RIGHT SLIDING DRAWER PANEL */}
      <div 
        className={`drawer-backdrop ${isDrawerOpen ? 'open' : ''}`}
        onClick={() => setIsDrawerOpen(false)}
      />
      <div className={`right-drawer-panel ${isDrawerOpen ? 'open' : ''}`}>
        
        {/* Drawer Header */}
        <div className="drawer-header">
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-navy)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Seat {selectedSeat?.number}
              {selectedSeat && (() => {
                const { isExpired } = getSeatStatusInfo(selectedSeat);
                return (
                  <span 
                    className={`status-pill ${isExpired ? 'expired' : selectedSeat.status.toLowerCase()}`}
                    style={isExpired ? { backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--status-red)' } : undefined}
                  >
                    {selectedSeat.status === 'BLOCKED' ? 'Maintenance' : isExpired ? 'Expired' : selectedSeat.status.charAt(0) + selectedSeat.status.slice(1).toLowerCase()}
                  </span>
                );
              })()}
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-slate)' }}>Branch: {branches?.find((b: any) => b.id === selectedBranch)?.name} • Floor: {currentFloor?.name}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {selectedSeat && selectedSeat.status !== 'BLOCKED' && (
              <button
                type="button"
                onClick={handleOpenAllocateModal}
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
                  transition: 'opacity 150ms ease'
                }}
              >
                <Plus size={14} />
                <span>Add Student</span>
              </button>
            )}
            <button 
              onClick={() => setIsDrawerOpen(false)}
              style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-slate)', padding: '4px' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Drawer Body content depends on Status */}
        <div className="drawer-body">
          {selectedSeat?.status === 'AVAILABLE' && (
            <>
              {renderAssignForm()}
              {/* Delete Seat / Mark Maintenance actions */}
              <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border-card)', paddingTop: '12px', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => handleDeleteSeat(selectedSeat?.id)}
                  style={{ flex: 1, background: 'none', border: '1px solid rgba(239, 68, 68, 0.15)', color: 'var(--status-red)', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 600, padding: '8px', cursor: 'pointer' }}
                >
                  Delete Seat
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await updateSeatStatus({ id: selectedSeat?.id, status: 'BLOCKED' }).unwrap();
                      setIsDrawerOpen(false);
                      showToast('Seat marked under maintenance!', 'success');
                    } catch (err: any) {
                      showToast('Failed to block seat', 'error');
                    }
                  }}
                  style={{ flex: 1, background: 'none', border: '1px solid rgba(245, 158, 11, 0.15)', color: 'var(--status-amber)', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 600, padding: '8px', cursor: 'pointer' }}
                >
                  Block Seat
                </button>
              </div>
            </>
          )}

          {selectedSeat?.status === 'OCCUPIED' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {(() => {
                const activeAllocations = selectedSeat.allocations?.filter((a: any) => a.isActive) || [];
                const activeAllocation = activeAllocations.find((a: any) => a.id === selectedAllocationId) || activeAllocations[0];
                if (!activeAllocation) return <p style={{ fontSize: '0.8rem', color: 'var(--text-slate)' }}>Error: Active allocation details not found.</p>;
                
                const nameInit = activeAllocation.studentProfile?.user?.name?.charAt(0).toUpperCase() || 'S';
                const latestPayment = activeAllocation.studentProfile?.payments && activeAllocation.studentProfile.payments.length > 0
                  ? [...activeAllocation.studentProfile.payments].sort((a: any, b: any) => new Date(b.paidAt || b.createdAt).getTime() - new Date(a.paidAt || a.createdAt).getTime())[0]
                  : null;

                return (
                  <>
                    {/* Multi-occupant Selector Tabs at Top */}
                    {activeAllocations.length > 1 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderBottom: '1px solid rgba(15,23,42,0.05)', paddingBottom: '12px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '0.675rem', fontWeight: 700, color: 'var(--text-slate)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Current Occupants</span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {activeAllocations.map((alloc: any) => {
                            const isCurrent = alloc.id === activeAllocation.id;
                            return (
                              <div
                                key={alloc.id}
                                onClick={() => setSelectedAllocationId(alloc.id)}
                                style={{
                                  padding: '8px 12px',
                                  borderRadius: '10px',
                                  border: isCurrent ? '1.5px solid var(--accent-blue)' : '1px solid rgba(15,23,42,0.08)',
                                  backgroundColor: isCurrent ? '#f0fdf4' : '#ffffff',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  transition: 'all 150ms ease'
                                }}
                              >
                                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-navy)' }}>{alloc.studentProfile?.user?.name}</span>
                                  <span style={{ fontSize: '0.65rem', color: 'var(--text-slate)' }}>Shift: {alloc.shift?.name}</span>
                                </div>
                                <span style={{ fontSize: '0.6rem', padding: '2px 6px', borderRadius: '4px', backgroundColor: isCurrent ? 'var(--accent-blue)' : '#f1f5f9', color: isCurrent ? '#ffffff' : 'var(--text-slate)', fontWeight: 600 }}>
                                  {isCurrent ? 'Viewing' : 'Select'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Drawer sub-tab selectors */}
                    <div style={{ display: 'flex', background: '#F1F5F9', padding: '4px', borderRadius: '12px', gap: '4px' }}>
                      {['DETAILS', 'TRANSFER', 'RENEW'].map((tab: any) => (
                        <button
                          key={tab}
                          onClick={() => {
                            if (tab === 'TRANSFER') {
                              navigate(`/transfer-seat?allocationId=${activeAllocation.id}&studentId=${activeAllocation.studentProfileId}`);
                            } else {
                              setDrawerActiveSection(tab);
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
                            transition: 'all 150ms ease'
                          }}
                        >
                          {tab === 'DETAILS' ? 'Details' : tab === 'TRANSFER' ? 'Transfer' : 'Renew'}
                        </button>
                      ))}
                    </div>

                    {drawerActiveSection === 'DETAILS' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {/* Student Details Card */}
                        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '12px', background: '#eff6ff', borderColor: 'rgba(37, 99, 235, 0.15)', borderRadius: '14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                              <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: 'var(--accent-blue)', color: 'white', fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                {nameInit}
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-navy)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{activeAllocation.studentProfile?.user?.name}</span>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-slate)' }}>ID: STD-{activeAllocation.studentProfile?.id?.slice(0, 4).toUpperCase()}</span>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-slate)', marginTop: '1px' }}>{activeAllocation.studentProfile?.user?.mobile}</span>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-slate)', marginTop: '1px', textTransform: 'lowercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activeAllocation.studentProfile?.user?.email}</span>
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
                                justifyContent: 'center'
                              }}
                            >
                              {isDetailsExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </button>
                          </div>

                          {/* Collapsible Content */}
                          {isDetailsExpanded && (
                            <div style={{ borderTop: '1px solid rgba(37, 99, 235, 0.1)', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                                <span style={{ color: 'var(--text-slate)' }}>Guardian Name:</span>
                                <span style={{ fontWeight: 600, color: 'var(--text-navy)' }}>{activeAllocation.studentProfile?.guardianName || 'N/A'}</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                                <span style={{ color: 'var(--text-slate)' }}>Guardian Mobile:</span>
                                <span style={{ fontWeight: 600, color: 'var(--text-navy)' }}>{activeAllocation.studentProfile?.guardianMobile || 'N/A'}</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                                <span style={{ color: 'var(--text-slate)' }}>Aadhar Card:</span>
                                <span style={{ fontWeight: 600, color: 'var(--text-navy)' }}>{activeAllocation.studentProfile?.aadharNumber || 'N/A'}</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                                <span style={{ color: 'var(--text-slate)' }}>Admission Date:</span>
                                <span style={{ fontWeight: 600, color: 'var(--text-navy)' }}>
                                  {activeAllocation.studentProfile?.joiningDate 
                                    ? new Date(activeAllocation.studentProfile.joiningDate).toLocaleDateString()
                                    : 'N/A'}
                                </span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                                <span style={{ color: 'var(--text-slate)' }}>Password:</span>
                                <span style={{ fontWeight: 600, color: 'var(--text-navy)', fontFamily: 'monospace' }}>{activeAllocation.studentProfile?.user?.rawPassword || 'Student@123'}</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Subscription Info and dates */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h5 style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-slate)', textTransform: 'uppercase' }}>Subscription Dates</h5>
                            <button
                              onClick={() => {
                                setIsEditingDates(!isEditingDates);
                                setEditStartDate(activeAllocation.startDate ? activeAllocation.startDate.split('T')[0] : '');
                                setEditEndDate(activeAllocation.endDate ? activeAllocation.endDate.split('T')[0] : '');
                              }}
                              style={{ border: 'none', background: 'none', color: 'var(--accent-blue)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              <Edit2 size={12} /> {isEditingDates ? 'Cancel' : 'Edit'}
                            </button>
                          </div>

                          {isEditingDates ? (
                            <form onSubmit={handleUpdateAllocationDates} style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: '#F8FAFC', padding: '10px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                                <div>
                                  <label style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-slate)', display: 'block', marginBottom: '2px' }}>Start</label>
                                  <input type="date" required value={editStartDate} onChange={(e) => setEditStartDate(e.target.value)} style={{ padding: '6px', fontSize: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%' }} />
                                </div>
                                <div>
                                  <label style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-slate)', display: 'block', marginBottom: '2px' }}>End</label>
                                  <input type="date" required value={editEndDate} onChange={(e) => setEditEndDate(e.target.value)} style={{ padding: '6px', fontSize: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%' }} />
                                </div>
                              </div>
                              <Button type="submit" size="sm" variant="primary" style={{ backgroundColor: 'var(--accent-blue)', width: '100%', marginTop: '4px' }} isLoading={isUpdatingAllocation}>Save Dates</Button>
                            </form>
                          ) : (
                            <div style={{ background: '#ffffff', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-card)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #f1f5f9', paddingBottom: '4px', marginBottom: '4px' }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-slate)' }}>Shift Batch:</span>
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-blue)' }}>{activeAllocation.shift?.name}</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-slate)' }}>Start date:</span>
                                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-navy)' }}>{new Date(activeAllocation.startDate).toLocaleDateString()}</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-slate)' }}>End date:</span>
                                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-navy)' }}>{new Date(activeAllocation.endDate).toLocaleDateString()}</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-blue)', fontSize: '0.75rem', fontWeight: 700, marginTop: '4px', borderTop: '1px solid #f1f5f9', paddingTop: '6px' }}>
                                <Clock size={12} />
                                <span>{getDaysRemainingText(activeAllocation.endDate)}</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Last payment status details */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <h5 style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-slate)', textTransform: 'uppercase' }}>Last Invoice Payment</h5>
                          {latestPayment ? (
                            <div style={{ background: '#ffffff', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-card)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-slate)' }}>Amount:</span>
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-navy)' }}>₹{latestPayment.amount}</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-slate)' }}>Method:</span>
                                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-navy)' }}>{latestPayment.method}</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-slate)' }}>Status:</span>
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: latestPayment.status === 'PAID' ? 'var(--status-emerald)' : 'var(--status-red)' }}>{latestPayment.status}</span>
                              </div>
                            </div>
                          ) : (
                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-slate)' }}>No payment record found</p>
                          )}
                        </div>

                        {/* Vacate Seat Button */}
                        <div style={{ borderTop: '1px solid var(--border-card)', paddingTop: '16px', marginTop: '16px' }}>
                          <button
                            type="button"
                            onClick={handleVacateSeat}
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
                              transition: 'background 150ms ease'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                          >
                            <LogOut size={14} style={{ transform: 'rotate(180deg)' }} /> Vacate Seat Pod
                          </button>
                        </div>
                      </div>
                    )}


                    {drawerActiveSection === 'RENEW' && (
                      <form onSubmit={handleRenewSeat} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--status-emerald)', marginBottom: '4px' }}>
                          <History size={16} />
                          <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700 }}>Renew Seat Subscription</h4>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-slate)' }}>Extend the student's booking subscription and auto-generate the renewal payment invoice.</p>



                        <div>
                          <label style={{ fontSize: '0.675rem', fontWeight: 700, color: 'var(--text-slate)', display: 'block', marginBottom: '4px' }}>Shift Schedule</label>
                          <Select
                            value={renewShiftId}
                            onChange={(val) => setRenewShiftId(val)}
                            placeholder="Select Shift"
                            options={shifts?.map((s: any) => ({ value: s.id, label: s.name })) || []}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '0.675rem', fontWeight: 700, color: 'var(--text-slate)', display: 'block', marginBottom: '4px' }}>Plan Duration</label>
                          <Select
                            value={renewDuration}
                            onChange={(val: any) => setRenewDuration(Number(val))}
                            placeholder="Select Duration"
                            options={[
                              { value: 1, label: '1 Month' },
                              { value: 3, label: '3 Months (Discounted)' },
                              { value: 6, label: '6 Months (Discounted)' },
                            ]}
                          />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          <div>
                            <label style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-slate)', display: 'block', marginBottom: '4px' }}>Start Date</label>
                            <input type="date" required value={renewStartDate} onChange={(e) => setRenewStartDate(e.target.value)} style={{ padding: '8px', fontSize: '0.8rem', borderRadius: '8px', border: '1px solid rgba(15, 23, 42, 0.05)', width: '100%' }} />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-slate)', display: 'block', marginBottom: '4px' }}>End Date</label>
                            <input type="date" required value={renewEndDate} onChange={(e) => setRenewEndDate(e.target.value)} style={{ padding: '8px', fontSize: '0.8rem', borderRadius: '8px', border: '1px solid rgba(15, 23, 42, 0.05)', width: '100%' }} />
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          <div>
                            <label style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-slate)', display: 'block', marginBottom: '4px' }}>Amount (₹)</label>
                            <input type="number" required value={renewAmount} onChange={(e) => setRenewAmount(e.target.value)} style={{ padding: '8px', fontSize: '0.8rem', borderRadius: '8px', border: '1px solid rgba(15, 23, 42, 0.05)', width: '100%' }} />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-slate)', display: 'block', marginBottom: '4px' }}>Method</label>
                            <Select
                              value={renewPaymentMethod}
                              onChange={(val: any) => setRenewPaymentMethod(val)}
                              placeholder="Payment Method"
                              options={[
                                { value: 'UPI', label: 'UPI' },
                                { value: 'CASH', label: 'Cash' },
                                { value: 'RAZORPAY', label: 'Online' }
                              ]}
                            />
                          </div>
                        </div>

                        <Button type="submit" variant="primary" style={{ backgroundColor: 'var(--status-emerald)', borderColor: 'var(--status-emerald)', width: '100%', marginTop: '6px' }} disabled={!renewShiftId || !renewStartDate || !renewEndDate || isRenewing} isLoading={isRenewing}>
                          Confirm Renewal
                        </Button>
                      </form>
                    )}

                    {drawerActiveSection === 'ASSIGN' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        {renderAssignForm()}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}

          {selectedSeat?.status === 'BLOCKED' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--status-amber)' }}>
                <Wrench size={18} />
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>Seat Under Maintenance</h4>
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-slate)' }}>This seat is marked blocked or under maintenance and cannot be assigned to students.</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                <Button
                  type="button"
                  variant="primary"
                  style={{ backgroundColor: 'var(--status-emerald)', borderColor: 'var(--status-emerald)' }}
                  onClick={async () => {
                    try {
                      await updateSeatStatus({ id: selectedSeat?.id, status: 'AVAILABLE' }).unwrap();
                      setIsDrawerOpen(false);
                      setSelectedSeat(null);
                      showToast('Seat is now available!', 'success');
                    } catch (err: any) {
                      showToast('Failed to update status', 'error');
                    }
                  }}
                >
                  Mark Available
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  style={{ color: 'var(--status-red)', borderColor: 'rgba(239,68,68,0.3)' }}
                  onClick={() => handleDeleteSeat(selectedSeat?.id)}
                >
                  Delete Seat Permanently
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Drawer footer close action button */}
        <div className="drawer-footer">
          <Button variant="outline" size="sm" onClick={() => setIsDrawerOpen(false)} style={{ borderRadius: '10px' }}>
            Close Panel
          </Button>
        </div>
      </div>

      {/* 5. FLOATING QUICK ACTION BUTTON (FAB Menu bottom right) */}
      {selectedBranch && (
        <div className={`fab-container ${isFabOpen ? 'expanded' : ''}`}>
          <div className="fab-menu-options">
            <button 
              className="fab-option-btn" 
              onClick={() => { setCreatorType('floor'); setParentId(''); setOpenCreator(true); setIsFabOpen(false); }}
            >
              <Layers size={12} color="var(--accent-blue)" /> New Floor
            </button>
            <button 
              className="fab-option-btn"
              disabled={!currentFloor}
              onClick={() => { if (currentFloor) { setCreatorType('room'); setParentId(currentFloor.id); setOpenCreator(true); setIsFabOpen(false); } }}
            >
              <DoorOpen size={12} color="var(--accent-blue)" /> New Room
            </button>
            <button 
              className="fab-option-btn"
              disabled={!currentFloor?.rooms?.length}
              onClick={() => { if (currentFloor?.rooms?.length) { setCreatorType('seat'); setParentId(currentFloor.rooms[0].id); setOpenCreator(true); setIsFabOpen(false); } }}
            >
              <Plus size={12} color="var(--accent-blue)" /> New Seat
            </button>
            <button 
              className="fab-option-btn"
              onClick={() => { alert("Premium Feature: Import seat layout configurations via Excel/CSV."); setIsFabOpen(false); }}
            >
              <FileText size={12} color="var(--accent-blue)" /> Import Seats
            </button>
          </div>

          <button 
            className="fab-main-btn" 
            onClick={() => setIsFabOpen(!isFabOpen)}
            style={{ transform: isFabOpen ? 'rotate(135deg)' : 'rotate(0)' }}
          >
            <Plus size={24} />
          </button>
        </div>
      )}

      {/* Layout Creator Modal */}
      <LayoutCreatorModal
        isOpen={openCreator}
        onClose={() => setOpenCreator(false)}
        creatorType={creatorType}
        setCreatorType={setCreatorType}
        seatMap={seatMap}
        currentFloor={currentFloor}
        selectedBranch={selectedBranch}
      />

      {openAddDesk && activeRoomEditingId && (() => {
        const room = seatMap?.flatMap((f: any) => f.rooms || []).find((r: any) => r.id === activeRoomEditingId);
        if (!room) return null;
        
        return (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}>
            <div style={{
              background: '#ffffff',
              borderRadius: '16px',
              width: '420px',
              padding: '24px',
              boxShadow: 'var(--shadow-xl)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-navy)' }}>Add Desk Layout</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: 'var(--text-slate)' }}>Configure the desk size, layout structure, and seat numbers.</p>
              </div>

              {/* Number of Seats */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-navy)' }}>Number of Seats</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={deskSeatCount}
                  onChange={(e) => {
                    if (e.target.value === '') {
                      setDeskSeatCount('');
                      return;
                    }
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val)) {
                      setDeskSeatCount(val);
                    }
                  }}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1.5px solid var(--border-card)',
                    fontSize: '0.85rem',
                    outline: 'none',
                    fontWeight: 500
                  }}
                />
              </div>

              {/* Desk Layout Selection */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-navy)' }}>Desk Layout</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setDeskLayoutType('one_side')}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: '8px',
                      border: '1.5px solid',
                      borderColor: deskLayoutType === 'one_side' ? 'var(--accent-blue)' : 'var(--border-card)',
                      backgroundColor: deskLayoutType === 'one_side' ? 'rgba(37, 99, 235, 0.05)' : '#ffffff',
                      color: deskLayoutType === 'one_side' ? 'var(--accent-blue)' : 'var(--text-navy)',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    One Side
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeskLayoutType('both_sides')}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: '8px',
                      border: '1.5px solid',
                      borderColor: deskLayoutType === 'both_sides' ? 'var(--accent-blue)' : 'var(--border-card)',
                      backgroundColor: deskLayoutType === 'both_sides' ? 'rgba(37, 99, 235, 0.05)' : '#ffffff',
                      color: deskLayoutType === 'both_sides' ? 'var(--accent-blue)' : 'var(--text-navy)',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    Both Sides
                  </button>
                </div>
              </div>

              {/* Start and End Seat range */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-navy)' }}>Starting Seat Number</label>
                  <input
                    type="number"
                    min={1}
                    value={deskStartSeat}
                    onChange={(e) => {
                      if (e.target.value === '') {
                        setDeskStartSeat('');
                        return;
                      }
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val)) {
                        setDeskStartSeat(val);
                      }
                    }}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1.5px solid var(--border-card)',
                      fontSize: '0.85rem',
                      outline: 'none',
                      fontWeight: 500
                    }}
                  />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-navy)' }}>Ending Seat (Calculated)</label>
                  <input
                    type="text"
                    disabled
                    value={(deskStartSeat && deskSeatCount) ? (Number(deskStartSeat) + Number(deskSeatCount) - 1) : ''}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1.5px solid var(--border-card)',
                      backgroundColor: '#f8fafc',
                      color: 'var(--text-slate)',
                      fontSize: '0.85rem',
                      fontWeight: 600
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <Button
                  variant="outline"
                  onClick={() => setOpenAddDesk(false)}
                  style={{ flex: 1, padding: '8px', fontSize: '0.8rem', height: '36px' }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={async () => {
                    if (deskSeatCount === '' || Number(deskSeatCount) <= 0) {
                      showToast("Please enter a valid number of seats (greater than 0).", "error");
                      return;
                    }
                    if (deskStartSeat === '' || Number(deskStartSeat) <= 0) {
                      showToast("Please enter a valid starting seat number (greater than 0).", "error");
                      return;
                    }
                    
                    const N = Number(deskSeatCount);
                    const S = Number(deskStartSeat);
                    const E = S + N - 1;
                    
                    const missingSeatNumbers: string[] = [];
                    for (let i = S; i <= E; i++) {
                      const numStr = i.toString();
                      const exists = room.seats?.some((s: any) => s.number === numStr);
                      if (!exists) {
                        missingSeatNumbers.push(numStr);
                      }
                    }

                    try {
                      if (missingSeatNumbers.length > 0) {
                        showToast(`Creating ${missingSeatNumbers.length} new seat records...`, 'info');
                        for (const numStr of missingSeatNumbers) {
                          await addSeat({ roomId: room.id, number: numStr }).unwrap();
                        }
                      }
                      
                      const refetchResult = await refetchSeatMap();
                      
                      let updatedRoom: any = null;
                      refetchResult.data?.forEach((floor: any) => {
                        floor.rooms?.forEach((rm: any) => {
                          if (rm.id === room.id) {
                            updatedRoom = rm;
                          }
                        });
                      });
                      if (!updatedRoom) updatedRoom = room;

                      const selectedSeats = updatedRoom.seats?.filter((s: any) => {
                        const num = parseInt(s.number, 10);
                        return !isNaN(num) && num >= S && num <= E;
                      }) || [];
                      selectedSeats.sort((a: any, b: any) => parseInt(a.number, 10) - parseInt(b.number, 10));

                      if (selectedSeats.length === 0) {
                        showToast("Could not locate seats in range.", "error");
                        return;
                      }

                      const deskX = 150;
                      const deskY = 180;
                      const deskH = 24;
                      const cols = deskLayoutType === 'one_side' ? N : Math.ceil(N / 2);
                      const deskW = cols * 78 + (cols - 1) * 12;

                      const deskSpacerId = `spacer-desk-${Date.now()}`;
                      const deskSpacer = { id: deskSpacerId, x: deskX, y: deskY, w: deskW, h: deskH, type: 'desk' };

                      pushToHistory();
                      setSpacers(prev => {
                        const nextSpacers = [...prev, deskSpacer];
                        setTempLayout(currentTemp => {
                          const nextLayout = { ...currentTemp };
                          selectedSeats.forEach((seat: any, idx: number) => {
                            let seatX = 0;
                            let seatY = 0;
                            let rotation = 0;
                            if (deskLayoutType === 'one_side') {
                              seatX = deskX + idx * 90;
                              seatY = deskY + deskH + 12;
                              rotation = 0;
                            } else {
                              if (idx < cols) {
                                seatX = deskX + idx * 90;
                                seatY = deskY + deskH + 12;
                                rotation = 0;
                              } else {
                                seatX = deskX + (idx - cols) * 90;
                                seatY = deskY - 78 - 12;
                                rotation = 180;
                              }
                            }
                            nextLayout[seat.id] = { x: seatX, y: seatY, rotation };
                          });
                          return resolveCollisions(nextLayout, nextSpacers, updatedRoom);
                        });
                        return nextSpacers;
                      });

                      showToast("Desk layout created successfully!", "success");
                      setOpenAddDesk(false);
                    } catch (err: any) {
                      showToast(err?.message || "Failed to create desk layout", "error");
                    }
                  }}
                  style={{ flex: 1, padding: '8px', fontSize: '0.8rem', height: '36px', backgroundColor: '#000000', borderColor: '#000000', color: '#ffffff' }}
                >
                  Create
                </Button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Edit Floor Modal */}
      <Modal
        isOpen={openEditFloorModal}
        onClose={() => setOpenEditFloorModal(false)}
        title={`Edit Floor - ${selectedFloorToEdit?.name}`}
        maxWidth="sm"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input
            label="Floor Name"
            value={editFloorName}
            required
            onChange={(e) => setEditFloorName(e.target.value)}
            placeholder="e.g. Ground Floor"
          />

          <div style={{
            margin: '20px -24px -24px -24px',
            padding: '16px 24px',
            backgroundColor: '#F8FAFC',
            borderTop: '1px solid var(--border-card)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <button
              type="button"
              onClick={async () => {
                if (selectedFloorToEdit) {
                  setOpenEditFloorModal(false);
                  await handleDeleteFloor(selectedFloorToEdit.id);
                }
              }}
              style={{ background: 'none', border: 'none', color: 'var(--status-red)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, padding: '6px 12px', borderRadius: '10px' }}
            >
              Delete Floor
            </button>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => setOpenEditFloorModal(false)}
                style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, padding: '6px 12px' }}
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
                      showToast('Floor name updated!', 'success');
                    } catch (err: any) {
                      showToast('Failed to update floor', 'error');
                    }
                  }
                }}
                style={{ backgroundColor: 'var(--accent-blue)', borderColor: 'var(--accent-blue)', borderRadius: '12px' }}
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-slate)', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Room Name</label>
            <Input
              type="text"
              value={editRoomName}
              onChange={(e) => setEditRoomName(e.target.value)}
              placeholder="e.g. Room A"
              autoFocus
            />
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
            <button
              type="button"
              onClick={() => setOpenEditRoomModal(false)}
              style={{ backgroundColor: 'transparent', border: 'none', color: '#475569', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, padding: '6px 12px' }}
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
                    showToast('Room name updated successfully!', 'success');
                  } catch (err: any) {
                    showToast('Failed to update room name', 'error');
                  }
                }
              }}
              style={{ backgroundColor: 'var(--accent-blue)', borderColor: 'var(--accent-blue)', borderRadius: '12px' }}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>

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
