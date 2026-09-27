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
 */
async function getAuthToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  try {
    const supabase = createClient();
    if (!supabase) return null;
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || null;
  } catch {
    return null;
  }
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
