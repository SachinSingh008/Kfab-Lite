-- ==============================================================================
-- Migration 005: Logs Module (User Logs & Extended System Audit Logs)
-- Purpose: Create public.user_logs and extend public.audit_logs for ERP auditability.
-- ==============================================================================

-- 1. Create User Logs Table (Manually created user activity notes)
CREATE TABLE IF NOT EXISTS public.user_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  event text NOT NULL,
  remarks text
);

-- 2. Performance Indexes for User Logs Queries
CREATE INDEX IF NOT EXISTS idx_user_logs_created_by ON public.user_logs(created_by);
CREATE INDEX IF NOT EXISTS idx_user_logs_created_at ON public.user_logs(created_at DESC);

-- 3. Extend public.audit_logs for Comprehensive System Audit Infrastructure
-- Existing authentication audit records are safely preserved with defaults.
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS module text NOT NULL DEFAULT 'SYSTEM';
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS resource_type text;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS resource_id text;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS old_values jsonb;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS new_values jsonb;

-- Indexes for System Audit Log Filtering and Searching
CREATE INDEX IF NOT EXISTS idx_audit_logs_module ON public.audit_logs(module);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON public.audit_logs(resource_type, resource_id);

-- 4. Enable Row Level Security on user_logs
ALTER TABLE public.user_logs ENABLE ROW LEVEL SECURITY;

-- Drop legacy policies if any
DROP POLICY IF EXISTS "user_logs_select" ON public.user_logs;
DROP POLICY IF EXISTS "user_logs_insert" ON public.user_logs;
DROP POLICY IF EXISTS "user_logs_update" ON public.user_logs;
DROP POLICY IF EXISTS "user_logs_delete" ON public.user_logs;

-- SELECT: Authenticated users and backend service_role can view user logs
-- Note: Specific role visibility for "All Logs" is strictly a UI presentation requirement
CREATE POLICY "user_logs_select" ON public.user_logs
  FOR SELECT TO authenticated, service_role
  USING (true);

-- INSERT: Authenticated users can insert their own logs; service_role can insert any
CREATE POLICY "user_logs_insert" ON public.user_logs
  FOR INSERT TO authenticated, service_role
  WITH CHECK (
    auth.role() = 'service_role' OR auth.uid() = created_by
  );

-- No UPDATE or DELETE policies: User logs are historical and tamper-proof

-- 5. Least-Privilege Table Grants & Revocations for user_logs
GRANT USAGE ON SCHEMA public TO service_role, authenticated;
GRANT ALL ON TABLE public.user_logs TO service_role;
GRANT SELECT, INSERT ON TABLE public.user_logs TO authenticated;
REVOKE UPDATE, DELETE, TRUNCATE ON TABLE public.user_logs FROM authenticated, anon, PUBLIC;
REVOKE ALL ON TABLE public.user_logs FROM anon, PUBLIC;
