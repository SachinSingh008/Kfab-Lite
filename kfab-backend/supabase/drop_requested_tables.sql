-- ==============================================================================
-- KFAB360 DATABASE CLEANUP SCRIPT (RUN IN SUPABASE SQL EDITOR)
-- Purpose: Safely drop the 10 specified tables, their indexes, constraints,
--          triggers, and all associated mock/test records.
--
-- Target Tables Dropped:
--   1. public.project_item_stage_status
--   2. public.project_items
--   3. public.project_stages
--   4. public.projects
--   5. public.inventory_issues
--   6. public.inventory_transactions
--   7. public.inventory_items
--   8. public.attendance_records
--   9. public.employees
--  10. public.companies
--
-- PRESERVED SYSTEM & CORE TABLES (NOT TOUCHED):
--   - auth.users (Supabase User Credentials)
--   - public.profiles (User Profiles & Staff Accounts)
--   - public.roles (Role Hierarchy: SUPER_ADMIN, ADMIN, etc.)
--   - public.permissions (Granular Permissions)
--   - public.role_permissions (RBAC Mappings)
--   - public.audit_logs (Security Audit Trail)
--   - public.user_logs (User Activity Log with 7-day retention)
-- ==============================================================================

-- 1. Drop Projects & Progress Tracking Tables (in dependency order)
DROP TABLE IF EXISTS public.project_item_stage_status CASCADE;
DROP TABLE IF EXISTS public.project_items CASCADE;
DROP TABLE IF EXISTS public.project_stages CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;

-- 2. Drop Inventory & Warehouse Management Tables
DROP TABLE IF EXISTS public.inventory_issues CASCADE;
DROP TABLE IF EXISTS public.inventory_transactions CASCADE;
DROP TABLE IF EXISTS public.inventory_items CASCADE;

-- 3. Drop Personnel & Attendance Tables
DROP TABLE IF EXISTS public.attendance_records CASCADE;
DROP TABLE IF EXISTS public.employees CASCADE;
DROP TABLE IF EXISTS public.companies CASCADE;

-- 4. Clean up any lingering module-specific triggers
DROP TRIGGER IF EXISTS trg_companies_updated_at ON public.companies;
DROP TRIGGER IF EXISTS trg_employees_updated_at ON public.employees;
DROP TRIGGER IF EXISTS trg_inventory_items_updated_at ON public.inventory_items;
DROP TRIGGER IF EXISTS trg_projects_updated_at ON public.projects;

-- 5. Notice output for Supabase SQL Editor
DO $$
BEGIN
  RAISE NOTICE 'KFAB360 Table Drop Complete: The 10 specified tables and all their data have been removed. Core auth, profiles, roles, and logs remain active.';
END $$;
