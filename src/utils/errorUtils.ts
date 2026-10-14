/**
 * Centralized API & Runtime Error Handling Utilities
 */

export interface ApiErrorPayload {
  status?: number | string;
  data?: {
    message?: string;
    errors?: Record<string, string[] | string>;
  };
  message?: string;
  error?: string;
}

/**
 * Safely extracts a user-facing error message from any API error, RTK Query error,
 * Error instance, or network exception.
 *
 * @param error The caught error object
 * @param fallback Default message if extraction fails
 * @returns Human-readable error message string
 */
export function getErrorMessage(error: unknown, fallback = 'An unexpected error occurred. Please try again.'): string {
  if (!error) return fallback;

  if (typeof error === 'string') {
    return error;
  }

  // Handle RTK Query / FetchBaseQueryError shapes
  const apiErr = error as ApiErrorPayload;
  if (apiErr.data?.message && typeof apiErr.data.message === 'string') {
    return apiErr.data.message;
  }

  // Handle validation error maps
  if (apiErr.data?.errors && typeof apiErr.data.errors === 'object') {
    const firstKey = Object.keys(apiErr.data.errors)[0];
    const val = apiErr.data.errors[firstKey];
    if (Array.isArray(val) && val.length > 0) return String(val[0]);
    if (typeof val === 'string') return val;
  }

  // Handle standard JS Error instances
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (apiErr.error && typeof apiErr.error === 'string') {
    return apiErr.error;
  }

  if (apiErr.message && typeof apiErr.message === 'string') {
    return apiErr.message;
  }

  return fallback;
}

/**
 * Checks if the given error indicates an expired or unauthorized session (HTTP 401).
 */
export function isUnauthorizedError(error: unknown): boolean {
  const apiErr = error as ApiErrorPayload;
  return apiErr?.status === 401;
}

/**
 * Checks if the given error indicates forbidden or disabled access (HTTP 403).
 */
export function isForbiddenError(error: unknown): boolean {
  const apiErr = error as ApiErrorPayload;
  return apiErr?.status === 403;
}
