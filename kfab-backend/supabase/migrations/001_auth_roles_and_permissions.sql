-- ==============================================================================
-- Migration 001: Auth Roles and Permissions (RBAC Foundation)
-- Purpose: Create roles, permissions, and role-permission mappings.
-- ==============================================================================

-- 1. Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Roles Catalog Table
CREATE TABLE IF NOT EXISTS public.roles (
  name text PRIMARY KEY,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Permissions Catalog Table
CREATE TABLE IF NOT EXISTS public.permissions (
  code text PRIMARY KEY,
  module text NOT NULL DEFAULT 'USER_MANAGEMENT',
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Role-to-Permission Mapping Table
CREATE TABLE IF NOT EXISTS public.role_permissions (
  role text NOT NULL REFERENCES public.roles(name) ON DELETE CASCADE,
  permission_code text NOT NULL REFERENCES public.permissions(code) ON DELETE CASCADE,
  PRIMARY KEY (role, permission_code)
);

-- 5. Seed the Four Approved Application Roles
INSERT INTO public.roles (name, description) VALUES
  ('SUPER_ADMIN', 'Full administrative authority across all user-management, security policies, and identity access'),
  ('ADMIN', 'Delegated user administrator with RBAC-scoped user management authority'),
  ('ACCOUNT', 'Standard accounting user with no administrative privileges'),
  ('SUPERVISOR', 'Standard operational supervisor with no administrative privileges')
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description;

-- 6. Seed Authentication & User-Management Permissions
INSERT INTO public.permissions (code, module, description) VALUES
  ('users.view', 'USER_MANAGEMENT', 'View user roster, directory profiles, and account status'),
  ('users.create', 'USER_MANAGEMENT', 'Provision new users and configure initial account settings'),
  ('users.edit', 'USER_MANAGEMENT', 'Update user profile names and details'),
  ('users.delete', 'USER_MANAGEMENT', 'Permanently delete user accounts (Super Admin only)'),
  ('users.activate', 'USER_MANAGEMENT', 'Activate inactive or suspended user accounts'),
  ('users.deactivate', 'USER_MANAGEMENT', 'Deactivate active user accounts and revoke active sessions'),
  ('users.reset_password', 'USER_MANAGEMENT', 'Initiate password resets for user accounts'),
  ('users.revoke_session', 'USER_MANAGEMENT', 'Terminate active user sessions remotely'),
  ('users.assign_role', 'USER_MANAGEMENT', 'Assign and alter user security roles'),
  ('audit.view', 'SECURITY_AUDIT', 'View security and administrative audit event trails')
ON CONFLICT (code) DO UPDATE SET description = EXCLUDED.description;

-- 7. Seed Role-to-Permission Defaults
-- SUPER_ADMIN: Holds all 10 permissions
INSERT INTO public.role_permissions (role, permission_code) VALUES
  ('SUPER_ADMIN', 'users.view'),
  ('SUPER_ADMIN', 'users.create'),
  ('SUPER_ADMIN', 'users.edit'),
  ('SUPER_ADMIN', 'users.delete'),
  ('SUPER_ADMIN', 'users.activate'),
  ('SUPER_ADMIN', 'users.deactivate'),
  ('SUPER_ADMIN', 'users.reset_password'),
  ('SUPER_ADMIN', 'users.revoke_session'),
  ('SUPER_ADMIN', 'users.assign_role'),
  ('SUPER_ADMIN', 'audit.view')
ON CONFLICT (role, permission_code) DO NOTHING;

-- ADMIN: Delegated user management (cannot permanently delete or assign SUPER_ADMIN)
INSERT INTO public.role_permissions (role, permission_code) VALUES
  ('ADMIN', 'users.view'),
  ('ADMIN', 'users.create'),
  ('ADMIN', 'users.edit'),
  ('ADMIN', 'users.activate'),
  ('ADMIN', 'users.deactivate'),
  ('ADMIN', 'users.reset_password'),
  ('ADMIN', 'users.revoke_session'),
  ('ADMIN', 'audit.view')
ON CONFLICT (role, permission_code) DO NOTHING;

-- ACCOUNT & SUPERVISOR: No administrative permissions initially
