import React, { type ButtonHTMLAttributes } from 'react';
import './Button.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  className = '',
  disabled,
  type = 'button',
  ...props
}) => {
  const classes = [
    'custom-button',
    `btn-${variant}`,
    `btn-${size}`,
    fullWidth ? 'btn-full' : '',
    isLoading ? 'btn-loading' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <button 
      type={type}
      aria-busy={isLoading || undefined}
      className={classes} 
      disabled={disabled || isLoading} 
      {...props}
    >
      {isLoading && (
        <svg aria-hidden="true" className="button-spinner" viewBox="0 0 50 50">
          <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5"></circle>
        </svg>
      )}
      <span className={isLoading ? 'button-content-hidden' : ''}>{children}</span>
    </button>
  );
};
