import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authenticate } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/rbac.js';
import { supabaseAdmin } from '../../db/supabase.js';
import { z } from 'zod';

const ListAuditQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  action: z.string().trim().optional(),
  targetUserId: z.string().uuid().optional(),
  actorId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export async function auditRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);

  fastify.get(
    '/audit-logs',
    {
      preHandler: [requirePermission('audit.view')],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = ListAuditQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Invalid query parameters',
          details: parsed.error.issues,
        });
      }

      const { search, action, targetUserId, actorId, page, limit } = parsed.data;
      const offset = (page - 1) * limit;

      let query = supabaseAdmin
        .from('audit_logs')
        .select('id, actor_id, action, target_user_id, details, ip_address, user_agent, correlation_id, status, created_at', { count: 'exact' });

      if (action) {
        query = query.eq('action', action);
      }
      if (targetUserId) {
        query = query.eq('target_user_id', targetUserId);
      }
      if (actorId) {
        query = query.eq('actor_id', actorId);
      }
      if (search) {
        query = query.or(`action.ilike.%${search}%,status.ilike.%${search}%`);
      }

      query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

      const { data: logs, error, count } = await query;

      if (error) {
        request.log.error({ err: error }, 'Failed to query audit logs');
        return reply.status(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'Failed to retrieve audit records',
        });
      }

      const total = count ?? 0;
      const totalPages = Math.ceil(total / limit) || 1;

      return reply.send({
        logs: logs || [],
        total,
        page,
        limit,
        totalPages,
      });
    }
  );
}
