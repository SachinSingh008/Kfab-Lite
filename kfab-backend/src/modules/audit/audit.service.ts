import { FastifyRequest } from 'fastify';
import { supabaseAdmin } from '../../db/supabase.js';

/**
 * Standard System Audit Event Actions across all KFab360 modules
 */
export const AuditAction = {
  // USER MANAGEMENT
  USER_CREATED: 'USER_CREATED',
  USER_UPDATED: 'USER_UPDATED',
  USER_ACTIVATED: 'USER_ACTIVATED',
  USER_DEACTIVATED: 'USER_DEACTIVATED',
  USER_DELETED: 'USER_DELETED',
  ROLE_CHANGED: 'ROLE_CHANGED',
  PASSWORD_RESET: 'PASSWORD_RESET',
  SESSION_REVOKED: 'SESSION_REVOKED',

  // ATTENDANCE
  ATTENDANCE_CREATED: 'ATTENDANCE_CREATED',
  ATTENDANCE_UPDATED: 'ATTENDANCE_UPDATED',
  ATTENDANCE_DELETED: 'ATTENDANCE_DELETED',
  ATTENDANCE_STATUS_CHANGED: 'ATTENDANCE_STATUS_CHANGED',

  // PRODUCTION
  PRODUCTION_CREATED: 'PRODUCTION_CREATED',
  PRODUCTION_UPDATED: 'PRODUCTION_UPDATED',
  PRODUCTION_DELETED: 'PRODUCTION_DELETED',

  // MATERIAL / INVENTORY
  MATERIAL_CREATED: 'MATERIAL_CREATED',
  MATERIAL_UPDATED: 'MATERIAL_UPDATED',
  MATERIAL_DELETED: 'MATERIAL_DELETED',
  STOCK_CREATED: 'STOCK_CREATED',
  STOCK_UPDATED: 'STOCK_UPDATED',
  STOCK_DELETED: 'STOCK_DELETED',
  STOCK_ADJUSTED: 'STOCK_ADJUSTED',

  // QUALITY
  INSPECTION_CREATED: 'INSPECTION_CREATED',
  INSPECTION_UPDATED: 'INSPECTION_UPDATED',
  INSPECTION_DELETED: 'INSPECTION_DELETED',
  QA_STATUS_CHANGED: 'QA_STATUS_CHANGED',

  // PURCHASE
  PURCHASE_CREATED: 'PURCHASE_CREATED',
  PURCHASE_UPDATED: 'PURCHASE_UPDATED',
  PURCHASE_DELETED: 'PURCHASE_DELETED',

  // ACCOUNTS
  PAYMENT_CREATED: 'PAYMENT_CREATED',
  PAYMENT_UPDATED: 'PAYMENT_UPDATED',
  PAYMENT_DELETED: 'PAYMENT_DELETED',
  INVOICE_CREATED: 'INVOICE_CREATED',
  INVOICE_UPDATED: 'INVOICE_UPDATED',
  INVOICE_DELETED: 'INVOICE_DELETED',
  EXPENSE_CREATED: 'EXPENSE_CREATED',
  EXPENSE_UPDATED: 'EXPENSE_UPDATED',
  EXPENSE_DELETED: 'EXPENSE_DELETED',

  // GENERAL
  RECORD_CREATED: 'RECORD_CREATED',
  RECORD_UPDATED: 'RECORD_UPDATED',
  RECORD_DELETED: 'RECORD_DELETED',
  STATUS_CHANGED: 'STATUS_CHANGED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;

export type AuditActionType = typeof AuditAction[keyof typeof AuditAction] | string;

export interface AuditLogParams {
  actorId?: string | null;
  action: AuditActionType;
  module?: string;
  resourceType?: string;
  resourceId?: string;
  description?: string;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  targetUserId?: string | null;
  details?: Record<string, unknown> | null;
  request?: FastifyRequest;
  ipAddress?: string;
  userAgent?: string;
  correlationId?: string;
  status?: 'SUCCESS' | 'FAILURE' | string;
}

const SENSITIVE_KEY_REGEX = /(password|passwd|hash|secret|token|credential|jwt|api_?key|auth|bearer)/i;

/**
 * Deeply sanitizes objects and arrays to prevent logging credentials or secrets
 */
export function sanitizeAuditData<T>(input: T): T {
  if (!input || typeof input !== 'object') {
    return input;
  }

  if (Array.isArray(input)) {
    return input.map((item) => sanitizeAuditData(item)) as unknown as T;
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(input as Record<string, unknown>)) {
    if (SENSITIVE_KEY_REGEX.test(key)) {
      sanitized[key] = '[REDACTED]';
    } else if (val && typeof val === 'object') {
      sanitized[key] = sanitizeAuditData(val);
    } else {
      sanitized[key] = val;
    }
  }

  return sanitized as T;
}

export class AuditService {
  /**
   * Records an immutable system audit entry
   */
  async log(params: AuditLogParams): Promise<void> {
    try {
      let ip = params.ipAddress;
      let ua = params.userAgent;
      let corrId = params.correlationId;

      if (params.request) {
        ip = ip || params.request.ip || (params.request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim();
        ua = ua || (params.request.headers['user-agent'] as string);
        corrId = corrId || (params.request.headers['x-correlation-id'] as string) || params.request.id;
      }

      const sanitizedOld = params.oldValues ? sanitizeAuditData(params.oldValues) : null;
      const sanitizedNew = params.newValues ? sanitizeAuditData(params.newValues) : null;
      const sanitizedDetails = params.details ? sanitizeAuditData(params.details) : null;

      const record = {
        actor_id: params.actorId || null,
        action: params.action,
        module: params.module || 'SYSTEM',
        resource_type: params.resourceType || null,
        resource_id: params.resourceId ? String(params.resourceId) : null,
        description: params.description || null,
        old_values: sanitizedOld,
        new_values: sanitizedNew,
        target_user_id: params.targetUserId || null,
        details: sanitizedDetails,
        ip_address: ip || null,
        user_agent: ua || null,
        correlation_id: corrId || null,
        status: params.status || 'SUCCESS',
      };

      const { error } = await supabaseAdmin.from('audit_logs').insert(record);
      if (error) {
        // If extended columns from migration 005 are not yet applied to remote DB, fallback to base schema with details JSONB
        if (error.code === 'PGRST204') {
          const fallbackRecord = {
            actor_id: params.actorId || null,
            action: params.action,
            target_user_id: params.targetUserId || null,
            details: {
              ...(sanitizedDetails || {}),
              module: params.module || 'SYSTEM',
              resource_type: params.resourceType || null,
              resource_id: params.resourceId ? String(params.resourceId) : null,
              description: params.description || null,
              old_values: sanitizedOld,
              new_values: sanitizedNew,
            },
            ip_address: ip || null,
            user_agent: ua || null,
            correlation_id: corrId || null,
            status: params.status || 'SUCCESS',
          };
          const { error: fallbackError } = await supabaseAdmin.from('audit_logs').insert(fallbackRecord);
          if (fallbackError) {
            console.error('[AuditService] Failed to insert audit log with base schema:', fallbackError);
          }
        } else {
          console.error('[AuditService] Failed to insert audit log:', error);
        }
      }
    } catch (err) {
      console.error('[AuditService] Exception while recording audit log:', err);
    }
  }
}

export const auditService = new AuditService();
