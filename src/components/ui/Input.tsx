import { type InputHTMLAttributes, forwardRef } from 'react';
import './Input.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  fullWidth = true,
  className = '',
  id,
  ...props
}, ref) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  const containerClasses = [
    'custom-input-container',
    fullWidth ? 'w-full' : '',
    error ? 'has-error' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses}>
      {label && (
        <label htmlFor={inputId} className="custom-input-label">
          {label}
        </label>
      )}
      <div className="custom-input-wrapper">
        <input
          id={inputId}
          ref={ref}
          className="custom-input"
          {...props}
        />
      </div>
      {(error || helperText) && (
        <span className={`custom-input-helper ${error ? 'error-text' : ''}`}>
          {error || helperText}
        </span>
      )}
    </div>
  );
});

Input.displayName = 'Input';
