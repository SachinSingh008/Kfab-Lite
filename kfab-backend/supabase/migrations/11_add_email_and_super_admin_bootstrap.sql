-- ============================================================================
-- Migration 11: Add Email to Profiles & Allow Super Admin SQL Promotion
-- ============================================================================

-- 1. Add email column to profiles for easy reference & queries
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

-- 2. Populate email for any existing auth users
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id;

-- 3. Update the escalation prevention trigger so direct SQL editor (postgres)
-- or existing Super Admins can assign super admin status
CREATE OR REPLACE FUNCTION prevent_super_admin_escalation()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- If executed from client API (auth.uid() is not null) and user is not super admin, disallow
    IF auth.uid() IS NOT NULL AND NEW.is_super_admin = true AND NOT public.is_super_admin() THEN
      NEW.is_super_admin := false;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.is_super_admin IS DISTINCT FROM OLD.is_super_admin THEN
      -- Allow direct SQL (auth.uid() IS NULL) or actions by existing super admin
      IF auth.uid() IS NOT NULL AND NOT public.is_super_admin() THEN
        RAISE EXCEPTION 'Privilege escalation rejected: Only an existing Super Admin can alter system administrator privileges.';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp;

-- 4. Update auto-provisioning trigger to record email
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, is_super_admin)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1), 'User'),
    NEW.email,
    false
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp;

-- 5. Promote Sachin to Super Admin immediately if already registered in auth.users
-- Insert profile if not present yet
INSERT INTO public.profiles (id, full_name, email, is_super_admin)
SELECT id, COALESCE(raw_user_meta_data->>'full_name', 'Sachin Singh'), email, true
FROM auth.users
WHERE email = 'sachinasinghofficial@gmail.com'
ON CONFLICT (id) DO UPDATE SET
  is_super_admin = true,
  email = EXCLUDED.email;
