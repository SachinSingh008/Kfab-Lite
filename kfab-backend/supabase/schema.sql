-- ==============================================================================
-- KFAB BASIC — MASTER DATABASE SCHEMA LOADER
-- ==============================================================================
-- Architecture: Modular Supabase PostgreSQL Migrations
-- All migrations are located in: kfab-backend/supabase/migrations/
-- Each file is modularized to remain strictly below 700 lines.
--
-- Execution Order:
--   1. 01_core_and_auth.sql            - Extensions, role enums, profiles, super-admin hierarchy
--   2. 02_companies_and_members.sql    - Multi-tenant company isolation, membership, RBAC permissions
--   3. 03_workforce_and_attendance.sql - Employee rosters, active assignments, daily attendance, date locks
--   4. 04_inventory_and_stock.sql      - Unit master, materials, stock ledgers (in/out/usage), atomic locks
--   5. 05_audit_and_indexes.sql        - Append-only audit trail triggers & composite performance indexes
--   6. 06_row_level_security.sql       - Granular RLS policies enforcing tenant isolation across all tables
--
-- Usage with psql / Supabase CLI:
--   psql -f supabase/schema.sql
-- Or apply migrations in numerical sequence directly in the Supabase SQL Editor.
-- ==============================================================================

\ir migrations/01_core_and_auth.sql
\ir migrations/02_companies_and_members.sql
\ir migrations/03_workforce_and_attendance.sql
\ir migrations/04_inventory_and_stock.sql
\ir migrations/05_audit_and_indexes.sql
\ir migrations/06_row_level_security.sql
