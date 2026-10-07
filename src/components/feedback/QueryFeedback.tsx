import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';
import { RefreshIndicator } from './LoadingState';
import './feedback.css';

/** Display next to a query's content, never above the persistent app shell. */
export function QueryFeedback({ error, fetching = false, onRetry }: { error?: unknown; fetching?: boolean; onRetry: () => unknown }) {
  if (error) return (
    <div className="query-error" role="alert">
      <AlertCircle size={18} aria-hidden="true" />
      <span>Couldn’t update this section. Any displayed data may be out of date.</span>
      <Button size="sm" variant="outline" onClick={() => onRetry()} isLoading={fetching}><RefreshCw size={14} aria-hidden="true" />Retry</Button>
    </div>
  );
  return <RefreshIndicator active={fetching} />;
}
