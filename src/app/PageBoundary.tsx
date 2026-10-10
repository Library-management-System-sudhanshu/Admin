import { Component, Suspense, type ErrorInfo, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { LoadingState } from '../components/feedback/LoadingState';
import { Button } from '../components/ui/Button';

interface PageErrorBoundaryProps {
  children: ReactNode;
}

interface PageErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class PageErrorBoundary extends Component<PageErrorBoundaryProps, PageErrorBoundaryState> {
  state: PageErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): PageErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error and component stack for observability / debugging
    console.error('[PageBoundary Error]:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="page-error"
          role="alert"
          style={{
            maxWidth: '540px',
            margin: '4rem auto',
            padding: '2.5rem',
            textAlign: 'center',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: '#fef2f2',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
              fontSize: '1.5rem',
              fontWeight: 700,
            }}
          >
            !
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
            This page couldn’t be loaded
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
            An unexpected error occurred while rendering this section. You can try refreshing the view or returning to your dashboard.
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <Button onClick={this.handleReset} variant="outline">
              Try again
            </Button>
            <Button onClick={this.handleReload}>
              Reload Page
            </Button>
          </div>

          {import.meta.env.DEV && this.state.error && (
            <details
              style={{
                marginTop: '1.5rem',
                textAlign: 'left',
                padding: '0.75rem',
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                fontSize: '0.75rem',
                color: '#dc2626',
                overflowX: 'auto',
              }}
            >
              <summary style={{ cursor: 'pointer', fontWeight: 600, color: '#64748b' }}>
                Error Diagnostics (Dev Only)
              </summary>
              <pre style={{ marginTop: '0.5rem', whiteSpace: 'pre-wrap' }}>
                {this.state.error.message}
                {'\n'}
                {this.state.error.stack}
              </pre>
            </details>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

export function PageBoundary({ children, animate = true }: { children: ReactNode; animate?: boolean }) {
  const { pathname } = useLocation();
  return (
    <PageErrorBoundary key={animate ? pathname : 'app'}>
      <Suspense fallback={<LoadingState label="Opening page…" />}>
        {animate ? <div className="admin-page">{children}</div> : children}
      </Suspense>
    </PageErrorBoundary>
  );
}
