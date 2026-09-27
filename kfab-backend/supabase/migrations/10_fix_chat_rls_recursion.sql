-- ============================================================================
-- Migration 10: Fix Infinite Recursion in Chat Group RLS Policies
-- ============================================================================
-- Replaces direct table self-references with a SECURITY DEFINER helper function.
-- This bypasses RLS during the subquery, preventing PostgreSQL error 42P17.
-- ============================================================================

-- 1. Helper function running as SECURITY DEFINER to break RLS loop
CREATE OR REPLACE FUNCTION public.get_user_chat_group_ids()
RETURNS TABLE (group_id UUID)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT cgm.group_id FROM public.chat_group_members cgm WHERE cgm.user_id = auth.uid();
$$;

-- Grant execution to API roles
GRANT EXECUTE ON FUNCTION public.get_user_chat_group_ids() TO anon, authenticated, service_role;

-- 2. Clean recreate chat_groups_select
DROP POLICY IF EXISTS "chat_groups_select" ON public.chat_groups;
CREATE POLICY "chat_groups_select" ON public.chat_groups
  FOR SELECT USING (
    public.is_super_admin()
    OR id IN (SELECT group_id FROM public.get_user_chat_group_ids())
  );

-- 3. Clean recreate chat_members_select
DROP POLICY IF EXISTS "chat_members_select" ON public.chat_group_members;
CREATE POLICY "chat_members_select" ON public.chat_group_members
  FOR SELECT USING (
    user_id = auth.uid()
    OR public.is_super_admin()
    OR group_id IN (SELECT group_id FROM public.get_user_chat_group_ids())
  );

-- 4. Clean recreate chat_members_manage
DROP POLICY IF EXISTS "chat_members_manage" ON public.chat_group_members;
CREATE POLICY "chat_members_manage" ON public.chat_group_members
  FOR ALL USING (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.chat_groups g
      WHERE g.id = public.chat_group_members.group_id
        AND g.created_by = auth.uid()
    )
  );
