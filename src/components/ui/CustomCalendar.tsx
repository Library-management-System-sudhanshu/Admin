import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './CustomCalendar.css';

export interface CustomCalendarProps {
  value?: Date | string | null;
  onChange?: (date: Date) => void;
  className?: string;
  style?: React.CSSProperties;
  standalone?: boolean;
  compact?: boolean;
}

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export const CustomCalendar: React.FC<CustomCalendarProps> = ({
  value,
  onChange,
  className = '',
  style,
  standalone = false,
  compact = false,
}) => {
  const [currentMonthDate, setCurrentMonthDate] = useState(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) return new Date(d.getFullYear(), d.getMonth(), 1);
    }
    return new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  });

  const [selectedDate, setSelectedDate] = useState<Date | null>(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) return d;
    }
    return new Date();
  });

  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();

  const monthName = currentMonthDate.toLocaleString('default', { month: 'long' });
  const headerTitle = `${monthName} ${year}`;

  const handlePrevMonth = () => {
    setCurrentMonthDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonthDate(new Date(year, month + 1, 1));
  };

  const handleDateClick = (dayDate: Date) => {
    setSelectedDate(dayDate);
    if (onChange) {
      onChange(dayDate);
    }
  };

  // Grid calculation (Monday start: M T W T F S S)
  const firstDayOfMonth = new Date(year, month, 1);
  const startDayIndex = (firstDayOfMonth.getDay() + 6) % 7; // Convert 0(Sun)->6, 1(Mon)->0

  const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const calendarDays: Array<{
    date: Date;
    isCurrentMonth: boolean;
    dayNumber: number;
  }> = [];

  // Previous month overflow days
  for (let i = startDayIndex - 1; i >= 0; i--) {
    const prevDayNumber = daysInPrevMonth - i;
    const prevDate = new Date(year, month - 1, prevDayNumber);
    calendarDays.push({
      date: prevDate,
      isCurrentMonth: false,
      dayNumber: prevDayNumber,
    });
  }

  // Current month days
  for (let day = 1; day <= daysInCurrentMonth; day++) {
    const currentDate = new Date(year, month, day);
    calendarDays.push({
      date: currentDate,
      isCurrentMonth: true,
      dayNumber: day,
    });
  }

  // Next month overflow days to complete 35 or 42 grid items
  const totalDays = calendarDays.length;
  const targetTotal = totalDays > 35 ? 42 : 35;
  const nextMonthDaysNeeded = targetTotal - totalDays;

  for (let day = 1; day <= nextMonthDaysNeeded; day++) {
    const nextDate = new Date(year, month + 1, day);
    calendarDays.push({
      date: nextDate,
      isCurrentMonth: false,
      dayNumber: day,
    });
  }

  const isSameDay = (d1: Date | null, d2: Date) => {
    if (!d1) return false;
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  const today = new Date();
  const iconSize = compact ? 16 : 20;

  const calendarCardContent = (
    <div
      className={`custom-calendar-card ${compact ? 'compact' : ''} ${className}`}
      style={style}
    >
      {/* Header */}
      <div className="custom-calendar-header">
        <button
          type="button"
          className="custom-calendar-nav-btn"
          onClick={handlePrevMonth}
          aria-label="Previous Month"
        >
          <ChevronLeft size={iconSize} />
        </button>

        <div className="custom-calendar-title">{headerTitle}</div>

        <button
          type="button"
          className="custom-calendar-nav-btn"
          onClick={handleNextMonth}
          aria-label="Next Month"
        >
          <ChevronRight size={iconSize} />
        </button>
      </div>

      {/* Weekday Labels */}
      <div className="custom-calendar-weekdays">
        {WEEKDAYS.map((dayLabel, idx) => (
          <div key={`${dayLabel}-${idx}`} className="custom-calendar-weekday">
            {dayLabel}
          </div>
        ))}
      </div>

      {/* Calendar Days Grid */}
      <div className="custom-calendar-grid">
        {calendarDays.map((item, index) => {
          const isSelected = isSameDay(selectedDate, item.date);
          const isTodayDate = isSameDay(today, item.date);

          return (
            <div key={index} className="custom-calendar-day-cell">
              <button
                type="button"
                onClick={() => handleDateClick(item.date)}
                className={[
                  'custom-calendar-day-btn',
                  item.isCurrentMonth ? 'current-month' : 'overflow-month',
                  isSelected ? 'selected' : '',
                  isTodayDate ? 'today' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {item.dayNumber}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );

  if (standalone) {
    return <div className="custom-calendar-wrapper">{calendarCardContent}</div>;
  }

  return calendarCardContent;
};

export default CustomCalendar;
