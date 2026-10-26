-- ==============================================================================
-- KFAB360 DATABASE CLEANUP SCRIPT (RUN IN SUPABASE SQL EDITOR)
-- Purpose: Drop all prototype, demo, and unneeded tables from the database.
--
-- TARGET TABLES DROPPED:
--   - public.project_item_stage_status
--   - public.project_items
--   - public.project_stages
--   - public.projects
--   - public.inventory_issues
--   - public.inventory_transactions
--   - public.inventory_items
--   - public.attendance_records
--   - public.employees
--   - public.companies
--   - public.machines
--   - public.material_requisitions
--   - public.production_logs
--   - public.qaqc_records
--   - public.shop_issues
--
-- PRESERVED ESSENTIAL CORE TABLES (NOT DROPPED):
--   - auth.users (Supabase User Accounts & Credentials)
--   - public.profiles (Staff Profiles & Roles)
--   - public.roles (Role Hierarchy: SUPER_ADMIN, ADMIN, etc.)
--   - public.permissions (Granular Permissions)
--   - public.role_permissions (RBAC Mappings)
--   - public.audit_logs (Security Audit Trail)
--   - public.user_logs (User Activity Log with 7-day retention)
--   - public.chat_groups & public.chat_group_members (Team Channels & Chat)
-- ==============================================================================

-- 1. Projects & Progress Tracking Module
DROP TABLE IF EXISTS public.project_item_stage_status CASCADE;
DROP TABLE IF EXISTS public.project_items CASCADE;
DROP TABLE IF EXISTS public.project_stages CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;

-- 2. Inventory & Warehouse Management Module
DROP TABLE IF EXISTS public.inventory_issues CASCADE;
DROP TABLE IF EXISTS public.inventory_transactions CASCADE;
DROP TABLE IF EXISTS public.inventory_items CASCADE;

-- 3. Personnel & Attendance Module
DROP TABLE IF EXISTS public.attendance_records CASCADE;
DROP TABLE IF EXISTS public.employees CASCADE;
DROP TABLE IF EXISTS public.companies CASCADE;

-- 4. Shop Floor Prototype & Mock Data Tables (Shown in Table Editor)
DROP TABLE IF EXISTS public.machines CASCADE;
DROP TABLE IF EXISTS public.material_requisitions CASCADE;
DROP TABLE IF EXISTS public.production_logs CASCADE;
DROP TABLE IF EXISTS public.qaqc_records CASCADE;
DROP TABLE IF EXISTS public.shop_issues CASCADE;

-- (Note: CASCADE automatically removes all dependent triggers, foreign keys, indexes, and RLS policies)

DO $$
BEGIN
  RAISE NOTICE 'KFAB360 Table Cleanup Complete: All prototype/mock tables dropped successfully.';
END $$;
