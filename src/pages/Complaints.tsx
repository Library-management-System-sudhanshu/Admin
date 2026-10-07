import { useState } from 'react';
import { LoadingState } from '../components/feedback/LoadingState';
import { QueryFeedback } from '../components/feedback/QueryFeedback';
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
  Chip,
} from '@mui/material';
import { Button } from '../components/ui/Button';
import { Check } from 'lucide-react';

export default function Complaints() {
  const { user } = useSelector((state: RootState) => state.auth);
  const { data: complaints, isLoading, isFetching, error, refetch } = useGetComplaintsQuery({});
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolveComplaint] = useUpdateComplaintStatusMutation();

  const handleResolve = async (id: string) => {
    if (resolvingId) return;
    setResolvingId(id);
    try {
      await resolveComplaint({
        id,
        resolvedById: user?.id,
        status: 'RESOLVED',
      }).unwrap();
      alert('Complaint resolved successfully');
    } catch (err) {
      alert('Error updating complaint');
    } finally {
      setResolvingId(null);
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

      <QueryFeedback error={error} fetching={isFetching && !!complaints} onRetry={refetch} />
          {isLoading ? (
        <LoadingState />
      ) : error && !complaints ? null : complaints?.length === 0 ? (
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
                        <Button
                          variant="primary"
                          size="sm"
                          style={{ backgroundColor: 'var(--status-emerald)', borderColor: 'var(--status-emerald)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', padding: '4px 8px' }}
                          onClick={() => handleResolve(c.id)}
                          isLoading={resolvingId === c.id}
                          disabled={!!resolvingId}
                        >
                          <Check size={14} /> Resolve
                        </Button>
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
