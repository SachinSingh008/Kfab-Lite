-- ============================================================================
-- Migration 01: Core Extensions, Enums, Helper Functions & Profiles
-- ============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Global Company-Scoped Member Roles Enum
DO $$ BEGIN
  CREATE TYPE member_role_type AS ENUM (
    'ADMIN',
    'ACCOUNTS',
    'SUPERVISOR',
    'STOREKEEPER',
    'VIEWER',
    'ATTENDANCE_USER'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Business Date Helper (Indian Standard Time Asia/Kolkata)
CREATE OR REPLACE FUNCTION get_business_date()
RETURNS date AS $$
  SELECT (timezone('Asia/Kolkata', now()))::date;
$$ LANGUAGE sql STABLE;

-- Timestamp Auto-Update Trigger Function
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- User Profiles Table (Linked 1:1 with auth.users & System-Level Super Admin)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text,
  avatar_url text,
  is_super_admin boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- Secure Super Admin Status Checker (SECURITY DEFINER with strict search_path)
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean AS $$
  SELECT COALESCE(
    (SELECT is_super_admin FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public, auth, pg_temp;

-- Privilege Escalation Prevention Trigger on profiles
CREATE OR REPLACE FUNCTION prevent_super_admin_escalation()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.is_super_admin = true AND NOT public.is_super_admin() THEN
      NEW.is_super_admin := false;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.is_super_admin IS DISTINCT FROM OLD.is_super_admin THEN
      IF NOT public.is_super_admin() THEN
        RAISE EXCEPTION 'Privilege escalation rejected: Only an existing Super Admin can alter system administrator privileges.';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp;

CREATE TRIGGER trg_prevent_super_admin_escalation
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION prevent_super_admin_escalation();

-- Auto-provision profile on Supabase Auth user signup
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, is_super_admin)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1), 'User'),
    false
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

