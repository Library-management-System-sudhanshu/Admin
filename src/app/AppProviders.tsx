import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { store } from '../store';
import { AlertProvider } from '../components/ui/AlertContext';
import { ToastProvider } from '../components/ui/ToastContext';

export function AppProviders({ children }: { children: ReactNode }) {
  return <Provider store={store}><BrowserRouter><AlertProvider><ToastProvider>{children}</ToastProvider></AlertProvider></BrowserRouter></Provider>;
}
