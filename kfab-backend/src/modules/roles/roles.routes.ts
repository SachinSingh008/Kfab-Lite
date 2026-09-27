import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authenticate } from '../../middleware/auth.js';
import { ROLE_DEFAULT_PERMISSIONS } from '../../middleware/rbac.js';

export async function rolesRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);

  // Roles Catalog Endpoint
  fastify.get('/roles', async (_request: FastifyRequest, reply: FastifyReply) => {
    const rolesList = [
      {
        value: 'SUPER_ADMIN',
        label: 'Super Admin',
        description: 'Full administrative authority across all user-management, security policies, and identity access',
        permissions: ROLE_DEFAULT_PERMISSIONS.SUPER_ADMIN,
      },
      {
        value: 'ADMIN',
        label: 'Admin',
        description: 'Delegated user administrator with RBAC-scoped user management authority',
        permissions: ROLE_DEFAULT_PERMISSIONS.ADMIN,
      },
      {
        value: 'ACCOUNT',
        label: 'Account',
        description: 'Standard accounting user with no administrative privileges',
        permissions: ROLE_DEFAULT_PERMISSIONS.ACCOUNT,
      },
      {
        value: 'SUPERVISOR',
        label: 'Supervisor',
        description: 'Standard operational supervisor with no administrative privileges',
        permissions: ROLE_DEFAULT_PERMISSIONS.SUPERVISOR,
      },
    ];

    return reply.send({ roles: rolesList });
  });
}
