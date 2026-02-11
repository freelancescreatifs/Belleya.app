/**
 * Time Helpers - Standardization for PostgreSQL TIME WITHOUT TIME ZONE
 *
 * PostgreSQL TIME columns require format: HH:MM:SS
 * This module ensures all time values are properly formatted before database operations.
 */

/**
 * Normalizes time string to PostgreSQL TIME format (HH:MM:SS)
 *
 * @param time - Time string in various formats (HH:MM, HH:MM:SS, or empty)
 * @returns Normalized time string (HH:MM:SS) or null if invalid/empty
 *
 * @example
 * normalizeTime("14:30")     // "14:30:00"
 * normalizeTime("14:30:00")  // "14:30:00"
 * normalizeTime("")          // null
 * normalizeTime(null)        // null
 */
export function normalizeTime(time: string | null | undefined): string | null {
  if (!time || time.trim() === '') {
    return null;
  }

  const trimmed = time.trim();

  if (trimmed.length === 5 && trimmed.match(/^\d{2}:\d{2}$/)) {
    return `${trimmed}:00`;
  }

  if (trimmed.length === 8 && trimmed.match(/^\d{2}:\d{2}:\d{2}$/)) {
    return trimmed;
  }

  return null;
}

/**
 * Validates if a time string is in correct PostgreSQL TIME format
 *
 * @param time - Time string to validate
 * @returns true if valid HH:MM:SS format, false otherwise
 */
export function isValidTimeFormat(time: string | null | undefined): boolean {
  if (!time) return false;
  return /^\d{2}:\d{2}:\d{2}$/.test(time.trim());
}

/**
 * Converts time string to display format (HH:MM)
 *
 * @param time - Time string in HH:MM:SS format
 * @returns Display time in HH:MM format
 */
export function timeToDisplay(time: string | null | undefined): string {
  if (!time) return '';
  const trimmed = time.trim();

  if (trimmed.length === 8) {
    return trimmed.substring(0, 5);
  }

  return trimmed;
}

/**
 * Batch normalizes multiple time fields in an object
 * Useful for form data before submission
 *
 * @param data - Object containing time fields
 * @param timeFields - Array of field names containing time values
 * @returns New object with normalized time fields
 */
export function normalizeTimeFields<T extends Record<string, any>>(
  data: T,
  timeFields: (keyof T)[]
): T {
  const normalized = { ...data };

  for (const field of timeFields) {
    if (field in normalized) {
      normalized[field] = normalizeTime(normalized[field] as string) as any;
    }
  }

  return normalized;
}
