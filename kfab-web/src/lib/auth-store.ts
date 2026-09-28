// ============================================================================
// KFAB BASIC / KFAB360 — Authentication & User Management Store
// ============================================================================

export type AppRole = 'SUPER_ADMIN' | 'ADMIN' | 'SUPERVISOR' | 'ACCOUNT' | 'ACCOUNTANT';

export interface AppUser {
  id: string;
  name: string;
  username: string; // e.g. superadmin, superadmin@008, or email
  password: string;
  role: AppRole;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

const STORAGE_USERS_KEY = 'kfab_users_store_v6';
const STORAGE_SESSION_KEY = 'kfab_auth_session_v6';

export const DEFAULT_USERS: AppUser[] = [
  {
    id: 'usr-superadmin-001',
    name: 'Super Administrator',
    username: 'superadmin',
    password: 'admin123',
    role: 'SUPER_ADMIN',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
  },
];


export function getStoredUsers(): AppUser[] {
  if (typeof window === 'undefined') return DEFAULT_USERS;
  try {
    const raw = localStorage.getItem(STORAGE_USERS_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(DEFAULT_USERS));
      return DEFAULT_USERS;
    }
    const parsed: AppUser[] = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(DEFAULT_USERS));
      return DEFAULT_USERS;
    }
    let modified = false;
    // Only push defUser if list has no super admin at all
    const hasSuperAdmin = parsed.some((u) => u.role === 'SUPER_ADMIN');
    if (!hasSuperAdmin && DEFAULT_USERS.length > 0) {
      parsed.unshift(DEFAULT_USERS[0]);
      modified = true;
    }

    if (modified) {
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(parsed));
    }
    return parsed;
  } catch {
    return DEFAULT_USERS;
  }
}

export function saveStoredUsers(users: AppUser[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
  } catch (err) {
    console.error('Failed to save users to localStorage', err);
  }
}

export function getStoredSession(): AppUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_SESSION_KEY);
    if (!raw) return null;
    const session: AppUser = JSON.parse(raw);
    if (!session) return null;

    return session;
  } catch {
    return null;
  }
}

export function saveStoredSession(user: AppUser | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (user) {
      localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_SESSION_KEY);
    }
  } catch (err) {
    console.error('Failed to save session', err);
  }
}

import { createClient } from './supabase/client';

export async function authenticateUser(usernameInput: string, passwordInput: string): Promise<AppUser> {
  const users = getStoredUsers();
  const trimmed = usernameInput.trim();
  const lower = trimmed.toLowerCase();
  const passwordTrimmed = passwordInput.trim();

  // 1. Try Supabase Auth first (establishes active authenticated JWT session)
  const supabase = createClient();
  if (supabase) {
    const emailToTry = lower.includes('@') ? lower : `${lower}@kfab.in`;
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailToTry,
        password: passwordTrimmed,
      });

      if (!error && data.user) {
        // Query user profile from Supabase profiles table
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email, role, status')
          .eq('id', data.user.id)
          .maybeSingle();

        let role: AppRole = 'SUPERVISOR';
        if (profile?.role === 'SUPER_ADMIN') {
          role = 'SUPER_ADMIN';
        } else if (profile?.role === 'ADMIN' || profile?.role === 'SUPERVISOR' || profile?.role === 'ACCOUNTANT') {
          role = profile.role;
        }

        const supabaseUser: AppUser = {
          id: data.user.id,
          name: profile?.full_name || data.user.user_metadata?.full_name || trimmed,
          username: data.user.email || trimmed,
          password: passwordTrimmed,
          role,
          status: profile?.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
          createdAt: data.user.created_at || new Date().toISOString(),
        };

        if (supabaseUser.status !== 'ACTIVE') {
          await supabase.auth.signOut();
          throw new Error('This account has been deactivated. Contact your Super Administrator.');
        }

        // Sync into stored users
        const existingIdx = users.findIndex(
          (u) => u.id === data.user.id || u.username.toLowerCase() === supabaseUser.username.toLowerCase()
        );
        if (existingIdx !== -1) {
          users[existingIdx] = { ...users[existingIdx], ...supabaseUser };
          saveStoredUsers(users);
        } else {
          saveStoredUsers([supabaseUser, ...users]);
        }

        saveStoredSession(supabaseUser);
        return supabaseUser;
      }
    } catch (authErr) {
      if (authErr instanceof Error && authErr.message.includes('deactivated')) {
        throw authErr;
      }
      // If live auth fails, fallback to local match
    }
  }

  // 2. Direct match in stored users (fallback or offline)
  const found = users.find(
    (u) =>
      (u.username.toLowerCase() === lower || u.id.toLowerCase() === lower) &&
      u.password === passwordTrimmed
  );

  if (found) {
    if (found.status !== 'ACTIVE') {
      throw new Error('This account has been deactivated. Contact your Super Administrator.');
    }
    saveStoredSession(found);
    return found;
  }

  // 3. Fallback: If no users exist at all, bootstrap initial user
  if (users.length === 0) {
    const initialUser: AppUser = {
      id: `usr-${Date.now()}`,
      name: 'Super Administrator',
      username: trimmed,
      password: passwordTrimmed,
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };
    saveStoredUsers([initialUser]);
    saveStoredSession(initialUser);
    return initialUser;
  }

  throw new Error('Invalid username or password. Please verify your credentials.');
}

export async function createUserRecord(params: {
  name: string;
  username: string;
  password: string;
  role: 'ADMIN' | 'SUPERVISOR' | 'ACCOUNTANT';
}): Promise<AppUser> {
  const users = getStoredUsers();
  const trimmed = params.username.trim();

  if (!trimmed) throw new Error('Username / email is required.');
  if (!params.password) throw new Error('Password is required.');
  if (!params.name.trim()) throw new Error('Full name is required.');

  if (users.some((u) => u.username.toLowerCase() === trimmed.toLowerCase())) {
    throw new Error(`Username "${trimmed}" already exists.`);
  }

  let assignedId = `usr-${Date.now()}`;
  const emailToRegister = trimmed.includes('@') ? trimmed : `${trimmed.toLowerCase()}@kfab.in`;

  // 1. Try Supabase RPC admin_create_user first (creates in auth.users AND public.profiles instantly)
  const supabase = createClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.rpc('admin_create_user', {
        new_email: emailToRegister,
        new_password: params.password,
        new_name: params.name.trim(),
        new_role: params.role,
      });

      if (!error && data?.id) {
        assignedId = data.id;
      } else {
        // Fallback to auth.signUp
        const { data: signUpData } = await supabase.auth.signUp({
          email: emailToRegister,
          password: params.password,
          options: {
            data: {
              full_name: params.name.trim(),
              role: params.role,
            },
          },
        });
        if (signUpData?.user?.id) {
          assignedId = signUpData.user.id;
        }
      }
    } catch (err) {
      console.warn('[Supabase Sync] Could not register user to Supabase:', err);
    }
  }

  const newUser: AppUser = {
    id: assignedId,
    name: params.name.trim(),
    username: trimmed,
    password: params.password,
    role: params.role,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
  };

  const updated = [newUser, ...users];
  saveStoredUsers(updated);
  return newUser;
}

export async function syncUsersFromSupabase(): Promise<AppUser[]> {
  const supabase = createClient();
  if (!supabase) return getStoredUsers();

  try {
    let fetchedProfiles: Array<{
      id: string;
      full_name: string | null;
      email: string | null;
      role?: string | null;
      status?: string | null;
      is_super_admin?: boolean;
      created_at: string;
    }> | null = null;

    // 1. Try admin_get_all_users RPC
    const { data: rpcData, error: rpcError } = await supabase.rpc('admin_get_all_users');
    if (!rpcError && Array.isArray(rpcData) && rpcData.length > 0) {
      fetchedProfiles = rpcData;
    } else {
      // 2. Fallback to direct profiles table query
      const { data: tableData, error: tableError } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, status, created_at');
      if (!tableError && tableData && tableData.length > 0) {
        fetchedProfiles = tableData;
      }
    }

    if (!fetchedProfiles || fetchedProfiles.length === 0) {
      return getStoredUsers();
    }

    const currentStored = getStoredUsers();
    const syncedList: AppUser[] = [];

    for (const p of fetchedProfiles) {
      const existing = currentStored.find(
        (u) => u.id === p.id || (p.email && u.username.toLowerCase() === p.email.toLowerCase())
      );

      let computedRole: AppRole = 'SUPERVISOR';
      if (p.role === 'SUPER_ADMIN' || p.is_super_admin) {
        computedRole = 'SUPER_ADMIN';
      } else if (p.role === 'ADMIN' || p.role === 'SUPERVISOR' || p.role === 'ACCOUNTANT') {
        computedRole = p.role;
      } else if (existing?.role) {
        computedRole = existing.role;
      }

      const computedStatus: 'ACTIVE' | 'INACTIVE' =
        p.status === 'INACTIVE' || existing?.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';

      syncedList.push({
        id: p.id,
        name: p.full_name || existing?.name || 'User',
        username: p.email || existing?.username || 'user',
        password: existing?.password || '',
        role: computedRole,
        status: computedStatus,
        createdAt: p.created_at || existing?.createdAt || new Date().toISOString(),
      });
    }

    // Preserve any local accounts not yet in Supabase
    for (const u of currentStored) {
      if (!syncedList.some((s) => s.id === u.id || s.username.toLowerCase() === u.username.toLowerCase())) {
        syncedList.push(u);
      }
    }

    saveStoredUsers(syncedList);
    return syncedList;
  } catch (err) {
    console.warn('[Supabase Sync] Fetch profiles error:', err);
    return getStoredUsers();
  }
}

export async function updateUserRecord(
  id: string,
  updates: Partial<Pick<AppUser, 'name' | 'username' | 'password' | 'role' | 'status'>>
): Promise<AppUser> {
  const users = getStoredUsers();
  const index = users.findIndex((u) => u.id === id);

  if (index === -1) {
    throw new Error('User record not found.');
  }

  if (updates.username) {
    const trimmed = updates.username.trim();
    const clash = users.find(
      (u) => u.id !== id && u.username.toLowerCase() === trimmed.toLowerCase()
    );
    if (clash) {
      throw new Error(`Username "${trimmed}" is already used by another account.`);
    }
  }

  const updatedUser: AppUser = {
    ...users[index],
    ...updates,
    name: updates.name ? updates.name.trim() : users[index].name,
    username: updates.username ? updates.username.trim() : users[index].username,
  };

  users[index] = updatedUser;
  saveStoredUsers(users);

  // If updating current active session
  const current = getStoredSession();
  if (current && current.id === id) {
    saveStoredSession(updatedUser);
  }

  // Sync update to Supabase
  const supabase = createClient();
  if (supabase) {
    const targetEmail = updatedUser.username.includes('@')
      ? updatedUser.username
      : `${updatedUser.username.toLowerCase()}@kfab.in`;

    try {
      // 1. First try admin_update_user RPC (updates profiles + auth.users with password)
      const { data: rpcData, error: rpcError } = await supabase.rpc('admin_update_user', {
        target_id: id,
        new_name: updatedUser.name,
        new_email: targetEmail,
        new_password: updates.password || null,
        new_role: updatedUser.role,
        new_status: updatedUser.status,
      });

      if (!rpcError && rpcData?.id && rpcData.id !== id) {
        // If assigned a real UUID from Supabase, update the local ID
        updatedUser.id = rpcData.id;
        users[index].id = rpcData.id;
        saveStoredUsers(users);
        if (current && current.id === id) {
          saveStoredSession(updatedUser);
        }
      }

      // 2. Also execute direct profiles update fallback if target is UUID
      if (id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        await supabase.from('profiles').update({
          full_name: updatedUser.name,
          email: targetEmail,
          role: updatedUser.role,
          status: updatedUser.status,
          updated_at: new Date().toISOString(),
        }).eq('id', id);
      }

      // 3. If updating current logged in Supabase session
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session?.user?.id === id) {
        const authUpdates: { password?: string; data?: Record<string, unknown> } = {};
        if (updates.password) authUpdates.password = updates.password;
        if (updates.name) authUpdates.data = { full_name: updates.name.trim() };
        await supabase.auth.updateUser(authUpdates);
      }
    } catch (err) {
      console.warn('[Supabase Sync] Update user error:', err);
    }
  }

  return updatedUser;
}

export async function deleteUserRecord(id: string): Promise<void> {
  const users = getStoredUsers();
  const target = users.find((u) => u.id === id);

  if (!target) throw new Error('User not found.');
  if (target.role === 'SUPER_ADMIN') {
    throw new Error('System Super Administrator account cannot be deleted.');
  }

  const current = getStoredSession();
  if (current && current.id === id) {
    throw new Error('You cannot delete your own logged-in account.');
  }

  // Delete from Supabase
  const supabase = createClient();
  if (supabase) {
    try {
      // 1. Try RPC admin_delete_user
      await supabase.rpc('admin_delete_user', { target_id: id });

      // 2. Direct profiles delete fallback
      if (id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        await supabase.from('profiles').delete().eq('id', id);
      }
    } catch (err) {
      console.warn('[Supabase Sync] Delete user error:', err);
    }
  }

  const filtered = users.filter((u) => u.id !== id);
  saveStoredUsers(filtered);
}


