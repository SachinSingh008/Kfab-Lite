-- ============================================================================
-- Migration 07: Chat Groups, Members & Granular Visibility Scoping
-- ============================================================================

-- 1. CHAT GROUPS TABLE
CREATE TABLE IF NOT EXISTS public.chat_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  avatar_url text,
  is_direct_chat boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_chat_groups_updated_at
  BEFORE UPDATE ON public.chat_groups
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- 2. CHAT GROUP MEMBERS TABLE
-- Supports:
--   - is_lead: group leader privilege
--   - can_view_all: if true, can view ALL messages in group (e.g. Admin, Lead)
--                   if false, can ONLY view own messages + messages targeted to him
CREATE TABLE IF NOT EXISTS public.chat_group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.chat_groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_lead boolean NOT NULL DEFAULT false,
  can_view_all boolean NOT NULL DEFAULT false,
  role_in_group text NOT NULL DEFAULT 'MEMBER', -- 'LEAD', 'MEMBER', etc.
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (group_id, user_id)
);

-- 3. CHAT MESSAGES TABLE
-- Supports:
--   - media_url: image or attachment URL
--   - media_type: 'IMAGE', 'FILE', or null
--   - caption: optional caption accompanying media
--   - target_scope:
--       'ALL': broadcast to everyone in group
--       'LEADS_AND_SENDER': sent by restricted member, visible ONLY to sender + can_view_all members
--       'ROLE': targeted to specific role (e.g. 'SUPERVISOR', 'ACCOUNTANT')
--       'USERS': targeted to specific user UUIDs in target_user_ids array
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.chat_groups(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message_text text,
  media_url text,
  media_type text CHECK (media_type IN ('IMAGE', 'FILE', 'AUDIO', 'DOCUMENT')),
  caption text,
  target_scope text NOT NULL DEFAULT 'ALL' CHECK (target_scope IN ('ALL', 'LEADS_AND_SENDER', 'ROLE', 'USERS')),
  target_role text,
  target_user_ids uuid[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_group_members_group_user ON public.chat_group_members(group_id, user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_group_created ON public.chat_messages(group_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON public.chat_messages(sender_id);

-- Enable RLS
ALTER TABLE public.chat_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- 3.5 Helper function running as SECURITY DEFINER to break RLS recursion loop
CREATE OR REPLACE FUNCTION public.get_user_chat_group_ids()
RETURNS TABLE (group_id UUID)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT cgm.group_id FROM public.chat_group_members cgm WHERE cgm.user_id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.get_user_chat_group_ids() TO anon, authenticated, service_role;

-- 4. RLS POLICIES FOR CHAT GROUPS
-- Super Admin can see all groups; members see groups they belong to
CREATE POLICY "chat_groups_select" ON public.chat_groups
  FOR SELECT USING (
    public.is_super_admin()
    OR id IN (SELECT group_id FROM public.get_user_chat_group_ids())
  );

-- Super Admin or Admin can create groups
CREATE POLICY "chat_groups_insert" ON public.chat_groups
  FOR INSERT WITH CHECK (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.company_members
      WHERE user_id = auth.uid()
        AND role = 'ADMIN'
        AND status = 'ACTIVE'
    )
  );

-- Group lead, admin, or super admin can update group
CREATE POLICY "chat_groups_update" ON public.chat_groups
  FOR UPDATE USING (
    public.is_super_admin()
    OR created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.chat_group_members
      WHERE group_id = public.chat_groups.id
        AND user_id = auth.uid()
        AND is_lead = true
    )
  );

-- 5. RLS POLICIES FOR CHAT GROUP MEMBERS
CREATE POLICY "chat_members_select" ON public.chat_group_members
  FOR SELECT USING (
    user_id = auth.uid()
    OR public.is_super_admin()
    OR group_id IN (SELECT group_id FROM public.get_user_chat_group_ids())
  );

CREATE POLICY "chat_members_manage" ON public.chat_group_members
  FOR ALL USING (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.chat_groups g
      WHERE g.id = public.chat_group_members.group_id
        AND g.created_by = auth.uid()
    )
  );

-- 6. RLS POLICIES FOR CHAT MESSAGES (GRANULAR VISIBILITY MATRIX)
CREATE POLICY "chat_messages_select" ON public.chat_messages
  FOR SELECT USING (
    -- 1. Super admin can see all messages
    public.is_super_admin()

    -- 2. Sender can always see their own messages
    OR sender_id = auth.uid()

    -- 3. Group leads and members with can_view_all = true can see all messages in their group
    OR EXISTS (
      SELECT 1 FROM public.chat_group_members cgm
      WHERE cgm.group_id = public.chat_messages.group_id
        AND cgm.user_id = auth.uid()
        AND (cgm.can_view_all = true OR cgm.is_lead = true)
    )

    -- 4. Restricted members can see broadcast messages (target_scope = 'ALL')
    OR (
      target_scope = 'ALL'
      AND EXISTS (
        SELECT 1 FROM public.chat_group_members cgm
        WHERE cgm.group_id = public.chat_messages.group_id
          AND cgm.user_id = auth.uid()
      )
    )

    -- 5. Targeted by specific role
    OR (
      target_scope = 'ROLE'
      AND EXISTS (
        SELECT 1 FROM public.company_members cm
        JOIN public.chat_groups cg ON cg.company_id = cm.company_id
        WHERE cg.id = public.chat_messages.group_id
          AND cm.user_id = auth.uid()
          AND cm.role::text = public.chat_messages.target_role
      )
    )

    -- 6. Targeted by specific user IDs array
    OR (
      target_scope = 'USERS'
      AND auth.uid() = ANY(public.chat_messages.target_user_ids)
    )
  );

-- Insert message: Must be an active member of the group
CREATE POLICY "chat_messages_insert" ON public.chat_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND (
      public.is_super_admin()
      OR EXISTS (
        SELECT 1 FROM public.chat_group_members
        WHERE group_id = public.chat_messages.group_id
          AND user_id = auth.uid()
      )
    )
  );
