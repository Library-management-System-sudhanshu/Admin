import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import {
  useGetStudentsQuery,
  useCreateStudentMutation,
  useUpdateStudentStatusMutation,
  useDeleteStudentMutation,
  useGetBranchesQuery,
} from '../store/api';
import {
  Box,
  Typography,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Avatar,
} from '@mui/material';
import {
  Add as AddIcon,
  Check as ApproveIcon,
  Close as RejectIcon,
  Delete as DeleteIcon,
  Badge as BadgeIcon,
} from '@mui/icons-material';

export default function Students() {
  const { user } = useSelector((state: RootState) => state.auth);
  const { data: branches } = useGetBranchesQuery(user?.workspaceId, { skip: !user?.workspaceId });

  const [search, setSearch] = useState('');
  const [page] = useState(1);
  const [openAdd, setOpenAdd] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [openCard, setOpenCard] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [guardianMobile, setGuardianMobile] = useState('');
  const [aadharNumber, setAadharNumber] = useState('');
  const [branchId, setBranchId] = useState('');

  // Validation Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data, isLoading } = useGetStudentsQuery({
    search,
    branchId: branchId || undefined,
    page,
    limit: 10,
  });

  const [createStudent, { isLoading: isCreating }] = useCreateStudentMutation();
  const [updateStatus] = useUpdateStudentStatusMutation();
  const [deleteStudent] = useDeleteStudentMutation();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Name validation: 2-50 chars, alphabets and spaces
    if (!/^[a-zA-Z\s]{2,50}$/.test(name.trim())) {
      newErrors.name = 'Name must be 2-50 characters and contain only letters';
    }
    
    // Mobile validation: exactly 10 digits
    if (!/^\d{10}$/.test(mobile.trim())) {
      newErrors.mobile = 'Mobile number must be exactly 10 digits';
    }
    
    // Guardian Name: optional, but if filled, must be alphabets and spaces
    if (guardianName.trim() && !/^[a-zA-Z\s]{2,50}$/.test(guardianName.trim())) {
      newErrors.guardianName = 'Guardian name must contain only letters';
    }
    
    // Guardian Mobile: optional, but if filled, must be 10 digits
    if (guardianMobile.trim() && !/^\d{10}$/.test(guardianMobile.trim())) {
      newErrors.guardianMobile = 'Guardian mobile must be exactly 10 digits';
    }
    
    // Aadhar number: optional, but if filled, must be 12 digits
    if (aadharNumber.trim() && !/^\d{12}$/.test(aadharNumber.trim())) {
      newErrors.aadharNumber = 'Aadhar number must be exactly 12 digits';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: string, value: string, setter: (val: string) => void) => {
    setter(value);
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      await createStudent({
        name,
        email,
        mobile,
        guardianName,
        guardianMobile,
        aadharNumber,
        branchId,
        workspaceId: user?.workspaceId,
      }).unwrap();
      setOpenAdd(false);
      setErrors({});
      // Reset form
      setName('');
      setEmail('');
      setMobile('');
      setGuardianName('');
      setGuardianMobile('');
      setAadharNumber('');
      setBranchId('');
    } catch (err) {
      alert('Error creating student');
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    await updateStatus({ id, status });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      await deleteStudent(id);
    }
  };

  const getStatusChipColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'REJECTED':
        return 'error';
      default:
        return 'info';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#0F172A' }}>
          Student Records
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenAdd(true)}>
          New Student
        </Button>
      </Box>

      {/* Filters Toolbar */}
      <Card sx={{ p: 2.5, mb: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <TextField
          label="Search by Name"
          variant="outlined"
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ width: 280 }}
        />
        <FormControl size="small" sx={{ width: 200 }}>
          <InputLabel>Branch</InputLabel>
          <Select value={branchId} label="Branch" onChange={(e) => setBranchId(e.target.value)}>
            <MenuItem value="">All Branches</MenuItem>
            {branches?.map((b: any) => (
              <MenuItem key={b.id} value={b.id}>
                {b.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Card>

      {/* Roster Table */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 2.5, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Student</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Contact Info</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Aadhar Card</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Admission Date</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data?.students.map((student: any) => (
                <TableRow key={student.id} hover>
                  <TableCell sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ bgcolor: '#3B82F6' }}>{student.user?.name?.charAt(0).toUpperCase()}</Avatar>
                    <Box>
                      <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>{student.user?.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{student.branch?.name || 'No Branch'}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: '0.85rem' }}>{student.user?.email}</Typography>
                    <Typography variant="caption" color="text.secondary">{student.user?.mobile}</Typography>
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.85rem' }}>{student.aadharNumber || 'N/A'}</TableCell>
                  <TableCell sx={{ fontSize: '0.85rem' }}>
                    {new Date(student.joiningDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Chip label={student.status} size="small" color={getStatusChipColor(student.status)} />
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                      {student.status === 'PENDING' && (
                        <>
                          <Tooltip title="Approve Student">
                            <IconButton color="success" onClick={() => handleStatusChange(student.id, 'APPROVED')}>
                              <ApproveIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reject Admission">
                            <IconButton color="error" onClick={() => handleStatusChange(student.id, 'REJECTED')}>
                              <RejectIcon />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                      <Tooltip title="Generate ID Card">
                        <IconButton
                          color="primary"
                          onClick={() => {
                            setSelectedStudent(student);
                            setOpenCard(true);
                          }}
                        >
                          <BadgeIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Student Profile">
                        <IconButton color="error" onClick={() => handleDelete(student.id)}>
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add Student Dialog */}
      <Dialog open={openAdd} onClose={() => setOpenAdd(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Add New Admission</DialogTitle>
        <form onSubmit={handleAddStudent}>
          <DialogContent>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField
                label="Student Name"
                fullWidth
                required
                value={name}
                error={!!errors.name}
                helperText={errors.name}
                onChange={(e) => handleChange('name', e.target.value, setName)}
              />
              <TextField
                label="Email Address"
                type="email"
                fullWidth
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <TextField
                label="Mobile Number"
                fullWidth
                required
                value={mobile}
                error={!!errors.mobile}
                helperText={errors.mobile}
                onChange={(e) => handleChange('mobile', e.target.value, setMobile)}
              />
              <FormControl fullWidth required>
                <InputLabel>Target Branch</InputLabel>
                <Select value={branchId} label="Target Branch" onChange={(e) => setBranchId(e.target.value)}>
                  {branches?.map((b: any) => (
                    <MenuItem key={b.id} value={b.id}>
                      {b.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Guardian Name"
                fullWidth
                value={guardianName}
                error={!!errors.guardianName}
                helperText={errors.guardianName}
                onChange={(e) => handleChange('guardianName', e.target.value, setGuardianName)}
              />
              <TextField
                label="Guardian Mobile"
                fullWidth
                value={guardianMobile}
                error={!!errors.guardianMobile}
                helperText={errors.guardianMobile}
                onChange={(e) => handleChange('guardianMobile', e.target.value, setGuardianMobile)}
              />
              <Box sx={{ gridColumn: { sm: 'span 2' } }}>
                <TextField
                  label="Aadhar Card Number"
                  fullWidth
                  value={aadharNumber}
                  error={!!errors.aadharNumber}
                  helperText={errors.aadharNumber}
                  onChange={(e) => handleChange('aadharNumber', e.target.value, setAadharNumber)}
                />
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setOpenAdd(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={isCreating}>Create Student</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ID Card Dialog */}
      <Dialog open={openCard} onClose={() => setOpenCard(false)}>
        <DialogTitle sx={{ textAlign: 'center', fontWeight: 700 }}>Student ID Card</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 4 }}>
          {selectedStudent && (
            <Card
              sx={{
                width: 320,
                border: '2px solid #2563EB',
                borderRadius: 4,
                overflow: 'hidden',
                boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                bgcolor: '#FFFFFF',
              }}
            >
              {/* Card Header */}
              <Box sx={{ bgcolor: '#0F172A', p: 2, textAlign: 'center', color: '#FFFFFF' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  STUDYFLOW HALL
                </Typography>
                <Typography variant="caption" sx={{ color: '#38BDF8' }}>
                  Digital Student Badge
                </Typography>
              </Box>

              {/* Card Body */}
              <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Avatar sx={{ width: 80, height: 80, mb: 2, bgcolor: '#2563EB', fontSize: '2rem' }}>
                  {selectedStudent.user?.name?.charAt(0).toUpperCase()}
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                  {selectedStudent.user?.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  ID: SF-{selectedStudent.id.substring(0, 8).toUpperCase()}
                </Typography>

                {/* Details list */}
                <Box sx={{ width: '100%', mb: 3 }}>
                  <Typography variant="caption" sx={{ display: 'block' }} color="text.secondary">Mobile:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>{selectedStudent.user?.mobile}</Typography>

                  <Typography variant="caption" sx={{ display: 'block' }} color="text.secondary">Branch:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>{selectedStudent.branch?.name}</Typography>
                </Box>

                {/* QR Code */}
                {selectedStudent.qrCodeUrl && (
                  <Box
                    component="img"
                    src={selectedStudent.qrCodeUrl}
                    alt="QR Code"
                    sx={{ width: 120, height: 120, border: '1px solid #E2E8F0', borderRadius: 2 }}
                  />
                )}
              </Box>
            </Card>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCard(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
