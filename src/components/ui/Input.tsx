import { type InputHTMLAttributes, forwardRef, useState, useId } from 'react';
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
  const generatedId = useId();
  const inputId = id || generatedId;
  const helperId = `${inputId}-help`;

  const containerClasses = [
    'custom-input-container',
    fullWidth ? 'w-full' : '',
    error ? 'has-error' : '',
    className
  ].filter(Boolean).join(' ');

  const resolvedType = isPasswordType 
    ? (showPassword ? 'text' : 'password') 
    : props.type;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (props.type === 'email') {
      e.target.value = e.target.value.toLowerCase();
    }
    props.onChange?.(e);
  };

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
          aria-invalid={error ? true : props['aria-invalid']}
          aria-describedby={[props['aria-describedby'], (error || helperText) ? helperId : undefined].filter(Boolean).join(' ') || undefined}
          onChange={handleChange}
          type={resolvedType}
        />
        {isPasswordType && (
          <button
            type="button"
            className="password-toggle-btn"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            disabled={props.disabled}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {(error || helperText) && (
        <span id={helperId} className={`custom-input-helper ${error ? 'error-text' : ''}`}>
          {error || helperText}
        </span>
      )}
    </div>
  );
});

Input.displayName = 'Input';
