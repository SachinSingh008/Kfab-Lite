-- ============================================================================
-- Migration 09: PostgREST API Grants & Public Reference Permissions
-- ============================================================================
-- Grants schema and table access to Supabase API roles (anon, authenticated, service_role).
-- Row Level Security (RLS) remains fully active and enforces row isolation.
-- ============================================================================

-- 1. Grant Schema Usage
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- 2. Grant Table Access (RLS policies govern actual row read/write)
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;

-- 3. Grant Sequence Access
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- 4. Grant Routine / Function Execution
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

-- 5. Default Privileges for any future tables created
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;

-- 6. Make standard measurement units (KG, TON, NOS) readable globally
DROP POLICY IF EXISTS "units_select" ON public.units;
CREATE POLICY "units_select_global" ON public.units FOR SELECT USING (true);
