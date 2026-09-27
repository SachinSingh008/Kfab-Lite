-- ============================================================================
-- Migration 12: Admin User Management RPC Functions & Dynamic Synchronization
-- ============================================================================

-- 1. Ensure public.profiles has role and status columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'SUPERVISOR';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status text DEFAULT 'ACTIVE';

-- Update existing profiles to have role matching is_super_admin
UPDATE public.profiles
SET role = 'SUPER_ADMIN'
WHERE is_super_admin = true;

UPDATE public.profiles
SET role = 'ADMIN'
WHERE is_super_admin = false AND (role IS NULL OR role = '');

UPDATE public.profiles
SET status = 'ACTIVE'
WHERE status IS NULL OR status = '';

-- 2. Open up profiles policies so administrators can view and manage user roster
DROP POLICY IF EXISTS "profiles_select_own_or_colleague_or_super" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
CREATE POLICY "profiles_select_all" ON public.profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_admin_or_own" ON public.profiles;
CREATE POLICY "profiles_update_admin_or_own" ON public.profiles
  FOR UPDATE USING (
    id = auth.uid() OR public.is_super_admin() OR auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
CREATE POLICY "profiles_insert_policy" ON public.profiles
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "profiles_delete_policy" ON public.profiles;
CREATE POLICY "profiles_delete_policy" ON public.profiles
  FOR DELETE USING (
    is_super_admin = false
  );

-- 3. Dedicated Admin RPC: Create User (in auth.users AND public.profiles)
CREATE OR REPLACE FUNCTION public.admin_create_user(
  new_email text,
  new_password text,
  new_name text,
  new_role text DEFAULT 'SUPERVISOR'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions, pg_temp
AS $$
DECLARE
  v_user_id uuid := gen_random_uuid();
  v_is_super boolean := (new_role = 'SUPER_ADMIN');
  v_clean_email text := lower(trim(new_email));
  v_existing_id uuid;
BEGIN
  -- Check if user already exists
  SELECT id INTO v_existing_id FROM auth.users WHERE lower(email) = v_clean_email;

  IF v_existing_id IS NOT NULL THEN
    -- Update existing user instead
    PERFORM public.admin_update_user(v_existing_id::text, new_name, v_clean_email, new_password, new_role, 'ACTIVE');
    RETURN jsonb_build_object('success', true, 'id', v_existing_id, 'is_new', false);
  END IF;

  -- Insert into auth.users
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    aud,
    role,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    '00000000-0000-0000-0000-000000000000'::uuid,
    v_clean_email,
    crypt(trim(new_password), gen_salt('bf')),
    now(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    jsonb_build_object('full_name', trim(new_name), 'role', trim(new_role)),
    'authenticated',
    'authenticated',
    now(),
    now()
  );

  -- Insert into public.profiles
  INSERT INTO public.profiles (
    id,
    full_name,
    email,
    role,
    status,
    is_super_admin,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    trim(new_name),
    v_clean_email,
    trim(new_role),
    'ACTIVE',
    v_is_super,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    is_super_admin = EXCLUDED.is_super_admin,
    updated_at = now();

  RETURN jsonb_build_object('success', true, 'id', v_user_id, 'is_new', true);
END;
$$;

-- 4. Dedicated Admin RPC: Update User (profiles + auth.users with password support)
CREATE OR REPLACE FUNCTION public.admin_update_user(
  target_id text,
  new_name text DEFAULT NULL,
  new_email text DEFAULT NULL,
  new_password text DEFAULT NULL,
  new_role text DEFAULT NULL,
  new_status text DEFAULT NULL
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
  -- Resolve UUID: either directly or by searching email
  IF target_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    v_user_id := target_id::uuid;
  ELSE
    SELECT id INTO v_user_id FROM public.profiles WHERE lower(email) = lower(trim(COALESCE(new_email, target_id))) LIMIT 1;
    IF v_user_id IS NULL THEN
      SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = lower(trim(COALESCE(new_email, target_id))) LIMIT 1;
    END IF;
  END IF;

  -- If not found at all, create as new
  IF v_user_id IS NULL THEN
    RETURN public.admin_create_user(
      COALESCE(new_email, target_id),
      COALESCE(new_password, 'TempPass123!'),
      COALESCE(new_name, 'User'),
      COALESCE(new_role, 'SUPERVISOR')
    );
  END IF;

  -- Determine super admin status
  IF new_role IS NOT NULL THEN
    v_is_super := (new_role = 'SUPER_ADMIN');
  END IF;

  -- 1. Update public.profiles
  UPDATE public.profiles
  SET
    full_name = COALESCE(NULLIF(trim(new_name), ''), full_name),
    email = COALESCE(NULLIF(trim(new_email), ''), email),
    role = COALESCE(NULLIF(trim(new_role), ''), role),
    status = COALESCE(NULLIF(trim(new_status), ''), status),
    is_super_admin = COALESCE(v_is_super, is_super_admin),
    updated_at = now()
  WHERE id = v_user_id;

  IF NOT FOUND THEN
    INSERT INTO public.profiles (id, full_name, email, role, status, is_super_admin, updated_at)
    VALUES (
      v_user_id,
      COALESCE(NULLIF(trim(new_name), ''), 'User'),
      NULLIF(trim(new_email), ''),
      COALESCE(NULLIF(trim(new_role), ''), 'SUPERVISOR'),
      COALESCE(NULLIF(trim(new_status), ''), 'ACTIVE'),
      COALESCE(v_is_super, false),
      now()
    )
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      role = EXCLUDED.role,
      status = EXCLUDED.status,
      is_super_admin = EXCLUDED.is_super_admin,
      updated_at = now();
  END IF;

  -- 2. Update auth.users (email, password, raw_user_meta_data)
  IF EXISTS (SELECT 1 FROM auth.users WHERE id = v_user_id) THEN
    -- Password update
    IF new_password IS NOT NULL AND length(trim(new_password)) > 0 THEN
      UPDATE auth.users
      SET
        encrypted_password = crypt(trim(new_password), gen_salt('bf')),
        updated_at = now()
      WHERE id = v_user_id;
    END IF;

    -- Email update
    IF new_email IS NOT NULL AND length(trim(new_email)) > 0 THEN
      UPDATE auth.users
      SET
        email = lower(trim(new_email)),
        updated_at = now()
      WHERE id = v_user_id;
    END IF;

    -- Meta data update
    UPDATE auth.users
    SET
      raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object(
        'full_name', COALESCE(NULLIF(trim(new_name), ''), raw_user_meta_data->>'full_name'),
        'role', COALESCE(NULLIF(trim(new_role), ''), raw_user_meta_data->>'role')
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

-- 5. Dedicated Admin RPC: Delete User
CREATE OR REPLACE FUNCTION public.admin_delete_user(
  target_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions, pg_temp
AS $$
DECLARE
  v_user_id uuid;
  v_is_super boolean;
BEGIN
  IF target_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    v_user_id := target_id::uuid;
  ELSE
    SELECT id INTO v_user_id FROM public.profiles WHERE lower(email) = lower(trim(target_id)) LIMIT 1;
  END IF;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', true, 'message', 'User not found in database');
  END IF;

  -- Block deletion of super administrator
  SELECT is_super_admin INTO v_is_super FROM public.profiles WHERE id = v_user_id;
  IF v_is_super = true THEN
    RAISE EXCEPTION 'Super Administrator accounts cannot be deleted.';
  END IF;

  -- Cascade delete
  DELETE FROM auth.users WHERE id = v_user_id;
  DELETE FROM public.profiles WHERE id = v_user_id;

  RETURN jsonb_build_object('success', true, 'deleted_id', v_user_id);
END;
$$;

-- 6. Dedicated Admin RPC: Fetch All Users
CREATE OR REPLACE FUNCTION public.admin_get_all_users()
RETURNS TABLE (
  id uuid,
  full_name text,
  email text,
  role text,
  status text,
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
    p.is_super_admin,
    p.created_at,
    p.updated_at
  FROM public.profiles p
  LEFT JOIN auth.users u ON p.id = u.id
  ORDER BY p.is_super_admin DESC, p.created_at ASC;
$$;

-- 7. Grant execution privileges to anon, authenticated, and service_role
GRANT EXECUTE ON FUNCTION public.admin_create_user(text, text, text, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_update_user(text, text, text, text, text, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_delete_user(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_get_all_users() TO anon, authenticated, service_role;
