import React from 'react';
import { Search } from 'lucide-react';
import { getStudentDisplayName, getStudentEmail, getStudentMobile } from '../../../utils/studentUtils';

export interface StudentPickerProps {
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  onSelectStudent: (student: any) => void;
  displayedStudents: any[];
  showDropdown: boolean;
  setShowDropdown: (show: boolean) => void;
  isFocused: boolean;
  setIsFocused: (focused: boolean) => void;
  disabled?: boolean;
}

export const StudentPicker: React.FC<StudentPickerProps> = ({
  searchQuery,
  onSearchQueryChange,
  onSelectStudent,
  displayedStudents,
  showDropdown,
  setShowDropdown,
  isFocused,
  setIsFocused,
  disabled = false,
}) => {
  return (
    <div style={{ position: 'relative' }}>
      <label
        className="custom-input-label"
        style={{
          fontSize: '0.7rem',
          fontWeight: 700,
          color: 'var(--text-slate)',
          textTransform: 'uppercase',
          marginBottom: '4px',
          display: 'block',
        }}
      >
        Search Student
      </label>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#F1F5F9',
          borderRadius: '12px',
          padding: '4px 12px',
          border: isFocused ? '1px solid var(--accent-blue)' : '1px solid transparent',
          transition: 'all 150ms ease',
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <Search size={16} style={{ color: '#94a3b8', marginRight: '6px' }} />
        <input
          type="text"
          disabled={disabled}
          placeholder="Name, email, phone..."
          value={searchQuery}
          onChange={(e) => {
            onSearchQueryChange(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => {
            setShowDropdown(true);
            setIsFocused(true);
          }}
          onBlur={() => {
            setIsFocused(false);
            setTimeout(() => setShowDropdown(false), 250);
          }}
          style={{
            border: 'none',
            background: 'transparent',
            outline: 'none',
            width: '100%',
            padding: '6px 0',
            fontSize: '0.85rem',
            color: 'var(--text-navy)',
          }}
        />
      </div>

      {showDropdown && displayedStudents.length > 0 && !disabled && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: '#ffffff',
            border: '1px solid var(--border-card)',
            borderRadius: '12px',
            boxShadow: 'var(--shadow-hover)',
            zIndex: 1000,
            marginTop: '4px',
            maxHeight: '180px',
            overflowY: 'auto',
          }}
        >
          {displayedStudents.map((st: any) => (
            <div
              key={st.id}
              onMouseDown={(e) => {
                e.preventDefault();
                onSelectStudent(st);
                setShowDropdown(false);
              }}
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                borderBottom: '1px solid #f1f5f9',
              }}
            >
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-navy)' }}>
                {getStudentDisplayName(st)}
              </span>
              <span style={{ fontSize: '0.675rem', color: 'var(--text-slate)' }}>
                {getStudentEmail(st)} • {getStudentMobile(st)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
