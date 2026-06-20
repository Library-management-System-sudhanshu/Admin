import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import { useGetComplaintsQuery, useUpdateComplaintStatusMutation } from '../store/api';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import { Check as DoneIcon } from '@mui/icons-material';

export default function Complaints() {
  const { user } = useSelector((state: RootState) => state.auth);
  const { data: complaints, isLoading } = useGetComplaintsQuery({});
  const [resolveComplaint] = useUpdateComplaintStatusMutation();

  const handleResolve = async (id: string) => {
    try {
      await resolveComplaint({
        id,
        resolvedById: user?.id,
        status: 'RESOLVED',
      }).unwrap();
      alert('Complaint resolved successfully');
    } catch (err) {
      alert('Error updating complaint');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RESOLVED':
        return 'success';
      case 'IN_PROGRESS':
        return 'warning';
      case 'OPEN':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, color: '#0F172A', mb: 4 }}>
        Student Grievance Complaints
      </Typography>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
          <CircularProgress />
        </Box>
      ) : complaints?.length === 0 ? (
        <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 3 }}>
          <Typography color="text.secondary">No active complaints found.</Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 2.5, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Student</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Raised Date</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {complaints?.map((c: any) => (
                <TableRow key={c.id} hover>
                  <TableCell sx={{ fontWeight: 500 }}>{c.studentProfile?.user?.name}</TableCell>
                  <TableCell>
                    <Chip label={c.category} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell sx={{ maxWidth: 300, fontSize: '0.875rem' }}>{c.description}</TableCell>
                  <TableCell sx={{ fontSize: '0.85rem' }}>{new Date(c.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Chip label={c.status} size="small" color={getStatusColor(c.status)} />
                  </TableCell>
                  <TableCell align="right">
                    {c.status !== 'RESOLVED' && (
                      <Tooltip title="Mark Resolved">
                        <Button
                          variant="contained"
                          color="success"
                          size="small"
                          startIcon={<DoneIcon />}
                          onClick={() => handleResolve(c.id)}
                        >
                          Resolve
                        </Button>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
