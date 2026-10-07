import { useId, type CSSProperties } from 'react';
import { ChevronDown } from 'lucide-react';
import './Select.css';

export interface SelectOption { value: string | number; label: string; isAction?: boolean; }
interface SelectProps {
  value: string | number;
  onChange: (value: any) => void;
  options: SelectOption[];
  placeholder?: string;
  label?: string;
  id?: string;
  disabled?: boolean;
  style?: CSSProperties;
}

/** Native selection preserves keyboard, screen-reader and mobile picker support. */
export function Select({ value, onChange, options, placeholder = 'Select option', label, id, disabled = false, style }: SelectProps) {
  const generatedId = useId();
  const fieldId = id || generatedId;
  const selected = options.some((option) => option.value === value);
  return <div className={`custom-select-container ${disabled ? 'disabled' : ''}`} style={style}>
    {label && <label className="custom-input-label" htmlFor={fieldId}>{label}</label>}
    <div className="native-select-wrapper">
      <select id={fieldId} className="custom-select-trigger" disabled={disabled} value={selected ? String(value) : '__placeholder__'} aria-label={label || placeholder} onChange={(event) => {
        const option = options.find((item) => String(item.value) === event.target.value);
        if (option) onChange(option.value);
      }}>
        {!selected && <option value="__placeholder__" disabled>{placeholder}</option>}
        {options.map((option) => <option key={option.value} value={String(option.value)}>{option.label}</option>)}
      </select>
      <ChevronDown size={16} className="custom-select-arrow" aria-hidden="true" />
    </div>
  </div>;
}
