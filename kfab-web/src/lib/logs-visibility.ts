import { AppRole } from './auth-store';

/**
 * Returns the list of creator roles visible in the "All Logs" UI
 * based strictly on the current authenticated user's role.
 *
 * SPECIFICATION CONTRACT:
 * - SUPER_ADMIN: Can see logs created by SUPER_ADMIN, ADMIN, SUPERVISOR, ACCOUNT (everyone)
 * - ADMIN:       Can see logs created by ADMIN, SUPERVISOR, ACCOUNT
 * - SUPERVISOR:  Can see logs created by ADMIN, SUPERVISOR (hides SUPER_ADMIN and ACCOUNT)
 * - ACCOUNT:     Can see logs created by ADMIN, SUPERVISOR, ACCOUNT (hides SUPER_ADMIN)
 */
export function getVisibleLogRoles(userRole: AppRole | string): string[] {
  const role = (userRole === 'ACCOUNTANT' ? 'ACCOUNT' : userRole || '').toUpperCase();
  switch (role) {
    case 'SUPER_ADMIN':
      return ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'ACCOUNT'];
    case 'ADMIN':
      return ['ADMIN', 'SUPERVISOR', 'ACCOUNT'];
    case 'SUPERVISOR':
      return ['ADMIN', 'SUPERVISOR'];
    case 'ACCOUNT':
      return ['ADMIN', 'SUPERVISOR', 'ACCOUNT'];
    default:
      return ['ADMIN', 'SUPERVISOR', 'ACCOUNT'];
  }
}

/**
 * Determines whether the "System Logs" tab is visible to the given role.
 * Visible ONLY for SUPER_ADMIN and ADMIN.
 */
export function canViewSystemLogs(userRole: AppRole | string): boolean {
  const role = (userRole === 'ACCOUNTANT' ? 'ACCOUNT' : userRole || '').toUpperCase();
  return role === 'SUPER_ADMIN' || role === 'ADMIN';
}
