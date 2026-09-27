import { FastifyRequest, FastifyReply } from 'fastify';
import { supabaseAdmin } from '../db/supabase.js';

export type AppPermission =
  | 'users.view'
  | 'users.manage'
  | 'users.create'
  | 'users.edit'
  | 'users.deactivate'
  | 'users.reset_password'
  | 'users.revoke_session'
  | 'users.assign_role'
  | 'employees.view'
  | 'employees.manage'
  | 'attendance.view'
  | 'attendance.mark'
  | 'attendance.correct'
  | 'stock.view'
  | 'stock.inward'
  | 'stock.outward'
  | 'stock.usage'
  | 'stock.void'
  | 'reports.view'
  | 'reports.export'
  | 'audit.view';

// Role to default permissions catalog
export const ROLE_DEFAULT_PERMISSIONS: Record<string, AppPermission[]> = {
  SUPER_ADMIN: [
    'users.view',
    'users.manage',
    'users.create',
    'users.edit',
    'users.deactivate',
    'users.reset_password',
    'users.revoke_session',
    'users.assign_role',
    'employees.view',
    'employees.manage',
    'attendance.view',
    'attendance.mark',
    'attendance.correct',
    'stock.view',
    'stock.inward',
    'stock.outward',
    'stock.usage',
    'stock.void',
    'reports.view',
    'reports.export',
    'audit.view',
  ],
  ADMIN: [
    'users.view',
    'users.manage',
    'users.create',
    'users.edit',
    'users.deactivate',
    'users.reset_password',
    'users.revoke_session',
    'employees.view',
    'employees.manage',
    'attendance.view',
    'attendance.mark',
    'attendance.correct',
    'stock.view',
    'stock.inward',
    'stock.outward',
    'stock.usage',
    'stock.void',
    'reports.view',
    'reports.export',
    'audit.view',
  ],
  SUPERVISOR: [
    'employees.view',
    'attendance.view',
    'attendance.mark',
    'stock.view',
    'stock.usage',
  ],
  ACCOUNTANT: [
    'employees.view',
    'attendance.view',
    'stock.view',
    'stock.inward',
    'reports.view',
    'reports.export',
  ],
  STOREKEEPER: [
    'stock.view',
    'stock.inward',
    'stock.outward',
    'stock.usage',
    'stock.void',
  ],
  VIEWER: ['stock.view', 'attendance.view', 'reports.view'],
};

/**
 * Checks whether a given user possesses the required permission.
 */
export async function userHasPermission(
  userId: string,
  userRole: string,
  isSuperAdmin: boolean,
  requiredPermission: AppPermission
): Promise<boolean> {
  // Super Admin implicitly holds all system permissions
  if (isSuperAdmin || userRole === 'SUPER_ADMIN') {
    return true;
  }

  // 1. Check Role Default Permissions
  const roleDefaults = ROLE_DEFAULT_PERMISSIONS[userRole] || [];
  if (roleDefaults.includes(requiredPermission)) {
    return true;
  }

  // 2. Check granular overrides in database role_permissions
  try {
    const { data: dbPermissions } = await supabaseAdmin
      .from('role_permissions')
      .select('permission')
      .eq('role', userRole)
      .eq('permission', requiredPermission)
      .maybeSingle();

    if (dbPermissions) {
      return true;
    }
  } catch {
    // Fallthrough to denied
  }

  return false;
}

/**
 * Middleware: Requires a specific permission string
 */
export function requirePermission(permission: AppPermission) {
  return async function (request: FastifyRequest, reply: FastifyReply) {
    const user = request.user;
    if (!user) {
      return reply.status(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Authentication required before permission verification.',
      });
    }

    const allowed = await userHasPermission(user.id, user.role, user.isSuperAdmin, permission);
    if (!allowed) {
      return reply.status(403).send({
        statusCode: 403,
        error: 'Forbidden',
        message: `Access denied. Missing required permission: [${permission}].`,
      });
    }
  };
}

/**
 * Middleware: Requires Super Admin authority
 */
export async function requireSuperAdmin(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user || (!user.isSuperAdmin && user.role !== 'SUPER_ADMIN')) {
    return reply.status(403).send({
      statusCode: 403,
      error: 'Forbidden',
      message: 'Access restricted to system Super Administrators only.',
    });
  }
}
