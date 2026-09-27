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
} from './users.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/rbac.js';

export async function usersRoutes(fastify: FastifyInstance) {
  // All user management routes require valid authentication
  fastify.addHook('preHandler', authenticate);

  // 1. List users (search, filter, sort, paginate)
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

  // 3. Create user (multi-step workflow commit)
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

  // 4. Update user details & role assignment
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
      preHandler: [requirePermission('users.edit')],
    },
    handleActivateUser
  );

  // 7. Reset password override / email dispatch
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

  // 8. Revoke all user sessions
  fastify.post(
    '/:id/revoke-sessions',
    {
      preHandler: [requirePermission('users.revoke_session')],
    },
    handleRevokeSessions
  );
}
