-- ==============================================================================
-- KFAB BASIC — MASTER DATABASE RESET & CLEAN SLATE SCRIPT
-- ==============================================================================
-- Instructions:
-- 1. Open your Supabase Dashboard: https://supabase.com/dashboard/project/rpskidjmetjhadghpntl
-- 2. Navigate to "SQL Editor" on the left menu.
-- 3. Click "+ New Query".
-- 4. Paste this script and click "Run".
-- ==============================================================================

BEGIN;

-- ==============================================================================
-- OPTION 1: TRUNCATE ALL DATA (CLEAN SLATE — TABLES REMAIN READY FOR USE)
-- Empties every table, resets all autoincrement identity sequences, and removes
-- all fake records, mock materials, test workers, and dummy transactions.
-- ==============================================================================

-- 1. Operations & Ledgers (Child tables first)
TRUNCATE TABLE IF EXISTS public.challan_items CASCADE;
TRUNCATE TABLE IF EXISTS public.challans CASCADE;
TRUNCATE TABLE IF EXISTS public.stock_ledger_entries CASCADE;

-- 2. Workforce & Attendance
TRUNCATE TABLE IF EXISTS public.daily_muster_attendance CASCADE;
TRUNCATE TABLE IF EXISTS public.attendance_locks CASCADE;
TRUNCATE TABLE IF EXISTS public.employees CASCADE;
TRUNCATE TABLE IF EXISTS public.shifts CASCADE;
TRUNCATE TABLE IF EXISTS public.designations CASCADE;
TRUNCATE TABLE IF EXISTS public.departments CASCADE;

-- 3. Materials & Catalogs
TRUNCATE TABLE IF EXISTS public.materials CASCADE;
TRUNCATE TABLE IF EXISTS public.suppliers CASCADE;
TRUNCATE TABLE IF EXISTS public.units CASCADE;

-- 4. Audit & Company Tenancy
TRUNCATE TABLE IF EXISTS public.audit_logs CASCADE;
TRUNCATE TABLE IF EXISTS public.company_members CASCADE;
TRUNCATE TABLE IF EXISTS public.companies CASCADE;

-- 5. User Profiles
TRUNCATE TABLE IF EXISTS public.profiles CASCADE;

-- 6. (Optional) Wipe Auth Users if you want to remove test users from Supabase Auth:
-- Uncomment the following line if you want to delete all registered users from auth:
-- DELETE FROM auth.users;

COMMIT;

-- Verify all tables are now clean and empty:
SELECT 
  schemaname, 
  relname as table_name, 
  n_live_tup as active_row_count
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY relname;

-- ==============================================================================
-- OPTION 2: FULL OBJECT DROP (ONLY USE IF REBUILDING SCHEMA FROM ZERO)
-- If you want to drop ALL tables, triggers, and enums completely, uncomment below:
-- ==============================================================================
/*
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO anon;
GRANT ALL ON SCHEMA public TO authenticated;
GRANT ALL ON SCHEMA public TO service_role;
*/
