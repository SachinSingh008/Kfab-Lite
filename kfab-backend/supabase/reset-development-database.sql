-- ==============================================================================
-- WARNING — DEVELOPMENT DATABASE ONLY
-- DESTRUCTIVE OPERATION: KFAB360 APPLICATION CLEANUP
-- ==============================================================================
-- This script safely removes ONLY KFab360 application-level database objects.
--
-- PRESERVED OBJECTS (NEVER DROPPED):
-- - auth schema & auth.users (Supabase GoTrue identities and credentials)
-- - storage schema & extensions (uuid-ossp, pgcrypto)
-- - Supabase system & internal schemas (_realtime, vault, extensions)
-- ==============================================================================

-- 1. Drop auth.users triggers created by KFab360
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Drop all KFab360 application views
DROP VIEW IF EXISTS public.v_daily_attendance_summary CASCADE;
DROP VIEW IF EXISTS public.v_material_stock CASCADE;

-- 3. Drop all old ERP & application tables (CASCADE cleans up foreign keys & policies)
DROP TABLE IF EXISTS public.daily_report_progress CASCADE;
DROP TABLE IF EXISTS public.daily_report_materials CASCADE;
DROP TABLE IF EXISTS public.daily_report_workforce CASCADE;
DROP TABLE IF EXISTS public.daily_reports CASCADE;
DROP TABLE IF EXISTS public.chat_messages CASCADE;
DROP TABLE IF EXISTS public.chat_members CASCADE;
DROP TABLE IF EXISTS public.chat_channels CASCADE;
DROP TABLE IF EXISTS public.correction_requests CASCADE;
DROP TABLE IF EXISTS public.stock_usage CASCADE;
DROP TABLE IF EXISTS public.stock_outward CASCADE;
DROP TABLE IF EXISTS public.stock_inward CASCADE;
DROP TABLE IF EXISTS public.suppliers CASCADE;
DROP TABLE IF EXISTS public.materials CASCADE;
DROP TABLE IF EXISTS public.units CASCADE;
DROP TABLE IF EXISTS public.attendance CASCADE;
DROP TABLE IF EXISTS public.employee_assignments CASCADE;
DROP TABLE IF EXISTS public.employees CASCADE;
DROP TABLE IF EXISTS public.company_members CASCADE;
DROP TABLE IF EXISTS public.companies CASCADE;
DROP TABLE IF EXISTS public.role_permissions CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.permissions CASCADE;
DROP TABLE IF EXISTS public.roles CASCADE;

-- 4. Drop all custom KFab360 functions
DROP FUNCTION IF EXISTS public.admin_create_user(text, text, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.admin_create_user(text, text, text, text, text, text, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.admin_update_user(text, text, text, text, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.admin_update_user(text, text, text, text, text, text, text, text, uuid, boolean) CASCADE;
DROP FUNCTION IF EXISTS public.admin_delete_user(text) CASCADE;
DROP FUNCTION IF EXISTS public.admin_get_all_users() CASCADE;
DROP FUNCTION IF EXISTS public.protect_last_super_admin() CASCADE;
DROP FUNCTION IF EXISTS public.prevent_super_admin_escalation() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_auth_user() CASCADE;
DROP FUNCTION IF EXISTS public.prevent_audit_logs_mutation() CASCADE;
DROP FUNCTION IF EXISTS public.audit_trail_trigger() CASCADE;
DROP FUNCTION IF EXISTS public.trigger_set_timestamp() CASCADE;
DROP FUNCTION IF EXISTS public.get_business_date() CASCADE;
DROP FUNCTION IF EXISTS public.is_super_admin() CASCADE;
DROP FUNCTION IF EXISTS public.get_user_company_ids() CASCADE;
DROP FUNCTION IF EXISTS public.has_company_role(uuid, member_role_type[]) CASCADE;
DROP FUNCTION IF EXISTS public.has_permission(uuid, text) CASCADE;

-- 5. Drop old custom types / enums
DROP TYPE IF EXISTS member_role_type CASCADE;
DROP TYPE IF EXISTS daily_report_status_type CASCADE;
DROP TYPE IF EXISTS app_role_type CASCADE;

-- Confirmation output
DO $$
BEGIN
  RAISE NOTICE 'KFab360 application cleanup complete. auth.users and Supabase system schemas preserved.';
END $$;
