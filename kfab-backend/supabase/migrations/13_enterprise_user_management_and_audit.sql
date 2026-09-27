-- ============================================================================
-- Migration 13: Enterprise User Management, Audit Hardening & Super Admin Safeguards
-- ============================================================================

-- 1. Enhance public.profiles with enterprise ERP fields
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS department text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS designation text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS force_password_reset boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_login_at timestamptz;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS session_revoked_at timestamptz;

-- 2. Enhance public.audit_logs with security correlation attributes
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS target_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS user_agent text;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'SUCCESS';
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS correlation_id text;

-- 3. Super Admin Absolute Protection Trigger
-- Prevents accidental deletion, demotion, or deactivation of the last active Super Admin
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
    -- If demoting is_super_admin or deactivating
    IF (NEW.is_super_admin = false) OR (NEW.status = 'INACTIVE' AND OLD.status = 'ACTIVE') THEN
      SELECT COUNT(*) INTO v_active_super_admins
      FROM public.profiles
      WHERE is_super_admin = true AND status = 'ACTIVE' AND id != OLD.id;
      
      IF v_active_super_admins < 1 THEN
        RAISE EXCEPTION 'Action rejected: Cannot demote or deactivate the last active Super Administrator in the system.';
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

-- 4. Update admin RPC function to return enhanced ERP user profile fields
CREATE OR REPLACE FUNCTION public.admin_get_all_users()
RETURNS TABLE (
  id uuid,
  full_name text,
  email text,
  role text,
  status text,
  department text,
  designation text,
  employee_id uuid,
  force_password_reset boolean,
  last_login_at timestamptz,
  session_revoked_at timestamptz,
  is_super_admin boolean,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
  SELECT 
    p.id,
    p.full_name,
    COALESCE(p.email, u.email) AS email,
    COALESCE(p.role, CASE WHEN p.is_super_admin THEN 'SUPER_ADMIN' ELSE 'ADMIN' END) AS role,
    COALESCE(p.status, 'ACTIVE') AS status,
    p.department,
    p.designation,
    p.employee_id,
    p.force_password_reset,
    p.last_login_at,
    p.session_revoked_at,
    p.is_super_admin,
    p.created_at,
    p.updated_at
  FROM public.profiles p
  LEFT JOIN auth.users u ON p.id = u.id
  ORDER BY p.is_super_admin DESC, p.created_at ASC;
$$;

-- 5. Update admin update RPC with ERP fields
CREATE OR REPLACE FUNCTION public.admin_update_user(
  target_id text,
  new_name text DEFAULT NULL,
  new_email text DEFAULT NULL,
  new_password text DEFAULT NULL,
  new_role text DEFAULT NULL,
  new_status text DEFAULT NULL,
  new_department text DEFAULT NULL,
  new_designation text DEFAULT NULL,
  new_employee_id uuid DEFAULT NULL,
  new_force_password_reset boolean DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions, pg_temp
AS $$
DECLARE
  v_user_id uuid;
  v_is_super boolean;
  v_updated_profile jsonb;
BEGIN
  IF target_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    v_user_id := target_id::uuid;
  ELSE
    SELECT id INTO v_user_id FROM public.profiles WHERE lower(email) = lower(trim(COALESCE(new_email, target_id))) LIMIT 1;
    IF v_user_id IS NULL THEN
      SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = lower(trim(COALESCE(new_email, target_id))) LIMIT 1;
    END IF;
  END IF;

  IF v_user_id IS NULL THEN
    RETURN public.admin_create_user(
      COALESCE(new_email, target_id),
      COALESCE(new_password, 'TempPass123!'),
      COALESCE(new_name, 'User'),
      COALESCE(new_role, 'SUPERVISOR')
    );
  END IF;

  IF new_role IS NOT NULL THEN
    v_is_super := (new_role = 'SUPER_ADMIN');
  END IF;

  UPDATE public.profiles
  SET
    full_name = COALESCE(NULLIF(trim(new_name), ''), full_name),
    email = COALESCE(NULLIF(trim(new_email), ''), email),
    role = COALESCE(NULLIF(trim(new_role), ''), role),
    status = COALESCE(NULLIF(trim(new_status), ''), status),
    department = COALESCE(new_department, department),
    designation = COALESCE(new_designation, designation),
    employee_id = COALESCE(new_employee_id, employee_id),
    force_password_reset = COALESCE(new_force_password_reset, force_password_reset),
    is_super_admin = COALESCE(v_is_super, is_super_admin),
    updated_at = now()
  WHERE id = v_user_id;

  IF EXISTS (SELECT 1 FROM auth.users WHERE id = v_user_id) THEN
    IF new_password IS NOT NULL AND length(trim(new_password)) > 0 THEN
      UPDATE auth.users
      SET
        encrypted_password = crypt(trim(new_password), gen_salt('bf')),
        updated_at = now()
      WHERE id = v_user_id;
    END IF;

    IF new_email IS NOT NULL AND length(trim(new_email)) > 0 THEN
      UPDATE auth.users
      SET
        email = lower(trim(new_email)),
        updated_at = now()
      WHERE id = v_user_id;
    END IF;

    UPDATE auth.users
    SET
      raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object(
        'full_name', COALESCE(NULLIF(trim(new_name), ''), raw_user_meta_data->>'full_name'),
        'role', COALESCE(NULLIF(trim(new_role), ''), raw_user_meta_data->>'role'),
        'department', COALESCE(new_department, raw_user_meta_data->>'department')
      ),
      updated_at = now()
    WHERE id = v_user_id;
  END IF;

  SELECT to_jsonb(p) INTO v_updated_profile
  FROM public.profiles p
  WHERE p.id = v_user_id;

  RETURN jsonb_build_object('success', true, 'profile', v_updated_profile, 'id', v_user_id);
END;
$$;

-- 6. Grant privileges
GRANT EXECUTE ON FUNCTION public.admin_get_all_users() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_update_user(text, text, text, text, text, text, text, text, uuid, boolean) TO anon, authenticated, service_role;
