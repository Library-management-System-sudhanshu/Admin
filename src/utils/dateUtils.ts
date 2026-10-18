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
  const startMinutes = sH * 60 + sM;
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

/**
 * Calculates the inclusive end date for a subscription plan based on start date and duration.
 * A subscription starting on Oct 18 for 1 Month ends on Nov 17 (inclusive), so next renewal is Nov 18.
 * A subscription starting on Oct 18 for 7 Days ends on Oct 24 (inclusive), so next renewal is Oct 25.
 * 
 * @param startDate YYYY-MM-DD or Date
 * @param duration number (months) | string ('7d', '15 Days', '1 Month', '3 Months', etc.)
 * @returns YYYY-MM-DD string
 */
export const calculateSubscriptionEndDate = (startDate: string | Date, duration: number | string): string => {
  const formattedStart = formatYYYYMMDD(startDate);
  if (!formattedStart) return '';

  if (typeof duration === 'number') {
    const targetDate = addMonthsToDate(formattedStart, duration);
    return addDaysToDate(targetDate, -1);
  }

  const str = String(duration).trim().toLowerCase();
  
  // Days pattern: e.g. '7d', '7 days', '15d', '15 days', '30 days'
  const dayMatch = str.match(/^(\d+)\s*(d|day|days)?$/i);
  if (dayMatch && (str.includes('d') || str.includes('day'))) {
    const days = parseInt(dayMatch[1], 10);
    if (!isNaN(days) && days > 0) {
      return addDaysToDate(formattedStart, days - 1);
    }
  }

  // Months pattern: e.g. '1m', '1 month', '3 months', '6m'
  const monthMatch = str.match(/^(\d+)\s*(m|month|months)?$/i);
  if (monthMatch && (str.includes('m') || str.includes('month'))) {
    const months = parseInt(monthMatch[1], 10);
    if (!isNaN(months) && months > 0) {
      const targetDate = addMonthsToDate(formattedStart, months);
      return addDaysToDate(targetDate, -1);
    }
  }

  // Years pattern: e.g. '1y', '1 year'
  const yearMatch = str.match(/^(\d+)\s*(y|year|years)?$/i);
  if (yearMatch && (str.includes('y') || str.includes('year'))) {
    const years = parseInt(yearMatch[1], 10);
    if (!isNaN(years) && years > 0) {
      const targetDate = addMonthsToDate(formattedStart, years * 12);
      return addDaysToDate(targetDate, -1);
    }
  }

  // Pure integer number in string: assume months if <= 12, else days
  const num = parseInt(str, 10);
  if (!isNaN(num) && num > 0) {
    if (num <= 12) {
      const targetDate = addMonthsToDate(formattedStart, num);
      return addDaysToDate(targetDate, -1);
    } else {
      return addDaysToDate(formattedStart, num - 1);
    }
  }

  return '';
};

/**
 * Returns a human-readable duration label (e.g. '1 Month', '3 Months', '7 Days', '15 Days')
 * based on start date and end date or duration in days.
 */
export const formatPlanDuration = (
  startDate?: string | Date | null,
  endDate?: string | Date | null,
  fallback?: string
): string => {
  if (fallback) return fallback;
  if (!startDate || !endDate) return 'N/A';
  const start = new Date(formatYYYYMMDD(startDate));
  const end = new Date(formatYYYYMMDD(endDate));
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 'N/A';

  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive

  if (diffDays <= 0) return 'Custom';
  if (diffDays === 7) return '7 Days';
  if (diffDays === 10) return '10 Days';
  if (diffDays === 15) return '15 Days';
  if (diffDays >= 28 && diffDays <= 31) return '1 Month';
  if (diffDays >= 58 && diffDays <= 62) return '2 Months';
  if (diffDays >= 88 && diffDays <= 93) return '3 Months';
  if (diffDays >= 178 && diffDays <= 186) return '6 Months';
  if (diffDays >= 360 && diffDays <= 366) return '1 Year';
  return `${diffDays} Days`;
};

/**
 * Calculates price for a given shift and duration, taking into account
 * shift customPricing tiers or preset price tier fields.
 */
export const calculatePlanPrice = (shift: any, duration: number | string): number => {
  if (!shift) return 0;
  const basePrice = Number(shift.price) || 0;

  // 1. If shift has customPricing tiers
  if (Array.isArray(shift.customPricing) && shift.customPricing.length > 0) {
    const norm = String(duration).trim().toLowerCase();
    const matchedTier = shift.customPricing.find((cp: any) => {
      const cpLabel = String(cp.label).trim().toLowerCase();
      if (cpLabel === norm) return true;
      if (typeof duration === 'number') {
        if (cpLabel.includes('month') && parseInt(cpLabel, 10) === duration) return true;
      }
      return false;
    });
    if (matchedTier && matchedTier.price !== undefined && !isNaN(Number(matchedTier.price))) {
      return Number(matchedTier.price);
    }
  }

  // 2. Check duration patterns
  const str = String(duration).trim().toLowerCase();
  if (str === '7d' || str.startsWith('7 day')) {
    return Number(shift.price7Days) || Math.round((basePrice / 30) * 7);
  }
  if (str === '10d' || str.startsWith('10 day')) {
    return Math.round((basePrice / 30) * 10);
  }
  if (str === '15d' || str.startsWith('15 day')) {
    return Number(shift.price15Days) || Math.round((basePrice / 30) * 15);
  }

  const months = typeof duration === 'number' ? duration : parseInt(String(duration), 10) || 1;
  if (months === 3 && shift.price3Months) {
    return Number(shift.price3Months);
  }
  if (months === 6 && shift.price6Months) {
    return Number(shift.price6Months);
  }
  return basePrice * months;
};
