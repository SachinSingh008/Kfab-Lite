import crypto from 'crypto';
import { supabaseAdmin } from '../../db/supabase.js';
import { CreateUserLogInput, ListUserLogsQuery } from './logs.schema.js';

export interface UserLogRecord {
  id: string;
  created_by: string;
  created_at: string;
  event: string;
  remarks: string | null;
  user_name?: string;
  user_role?: string;
  user_email?: string;
}

const memoryLogs: UserLogRecord[] = [];

export class LogsService {
  /**
   * Creates a new user log entry.
   * Authoritative backend strictly binds created_by to the caller's verified ID.
   */
  async createUserLog(userId: string, input: CreateUserLogInput): Promise<UserLogRecord> {
    const id = crypto.randomUUID();
    const nowIso = new Date().toISOString();

    // Fetch caller's profile
    let profile: { full_name?: string; role?: string; email?: string } | null = null;
    try {
      const { data } = await supabaseAdmin
        .from('profiles')
        .select('full_name, role, email')
        .eq('id', userId)
        .maybeSingle();
      profile = data;
    } catch (err) {
      console.warn('[LogsService] Could not fetch profile for user:', userId, err);
    }

    const newRecord: UserLogRecord = {
      id,
      created_by: userId,
      event: input.event.trim(),
      remarks: input.remarks?.trim() || null,
      created_at: nowIso,
      user_name: profile?.full_name || 'User',
      user_role: profile?.role || 'SUPERVISOR',
      user_email: profile?.email || '',
    };

    // Primary: Write to audit_logs (append-only unified store)
    // Only set actor_id if profile exists to prevent foreign key violation on audit_logs_actor_id_fkey
    try {
      const { error } = await supabaseAdmin.from('audit_logs').insert({
        id,
        actor_id: profile ? userId : null,
        action: 'USER_LOG',
        status: 'SUCCESS',
        details: {
          event: input.event.trim(),
          remarks: input.remarks?.trim() || null,
          description: input.event.trim(),
          module: 'User Activity',
          user_name: newRecord.user_name,
          user_role: newRecord.user_role,
          user_email: newRecord.user_email,
          created_by: userId,
          client: 'Backend API',
        },
        created_at: nowIso,
      });

      if (error) {
        console.error('[LogsService] Failed to write user log to audit_logs:', error);
      }
    } catch (err) {
      console.error('[LogsService] Exception writing to audit_logs:', err);
    }

    memoryLogs.unshift(newRecord);
    return newRecord;
  }

  /**
   * Retrieves logs created strictly by the caller.
   * Data isolation guarantee: Queries are scoped exclusively by created_by = userId.
   * Retention guarantee: Capped to last 7 days only.
   */
  async getMyLogs(
    userId: string,
    query: ListUserLogsQuery
  ): Promise<{ logs: UserLogRecord[]; total: number; page: number; limit: number; totalPages: number }> {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);
    const offset = (page - 1) * limit;

    const sevenDaysCutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const effectiveFrom = query.from && query.from > sevenDaysCutoff ? query.from : sevenDaysCutoff;

    // 1. Query audit_logs (authoritative remote store)
    try {
      let auditQuery = supabaseAdmin
        .from('audit_logs')
        .select('id, actor_id, action, details, created_at, profiles:actor_id(full_name, role, email)', { count: 'exact' })
        .gte('created_at', effectiveFrom)
        .or(`actor_id.eq.${userId},details->>created_by.eq.${userId}`);

      if (query.to) {
        auditQuery = auditQuery.lte('created_at', query.to);
      }
      if (query.search) {
        const s = query.search.trim();
        auditQuery = auditQuery.or(
          `action.ilike.%${s}%,details->>event.ilike.%${s}%,details->>remarks.ilike.%${s}%,details->>description.ilike.%${s}%`
        );
      }

      auditQuery = auditQuery.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

      const { data: auditData, count: auditCount, error: auditErr } = await auditQuery;

      if (!auditErr && auditData) {
        const logs: UserLogRecord[] = auditData.map((row: any) => {
          const prof = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
          const det = row.details || {};
          return {
            id: row.id,
            created_by: row.actor_id || det.created_by || userId,
            created_at: row.created_at,
            event: det.event || det.description || row.action,
            remarks: det.remarks || (row.action !== 'USER_LOG' ? `Action: ${row.action}` : null),
            user_name: prof?.full_name || det.user_name || 'User',
            user_role: prof?.role || det.user_role || 'SUPERVISOR',
            user_email: prof?.email || det.user_email || '',
          };
        });

        const total = auditCount ?? logs.length;
        return {
          logs,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1,
        };
      }
      if (auditErr) {
        console.warn('[LogsService] audit_logs query error in getMyLogs:', auditErr);
      }
    } catch (err) {
      console.warn('[LogsService] Exception in getMyLogs:', err);
    }

    // 2. Memory fallback (capped to 7 days)
    const sevenDaysCutoffTime = Date.now() - 7 * 24 * 60 * 60 * 1000;
    let userMemory = memoryLogs.filter(
      (l) => l.created_by === userId && new Date(l.created_at).getTime() >= sevenDaysCutoffTime
    );
    if (query.search) {
      const q = query.search.toLowerCase();
      userMemory = userMemory.filter(
        (l) => l.event.toLowerCase().includes(q) || (l.remarks || '').toLowerCase().includes(q)
      );
    }
    const total = userMemory.length;
    return {
      logs: userMemory.slice(offset, offset + limit),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Retrieves consolidated user logs for All Logs view.
   * Joined with profiles to supply creator identity and role for UI filtering.
   * Retention guarantee: Capped to last 7 days only.
   */
  async getAllLogs(
    query: ListUserLogsQuery
  ): Promise<{ logs: UserLogRecord[]; total: number; page: number; limit: number; totalPages: number }> {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);
    const offset = (page - 1) * limit;

    const sevenDaysCutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const effectiveFrom = query.from && query.from > sevenDaysCutoff ? query.from : sevenDaysCutoff;

    // 1. Query audit_logs (authoritative remote store)
    try {
      let auditQuery = supabaseAdmin
        .from('audit_logs')
        .select('id, actor_id, action, details, created_at, profiles:actor_id(full_name, role, email)', { count: 'exact' })
        .gte('created_at', effectiveFrom);

      if (query.to) {
        auditQuery = auditQuery.lte('created_at', query.to);
      }

      // Filter by role if provided
      if (query.role) {
        auditQuery = auditQuery.filter('profiles.role', 'eq', query.role);
      }

      // Filter by user name if provided
      if (query.user) {
        auditQuery = auditQuery.filter('profiles.full_name', 'ilike', `%${query.user}%`);
      }

      // Filter by search text if provided
      if (query.search) {
        const s = query.search.trim();
        auditQuery = auditQuery.or(
          `action.ilike.%${s}%,details->>event.ilike.%${s}%,details->>remarks.ilike.%${s}%,details->>description.ilike.%${s}%`
        );
      }

      auditQuery = auditQuery.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

      const { data: auditData, count: auditCount, error: auditErr } = await auditQuery;

      if (!auditErr && auditData) {
        const logs: UserLogRecord[] = auditData.map((row: any) => {
          const prof = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
          const det = row.details || {};
          return {
            id: row.id,
            created_by: row.actor_id || det.created_by || '',
            created_at: row.created_at,
            event: det.event || det.description || row.action,
            remarks: det.remarks || (row.action !== 'USER_LOG' ? `Action: ${row.action}` : null),
            user_name: prof?.full_name || det.user_name || 'System / User',
            user_role: prof?.role || det.user_role || 'SUPERVISOR',
            user_email: prof?.email || det.user_email || '',
          };
        });

        const total = auditCount ?? logs.length;
        return {
          logs,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1,
        };
      }
      if (auditErr) {
        console.warn('[LogsService] audit_logs query error in getAllLogs:', auditErr);
      }
    } catch (err) {
      console.warn('[LogsService] Exception in getAllLogs:', err);
    }

    // 2. Memory fallback (capped to 7 days)
    const sevenDaysCutoffTime = Date.now() - 7 * 24 * 60 * 60 * 1000;
    let allMemory = memoryLogs.filter((l) => new Date(l.created_at).getTime() >= sevenDaysCutoffTime);
    if (query.search) {
      const q = query.search.toLowerCase();
      allMemory = allMemory.filter(
        (l) =>
          l.event.toLowerCase().includes(q) ||
          (l.remarks || '').toLowerCase().includes(q) ||
          (l.user_name || '').toLowerCase().includes(q)
      );
    }
    if (query.role) {
      allMemory = allMemory.filter((l) => l.user_role === query.role);
    }
    const total = allMemory.length;
    return {
      logs: allMemory.slice(offset, offset + limit),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }
}

export const logsService = new LogsService();
