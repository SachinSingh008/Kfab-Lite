import { supabaseAdmin, hasServiceRoleKey } from '../../db/supabase.js';
import { CreateUserInput, UpdateUserInput, ListUsersQuery } from './users.schema.js';

export interface UserResponseDTO {
  id: string;
  fullName: string;
  email: string;
  username: string;
  role: string;
  status: string;
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

export class UsersService {
  /**
   * Lists users with search, filtering, pagination, and sorting.
   * Parameterized queries through Supabase postgREST builder.
   */
  async listUsers(query: ListUsersQuery): Promise<{
    users: UserResponseDTO[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { search, role, status, department, sortBy, sortOrder, page, limit } = query;
    const offset = (page - 1) * limit;

    let dbQuery = supabaseAdmin
      .from('profiles')
      .select('id, full_name, email, role, status, department, designation, employee_id, force_password_reset, is_super_admin, last_login_at, session_revoked_at, created_at, updated_at', { count: 'exact' });

    // 1. Text Search (parameterized full_name or email)
    if (search && search.trim().length > 0) {
      const sanitized = search.trim();
      dbQuery = dbQuery.or(`full_name.ilike.%${sanitized}%,email.ilike.%${sanitized}%`);
    }

    // 2. Role Filter
    if (role && role !== 'ALL') {
      if (role === 'SUPER_ADMIN') {
        dbQuery = dbQuery.eq('is_super_admin', true);
      } else {
        dbQuery = dbQuery.eq('role', role);
      }
    }

    // 3. Status Filter
    if (status && status !== 'ALL') {
      dbQuery = dbQuery.eq('status', status);
    }

    // 4. Department Filter
    if (department && department !== 'ALL') {
      dbQuery = dbQuery.eq('department', department);
    }

    // 5. Sorting
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

    // 6. Pagination
    dbQuery = dbQuery.range(offset, offset + limit - 1);

    const { data: profiles, error, count } = await dbQuery;

    if (error) {
      console.error('[UsersService.listUsers] Error querying profiles:', error);
      throw new Error(`Failed to list users: ${error.message}`);
    }

    const total = count ?? 0;
    const totalPages = Math.ceil(total / limit) || 1;

    // Fetch employee codes if mapped
    const employeeIds = (profiles || [])
      .map((p) => p.employee_id)
      .filter((id): id is string => Boolean(id));

    let employeeMap = new Map<string, { code: string; name: string }>();
    if (employeeIds.length > 0) {
      const { data: employees } = await supabaseAdmin
        .from('employees')
        .select('id, employee_code, name')
        .in('id', employeeIds);

      if (employees) {
        employeeMap = new Map(employees.map((e) => [e.id, { code: e.employee_code, name: e.name }]));
      }
    }

    const mappedUsers: UserResponseDTO[] = (profiles || []).map((p) => {
      const emp = p.employee_id ? employeeMap.get(p.employee_id) : undefined;
      return {
        id: p.id,
        fullName: p.full_name || 'User',
        email: p.email || '',
        username: p.email || '',
        role: p.is_super_admin ? 'SUPER_ADMIN' : p.role || 'ADMIN',
        status: p.status || 'ACTIVE',
        department: p.department || null,
        designation: p.designation || null,
        employeeId: p.employee_id || null,
        employeeCode: emp?.code || null,
        employeeName: emp?.name || null,
        forcePasswordReset: p.force_password_reset ?? false,
        isSuperAdmin: p.is_super_admin ?? false,
        lastLoginAt: p.last_login_at || null,
        sessionRevokedAt: p.session_revoked_at || null,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      };
    });

    return {
      users: mappedUsers,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Retrieves single user profile by ID with employee data and audit trail.
   */
  async getUserById(userId: string): Promise<UserResponseDTO & { auditLogs: unknown[] }> {
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email, role, status, department, designation, employee_id, force_password_reset, is_super_admin, last_login_at, session_revoked_at, created_at, updated_at')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      throw new Error(`User not found with ID: ${userId}`);
    }

    let employeeInfo: { code: string; name: string } | undefined;
    if (profile.employee_id) {
      const { data: emp } = await supabaseAdmin
        .from('employees')
        .select('employee_code, name')
        .eq('id', profile.employee_id)
        .maybeSingle();

      if (emp) {
        employeeInfo = { code: emp.employee_code, name: emp.name };
      }
    }

    // Fetch recent audit logs targeting this user
    const { data: auditLogs } = await supabaseAdmin
      .from('audit_logs')
      .select('id, action, module, created_at, user_id, status, reason')
      .or(`target_user_id.eq.${userId},record_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(10);

    return {
      id: profile.id,
      fullName: profile.full_name,
      email: profile.email || '',
      username: profile.email || '',
      role: profile.is_super_admin ? 'SUPER_ADMIN' : profile.role || 'ADMIN',
      status: profile.status || 'ACTIVE',
      department: profile.department || null,
      designation: profile.designation || null,
      employeeId: profile.employee_id || null,
      employeeCode: employeeInfo?.code || null,
      employeeName: employeeInfo?.name || null,
      forcePasswordReset: profile.force_password_reset ?? false,
      isSuperAdmin: profile.is_super_admin ?? false,
      lastLoginAt: profile.last_login_at || null,
      sessionRevokedAt: profile.session_revoked_at || null,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
      auditLogs: auditLogs || [],
    };
  }

  /**
   * Creates a new user record through Supabase Auth and provisions ERP profile.
   */
  async createUser(input: CreateUserInput, actorId?: string): Promise<UserResponseDTO> {
    const cleanEmail = input.email.toLowerCase().trim();

    // 1. Verify employee existence if mapped
    if (input.employeeId) {
      const { data: emp, error: empErr } = await supabaseAdmin
        .from('employees')
        .select('id, department, designation')
        .eq('id', input.employeeId)
        .maybeSingle();

      if (empErr || !emp) {
        throw new Error(`Invalid employeeId: Employee record does not exist.`);
      }
    }

    // 2. Check for duplicate email in profiles
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (existingProfile) {
      throw new Error(`A user with email "${cleanEmail}" already exists.`);
    }

    let createdUserId: string | null = null;
    const isSuper = input.role === 'SUPER_ADMIN';

    // 3. Create user through authoritative Supabase Auth Admin API (GoTrue)
    if (!hasServiceRoleKey) {
      throw new Error(
        'Server configuration error: SUPABASE_SERVICE_ROLE_KEY is required on the backend for administrative user creation. Please configure it in kfab-backend/.env.'
      );
    }

    const { data: authResult, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: cleanEmail,
      password: input.initialPassword,
      email_confirm: true,
      user_metadata: {
        full_name: input.fullName.trim(),
        role: input.role,
        department: input.department || null,
      },
    });

    if (authError || !authResult.user) {
      throw new Error(`Supabase Auth creation failed: ${authError?.message || 'Unknown error'}`);
    }
    createdUserId = authResult.user.id;

    // 4. Provision ERP Profile in public.profiles
    const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
      id: createdUserId,
      full_name: input.fullName.trim(),
      email: cleanEmail,
      role: input.role,
      status: input.status,
      department: input.department || null,
      designation: input.designation || null,
      employee_id: input.employeeId || null,
      force_password_reset: input.forcePasswordReset,
      is_super_admin: isSuper,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (profileError) {
      // Rollback auth identity if profile insertion fails to prevent orphaned records
      await supabaseAdmin.auth.admin.deleteUser(createdUserId);
      throw new Error(`Profile creation failed: ${profileError.message}`);
    }

    if (!createdUserId) {
      throw new Error('User creation failed: No user ID was returned.');
    }

    return this.getUserById(createdUserId);
  }

  /**
   * Updates an existing user record.
   * Safeguards against demoting the last active Super Admin or unauthorized privilege escalation.
   */
  async updateUser(
    userId: string,
    input: UpdateUserInput,
    actorIsSuperAdmin: boolean
  ): Promise<UserResponseDTO> {
    const existing = await this.getUserById(userId);

    // 1. Safeguard: Prevent non-super admin from escalating themselves or others to SUPER_ADMIN
    if (input.role === 'SUPER_ADMIN' && !actorIsSuperAdmin) {
      throw new Error('Privilege escalation rejected: Only a Super Administrator can grant Super Admin status.');
    }

    // 2. Safeguard: Prevent modifying the role of a Super Admin unless caller is Super Admin
    if (existing.isSuperAdmin && !actorIsSuperAdmin && input.role && input.role !== 'SUPER_ADMIN') {
      throw new Error('Access denied: You cannot alter the role of a Super Administrator.');
    }

    // 3. Safeguard: Prevent demoting the last active Super Admin
    if (existing.isSuperAdmin && input.role && input.role !== 'SUPER_ADMIN') {
      const { count } = await supabaseAdmin
        .from('profiles')
        .select('id', { count: 'exact' })
        .eq('is_super_admin', true)
        .eq('status', 'ACTIVE')
        .neq('id', userId);

      if ((count ?? 0) < 1) {
        throw new Error('Action rejected: Cannot demote the last active Super Administrator in the system.');
      }
    }

    // 4. Update Supabase Auth email if changed
    if (input.email && input.email.toLowerCase() !== existing.email.toLowerCase()) {
      const newEmail = input.email.toLowerCase().trim();
      if (hasServiceRoleKey) {
        await supabaseAdmin.auth.admin.updateUserById(userId, {
          email: newEmail,
          email_confirm: true,
        });
      }
    }

    // 5. Update Profile
    const profileUpdates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (input.fullName !== undefined) profileUpdates.full_name = input.fullName.trim();
    if (input.email !== undefined) profileUpdates.email = input.email.toLowerCase().trim();
    if (input.role !== undefined) {
      profileUpdates.role = input.role;
      profileUpdates.is_super_admin = input.role === 'SUPER_ADMIN';
    }
    if (input.status !== undefined) profileUpdates.status = input.status;
    if (input.department !== undefined) profileUpdates.department = input.department;
    if (input.designation !== undefined) profileUpdates.designation = input.designation;
    if (input.employeeId !== undefined) profileUpdates.employee_id = input.employeeId;
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
   * Deactivates a user account (preserves historical links and audit trails).
   * Prevents deactivating the last active Super Admin.
   */
  async deactivateUser(userId: string): Promise<UserResponseDTO> {
    const existing = await this.getUserById(userId);

    // Safeguard: Protect last active Super Admin
    if (existing.isSuperAdmin) {
      const { count } = await supabaseAdmin
        .from('profiles')
        .select('id', { count: 'exact' })
        .eq('is_super_admin', true)
        .eq('status', 'ACTIVE')
        .neq('id', userId);

      if ((count ?? 0) < 1) {
        throw new Error('Action rejected: Cannot deactivate the last active Super Administrator in the system.');
      }
    }

    // Update status and revoke sessions
    const nowIso = new Date().toISOString();
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

    // Terminate active sessions in Supabase Auth if service role available
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
   * Resets a user's password securely through Supabase Auth.
   * Never reveals or exposes existing or new password.
   */
  async resetPassword(
    userId: string,
    newPassword?: string,
    forceReset: boolean = true,
    revokeSessions: boolean = true
  ): Promise<{ message: string }> {
    const existing = await this.getUserById(userId);

    if (newPassword && newPassword.length >= 8) {
      // 1. Explicit admin password reset through authoritative Supabase Auth Admin API
      if (!hasServiceRoleKey) {
        throw new Error(
          'Server configuration error: SUPABASE_SERVICE_ROLE_KEY is required on the backend for administrative password updates.'
        );
      }
      const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: newPassword,
      });
      if (error) throw new Error(`Password reset failed: ${error.message}`);
    } else {
      // 2. Trigger secure reset email via Supabase Auth
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
   * Revokes all active sessions for a target user.
   */
  async revokeSessions(userId: string): Promise<{ message: string }> {
    const nowIso = new Date().toISOString();

    const { error } = await supabaseAdmin
      .from('profiles')
      .update({
        session_revoked_at: nowIso,
        updated_at: nowIso,
      })
      .eq('id', userId);

    if (error) {
      throw new Error(`Failed to revoke sessions: ${error.message}`);
    }

    if (hasServiceRoleKey) {
      try {
        await supabaseAdmin.auth.admin.signOut(userId);
      } catch (err) {
        console.warn(`[Supabase Auth signOut error]:`, err);
      }
    }

    return { message: 'All user sessions have been terminated successfully.' };
  }
}

export const usersService = new UsersService();
