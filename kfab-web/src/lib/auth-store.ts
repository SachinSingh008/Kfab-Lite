// ============================================================================
// KFAB BASIC / KFAB360 — Authentication & User Management Store
// ============================================================================

export type AppRole = 'SUPER_ADMIN' | 'ADMIN' | 'SUPERVISOR' | 'ACCOUNTANT';

export interface AppUser {
  id: string;
  name: string;
  username: string; // e.g. superadmin, superadmin@008, or email
  password: string;
  role: AppRole;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

const STORAGE_USERS_KEY = 'kfab_users_store_v4';
const STORAGE_SESSION_KEY = 'kfab_auth_session_v4';

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
  {
    id: 'usr-admin-002',
    name: 'Plant Admin',
    username: 'admin',
    password: 'admin123',
    role: 'ADMIN',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr-supervisor-003',
    name: 'Bay Supervisor (Imran)',
    username: 'supervisor',
    password: 'admin123',
    role: 'SUPERVISOR',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr-supervisor-005',
    name: 'Shop Supervisor (Vikram)',
    username: 'supervisor2',
    password: 'admin123',
    role: 'SUPERVISOR',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr-accountant-004',
    name: 'Accounts Auditor (Deshmukh)',
    username: 'accountant',
    password: 'admin123',
    role: 'ACCOUNTANT',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr-accountant-006',
    name: 'Billing Accountant (Sneha)',
    username: 'accountant2',
    password: 'admin123',
    role: 'ACCOUNTANT',
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
    // Guarantee all default demo accounts exist and maintain their canonical roles
    for (const defUser of DEFAULT_USERS) {
      const idx = parsed.findIndex(
        (u) => u.id === defUser.id || u.username.toLowerCase() === defUser.username.toLowerCase()
      );
      if (idx === -1) {
        parsed.push(defUser);
        modified = true;
      } else {
        // Enforce canonical role for default accounts
        if (parsed[idx].role !== defUser.role) {
          parsed[idx].role = defUser.role;
          parsed[idx].name = defUser.name;
          modified = true;
        }
      }
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

    // Self-healing: if session has an accountant username or id, force role to ACCOUNTANT
    if (
      session.username === 'accountant' ||
      session.username === 'accountant2' ||
      session.id === 'usr-accountant-004' ||
      session.id === 'usr-accountant-006'
    ) {
      if (session.role !== 'ACCOUNTANT') {
        session.role = 'ACCOUNTANT';
        localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(session));
      }
    }
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

export function authenticateUser(usernameInput: string, passwordInput: string): AppUser {
  const users = getStoredUsers();
  const trimmed = usernameInput.trim().toLowerCase();
  const passwordTrimmed = passwordInput.trim();

  // 1. Guaranteed built-in superadmin credentials
  if (
    (trimmed === 'superadmin' || trimmed === 'superadmin@008') &&
    (passwordTrimmed === 'admin123' || passwordTrimmed === 'Admin@123')
  ) {
    let superAdmin = users.find(
      (u) => u.username.toLowerCase() === 'superadmin' || u.role === 'SUPER_ADMIN'
    );
    if (!superAdmin) {
      superAdmin = { ...DEFAULT_USERS[0], password: passwordTrimmed };
      saveStoredUsers([superAdmin, ...users]);
    } else {
      superAdmin.status = 'ACTIVE';
      superAdmin.password = passwordTrimmed;
      saveStoredUsers(users);
    }
    saveStoredSession(superAdmin);
    return superAdmin;
  }

  // 2. Guaranteed admin demo credentials
  if (trimmed === 'admin' && (passwordTrimmed === 'admin123' || passwordTrimmed === 'admin')) {
    let admin = users.find(
      (u) => u.username.toLowerCase() === 'admin' && u.role === 'ADMIN'
    );
    if (!admin) {
      admin = { ...DEFAULT_USERS[1], password: passwordTrimmed };
      saveStoredUsers([...users, admin]);
    } else {
      admin.status = 'ACTIVE';
      admin.password = passwordTrimmed;
      saveStoredUsers(users);
    }
    saveStoredSession(admin);
    return admin;
  }

  // 3. Guaranteed supervisor demo credentials
  if ((trimmed === 'supervisor' || trimmed === 'supervisor2') && (passwordTrimmed === 'admin123' || passwordTrimmed === 'admin')) {
    let supervisor = DEFAULT_USERS.find((u) => u.username.toLowerCase() === trimmed);
    if (!supervisor) {
      supervisor = users.find((u) => u.username.toLowerCase() === trimmed && u.role === 'SUPERVISOR') || DEFAULT_USERS[2];
    }
    saveStoredSession(supervisor);
    return supervisor;
  }

  // 4. Guaranteed accountant demo credentials
  if ((trimmed === 'accountant' || trimmed === 'accountant2') && (passwordTrimmed === 'admin123' || passwordTrimmed === 'admin')) {
    let accountant = DEFAULT_USERS.find((u) => u.username.toLowerCase() === trimmed);
    if (!accountant) {
      accountant = users.find((u) => u.username.toLowerCase() === trimmed && u.role === 'ACCOUNTANT') ||
        DEFAULT_USERS.find((u) => u.role === 'ACCOUNTANT') ||
        DEFAULT_USERS[4];
    }
    // Guarantee that accountant always has role 'ACCOUNTANT'
    accountant = { ...accountant, role: 'ACCOUNTANT' };
    saveStoredSession(accountant);
    return accountant;
  }

  // 5. Check against all stored users in system
  const found = users.find(
    (u) => u.username.toLowerCase() === trimmed && u.password === passwordTrimmed
  );

  if (found) {
    if (found.status !== 'ACTIVE') {
      throw new Error('This account has been deactivated. Contact your Super Administrator.');
    }
    // Guard against any corrupt cached roles for standard accounts
    if (found.username.toLowerCase() === 'accountant' || found.username.toLowerCase() === 'accountant2') {
      found.role = 'ACCOUNTANT';
    }
    saveStoredSession(found);
    return found;
  }

  // 5. If users store is somehow empty, auto-register as superadmin
  if (users.length === 0) {
    const initialUser: AppUser = {
      id: `usr-${Date.now()}`,
      name: usernameInput.split('@')[0] || 'Administrator',
      username: usernameInput.trim(),
      password: passwordTrimmed,
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };
    saveStoredUsers([initialUser]);
    saveStoredSession(initialUser);
    return initialUser;
  }

  throw new Error('Invalid credentials. Use username: "superadmin" and password: "admin123".');
}

export function createUserRecord(params: {
  name: string;
  username: string;
  password: string;
  role: 'ADMIN' | 'SUPERVISOR' | 'ACCOUNTANT';
}): AppUser {
  const users = getStoredUsers();
  const trimmed = params.username.trim();

  if (!trimmed) throw new Error('Username / email is required.');
  if (!params.password) throw new Error('Password is required.');
  if (!params.name.trim()) throw new Error('Full name is required.');

  if (users.some((u) => u.username.toLowerCase() === trimmed.toLowerCase())) {
    throw new Error(`Username "${trimmed}" already exists.`);
  }

  const newUser: AppUser = {
    id: `usr-${Date.now()}`,
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

export function updateUserRecord(
  id: string,
  updates: Partial<Pick<AppUser, 'name' | 'username' | 'password' | 'role' | 'status'>>
): AppUser {
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

  return updatedUser;
}

export function deleteUserRecord(id: string): void {
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

  const filtered = users.filter((u) => u.id !== id);
  saveStoredUsers(filtered);
}
