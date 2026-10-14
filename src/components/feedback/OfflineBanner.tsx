import { useEffect, useState } from 'react';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { WifiOff, Wifi } from 'lucide-react';

/**
 * OfflineBanner component
 * Displays a non-intrusive warning bar whenever the browser loses internet connection,
 * and briefly confirms when connectivity is restored.
 */
export function OfflineBanner() {
  const isOnline = useNetworkStatus();
  const [wasOffline, setWasOffline] = useState(false);
  const [showRestored, setShowRestored] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
      setShowRestored(false);
    } else if (wasOffline) {
      setShowRestored(true);
      const timer = setTimeout(() => {
        setShowRestored(false);
        setWasOffline(false);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  if (!isOnline) {
    return (
      <div
        role="status"
        aria-live="polite"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 99999,
          backgroundColor: '#ef4444',
          color: '#ffffff',
          padding: '0.5rem 1rem',
          fontSize: '0.85rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
          animation: 'slideDown 200ms ease-out',
        }}
      >
        <WifiOff size={16} />
        <span>You are currently offline. Actions will sync when connection is restored.</span>
      </div>
    );
  }

  if (showRestored) {
    return (
      <div
        role="status"
        aria-live="polite"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 99999,
          backgroundColor: '#10b981',
          color: '#ffffff',
          padding: '0.5rem 1rem',
          fontSize: '0.85rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
          animation: 'slideDown 200ms ease-out',
        }}
      >
        <Wifi size={16} />
        <span>Internet connection restored.</span>
      </div>
    );
  }

  return null;
}
