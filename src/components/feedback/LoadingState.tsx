import { LoaderCircle } from 'lucide-react';
import './feedback.css';

export function LoadingState({ label = 'Loading content…', rows = 4 }: { label?: string; rows?: number }) {
  return (
    <div className="loading-state" role="status" aria-live="polite" aria-label={label}>
      <span className="feedback-label"><LoaderCircle size={16} className="feedback-spinner" aria-hidden="true" />{label}</span>
      <div className="skeleton-stack" aria-hidden="true">
        {Array.from({ length: rows }, (_, index) => <div key={index} className="skeleton-row" />)}
      </div>
    </div>
  );
}

export function RefreshIndicator({ active, label = 'Updating…' }: { active: boolean; label?: string }) {
  return <div className="refresh-status" role="status" aria-live="polite">{active && <><LoaderCircle size={14} className="feedback-spinner" aria-hidden="true" />{label}</>}</div>;
}
