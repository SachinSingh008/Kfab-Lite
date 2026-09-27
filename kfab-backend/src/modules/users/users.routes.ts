import { FastifyInstance } from 'fastify';
import {
  handleListUsers,
  handleGetUserById,
  handleCreateUser,
  handleUpdateUser,
  handleDeactivateUser,
  handleActivateUser,
  handleResetPassword,
  handleRevokeSessions,
  handleDeleteUser,
} from './users.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/rbac.js';

export async function usersRoutes(fastify: FastifyInstance) {
  // All user management routes require valid authentication
  fastify.addHook('preHandler', authenticate);

  // 1. List users (search, filter by role/status, sort, paginate)
  fastify.get(
    '/',
    {
      preHandler: [requirePermission('users.view')],
    },
    handleListUsers
  );

  // 2. Get single user details & audit trail
  fastify.get(
    '/:id',
    {
      preHandler: [requirePermission('users.view')],
    },
    handleGetUserById
  );

  // 3. Create user (with hierarchy protection)
  fastify.post(
    '/',
    {
      preHandler: [requirePermission('users.create')],
      config: {
        rateLimit: {
          max: 30,
          timeWindow: '1 minute',
        },
      },
    },
    handleCreateUser
  );

  // 4. Update user details & role
  fastify.put(
    '/:id',
    {
      preHandler: [requirePermission('users.edit')],
    },
    handleUpdateUser
  );

  // 5. Deactivate user account
  fastify.post(
    '/:id/deactivate',
    {
      preHandler: [requirePermission('users.deactivate')],
    },
    handleDeactivateUser
  );

  // 6. Reactivate user account
  fastify.post(
    '/:id/activate',
    {
      preHandler: [requirePermission('users.activate')],
    },
    handleActivateUser
  );

  // 7. Delete user account permanently (Super Admin only)
  fastify.delete(
    '/:id',
    {
      preHandler: [requirePermission('users.delete')],
    },
    handleDeleteUser
  );

  // 8. Reset password override / email dispatch
  fastify.post(
    '/:id/reset-password',
    {
      preHandler: [requirePermission('users.reset_password')],
      config: {
        rateLimit: {
          max: 10,
          timeWindow: '1 minute',
        },
      },
    },
    handleResetPassword
  );

  // 9. Revoke all user sessions
  fastify.post(
    '/:id/revoke-sessions',
    {
      preHandler: [requirePermission('users.revoke_session')],
    },
    handleRevokeSessions
  );
}
