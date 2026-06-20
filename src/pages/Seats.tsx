import React, { useState, useEffect } from 'react';
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
} from '../store/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import '../components/ui/Globals.css';
import {
  Plus,
  Armchair,
  ArrowRightLeft,
  Layers,
  DoorOpen,
  Trash2,
  Loader2
} from 'lucide-react';

export default function Seats() {
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
  const [shiftId, setShiftId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [durationMode, setDurationMode] = useState<number>(0); // 0 = 1 Month, 1 = 2 Months, 2 = 3 Months, 3 = Calendar

  useEffect(() => {
    if (durationMode === 3) {
      return;
    }
    if (startDate) {
      const months = durationMode === 0 ? 1 : durationMode === 1 ? 2 : durationMode === 2 ? 3 : 0;
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
  const [creatorName, setCreatorName] = useState('');
  const [parentId, setParentId] = useState('');

  const [allocateSeat, { isLoading: isAllocating }] = useAllocateSeatMutation();
  const [transferSeat, { isLoading: isTransferring }] = useTransferSeatMutation();
  const [addFloor] = useAddFloorMutation();
  const [addRoom] = useAddRoomMutation();
  const [addSeat] = useAddSeatMutation();
  const [deleteFloor] = useDeleteFloorMutation();
  const [deleteRoom] = useDeleteRoomMutation();
  const [deleteSeat] = useDeleteSeatMutation();

  useEffect(() => {
    if (branches && branches.length > 0 && !selectedBranch) {
      setSelectedBranch(branches[0].id);
    }
  }, [branches, selectedBranch]);

  const handleSeatClick = (seat: any) => {
    setSelectedSeat(seat);
    if (seat.status === 'AVAILABLE') {
      setDurationMode(0);
      setStartDate(new Date().toISOString().split('T')[0]);
      setOpenAllocate(true);
    } else if (seat.status === 'OCCUPIED') {
      setOpenTransfer(true);
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
      alert('Seat allocation failed');
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
      alert('Seat transfer failed');
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
      alert('Creation failed');
    }
  };

  const handleDeleteFloor = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this floor and all its rooms and seats?')) return;
    try {
      await deleteFloor(id).unwrap();
      setActiveFloorTab(0);
    } catch (err: any) {
      alert(err.data?.message || 'Failed to delete floor');
    }
  };

  const handleDeleteRoom = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this room and all its seats?')) return;
    try {
      await deleteRoom(id).unwrap();
    } catch (err: any) {
      alert(err.data?.message || 'Failed to delete room');
    }
  };

  const handleDeleteSeat = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this seat?')) return;
    try {
      await deleteSeat(id).unwrap();
      setOpenAllocate(false);
    } catch (err: any) {
      alert(err.data?.message || 'Failed to delete seat');
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
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>
          Interactive Seat Map
        </h1>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button
            variant="outline"
            onClick={() => {
              setCreatorType('floor');
              setOpenCreator(true);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Layers size={18} /> Add Floor
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setCreatorType('room');
              setOpenCreator(true);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <DoorOpen size={18} /> Add Room
          </Button>
          <Button
            style={{ backgroundColor: '#fca311', color: '#14213d', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            onClick={() => {
              setCreatorType('seat');
              setOpenCreator(true);
            }}
          >
            <Plus size={18} /> Add Seat
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <Card elevation="sm" style={{ padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ width: '220px' }}>
          <select 
            className="custom-input" 
            value={selectedBranch} 
            onChange={(e) => {
              setSelectedBranch(e.target.value);
              setActiveFloorTab(0);
            }}
            style={{ marginBottom: 0 }}
          >
            <option value="" disabled>Select Branch</option>
            {branches?.map((b: any) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>

        {/* Legend Key */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--success)' }} />
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Available</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--primary)' }} />
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Occupied</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--warning)' }} />
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Reserved</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--text-muted)' }} />
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Blocked</span>
          </div>
        </div>
      </Card>

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
          {/* Floor Tabs */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            borderBottom: '1px solid var(--border-color)', 
            marginBottom: '1.5rem',
            paddingBottom: '0.5rem'
          }}>
            <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto' }}>
              {seatMap.map((floor: any, idx: number) => (
                <button
                  key={floor.id}
                  onClick={() => setActiveFloorTab(idx)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'none',
                    border: 'none',
                    borderBottom: activeFloorTab === idx ? '2px solid var(--primary)' : '2px solid transparent',
                    color: activeFloorTab === idx ? 'var(--primary)' : 'var(--text-secondary)',
                    fontWeight: activeFloorTab === idx ? 600 : 500,
                    cursor: 'pointer',
                    fontSize: '1rem',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  {floor.name}
                </button>
              ))}
            </div>
            {currentFloor && (
              <Button variant="text" style={{ color: 'var(--danger)' }} onClick={() => handleDeleteFloor(currentFloor.id)}>
                <Trash2 size={16} style={{ marginRight: '0.5rem' }} /> Delete Floor
              </Button>
            )}
          </div>

          {/* Rooms Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {currentFloor?.rooms.map((room: any) => (
              <Card key={room.id} elevation="sm" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <DoorOpen color="var(--primary)" />
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>{room.name}</h3>
                    <button 
                      className="icon-btn danger" 
                      onClick={() => handleDeleteRoom(room.id)}
                      title="Delete Room"
                      style={{ marginLeft: '0.5rem' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setParentId(room.id);
                      setCreatorType('seat');
                      setOpenCreator(true);
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    <Plus size={16} /> Add Seat
                  </Button>
                </div>

                {/* Clean, Modern White Seats Grid */}
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  {[...(room.seats || [])].sort((a: any, b: any) => a.number.localeCompare(b.number, undefined, { numeric: true })).map((seat: any) => {
                    const style = getSeatStyle(seat.status);
                    const isOccupied = seat.status === 'OCCUPIED';
                    const allocation = seat.allocations?.find((a: any) => a.isActive);
                    
                    const tooltipText = isOccupied && allocation 
                      ? `Occupant: ${allocation.studentProfile?.user?.name || 'N/A'} (${allocation.shift?.name || 'N/A'})`
                      : `Seat ${seat.number} (${seat.status.toLowerCase()})`;

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
                        <Armchair size={24} color={style.iconColor} style={{ marginBottom: '0.25rem' }} />
                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {seat.number}
                        </span>
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
            {(!studentsData?.students || studentsData.students.length === 0) ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '1.5rem', border: '1px dashed var(--border-color)', borderRadius: '0.5rem', backgroundColor: 'var(--bg-surface-hover)' }}>
                <p className="text-muted" style={{ margin: 0 }}>No unallocated students available.</p>
                <Button variant="outline" size="sm" onClick={() => navigate('/students')} type="button">
                  <Plus size={16} style={{ marginRight: '0.25rem' }} /> Add Student
                </Button>
              </div>
            ) : (
              <div>
                <label className="custom-input-label">Select Student</label>
                <select className="custom-input" required value={studentProfileId} onChange={(e) => setStudentProfileId(e.target.value)}>
                  <option value="" disabled>Select a student</option>
                  {studentsData.students.map((student: any) => (
                    <option key={student.id} value={student.id}>{student.user?.name}</option>
                  ))}
                </select>
              </div>
            )}

            {(!shifts || shifts.length === 0) ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '1.5rem', border: '1px dashed var(--border-color)', borderRadius: '0.5rem', backgroundColor: 'var(--bg-surface-hover)' }}>
                <p className="text-muted" style={{ margin: 0 }}>No shifts configured.</p>
                <Button variant="outline" size="sm" onClick={() => navigate('/settings')} type="button">
                  <Plus size={16} style={{ marginRight: '0.25rem' }} /> Add Shift
                </Button>
              </div>
            ) : (
              <div>
                <label className="custom-input-label">Select Shift</label>
                <select className="custom-input" required value={shiftId} onChange={(e) => setShiftId(e.target.value)}>
                  <option value="" disabled>Select a shift</option>
                  {shifts.map((shift: any) => (
                    <option key={shift.id} value={shift.id}>{shift.name} ({shift.startTime} - {shift.endTime})</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="custom-input-label">Duration</label>
              <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1rem', paddingBottom: '0.5rem' }}>
                {['1 Month', '2 Months', '3 Months', 'Calendar'].map((label, idx) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setDurationMode(idx)}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: '0.25rem 0.75rem',
                      fontSize: '0.875rem',
                      fontWeight: durationMode === idx ? 600 : 500,
                      color: durationMode === idx ? 'var(--primary)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      borderBottom: durationMode === idx ? '2px solid var(--primary)' : '2px solid transparent',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Input
                label="Start Date"
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              {durationMode === 3 && (
                <Input
                  label="End Date"
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              )}
            </div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
            <Button type="button" variant="text" style={{ color: 'var(--danger)' }} onClick={() => handleDeleteSeat(selectedSeat?.id)}>
              Delete Seat
            </Button>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <Button type="button" variant="text" onClick={() => setOpenAllocate(false)}>Cancel</Button>
              <Button type="submit" variant="primary" isLoading={isAllocating}>Allocate</Button>
            </div>
          </div>
        </form>
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
    </div>
  );
}

