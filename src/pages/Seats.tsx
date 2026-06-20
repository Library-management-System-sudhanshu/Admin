import React, { useState } from 'react';
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
import {
  Box,
  Typography,
  Card,
  Tabs,
  Tab,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Paper,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  AirlineSeatReclineNormal as SeatIcon,
  SwapHoriz as TransferIcon,
  Layers as FloorIcon,
  MeetingRoom as RoomIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

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

  // Transfer forms
  const [targetSeatId, setTargetSeatId] = useState('');

  // Creator forms
  const [openCreator, setOpenCreator] = useState(false);
  const [creatorType, setCreatorType] = useState<'floor' | 'room' | 'seat'>('floor');
  const [creatorName, setCreatorName] = useState('');
  const [parentId, setParentId] = useState(''); // floorId or roomId

  const [allocateSeat, { isLoading: isAllocating }] = useAllocateSeatMutation();
  const [transferSeat, { isLoading: isTransferring }] = useTransferSeatMutation();
  const [addFloor] = useAddFloorMutation();
  const [addRoom] = useAddRoomMutation();
  const [addSeat] = useAddSeatMutation();
  const [deleteFloor] = useDeleteFloorMutation();
  const [deleteRoom] = useDeleteRoomMutation();
  const [deleteSeat] = useDeleteSeatMutation();

  // Set default branch when loaded
  React.useEffect(() => {
    if (branches && branches.length > 0 && !selectedBranch) {
      setSelectedBranch(branches[0].id);
    }
  }, [branches, selectedBranch]);

  const handleSeatClick = (seat: any) => {
    setSelectedSeat(seat);
    if (seat.status === 'AVAILABLE') {
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

  const getSeatColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return { bg: '#D1FAE5', border: '#10B981', text: '#065F46' };
      case 'OCCUPIED':
        return { bg: '#DBEAFE', border: '#2563EB', text: '#1E3A8A' };
      case 'RESERVED':
        return { bg: '#FEF3C7', border: '#F59E0B', text: '#78350F' };
      default:
        return { bg: '#F3F4F6', border: '#9CA3AF', text: '#374151' };
    }
  };

  const currentFloor = seatMap?.[activeFloorTab];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#0F172A' }}>
          Interactive Seat Map
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<FloorIcon />}
            onClick={() => {
              setCreatorType('floor');
              setOpenCreator(true);
            }}
          >
            Add Floor
          </Button>
          <Button
            variant="contained"
            startIcon={<RoomIcon />}
            onClick={() => {
              setCreatorType('room');
              setOpenCreator(true);
            }}
          >
            Add Room
          </Button>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<AddIcon />}
            onClick={() => {
              setCreatorType('seat');
              setOpenCreator(true);
            }}
          >
            Add Seat
          </Button>
        </Box>
      </Box>

      {/* Toolbar */}
      <Card sx={{ p: 2.5, mb: 3, display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ width: 220 }}>
          <InputLabel>Branch</InputLabel>
          <Select
            value={selectedBranch}
            label="Branch"
            onChange={(e) => {
              setSelectedBranch(e.target.value);
              setActiveFloorTab(0);
            }}
          >
            {branches?.map((b: any) => (
              <MenuItem key={b.id} value={b.id}>
                {b.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Legend Key */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Chip label="Available" sx={{ bgcolor: '#D1FAE5', color: '#065F46', border: '1px solid #10B981', fontWeight: 600 }} />
          <Chip label="Occupied" sx={{ bgcolor: '#DBEAFE', color: '#1E3A8A', border: '1px solid #2563EB', fontWeight: 600 }} />
          <Chip label="Reserved" sx={{ bgcolor: '#FEF3C7', color: '#78350F', border: '1px solid #F59E0B', fontWeight: 600 }} />
          <Chip label="Blocked" sx={{ bgcolor: '#F3F4F6', color: '#374151', border: '1px solid #9CA3AF', fontWeight: 600 }} />
        </Box>
      </Card>

      {/* Map Loader */}
      {isMapLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
          <CircularProgress />
        </Box>
      ) : !seatMap || seatMap.length === 0 ? (
        <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 3 }}>
          <Typography color="text.secondary">No floor configuration found for this branch.</Typography>
        </Paper>
      ) : (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs
              value={activeFloorTab}
              onChange={(_, val) => setActiveFloorTab(val)}
            >
              {seatMap.map((floor: any) => (
                <Tab label={floor.name} key={floor.id} />
              ))}
            </Tabs>
            {currentFloor && (
              <Button color="error" startIcon={<DeleteIcon />} onClick={() => handleDeleteFloor(currentFloor.id)}>
                Delete Floor
              </Button>
            )}
          </Box>

          {/* Rooms Grid */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {currentFloor?.rooms.map((room: any) => (
              <Box key={room.id}>
                <Card sx={{ p: 3, border: '1px solid #E2E8F0', borderRadius: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <RoomIcon color="primary" /> {room.name}
                    <Tooltip title="Delete Room">
                      <Button size="small" color="error" onClick={() => handleDeleteRoom(room.id)} sx={{ minWidth: 'auto', p: 0.5, ml: 1 }}>
                        <DeleteIcon fontSize="small" />
                      </Button>
                    </Tooltip>
                    <Box sx={{ flexGrow: 1 }} />
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={() => {
                        setParentId(room.id);
                        setCreatorType('seat');
                        setOpenCreator(true);
                      }}
                    >
                      Add Seat
                    </Button>
                  </Typography>

                  {/* Seats grid */}
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    {[...(room.seats || [])].sort((a: any, b: any) => a.number.localeCompare(b.number, undefined, { numeric: true })).map((seat: any) => {
                      const colors = getSeatColor(seat.status);
                      const isOccupied = seat.status === 'OCCUPIED';
                      const allocation = seat.allocations?.find((a: any) => a.isActive);

                      return (
                        <Tooltip
                          key={seat.id}
                          title={
                            isOccupied && allocation
                              ? `Occupant: ${allocation.studentProfile?.user?.name || 'N/A'} (${allocation.shift?.name || 'N/A'})`
                              : `Seat ${seat.number} (${seat.status.toLowerCase()})`
                          }
                        >
                          <Paper
                            onClick={() => handleSeatClick(seat)}
                            sx={{
                              width: 64,
                              height: 64,
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              bgcolor: colors.bg,
                              border: `2px solid ${colors.border}`,
                              color: colors.text,
                              cursor: 'pointer',
                              borderRadius: 2,
                              transition: 'transform 0.1s ease',
                              '&:hover': {
                                transform: 'scale(1.05)',
                              },
                            }}
                          >
                            <SeatIcon fontSize="small" />
                            <Typography variant="caption" sx={{ fontWeight: 700, mt: 0.2 }}>
                              {seat.number}
                            </Typography>
                          </Paper>
                        </Tooltip>
                      );
                    })}
                  </Box>
                </Card>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* Allocation Dialog */}
      <Dialog open={openAllocate} onClose={() => setOpenAllocate(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Allocate Seat {selectedSeat?.number}</DialogTitle>
        <form onSubmit={handleAllocate}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {(!studentsData?.students || studentsData.students.length === 0) ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, p: 3, border: '1px dashed #cbd5e1', borderRadius: 2, bgcolor: '#f8fafc' }}>
                <Typography variant="body2" color="text.secondary">No unallocated students available.</Typography>
                <Button variant="outlined" startIcon={<AddIcon />} onClick={() => navigate('/students')} size="small">
                  Add Student
                </Button>
              </Box>
            ) : (
              <FormControl fullWidth required>
                <InputLabel>Select Student</InputLabel>
                <Select value={studentProfileId} label="Select Student" onChange={(e) => setStudentProfileId(e.target.value)}>
                  {studentsData.students.map((student: any) => (
                    <MenuItem key={student.id} value={student.id}>
                      {student.user?.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {(!shifts || shifts.length === 0) ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, p: 3, border: '1px dashed #cbd5e1', borderRadius: 2, bgcolor: '#f8fafc' }}>
                <Typography variant="body2" color="text.secondary">No shifts configured.</Typography>
                <Button variant="outlined" startIcon={<AddIcon />} onClick={() => navigate('/settings')} size="small">
                  Add Shift
                </Button>
              </Box>
            ) : (
              <FormControl fullWidth required>
                <InputLabel>Select Shift</InputLabel>
                <Select value={shiftId} label="Select Shift" onChange={(e) => setShiftId(e.target.value)}>
                  {shifts.map((shift: any) => (
                    <MenuItem key={shift.id} value={shift.id}>
                      {shift.name} ({shift.startTime} - {shift.endTime})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <TextField
              label="Start Date"
              type="date"
              fullWidth
              required
              slotProps={{ inputLabel: { shrink: true } }}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <TextField
              label="End Date"
              type="date"
              fullWidth
              required
              slotProps={{ inputLabel: { shrink: true } }}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2.5, justifyContent: 'space-between' }}>
            <Button color="error" onClick={() => handleDeleteSeat(selectedSeat?.id)}>
              Delete Seat
            </Button>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button onClick={() => setOpenAllocate(false)}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={isAllocating}>
                Allocate
              </Button>
            </Box>
          </DialogActions>
        </form>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog open={openTransfer} onClose={() => setOpenTransfer(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Manage Occupied Seat {selectedSeat?.number}</DialogTitle>
        <form onSubmit={handleTransfer}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">Current Occupant:</Typography>
              <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5 }}>
                {selectedSeat?.allocations?.find((a: any) => a.isActive)?.studentProfile?.user?.name}
              </Typography>
            </Box>

            <FormControl fullWidth required sx={{ mt: 2 }}>
              <InputLabel>Transfer to Vacant Seat</InputLabel>
              <Select value={targetSeatId} label="Transfer to Vacant Seat" onChange={(e) => setTargetSeatId(e.target.value)}>
                {currentFloor?.rooms.flatMap((r: any) => r.seats).filter((s: any) => s.status === 'AVAILABLE').map((s: any) => (
                  <MenuItem key={s.id} value={s.id}>
                    Room: {currentFloor.rooms.find((rm: any) => rm.seats.some((seat: any) => seat.id === s.id))?.name} | Seat: {s.number}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setOpenTransfer(false)}>Close</Button>
            <Button type="submit" variant="contained" startIcon={<TransferIcon />} disabled={isTransferring}>
              Transfer
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Layout Creator Dialog */}
      <Dialog open={openCreator} onClose={() => setOpenCreator(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, bgcolor: 'primary.main', color: '#ffffff', mb: 2 }}>
          {creatorType === 'room' ? 'Add Room' : creatorType === 'seat' ? 'Add Seat' : 'Add Floor'}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
          {creatorType === 'room' && (
            (!seatMap || seatMap.length === 0) ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, p: 3, border: '1px dashed #cbd5e1', borderRadius: 2, bgcolor: '#f8fafc' }}>
                <Typography variant="body2" color="text.secondary">No floors exist yet.</Typography>
                <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setCreatorType('floor')} size="small">
                  Add Floor
                </Button>
              </Box>
            ) : (
              <FormControl fullWidth required>
                <InputLabel>Target Floor</InputLabel>
                <Select value={parentId} label="Target Floor" onChange={(e) => setParentId(e.target.value)}>
                  {seatMap.map((f: any) => (
                    <MenuItem key={f.id} value={f.id}>
                      {f.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )
          )}

          {creatorType === 'seat' && (
            (!currentFloor?.rooms || currentFloor.rooms.length === 0) ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, p: 3, border: '1px dashed #cbd5e1', borderRadius: 2, bgcolor: '#f8fafc' }}>
                <Typography variant="body2" color="text.secondary">No rooms exist on this floor.</Typography>
                <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setCreatorType('room')} size="small">
                  Add Room
                </Button>
              </Box>
            ) : (
              <FormControl fullWidth required>
                <InputLabel>Target Room</InputLabel>
                <Select value={parentId} label="Target Room" onChange={(e) => setParentId(e.target.value)}>
                  {currentFloor.rooms.map((r: any) => (
                    <MenuItem key={r.id} value={r.id}>
                      {r.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )
          )}

          <TextField
            label={
              creatorType === 'seat'
                ? 'Seat Number (e.g. A-1 or 1-60)'
                : creatorType === 'room'
                ? 'Room Name (e.g. Hall A)'
                : 'Floor Name (e.g. Ground Floor)'
            }
            fullWidth
            required
            value={creatorName}
            onChange={(e) => setCreatorName(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button
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
          <Button onClick={handleCreate} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
