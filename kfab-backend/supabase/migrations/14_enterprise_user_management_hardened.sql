-- ==============================================================================
-- KFAB360 — CONSOLIDATED PRODUCTION MIGRATION 14 (FINAL REVISED)
-- TITLE: ENTERPRISE USER MANAGEMENT, RBAC INTEGRITY, RLS SECURITY HARDENING
-- SAFE TO RUN IN SUPABASE SQL EDITOR
-- ==============================================================================
-- ARCHITECTURAL GUARANTEES:
-- 1. Supabase Auth (auth.users) is the authoritative identity provider (GoTrue).
-- 2. Fastify backend (/api/v1/users) is the authoritative business/API layer.
-- 3. NO custom SQL touches auth.users or hashes passwords.
-- 4. All legacy admin RPCs that bypassed GoTrue are DROPPED.
-- 5. public.profiles RLS and triggers prevent unauthorized role/status mutation.
-- 6. public.audit_logs is strictly append-only with immutable trigger protection.
-- 7. The last active Super Admin is protected against deletion, demotion, deactivation.
-- 8. Completely idempotent: safe to execute multiple times without error.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- STEP 1: ENHANCE public.profiles WITH ERP FIELDS
-- ------------------------------------------------------------------------------

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'SUPERVISOR';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS department text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS designation text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS force_password_reset boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_login_at timestamptz;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS session_revoked_at timestamptz;

-- Ensure all existing profiles have non-null role and status
UPDATE public.profiles
SET role = 'SUPER_ADMIN'
WHERE is_super_admin = true;

UPDATE public.profiles
SET role = 'ADMIN'
WHERE is_super_admin = false AND (role IS NULL OR role = '');

UPDATE public.profiles
SET status = 'ACTIVE'
WHERE status IS NULL OR status = '';

-- Backfill email from auth.users for any profiles missing it
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND (p.email IS NULL OR p.email = '');

-- Guarantee Super Administrator account status for Sachin
UPDATE public.profiles
SET 
  is_super_admin = true,
  role = 'SUPER_ADMIN',
  status = 'ACTIVE'
WHERE lower(email) = 'sachinasinghofficial@gmail.com';

-- ------------------------------------------------------------------------------
-- STEP 2: ENHANCE public.audit_logs WITH CORRELATION & SECURITY ATTRIBUTES
-- ------------------------------------------------------------------------------

ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS target_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS user_agent text;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'SUCCESS';
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS correlation_id text;

-- ------------------------------------------------------------------------------
-- STEP 3: PERFORMANCE AND SEARCH INDEXES
-- ------------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_department ON public.profiles(department);
CREATE INDEX IF NOT EXISTS idx_profiles_employee_id ON public.profiles(employee_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target_user ON public.audit_logs(target_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_correlation_id ON public.audit_logs(correlation_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- ------------------------------------------------------------------------------
-- STEP 4: TRIGGER — SUPER ADMIN ABSOLUTE PROTECTION
-- Prevents accidental deletion, demotion, role change, or deactivation of the last active Super Admin
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.protect_last_super_admin()
RETURNS TRIGGER AS $$
DECLARE
  v_active_super_admins int;
BEGIN
  IF TG_OP = 'DELETE' AND OLD.is_super_admin = true THEN
    SELECT COUNT(*) INTO v_active_super_admins
    FROM public.profiles
    WHERE is_super_admin = true AND id != OLD.id;
    
    IF v_active_super_admins < 1 THEN
      RAISE EXCEPTION 'Action rejected: Cannot delete the last active Super Administrator in the system.';
    END IF;
  ELSIF TG_OP = 'UPDATE' AND OLD.is_super_admin = true THEN
    -- If demoting is_super_admin, changing role away from SUPER_ADMIN, or deactivating
    IF (NEW.is_super_admin = false) 
       OR (NEW.role IS DISTINCT FROM 'SUPER_ADMIN') 
       OR (NEW.status IS DISTINCT FROM 'ACTIVE' AND OLD.status = 'ACTIVE') THEN
      SELECT COUNT(*) INTO v_active_super_admins
      FROM public.profiles
      WHERE is_super_admin = true 
        AND role = 'SUPER_ADMIN' 
        AND status = 'ACTIVE' 
        AND id != OLD.id;
      
      IF v_active_super_admins < 1 THEN
        RAISE EXCEPTION 'Action rejected: Cannot demote, deactivate, or change the role of the last active Super Administrator in the system.';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp;

DROP TRIGGER IF EXISTS trg_protect_last_super_admin ON public.profiles;
CREATE TRIGGER trg_protect_last_super_admin
  BEFORE UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_last_super_admin();

-- ------------------------------------------------------------------------------
-- STEP 5: TRIGGER — HARDENED PRIVILEGE ESCALATION PREVENTION
-- Blocks non-super-admin users from altering roles, super admin status, account status, or org mappings
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.prevent_super_admin_escalation()
RETURNS TRIGGER AS $$
BEGIN
  -- If invoked from client API by an authenticated user
  IF auth.uid() IS NOT NULL AND NOT public.is_super_admin() THEN
    -- Block altering is_super_admin
    IF NEW.is_super_admin IS DISTINCT FROM OLD.is_super_admin THEN
      RAISE EXCEPTION 'Privilege escalation rejected: Only an active Super Admin can alter system administrator privileges.';
    END IF;

    -- Block altering role
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'Privilege escalation rejected: Only an active Super Admin or authorized administrator can alter user roles.';
    END IF;

    -- Block altering account status (active/inactive)
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      RAISE EXCEPTION 'Privilege escalation rejected: Only an active Super Admin or authorized administrator can alter account status.';
    END IF;

    -- Block altering organizational links
    IF NEW.department IS DISTINCT FROM OLD.department OR 
       NEW.designation IS DISTINCT FROM OLD.designation OR 
       NEW.employee_id IS DISTINCT FROM OLD.employee_id THEN
      RAISE EXCEPTION 'Privilege escalation rejected: Only an authorized administrator can alter employee or organizational mappings.';
    END IF;

    -- Block altering security control flags
    IF NEW.force_password_reset IS DISTINCT FROM OLD.force_password_reset OR
       NEW.session_revoked_at IS DISTINCT FROM OLD.session_revoked_at THEN
      RAISE EXCEPTION 'Privilege escalation rejected: Security flags can only be altered by authorized administrators.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp;

DROP TRIGGER IF EXISTS trg_prevent_super_admin_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_super_admin_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_super_admin_escalation();

-- ------------------------------------------------------------------------------
-- STEP 6: TRIGGER — AUTO-PROVISION PROFILE ON SUPABASE AUTH SIGNUP
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    full_name,
    email,
    role,
    status,
    is_super_admin
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1), 'User'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'SUPERVISOR'),
    'ACTIVE',
    false
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- ------------------------------------------------------------------------------
-- STEP 7: FIX & HARDEN ROW LEVEL SECURITY (RLS) ON public.profiles
-- ------------------------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop all legacy, conflicting, or overly permissive policies
DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own_or_colleague_or_super" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_admin_or_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_authenticated" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy_hardened" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_service_only" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy_hardened" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_authorized" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_policy_hardened" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_service_or_super" ON public.profiles;

-- 1. SELECT: Authenticated users can view the directory roster; anon CANNOT
CREATE POLICY "profiles_select_authenticated" ON public.profiles
  FOR SELECT TO authenticated, service_role
  USING (true);

-- 2. INSERT: Only service_role (Fastify API) or Super Admin (blocks arbitrary client inserts)
CREATE POLICY "profiles_insert_service_only" ON public.profiles
  FOR INSERT TO authenticated, service_role
  WITH CHECK (
    auth.role() = 'service_role' OR public.is_super_admin()
  );

-- 3. UPDATE: Users can update their own personal info (guarded by escalation trigger),
-- Super Admins and service_role can update all profiles
CREATE POLICY "profiles_update_authorized" ON public.profiles
  FOR UPDATE TO authenticated, service_role
  USING (
    auth.role() = 'service_role' 
    OR public.is_super_admin() 
    OR id = auth.uid()
  );

-- 4. DELETE: Completely blocked from normal clients. Only service_role or Super Admin.
CREATE POLICY "profiles_delete_service_or_super" ON public.profiles
  FOR DELETE TO authenticated, service_role
  USING (
    auth.role() = 'service_role'
    OR (public.is_super_admin() AND is_super_admin = false)
  );

-- ------------------------------------------------------------------------------
-- STEP 8: FIX & HARDEN ROW LEVEL SECURITY (RLS) ON public.audit_logs
-- Ensure audit_logs is strictly APPEND-ONLY & IMMUTABLE
-- ------------------------------------------------------------------------------

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_logs_select" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_insert" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_update" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_delete" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_select_policy" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_insert_policy" ON public.audit_logs;

-- Read: Super Admins, company Admins, or actors inspecting their own actions
CREATE POLICY "audit_logs_select_policy" ON public.audit_logs
  FOR SELECT TO authenticated, service_role
  USING (
    auth.role() = 'service_role' 
    OR public.is_super_admin()
    OR user_id = auth.uid()
    OR target_user_id = auth.uid()
    OR (
      company_id IN (SELECT public.get_user_company_ids())
      AND public.has_company_role(company_id, 'ADMIN')
    )
  );

-- Insert: Service role, triggers, or authenticated actors logging actions
CREATE POLICY "audit_logs_insert_policy" ON public.audit_logs
  FOR INSERT TO authenticated, service_role
  WITH CHECK (
    auth.role() = 'service_role'
    OR auth.uid() = user_id
    OR public.is_super_admin()
  );

-- IMMUTABLE AUDIT LOG TRIGGER: Strictly rejects any UPDATE or DELETE on audit_logs
CREATE OR REPLACE FUNCTION public.prevent_audit_logs_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit logs are immutable and append-only. Modification or deletion is strictly prohibited.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_audit_logs_mutation ON public.audit_logs;
CREATE TRIGGER trg_prevent_audit_logs_mutation
  BEFORE UPDATE OR DELETE ON public.audit_logs
  FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_logs_mutation();

-- ------------------------------------------------------------------------------
-- STEP 9: DROP ALL UNNECESSARY PRIVILEGED RPCs THAT DUPLICATE FASTIFY
-- No custom SQL functions may mutate auth.users or hash passwords!
-- ------------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.admin_create_user(text, text, text, text);
DROP FUNCTION IF EXISTS public.admin_create_user(text, text, text, text, text, text, uuid);
DROP FUNCTION IF EXISTS public.admin_update_user(text, text, text, text, text, text);
DROP FUNCTION IF EXISTS public.admin_update_user(text, text, text, text, text, text, text, text, uuid, boolean);
DROP FUNCTION IF EXISTS public.admin_delete_user(text);
DROP FUNCTION IF EXISTS public.admin_get_all_users();

-- ------------------------------------------------------------------------------
-- STEP 10: REVOKE DANGEROUS ROUTINE PRIVILEGES FROM anon AND PUBLIC
-- ------------------------------------------------------------------------------

-- Reverse dangerous blanket routine grants to anon from Migration 09
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON ROUTINES FROM anon, PUBLIC;
REVOKE ALL ON ALL ROUTINES IN SCHEMA public FROM anon, PUBLIC;

-- Re-grant execution strictly on safe, read-only utilities
GRANT EXECUTE ON FUNCTION public.get_business_date() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_company_ids() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_company_role(uuid, member_role_type[]) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_permission(uuid, text) TO authenticated, service_role;

-- ==============================================================================
-- END OF CONSOLIDATED MIGRATION 14 — SAFE TO RUN IN SUPABASE SQL EDITOR
-- ==============================================================================
