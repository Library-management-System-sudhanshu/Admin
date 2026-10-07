import { Component, Suspense, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { LoadingState } from '../components/feedback/LoadingState';
import { Button } from '../components/ui/Button';

class PageErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return <div className="page-error" role="alert">
      <h2>This page couldn’t be opened</h2>
      <p>Please try again, or choose another page from the navigation.</p>
      <Button onClick={() => this.setState({ failed: false })}>Try again</Button>
    </div>;
    return this.props.children;
  }
}

export function PageBoundary({ children, animate = true }: { children: ReactNode; animate?: boolean }) {
  const { pathname } = useLocation();
  return <PageErrorBoundary key={animate ? pathname : 'app'}><Suspense fallback={<LoadingState label="Opening page…" />}>{animate ? <div className="admin-page">{children}</div> : children}</Suspense></PageErrorBoundary>;
}
