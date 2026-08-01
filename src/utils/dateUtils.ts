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
 * Formats a date into human-readable display format (e.g. "15 Jul 2026").
 * 
 * @param val Date | string | null | undefined
 * @returns Formatted display string
 */
export const formatDateDisplay = (val?: string | Date | null): string => {
  if (!val) return '';
  const d = new Date(val);
  if (isNaN(d.getTime())) return '';
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
