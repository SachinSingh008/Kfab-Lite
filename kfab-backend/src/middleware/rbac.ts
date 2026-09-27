import { FastifyRequest, FastifyReply } from 'fastify';
import { supabaseAdmin } from '../db/supabase.js';

export type AppPermission =
  | 'users.view'
  | 'users.create'
  | 'users.edit'
  | 'users.delete'
  | 'users.activate'
  | 'users.deactivate'
  | 'users.reset_password'
  | 'users.revoke_session'
  | 'users.assign_role'
  | 'audit.view';

// Role to default permissions mapping
export const ROLE_DEFAULT_PERMISSIONS: Record<string, AppPermission[]> = {
  SUPER_ADMIN: [
    'users.view',
    'users.create',
    'users.edit',
    'users.delete',
    'users.activate',
    'users.deactivate',
    'users.reset_password',
    'users.revoke_session',
    'users.assign_role',
    'audit.view',
  ],
  ADMIN: [
    'users.view',
    'users.create',
    'users.edit',
    'users.activate',
    'users.deactivate',
    'users.reset_password',
    'users.revoke_session',
    'audit.view',
  ],
  ACCOUNT: [],
  SUPERVISOR: [],
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
  // Super Admin implicitly holds all permissions
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
      .select('permission_code')
      .eq('role', userRole)
      .eq('permission_code', requiredPermission)
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
 * Middleware: Requires a specific permission
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
      message: 'Access restricted to Super Administrators only.',
    });
  }
}
