import React from 'react';
import './Switch.css';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  id?: string;
  disabled?: boolean;
}

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  label,
  id,
  disabled = false,
}) => {
  const generatedId = React.useId();
  const switchId = id || generatedId;

  return (
    <div className={`switch-container ${disabled ? 'disabled' : ''}`}>
      <label htmlFor={switchId} className="switch-wrapper">
        <input
          type="checkbox"
          id={switchId}
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="switch-input"
        />
        <span className="switch-slider" />
      </label>
      {label && (
        <label htmlFor={switchId} className="switch-label">
          {label}
        </label>
      )}
    </div>
  );
};
