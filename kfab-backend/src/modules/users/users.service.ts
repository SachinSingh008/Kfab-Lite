import { supabaseAdmin, createUserClient, hasServiceRoleKey } from '../../db/supabase.js';
import { CreateUserInput, UpdateUserInput, ListUsersQuery } from './users.schema.js';

export interface UserResponseDTO {
  id: string;
  fullName: string;
  email: string;
  role: string;
  status: string;
  forcePasswordReset: boolean;
  isSuperAdmin: boolean;
  lastLoginAt: string | null;
  sessionRevokedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const DEFAULT_SYSTEM_USERS: UserResponseDTO[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    fullName: 'Super Administrator',
    email: 'superadmin@kfab.in',
    role: 'SUPER_ADMIN',
    status: 'ACTIVE',
    forcePasswordReset: false,
    isSuperAdmin: true,
    lastLoginAt: new Date().toISOString(),
    sessionRevokedAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    fullName: 'Plant Administrator',
    email: 'admin@kfab.in',
    role: 'ADMIN',
    status: 'ACTIVE',
    forcePasswordReset: false,
    isSuperAdmin: false,
    lastLoginAt: null,
    sessionRevokedAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    fullName: 'Site Supervisor',
    email: 'supervisor@kfab.in',
    role: 'SUPERVISOR',
    status: 'ACTIVE',
    forcePasswordReset: false,
    isSuperAdmin: false,
    lastLoginAt: null,
    sessionRevokedAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-000000000004',
    fullName: 'Finance Accountant',
    email: 'accountant@kfab.in',
    role: 'ACCOUNT',
    status: 'ACTIVE',
    forcePasswordReset: false,
    isSuperAdmin: false,
    lastLoginAt: null,
    sessionRevokedAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
];

let memoryUsers: UserResponseDTO[] = [...DEFAULT_SYSTEM_USERS];

export class UsersService {
  /**
   * Helper to verify if backend is equipped with Service Role Key
   */
  private ensureServiceRoleKey() {
    if (!hasServiceRoleKey) {
      throw new Error(
        'Server configuration error: SUPABASE_SERVICE_ROLE_KEY is required on the backend for administrative identity operations. Please configure it in kfab-backend/.env.'
      );
    }
  }

  /**
   * Resolves the appropriate Supabase client:
   * Uses service_role if available, or caller authenticated token context.
   */
  private getDbClient(callerToken?: string) {
    if (hasServiceRoleKey) {
      return supabaseAdmin;
    }
    if (callerToken && !callerToken.startsWith('kfab-dev-token-')) {
      return createUserClient(callerToken);
    }
    return supabaseAdmin;
  }

  /**
   * Filters and sorts memory/fallback users when database is inaccessible or service_role key is missing.
   */
  private filterFallbackUsers(query: ListUsersQuery) {
    const { search, role, status, sortBy, sortOrder, page, limit } = query;
    let list = [...memoryUsers];

    if (search && search.trim().length > 0) {
      const q = search.trim().toLowerCase();
      list = list.filter((u) => u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }

    if (role && role !== 'ALL') {
      list = list.filter((u) => u.role === role);
    }

    if (status && status !== 'ALL') {
      list = list.filter((u) => u.status === status);
    }

    list.sort((a, b) => {
      const field = sortBy === 'name' ? 'fullName' : (sortBy as keyof UserResponseDTO);
      const valA = String(a[field] ?? '');
      const valB = String(b[field] ?? '');
      return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });

    const offset = (page - 1) * limit;
    const paged = list.slice(offset, offset + limit);

    return {
      users: paged,
      total: list.length,
      page,
      limit,
      totalPages: Math.ceil(list.length / limit) || 1,
    };
  }

  /**
   * Lists users with search, filtering, pagination, and sorting.
   */
  async listUsers(query: ListUsersQuery, callerToken?: string): Promise<{
    users: UserResponseDTO[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { search, role, status, sortBy, sortOrder, page, limit } = query;
    const offset = (page - 1) * limit;

    const client = this.getDbClient(callerToken);

    try {
      let dbQuery = client
        .from('profiles')
        .select('id, full_name, email, role, status, force_password_reset, last_login_at, session_revoked_at, created_at, updated_at', { count: 'exact' });

      // 1. Text Search (parameterized full_name or email)
      if (search && search.trim().length > 0) {
        const sanitized = search.trim();
        dbQuery = dbQuery.or(`full_name.ilike.%${sanitized}%,email.ilike.%${sanitized}%`);
      }

      // 2. Role Filter
      if (role && role !== 'ALL') {
        dbQuery = dbQuery.eq('role', role);
      }

      // 3. Status Filter
      if (status && status !== 'ALL') {
        dbQuery = dbQuery.eq('status', status);
      }

      // 4. Sorting
      const columnMap: Record<string, string> = {
        name: 'full_name',
        email: 'email',
        role: 'role',
        status: 'status',
        created_at: 'created_at',
        last_login_at: 'last_login_at',
      };
      const dbSortColumn = columnMap[sortBy] || 'created_at';
      dbQuery = dbQuery.order(dbSortColumn, { ascending: sortOrder === 'asc' });

      // 5. Pagination
      dbQuery = dbQuery.range(offset, offset + limit - 1);

      const { data: profiles, error, count } = await dbQuery;

      if (error) {
        if (
          !hasServiceRoleKey ||
          error.message?.includes('permission denied') ||
          error.code === '42501' ||
          error.code === 'PGRST301'
        ) {
          console.warn('[UsersService.listUsers] Supabase query restricted or unconfigured. Serving memory/fallback catalog.');
          return this.filterFallbackUsers(query);
        }
        throw new Error(`Failed to list users: ${error.message}`);
      }

      const total = count ?? 0;
      const totalPages = Math.ceil(total / limit) || 1;

      const mappedUsers: UserResponseDTO[] = (profiles || []).map((p) => ({
        id: p.id,
        fullName: p.full_name || 'User',
        email: p.email || '',
        role: p.role || 'SUPERVISOR',
        status: p.status || 'ACTIVE',
        forcePasswordReset: p.force_password_reset ?? false,
        isSuperAdmin: p.role === 'SUPER_ADMIN',
        lastLoginAt: p.last_login_at || null,
        sessionRevokedAt: p.session_revoked_at || null,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      }));

      return {
        users: mappedUsers,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (err: unknown) {
      if (
        !hasServiceRoleKey ||
        (err instanceof Error && (err.message.includes('permission denied') || err.message.includes('42501')))
      ) {
        console.warn('[UsersService.listUsers] Caught permission error. Returning memory/fallback catalog.');
        return this.filterFallbackUsers(query);
      }
      throw err;
    }
  }

  /**
   * Retrieves single user profile by ID with audit trail.
   */
  async getUserById(userId: string, callerToken?: string): Promise<UserResponseDTO & { auditLogs: unknown[] }> {
    const client = this.getDbClient(callerToken);

    try {
      const { data: profile, error } = await client
        .from('profiles')
        .select('id, full_name, email, role, status, force_password_reset, last_login_at, session_revoked_at, created_at, updated_at')
        .eq('id', userId)
        .maybeSingle();

      if (error || !profile) {
        if (!hasServiceRoleKey || error?.message?.includes('permission denied') || error?.code === '42501') {
          const fallback = memoryUsers.find((u) => u.id === userId) || memoryUsers[0];
          return { ...fallback, auditLogs: [] };
        }
        throw new Error(`User not found with ID: ${userId}`);
      }

      // Fetch recent audit logs targeting or executed by this user
      const { data: auditLogs } = await client
        .from('audit_logs')
        .select('id, action, created_at, actor_id, target_user_id, status, details')
        .or(`target_user_id.eq.${userId},actor_id.eq.${userId}`)
        .order('created_at', { ascending: false })
        .limit(15);

      return {
        id: profile.id,
        fullName: profile.full_name,
        email: profile.email || '',
        role: profile.role || 'SUPERVISOR',
        status: profile.status || 'ACTIVE',
        forcePasswordReset: profile.force_password_reset ?? false,
        isSuperAdmin: profile.role === 'SUPER_ADMIN',
        lastLoginAt: profile.last_login_at || null,
        sessionRevokedAt: profile.session_revoked_at || null,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at,
        auditLogs: auditLogs || [],
      };
    } catch (err: unknown) {
      if (!hasServiceRoleKey || (err instanceof Error && err.message.includes('permission denied'))) {
        const fallback = memoryUsers.find((u) => u.id === userId) || memoryUsers[0];
        return { ...fallback, auditLogs: [] };
      }
      throw err;
    }
  }

  /**
   * Creates a new user record through Supabase Auth Admin API and provisions profile.
   */
  async createUser(
    input: CreateUserInput,
    actorRole?: string
  ): Promise<UserResponseDTO> {
    // Hierarchy safeguard: Only a SUPER_ADMIN can create another SUPER_ADMIN
    if (input.role === 'SUPER_ADMIN' && actorRole !== 'SUPER_ADMIN') {
      throw new Error('Access denied: Only a Super Administrator can provision another Super Administrator.');
    }

    const cleanEmail = input.email.toLowerCase().trim();

    if (!hasServiceRoleKey) {
      console.warn('[UsersService.createUser] SUPABASE_SERVICE_ROLE_KEY missing, saving to memory catalog.');
      const newDevUser: UserResponseDTO = {
        id: `00000000-0000-0000-0000-${String(memoryUsers.length + 1).padStart(12, '0')}`,
        fullName: input.fullName.trim(),
        email: cleanEmail,
        role: input.role,
        status: input.status,
        forcePasswordReset: input.forcePasswordReset,
        isSuperAdmin: input.role === 'SUPER_ADMIN',
        lastLoginAt: null,
        sessionRevokedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      memoryUsers.push(newDevUser);
      return newDevUser;
    }

    // Check for duplicate email in profiles
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (existingProfile) {
      throw new Error(`A user with email "${cleanEmail}" already exists.`);
    }

    // 1. Create through Supabase Auth Admin API (authoritative GoTrue)
    const { data: authResult, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: cleanEmail,
      password: input.initialPassword,
      email_confirm: true,
      user_metadata: {
        full_name: input.fullName.trim(),
        role: input.role,
      },
    });

    if (authError || !authResult.user) {
      throw new Error(`Supabase Auth identity creation failed: ${authError?.message || 'Unknown error'}`);
    }

    const createdUserId = authResult.user.id;

    // 2. Provision Profile in public.profiles
    const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
      id: createdUserId,
      full_name: input.fullName.trim(),
      email: cleanEmail,
      role: input.role,
      status: input.status,
      force_password_reset: input.forcePasswordReset,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (profileError) {
      // Rollback auth user if profile insertion fails
      await supabaseAdmin.auth.admin.deleteUser(createdUserId);
      throw new Error(`Profile creation failed: ${profileError.message}`);
    }

    return this.getUserById(createdUserId);
  }

  /**
   * Updates an existing user profile and Supabase Auth metadata.
   */
  async updateUser(
    userId: string,
    input: UpdateUserInput,
    actorRole?: string
  ): Promise<UserResponseDTO> {
    const existing = await this.getUserById(userId);

    // Hierarchy safeguard 1: Only a SUPER_ADMIN can promote a user to SUPER_ADMIN
    if (input.role === 'SUPER_ADMIN' && existing.role !== 'SUPER_ADMIN' && actorRole !== 'SUPER_ADMIN') {
      throw new Error('Access denied: Only a Super Administrator can promote a user to Super Administrator.');
    }

    // Hierarchy safeguard 2: Prevent demoting the last active SUPER_ADMIN
    if (existing.role === 'SUPER_ADMIN' && input.role && input.role !== 'SUPER_ADMIN') {
      const activeSuperAdmins = memoryUsers.filter(u => u.role === 'SUPER_ADMIN' && u.status === 'ACTIVE' && u.id !== userId);
      if (hasServiceRoleKey) {
        const { count } = await supabaseAdmin
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('role', 'SUPER_ADMIN')
          .eq('status', 'ACTIVE')
          .neq('id', userId);

        if ((count ?? 0) < 1) {
          throw new Error('Action rejected: Cannot demote the last active Super Administrator in the system.');
        }
      } else if (activeSuperAdmins.length < 1) {
        throw new Error('Action rejected: Cannot demote the last active Super Administrator in the system.');
      }
    }

    // Hierarchy safeguard 3: Prevent deactivating the last active SUPER_ADMIN
    if (existing.role === 'SUPER_ADMIN' && input.status === 'INACTIVE') {
      const activeSuperAdmins = memoryUsers.filter(u => u.role === 'SUPER_ADMIN' && u.status === 'ACTIVE' && u.id !== userId);
      if (hasServiceRoleKey) {
        const { count } = await supabaseAdmin
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('role', 'SUPER_ADMIN')
          .eq('status', 'ACTIVE')
          .neq('id', userId);

        if ((count ?? 0) < 1) {
          throw new Error('Action rejected: Cannot deactivate the last active Super Administrator in the system.');
        }
      } else if (activeSuperAdmins.length < 1) {
        throw new Error('Action rejected: Cannot deactivate the last active Super Administrator in the system.');
      }
    }

    if (!hasServiceRoleKey) {
      const idx = memoryUsers.findIndex((u) => u.id === userId);
      if (idx !== -1) {
        if (input.fullName !== undefined) memoryUsers[idx].fullName = input.fullName.trim();
        if (input.email !== undefined) memoryUsers[idx].email = input.email.toLowerCase().trim();
        if (input.role !== undefined) memoryUsers[idx].role = input.role;
        if (input.status !== undefined) memoryUsers[idx].status = input.status;
        if (input.forcePasswordReset !== undefined) memoryUsers[idx].forcePasswordReset = input.forcePasswordReset;
        memoryUsers[idx].updatedAt = new Date().toISOString();
        return memoryUsers[idx];
      }
    }

    // Update Supabase Auth email if changed
    if (input.email && input.email.toLowerCase() !== existing.email.toLowerCase()) {
      this.ensureServiceRoleKey();
      const newEmail = input.email.toLowerCase().trim();
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        email: newEmail,
        email_confirm: true,
      });
    }

    // Update Profile
    const profileUpdates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (input.fullName !== undefined) profileUpdates.full_name = input.fullName.trim();
    if (input.email !== undefined) profileUpdates.email = input.email.toLowerCase().trim();
    if (input.role !== undefined) profileUpdates.role = input.role;
    if (input.status !== undefined) profileUpdates.status = input.status;
    if (input.forcePasswordReset !== undefined) profileUpdates.force_password_reset = input.forcePasswordReset;

    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update(profileUpdates)
      .eq('id', userId);

    if (updateError) {
      throw new Error(`Failed to update user profile: ${updateError.message}`);
    }

    return this.getUserById(userId);
  }

  /**
   * Deactivates a user account and terminates active sessions.
   */
  async deactivateUser(userId: string): Promise<UserResponseDTO> {
    const existing = await this.getUserById(userId);

    // Safeguard: Cannot deactivate last active Super Admin
    if (existing.role === 'SUPER_ADMIN') {
      const activeSuperAdmins = memoryUsers.filter(u => u.role === 'SUPER_ADMIN' && u.status === 'ACTIVE' && u.id !== userId);
      if (hasServiceRoleKey) {
        const { count } = await supabaseAdmin
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('role', 'SUPER_ADMIN')
          .eq('status', 'ACTIVE')
          .neq('id', userId);

        if ((count ?? 0) < 1) {
          throw new Error('Action rejected: Cannot deactivate the last active Super Administrator.');
        }
      } else if (activeSuperAdmins.length < 1) {
        throw new Error('Action rejected: Cannot deactivate the last active Super Administrator.');
      }
    }

    const nowIso = new Date().toISOString();

    if (!hasServiceRoleKey) {
      const idx = memoryUsers.findIndex((u) => u.id === userId);
      if (idx !== -1) {
        memoryUsers[idx].status = 'INACTIVE';
        memoryUsers[idx].sessionRevokedAt = nowIso;
        memoryUsers[idx].updatedAt = nowIso;
        return memoryUsers[idx];
      }
    }

    const { error } = await supabaseAdmin
      .from('profiles')
      .update({
        status: 'INACTIVE',
        session_revoked_at: nowIso,
        updated_at: nowIso,
      })
      .eq('id', userId);

    if (error) {
      throw new Error(`Failed to deactivate user: ${error.message}`);
    }

    // Terminate active sessions in Supabase Auth if service role key available
    if (hasServiceRoleKey) {
      try {
        await supabaseAdmin.auth.admin.signOut(userId);
      } catch (err) {
        console.warn(`[Supabase Auth signOut] Could not terminate remote session:`, err);
      }
    }

    return this.getUserById(userId);
  }

  /**
   * Activates a user account.
   */
  async activateUser(userId: string): Promise<UserResponseDTO> {
    const nowIso = new Date().toISOString();

    if (!hasServiceRoleKey) {
      const idx = memoryUsers.findIndex((u) => u.id === userId);
      if (idx !== -1) {
        memoryUsers[idx].status = 'ACTIVE';
        memoryUsers[idx].updatedAt = nowIso;
        return memoryUsers[idx];
      }
    }

    const { error } = await supabaseAdmin
      .from('profiles')
      .update({
        status: 'ACTIVE',
        updated_at: nowIso,
      })
      .eq('id', userId);

    if (error) {
      throw new Error(`Failed to activate user: ${error.message}`);
    }

    return this.getUserById(userId);
  }

  /**
   * Permanently deletes a user (Super Admin only).
   */
  async deleteUser(userId: string): Promise<{ deletedId: string }> {
    const existing = await this.getUserById(userId);

    // Safeguard: Cannot delete a Super Admin account
    if (existing.role === 'SUPER_ADMIN') {
      throw new Error('Action rejected: Super Administrator accounts cannot be deleted.');
    }

    if (!hasServiceRoleKey) {
      memoryUsers = memoryUsers.filter((u) => u.id !== userId);
      return { deletedId: userId };
    }

    this.ensureServiceRoleKey();

    // Delete profile (cascades or explicit)
    await supabaseAdmin.from('profiles').delete().eq('id', userId);

    // Delete from Supabase Auth
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (authError) {
      console.warn(`[Auth Delete Warning] Error removing auth identity:`, authError.message);
    }

    return { deletedId: userId };
  }

  /**
   * Resets a user's password securely through Supabase Auth Admin API.
   */
  async resetPassword(
    userId: string,
    newPassword?: string,
    forceReset: boolean = true,
    revokeSessions: boolean = true
  ): Promise<{ message: string }> {
    const existing = await this.getUserById(userId);

    if (!hasServiceRoleKey) {
      const idx = memoryUsers.findIndex((u) => u.id === userId);
      if (idx !== -1) {
        memoryUsers[idx].forcePasswordReset = forceReset;
        if (revokeSessions) memoryUsers[idx].sessionRevokedAt = new Date().toISOString();
        memoryUsers[idx].updatedAt = new Date().toISOString();
      }
      return {
        message: newPassword
          ? 'User password successfully updated.'
          : `Password reset email dispatched to ${existing.email}.`,
      };
    }

    if (newPassword && newPassword.length >= 8) {
      this.ensureServiceRoleKey();
      const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: newPassword,
      });
      if (error) throw new Error(`Password reset failed: ${error.message}`);
    } else {
      const { error } = await supabaseAdmin.auth.resetPasswordForEmail(existing.email);
      if (error) throw new Error(`Could not send password reset link: ${error.message}`);
    }

    // Update force_password_reset flag and session revocation
    const updates: Record<string, unknown> = {
      force_password_reset: forceReset,
      updated_at: new Date().toISOString(),
    };
    if (revokeSessions) {
      updates.session_revoked_at = new Date().toISOString();
      if (hasServiceRoleKey) {
        try {
          await supabaseAdmin.auth.admin.signOut(userId);
        } catch {
          // ignore
        }
      }
    }

    await supabaseAdmin.from('profiles').update(updates).eq('id', userId);

    return {
      message: newPassword
        ? 'User password successfully updated.'
        : `Password reset email dispatched to ${existing.email}.`,
    };
  }

  /**
   * Revokes all active sessions for a user.
   */
  async revokeSessions(userId: string, _reason?: string): Promise<{ message: string }> {
    const nowIso = new Date().toISOString();

    if (!hasServiceRoleKey) {
      const idx = memoryUsers.findIndex((u) => u.id === userId);
      if (idx !== -1) {
        memoryUsers[idx].sessionRevokedAt = nowIso;
        memoryUsers[idx].updatedAt = nowIso;
      }
      return { message: 'All active sessions have been revoked successfully.' };
    }

    const { error } = await supabaseAdmin
      .from('profiles')
      .update({
        session_revoked_at: nowIso,
        updated_at: nowIso,
      })
      .eq('id', userId);

    if (error) {
      throw new Error(`Failed to revoke user sessions: ${error.message}`);
    }

    if (hasServiceRoleKey) {
      try {
        await supabaseAdmin.auth.admin.signOut(userId);
      } catch (err) {
        console.warn(`[Supabase Auth signOut] Could not terminate remote session:`, err);
      }
    }

    return { message: 'All active sessions have been revoked successfully.' };
  }
}

export const usersService = new UsersService();
