import { forwardRef, useId, type TextareaHTMLAttributes } from 'react';
import './Input.css';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> { label: string; error?: string; helperText?: string; }
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ label, error, helperText, id, className = '', ...props }, ref) => {
  const generatedId = useId();
  const fieldId = id || generatedId;
  const helperId = `${fieldId}-help`;
  return <div className={`custom-input-container ${error ? 'has-error' : ''}`}>
    <label className="custom-input-label" htmlFor={fieldId}>{label}</label>
    <textarea {...props} ref={ref} id={fieldId} className={`custom-input ${className}`} aria-invalid={error ? true : props['aria-invalid']} aria-describedby={[props['aria-describedby'], error || helperText ? helperId : undefined].filter(Boolean).join(' ') || undefined} />
    {(error || helperText) && <span id={helperId} className={`custom-input-helper ${error ? 'error-text' : ''}`}>{error || helperText}</span>}
  </div>;
});
Textarea.displayName = 'Textarea';
