-- ==============================================================================
-- Migration 009: Drop 10 Requested Tables and Clean All Mock Data
-- Purpose: Drop all prototype, demo, and unneeded tables from the database.
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

DO $$
BEGIN
  RAISE NOTICE 'KFAB360 Table Cleanup Complete: All prototype/mock tables dropped successfully.';
END $$;
