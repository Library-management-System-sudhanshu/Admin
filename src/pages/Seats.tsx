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
  useAddFloorMutation,
  useAddRoomMutation,
  useAddSeatMutation,
  useDeleteFloorMutation,
  useDeleteRoomMutation,
  useDeleteSeatMutation,
  useVacateSeatMutation,
  useUpdateSeatStatusMutation,
  useUpdateFloorMutation,
} from '../store/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { useAlert } from '../components/ui/AlertContext';
import '../components/ui/Globals.css';
import {
  Plus,
  ArrowRightLeft,
  Layers,
  DoorOpen,
  Trash2,
  Loader2,
  Search,
  ChevronDown,
  Edit2
} from 'lucide-react';

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

  // Navigation states
  const [activeFloorTab, setActiveFloorTab] = useState(0);

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
  const [durationMode, setDurationMode] = useState<number>(0); // 0 = 1 MO, 1 = 3 MO, 2 = Flex

  useEffect(() => {
    if (durationMode === 2) { // Flex
      return;
    }
    if (startDate) {
      const months = durationMode === 0 ? 1 : durationMode === 1 ? 3 : 0;
      if (months > 0) {
        const date = new Date(startDate);
        if (!isNaN(date.getTime())) {
          date.setMonth(date.getMonth() + months);
          setEndDate(date.toISOString().split('T')[0]);
        }
      }
    } else {
      setEndDate('');
    }
  }, [startDate, durationMode]);

  // Transfer forms
  const [targetSeatId, setTargetSeatId] = useState('');

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

  const [allocateSeat, { isLoading: isAllocating }] = useAllocateSeatMutation();
  const [transferSeat, { isLoading: isTransferring }] = useTransferSeatMutation();
  const [vacateSeat, { isLoading: isVacating }] = useVacateSeatMutation();
  const [addFloor] = useAddFloorMutation();
  const [addRoom] = useAddRoomMutation();
  const [addSeat] = useAddSeatMutation();
  const [deleteFloor] = useDeleteFloorMutation();
  const [deleteRoom] = useDeleteRoomMutation();
  const [deleteSeat] = useDeleteSeatMutation();
  const [updateSeatStatus] = useUpdateSeatStatusMutation();
  const [updateFloor] = useUpdateFloorMutation();

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
      setDurationMode(0);
    } else {
      const today = new Date().toISOString().split('T')[0];
      setStartDate(today);
      if (shifts && shifts.length > 0) {
        setShiftId(shifts[0].id);
      }
    }
  }, [openAllocate, shifts]);

  const handleSeatClick = (seat: any) => {
    setSelectedSeat(seat);
    if (seat.status === 'AVAILABLE') {
      setOpenAllocate(true);
    } else if (seat.status === 'OCCUPIED') {
      setOpenTransfer(true);
    } else if (seat.status === 'BLOCKED') {
      setOpenMaintenance(true);
    }
  };

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
      setOpenAllocate(false);
      setStudentProfileId('');
      setShiftId('');
      setStartDate('');
      setEndDate('');
    } catch (err) {
      showAlert('Seat allocation failed');
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

  const currentFloor = seatMap?.[activeFloorTab];

  return (
    <div style={{ width: '100%' }}>      {/* Header & Controls in one sleek row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <h1 className="page-title" style={{ margin: 0 }}>Interactive Seat Map</h1>
            
            <select
              className="custom-input"
              value={selectedBranch}
              onChange={(e) => {
                setSelectedBranch(e.target.value);
                setActiveFloorTab(0);
              }}
              style={{ width: '200px', marginBottom: 0, padding: '0.4rem 0.75rem', fontSize: '0.875rem' }}
            >
              <option value="" disabled>Select Branch</option>
              {branches?.map((b: any) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>

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
            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem', padding: '1rem 1.5rem', background: 'var(--bg-surface)', borderRadius: '0.75rem', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Total Seats</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>{seatCounts.total}</span>
              </div>
              <div style={{ width: '1px', backgroundColor: 'var(--border-color)' }} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 600, textTransform: 'uppercase' }}>Available</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--success)' }}>{seatCounts.available}</span>
              </div>
              <div style={{ width: '1px', backgroundColor: 'var(--border-color)' }} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600, textTransform: 'uppercase' }}>Occupied</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>{seatCounts.occupied}</span>
              </div>
              <div style={{ width: '1px', backgroundColor: 'var(--border-color)' }} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Maintenance</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-muted)' }}>{seatCounts.maintenance}</span>
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
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
            {currentFloor?.rooms.map((room: any) => (
              <Card key={room.id} elevation="sm" style={{ padding: '1.5rem', border: '1px solid var(--border-color)' }}>
                
                {/* Room Header & Actions */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ padding: '0.5rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '0.5rem' }}>
                      <DoorOpen size={20} color="var(--primary)" />
                    </div>
                    <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>{room.name}</h3>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', background: 'var(--bg-main)', padding: '0.25rem 0.6rem', borderRadius: '1rem', border: '1px solid var(--border-color)' }}>
                      {room.seats?.length || 0} Seats
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
                      onClick={() => handleDeleteRoom(room.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.5rem', display: 'flex', alignItems: 'center', borderRadius: '0.25rem' }}
                      title="Delete Room"
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Clean, Modern White Seats Grid */}
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  {[...(room.seats || [])].sort((a: any, b: any) => a.number.localeCompare(b.number, undefined, { numeric: true })).map((seat: any) => {
                    const style = getSeatStyle(seat.status);
                    const isOccupied = seat.status === 'OCCUPIED';
                    const allocation = seat.allocations?.find((a: any) => a.isActive);

                    const tooltipText = isOccupied && allocation
                      ? `Occupant: ${allocation.studentProfile?.user?.name || 'N/A'} (${allocation.shift?.name || 'N/A'})`
                      : seat.status === 'BLOCKED' ? `Seat ${seat.number} (Maintenance)` : `Seat ${seat.number} (${seat.status.toLowerCase()})`;

                    return (
                      <div
                        key={seat.id}
                        title={tooltipText}
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
                          boxShadow: 'var(--shadow-sm)',
                          transition: 'all 0.15s ease',
                          position: 'relative'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                        }}
                      >
                        <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: isOccupied && allocation ? '0.15rem' : '0' }}>
                          {seat.number}
                        </span>
                        {isOccupied && allocation && (
                          <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '64px', textAlign: 'center' }}>
                            {allocation.studentProfile?.user?.name?.split(' ')[0] || 'N/A'}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Allocation Modal */}
      <Modal
        isOpen={openAllocate}
        onClose={() => setOpenAllocate(false)}
        title={`Allocate Seat ${selectedSeat?.number}`}
        maxWidth="sm"
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
                  <select
                    className="custom-input"
                    required
                    value={shiftId}
                    onChange={(e) => setShiftId(e.target.value)}
                    style={{
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      padding: '0.625rem 0.75rem',
                      borderColor: '#cbd5e1',
                      color: '#0f172a',
                      height: '38px',
                    }}
                  >
                    <option value="" disabled>Select shift</option>
                    {shifts.map((shift: any) => (
                      <option key={shift.id} value={shift.id}>
                        {shift.name} ({shift.startTime} - {shift.endTime})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Duration Segmented Control */}
              <div>
                <label className="custom-input-label" style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', color: '#475569', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>
                  Duration
                </label>
                <div style={{
                  display: 'flex',
                  border: '1px solid #cbd5e1',
                  borderRadius: '0.5rem',
                  overflow: 'hidden',
                  height: '38px',
                }}>
                  {[
                    { label: '1 MO', val: 0 },
                    { label: '3 MO', val: 1 },
                    { label: 'Flex', val: 2 },
                  ].map((item, idx) => {
                    const isSelected = durationMode === item.val;
                    return (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => setDurationMode(item.val)}
                        style={{
                          flex: 1,
                          border: 'none',
                          background: isSelected ? '#2f2fd1' : '#ffffff',
                          color: isSelected ? '#ffffff' : '#0f172a',
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          borderRight: idx < 2 ? '1px solid #cbd5e1' : 'none',
                        }}
                      >
                        {item.label}
                      </button>
                    );
                  })}
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
                    disabled={durationMode !== 2}
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
                      backgroundColor: durationMode !== 2 ? '#f1f5f9' : '#ffffff',
                      cursor: durationMode !== 2 ? 'not-allowed' : 'text',
                    }}
                  />
                </div>
              </div>
            </div>
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
                isLoading={isAllocating}
                disabled={!studentProfileId || !shiftId || !startDate || !endDate}
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

      {/* Transfer Modal */}
      <Modal
        isOpen={openTransfer}
        onClose={() => setOpenTransfer(false)}
        title={`Manage Occupied Seat ${selectedSeat?.number}`}
        maxWidth="sm"
      >
        <form onSubmit={handleTransfer}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <p className="text-muted" style={{ margin: '0 0 0.25rem 0' }}>Current Occupant:</p>
              <h4 style={{ margin: 0, fontWeight: 600 }}>
                {selectedSeat?.allocations?.find((a: any) => a.isActive)?.studentProfile?.user?.name}
              </h4>
            </div>

            <div>
              <label className="custom-input-label">Transfer to Vacant Seat</label>
              <select className="custom-input" required value={targetSeatId} onChange={(e) => setTargetSeatId(e.target.value)}>
                <option value="" disabled>Select target seat</option>
                {currentFloor?.rooms.flatMap((r: any) => r.seats).filter((s: any) => s.status === 'AVAILABLE').map((s: any) => (
                  <option key={s.id} value={s.id}>
                    Room: {currentFloor.rooms.find((rm: any) => rm.seats.some((seat: any) => seat.id === s.id))?.name} | Seat: {s.number}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
            <Button type="button" variant="text" onClick={() => setOpenTransfer(false)}>Close</Button>
            <Button type="button" variant="text" style={{ color: 'var(--danger)' }} onClick={handleVacateSeat} isLoading={isVacating}>Vacate Seat</Button>
            <Button type="submit" variant="primary" isLoading={isTransferring} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ArrowRightLeft size={16} /> Transfer
            </Button>
          </div>
        </form>
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
                <select className="custom-input" required value={parentId} onChange={(e) => setParentId(e.target.value)}>
                  <option value="" disabled>Select floor</option>
                  {seatMap.map((f: any) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
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
                <select className="custom-input" required value={parentId} onChange={(e) => setParentId(e.target.value)}>
                  <option value="" disabled>Select room</option>
                  {currentFloor.rooms.map((r: any) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
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
    </div>
  );
}

