-- ==============================================================================
-- Migration 007: Attendance Module & Workforce Master Roster
-- Purpose: Create companies, employees, and attendance_records with hardened RLS,
--          indexes, constraints, and audit-ready schema.
-- ==============================================================================

-- 1. Multi-Tenant Companies Catalog Table
CREATE TABLE IF NOT EXISTS public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Personnel Master Roster (Employees Table)
CREATE TABLE IF NOT EXISTS public.employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_code text NOT NULL,
  name text NOT NULL,
  department text NOT NULL,
  designation text NOT NULL,
  phone text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_company_employee_code UNIQUE (company_id, employee_code)
);

-- 3. Normalized Daily Attendance Records Table
CREATE TABLE IF NOT EXISTS public.attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  attendance_date date NOT NULL,
  status text NOT NULL CHECK (status IN ('PRESENT', 'ABSENT', 'OD')),
  overtime_hours numeric(5,2) NOT NULL DEFAULT 0.0 CHECK (overtime_hours >= 0.0 AND overtime_hours <= 24.0),
  remarks text,
  created_by uuid REFERENCES public.profiles(id),
  updated_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_employee_attendance_date UNIQUE (employee_id, attendance_date)
);

-- 4. High-Performance Query Indexes
CREATE INDEX IF NOT EXISTS idx_attendance_company_date ON public.attendance_records(company_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON public.attendance_records(employee_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance_records(attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON public.attendance_records(status);
CREATE INDEX IF NOT EXISTS idx_employees_company ON public.employees(company_id);
CREATE INDEX IF NOT EXISTS idx_employees_code ON public.employees(employee_code);
CREATE INDEX IF NOT EXISTS idx_companies_code ON public.companies(code);

-- 5. Auto-Update Timestamp Triggers
DROP TRIGGER IF EXISTS trg_companies_updated_at ON public.companies;
CREATE TRIGGER trg_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

DROP TRIGGER IF EXISTS trg_employees_updated_at ON public.employees;
CREATE TRIGGER trg_employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

DROP TRIGGER IF EXISTS trg_attendance_records_updated_at ON public.attendance_records;
CREATE TRIGGER trg_attendance_records_updated_at
  BEFORE UPDATE ON public.attendance_records
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

-- 6. Enable Row Level Security (RLS)
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies: companies
DROP POLICY IF EXISTS "companies_select" ON public.companies;
CREATE POLICY "companies_select" ON public.companies
  FOR SELECT TO authenticated, service_role
  USING (
    auth.role() = 'service_role'
    OR public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND status = 'ACTIVE'
    )
  );

DROP POLICY IF EXISTS "companies_modify" ON public.companies;
CREATE POLICY "companies_modify" ON public.companies
  FOR ALL TO authenticated, service_role
  USING (
    auth.role() = 'service_role'
    OR public.is_super_admin()
  );

-- 8. RLS Policies: employees
DROP POLICY IF EXISTS "employees_select" ON public.employees;
CREATE POLICY "employees_select" ON public.employees
  FOR SELECT TO authenticated, service_role
  USING (
    auth.role() = 'service_role'
    OR public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND status = 'ACTIVE'
    )
  );

DROP POLICY IF EXISTS "employees_modify" ON public.employees;
CREATE POLICY "employees_modify" ON public.employees
  FOR ALL TO authenticated, service_role
  USING (
    auth.role() = 'service_role'
    OR public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPER_ADMIN')
    )
  );

-- 9. RLS Policies: attendance_records
DROP POLICY IF EXISTS "attendance_select" ON public.attendance_records;
CREATE POLICY "attendance_select" ON public.attendance_records
  FOR SELECT TO authenticated, service_role
  USING (
    auth.role() = 'service_role'
    OR public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND status = 'ACTIVE'
    )
  );

DROP POLICY IF EXISTS "attendance_insert" ON public.attendance_records;
CREATE POLICY "attendance_insert" ON public.attendance_records
  FOR INSERT TO authenticated, service_role
  WITH CHECK (
    auth.role() = 'service_role'
    OR public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPER_ADMIN', 'SUPERVISOR')
    )
  );

DROP POLICY IF EXISTS "attendance_update" ON public.attendance_records;
CREATE POLICY "attendance_update" ON public.attendance_records
  FOR UPDATE TO authenticated, service_role
  USING (
    auth.role() = 'service_role'
    OR public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPER_ADMIN', 'SUPERVISOR')
    )
  );

DROP POLICY IF EXISTS "attendance_delete" ON public.attendance_records;
CREATE POLICY "attendance_delete" ON public.attendance_records
  FOR DELETE TO authenticated, service_role
  USING (
    auth.role() = 'service_role'
    OR public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPER_ADMIN')
    )
  );

-- 10. Seed Attendance Permissions Catalog
INSERT INTO public.permissions (code, module, description) VALUES
  ('attendance.view', 'ATTENDANCE', 'View daily, weekly, monthly attendance muster and summary telemetry'),
  ('attendance.create', 'ATTENDANCE', 'Mark and record individual employee attendance'),
  ('attendance.update', 'ATTENDANCE', 'Update existing attendance status, overtime, or remarks'),
  ('attendance.delete', 'ATTENDANCE', 'Clear or delete historical attendance records'),
  ('attendance.bulk_update', 'ATTENDANCE', 'Bulk mark workforce attendance (e.g. Mark All Present)'),
  ('attendance.overtime_update', 'ATTENDANCE', 'Independently adjust and verify employee overtime hours'),
  ('attendance.ledger.view', 'ATTENDANCE', 'View full-year Excel-like attendance workbook ledger'),
  ('attendance.ledger.update', 'ATTENDANCE', 'Edit and paste matrix cells in the attendance workbook ledger')
ON CONFLICT (code) DO UPDATE SET description = EXCLUDED.description;

-- 11. Seed Permissions to Roles
-- SUPER_ADMIN: Holds all 8 attendance permissions
INSERT INTO public.role_permissions (role, permission_code) VALUES
  ('SUPER_ADMIN', 'attendance.view'),
  ('SUPER_ADMIN', 'attendance.create'),
  ('SUPER_ADMIN', 'attendance.update'),
  ('SUPER_ADMIN', 'attendance.delete'),
  ('SUPER_ADMIN', 'attendance.bulk_update'),
  ('SUPER_ADMIN', 'attendance.overtime_update'),
  ('SUPER_ADMIN', 'attendance.ledger.view'),
  ('SUPER_ADMIN', 'attendance.ledger.update')
ON CONFLICT (role, permission_code) DO NOTHING;

-- ADMIN: Full attendance management for authorized company
INSERT INTO public.role_permissions (role, permission_code) VALUES
  ('ADMIN', 'attendance.view'),
  ('ADMIN', 'attendance.create'),
  ('ADMIN', 'attendance.update'),
  ('ADMIN', 'attendance.delete'),
  ('ADMIN', 'attendance.bulk_update'),
  ('ADMIN', 'attendance.overtime_update'),
  ('ADMIN', 'attendance.ledger.view'),
  ('ADMIN', 'attendance.ledger.update')
ON CONFLICT (role, permission_code) DO NOTHING;

-- SUPERVISOR: Operational attendance marking for site team
INSERT INTO public.role_permissions (role, permission_code) VALUES
  ('SUPERVISOR', 'attendance.view'),
  ('SUPERVISOR', 'attendance.create'),
  ('SUPERVISOR', 'attendance.update')
ON CONFLICT (role, permission_code) DO NOTHING;

-- ACCOUNT: Read-only attendance inspection for payroll verification
INSERT INTO public.role_permissions (role, permission_code) VALUES
  ('ACCOUNT', 'attendance.view'),
  ('ACCOUNT', 'attendance.ledger.view')
ON CONFLICT (role, permission_code) DO NOTHING;

-- 12. Least-Privilege Table Grants
GRANT USAGE ON SCHEMA public TO service_role, authenticated;

GRANT ALL ON TABLE public.companies TO service_role;
GRANT SELECT ON TABLE public.companies TO authenticated;

GRANT ALL ON TABLE public.employees TO service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE public.employees TO authenticated;

GRANT ALL ON TABLE public.attendance_records TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.attendance_records TO authenticated;

-- 13. Seed Initial Multi-Tenant Company
INSERT INTO public.companies (id, name, code, is_active) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'KFab Infra Project Pvt Ltd', 'KFAB-INFR', true)
ON CONFLICT (code) DO NOTHING;

-- 14. Seed Initial Industrial Workforce Roster for KFab Infra Project Pvt Ltd
INSERT INTO public.employees (id, company_id, employee_code, name, department, designation, phone, is_active) VALUES
  ('e0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'KF-101', 'Rajesh Kumar', 'Fabrication', 'Senior Fitter', '+91 98230 11001', true),
  ('e0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', 'KF-102', 'Amit Sharma', 'Welding', '6G Coded Welder', '+91 98230 11002', true),
  ('e0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000003', 'KF-103', 'Suresh Patil', 'Cutting', 'CNC Plasma Operator', '+91 98230 11003', true),
  ('e0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000004', 'KF-104', 'Ramesh Jadhav', 'Erection', 'Rigger Foreman', '+91 98230 11004', true),
  ('e0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000005', 'KF-105', 'Vikram Shinde', 'Welding', 'MIG Welder', '+91 98230 11005', true),
  ('e0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000006', 'KF-106', 'Santosh Pawar', 'Quality', 'NDT Inspector', '+91 98230 11006', true),
  ('e0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000007', 'KF-107', 'Ganesh More', 'Fabrication', 'Fabricator Bay 1', '+91 98230 11007', true),
  ('e0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000008', 'KF-108', 'Pradeep Kulkarni', 'Store', 'Material Handler', '+91 98230 11008', true),
  ('e0000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000009', 'KF-109', 'Anil Deshmukh', 'Cutting', 'Gas Cutter', '+91 98230 11009', true),
  ('e0000000-0000-0000-0000-000000000010', 'c0000000-0000-0000-0000-000000000010', 'KF-110', 'Mahesh Chavan', 'Welding', 'TIG Welder', '+91 98230 11010', true),
  ('e0000000-0000-0000-0000-000000000011', 'c0000000-0000-0000-0000-000000000011', 'KF-111', 'Sachin Gaikwad', 'Assembly', 'Fitter Bay 2', '+91 98230 11011', true),
  ('e0000000-0000-0000-0000-000000000012', 'c0000000-0000-0000-0000-000000000012', 'KF-112', 'Deepak Salunkhe', 'Maintenance', 'Shop Electrician', '+91 98230 11012', true)
ON CONFLICT (company_id, employee_code) DO NOTHING;
