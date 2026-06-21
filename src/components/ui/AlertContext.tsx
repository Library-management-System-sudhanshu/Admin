import React, { createContext, useContext, useState, type ReactNode } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';

interface AlertOptions {
  title?: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'alert' | 'confirm' | 'danger';
}

interface AlertContextType {
  showAlert: (message: string, options?: AlertOptions) => Promise<boolean>;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

export const AlertProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [title, setTitle] = useState('');
  const [confirmText, setConfirmText] = useState('OK');
  const [cancelText, setCancelText] = useState('Cancel');
  const [type, setType] = useState<'alert' | 'confirm' | 'danger'>('alert');
  const [resolveRef, setResolveRef] = useState<((value: boolean) => void) | null>(null);

  const showAlert = (msg: string, options?: AlertOptions) => {
    setMessage(msg);
    setTitle(options?.title || (options?.type === 'confirm' ? 'Confirm Action' : options?.type === 'danger' ? 'Confirm Deletion' : 'Alert'));
    setConfirmText(options?.confirmText || (options?.type === 'danger' ? 'Delete' : 'OK'));
    setCancelText(options?.cancelText || 'Cancel');
    setType(options?.type || 'alert');
    setIsOpen(true);

    return new Promise<boolean>((resolve) => {
      setResolveRef(() => resolve);
    });
  };

  const handleConfirm = () => {
    setIsOpen(false);
    if (resolveRef) resolveRef(true);
  };

  const handleCancel = () => {
    setIsOpen(false);
    if (resolveRef) resolveRef(false);
  };

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      <Modal
        isOpen={isOpen}
        onClose={handleCancel}
        title={title}
        maxWidth="sm"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0 }}>
            {message}
          </p>
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '1rem',
            marginTop: '1.5rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid var(--border-color)',
          }}>
            {(type === 'confirm' || type === 'danger') && (
              <button
                type="button"
                onClick={handleCancel}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#475569',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  padding: '0.5rem 1rem',
                  borderRadius: '0.375rem',
                  transition: 'all 0.15s ease',
                }}
                onMouseOver={(e) => e.currentTarget.style.color = '#0f172a'}
                onMouseOut={(e) => e.currentTarget.style.color = '#475569'}
              >
                {cancelText}
              </button>
            )}
            <Button
              variant={type === 'danger' ? 'primary' : 'primary'}
              onClick={handleConfirm}
              style={{
                backgroundColor: type === 'danger' ? 'var(--danger)' : '#2f2fd1',
                borderColor: type === 'danger' ? 'var(--danger)' : '#2f2fd1',
                borderRadius: '0.5rem',
                padding: '0.5rem 1.25rem',
                fontSize: '0.875rem',
                fontWeight: 600,
              }}
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </Modal>
    </AlertContext.Provider>
  );
};
