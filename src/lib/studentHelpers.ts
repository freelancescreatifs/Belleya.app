import type { StudentStatus } from '../types/training';

/**
 * Calculate student status automatically based on training dates
 * @param startDate - Training start date (YYYY-MM-DD)
 * @param endDate - Training end date (YYYY-MM-DD)
 * @returns StudentStatus - 'upcoming', 'in_progress', or 'completed'
 */
export function calculateStudentStatus(startDate: string, endDate: string): StudentStatus {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  if (today < start) {
    return 'upcoming';
  } else if (today >= start && today <= end) {
    return 'in_progress';
  } else {
    return 'completed';
  }
}

/**
 * Get status label in French
 */
export function getStatusLabel(status: StudentStatus): string {
  switch (status) {
    case 'upcoming':
      return 'À venir';
    case 'in_progress':
      return 'En cours';
    case 'completed':
      return 'Terminé';
    default:
      return status;
  }
}

/**
 * Get status color classes for badges
 */
export function getStatusColor(status: StudentStatus): string {
  switch (status) {
    case 'upcoming':
      return 'bg-blue-100 text-blue-800';
    case 'in_progress':
      return 'bg-orange-100 text-orange-800';
    case 'completed':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}
