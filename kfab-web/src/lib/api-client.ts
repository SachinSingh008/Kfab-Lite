// ============================================================================
// KFAB360 — Authoritative REST API Client (/api/v1/...)
// Communicates with the Fastify Node.js Backend with Automatic JWT Attachment
// ============================================================================

import { createClient } from './supabase/client';

export interface ApiUserDTO {
  id: string;
  fullName: string;
  email: string;
  username: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'SUPERVISOR' | 'ACCOUNTANT' | 'STOREKEEPER' | 'ATTENDANCE_USER' | 'VIEWER';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  department: string | null;
  designation: string | null;
  employeeId: string | null;
  employeeCode?: string | null;
  employeeName?: string | null;
  forcePasswordReset: boolean;
  isSuperAdmin: boolean;
  lastLoginAt: string | null;
  sessionRevokedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiUserListResponse {
  users: ApiUserDTO[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiEmployeeDTO {
  id: string;
  employee_code: string;
  name: string;
  department: string;
  designation: string;
  status: string;
}

export interface ApiRoleDTO {
  value: string;
  label: string;
  description: string;
  permissions: string[];
}

export const ROLE_DEFAULT_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: [
    'users.view', 'users.manage', 'users.create', 'users.edit', 'users.deactivate',
    'users.reset_password', 'users.revoke_session', 'users.assign_role', 'employees.view',
    'employees.manage', 'attendance.view', 'attendance.mark', 'attendance.correct',
    'stock.view', 'stock.inward', 'stock.outward', 'stock.usage', 'stock.void',
    'reports.view', 'reports.export', 'audit.view',
  ],
  ADMIN: [
    'users.view', 'users.manage', 'users.create', 'users.edit', 'users.deactivate',
    'users.reset_password', 'users.revoke_session', 'employees.view', 'employees.manage',
    'attendance.view', 'attendance.mark', 'attendance.correct', 'stock.view',
    'stock.inward', 'stock.outward', 'stock.usage', 'stock.void', 'reports.view',
    'reports.export', 'audit.view',
  ],
  SUPERVISOR: [
    'employees.view', 'attendance.view', 'attendance.mark', 'stock.view', 'stock.usage',
  ],
  ACCOUNTANT: [
    'employees.view', 'attendance.view', 'stock.view', 'stock.inward', 'reports.view', 'reports.export',
  ],
  STOREKEEPER: [
    'stock.view', 'stock.inward', 'stock.outward', 'stock.usage', 'stock.void',
  ],
  ATTENDANCE_USER: [
    'attendance.view', 'attendance.mark',
  ],
  VIEWER: [
    'stock.view', 'attendance.view', 'reports.view',
  ],
};

export interface AuditLogDTO {
  id: string;
  action: string;
  module: string;
  created_at: string;
  user_id?: string;
  status: string;
  reason?: string;
}

/**
 * Resolves current user's Supabase JWT access token for authoritative API calls.
 * Falls back to an encoded development bearer token if running in local session mode.
 */
async function getAuthToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  try {
    const supabase = createClient();
    if (supabase) {
      const { data } = await supabase.auth.getSession();
      if (data.session?.access_token) {
        return data.session.access_token;
      }
    }
  } catch {
    // Continue to session fallback
  }

  // Fallback: check stored session in localStorage
  try {
    const raw = localStorage.getItem('kfab_auth_session_v6');
    if (raw) {
      const user = JSON.parse(raw);
      if (user && user.id) {
        const devPayload = {
          sub: user.id,
          email: user.username?.includes('@') ? user.username : `${user.username || 'user'}@kfab.in`,
          name: user.name || 'User',
          role: user.role || 'SUPER_ADMIN',
          isSuperAdmin: user.role === 'SUPER_ADMIN',
          status: user.status || 'ACTIVE',
        };
        const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(devPayload))));
        return `kfab-dev-token-${encoded}`;
      }
    }
  } catch {
    return null;
  }

  return null;
}

/**
 * Core Request wrapper for /api/v1 with error extraction and token handling.
 */
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = await getAuthToken();

  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMessage = data?.message || `API request failed with status ${response.status}`;
    throw new Error(errorMessage);
  }

  return data as T;
}

// ============================================================================
// API Methods
// ============================================================================

export async function apiGetUsers(params: {
  search?: string;
  role?: string;
  status?: string;
  department?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}): Promise<ApiUserListResponse> {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.role) query.set('role', params.role);
  if (params.status) query.set('status', params.status);
  if (params.department) query.set('department', params.department);
  if (params.sortBy) query.set('sortBy', params.sortBy);
  if (params.sortOrder) query.set('sortOrder', params.sortOrder);
  if (params.page) query.set('page', params.page.toString());
  if (params.limit) query.set('limit', params.limit.toString());

  return apiRequest<ApiUserListResponse>(`/api/v1/users?${query.toString()}`);
}

export async function apiGetUserById(
  id: string
): Promise<{ user: ApiUserDTO & { auditLogs: AuditLogDTO[] } }> {
  return apiRequest<{ user: ApiUserDTO & { auditLogs: AuditLogDTO[] } }>(`/api/v1/users/${id}`);
}

export async function apiCreateUser(payload: {
  fullName: string;
  username: string;
  email: string;
  employeeId?: string | null;
  department?: string | null;
  designation?: string | null;
  role: string;
  initialPassword: string;
  status?: string;
  forcePasswordReset?: boolean;
}): Promise<{ message: string; user: ApiUserDTO }> {
  return apiRequest<{ message: string; user: ApiUserDTO }>('/api/v1/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiUpdateUser(
  id: string,
  payload: {
    fullName?: string;
    email?: string;
    role?: string;
    department?: string | null;
    designation?: string | null;
    employeeId?: string | null;
    status?: string;
    forcePasswordReset?: boolean;
  }
): Promise<{ message: string; user: ApiUserDTO }> {
  return apiRequest<{ message: string; user: ApiUserDTO }>(`/api/v1/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function apiDeactivateUser(id: string): Promise<{ message: string; user: ApiUserDTO }> {
  return apiRequest<{ message: string; user: ApiUserDTO }>(`/api/v1/users/${id}/deactivate`, {
    method: 'POST',
  });
}

export async function apiActivateUser(id: string): Promise<{ message: string; user: ApiUserDTO }> {
  return apiRequest<{ message: string; user: ApiUserDTO }>(`/api/v1/users/${id}/activate`, {
    method: 'POST',
  });
}

export async function apiResetPassword(
  id: string,
  payload: {
    newPassword?: string;
    forcePasswordReset?: boolean;
    revokeExistingSessions?: boolean;
  }
): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/api/v1/users/${id}/reset-password`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiRevokeSessions(
  id: string,
  reason?: string
): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/api/v1/users/${id}/revoke-sessions`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

export async function apiGetRoles(): Promise<{ roles: ApiRoleDTO[] }> {
  return apiRequest<{ roles: ApiRoleDTO[] }>('/api/v1/roles');
}

export async function apiGetEmployees(): Promise<{ employees: ApiEmployeeDTO[] }> {
  return apiRequest<{ employees: ApiEmployeeDTO[] }>('/api/v1/employees');
}

export async function apiGetMe(): Promise<{
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    isSuperAdmin: boolean;
    status: string;
  };
  permissions: string[];
}> {
  return apiRequest<{
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      isSuperAdmin: boolean;
      status: string;
    };
    permissions: string[];
  }>('/api/v1/auth/me');
}

// ============================================================================
// LOGS MODULE (User Logs & System Audit Logs)
// ============================================================================

export interface UserLogDTO {
  id: string;
  created_by: string;
  created_at: string;
  event: string;
  remarks: string | null;
  user_name?: string;
  user_role?: string;
  user_email?: string;
}

export interface SystemLogDTO {
  id: string;
  created_at: string;
  actor_id: string | null;
  action: string;
  module: string;
  resource_type: string | null;
  resource_id: string | null;
  description: string;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  target_user_id: string | null;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  correlation_id: string | null;
  status: string;
  actor_name: string;
  actor_role: string;
  actor_email: string;
}

export interface PaginatedLogsResponse<T> {
  logs: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Local storage fallback cache for User Logs
const STORAGE_USER_LOGS_KEY = 'kfab_user_logs_v1';

function getLocalLogs(): UserLogDTO[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_USER_LOGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalLogs(logs: UserLogDTO[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_USER_LOGS_KEY, JSON.stringify(logs));
  } catch (e) {
    console.error('Failed to save local logs', e);
  }
}

export async function apiCreateUserLog(data: { event: string; remarks?: string }): Promise<{ data: UserLogDTO }> {
  try {
    const res = await apiRequest<{ data: UserLogDTO }>('/api/v1/logs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (res?.data) {
      const existing = getLocalLogs();
      saveLocalLogs([res.data, ...existing]);
      return res;
    }
  } catch (err) {
    console.warn('Backend API log creation failed, using local store:', err);
  }

  // Fallback local creation
  const storedUser = typeof window !== 'undefined' ? localStorage.getItem('kfab_auth_session_v6') : null;
  const user = storedUser ? JSON.parse(storedUser) : null;
  const newLog: UserLogDTO = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    created_by: user?.id || '00000000-0000-0000-0000-000000000001',
    created_at: new Date().toISOString(),
    event: data.event.trim(),
    remarks: data.remarks?.trim() || null,
    user_name: user?.name || 'User',
    user_role: user?.role || 'SUPER_ADMIN',
    user_email: user?.username || '',
  };

  const existing = getLocalLogs();
  saveLocalLogs([newLog, ...existing]);
  return { data: newLog };
}

export async function apiGetMyLogs(params?: {
  page?: number;
  limit?: number;
  search?: string;
  from?: string;
  to?: string;
}): Promise<PaginatedLogsResponse<UserLogDTO>> {
  const page = params?.page || 1;
  const limit = params?.limit || 25;

  try {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));
    if (params?.search) query.append('search', params.search);
    if (params?.from) query.append('from', params.from);
    if (params?.to) query.append('to', params.to);
    const qStr = query.toString();
    const res = await apiRequest<PaginatedLogsResponse<UserLogDTO>>(`/api/v1/logs/my${qStr ? `?${qStr}` : ''}`);
    if (res && Array.isArray(res.logs)) {
      return res;
    }
  } catch (err) {
    console.warn('Fastify API /api/v1/logs/my returned error, falling back to local storage:', err);
  }

  // Local fallback
  const storedUser = typeof window !== 'undefined' ? localStorage.getItem('kfab_auth_session_v6') : null;
  const currentUserId = storedUser ? JSON.parse(storedUser)?.id : null;
  let all = getLocalLogs().filter((l) => !currentUserId || l.created_by === currentUserId);
  if (params?.search) {
    const q = params.search.toLowerCase();
    all = all.filter((l) => l.event.toLowerCase().includes(q) || (l.remarks || '').toLowerCase().includes(q));
  }
  const offset = (page - 1) * limit;
  return {
    logs: all.slice(offset, offset + limit),
    total: all.length,
    page,
    limit,
    totalPages: Math.ceil(all.length / limit) || 1,
  };
}

export async function apiGetAllLogs(params?: {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  user?: string;
  from?: string;
  to?: string;
}): Promise<PaginatedLogsResponse<UserLogDTO>> {
  const page = params?.page || 1;
  const limit = params?.limit || 25;

  try {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));
    if (params?.search) query.append('search', params.search);
    if (params?.role) query.append('role', params.role);
    if (params?.user) query.append('user', params.user);
    if (params?.from) query.append('from', params.from);
    if (params?.to) query.append('to', params.to);
    const qStr = query.toString();
    const res = await apiRequest<PaginatedLogsResponse<UserLogDTO>>(`/api/v1/logs/all${qStr ? `?${qStr}` : ''}`);
    if (res && Array.isArray(res.logs)) {
      return res;
    }
  } catch (err) {
    console.warn('Fastify API /api/v1/logs/all returned error, falling back to local storage:', err);
  }

  let all = getLocalLogs();
  if (params?.search) {
    const q = params.search.toLowerCase();
    all = all.filter(
      (l) =>
        l.event.toLowerCase().includes(q) ||
        (l.remarks || '').toLowerCase().includes(q) ||
        (l.user_name || '').toLowerCase().includes(q)
    );
  }
  if (params?.role && params.role !== 'ALL') {
    all = all.filter((l) => l.user_role === params.role);
  }
  const offset = (page - 1) * limit;
  return {
    logs: all.slice(offset, offset + limit),
    total: all.length,
    page,
    limit,
    totalPages: Math.ceil(all.length / limit) || 1,
  };
}

export async function apiGetSystemLogs(params?: {
  page?: number;
  limit?: number;
  search?: string;
  module?: string;
  action?: string;
  user?: string;
  from?: string;
  to?: string;
}): Promise<PaginatedLogsResponse<SystemLogDTO>> {
  const page = params?.page || 1;
  const limit = params?.limit || 25;

  try {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));
    if (params?.search) query.append('search', params.search);
    if (params?.module) query.append('module', params.module);
    if (params?.action) query.append('action', params.action);
    if (params?.user) query.append('user', params.user);
    if (params?.from) query.append('from', params.from);
    if (params?.to) query.append('to', params.to);
    const qStr = query.toString();
    const res = await apiRequest<PaginatedLogsResponse<SystemLogDTO>>(`/api/v1/system-logs${qStr ? `?${qStr}` : ''}`);
    if (res && Array.isArray(res.logs)) {
      return res;
    }
  } catch (err) {
    console.warn('Fastify API /api/v1/system-logs returned error:', err);
  }

  return {
    logs: [],
    total: 0,
    page,
    limit,
    totalPages: 1,
  };
}

export async function apiGetSystemLogById(id: string): Promise<SystemLogDTO> {
  return apiRequest<SystemLogDTO>(`/api/v1/system-logs/${id}`);
}

