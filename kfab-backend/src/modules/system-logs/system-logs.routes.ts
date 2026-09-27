import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authenticate } from '../../middleware/auth.js';
import { supabaseAdmin } from '../../db/supabase.js';
import { ListSystemLogsQuerySchema } from '../logs/logs.schema.js';

export async function systemLogsRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);

  // Authorization check hook: Only SUPER_ADMIN and ADMIN can access system logs
  fastify.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
    const role = request.user?.role;
    if (role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
      return reply.status(403).send({
        statusCode: 403,
        error: 'Forbidden',
        message: 'Access restricted: Only SUPER_ADMIN and ADMIN can inspect system audit logs.',
      });
    }
  });

  // 1. List system audit records with pagination, search, and filtering
  fastify.get(
    '/',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = ListSystemLogsQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Invalid query parameters',
          details: parsed.error.issues,
        });
      }

      const { page, limit, search, module, action, user, from, to } = parsed.data;
      const offset = (page - 1) * limit;

      let query = supabaseAdmin
        .from('audit_logs')
        .select(
          `
          id,
          created_at,
          actor_id,
          action,
          module,
          resource_type,
          resource_id,
          description,
          old_values,
          new_values,
          target_user_id,
          details,
          ip_address,
          user_agent,
          correlation_id,
          status,
          profiles:actor_id (
            full_name,
            role,
            email
          )
        `,
          { count: 'exact' }
        );

      if (module) {
        query = query.eq('module', module);
      }
      if (action) {
        query = query.eq('action', action);
      }
      if (from) {
        query = query.gte('created_at', from);
      }
      if (to) {
        query = query.lte('created_at', to);
      }
      if (search) {
        query = query.or(`description.ilike.%${search}%,action.ilike.%${search}%,resource_id.ilike.%${search}%`);
      }

      query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        request.log.warn({ err: error }, 'audit_logs table query failed or not yet migrated, returning empty list');
        return reply.send({
          logs: [],
          total: 0,
          page,
          limit,
          totalPages: 1,
        });
      }

      const formatted = (data || []).map((row: any) => {
        const prof = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
        return {
          id: row.id,
          created_at: row.created_at,
          actor_id: row.actor_id,
          action: row.action,
          module: row.module || 'SYSTEM',
          resource_type: row.resource_type,
          resource_id: row.resource_id,
          description: row.description || row.action,
          old_values: row.old_values,
          new_values: row.new_values,
          target_user_id: row.target_user_id,
          details: row.details,
          ip_address: row.ip_address,
          user_agent: row.user_agent,
          correlation_id: row.correlation_id,
          status: row.status,
          actor_name: prof?.full_name || 'System / Automated',
          actor_role: prof?.role || 'SYSTEM',
          actor_email: prof?.email || '',
        };
      });

      // Filter by user if requested
      let filtered = formatted;
      if (user) {
        const lower = user.toLowerCase();
        filtered = filtered.filter(
          (l) => l.actor_name?.toLowerCase().includes(lower) || l.actor_email?.toLowerCase().includes(lower)
        );
      }

      const total = count ?? 0;
      const totalPages = Math.ceil(total / limit) || 1;

      return reply.send({
        logs: filtered,
        total,
        page,
        limit,
        totalPages,
      });
    }
  );

  // 2. Get single system audit record details
  fastify.get(
    '/:id',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const { id } = request.params;

      const { data: row, error } = await supabaseAdmin
        .from('audit_logs')
        .select(
          `
          id,
          created_at,
          actor_id,
          action,
          module,
          resource_type,
          resource_id,
          description,
          old_values,
          new_values,
          target_user_id,
          details,
          ip_address,
          user_agent,
          correlation_id,
          status,
          profiles:actor_id (
            full_name,
            role,
            email
          )
        `
        )
        .eq('id', id)
        .maybeSingle();

      if (error) {
        request.log.error({ err: error }, 'Failed to fetch single system log');
        return reply.status(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'Failed to retrieve system log record',
        });
      }

      if (!row) {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'System audit record not found',
        });
      }

      const prof = Array.isArray((row as any).profiles) ? (row as any).profiles[0] : (row as any).profiles;

      return reply.send({
        id: row.id,
        created_at: row.created_at,
        actor_id: row.actor_id,
        action: row.action,
        module: row.module || 'SYSTEM',
        resource_type: row.resource_type,
        resource_id: row.resource_id,
        description: row.description || row.action,
        old_values: row.old_values,
        new_values: row.new_values,
        target_user_id: row.target_user_id,
        details: row.details,
        ip_address: row.ip_address,
        user_agent: row.user_agent,
        correlation_id: row.correlation_id,
        status: row.status,
        actor_name: prof?.full_name || 'System / Automated',
        actor_role: prof?.role || 'SYSTEM',
        actor_email: prof?.email || '',
      });
    }
  );
}
