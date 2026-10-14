/**
 * Centralized Input Validators & Regex Rules
 * Single source of truth for form data validation across the platform.
 */

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/;
export const PINCODE_REGEX = /^\d{6}$/;
export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
export const AADHAR_REGEX = /^\d{12}$/;
export const NAME_REGEX = /^[a-zA-Z0-9\s.-]{2,50}$/;

export function isValidEmail(email: string): boolean {
  if (!email) return false;
  return EMAIL_REGEX.test(email.trim());
}

export function isValidIndianMobile(mobile: string): boolean {
  if (!mobile) return false;
  const digits = mobile.replace(/\D/g, '');
  return digits.length === 10 && INDIAN_MOBILE_REGEX.test(digits);
}

export function isValidPincode(pincode: string): boolean {
  if (!pincode) return false;
  return PINCODE_REGEX.test(pincode.trim());
}

export function isValidGSTIN(gstin: string): boolean {
  if (!gstin) return false;
  return gstin.trim().length === 15 && GSTIN_REGEX.test(gstin.trim().toUpperCase());
}

export function isValidAadhar(aadhar: string): boolean {
  if (!aadhar) return false;
  const digits = aadhar.replace(/\D/g, '');
  return AADHAR_REGEX.test(digits);
}

export function validateName(name: string): string | null {
  const trimmed = (name || '').trim();
  if (!trimmed) return 'Name is required';
  if (trimmed.length < 2) return 'Name must be at least 2 characters';
  if (trimmed.length > 50) return 'Name must be at most 50 characters';
  if (!NAME_REGEX.test(trimmed)) return 'Name contains invalid characters';
  return null;
}

export function validateEmail(email: string, required = true): string | null {
  const trimmed = (email || '').trim();
  if (!trimmed) return required ? 'Email is required' : null;
  if (!isValidEmail(trimmed)) return 'Invalid email address';
  return null;
}

export function validateMobile(mobile: string, required = true): string | null {
  const trimmed = (mobile || '').trim();
  if (!trimmed) return required ? 'Mobile number is required' : null;
  if (!isValidIndianMobile(trimmed)) return 'Must be a valid 10-digit mobile number starting with 6-9';
  return null;
}

export function validatePincode(pincode: string, required = true): string | null {
  const trimmed = (pincode || '').trim();
  if (!trimmed) return required ? 'PIN code is required' : null;
  if (!isValidPincode(trimmed)) return 'PIN code must be exactly 6 digits';
  return null;
}
