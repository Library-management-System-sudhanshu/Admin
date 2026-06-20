import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Box, Typography, Button, Card, Table, TableBody, TableCell, TableHead, TableRow, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';

const generateTimeOptions = () => {
  const options = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let min = 0; min < 60; min += 30) {
      const hh = hour.toString().padStart(2, '0');
      const mm = min.toString().padStart(2, '0');
      const value = `${hh}:${mm}`;
      
      const period = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 === 0 ? 12 : hour % 12;
      const label = `${displayHour.toString().padStart(2, '0')}:${mm} ${period}`;
      
      options.push({ value, label });
    }
  }
  return options;
};

const TIME_OPTIONS = generateTimeOptions();
import type { RootState } from '../store';
import { useGetShiftsQuery, useCreateShiftMutation, useUpdateShiftMutation, useDeleteShiftMutation } from '../store/api';

export default function Settings() {
  const { user } = useSelector((state: RootState) => state.auth);
  const { data: shifts } = useGetShiftsQuery(user?.workspaceId, { skip: !user?.workspaceId });
  const [createShift] = useCreateShiftMutation();
  const [updateShift] = useUpdateShiftMutation();
  const [deleteShift] = useDeleteShiftMutation();

  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ id: '', name: '', startTime: '', endTime: '', capacity: '' as any, price: 0 });

  const handleOpenCreate = () => {
    setEditMode(false);
    setFormData({ id: '', name: '', startTime: '', endTime: '', capacity: '' as any, price: 0 });
    setOpen(true);
  };

  const handleOpenEdit = (shift: any) => {
    setEditMode(true);
    setFormData({ ...shift, capacity: shift.capacity ?? '' });
    setOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dataToSave = {
        ...formData,
        capacity: formData.capacity === '' || formData.capacity === null || formData.capacity === undefined ? null : parseInt(formData.capacity as any),
      };
      if (editMode) {
        await updateShift({ id: formData.id, data: dataToSave }).unwrap();
      } else {
        await createShift({ workspaceId: user?.workspaceId, data: dataToSave }).unwrap();
      }
      setOpen(false);
    } catch (err) {
      alert('Failed to save shift');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this shift?')) return;
    try {
      await deleteShift(id).unwrap();
    } catch (err) {
      alert('Failed to delete shift');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#0F172A' }}>
          Workspace Settings
        </Typography>
      </Box>

      <Card sx={{ p: 3, border: '1px solid #E2E8F0', boxShadow: 'none' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>Shifts & Pricing</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
            Add Shift
          </Button>
        </Box>

        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Shift Name</TableCell>
              <TableCell>Start Time</TableCell>
              <TableCell>End Time</TableCell>
              <TableCell>Capacity</TableCell>
              <TableCell>Monthly Price</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {shifts?.map((shift: any) => (
              <TableRow key={shift.id}>
                <TableCell sx={{ fontWeight: 500 }}>{shift.name}</TableCell>
                <TableCell>{shift.startTime}</TableCell>
                <TableCell>{shift.endTime}</TableCell>
                <TableCell>{shift.capacity ?? 'Unlimited'}</TableCell>
                <TableCell>₹{shift.price}</TableCell>
                <TableCell align="right">
                  <IconButton size="small" color="primary" onClick={() => handleOpenEdit(shift)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDelete(shift.id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {(!shifts || shifts.length === 0) && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                  No shifts found. Create your first shift to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>{editMode ? 'Edit Shift' : 'Add New Shift'}</DialogTitle>
        <form onSubmit={handleSave}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <TextField
              label="Shift Name (e.g. Morning Batch)"
              fullWidth
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth required>
                <InputLabel id="start-time-label">Start Time</InputLabel>
                <Select
                  labelId="start-time-label"
                  label="Start Time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                >
                  {TIME_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth required>
                <InputLabel id="end-time-label">End Time</InputLabel>
                <Select
                  labelId="end-time-label"
                  label="End Time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                >
                  {TIME_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Capacity (Optional)"
                type="number"
                fullWidth
                value={formData.capacity ?? ''}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value === '' ? '' : parseInt(e.target.value) })}
              />
              <TextField
                label="Monthly Price (₹)"
                type="number"
                fullWidth
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">
              Save Shift
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
