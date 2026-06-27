import { type InputHTMLAttributes, forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
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
  const isPasswordType = props.type === 'password';
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  const containerClasses = [
    'custom-input-container',
    fullWidth ? 'w-full' : '',
    error ? 'has-error' : '',
    className
  ].filter(Boolean).join(' ');

  const resolvedType = isPasswordType 
    ? (showPassword ? 'text' : 'password') 
    : props.type;

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
          className={`custom-input ${isPasswordType ? 'is-password' : ''}`}
          {...props}
          type={resolvedType}
        />
        {isPasswordType && (
          <button
            type="button"
            className="password-toggle-btn"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
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
