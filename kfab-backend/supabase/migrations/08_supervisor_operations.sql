-- ============================================================================
-- Migration 08: Supervisor Operations — DPR, Production, Machines, QA/QC,
--               Shop Issues & Material Requisitions
-- KFAB BASIC / KFAB360 — Supabase PostgreSQL
-- ============================================================================

-- ─────────────────────────────────────────────────────────────
-- 1. DAILY PRODUCTION REPORTS  (DPR / Site Report)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.daily_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  report_code text NOT NULL,
  project text NOT NULL,
  date date NOT NULL DEFAULT get_business_date(),
  shift text NOT NULL CHECK (shift IN ('Day Shift', 'Night Shift', 'General Shift')),
  planned_work text NOT NULL,
  completed_work text,
  completion_percent numeric(5,2) NOT NULL DEFAULT 0 CHECK (completion_percent >= 0 AND completion_percent <= 100),
  worker_count integer NOT NULL DEFAULT 0,
  welder_count integer DEFAULT 0,
  fitter_count integer DEFAULT 0,
  rigger_count integer DEFAULT 0,
  machine_count integer NOT NULL DEFAULT 0,
  machine_name text,
  machine_hours numeric(5,2) DEFAULT 0,
  qa_result text NOT NULL DEFAULT 'Passed' CHECK (qa_result IN ('Passed', 'Observation', 'Failed')),
  qa_notes text,
  issue_title text,
  issue_severity text CHECK (issue_severity IN ('Low', 'Medium', 'High')),
  req_item text,
  req_urgency text CHECK (req_urgency IN ('Low', 'Medium', 'High')),
  supervisor_notes text,
  status text NOT NULL DEFAULT 'Submitted' CHECK (status IN ('Submitted', 'Approved', 'Under Review')),
  submitted_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, report_code)
);
CREATE TRIGGER trg_daily_reports_updated_at
  BEFORE UPDATE ON public.daily_reports
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE INDEX IF NOT EXISTS idx_daily_reports_comp_date ON public.daily_reports (company_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_reports_comp_project ON public.daily_reports (company_id, project);

-- ─────────────────────────────────────────────────────────────
-- 2. PRODUCTION LOGS  (Bay-Level Tonnage Output)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.production_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  log_code text NOT NULL,
  project text NOT NULL,
  bay text NOT NULL,
  planned_mt numeric(10,3) NOT NULL DEFAULT 0,
  completed_mt numeric(10,3) NOT NULL DEFAULT 0,
  scrap_mt numeric(10,3) NOT NULL DEFAULT 0,
  efficiency_percent numeric(6,2) GENERATED ALWAYS AS (
    CASE WHEN planned_mt > 0 THEN ROUND((completed_mt / planned_mt) * 100, 2) ELSE 0 END
  ) STORED,
  shift text NOT NULL CHECK (shift IN ('Day Shift', 'Night Shift', 'General Shift')),
  supervisor_name text,
  date date NOT NULL DEFAULT get_business_date(),
  notes text,
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, log_code)
);
CREATE TRIGGER trg_production_logs_updated_at
  BEFORE UPDATE ON public.production_logs
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE INDEX IF NOT EXISTS idx_production_logs_comp_date ON public.production_logs (company_id, date DESC);

-- ─────────────────────────────────────────────────────────────
-- 3. MACHINES & EQUIPMENT REGISTRY
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.machines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  machine_code text NOT NULL,
  name text NOT NULL,
  make text,
  capacity text,
  operator_name text,
  status text NOT NULL DEFAULT 'Operational' CHECK (status IN ('Operational', 'Maintenance', 'Standby', 'Breakdown')),
  running_hrs_today numeric(5,2) NOT NULL DEFAULT 0,
  next_service_date date,
  last_service_date date,
  notes text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, machine_code)
);
CREATE TRIGGER trg_machines_updated_at
  BEFORE UPDATE ON public.machines
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE INDEX IF NOT EXISTS idx_machines_comp_status ON public.machines (company_id, status);

-- ─────────────────────────────────────────────────────────────
-- 4. QA/QC INSPECTION RECORDS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.qaqc_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  record_code text NOT NULL,
  project text NOT NULL,
  component text NOT NULL,
  test_type text NOT NULL,
  standard text NOT NULL,
  inspector_name text NOT NULL,
  result text NOT NULL CHECK (result IN ('Passed', 'Observation', 'Failed')),
  inspection_date date NOT NULL DEFAULT get_business_date(),
  notes text,
  attachment_url text,
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, record_code)
);
CREATE TRIGGER trg_qaqc_records_updated_at
  BEFORE UPDATE ON public.qaqc_records
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE INDEX IF NOT EXISTS idx_qaqc_comp_date ON public.qaqc_records (company_id, inspection_date DESC);
CREATE INDEX IF NOT EXISTS idx_qaqc_comp_project ON public.qaqc_records (company_id, project);

-- ─────────────────────────────────────────────────────────────
-- 5. SHOP FLOOR ISSUES & BOTTLENECKS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.shop_issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  issue_code text NOT NULL,
  project text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('Low', 'Medium', 'High', 'Critical')),
  title text NOT NULL,
  description text,
  reported_by_name text NOT NULL,
  assigned_to_name text,
  target_date date,
  resolved_at timestamptz,
  status text NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Under Repair', 'Resolved', 'Closed')),
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, issue_code)
);
CREATE TRIGGER trg_shop_issues_updated_at
  BEFORE UPDATE ON public.shop_issues
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE INDEX IF NOT EXISTS idx_shop_issues_comp_status ON public.shop_issues (company_id, status);

-- ─────────────────────────────────────────────────────────────
-- 6. MATERIAL REQUISITIONS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.material_requisitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  req_code text NOT NULL,
  project text NOT NULL,
  item_description text NOT NULL,
  quantity text NOT NULL,
  urgency text NOT NULL CHECK (urgency IN ('Low', 'Medium', 'High', 'Critical')),
  requested_by_name text NOT NULL,
  required_by_date date,
  status text NOT NULL DEFAULT 'Pending Approval'
    CHECK (status IN ('Pending Approval', 'Approved', 'PO Placed', 'Issued', 'Rejected')),
  approved_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_at timestamptz,
  notes text,
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, req_code)
);
CREATE TRIGGER trg_material_requisitions_updated_at
  BEFORE UPDATE ON public.material_requisitions
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE INDEX IF NOT EXISTS idx_material_reqs_comp_status ON public.material_requisitions (company_id, status);
CREATE INDEX IF NOT EXISTS idx_material_reqs_comp_urgency ON public.material_requisitions (company_id, urgency);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qaqc_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_requisitions ENABLE ROW LEVEL SECURITY;

-- daily_reports
CREATE POLICY "daily_reports_select" ON public.daily_reports FOR SELECT USING (
  public.is_super_admin() OR company_id IN (SELECT public.get_user_company_ids())
);
CREATE POLICY "daily_reports_insert" ON public.daily_reports FOR INSERT WITH CHECK (
  public.is_super_admin() OR public.has_company_role(company_id, 'ADMIN', 'SUPERVISOR')
);
CREATE POLICY "daily_reports_update" ON public.daily_reports FOR UPDATE USING (
  public.is_super_admin() OR public.has_company_role(company_id, 'ADMIN', 'SUPERVISOR')
);

-- production_logs
CREATE POLICY "production_logs_select" ON public.production_logs FOR SELECT USING (
  public.is_super_admin() OR company_id IN (SELECT public.get_user_company_ids())
);
CREATE POLICY "production_logs_insert" ON public.production_logs FOR INSERT WITH CHECK (
  public.is_super_admin() OR public.has_company_role(company_id, 'ADMIN', 'SUPERVISOR')
);
CREATE POLICY "production_logs_update" ON public.production_logs FOR UPDATE USING (
  public.is_super_admin() OR public.has_company_role(company_id, 'ADMIN', 'SUPERVISOR')
);

-- machines
CREATE POLICY "machines_select" ON public.machines FOR SELECT USING (
  public.is_super_admin() OR company_id IN (SELECT public.get_user_company_ids())
);
CREATE POLICY "machines_insert" ON public.machines FOR INSERT WITH CHECK (
  public.is_super_admin() OR public.has_company_role(company_id, 'ADMIN', 'SUPERVISOR')
);
CREATE POLICY "machines_update" ON public.machines FOR UPDATE USING (
  public.is_super_admin() OR public.has_company_role(company_id, 'ADMIN', 'SUPERVISOR')
);

-- qaqc_records
CREATE POLICY "qaqc_records_select" ON public.qaqc_records FOR SELECT USING (
  public.is_super_admin() OR company_id IN (SELECT public.get_user_company_ids())
);
CREATE POLICY "qaqc_records_insert" ON public.qaqc_records FOR INSERT WITH CHECK (
  public.is_super_admin() OR public.has_company_role(company_id, 'ADMIN', 'SUPERVISOR')
);
CREATE POLICY "qaqc_records_update" ON public.qaqc_records FOR UPDATE USING (
  public.is_super_admin() OR public.has_company_role(company_id, 'ADMIN', 'SUPERVISOR')
);

-- shop_issues
CREATE POLICY "shop_issues_select" ON public.shop_issues FOR SELECT USING (
  public.is_super_admin() OR company_id IN (SELECT public.get_user_company_ids())
);
CREATE POLICY "shop_issues_insert" ON public.shop_issues FOR INSERT WITH CHECK (
  public.is_super_admin() OR public.has_company_role(company_id, 'ADMIN', 'SUPERVISOR')
);
CREATE POLICY "shop_issues_update" ON public.shop_issues FOR UPDATE USING (
  public.is_super_admin() OR public.has_company_role(company_id, 'ADMIN', 'SUPERVISOR')
);

-- material_requisitions
CREATE POLICY "material_requisitions_select" ON public.material_requisitions FOR SELECT USING (
  public.is_super_admin() OR company_id IN (SELECT public.get_user_company_ids())
);
CREATE POLICY "material_requisitions_insert" ON public.material_requisitions FOR INSERT WITH CHECK (
  public.is_super_admin() OR public.has_company_role(company_id, 'ADMIN', 'SUPERVISOR', 'STOREKEEPER')
);
CREATE POLICY "material_requisitions_update" ON public.material_requisitions FOR UPDATE USING (
  public.is_super_admin() OR public.has_company_role(company_id, 'ADMIN')
);

-- ============================================================================
-- AUDIT TRIGGERS
-- ============================================================================

CREATE TRIGGER trg_audit_daily_reports
  AFTER INSERT OR UPDATE ON public.daily_reports
  FOR EACH ROW EXECUTE FUNCTION audit_trail_trigger();

CREATE TRIGGER trg_audit_shop_issues
  AFTER INSERT OR UPDATE ON public.shop_issues
  FOR EACH ROW EXECUTE FUNCTION audit_trail_trigger();

CREATE TRIGGER trg_audit_material_requisitions
  AFTER INSERT OR UPDATE ON public.material_requisitions
  FOR EACH ROW EXECUTE FUNCTION audit_trail_trigger();
