-- ==============================================================================
-- Migration 006: Reports & Project Progress Tracking Module
-- Purpose: Normalized project data model for dynamic stages, material items,
--          and cell-level execution tracking with least-privilege security.
-- ==============================================================================

-- 1. Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_name text NOT NULL,
  customer_name text NOT NULL,
  supervisor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text NOT NULL DEFAULT 'NOT_STARTED' CHECK (status IN ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'DELAYED', 'ON_HOLD')),
  remark text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_project_dates CHECK (end_date >= start_date)
);

-- 2. Project Stages Table (Normalized dynamic columns per project)
CREATE TABLE IF NOT EXISTS public.project_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  sequence integer NOT NULL DEFAULT 1,
  planned_completion_date date NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Project Items Table (Material & Drawing rows)
CREATE TABLE IF NOT EXISTS public.project_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  material text NOT NULL,
  drawing_number text NOT NULL,
  sequence integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Project Item Stage Status Table (Cell-level status & remarks)
CREATE TABLE IF NOT EXISTS public.project_item_stage_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_item_id uuid NOT NULL REFERENCES public.project_items(id) ON DELETE CASCADE,
  project_stage_id uuid NOT NULL REFERENCES public.project_stages(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'INCOMPLETE' CHECK (status IN ('INCOMPLETE', 'COMPLETE')),
  remark text,
  updated_by uuid REFERENCES public.profiles(id),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_item_stage UNIQUE (project_item_id, project_stage_id)
);

-- 5. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_projects_supervisor ON public.projects(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_dates ON public.projects(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_project_stages_project ON public.project_stages(project_id, sequence);
CREATE INDEX IF NOT EXISTS idx_project_items_project ON public.project_items(project_id, sequence);
CREATE INDEX IF NOT EXISTS idx_item_stage_lookup ON public.project_item_stage_status(project_item_id, project_stage_id);

-- 6. Enable Row Level Security (RLS)
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_item_stage_status ENABLE ROW LEVEL SECURITY;

-- Drop legacy policies if present
DROP POLICY IF EXISTS "projects_select" ON public.projects;
DROP POLICY IF EXISTS "projects_insert" ON public.projects;
DROP POLICY IF EXISTS "projects_update" ON public.projects;
DROP POLICY IF EXISTS "projects_delete" ON public.projects;

DROP POLICY IF EXISTS "project_stages_select" ON public.project_stages;
DROP POLICY IF EXISTS "project_stages_modify" ON public.project_stages;

DROP POLICY IF EXISTS "project_items_select" ON public.project_items;
DROP POLICY IF EXISTS "project_items_modify" ON public.project_items;

DROP POLICY IF EXISTS "project_stage_status_select" ON public.project_item_stage_status;
DROP POLICY IF EXISTS "project_stage_status_modify" ON public.project_item_stage_status;

-- 7. RLS Policies: projects
-- SELECT: Admins/SuperAdmins view all; Supervisors view only assigned projects; Account blocked
CREATE POLICY "projects_select" ON public.projects
  FOR SELECT TO authenticated, service_role
  USING (
    auth.role() = 'service_role'
    OR public.is_super_admin()
    OR supervisor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPER_ADMIN')
    )
  );

-- INSERT: Admins and SuperAdmins only
CREATE POLICY "projects_insert" ON public.projects
  FOR INSERT TO authenticated, service_role
  WITH CHECK (
    auth.role() = 'service_role'
    OR public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPER_ADMIN')
    )
  );

-- UPDATE: Admins/SuperAdmins update all; Supervisors update assigned projects
CREATE POLICY "projects_update" ON public.projects
  FOR UPDATE TO authenticated, service_role
  USING (
    auth.role() = 'service_role'
    OR public.is_super_admin()
    OR supervisor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPER_ADMIN')
    )
  );

-- DELETE: SuperAdmins and Admins only
CREATE POLICY "projects_delete" ON public.projects
  FOR DELETE TO authenticated, service_role
  USING (
    auth.role() = 'service_role'
    OR public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPER_ADMIN')
    )
  );

-- 8. RLS Policies: project_stages
CREATE POLICY "project_stages_select" ON public.project_stages
  FOR SELECT TO authenticated, service_role
  USING (
    auth.role() = 'service_role'
    OR public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_stages.project_id
        AND (p.supervisor_id = auth.uid() OR EXISTS (
          SELECT 1 FROM public.profiles pr WHERE pr.id = auth.uid() AND pr.role IN ('ADMIN', 'SUPER_ADMIN')
        ))
    )
  );

CREATE POLICY "project_stages_modify" ON public.project_stages
  FOR ALL TO authenticated, service_role
  USING (
    auth.role() = 'service_role'
    OR public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_stages.project_id
        AND (p.supervisor_id = auth.uid() OR EXISTS (
          SELECT 1 FROM public.profiles pr WHERE pr.id = auth.uid() AND pr.role IN ('ADMIN', 'SUPER_ADMIN')
        ))
    )
  );

-- 9. RLS Policies: project_items
CREATE POLICY "project_items_select" ON public.project_items
  FOR SELECT TO authenticated, service_role
  USING (
    auth.role() = 'service_role'
    OR public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_items.project_id
        AND (p.supervisor_id = auth.uid() OR EXISTS (
          SELECT 1 FROM public.profiles pr WHERE pr.id = auth.uid() AND pr.role IN ('ADMIN', 'SUPER_ADMIN')
        ))
    )
  );

CREATE POLICY "project_items_modify" ON public.project_items
  FOR ALL TO authenticated, service_role
  USING (
    auth.role() = 'service_role'
    OR public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_items.project_id
        AND (p.supervisor_id = auth.uid() OR EXISTS (
          SELECT 1 FROM public.profiles pr WHERE pr.id = auth.uid() AND pr.role IN ('ADMIN', 'SUPER_ADMIN')
        ))
    )
  );

-- 10. RLS Policies: project_item_stage_status
CREATE POLICY "project_stage_status_select" ON public.project_item_stage_status
  FOR SELECT TO authenticated, service_role
  USING (
    auth.role() = 'service_role'
    OR public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.project_items pi
      JOIN public.projects p ON p.id = pi.project_id
      WHERE pi.id = project_item_stage_status.project_item_id
        AND (p.supervisor_id = auth.uid() OR EXISTS (
          SELECT 1 FROM public.profiles pr WHERE pr.id = auth.uid() AND pr.role IN ('ADMIN', 'SUPER_ADMIN')
        ))
    )
  );

CREATE POLICY "project_stage_status_modify" ON public.project_item_stage_status
  FOR ALL TO authenticated, service_role
  USING (
    auth.role() = 'service_role'
    OR public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.project_items pi
      JOIN public.projects p ON p.id = pi.project_id
      WHERE pi.id = project_item_stage_status.project_item_id
        AND (p.supervisor_id = auth.uid() OR EXISTS (
          SELECT 1 FROM public.profiles pr WHERE pr.id = auth.uid() AND pr.role IN ('ADMIN', 'SUPER_ADMIN')
        ))
    )
  );

-- 11. Least-Privilege Grants & Revocations
GRANT USAGE ON SCHEMA public TO service_role, authenticated;

GRANT ALL ON TABLE public.projects TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.projects TO authenticated;

GRANT ALL ON TABLE public.project_stages TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.project_stages TO authenticated;

GRANT ALL ON TABLE public.project_items TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.project_items TO authenticated;

GRANT ALL ON TABLE public.project_item_stage_status TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.project_item_stage_status TO authenticated;
