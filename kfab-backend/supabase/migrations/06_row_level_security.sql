-- ============================================================================
-- Migration 06: Row Level Security (RLS) Policies & Tenant Isolation
-- ============================================================================

-- Enable RLS across all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_inward ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_outward ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.correction_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. PROFILES POLICIES
CREATE POLICY "profiles_select_own_or_colleague_or_super" ON public.profiles
  FOR SELECT USING (
    id = auth.uid()
    OR public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.company_members cm1
      JOIN public.company_members cm2 ON cm1.company_id = cm2.company_id
      WHERE cm1.user_id = auth.uid() AND cm2.user_id = public.profiles.id
    )
  );

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (
    id = auth.uid() OR public.is_super_admin()
  );

-- 2. COMPANIES POLICIES
CREATE POLICY "companies_select" ON public.companies
  FOR SELECT USING (
    public.is_super_admin()
    OR id IN (SELECT public.get_user_company_ids())
  );

CREATE POLICY "companies_insert_super_admin" ON public.companies
  FOR INSERT WITH CHECK (
    public.is_super_admin()
  );

CREATE POLICY "companies_update" ON public.companies
  FOR UPDATE USING (
    public.is_super_admin()
    OR public.has_company_role(id, 'ADMIN')
  );

CREATE POLICY "companies_delete_super_admin" ON public.companies
  FOR DELETE USING (
    public.is_super_admin()
  );

-- 3. COMPANY MEMBERS POLICIES
CREATE POLICY "members_select" ON public.company_members
  FOR SELECT USING (
    public.is_super_admin()
    OR company_id IN (SELECT public.get_user_company_ids())
  );

CREATE POLICY "members_insert_admin" ON public.company_members
  FOR INSERT WITH CHECK (
    public.is_super_admin()
    OR public.has_company_role(company_id, 'ADMIN')
  );

CREATE POLICY "members_update_admin" ON public.company_members
  FOR UPDATE USING (
    public.is_super_admin()
    OR (public.has_company_role(company_id, 'ADMIN') AND user_id != auth.uid())
  )
  WITH CHECK (
    public.is_super_admin()
    OR (public.has_company_role(company_id, 'ADMIN') AND user_id != auth.uid())
  );

CREATE POLICY "members_delete_admin" ON public.company_members
  FOR DELETE USING (
    public.is_super_admin()
    OR (public.has_company_role(company_id, 'ADMIN') AND user_id != auth.uid())
  );

-- 4. ROLE PERMISSIONS POLICIES
CREATE POLICY "role_permissions_select" ON public.role_permissions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "role_permissions_manage_super_admin" ON public.role_permissions
  FOR ALL USING (public.is_super_admin());

-- 5. UNITS POLICIES
CREATE POLICY "units_select" ON public.units
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "units_manage_super_admin" ON public.units
  FOR ALL USING (public.is_super_admin());

-- 6. EMPLOYEES POLICIES
CREATE POLICY "employees_select" ON public.employees
  FOR SELECT USING (
    public.is_super_admin()
    OR (
      company_id IN (SELECT public.get_user_company_ids())
      AND (
        public.has_company_role(company_id, 'ADMIN', 'ACCOUNTS', 'STOREKEEPER', 'VIEWER')
        OR (
          public.has_company_role(company_id, 'SUPERVISOR', 'ATTENDANCE_USER')
          AND id IN (
            SELECT employee_id FROM public.employee_assignments
            WHERE supervisor_id = auth.uid() AND company_id = public.employees.company_id AND unassigned_at IS NULL
          )
        )
      )
    )
  );

CREATE POLICY "employees_manage_admin" ON public.employees
  FOR ALL USING (
    public.is_super_admin()
    OR public.has_company_role(company_id, 'ADMIN')
  );

-- 7. EMPLOYEE ASSIGNMENTS POLICIES
CREATE POLICY "assignments_select" ON public.employee_assignments
  FOR SELECT USING (
    public.is_super_admin()
    OR (
      company_id IN (SELECT public.get_user_company_ids())
      AND (
        public.has_company_role(company_id, 'ADMIN', 'ACCOUNTS', 'VIEWER')
        OR supervisor_id = auth.uid()
      )
    )
  );

CREATE POLICY "assignments_manage_admin" ON public.employee_assignments
  FOR ALL USING (
    public.is_super_admin()
    OR public.has_company_role(company_id, 'ADMIN')
  );

-- 8. ATTENDANCE POLICIES
CREATE POLICY "attendance_select" ON public.attendance
  FOR SELECT USING (
    public.is_super_admin()
    OR (
      company_id IN (SELECT public.get_user_company_ids())
      AND (
        public.has_company_role(company_id, 'ADMIN', 'ACCOUNTS', 'VIEWER')
        OR (
          public.has_company_role(company_id, 'SUPERVISOR', 'ATTENDANCE_USER')
          AND employee_id IN (
            SELECT employee_id FROM public.employee_assignments
            WHERE supervisor_id = auth.uid() AND company_id = public.attendance.company_id AND unassigned_at IS NULL
          )
        )
      )
    )
  );

CREATE POLICY "attendance_insert" ON public.attendance
  FOR INSERT WITH CHECK (
    (public.is_super_admin() AND date = get_business_date())
    OR (
      company_id IN (SELECT public.get_user_company_ids())
      AND date = get_business_date()
      AND (
        public.has_company_role(company_id, 'ADMIN')
        OR (
          public.has_company_role(company_id, 'SUPERVISOR', 'ATTENDANCE_USER')
          AND employee_id IN (
            SELECT employee_id FROM public.employee_assignments
            WHERE supervisor_id = auth.uid() AND company_id = public.attendance.company_id AND unassigned_at IS NULL
          )
        )
      )
    )
  );

CREATE POLICY "attendance_update" ON public.attendance
  FOR UPDATE USING (
    (public.is_super_admin() AND date = get_business_date())
    OR (
      company_id IN (SELECT public.get_user_company_ids())
      AND date = get_business_date()
      AND (
        public.has_company_role(company_id, 'ADMIN')
        OR (
          public.has_company_role(company_id, 'SUPERVISOR', 'ATTENDANCE_USER')
          AND employee_id IN (
            SELECT employee_id FROM public.employee_assignments
            WHERE supervisor_id = auth.uid() AND company_id = public.attendance.company_id AND unassigned_at IS NULL
          )
        )
      )
    )
  );

CREATE POLICY "attendance_delete_today_admin" ON public.attendance
  FOR DELETE USING (
    date = get_business_date()
    AND (
      public.is_super_admin()
      OR public.has_company_role(company_id, 'ADMIN')
    )
  );

-- 9. MATERIALS POLICIES
CREATE POLICY "materials_select" ON public.materials
  FOR SELECT USING (
    public.is_super_admin()
    OR company_id IN (SELECT public.get_user_company_ids())
  );

CREATE POLICY "materials_manage" ON public.materials
  FOR ALL USING (
    public.is_super_admin()
    OR public.has_company_role(company_id, 'ADMIN', 'STOREKEEPER')
  );

-- 10. SUPPLIERS POLICIES
CREATE POLICY "suppliers_select" ON public.suppliers
  FOR SELECT USING (
    public.is_super_admin()
    OR company_id IN (SELECT public.get_user_company_ids())
  );

CREATE POLICY "suppliers_manage" ON public.suppliers
  FOR ALL USING (
    public.is_super_admin()
    OR public.has_company_role(company_id, 'ADMIN', 'ACCOUNTS', 'STOREKEEPER')
  );

-- 11. STOCK INWARD POLICIES
CREATE POLICY "stock_inward_select" ON public.stock_inward
  FOR SELECT USING (
    public.is_super_admin()
    OR company_id IN (SELECT public.get_user_company_ids())
  );

CREATE POLICY "stock_inward_insert" ON public.stock_inward
  FOR INSERT WITH CHECK (
    public.is_super_admin()
    OR (
      company_id IN (SELECT public.get_user_company_ids())
      AND date = get_business_date()
      AND public.has_company_role(company_id, 'ADMIN', 'STOREKEEPER', 'ACCOUNTS')
    )
  );

CREATE POLICY "stock_inward_update_void" ON public.stock_inward
  FOR UPDATE USING (
    public.is_super_admin()
    OR public.has_company_role(company_id, 'ADMIN', 'STOREKEEPER')
  );

-- 12. STOCK OUTWARD POLICIES
CREATE POLICY "stock_outward_select" ON public.stock_outward
  FOR SELECT USING (
    public.is_super_admin()
    OR company_id IN (SELECT public.get_user_company_ids())
  );

CREATE POLICY "stock_outward_insert" ON public.stock_outward
  FOR INSERT WITH CHECK (
    public.is_super_admin()
    OR (
      company_id IN (SELECT public.get_user_company_ids())
      AND date = get_business_date()
      AND public.has_company_role(company_id, 'ADMIN', 'STOREKEEPER')
    )
  );

CREATE POLICY "stock_outward_update_void" ON public.stock_outward
  FOR UPDATE USING (
    public.is_super_admin()
    OR public.has_company_role(company_id, 'ADMIN', 'STOREKEEPER')
  );

-- 13. STOCK USAGE POLICIES
CREATE POLICY "stock_usage_select" ON public.stock_usage
  FOR SELECT USING (
    public.is_super_admin()
    OR company_id IN (SELECT public.get_user_company_ids())
  );

CREATE POLICY "stock_usage_insert" ON public.stock_usage
  FOR INSERT WITH CHECK (
    public.is_super_admin()
    OR (
      company_id IN (SELECT public.get_user_company_ids())
      AND date = get_business_date()
      AND public.has_company_role(company_id, 'ADMIN', 'STOREKEEPER', 'SUPERVISOR')
    )
  );

CREATE POLICY "stock_usage_update_void" ON public.stock_usage
  FOR UPDATE USING (
    public.is_super_admin()
    OR public.has_company_role(company_id, 'ADMIN', 'STOREKEEPER')
  );

-- 14. CORRECTION REQUESTS POLICIES
CREATE POLICY "corrections_select" ON public.correction_requests
  FOR SELECT USING (
    public.is_super_admin()
    OR (
      company_id IN (SELECT public.get_user_company_ids())
      AND (
        requested_by = auth.uid()
        OR public.has_company_role(company_id, 'ADMIN', 'ACCOUNTS')
      )
    )
  );

CREATE POLICY "corrections_insert" ON public.correction_requests
  FOR INSERT WITH CHECK (
    public.is_super_admin()
    OR (
      company_id IN (SELECT public.get_user_company_ids())
      AND requested_by = auth.uid()
    )
  );

CREATE POLICY "corrections_update_admin" ON public.correction_requests
  FOR UPDATE USING (
    public.is_super_admin()
    OR public.has_company_role(company_id, 'ADMIN')
  );

-- 15. AUDIT LOGS POLICIES
CREATE POLICY "audit_logs_select" ON public.audit_logs
  FOR SELECT USING (
    public.is_super_admin()
    OR (
      company_id IN (SELECT public.get_user_company_ids())
      AND public.has_company_role(company_id, 'ADMIN')
    )
  );

-- Ensure v_material_stock view respects caller's RLS policies
ALTER VIEW public.v_material_stock SET (security_invoker = true);

