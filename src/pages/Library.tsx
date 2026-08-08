import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import {
  useGetBooksQuery,
  useCreateBookMutation,
  useGetIssuedBooksQuery,
  useIssueBookMutation,
  useReturnBookMutation,
  useGetStudentsQuery,
} from '../store/api';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Autocomplete,
} from '@mui/material';
import {
  AssignmentTurnedIn as ReturnIcon,
} from '@mui/icons-material';
import { Button } from '../components/ui/Button';
import { Plus, BookOpen } from 'lucide-react';

export default function Library() {
  const { user } = useSelector((state: RootState) => state.auth);
  const [tab, setTab] = useState(0);

  const { data: books, isLoading: booksLoading } = useGetBooksQuery({});
  const { data: issuedBooks, isLoading: issuedLoading } = useGetIssuedBooksQuery({});
  const { data: studentsData } = useGetStudentsQuery({});

  const [openAddBook, setOpenAddBook] = useState(false);
  const [openIssue, setOpenIssue] = useState(false);

  // Forms
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState('');
  const [quantity, setQuantity] = useState('');
  const [rackNumber, setRackNumber] = useState('');

  const [studentProfileId, setStudentProfileId] = useState('');
  const [selectedBookId, setSelectedBookId] = useState('');

  const [createBook] = useCreateBookMutation();
  const [issueBook] = useIssueBookMutation();
  const [returnBook] = useReturnBookMutation();

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createBook({
        title,
        author,
        category,
        quantity: Number(quantity),
        rackNumber,
      }).unwrap();
      setOpenAddBook(false);
      setTitle('');
      setAuthor('');
      setCategory('');
      setQuantity('');
      setRackNumber('');
    } catch (err) {
      alert('Error adding book');
    }
  };

  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await issueBook({
        bookId: selectedBookId,
        studentProfileId,
        issuedById: user?.id,
      }).unwrap();
      setOpenIssue(false);
      setSelectedBookId('');
      setStudentProfileId('');
    } catch (err) {
      alert('Error issuing book');
    }
  };

  const handleReturn = async (issueId: string) => {
    try {
      const res = await returnBook(issueId).unwrap();
      if (res.fineAmount > 0) {
        alert(`Book returned! Late fine calculated: ₹${res.fineAmount}`);
      } else {
        alert('Book returned successfully.');
      }
    } catch (err) {
      alert('Error returning book');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="outline" 
            onClick={() => setOpenIssue(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '8px 16px', borderRadius: '10px', fontWeight: 600 }}
          >
            <BookOpen size={16} /> Issue Book
          </Button>
          <Button 
            variant="primary" 
            onClick={() => setOpenAddBook(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '8px 16px', borderRadius: '10px', fontWeight: 600, backgroundColor: 'var(--accent-blue)', borderColor: 'var(--accent-blue)' }}
          >
            <Plus size={16} /> Add Book
          </Button>
        </Box>
      </Box>

      <Tabs value={tab} onChange={(_, val) => setTab(val)} sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
        <Tab label="Book Catalog" />
        <Tab label="Active Borrowers" />
      </Tabs>

      {tab === 0 && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 3 }}>
          {booksLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5, width: '100%' }}>
              <CircularProgress />
            </Box>
          ) : (
            books?.map((book: any) => (
              <Card key={book.id} sx={{ borderRadius: 2.5, border: '1px solid #E2E8F0', boxShadow: 'none' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                    {book.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    By {book.author}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Chip label={book.category} size="small" color="primary" variant="outlined" />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Qty: {book.quantity} (Rack: {book.rackNumber})
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            ))
          )}
        </Box>
      )}

      {tab === 1 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {issuedLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper} sx={{ borderRadius: 2.5, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Book Title</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Student Borrower</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Issued Date</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Due Date</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {issuedBooks?.map((log: any) => (
                    <TableRow key={log.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{log.book?.title}</TableCell>
                      <TableCell>{log.studentProfile?.user?.name}</TableCell>
                      <TableCell>{new Date(log.issuedAt).toLocaleDateString()}</TableCell>
                      <TableCell sx={{ color: new Date() > new Date(log.dueDate) ? 'error.main' : 'inherit' }}>
                        {new Date(log.dueDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Chip label={log.status} size="small" color={log.status === 'ISSUED' ? 'warning' : 'success'} />
                      </TableCell>
                      <TableCell align="right">
                        {log.status === 'ISSUED' && (
                          <Tooltip title="Mark Returned">
                            <IconButton color="success" onClick={() => handleReturn(log.id)}>
                              <ReturnIcon />
                            </IconButton>
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
      )}

      {/* Add Book Dialog */}
      <Dialog open={openAddBook} onClose={() => setOpenAddBook(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Add Book Catalog</DialogTitle>
        <form onSubmit={handleAddBook}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField label="Book Title" fullWidth required value={title} onChange={(e) => setTitle(e.target.value)} />
            <TextField label="Author" fullWidth required value={author} onChange={(e) => setAuthor(e.target.value)} />
            <TextField label="Category/Subject" fullWidth required value={category} onChange={(e) => setCategory(e.target.value)} />
            <TextField label="Total Copies/Qty" type="number" fullWidth required value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            <TextField label="Rack Number Location" fullWidth required value={rackNumber} onChange={(e) => setRackNumber(e.target.value)} />
          </DialogContent>
          <DialogActions sx={{ p: 2.5, gap: '0.75rem' }}>
            <Button type="button" variant="text" onClick={() => setOpenAddBook(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Add Book</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Issue Book Dialog */}
      <Dialog open={openIssue} onClose={() => setOpenIssue(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Issue Book Badge</DialogTitle>
        <form onSubmit={handleIssue}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <FormControl fullWidth required>
              <InputLabel>Select Book</InputLabel>
              <Select value={selectedBookId} label="Select Book" onChange={(e) => setSelectedBookId(e.target.value)}>
                {books?.filter((b: any) => b.quantity > 0).map((b: any) => (
                  <MenuItem key={b.id} value={b.id}>
                    {b.title} (Available: {b.quantity})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Autocomplete
              options={studentsData?.students || []}
              getOptionLabel={(option: any) => option.user?.name || ''}
              value={studentsData?.students.find((s: any) => s.id === studentProfileId) || null}
              onChange={(_event: any, newValue: any | null) => {
                setStudentProfileId(newValue ? newValue.id : '');
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Student Borrower"
                  required
                  fullWidth
                />
              )}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2.5, gap: '0.75rem' }}>
            <Button type="button" variant="text" onClick={() => setOpenIssue(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Issue Book</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
