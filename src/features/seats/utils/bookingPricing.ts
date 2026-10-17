import { addDaysToDate, addMonthsToDate } from '../../../utils/dateUtils';
import type { Shift } from '../types';

/**
 * Calculates the standard base amount for a seat booking based on shift pricing and duration mode.
 */
export function calculateBaseAmount(
  shift: Shift | undefined | null,
  durationMode: number | string,
  startDate?: string,
  endDate?: string
): number {
  if (!shift) return 0;
  const basePrice = shift.price || 0;

  if (typeof durationMode === 'number') {
    if (durationMode === 3 && shift.price3Months) {
      return shift.price3Months;
    }
    if (durationMode === 6 && shift.price6Months) {
      return shift.price6Months;
    }
    return basePrice * durationMode;
  }

  if (durationMode === 'flex' && startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
      const diffTime = end.getTime() - start.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 0) {
        return Math.round(basePrice * (diffDays / 30));
      }
    }
  }

  return basePrice;
}

/**
 * Computes remaining due amount based on total fee and paid amount.
 */
export function calculateDueAmount(totalAmount: number, paidAmount: number | string): number {
  const paid = typeof paidAmount === 'number' ? paidAmount : parseFloat(paidAmount) || 0;
  return Math.max(0, totalAmount - paid);
}

/**
 * Computes renewal end date and pricing for renewal form.
 */
export function calculateRenewalPricing(
  shift: Shift | undefined | null,
  startDate: string,
  duration: number | string
): { endDate: string; price: number } {
  if (!shift || !startDate) {
    return { endDate: '', price: 0 };
  }

  let endDate = '';
  let price = shift.price || 0;

  if (duration === '7d') {
    endDate = addDaysToDate(startDate, 7);
    price = Math.round((price / 30) * 7);
  } else if (duration === '10d') {
    endDate = addDaysToDate(startDate, 10);
    price = Math.round((price / 30) * 10);
  } else if (duration === '15d') {
    endDate = addDaysToDate(startDate, 15);
    price = Math.round((price / 30) * 15);
  } else {
    const months = typeof duration === 'number' ? duration : parseInt(duration as string, 10) || 1;
    endDate = addMonthsToDate(startDate, months);
    if (months === 3 && shift.price3Months) {
      price = shift.price3Months;
    } else if (months === 6 && shift.price6Months) {
      price = shift.price6Months;
    } else {
      price = price * months;
    }
  }

  return { endDate, price };
}
