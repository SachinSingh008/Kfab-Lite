import { FastifyRequest } from 'fastify';
import { supabaseAdmin } from '../db/supabase.js';

export interface AuditLogEntry {
  actorUserId?: string;
  targetUserId?: string;
  companyId?: string;
  module: string;
  action: string;
  recordId?: string;
  oldData?: Record<string, unknown> | null;
  newData?: Record<string, unknown> | null;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
  correlationId?: string;
  status?: 'SUCCESS' | 'FAILED';
}

const REDACTED_KEYS = new Set([
  'password',
  'token',
  'access_token',
  'refresh_token',
  'secret',
  'service_role',
  'authorization',
  'hash',
]);

/**
 * Recursively strips sensitive fields (passwords, tokens, secrets) before audit storage.
 */
function sanitizeAuditData(data: unknown): unknown {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(sanitizeAuditData);

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (REDACTED_KEYS.has(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeAuditData(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * Writes an append-only audit record into public.audit_logs.
 */
export async function writeAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    const payload = {
      user_id: entry.actorUserId || null,
      target_user_id: entry.targetUserId || null,
      company_id: entry.companyId || null,
      module: entry.module,
      action: entry.action,
      record_id: entry.recordId || null,
      old_data: entry.oldData ? (sanitizeAuditData(entry.oldData) as object) : null,
      new_data: entry.newData ? (sanitizeAuditData(entry.newData) as object) : null,
      reason: entry.reason || null,
      ip_address: entry.ipAddress || null,
      user_agent: entry.userAgent || null,
      correlation_id: entry.correlationId || null,
      status: entry.status || 'SUCCESS',
      created_at: new Date().toISOString(),
    };

    const { error } = await supabaseAdmin.from('audit_logs').insert(payload);
    if (error) {
      console.error('[Audit Failure] Could not write audit log row:', error.message);
    }
  } catch (err) {
    console.error('[Audit Exception] Error while persisting audit log:', err);
  }
}

/**
 * Helper to log security actions directly from Fastify request context.
 */
export async function logSecurityAction(
  request: FastifyRequest,
  params: {
    action: string;
    targetUserId?: string;
    recordId?: string;
    oldData?: Record<string, unknown> | null;
    newData?: Record<string, unknown> | null;
    reason?: string;
    status?: 'SUCCESS' | 'FAILED';
  }
) {
  const ip =
    (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    request.ip ||
    request.socket.remoteAddress;

  const userAgent = request.headers['user-agent'] as string | undefined;

  await writeAuditLog({
    actorUserId: request.user?.id,
    targetUserId: params.targetUserId,
    companyId: request.user?.companyId,
    module: 'USER_MANAGEMENT',
    action: params.action,
    recordId: params.recordId,
    oldData: params.oldData,
    newData: params.newData,
    reason: params.reason,
    ipAddress: ip,
    userAgent,
    correlationId: request.correlationId || request.id,
    status: params.status || 'SUCCESS',
  });
}
