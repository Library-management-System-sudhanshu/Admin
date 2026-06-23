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
  Button,
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
import { Delete as DeleteIcon, Send as SendIcon } from '@mui/icons-material';

export default function Notices() {
  const { data: notices, isLoading } = useGetNoticesQuery({});
  const [createNotice, { isLoading: isCreating }] = useCreateNoticeMutation();
  const [deleteNotice] = useDeleteNoticeMutation();

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
      alert('Notice created & broadcast successfully!');
    } catch (err) {
      alert('Failed to broadcast notice');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this notice?')) return;
    try {
      await deleteNotice(id).unwrap();
      alert('Notice deleted successfully');
    } catch (err) {
      alert('Failed to delete notice');
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
                  variant="contained"
                  color="primary"
                  type="submit"
                  disabled={isCreating || !title.trim() || !content.trim()}
                  startIcon={isCreating ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                  sx={{
                    borderRadius: 2.5,
                    py: 1.2,
                    textTransform: 'none',
                    fontWeight: 600,
                    boxShadow: 'none',
                  }}
                >
                  Broadcast Notice
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
