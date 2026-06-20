import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/authSlice';
import type { RootState } from '../store';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Chair as ChairIcon,
  ReceiptLong as ReceiptIcon,
  LocalLibrary as LibraryIcon,
  ReportProblem as ComplaintIcon,
  Message as WhatsAppIcon,
  ExitToApp as LogoutIcon,
  Business as BusinessIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';

const drawerWidth = 240;

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'Students', icon: <PeopleIcon />, path: '/students' },
    { text: 'Seat Map', icon: <ChairIcon />, path: '/seats' },
    { text: 'Billing & Payments', icon: <ReceiptIcon />, path: '/billing' },
    { text: 'Library', icon: <LibraryIcon />, path: '/library' },
    { text: 'Complaints', icon: <ComplaintIcon />, path: '/complaints' },
    { text: 'WhatsApp', icon: <WhatsAppIcon />, path: '/whatsapp' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
  ];

  if (user?.role === 'SUPER_ADMIN') {
    menuItems.push({ text: 'Workspaces', icon: <BusinessIcon />, path: '/super-admin' });
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#ffffff' }}>
      {/* Top App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          bgcolor: '#FFFFFF',
          color: '#0F172A',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 600 }}>
            StudyFlow
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 500, color: '#475569' }}>
              {user?.name} ({user?.role})
            </Typography>
            <IconButton onClick={handleMenu} color="inherit">
              <Avatar sx={{ bgcolor: '#14213d', width: 36, height: 36 }}>
                {user?.name?.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Sidebar Navigation */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: 'border-box',
            bgcolor: '#14213d',
            color: '#FFFFFF',
          },
        }}
      >
        <Toolbar sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: 1, color: '#fca311' }}>
            STUDYFLOW
          </Typography>
        </Toolbar>
        <Divider sx={{ bgcolor: '#334155' }} />
        <Box sx={{ overflow: 'auto', mt: 2 }}>
          <List>
            {menuItems.map((item) => {
              const active = location.pathname === item.path;
              return (
                <ListItem key={item.text} disablePadding>
                  <ListItemButton
                    onClick={() => navigate(item.path)}
                    sx={{
                      mx: 1.5,
                      borderRadius: 1.5,
                      mb: 0.5,
                      bgcolor: active ? '#fca311' : 'transparent',
                      color: active ? '#14213d' : '#94A3B8',
                      '&:hover': {
                        bgcolor: active ? '#fca311' : 'rgba(255, 255, 255, 0.1)',
                        color: active ? '#14213d' : '#ffffff',
                        '& .MuiListItemIcon-root': { color: active ? '#14213d' : '#ffffff' },
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        color: active ? '#14213d' : '#64748B',
                        minWidth: 40,
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography sx={{ fontSize: '0.875rem', fontWeight: active ? 600 : 500 }}>
                          {item.text}
                        </Typography>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Box>
      </Drawer>

      {/* Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: '64px',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
