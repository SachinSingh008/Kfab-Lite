import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authenticate } from '../../middleware/auth.js';
import { ROLE_DEFAULT_PERMISSIONS } from '../../middleware/rbac.js';
import { logSecurityAction } from '../../middleware/audit.js';

export async function authRoutes(fastify: FastifyInstance) {
  // 1. Get current authenticated user profile & effective permissions
  fastify.get(
    '/me',
    {
      preHandler: [authenticate],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user!;
      const effectivePermissions =
        user.isSuperAdmin || user.role === 'SUPER_ADMIN'
          ? ROLE_DEFAULT_PERMISSIONS.SUPER_ADMIN
          : ROLE_DEFAULT_PERMISSIONS[user.role] || [];

      return reply.send({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          isSuperAdmin: user.isSuperAdmin,
          status: user.status,
          companyId: user.companyId || null,
        },
        permissions: effectivePermissions,
      });
    }
  );

  // 2. Secure Logout endpoint with audit event
  fastify.post(
    '/logout',
    {
      preHandler: [authenticate],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user!;

      await logSecurityAction(request, {
        action: 'USER_LOGOUT',
        targetUserId: user.id,
        recordId: user.id,
        reason: 'User explicit logout',
      });

      return reply.send({
        statusCode: 200,
        message: 'Logged out successfully.',
      });
    }
  );
}
