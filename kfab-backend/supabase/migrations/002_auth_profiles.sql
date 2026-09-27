-- ==============================================================================
-- Migration 002: User Profiles, Identity Linkage & Super Admin Safeguards
-- Purpose: Create public.profiles 1:1 linked with auth.users, plus protection triggers.
-- ==============================================================================

-- 1. Timestamp Auto-Update Trigger Function
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. User Profiles Table (Linked 1:1 with auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'SUPERVISOR' REFERENCES public.roles(name),
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  force_password_reset boolean NOT NULL DEFAULT false,
  last_login_at timestamptz,
  session_revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Indexes for Search, Filter, and Case-Insensitive Email Uniqueness
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_email_lower ON public.profiles(lower(email));

-- 4. Auto-update updated_at on profile modification
DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

-- 5. Helper Function: Check if Calling User is Active SUPER_ADMIN
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean AS $$
  SELECT COALESCE(
    (SELECT (role = 'SUPER_ADMIN') FROM public.profiles WHERE id = auth.uid() AND status = 'ACTIVE'),
    false
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public, auth, pg_temp;

-- 6. Trigger Function: Super Admin Absolute Protection
-- Prevents accidental deletion, demotion, or deactivation of the last active SUPER_ADMIN
CREATE OR REPLACE FUNCTION public.protect_last_super_admin()
RETURNS TRIGGER AS $$
DECLARE
  v_active_super_admins int;
BEGIN
  IF TG_OP = 'DELETE' AND OLD.role = 'SUPER_ADMIN' THEN
    SELECT COUNT(*) INTO v_active_super_admins
    FROM public.profiles
    WHERE role = 'SUPER_ADMIN' AND status = 'ACTIVE' AND id != OLD.id;
    
    IF v_active_super_admins < 1 THEN
      RAISE EXCEPTION 'Action rejected: Cannot delete the last active SUPER_ADMIN in the system.';
    END IF;
  ELSIF TG_OP = 'UPDATE' AND OLD.role = 'SUPER_ADMIN' THEN
    -- If demoting away from SUPER_ADMIN or setting status to INACTIVE
    IF (NEW.role IS DISTINCT FROM 'SUPER_ADMIN') 
       OR (NEW.status IS DISTINCT FROM 'ACTIVE' AND OLD.status = 'ACTIVE') THEN
      SELECT COUNT(*) INTO v_active_super_admins
      FROM public.profiles
      WHERE role = 'SUPER_ADMIN' AND status = 'ACTIVE' AND id != OLD.id;
      
      IF v_active_super_admins < 1 THEN
        RAISE EXCEPTION 'Action rejected: Cannot demote or deactivate the last active SUPER_ADMIN in the system.';
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

-- 7. Trigger Function: Privilege Escalation Prevention
-- Blocks non-super-admin users from altering roles, account status, or security flags
CREATE OR REPLACE FUNCTION public.prevent_super_admin_escalation()
RETURNS TRIGGER AS $$
BEGIN
  -- If invoked from client API by an authenticated user
  IF auth.uid() IS NOT NULL AND NOT public.is_super_admin() THEN
    -- Block altering role
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'Privilege escalation rejected: Only an active SUPER_ADMIN can alter user roles.';
    END IF;

    -- Block altering account status (active/inactive)
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      RAISE EXCEPTION 'Privilege escalation rejected: Only an authorized administrator can alter account status.';
    END IF;

    -- Block altering security flags
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

-- 8. Trigger Function: Auto-provision profile on Supabase Auth user signup
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    full_name,
    email,
    role,
    status
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1), 'User'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'SUPERVISOR'),
    'ACTIVE'
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

-- 9. Promote Sachin to initial SUPER_ADMIN if existing in auth.users
INSERT INTO public.profiles (id, full_name, email, role, status)
SELECT 
  id, 
  COALESCE(raw_user_meta_data->>'full_name', 'Sachin Singh'), 
  email, 
  'SUPER_ADMIN', 
  'ACTIVE'
FROM auth.users
WHERE lower(email) = 'sachinasinghofficial@gmail.com'
ON CONFLICT (id) DO UPDATE SET
  role = 'SUPER_ADMIN',
  status = 'ACTIVE',
  email = EXCLUDED.email;
