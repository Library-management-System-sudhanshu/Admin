import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Box, Typography, Button, Card, Table, TableBody, TableCell, TableHead, TableRow, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';

const HOURS = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
const PERIODS = ['AM', 'PM'];

const getMinuteOptions = (currentMin: string) => {
  const base = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0'));
  if (currentMin && !base.includes(currentMin)) {
    base.push(currentMin);
    base.sort();
  }
  return base;
};

const parseTime = (timeStr: string) => {
  if (!timeStr) return { hour: '12', minute: '00', period: 'AM' };
  const [hhStr, mmStr] = timeStr.split(':');
  let hh = parseInt(hhStr, 10);
  const mm = mmStr || '00';
  
  let period = 'AM';
  if (hh >= 12) {
    period = 'PM';
    if (hh > 12) hh -= 12;
  } else if (hh === 0) {
    hh = 12;
  }
  
  return {
    hour: hh.toString(),
    minute: mm,
    period,
  };
};

const formatTo24h = (hour: string, minute: string, period: string) => {
  let hh = parseInt(hour, 10);
  if (period === 'PM' && hh < 12) hh += 12;
  if (period === 'AM' && hh === 12) hh = 0;
  const hhStr = hh.toString().padStart(2, '0');
  const mmStr = minute.padStart(2, '0');
  return `${hhStr}:${mmStr}`;
};
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
  const [formData, setFormData] = useState({ id: '', name: '', startTime: '09:00', endTime: '17:00', capacity: '' as any, price: 0 });

  const handleOpenCreate = () => {
    setEditMode(false);
    setFormData({ id: '', name: '', startTime: '09:00', endTime: '17:00', capacity: '' as any, price: 0 });
    setOpen(true);
  };

  const startParsed = parseTime(formData.startTime);
  const endParsed = parseTime(formData.endTime);

  const handleStartChange = (field: 'hour' | 'minute' | 'period', value: string) => {
    const newTime = { ...startParsed, [field]: value };
    setFormData({
      ...formData,
      startTime: formatTo24h(newTime.hour, newTime.minute, newTime.period),
    });
  };

  const handleEndChange = (field: 'hour' | 'minute' | 'period', value: string) => {
    const newTime = { ...endParsed, [field]: value };
    setFormData({
      ...formData,
      endTime: formatTo24h(newTime.hour, newTime.minute, newTime.period),
    });
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
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3 }}>
              <Box>
                <Typography variant="caption" sx={{ display: 'block', mb: 1, fontWeight: 600, color: 'text.secondary' }}>
                  Start Time
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <FormControl fullWidth required size="small">
                    <InputLabel>Hour</InputLabel>
                    <Select
                      value={startParsed.hour}
                      label="Hour"
                      onChange={(e) => handleStartChange('hour', e.target.value)}
                    >
                      {HOURS.map((h) => (
                        <MenuItem key={h} value={h}>{h}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl fullWidth required size="small">
                    <InputLabel>Minute</InputLabel>
                    <Select
                      value={startParsed.minute}
                      label="Minute"
                      onChange={(e) => handleStartChange('minute', e.target.value)}
                    >
                      {getMinuteOptions(startParsed.minute).map((m) => (
                        <MenuItem key={m} value={m}>{m}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl fullWidth required size="small">
                    <InputLabel>AM/PM</InputLabel>
                    <Select
                      value={startParsed.period}
                      label="AM/PM"
                      onChange={(e) => handleStartChange('period', e.target.value)}
                    >
                      {PERIODS.map((p) => (
                        <MenuItem key={p} value={p}>{p}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              </Box>

              <Box>
                <Typography variant="caption" sx={{ display: 'block', mb: 1, fontWeight: 600, color: 'text.secondary' }}>
                  End Time
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <FormControl fullWidth required size="small">
                    <InputLabel>Hour</InputLabel>
                    <Select
                      value={endParsed.hour}
                      label="Hour"
                      onChange={(e) => handleEndChange('hour', e.target.value)}
                    >
                      {HOURS.map((h) => (
                        <MenuItem key={h} value={h}>{h}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl fullWidth required size="small">
                    <InputLabel>Minute</InputLabel>
                    <Select
                      value={endParsed.minute}
                      label="Minute"
                      onChange={(e) => handleEndChange('minute', e.target.value)}
                    >
                      {getMinuteOptions(endParsed.minute).map((m) => (
                        <MenuItem key={m} value={m}>{m}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl fullWidth required size="small">
                    <InputLabel>AM/PM</InputLabel>
                    <Select
                      value={endParsed.period}
                      label="AM/PM"
                      onChange={(e) => handleEndChange('period', e.target.value)}
                    >
                      {PERIODS.map((p) => (
                        <MenuItem key={p} value={p}>{p}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              </Box>
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
