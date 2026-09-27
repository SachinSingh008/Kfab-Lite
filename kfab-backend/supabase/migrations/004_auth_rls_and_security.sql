-- ==============================================================================
-- Migration 004: Row Level Security (RLS) & Access Hardening
-- Purpose: Enforce tenant isolation, least privilege, and revoke anonymous routine access.
-- ==============================================================================

-- 1. Enable Row Level Security across all tables
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 2. Drop any legacy policies if present
DROP POLICY IF EXISTS "roles_select" ON public.roles;
DROP POLICY IF EXISTS "roles_modify" ON public.roles;
DROP POLICY IF EXISTS "permissions_select" ON public.permissions;
DROP POLICY IF EXISTS "permissions_modify" ON public.permissions;
DROP POLICY IF EXISTS "role_permissions_select" ON public.role_permissions;
DROP POLICY IF EXISTS "role_permissions_modify" ON public.role_permissions;
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete" ON public.profiles;
DROP POLICY IF EXISTS "audit_logs_select" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_insert" ON public.audit_logs;

-- ------------------------------------------------------------------------------
-- 3. Policies: roles, permissions, role_permissions
-- ------------------------------------------------------------------------------

-- Readable by any authenticated user for UI display and permission checking
CREATE POLICY "roles_select" ON public.roles
  FOR SELECT TO authenticated, service_role
  USING (true);

CREATE POLICY "roles_modify" ON public.roles
  FOR ALL TO authenticated, service_role
  USING (auth.role() = 'service_role' OR public.is_super_admin())
  WITH CHECK (auth.role() = 'service_role' OR public.is_super_admin());

CREATE POLICY "permissions_select" ON public.permissions
  FOR SELECT TO authenticated, service_role
  USING (true);

CREATE POLICY "permissions_modify" ON public.permissions
  FOR ALL TO authenticated, service_role
  USING (auth.role() = 'service_role' OR public.is_super_admin())
  WITH CHECK (auth.role() = 'service_role' OR public.is_super_admin());

CREATE POLICY "role_permissions_select" ON public.role_permissions
  FOR SELECT TO authenticated, service_role
  USING (true);

CREATE POLICY "role_permissions_modify" ON public.role_permissions
  FOR ALL TO authenticated, service_role
  USING (auth.role() = 'service_role' OR public.is_super_admin())
  WITH CHECK (auth.role() = 'service_role' OR public.is_super_admin());

-- ------------------------------------------------------------------------------
-- 4. Policies: public.profiles
-- ------------------------------------------------------------------------------

-- SELECT: Authenticated users can view user directory; unauthenticated anon CANNOT
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT TO authenticated, service_role
  USING (true);

-- INSERT: Only service_role (Fastify API) or Super Admin
CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT TO authenticated, service_role
  WITH CHECK (auth.role() = 'service_role' OR public.is_super_admin());

-- UPDATE: Users can update their own row (sensitive columns guarded by escalation trigger),
-- Super Admins and service_role can update all rows
CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE TO authenticated, service_role
  USING (auth.role() = 'service_role' OR public.is_super_admin() OR id = auth.uid());

-- DELETE: Strictly blocked from normal clients. Only service_role or Super Admin.
CREATE POLICY "profiles_delete" ON public.profiles
  FOR DELETE TO authenticated, service_role
  USING (auth.role() = 'service_role' OR public.is_super_admin());

-- ------------------------------------------------------------------------------
-- 5. Policies: public.audit_logs (Append-Only)
-- ------------------------------------------------------------------------------

-- SELECT: Super Admins or actors inspecting records where they are actor or target
CREATE POLICY "audit_logs_select" ON public.audit_logs
  FOR SELECT TO authenticated, service_role
  USING (
    auth.role() = 'service_role' 
    OR public.is_super_admin()
    OR actor_id = auth.uid()
    OR target_user_id = auth.uid()
  );

-- INSERT: Service role or authenticated actors logging their own action
CREATE POLICY "audit_logs_insert" ON public.audit_logs
  FOR INSERT TO authenticated, service_role
  WITH CHECK (
    auth.role() = 'service_role'
    OR auth.uid() = actor_id
    OR public.is_super_admin()
  );

-- NO UPDATE OR DELETE POLICIES EXIST FOR audit_logs

-- ------------------------------------------------------------------------------
-- 6. Granular Least-Privilege Table Grants & Revocations
-- ------------------------------------------------------------------------------

-- Step 6.1: Strip all default privileges from public schema
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON ROUTINES FROM anon, PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, PUBLIC;

-- Step 6.2: Revoke all existing blanket table and routine grants from anon and PUBLIC
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, PUBLIC;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, PUBLIC;
REVOKE ALL ON ALL ROUTINES IN SCHEMA public FROM anon, PUBLIC;
REVOKE USAGE ON SCHEMA public FROM anon;

-- Step 6.3: Revoke any existing blanket table grants from authenticated
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM authenticated;
REVOKE ALL ON ALL ROUTINES IN SCHEMA public FROM authenticated;

-- Step 6.4: Backend service_role (Fastify API) gets authoritative operational rights
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO service_role;

-- Step 6.5: Authenticated users get MINIMUM REQUIRED direct table permissions
GRANT USAGE ON SCHEMA public TO authenticated;

-- Roles & Permissions catalogs: Read-only for authenticated
GRANT SELECT ON TABLE public.roles TO authenticated;
GRANT SELECT ON TABLE public.permissions TO authenticated;
GRANT SELECT ON TABLE public.role_permissions TO authenticated;

-- Profiles: Authenticated can SELECT (roster) and UPDATE (own profile only, guarded by RLS & trigger)
-- INSERT and DELETE are strictly withheld from authenticated (handled via Fastify or auth triggers)
GRANT SELECT, UPDATE ON TABLE public.profiles TO authenticated;

-- Audit logs: Read-only for authenticated (scoped by RLS). No direct write, update, or delete.
GRANT SELECT ON TABLE public.audit_logs TO authenticated;

-- Step 6.6: Routine grants (strictly limited to safe utility functions)
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated, service_role;

