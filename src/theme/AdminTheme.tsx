import { useLayoutEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import colors from './colors';
import './admin.css';

const theme = createTheme({
  palette: {
    primary: { main: colors.primary },
    background: { default: '#f3f6fc', paper: colors.bgCard },
    text: { primary: colors.textPrimary, secondary: colors.textSecondary },
  },
  typography: { fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', button: { textTransform: 'none', fontWeight: 600 } },
  shape: { borderRadius: 10 },
  components: {
    MuiButton: { defaultProps: { disableElevation: true } },
    MuiTextField: { defaultProps: { size: 'small' } },
    MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
    MuiTableCell: { styleOverrides: { head: { background: '#f8faff', color: colors.textSecondary, fontWeight: 600 } } },
  },
});

/** Body scope also themes dialogs and menus rendered through portals. */
export default function AdminTheme() {
  useLayoutEffect(() => {
    const previous = document.body.dataset.theme;
    document.body.dataset.theme = 'admin';
    return () => {
      if (previous) document.body.dataset.theme = previous;
      else delete document.body.dataset.theme;
    };
  }, []);
  return <ThemeProvider theme={theme}><Outlet /></ThemeProvider>;
}
