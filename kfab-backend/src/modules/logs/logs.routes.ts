import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authenticate } from '../../middleware/auth.js';
import { CreateUserLogSchema, ListUserLogsQuerySchema } from './logs.schema.js';
import { logsService } from './logs.service.js';

export async function logsRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);

  // 1. Create a new user log
  fastify.post(
    '/',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = CreateUserLogSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Invalid log input',
          details: parsed.error.issues,
        });
      }

      const userId = request.user?.id;
      if (!userId) {
        return reply.status(401).send({
          statusCode: 401,
          error: 'Unauthorized',
          message: 'Authentication session required',
        });
      }

      try {
        const createdLog = await logsService.createUserLog(userId, parsed.data);
        return reply.status(201).send({
          statusCode: 201,
          message: 'Log added successfully',
          data: createdLog,
        });
      } catch (err: any) {
        request.log.error({ err }, 'Failed to create user log');
        return reply.status(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: err.message || 'Failed to persist user log',
        });
      }
    }
  );

  // 2. Get caller's own logs (My Logs)
  fastify.get(
    '/my',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsedQuery = ListUserLogsQuerySchema.safeParse(request.query);
      if (!parsedQuery.success) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Invalid query parameters',
          details: parsedQuery.error.issues,
        });
      }

      const userId = request.user?.id;
      if (!userId) {
        return reply.status(401).send({
          statusCode: 401,
          error: 'Unauthorized',
          message: 'Authentication session required',
        });
      }

      try {
        const result = await logsService.getMyLogs(userId, parsedQuery.data);
        return reply.send(result);
      } catch (err: any) {
        request.log.error({ err }, 'Failed to retrieve My Logs');
        return reply.status(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: err.message || 'Failed to retrieve user logs',
        });
      }
    }
  );

  // 3. Get consolidated user logs (All Logs)
  fastify.get(
    '/all',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsedQuery = ListUserLogsQuerySchema.safeParse(request.query);
      if (!parsedQuery.success) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Invalid query parameters',
          details: parsedQuery.error.issues,
        });
      }

      try {
        const result = await logsService.getAllLogs(parsedQuery.data);
        return reply.send(result);
      } catch (err: any) {
        request.log.error({ err }, 'Failed to retrieve All Logs');
        return reply.status(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: err.message || 'Failed to retrieve consolidated logs',
        });
      }
    }
  );
}
