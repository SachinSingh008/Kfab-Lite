-- ============================================================================
-- Migration 05: Append-Only Audit Logging & Strategic High-Performance Indexes
-- ============================================================================

-- Audit Logs Table (Strict Append-Only Security Log)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  module text NOT NULL,
  action text NOT NULL,
  record_id uuid,
  old_data jsonb,
  new_data jsonb,
  reason text,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Generic Audit Logger Trigger Function (SECURITY DEFINER with clean search_path)
CREATE OR REPLACE FUNCTION audit_trail_trigger()
RETURNS TRIGGER AS $$
DECLARE
  v_company_id uuid;
  v_user_id uuid := auth.uid();
  v_rec_id uuid;
  v_old jsonb := NULL;
  v_new jsonb := NULL;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_rec_id := OLD.id;
    v_old := to_jsonb(OLD);
    BEGIN v_company_id := OLD.company_id; EXCEPTION WHEN OTHERS THEN v_company_id := NULL; END;
  ELSIF TG_OP = 'UPDATE' THEN
    v_rec_id := NEW.id;
    v_old := to_jsonb(OLD);
    v_new := to_jsonb(NEW);
    BEGIN v_company_id := NEW.company_id; EXCEPTION WHEN OTHERS THEN v_company_id := NULL; END;
  ELSIF TG_OP = 'INSERT' THEN
    v_rec_id := NEW.id;
    v_new := to_jsonb(NEW);
    BEGIN v_company_id := NEW.company_id; EXCEPTION WHEN OTHERS THEN v_company_id := NULL; END;
  END IF;

  INSERT INTO public.audit_logs (
    company_id, user_id, module, action, record_id, old_data, new_data
  ) VALUES (
    v_company_id, v_user_id, TG_TABLE_NAME, TG_OP, v_rec_id, v_old, v_new
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp;

-- Attach Audit Triggers to Core Operational Tables
CREATE TRIGGER trg_audit_employees
  AFTER INSERT OR UPDATE OR DELETE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION audit_trail_trigger();

CREATE TRIGGER trg_audit_attendance
  AFTER INSERT OR UPDATE OR DELETE ON public.attendance
  FOR EACH ROW EXECUTE FUNCTION audit_trail_trigger();

CREATE TRIGGER trg_audit_materials
  AFTER INSERT OR UPDATE OR DELETE ON public.materials
  FOR EACH ROW EXECUTE FUNCTION audit_trail_trigger();

CREATE TRIGGER trg_audit_suppliers
  AFTER INSERT OR UPDATE OR DELETE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION audit_trail_trigger();

CREATE TRIGGER trg_audit_stock_inward
  AFTER INSERT OR UPDATE OR DELETE ON public.stock_inward
  FOR EACH ROW EXECUTE FUNCTION audit_trail_trigger();

CREATE TRIGGER trg_audit_stock_outward
  AFTER INSERT OR UPDATE OR DELETE ON public.stock_outward
  FOR EACH ROW EXECUTE FUNCTION audit_trail_trigger();

CREATE TRIGGER trg_audit_stock_usage
  AFTER INSERT OR UPDATE OR DELETE ON public.stock_usage
  FOR EACH ROW EXECUTE FUNCTION audit_trail_trigger();

CREATE TRIGGER trg_audit_company_members
  AFTER INSERT OR UPDATE OR DELETE ON public.company_members
  FOR EACH ROW EXECUTE FUNCTION audit_trail_trigger();

CREATE TRIGGER trg_audit_correction_requests
  AFTER UPDATE ON public.correction_requests
  FOR EACH ROW EXECUTE FUNCTION audit_trail_trigger();

-- Strategic High-Performance Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_super_admin ON public.profiles (is_super_admin) WHERE is_super_admin = true;
CREATE INDEX IF NOT EXISTS idx_company_members_lookup ON public.company_members (user_id, company_id, status);
CREATE INDEX IF NOT EXISTS idx_employees_comp_status ON public.employees (company_id, status);
CREATE INDEX IF NOT EXISTS idx_employee_assignments_active ON public.employee_assignments (supervisor_id, company_id) WHERE unassigned_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_attendance_comp_date ON public.attendance (company_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_comp_date_status ON public.attendance (company_id, date, status);
CREATE INDEX IF NOT EXISTS idx_attendance_emp_date ON public.attendance (employee_id, date);
CREATE INDEX IF NOT EXISTS idx_materials_comp_status ON public.materials (company_id, status);
CREATE INDEX IF NOT EXISTS idx_suppliers_comp_status ON public.suppliers (company_id, status);
CREATE INDEX IF NOT EXISTS idx_stock_inward_active ON public.stock_inward (company_id, material_id, date) WHERE status = 'ACTIVE';
CREATE INDEX IF NOT EXISTS idx_stock_outward_active ON public.stock_outward (company_id, material_id, date) WHERE status = 'ACTIVE';
CREATE INDEX IF NOT EXISTS idx_stock_usage_active ON public.stock_usage (company_id, material_id, date) WHERE status = 'ACTIVE';
CREATE INDEX IF NOT EXISTS idx_correction_requests_comp ON public.correction_requests (company_id, status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_comp_created ON public.audit_logs (company_id, created_at DESC);
