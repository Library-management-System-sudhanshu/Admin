import { useGetWorkspacesQuery, useUpdateWorkspaceMutation } from '../store/api';
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
  Button,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  Business as WorkspacesIcon,
  People as StudentIcon,
  TrendingUp as RevenueIcon,
} from '@mui/icons-material';

export default function SuperAdmin() {
  const { data: workspaces, isLoading } = useGetWorkspacesQuery({});
  const [updateWorkspace] = useUpdateWorkspaceMutation();

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await updateWorkspace({ id, isActive: !currentStatus }).unwrap();
      alert('Workspace updated successfully.');
    } catch (err) {
      alert('Error updating workspace status.');
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Calculate high level metrics
  const totalWorkspaces = workspaces?.length || 0;
  const activeWorkspaces = workspaces?.filter((w: any) => w.isActive).length || 0;
  const inactiveWorkspaces = totalWorkspaces - activeWorkspaces;

  const kpis = [
    { title: 'Total SaaS Workspaces', value: totalWorkspaces, icon: <WorkspacesIcon color="primary" /> },
    { title: 'Active Halls', value: activeWorkspaces, icon: <StudentIcon color="success" /> },
    { title: 'Deactivated / Suspended', value: inactiveWorkspaces, icon: <RevenueIcon color="error" /> },
  ];

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, color: '#0F172A', mb: 4 }}>
        Super Admin Control Panel
      </Typography>

      {/* KPI Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 3, mb: 4 }}>
        {kpis.map((kpi, idx) => (
          <Card key={idx} sx={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', borderRadius: 2.5 }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', p: 3 }}>
              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#E0F2FE', display: 'flex', mr: 2 }}>
                {kpi.icon}
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                  {kpi.title}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5 }}>
                  {kpi.value}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Workspaces Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 2.5, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Study Hall Name</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Subdomain Link</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Location Address</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Created Date</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {workspaces?.map((w: any) => (
              <TableRow key={w.id} hover>
                <TableCell sx={{ fontWeight: 600 }}>{w.name}</TableCell>
                <TableCell sx={{ color: 'primary.main', fontSize: '0.875rem' }}>
                  {w.subdomain}.studyflow.com
                </TableCell>
                <TableCell sx={{ fontSize: '0.85rem' }}>{w.address}</TableCell>
                <TableCell sx={{ fontSize: '0.85rem' }}>
                  {new Date(w.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Chip
                    label={w.isActive ? 'ACTIVE' : 'SUSPENDED'}
                    size="small"
                    color={w.isActive ? 'success' : 'error'}
                  />
                </TableCell>
                <TableCell align="right">
                  <Button
                    variant="outlined"
                    color={w.isActive ? 'error' : 'success'}
                    size="small"
                    onClick={() => handleToggleActive(w.id, w.isActive)}
                  >
                    {w.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
