import { FastifyRequest, FastifyReply } from 'fastify';
import { usersService } from './users.service.js';
import {
  CreateUserSchema,
  UpdateUserSchema,
  ListUsersQuerySchema,
  ResetPasswordSchema,
  RevokeSessionsSchema,
  UserIdParamSchema,
} from './users.schema.js';
import { logSecurityAction } from '../../middleware/audit.js';

export async function handleListUsers(request: FastifyRequest, reply: FastifyReply) {
  const queryResult = ListUsersQuerySchema.safeParse(request.query);
  if (!queryResult.success) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Invalid query parameters',
      details: queryResult.error.format(),
    });
  }

  const result = await usersService.listUsers(queryResult.data, request.user?.token);
  return reply.send(result);
}

export async function handleGetUserById(request: FastifyRequest, reply: FastifyReply) {
  const paramResult = UserIdParamSchema.safeParse(request.params);
  if (!paramResult.success) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Invalid User ID parameter',
    });
  }

  try {
    const user = await usersService.getUserById(paramResult.data.id, request.user?.token);
    return reply.send({ user });
  } catch (err: unknown) {
    return reply.status(404).send({
      statusCode: 404,
      error: 'Not Found',
      message: err instanceof Error ? err.message : 'User not found',
    });
  }
}

export async function handleCreateUser(request: FastifyRequest, reply: FastifyReply) {
  const bodyResult = CreateUserSchema.safeParse(request.body);
  if (!bodyResult.success) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Validation failed for user creation payload',
      details: bodyResult.error.format(),
    });
  }

  try {
    const createdUser = await usersService.createUser(bodyResult.data, request.user?.role);

    await logSecurityAction(request, {
      action: 'USER_CREATE',
      targetUserId: createdUser.id,
      recordId: createdUser.id,
      newData: {
        id: createdUser.id,
        email: createdUser.email,
        role: createdUser.role,
        status: createdUser.status,
      },
    });

    return reply.status(201).send({
      statusCode: 201,
      message: 'User created successfully',
      user: createdUser,
    });
  } catch (err: unknown) {
    await logSecurityAction(request, {
      action: 'USER_CREATE_FAILED',
      reason: err instanceof Error ? err.message : 'Creation failed',
      status: 'FAILED',
    });

    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: err instanceof Error ? err.message : 'Could not create user',
    });
  }
}

export async function handleUpdateUser(request: FastifyRequest, reply: FastifyReply) {
  const paramResult = UserIdParamSchema.safeParse(request.params);
  if (!paramResult.success) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Invalid User ID',
    });
  }

  const bodyResult = UpdateUserSchema.safeParse(request.body);
  if (!bodyResult.success) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Validation failed for update payload',
      details: bodyResult.error.format(),
    });
  }

  const targetId = paramResult.data.id;

  try {
    const original = await usersService.getUserById(targetId);
    const updated = await usersService.updateUser(targetId, bodyResult.data, request.user?.role);

    await logSecurityAction(request, {
      action: 'USER_EDIT',
      targetUserId: targetId,
      recordId: targetId,
      oldData: {
        fullName: original.fullName,
        email: original.email,
        role: original.role,
        status: original.status,
      },
      newData: {
        fullName: updated.fullName,
        email: updated.email,
        role: updated.role,
        status: updated.status,
      },
    });

    return reply.send({
      statusCode: 200,
      message: 'User updated successfully',
      user: updated,
    });
  } catch (err: unknown) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: err instanceof Error ? err.message : 'Could not update user',
    });
  }
}

export async function handleDeactivateUser(request: FastifyRequest, reply: FastifyReply) {
  const paramResult = UserIdParamSchema.safeParse(request.params);
  if (!paramResult.success) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Invalid User ID',
    });
  }

  const targetId = paramResult.data.id;

  // Security guardrail: Cannot deactivate own account
  if (request.user?.id === targetId) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Action rejected: You cannot deactivate your own account.',
    });
  }

  try {
    const updated = await usersService.deactivateUser(targetId);

    await logSecurityAction(request, {
      action: 'USER_DEACTIVATE',
      targetUserId: targetId,
      recordId: targetId,
      reason: 'Deactivated by administrator',
    });

    return reply.send({
      statusCode: 200,
      message: `User account "${updated.fullName}" (${updated.email}) has been deactivated.`,
      user: updated,
    });
  } catch (err: unknown) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: err instanceof Error ? err.message : 'Could not deactivate user',
    });
  }
}

export async function handleActivateUser(request: FastifyRequest, reply: FastifyReply) {
  const paramResult = UserIdParamSchema.safeParse(request.params);
  if (!paramResult.success) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Invalid User ID',
    });
  }

  const targetId = paramResult.data.id;

  try {
    const updated = await usersService.activateUser(targetId);

    await logSecurityAction(request, {
      action: 'USER_ACTIVATE',
      targetUserId: targetId,
      recordId: targetId,
      reason: 'Reactivated by administrator',
    });

    return reply.send({
      statusCode: 200,
      message: `User account "${updated.fullName}" (${updated.email}) is now active.`,
      user: updated,
    });
  } catch (err: unknown) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: err instanceof Error ? err.message : 'Could not activate user',
    });
  }
}

export async function handleResetPassword(request: FastifyRequest, reply: FastifyReply) {
  const paramResult = UserIdParamSchema.safeParse(request.params);
  if (!paramResult.success) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Invalid User ID',
    });
  }

  const bodyResult = ResetPasswordSchema.safeParse(request.body || {});
  if (!bodyResult.success) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Invalid reset password parameters',
      details: bodyResult.error.format(),
    });
  }

  const targetId = paramResult.data.id;
  const { newPassword, forcePasswordReset, revokeExistingSessions } = bodyResult.data;

  try {
    const result = await usersService.resetPassword(
      targetId,
      newPassword,
      forcePasswordReset,
      revokeExistingSessions
    );

    await logSecurityAction(request, {
      action: 'USER_RESET_PASSWORD',
      targetUserId: targetId,
      recordId: targetId,
      reason: newPassword ? 'Administrative direct password override' : 'Dispatched reset email',
      newData: { forcePasswordReset, revokeExistingSessions },
    });

    return reply.send({
      statusCode: 200,
      message: result.message,
    });
  } catch (err: unknown) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: err instanceof Error ? err.message : 'Could not reset password',
    });
  }
}

export async function handleRevokeSessions(request: FastifyRequest, reply: FastifyReply) {
  const paramResult = UserIdParamSchema.safeParse(request.params);
  if (!paramResult.success) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Invalid User ID',
    });
  }

  const bodyResult = RevokeSessionsSchema.safeParse(request.body || {});
  const targetId = paramResult.data.id;

  try {
    const result = await usersService.revokeSessions(targetId);

    await logSecurityAction(request, {
      action: 'USER_REVOKE_SESSIONS',
      targetUserId: targetId,
      recordId: targetId,
      reason: bodyResult.data?.reason || 'Administrator triggered session revocation',
    });

    return reply.send({
      statusCode: 200,
      message: result.message,
    });
  } catch (err: unknown) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: err instanceof Error ? err.message : 'Could not revoke sessions',
    });
  }
}

export async function handleDeleteUser(request: FastifyRequest, reply: FastifyReply) {
  const paramResult = UserIdParamSchema.safeParse(request.params);
  if (!paramResult.success) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Invalid User ID',
    });
  }

  const targetId = paramResult.data.id;

  // Security guardrail: Cannot delete own account
  if (request.user?.id === targetId) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Action rejected: You cannot delete your own account.',
    });
  }

  try {
    const result = await usersService.deleteUser(targetId);

    await logSecurityAction(request, {
      action: 'USER_DELETE',
      targetUserId: targetId,
      recordId: targetId,
      reason: 'Permanently deleted by Super Administrator',
    });

    return reply.send({
      statusCode: 200,
      message: 'User account permanently removed.',
      deletedId: result.deletedId,
    });
  } catch (err: unknown) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: err instanceof Error ? err.message : 'Could not delete user',
    });
  }
}
