import React, { useState, useCallback } from 'react';
import type { Room, Seat, Floor, Position, LayoutSpacer, LayoutGroup } from '../types';
import { getSeatPixelPosition, resolveCollisions } from '../layout/layoutGeometry';
import { getRoomGroups, getGroupForItem } from '../layout/layoutSerialization';

export interface UseLayoutEditorProps {
  seatMap?: Floor[] | null;
  refetchSeatMap: () => Promise<any>;
  addSeat: (payload: { roomId: string; number: string }) => { unwrap: () => Promise<any> };
  updateSeatLayout: (payload: any) => { unwrap: () => Promise<any> };
  showToast: (msg: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  isUpdatingLayout?: boolean;
}

export function useLayoutEditor({
  seatMap,
  refetchSeatMap,
  addSeat,
  updateSeatLayout,
  showToast,
  isUpdatingLayout = false,
}: UseLayoutEditorProps) {
  // Visualizer toggle & active editing room
  const [isFloorVisualization, setIsFloorVisualization] = useState(false);
  const [activeRoomEditingId, setActiveRoomEditingId] = useState<string | null>(null);

  // Layout draft positions & spacers
  const [tempLayout, setTempLayout] = useState<Record<string, Position>>({});
  const [spacers, setSpacers] = useState<LayoutSpacer[]>([]);
  const [selectedArrangeIds, setSelectedArrangeIds] = useState<string[]>([]);
  const [showSelectionMenu, setShowSelectionMenu] = useState(false);

  // Dynamic canvas dimensions per room
  const [visualizerHeights, setVisualizerHeights] = useState<Record<string, number>>({});
  const [visualizerWidths, setVisualizerWidths] = useState<Record<string, number>>({});

  // Drag selection marquee
  const [dragSelectStart, setDragSelectStart] = useState<Position | null>(null);
  const [dragSelectEnd, setDragSelectEnd] = useState<Position | null>(null);

  // Double click seat number editing
  const [editingSeatId, setEditingSeatId] = useState<string | null>(null);
  const [editingSeatNumber, setEditingSeatNumber] = useState<string>('');

  // Add desk modal state
  const [openAddDesk, setOpenAddDesk] = useState(false);
  const [deskSeatCount, setDeskSeatCount] = useState<number | ''>(6);
  const [deskLayoutType, setDeskLayoutType] = useState<'one_side' | 'both_sides'>('both_sides');
  const [deskStartSeat, setDeskStartSeat] = useState<number | ''>(1);

  // Undo history
  const [layoutHistory, setLayoutHistory] = useState<
    Array<{
      tempLayout: Record<string, Position>;
      spacers: LayoutSpacer[];
      visualizerWidths: Record<string, number>;
      visualizerHeights: Record<string, number>;
    }>
  >([]);

  const pushToHistory = useCallback(
    (
      currentLayout = tempLayout,
      currentSpacers = spacers,
      currentWidths = visualizerWidths,
      currentHeights = visualizerHeights
    ) => {
      setLayoutHistory((prev) => [
        ...prev,
        {
          tempLayout: JSON.parse(JSON.stringify(currentLayout)),
          spacers: JSON.parse(JSON.stringify(currentSpacers)),
          visualizerWidths: { ...currentWidths },
          visualizerHeights: { ...currentHeights },
        },
      ]);
    },
    [tempLayout, spacers, visualizerWidths, visualizerHeights]
  );

  const handleUndo = useCallback(() => {
    if (layoutHistory.length === 0) return;
    setLayoutHistory((prev) => {
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
  }, [layoutHistory.length]);

  const initRoomArranging = useCallback(
    (room: Room) => {
      setActiveRoomEditingId(room.id);
      const currentW = visualizerWidths[room.id] || room.canvasWidth || 1000;
      const currentH = visualizerHeights[room.id] || room.canvasHeight || 450;
      const initialLayout: Record<string, Position> = {};
      room.seats?.forEach((seat: Seat, idx: number) => {
        initialLayout[seat.id] = getSeatPixelPosition(seat, idx, currentW, currentH);
      });
      setTempLayout(initialLayout);
      if (room.spacers) {
        try {
          const parsed = typeof room.spacers === 'string' ? JSON.parse(room.spacers) : room.spacers;
          setSpacers(Array.isArray(parsed) ? parsed : []);
        } catch {
          setSpacers([]);
        }
      } else {
        setSpacers([]);
      }
      setLayoutHistory([]);
      setSelectedArrangeIds([]);
    },
    [visualizerWidths, visualizerHeights]
  );

  const handleCancelArranging = useCallback(() => {
    setActiveRoomEditingId(null);
    setTempLayout({});
    setSpacers([]);
    setSelectedArrangeIds([]);
    setLayoutHistory([]);
    setShowSelectionMenu(false);
  }, []);

  const handleAddSpacer = useCallback(() => {
    if (!activeRoomEditingId) return;
    const room = seatMap?.flatMap((f) => f.rooms || []).find((r) => r.id === activeRoomEditingId);
    if (!room) return;

    const nextSpacerId = `spacer-${Date.now()}`;
    const newSpacer: LayoutSpacer = { id: nextSpacerId, x: 100, y: 100, w: 78, h: 78, type: 'spacer' };
    pushToHistory();
    setSpacers((prev) => {
      const nextSpacers = [...prev, newSpacer];
      setTempLayout((currentTemp) => {
        const roomW = visualizerWidths[room.id] || room.canvasWidth || 1000;
        const roomH = visualizerHeights[room.id] || room.canvasHeight || 450;
        return resolveCollisions(currentTemp, nextSpacers, room.seats || [], roomW, roomH);
      });
      return nextSpacers;
    });
  }, [activeRoomEditingId, seatMap, visualizerWidths, visualizerHeights, pushToHistory]);

  const handleArrangeAscending = useCallback(() => {
    if (!activeRoomEditingId) return;
    const room = seatMap?.flatMap((f) => f.rooms || []).find((r) => r.id === activeRoomEditingId);
    if (!room) return;

    pushToHistory();
    const sortedSeats = [...(room.seats || [])].sort((a, b) =>
      (a.number || a.seatNumber || '').localeCompare(b.number || b.seatNumber || '', undefined, {
        numeric: true,
        sensitivity: 'base',
      })
    );
    const cols = 10;
    const newLayout = { ...tempLayout };
    sortedSeats.forEach((seat, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      newLayout[seat.id] = {
        x: col * 95 + 40,
        y: row * 110 + 70,
      };
    });
    setTempLayout(newLayout);
  }, [activeRoomEditingId, seatMap, tempLayout, pushToHistory]);

  const handleSaveLayout = useCallback(async () => {
    if (!activeRoomEditingId) return;
    const room = seatMap?.flatMap((f) => f.rooms || []).find((r) => r.id === activeRoomEditingId);
    if (!room) return;

    const rWidth = visualizerWidths[room.id] || room.canvasWidth || 1000;
    const rHeight = visualizerHeights[room.id] || room.canvasHeight || 450;

    let maxX = 0;
    let maxY = 0;

    const seatPixels = (room.seats || []).map((seat, idx) => {
      const pos = getSeatPixelPosition(seat, idx, rWidth, rHeight, tempLayout);
      if (pos.x > maxX) maxX = pos.x;
      if (pos.y > maxY) maxY = pos.y;
      const rotation = tempLayout[seat.id]?.rotation !== undefined ? tempLayout[seat.id].rotation : seat.rotation || 0;
      return { id: seat.id, x: pos.x, y: pos.y, rotation };
    });

    const padding = 120;
    const trimmedWidth = Math.max(800, maxX + padding);
    const trimmedHeight = Math.max(450, maxY + padding);

    const layoutPayload = seatPixels.map((sp) => {
      const xPct = Math.max(0, Math.min(95, (sp.x / trimmedWidth) * 100));
      const yPct = Math.max(0, Math.min(95, (sp.y / trimmedHeight) * 100));
      return { id: sp.id, x: xPct, y: yPct, rotation: sp.rotation };
    });

    const validIds = new Set([
      ...(room.seats || []).map((s) => s.id),
      ...spacers.filter((s) => s.type !== 'group_metadata').map((s) => s.id),
    ]);

    const cleanedSpacers = spacers.map((s) => {
      if (s.type === 'group_metadata') {
        const cleanedGroups = (s.groups || [])
          .map((g: LayoutGroup) => ({
            ...g,
            memberIds: g.memberIds.filter((id) => validIds.has(id)),
          }))
          .filter((g: LayoutGroup) => g.memberIds.length >= 2);
        return { ...s, groups: cleanedGroups };
      }
      return s;
    });

    try {
      await updateSeatLayout({
        roomId: room.id,
        layout: layoutPayload,
        canvasWidth: trimmedWidth,
        canvasHeight: trimmedHeight,
        spacers: cleanedSpacers,
      }).unwrap();

      showToast('Seat positions and canvas bounds saved successfully!', 'success');
      setActiveRoomEditingId(null);
      setTempLayout({});
      setSelectedArrangeIds([]);
      setSpacers([]);
      setLayoutHistory([]);

      setVisualizerWidths((prev) => ({ ...prev, [room.id]: trimmedWidth }));
      setVisualizerHeights((prev) => ({ ...prev, [room.id]: trimmedHeight }));
    } catch (err: any) {
      showToast(err.data?.message || 'Failed to save seat layout', 'error');
    }
  }, [
    activeRoomEditingId,
    seatMap,
    visualizerWidths,
    visualizerHeights,
    tempLayout,
    spacers,
    updateSeatLayout,
    showToast,
  ]);

  const handleGroupAndLock = useCallback(() => {
    if (selectedArrangeIds.length < 2) {
      showToast('Please select at least 2 items to group.', 'warning');
      return;
    }
    pushToHistory();

    const newGroup: LayoutGroup = {
      id: `group-${Math.random().toString(36).substring(2, 9)}`,
      locked: true,
      memberIds: [...selectedArrangeIds],
    };

    setSpacers((prev) => {
      const groupMetaIdx = prev.findIndex((s) => s.type === 'group_metadata');
      const nextSpacers = [...prev];

      if (groupMetaIdx > -1) {
        const existingMeta = prev[groupMetaIdx];
        const existingGroups = existingMeta.groups || [];

        const cleanedGroups = existingGroups
          .map((g: LayoutGroup) => ({
            ...g,
            memberIds: g.memberIds.filter((id) => !selectedArrangeIds.includes(id)),
          }))
          .filter((g: LayoutGroup) => g.memberIds.length >= 2);

        cleanedGroups.push(newGroup);

        nextSpacers[groupMetaIdx] = {
          ...existingMeta,
          groups: cleanedGroups,
        };
      } else {
        nextSpacers.push({
          id: 'room_groups_metadata',
          x: 0,
          y: 0,
          type: 'group_metadata',
          groups: [newGroup],
        });
      }
      return nextSpacers;
    });

    showToast('Items grouped and locked!', 'success');
    setShowSelectionMenu(false);
  }, [selectedArrangeIds, pushToHistory, showToast]);

  const handleUngroup = useCallback(() => {
    pushToHistory();
    setSpacers((prev) => {
      const groupMetaIdx = prev.findIndex((s) => s.type === 'group_metadata');
      if (groupMetaIdx === -1) return prev;

      const nextSpacers = [...prev];
      const existingMeta = prev[groupMetaIdx];
      const existingGroups = existingMeta.groups || [];

      const remainingGroups = existingGroups.filter(
        (g: LayoutGroup) => !g.memberIds.some((id) => selectedArrangeIds.includes(id))
      );

      nextSpacers[groupMetaIdx] = {
        ...existingMeta,
        groups: remainingGroups,
      };
      return nextSpacers;
    });

    showToast('Items ungrouped!', 'success');
    setShowSelectionMenu(false);
  }, [selectedArrangeIds, pushToHistory, showToast]);

  const handleToggleLock = useCallback(
    (lock: boolean) => {
      pushToHistory();
      setSpacers((prev) => {
        const groupMetaIdx = prev.findIndex((s) => s.type === 'group_metadata');
        if (groupMetaIdx === -1) return prev;

        const nextSpacers = [...prev];
        const existingMeta = prev[groupMetaIdx];
        const existingGroups = existingMeta.groups || [];

        const updatedGroups = existingGroups.map((g: LayoutGroup) => {
          const hasOverlap = g.memberIds.some((id) => selectedArrangeIds.includes(id));
          if (hasOverlap) {
            return { ...g, locked: lock };
          }
          return g;
        });

        nextSpacers[groupMetaIdx] = {
          ...existingMeta,
          groups: updatedGroups,
        };
        return nextSpacers;
      });

      showToast(lock ? 'Group locked!' : 'Group unlocked!', 'success');
      setShowSelectionMenu(false);
    },
    [selectedArrangeIds, pushToHistory, showToast]
  );

  const alignSelectedSeats = useCallback(
    (direction: 'horizontal' | 'vertical') => {
      if (selectedArrangeIds.length === 0 || activeRoomEditingId === null) return;

      const hasLocked = selectedArrangeIds.some((id) => {
        const g = getGroupForItem(id, spacers);
        return g && g.locked;
      });
      if (hasLocked) {
        showToast('Cannot align locked items. Please unlock the group first.', 'warning');
        return;
      }

      pushToHistory();
      const roomId = activeRoomEditingId;
      const roomObj = seatMap?.flatMap((f) => f.rooms || []).find((r) => r.id === roomId);
      if (!roomObj) return;

      const roomWidth = visualizerWidths[roomId] || roomObj.canvasWidth || 1000;
      const roomHeight = visualizerHeights[roomId] || roomObj.canvasHeight || 450;

      const selectedSeats = selectedArrangeIds
        .map((id) => {
          const seat = roomObj.seats?.find((s) => s.id === id);
          if (!seat) return null;
          const pos =
            tempLayout[id] ||
            getSeatPixelPosition(seat, roomObj.seats?.indexOf(seat) ?? 0, roomWidth, roomHeight, tempLayout);
          return { id, x: pos.x, y: pos.y, seat };
        })
        .filter(Boolean) as Array<{ id: string; x: number; y: number; seat: Seat }>;

      if (selectedSeats.length === 0) return;

      if (direction === 'horizontal') {
        selectedSeats.sort((a, b) => a.x - b.x);
        const anchorX = selectedSeats[0].x;
        const anchorY = selectedSeats[0].y;
        const seatCollisionSize = 90;

        setTempLayout((prev) => {
          const nextLayout = { ...prev };
          selectedSeats.forEach((item, index) => {
            let targetX = anchorX + index * seatCollisionSize;
            let targetY = anchorY;
            targetX = Math.max(0, Math.min(roomWidth - 78, targetX));
            targetY = Math.max(60, Math.min(roomHeight - 78, targetY));

            nextLayout[item.id] = { ...nextLayout[item.id], x: targetX, y: targetY };
          });
          return resolveCollisions(nextLayout, spacers, roomObj.seats || [], roomWidth, roomHeight);
        });
      } else {
        selectedSeats.sort((a, b) => a.y - b.y);
        const anchorX = selectedSeats[0].x;
        const anchorY = selectedSeats[0].y;
        const seatCollisionSize = 90;

        setTempLayout((prev) => {
          const nextLayout = { ...prev };
          selectedSeats.forEach((item, index) => {
            let targetX = anchorX;
            let targetY = anchorY + index * seatCollisionSize;
            targetX = Math.max(0, Math.min(roomWidth - 78, targetX));
            targetY = Math.max(60, Math.min(roomHeight - 78, targetY));

            nextLayout[item.id] = { ...nextLayout[item.id], x: targetX, y: targetY };
          });
          return resolveCollisions(nextLayout, spacers, roomObj.seats || [], roomWidth, roomHeight);
        });
      }

      setShowSelectionMenu(false);
    },
    [
      selectedArrangeIds,
      activeRoomEditingId,
      spacers,
      pushToHistory,
      seatMap,
      visualizerWidths,
      visualizerHeights,
      tempLayout,
      showToast,
    ]
  );

  const alignSelectedSeatsStraight = useCallback(
    (axis: 'horizontal' | 'vertical') => {
      if (selectedArrangeIds.length === 0 || activeRoomEditingId === null) return;

      const hasLocked = selectedArrangeIds.some((id) => {
        const g = getGroupForItem(id, spacers);
        return g && g.locked;
      });
      if (hasLocked) {
        showToast('Cannot align locked items. Please unlock the group first.', 'warning');
        return;
      }

      pushToHistory();
      const roomId = activeRoomEditingId;
      const roomObj = seatMap?.flatMap((f) => f.rooms || []).find((r) => r.id === roomId);
      if (!roomObj) return;

      const roomWidth = visualizerWidths[roomId] || roomObj.canvasWidth || 1000;
      const roomHeight = visualizerHeights[roomId] || roomObj.canvasHeight || 450;

      const selectedSeats = selectedArrangeIds
        .map((id) => {
          const seat = roomObj.seats?.find((s) => s.id === id);
          if (!seat) return null;
          const pos =
            tempLayout[id] ||
            getSeatPixelPosition(seat, roomObj.seats?.indexOf(seat) ?? 0, roomWidth, roomHeight, tempLayout);
          return { id, x: pos.x, y: pos.y };
        })
        .filter(Boolean) as Array<{ id: string; x: number; y: number }>;

      if (selectedSeats.length === 0) return;

      if (axis === 'horizontal') {
        const anchorY = selectedSeats[0].y;
        setTempLayout((prev) => {
          const nextLayout = { ...prev };
          selectedSeats.forEach((item) => {
            nextLayout[item.id] = { ...nextLayout[item.id], y: anchorY };
          });
          return resolveCollisions(nextLayout, spacers, roomObj.seats || [], roomWidth, roomHeight);
        });
      } else {
        const anchorX = selectedSeats[0].x;
        setTempLayout((prev) => {
          const nextLayout = { ...prev };
          selectedSeats.forEach((item) => {
            nextLayout[item.id] = { ...nextLayout[item.id], x: anchorX };
          });
          return resolveCollisions(nextLayout, spacers, roomObj.seats || [], roomWidth, roomHeight);
        });
      }

      setShowSelectionMenu(false);
    },
    [
      selectedArrangeIds,
      activeRoomEditingId,
      spacers,
      pushToHistory,
      seatMap,
      visualizerWidths,
      visualizerHeights,
      tempLayout,
      showToast,
    ]
  );

  const rotateSelectedSeats = useCallback(() => {
    if (selectedArrangeIds.length === 0 || activeRoomEditingId === null) return;

    const hasLocked = selectedArrangeIds.some((id) => {
      const g = getGroupForItem(id, spacers);
      return g && g.locked;
    });
    if (hasLocked) {
      showToast('Cannot rotate locked items. Please unlock the group first.', 'warning');
      return;
    }

    pushToHistory();
    const roomId = activeRoomEditingId;
    const roomObj = seatMap?.flatMap((f) => f.rooms || []).find((r) => r.id === roomId);
    if (!roomObj) return;

    setTempLayout((prev) => {
      const nextLayout = { ...prev };
      selectedArrangeIds.forEach((id) => {
        const seat = roomObj.seats?.find((s) => s.id === id);
        if (seat) {
          const currentSeatLayout = nextLayout[id] || { x: 0, y: 0 };
          const currentRotation =
            currentSeatLayout.rotation !== undefined ? currentSeatLayout.rotation : seat.rotation || 0;
          const nextRotation = (currentRotation + 90) % 360;
          nextLayout[id] = { ...currentSeatLayout, rotation: nextRotation };
        }
      });
      return nextLayout;
    });

    setShowSelectionMenu(false);
  }, [selectedArrangeIds, activeRoomEditingId, spacers, pushToHistory, seatMap, tempLayout, showToast]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, seatId: string) => {
      if (activeRoomEditingId === null) return;
      const roomId = activeRoomEditingId;
      e.preventDefault();

      const snapshot = {
        tempLayout: JSON.parse(JSON.stringify(tempLayout)),
        spacers: JSON.parse(JSON.stringify(spacers)),
        visualizerWidths: { ...visualizerWidths },
        visualizerHeights: { ...visualizerHeights },
      };

      const element = e.currentTarget as HTMLElement;
      element.setPointerCapture(e.pointerId);

      const container = element.parentElement;
      if (!container) return;
      const scrollContainer = container.parentElement;

      const roomObj = seatMap?.flatMap((f) => f.rooms || []).find((r) => r.id === roomId);
      const currentWidth = visualizerWidths[roomId] || roomObj?.canvasWidth || 1000;
      const currentHeight = visualizerHeights[roomId] || roomObj?.canvasHeight || 450;

      const findSeatById = (id: string) => roomObj?.seats?.find((s) => s.id === id);
      const findSeatIndexById = (id: string) => roomObj?.seats?.findIndex((s) => s.id === id) ?? 0;

      const group = getGroupForItem(seatId, spacers);
      const affectedIds = group ? group.memberIds : [seatId];
      const isLocked = group && group.locked;

      let nextSelected = [...selectedArrangeIds];
      const isAlreadySelected = affectedIds.every((id) => nextSelected.includes(id));
      const isModifierPressed = e.shiftKey || e.ctrlKey || e.metaKey;

      if (isModifierPressed) {
        if (isAlreadySelected) {
          nextSelected = nextSelected.filter((id) => !affectedIds.includes(id));
        } else {
          affectedIds.forEach((id) => {
            if (!nextSelected.includes(id)) nextSelected.push(id);
          });
        }
      } else {
        if (!isAlreadySelected || nextSelected.length > affectedIds.length) {
          nextSelected = [...affectedIds];
        }
      }
      setSelectedArrangeIds(nextSelected);

      if (isLocked) return;

      const startPositions: Record<string, { x: number; y: number }> = {};
      nextSelected.forEach((id) => {
        const seat = findSeatById(id);
        if (seat) {
          const pos =
            tempLayout[id] || getSeatPixelPosition(seat, findSeatIndexById(id), currentWidth, currentHeight, tempLayout);
          startPositions[id] = { x: pos.x, y: pos.y };
        } else {
          const spacer = spacers.find((s) => s.id === id);
          if (spacer) {
            startPositions[id] = { x: spacer.x, y: spacer.y };
          }
        }
      });

      const startMouseX = e.clientX;
      const startMouseY = e.clientY;
      let didDrag = false;

      const handlePointerMove = (moveEvent: PointerEvent) => {
        didDrag = true;
        const deltaX = moveEvent.clientX - startMouseX;
        const deltaY = moveEvent.clientY - startMouseY;

        let nextWidth = visualizerWidths[roomId] || roomObj?.canvasWidth || 1000;
        let nextHeight = visualizerHeights[roomId] || roomObj?.canvasHeight || 450;

        nextSelected.forEach((id) => {
          if (startPositions[id]) {
            const leftPx = startPositions[id].x + deltaX;
            const topPx = startPositions[id].y + deltaY;

            let w = 80;
            let h = 80;
            const spacer = spacers.find((s) => s.id === id);
            if (spacer) {
              w = spacer.w || 78;
              h = spacer.h || 78;
            }

            if (leftPx + w + 40 > nextWidth) nextWidth = leftPx + w + 120;
            if (topPx + h + 40 > nextHeight) nextHeight = topPx + h + 120;
          }
        });

        if (nextWidth !== currentWidth) {
          setVisualizerWidths((prev) => ({ ...prev, [roomId]: nextWidth }));
        }
        if (nextHeight !== currentHeight) {
          setVisualizerHeights((prev) => ({ ...prev, [roomId]: nextHeight }));
        }

        const snapPx = 15;
        let updatedSpacers = [...spacers];
        let spacersChanged = false;

        updatedSpacers = spacers.map((sp) => {
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

        if (spacersChanged) setSpacers(updatedSpacers);

        setTempLayout((prev) => {
          const nextLayout = { ...prev };
          nextSelected.forEach((id) => {
            if (startPositions[id] && findSeatById(id)) {
              let leftPx = startPositions[id].x + deltaX;
              let topPx = startPositions[id].y + deltaY;

              leftPx = Math.max(0, Math.min(nextWidth - 80, leftPx));
              topPx = Math.max(60, Math.min(nextHeight - 80, topPx));

              leftPx = Math.round(leftPx / snapPx) * snapPx;
              topPx = Math.round(topPx / snapPx) * snapPx;

              nextLayout[id] = { ...nextLayout[id], x: leftPx, y: topPx };
            }
          });
          return resolveCollisions(nextLayout, updatedSpacers, roomObj?.seats || [], nextWidth, nextHeight);
        });

        if (scrollContainer) {
          const scrollRect = scrollContainer.getBoundingClientRect();
          const rightDiff = moveEvent.clientX - scrollRect.right;
          const leftDiff = moveEvent.clientX - scrollRect.left;
          const bottomDiff = moveEvent.clientY - scrollRect.bottom;
          const topDiff = moveEvent.clientY - scrollRect.top;

          if (rightDiff > -60) scrollContainer.scrollLeft += 15;
          else if (leftDiff < 60) scrollContainer.scrollLeft -= 15;

          if (bottomDiff > -60) scrollContainer.scrollTop += 15;
          else if (topDiff < 60) scrollContainer.scrollTop -= 15;
        }
      };

      const handlePointerUp = (upEvent: PointerEvent) => {
        element.releasePointerCapture(upEvent.pointerId);
        element.removeEventListener('pointermove', handlePointerMove);
        element.removeEventListener('pointerup', handlePointerUp);

        if (!didDrag && !isModifierPressed) {
          setSelectedArrangeIds([seatId]);
        }

        if (didDrag) {
          setLayoutHistory((prev) => [...prev, snapshot]);
        }
      };

      element.addEventListener('pointermove', handlePointerMove);
      element.addEventListener('pointerup', handlePointerUp);
    },
    [
      activeRoomEditingId,
      tempLayout,
      spacers,
      visualizerWidths,
      visualizerHeights,
      seatMap,
      selectedArrangeIds,
    ]
  );

  const handleSpacerPointerDown = useCallback(
    (e: React.PointerEvent, spacerId: string) => {
      if (activeRoomEditingId === null) return;
      const roomId = activeRoomEditingId;
      e.preventDefault();

      const snapshot = {
        tempLayout: JSON.parse(JSON.stringify(tempLayout)),
        spacers: JSON.parse(JSON.stringify(spacers)),
        visualizerWidths: { ...visualizerWidths },
        visualizerHeights: { ...visualizerHeights },
      };

      const element = e.currentTarget as HTMLElement;
      element.setPointerCapture(e.pointerId);

      const container = element.parentElement;
      if (!container) return;
      const scrollContainer = container.parentElement;

      const roomObj = seatMap?.flatMap((f) => f.rooms || []).find((r) => r.id === roomId);
      const currentWidth = visualizerWidths[roomId] || roomObj?.canvasWidth || 1000;
      const currentHeight = visualizerHeights[roomId] || roomObj?.canvasHeight || 450;

      const findSeatById = (id: string) => roomObj?.seats?.find((s) => s.id === id);
      const findSeatIndexById = (id: string) => roomObj?.seats?.findIndex((s) => s.id === id) ?? 0;

      const group = getGroupForItem(spacerId, spacers);
      const affectedIds = group ? group.memberIds : [spacerId];
      const isLocked = group && group.locked;

      let nextSelected = [...selectedArrangeIds];
      const isAlreadySelected = affectedIds.every((id) => nextSelected.includes(id));
      const isModifierPressed = e.shiftKey || e.ctrlKey || e.metaKey;

      if (isModifierPressed) {
        if (isAlreadySelected) {
          nextSelected = nextSelected.filter((id) => !affectedIds.includes(id));
        } else {
          affectedIds.forEach((id) => {
            if (!nextSelected.includes(id)) nextSelected.push(id);
          });
        }
      } else {
        if (!isAlreadySelected || nextSelected.length > affectedIds.length) {
          nextSelected = [...affectedIds];
        }
      }
      setSelectedArrangeIds(nextSelected);

      if (isLocked) return;

      const startPositions: Record<string, { x: number; y: number }> = {};
      nextSelected.forEach((id) => {
        const seat = findSeatById(id);
        if (seat) {
          const pos =
            tempLayout[id] || getSeatPixelPosition(seat, findSeatIndexById(id), currentWidth, currentHeight, tempLayout);
          startPositions[id] = { x: pos.x, y: pos.y };
        } else {
          const spacer = spacers.find((s) => s.id === id);
          if (spacer) {
            startPositions[id] = { x: spacer.x, y: spacer.y };
          }
        }
      });

      const startMouseX = e.clientX;
      const startMouseY = e.clientY;
      let didDrag = false;

      const handlePointerMove = (moveEvent: PointerEvent) => {
        didDrag = true;
        const deltaX = moveEvent.clientX - startMouseX;
        const deltaY = moveEvent.clientY - startMouseY;

        let nextWidth = visualizerWidths[roomId] || roomObj?.canvasWidth || 1000;
        let nextHeight = visualizerHeights[roomId] || roomObj?.canvasHeight || 450;

        nextSelected.forEach((id) => {
          if (startPositions[id]) {
            const leftPx = startPositions[id].x + deltaX;
            const topPx = startPositions[id].y + deltaY;

            let w = 80;
            let h = 80;
            const spacer = spacers.find((s) => s.id === id);
            if (spacer) {
              w = spacer.w || 78;
              h = spacer.h || 78;
            }

            if (leftPx + w + 40 > nextWidth) nextWidth = leftPx + w + 120;
            if (topPx + h + 40 > nextHeight) nextHeight = topPx + h + 120;
          }
        });

        if (nextWidth !== currentWidth) {
          setVisualizerWidths((prev) => ({ ...prev, [roomId]: nextWidth }));
        }
        if (nextHeight !== currentHeight) {
          setVisualizerHeights((prev) => ({ ...prev, [roomId]: nextHeight }));
        }

        const snapPx = 15;
        let updatedSpacers = [...spacers];
        let spacersChanged = false;

        updatedSpacers = spacers.map((sp) => {
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

        if (spacersChanged) setSpacers(updatedSpacers);

        setTempLayout((prev) => {
          const nextLayout = { ...prev };
          nextSelected.forEach((id) => {
            if (startPositions[id] && findSeatById(id)) {
              let leftPx = startPositions[id].x + deltaX;
              let topPx = startPositions[id].y + deltaY;

              leftPx = Math.max(0, Math.min(nextWidth - 80, leftPx));
              topPx = Math.max(60, Math.min(nextHeight - 80, topPx));

              leftPx = Math.round(leftPx / snapPx) * snapPx;
              topPx = Math.round(topPx / snapPx) * snapPx;

              nextLayout[id] = { ...nextLayout[id], x: leftPx, y: topPx };
            }
          });
          return resolveCollisions(nextLayout, updatedSpacers, roomObj?.seats || [], nextWidth, nextHeight);
        });

        if (scrollContainer) {
          const scrollRect = scrollContainer.getBoundingClientRect();
          const rightDiff = moveEvent.clientX - scrollRect.right;
          const leftDiff = moveEvent.clientX - scrollRect.left;
          const bottomDiff = moveEvent.clientY - scrollRect.bottom;
          const topDiff = moveEvent.clientY - scrollRect.top;

          if (rightDiff > -60) scrollContainer.scrollLeft += 15;
          else if (leftDiff < 60) scrollContainer.scrollLeft -= 15;

          if (bottomDiff > -60) scrollContainer.scrollTop += 15;
          else if (topDiff < 60) scrollContainer.scrollTop -= 15;
        }
      };

      const handlePointerUp = (upEvent: PointerEvent) => {
        element.releasePointerCapture(upEvent.pointerId);
        element.removeEventListener('pointermove', handlePointerMove);
        element.removeEventListener('pointerup', handlePointerUp);

        if (didDrag) {
          setLayoutHistory((prev) => [...prev, snapshot]);
        }
      };

      element.addEventListener('pointermove', handlePointerMove);
      element.addEventListener('pointerup', handlePointerUp);
    },
    [
      activeRoomEditingId,
      tempLayout,
      spacers,
      visualizerWidths,
      visualizerHeights,
      seatMap,
      selectedArrangeIds,
    ]
  );

  const handleResizePointerDown = useCallback(
    (e: React.PointerEvent, spacerId: string) => {
      e.preventDefault();
      e.stopPropagation();

      const handleElement = e.currentTarget as HTMLElement;
      handleElement.setPointerCapture(e.pointerId);

      const spacerElement = handleElement.parentElement;
      if (!spacerElement) return;

      const startRect = spacerElement.getBoundingClientRect();
      const startWidth = startRect.width;
      const startHeight = startRect.height;
      const startX = e.clientX;
      const startY = e.clientY;

      const snapshot = {
        tempLayout: JSON.parse(JSON.stringify(tempLayout)),
        spacers: JSON.parse(JSON.stringify(spacers)),
        visualizerWidths: { ...visualizerWidths },
        visualizerHeights: { ...visualizerHeights },
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

        const roomObj = activeRoomEditingId
          ? seatMap?.flatMap((f) => f.rooms || []).find((r) => r.id === activeRoomEditingId)
          : null;

        setSpacers((prev) => {
          const nextSpacers = prev.map((s) => (s.id === spacerId ? { ...s, w: newWidth, h: newHeight } : s));
          if (roomObj) {
            const roomW = visualizerWidths[roomObj.id] || roomObj.canvasWidth || 1000;
            const roomH = visualizerHeights[roomObj.id] || roomObj.canvasHeight || 450;
            setTempLayout((currentTemp) =>
              resolveCollisions(currentTemp, nextSpacers, roomObj.seats || [], roomW, roomH)
            );
          }
          return nextSpacers;
        });
      };

      const handlePointerUp = (upEvent: PointerEvent) => {
        handleElement.releasePointerCapture(upEvent.pointerId);
        handleElement.removeEventListener('pointermove', handlePointerMove);
        handleElement.removeEventListener('pointerup', handlePointerUp);

        if (didDrag) {
          setLayoutHistory((prev) => [...prev, snapshot]);
        }
      };

      handleElement.addEventListener('pointermove', handlePointerMove);
      handleElement.addEventListener('pointerup', handlePointerUp);
    },
    [activeRoomEditingId, tempLayout, spacers, visualizerWidths, visualizerHeights, seatMap]
  );

  const handleCanvasPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (activeRoomEditingId === null) return;
      if (e.target !== e.currentTarget) return;

      setShowSelectionMenu(false);
      e.preventDefault();
      const container = e.currentTarget as HTMLElement;
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

        const boxX = Math.min(startX, currentX);
        const boxY = Math.min(startY, currentY);
        const boxW = Math.abs(startX - currentX);
        const boxH = Math.abs(startY - currentY);

        const roomId = activeRoomEditingId;
        const roomObj = seatMap?.flatMap((f) => f.rooms || []).find((r) => r.id === roomId);
        if (!roomObj) return;

        const roomWidth = visualizerWidths[roomId] || roomObj.canvasWidth || 1000;
        const roomHeight = visualizerHeights[roomId] || roomObj.canvasHeight || 450;

        const intersectingIds: string[] = [];
        roomObj.seats?.forEach((seat, idx) => {
          const pos = getSeatPixelPosition(seat, idx, roomWidth, roomHeight, tempLayout);
          const seatW = 78;
          const seatH = 78;

          const overlapX = Math.max(0, Math.min(pos.x + seatW, boxX + boxW) - Math.max(pos.x, boxX));
          const overlapY = Math.max(0, Math.min(pos.y + seatH, boxY + boxH) - Math.max(pos.y, boxY));

          if (overlapX > 0 && overlapY > 0) {
            intersectingIds.push(seat.id);
          }
        });

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

        const groups = getRoomGroups(spacers);
        const expandedIds = new Set<string>();
        intersectingIds.forEach((id) => {
          expandedIds.add(id);
          const group = groups.find((g: LayoutGroup) => g.memberIds.includes(id));
          if (group) {
            group.memberIds.forEach((mId: string) => expandedIds.add(mId));
          }
        });
        const finalSelected = Array.from(expandedIds);

        if (isModifier) {
          const union = new Set([...initialSelection, ...finalSelected]);
          setSelectedArrangeIds(Array.from(union));
        } else {
          setSelectedArrangeIds(finalSelected);
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
    },
    [activeRoomEditingId, seatMap, visualizerWidths, visualizerHeights, tempLayout, spacers, selectedArrangeIds]
  );

  const handleCreateDeskLayout = useCallback(async () => {
    if (deskSeatCount === '' || Number(deskSeatCount) <= 0) {
      showToast('Please enter a valid number of seats (greater than 0).', 'error');
      return;
    }
    if (deskStartSeat === '' || Number(deskStartSeat) <= 0) {
      showToast('Please enter a valid starting seat number (greater than 0).', 'error');
      return;
    }
    const room = seatMap?.flatMap((f) => f.rooms || []).find((r) => r.id === activeRoomEditingId);
    if (!room) return;

    const N = Number(deskSeatCount);
    const S = Number(deskStartSeat);
    const E = S + N - 1;

    const missingSeatNumbers: string[] = [];
    for (let i = S; i <= E; i++) {
      const numStr = i.toString();
      const exists = room.seats?.some((s) => (s.number || s.seatNumber) === numStr);
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

      let updatedRoom: Room | null = null;
      refetchResult.data?.forEach((floor: Floor) => {
        floor.rooms?.forEach((rm) => {
          if (rm.id === room.id) {
            updatedRoom = rm;
          }
        });
      });
      if (!updatedRoom) updatedRoom = room;

      const selectedSeats = (updatedRoom.seats || []).filter((s) => {
        const num = parseInt(s.number || s.seatNumber || '', 10);
        return !isNaN(num) && num >= S && num <= E;
      });
      selectedSeats.sort(
        (a, b) =>
          parseInt(a.number || a.seatNumber || '0', 10) - parseInt(b.number || b.seatNumber || '0', 10)
      );

      if (selectedSeats.length === 0) {
        showToast('Could not locate seats in range.', 'error');
        return;
      }

      const deskX = 150;
      const deskY = 180;
      const deskH = 24;
      const cols = deskLayoutType === 'one_side' ? N : Math.ceil(N / 2);
      const deskW = cols * 78 + (cols - 1) * 12;

      const deskSpacerId = `spacer-desk-${Date.now()}`;
      const deskSpacer: LayoutSpacer = {
        id: deskSpacerId,
        x: deskX,
        y: deskY,
        w: deskW,
        h: deskH,
        type: 'desk',
      };

      pushToHistory();
      setSpacers((prev) => {
        const nextSpacers = [...prev, deskSpacer];
        setTempLayout((currentTemp) => {
          const nextLayout = { ...currentTemp };
          selectedSeats.forEach((seat, idx) => {
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
          const roomW = visualizerWidths[updatedRoom!.id] || updatedRoom!.canvasWidth || 1000;
          const roomH = visualizerHeights[updatedRoom!.id] || updatedRoom!.canvasHeight || 450;
          return resolveCollisions(nextLayout, nextSpacers, updatedRoom!.seats || [], roomW, roomH);
        });
        return nextSpacers;
      });

      showToast('Desk layout created successfully!', 'success');
      setOpenAddDesk(false);
    } catch (err: any) {
      showToast(err?.message || 'Failed to create desk layout', 'error');
    }
  }, [
    deskSeatCount,
    deskStartSeat,
    seatMap,
    activeRoomEditingId,
    deskLayoutType,
    showToast,
    addSeat,
    refetchSeatMap,
    pushToHistory,
    visualizerWidths,
    visualizerHeights,
  ]);

  const handleSeatNumberSwap = useCallback(
    (sourceSeatId: string, targetNumber: string) => {
      setEditingSeatId(null);
      const trimmedNumber = targetNumber.trim();
      if (!trimmedNumber) return;

      const roomId = activeRoomEditingId;
      if (!roomId) return;

      pushToHistory();

      const roomObj = seatMap?.flatMap((f) => f.rooms || []).find((r) => r.id === roomId);
      if (!roomObj) return;

      const sourceSeat = roomObj.seats?.find((s) => s.id === sourceSeatId);
      if (!sourceSeat) return;

      if ((sourceSeat.number || sourceSeat.seatNumber) === trimmedNumber) return;

      const targetSeat = roomObj.seats?.find(
        (s) => (s.number || s.seatNumber || '').toLowerCase() === trimmedNumber.toLowerCase()
      );

      if (!targetSeat) {
        showToast(`Seat number "${trimmedNumber}" not found in this room!`, 'error');
        return;
      }

      const roomWidth = visualizerWidths[roomId] || roomObj.canvasWidth || 1000;
      const roomHeight = visualizerHeights[roomId] || roomObj.canvasHeight || 450;

      const sourceIdx = roomObj.seats?.indexOf(sourceSeat) ?? 0;
      const targetIdx = roomObj.seats?.indexOf(targetSeat) ?? 0;

      const sourcePos =
        tempLayout[sourceSeat.id] || getSeatPixelPosition(sourceSeat, sourceIdx, roomWidth, roomHeight, tempLayout);
      const targetPos =
        tempLayout[targetSeat.id] || getSeatPixelPosition(targetSeat, targetIdx, roomWidth, roomHeight, tempLayout);

      setTempLayout((prev) => {
        const nextLayout = {
          ...prev,
          [sourceSeat.id]: {
            ...prev[sourceSeat.id],
            x: targetPos.x,
            y: targetPos.y,
          },
          [targetSeat.id]: {
            ...prev[targetSeat.id],
            x: sourcePos.x,
            y: sourcePos.y,
          },
        };
        return resolveCollisions(nextLayout, spacers, roomObj.seats || [], roomWidth, roomHeight);
      });

      showToast(
        `Swapped positions of Seat ${sourceSeat.number || sourceSeat.seatNumber} and Seat ${targetSeat.number || targetSeat.seatNumber}!`,
        'success'
      );
    },
    [activeRoomEditingId, seatMap, pushToHistory, visualizerWidths, visualizerHeights, tempLayout, spacers, showToast]
  );

  return {
    isFloorVisualization,
    setIsFloorVisualization,
    activeRoomEditingId,
    setActiveRoomEditingId,
    tempLayout,
    setTempLayout,
    spacers,
    setSpacers,
    selectedArrangeIds,
    setSelectedArrangeIds,
    showSelectionMenu,
    setShowSelectionMenu,
    visualizerWidths,
    setVisualizerWidths,
    visualizerHeights,
    setVisualizerHeights,
    dragSelectStart,
    dragSelectEnd,
    editingSeatId,
    setEditingSeatId,
    editingSeatNumber,
    setEditingSeatNumber,
    openAddDesk,
    setOpenAddDesk,
    deskSeatCount,
    setDeskSeatCount,
    deskLayoutType,
    setDeskLayoutType,
    deskStartSeat,
    setDeskStartSeat,
    layoutHistory,
    setLayoutHistory,
    pushToHistory,
    handleUndo,
    initRoomArranging,
    handleCancelArranging,
    handleAddSpacer,
    handleArrangeAscending,
    handleSaveLayout,
    handleGroupAndLock,
    handleUngroup,
    handleToggleLock,
    alignSelectedSeats,
    alignSelectedSeatsStraight,
    rotateSelectedSeats,
    handlePointerDown,
    handleSpacerPointerDown,
    handleResizePointerDown,
    handleCanvasPointerDown,
    handleCreateDeskLayout,
    handleSeatNumberSwap,
  };
}
