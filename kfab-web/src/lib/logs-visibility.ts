import { AppRole } from './auth-store';

/**
 * Determines whether the "All Logs" tab is visible to the given role.
 * Visible ONLY for SUPER_ADMIN and ADMIN.
 */
export function canViewAllLogs(userRole: AppRole | string): boolean {
  const role = (userRole === 'ACCOUNTANT' ? 'ACCOUNT' : userRole || '').toUpperCase();
  return role === 'SUPER_ADMIN' || role === 'ADMIN';
}

/**
 * Determines whether the "System Logs" tab is visible to the given role.
 * Visible ONLY for SUPER_ADMIN.
 */
export function canViewSystemLogs(userRole: AppRole | string): boolean {
  const role = (userRole === 'ACCOUNTANT' ? 'ACCOUNT' : userRole || '').toUpperCase();
  return role === 'SUPER_ADMIN';
}

/**
 * Returns the list of creator roles visible in the "All Logs" UI
 * based strictly on the current authenticated user's role.
 */
export function getVisibleLogRoles(userRole: AppRole | string): string[] {
  const role = (userRole === 'ACCOUNTANT' ? 'ACCOUNT' : userRole || '').toUpperCase();
  switch (role) {
    case 'SUPER_ADMIN':
      return ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'ACCOUNT'];
    case 'ADMIN':
      return ['ADMIN', 'SUPERVISOR', 'ACCOUNT'];
    default:
      return [];
  }
}

/**
 * 7-Day Retention Window Helper:
 * Returns the Date threshold (7 days ago).
 * Logs older than this threshold are not stored or queried.
 */
export const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export function getSevenDaysAgoCutoff(): Date {
  return new Date(Date.now() - SEVEN_DAYS_MS);
}

export function isWithinSevenDays(isoString?: string | null): boolean {
  if (!isoString) return false;
  const t = new Date(isoString).getTime();
  if (isNaN(t)) return false;
  return t >= Date.now() - SEVEN_DAYS_MS;
}

