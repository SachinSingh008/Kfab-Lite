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
    const newRecord = {
      id,
      created_by: userId,
      event: input.event.trim(),
      remarks: input.remarks?.trim() || null,
      created_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabaseAdmin
        .from('user_logs')
        .insert(newRecord)
        .select('id, created_by, created_at, event, remarks')
        .single();

      if (!error && data) {
        // Fetch user profile info
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('full_name, role, email')
          .eq('id', userId)
          .maybeSingle();

        const fullRecord: UserLogRecord = {
          ...data,
          user_name: profile?.full_name || 'User',
          user_role: profile?.role || 'SUPERVISOR',
          user_email: profile?.email || '',
        };
        memoryLogs.unshift(fullRecord);
        return fullRecord;
      }
    } catch {
      // Fallback to local memory storage
    }

    const fallbackRecord: UserLogRecord = {
      ...newRecord,
      user_name: 'User',
      user_role: 'SUPER_ADMIN',
      user_email: '',
    };
    memoryLogs.unshift(fallbackRecord);
    return fallbackRecord;
  }

  /**
   * Retrieves logs created strictly by the caller.
   * Data isolation guarantee: Queries are scoped exclusively by created_by = userId.
   */
  async getMyLogs(
    userId: string,
    query: ListUserLogsQuery
  ): Promise<{ logs: UserLogRecord[]; total: number; page: number; limit: number; totalPages: number }> {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);
    const offset = (page - 1) * limit;

    try {
      let dbQuery = supabaseAdmin
        .from('user_logs')
        .select('id, created_by, created_at, event, remarks', { count: 'exact' })
        .eq('created_by', userId);

      if (query.search) {
        dbQuery = dbQuery.or(`event.ilike.%${query.search}%,remarks.ilike.%${query.search}%`);
      }

      if (query.from) {
        dbQuery = dbQuery.gte('created_at', query.from);
      }
      if (query.to) {
        dbQuery = dbQuery.lte('created_at', query.to);
      }

      dbQuery = dbQuery.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

      const { data, error, count } = await dbQuery;

      if (!error && data) {
        // Fetch user profile
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('full_name, role, email')
          .eq('id', userId)
          .maybeSingle();

        const formattedLogs: UserLogRecord[] = data.map((l) => ({
          ...l,
          user_name: profile?.full_name || 'User',
          user_role: profile?.role || 'SUPERVISOR',
          user_email: profile?.email || '',
        }));

        const total = count ?? formattedLogs.length;
        const totalPages = Math.ceil(total / limit) || 1;

        return {
          logs: formattedLogs,
          total,
          page,
          limit,
          totalPages,
        };
      }
    } catch {
      // Fallback to memory
    }

    // Memory fallback
    let userMemory = memoryLogs.filter((l) => l.created_by === userId);
    if (query.search) {
      const q = query.search.toLowerCase();
      userMemory = userMemory.filter((l) => l.event.toLowerCase().includes(q) || (l.remarks || '').toLowerCase().includes(q));
    }
    const total = userMemory.length;
    const totalPages = Math.ceil(total / limit) || 1;
    return {
      logs: userMemory.slice(offset, offset + limit),
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Retrieves consolidated user logs for All Logs view.
   * Joined with profiles to supply creator identity and role for UI filtering.
   */
  async getAllLogs(
    query: ListUserLogsQuery
  ): Promise<{ logs: UserLogRecord[]; total: number; page: number; limit: number; totalPages: number }> {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);
    const offset = (page - 1) * limit;

    try {
      let dbQuery = supabaseAdmin
        .from('user_logs')
        .select(
          `
          id,
          created_by,
          created_at,
          event,
          remarks,
          profiles:created_by (
            full_name,
            role,
            email
          )
        `,
          { count: 'exact' }
        );

      if (query.search) {
        dbQuery = dbQuery.or(`event.ilike.%${query.search}%,remarks.ilike.%${query.search}%`);
      }

      if (query.from) {
        dbQuery = dbQuery.gte('created_at', query.from);
      }
      if (query.to) {
        dbQuery = dbQuery.lte('created_at', query.to);
      }

      dbQuery = dbQuery.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

      const { data, error, count } = await dbQuery;

      if (!error && data) {
        const formattedLogs: UserLogRecord[] = data.map((row: any) => {
          const prof = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
          return {
            id: row.id,
            created_by: row.created_by,
            created_at: row.created_at,
            event: row.event,
            remarks: row.remarks,
            user_name: prof?.full_name || 'User',
            user_role: prof?.role || 'SUPERVISOR',
            user_email: prof?.email || '',
          };
        });

        const total = count ?? formattedLogs.length;
        const totalPages = Math.ceil(total / limit) || 1;

        return {
          logs: formattedLogs,
          total,
          page,
          limit,
          totalPages,
        };
      }
    } catch {
      // Fallback
    }

    let allMemory = [...memoryLogs];
    if (query.search) {
      const q = query.search.toLowerCase();
      allMemory = allMemory.filter(
        (l) => l.event.toLowerCase().includes(q) || (l.remarks || '').toLowerCase().includes(q) || (l.user_name || '').toLowerCase().includes(q)
      );
    }
    if (query.role) {
      allMemory = allMemory.filter((l) => l.user_role === query.role);
    }
    const total = allMemory.length;
    const totalPages = Math.ceil(total / limit) || 1;
    return {
      logs: allMemory.slice(offset, offset + limit),
      total,
      page,
      limit,
      totalPages,
    };
  }
}

export const logsService = new LogsService();
