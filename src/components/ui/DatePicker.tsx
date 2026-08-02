import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import { CustomCalendar } from './CustomCalendar';
import { formatDateDisplay, formatYYYYMMDD } from '../../utils/dateUtils';

interface DatePickerProps {
  value?: string | Date;
  onChange: (dateStr: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  label,
  placeholder = 'Select date',
  disabled = false,
  required = false,
  style,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openDirection, setOpenDirection] = useState<'bottom' | 'top'>('bottom');
  const containerRef = useRef<HTMLDivElement>(null);

  const formattedValue = formatYYYYMMDD(value);
  const dateObj = formattedValue ? new Date(formattedValue) : new Date();

  const handleToggle = () => {
    if (disabled) return;
    if (!isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      if (spaceBelow < 340 && spaceAbove > spaceBelow) {
        setOpenDirection('top');
      } else {
        setOpenDirection('bottom');
      }
    }
    setIsOpen((prev) => !prev);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', ...style }} className={className}>
      {label && (
        <label
          style={{
            fontSize: '0.7rem',
            fontWeight: 700,
            color: 'var(--text-slate)',
            textTransform: 'uppercase',
            marginBottom: '4px',
            display: 'block',
          }}
        >
          {label} {required && <span style={{ color: 'var(--status-red)' }}>*</span>}
        </label>
      )}

      <button
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          borderRadius: '12px',
          border: '1px solid rgba(15, 23, 42, 0.1)',
          backgroundColor: disabled ? '#f1f5f9' : '#ffffff',
          color: formattedValue ? 'var(--text-navy)' : '#94a3b8',
          fontSize: '0.85rem',
          fontWeight: 600,
          cursor: disabled ? 'not-allowed' : 'pointer',
          outline: 'none',
          boxSizing: 'border-box',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CalendarIcon size={16} style={{ color: '#D97706' }} />
          <span>{formattedValue ? formatDateDisplay(formattedValue) : placeholder}</span>
        </div>
        <ChevronDown size={14} style={{ color: '#94a3b8', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 150ms ease' }} />
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            ...(openDirection === 'bottom' ? { top: '100%', marginTop: '6px' } : { bottom: '100%', marginBottom: '6px' }),
            left: 0,
            zIndex: 9999,
            animation: 'fadeIn 150ms ease-out',
          }}
        >
          <CustomCalendar
            compact
            value={dateObj}
            onChange={(selectedDate) => {
              const yyyy = selectedDate.getFullYear();
              const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
              const dd = String(selectedDate.getDate()).padStart(2, '0');
              onChange(`${yyyy}-${mm}-${dd}`);
              setIsOpen(false);
            }}
          />
        </div>
      )}
    </div>
  );
};
