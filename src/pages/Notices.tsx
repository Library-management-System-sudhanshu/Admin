import { useState } from 'react';
import {
  useGetNoticesQuery,
  useCreateNoticeMutation,
  useDeleteNoticeMutation,
} from '../store/api';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { Button } from '../components/ui/Button';
import { Send } from 'lucide-react';
import { useAlert } from '../components/ui/AlertContext';
import { useToast } from '../components/ui/ToastContext';

export default function Notices() {
  const { data: notices, isLoading } = useGetNoticesQuery({});
  const [createNotice, { isLoading: isCreating }] = useCreateNoticeMutation();
  const [deleteNotice] = useDeleteNoticeMutation();
  const { showAlert } = useAlert();
  const { showToast } = useToast();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    try {
      await createNotice({
        title: title.trim(),
        content: content.trim(),
      }).unwrap();
      setTitle('');
      setContent('');
      showToast('Notice created & broadcast successfully!', 'success');
    } catch (err) {
      showToast('Failed to broadcast notice', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await showAlert('Are you sure you want to delete this notice?', {
      title: 'Delete Notice',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
    });
    if (!confirmed) return;
    try {
      await deleteNotice(id).unwrap();
      showToast('Notice deleted successfully', 'success');
    } catch (err) {
      showToast('Failed to delete notice', 'error');
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, color: '#0F172A', mb: 4 }}>
        Notices & Broadcasts
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4, alignItems: 'start' }}>
        {/* Create Notice Column */}
        <Box sx={{ flex: { xs: 'none', md: 4 }, width: '100%', maxWidth: { xs: '100%', md: '360px' } }}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: '#1E293B' }}>
                New Announcement
              </Typography>
              <form onSubmit={handleSubmit}>
                <TextField
                  fullWidth
                  label="Notice Title"
                  placeholder="e.g. Center holiday notice"
                  variant="outlined"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  sx={{ mb: 2 }}
                  required
                />
                <TextField
                  fullWidth
                  label="Message Content"
                  placeholder="Write the notice details here..."
                  variant="outlined"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  multiline
                  rows={6}
                  sx={{ mb: 3 }}
                  required
                />
                <Button
                  fullWidth
                  variant="primary"
                  type="submit"
                  isLoading={isCreating}
                  disabled={!title.trim() || !content.trim()}
                  style={{
                    borderRadius: '10px',
                    backgroundColor: 'var(--accent-blue)',
                    borderColor: 'var(--accent-blue)',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '10px 0'
                  }}
                >
                  <Send size={16} /> Broadcast Notice
                </Button>
              </form>
            </CardContent>
          </Card>
        </Box>

        {/* Notices History Column */}
        <Box sx={{ flex: { xs: 'none', md: 8 }, width: '100%' }}>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
              <CircularProgress />
            </Box>
          ) : notices?.length === 0 ? (
            <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 3, border: '1px solid #E2E8F0' }}>
              <Typography color="text.secondary">No broadcasted notices found.</Typography>
            </Paper>
          ) : (
            <TableContainer
              component={Paper}
              sx={{
                borderRadius: 3,
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                border: '1px solid #E2E8F0',
              }}
            >
              <Table>
                <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Title</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Message</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Broadcast Date</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#475569' }}>By</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: '#475569' }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {notices?.map((n: any) => (
                    <TableRow key={n.id} hover>
                      <TableCell sx={{ fontWeight: 600, color: '#0F172A' }}>{n.title}</TableCell>
                      <TableCell sx={{ maxWidth: 260, fontSize: '0.875rem', color: '#334155' }}>
                        {n.content}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.85rem', color: '#64748B' }}>
                        {new Date(n.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.85rem', color: '#64748B' }}>
                        {n.createdBy?.name || 'N/A'}
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Delete Notice">
                          <IconButton color="error" onClick={() => handleDelete(n.id)}>
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Box>
    </Box>
  );
}
