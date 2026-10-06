/**
 * Centralized Date Utilities
 * Single Source of Truth for Date Formatting and Calculations across the Application.
 */

/**
 * Formats a date string, Date object, or timestamp into standard YYYY-MM-DD format.
 * Handles ISO date string splitting ('T'[0]) to avoid UTC timezone shifts.
 * 
 * @param val Date | string | null | undefined
 * @returns YYYY-MM-DD string or empty string if invalid
 */
export const formatYYYYMMDD = (val?: string | Date | null): string => {
  if (!val) return '';
  if (typeof val === 'string') {
    const trimmed = val.trim();
    const datePart = trimmed.split('T')[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
      return datePart;
    }
  }
  const d = new Date(val);
  if (isNaN(d.getTime())) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

/**
 * Returns today's date in YYYY-MM-DD format based on local time.
 */
export const getTodayYYYYMMDD = (): string => {
  return formatYYYYMMDD(new Date());
};

/**
 * Formats a date into human-readable display format (e.g. "15 Jul 2026").
 * 
 * @param val Date | string | null | undefined
 * @param fallback string returned if val is empty/invalid (defaults to 'N/A')
 * @returns Formatted display string
 */
export const formatDateDisplay = (val?: string | Date | null, fallback: string = 'N/A'): string => {
  if (!val) return fallback;
  const d = new Date(val);
  if (isNaN(d.getTime())) return fallback;
  return d.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

/**
 * Adds specified months to a date and returns YYYY-MM-DD format.
 * 
 * @param baseDate Date | string
 * @param months number of months to add
 * @returns YYYY-MM-DD string
 */
export const addMonthsToDate = (baseDate: string | Date, months: number = 1): string => {
  const formatted = formatYYYYMMDD(baseDate);
  if (!formatted) return '';
  const d = new Date(formatted);
  d.setMonth(d.getMonth() + months);
  return formatYYYYMMDD(d);
};

/**
 * Adds specified days to a date and returns YYYY-MM-DD format.
 * 
 * @param baseDate Date | string
 * @param days number of days to add
 * @returns YYYY-MM-DD string
 */
export const addDaysToDate = (baseDate: string | Date, days: number = 1): string => {
  const formatted = formatYYYYMMDD(baseDate);
  if (!formatted) return '';
  const d = new Date(formatted);
  d.setDate(d.getDate() + days);
  return formatYYYYMMDD(d);
};

/**
 * Formats a 24-hour time string (HH:mm) into a 12-hour format string (hh:mm AM/PM).
 * @param timeStr 24-hour time string (e.g., '14:00')
 * @returns 12-hour time string (e.g., '02:00 PM')
 */
export const formatTo12hString = (timeStr?: string | null): string => {
  if (!timeStr) return '';
  const [hhStr, mmStr] = timeStr.split(':');
  if (!hhStr || !mmStr) return timeStr;
  
  let hh = parseInt(hhStr, 10);
  const mm = mmStr || '00';

  let period = 'AM';
  if (hh >= 12) {
    period = 'PM';
    if (hh > 12) hh -= 12;
  } else if (hh === 0) {
    hh = 12;
  }

  return `${hh.toString().padStart(2, '0')}:${mm.padStart(2, '0')} ${period}`;
};

/**
 * Calculates the duration between two 24-hour time strings.
 * @param start24 24-hour start time (e.g., '14:00')
 * @param end24 24-hour end time (e.g., '20:00')
 * @returns Duration string (e.g., '6 Hours' or '6h 30m')
 */
export const calculateShiftDuration = (start24?: string, end24?: string): string => {
  if (!start24 || !end24) return '';
  const [sH, sM] = start24.split(':').map(Number);
  const [eH, eM] = end24.split(':').map(Number);
  if (isNaN(sH) || isNaN(sM) || isNaN(eH) || isNaN(eM)) return '';
  let startMinutes = sH * 60 + sM;
  let endMinutes = eH * 60 + eM;
  if (endMinutes <= startMinutes) {
    endMinutes += 24 * 60;
  }
  const diffMinutes = endMinutes - startMinutes;
  const hours = Math.floor(diffMinutes / 60);
  const mins = diffMinutes % 60;
  if (mins === 0) return `${hours} hr`;
  return `${hours} hr ${mins}m`;
};
