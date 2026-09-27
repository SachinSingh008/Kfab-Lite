-- ==============================================================================
-- KFAB BASIC — COMPLETE CONSOLIDATED DATABASE SCHEMA (1-CLICK SETUP)
-- Paste this entire file into Supabase SQL Editor and click 'RUN'
-- ==============================================================================

-- >>> FILE: 01_core_and_auth.sql
-- ============================================================================
-- Migration 01: Core Extensions, Enums, Helper Functions & Profiles
-- ============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Global Company-Scoped Member Roles Enum
DO $$ BEGIN
  CREATE TYPE member_role_type AS ENUM (
    'ADMIN',
    'ACCOUNTS',
    'SUPERVISOR',
    'STOREKEEPER',
    'VIEWER',
    'ATTENDANCE_USER'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Business Date Helper (Indian Standard Time Asia/Kolkata)
CREATE OR REPLACE FUNCTION get_business_date()
RETURNS date AS $$
  SELECT (timezone('Asia/Kolkata', now()))::date;
$$ LANGUAGE sql STABLE;

-- Timestamp Auto-Update Trigger Function
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- User Profiles Table (Linked 1:1 with auth.users & System-Level Super Admin)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text,
  avatar_url text,
  is_super_admin boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- Secure Super Admin Status Checker (SECURITY DEFINER with strict search_path)
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean AS $$
  SELECT COALESCE(
    (SELECT is_super_admin FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public, auth, pg_temp;

-- Privilege Escalation Prevention Trigger on profiles
CREATE OR REPLACE FUNCTION prevent_super_admin_escalation()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.is_super_admin = true AND NOT public.is_super_admin() THEN
      NEW.is_super_admin := false;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.is_super_admin IS DISTINCT FROM OLD.is_super_admin THEN
      IF NOT public.is_super_admin() THEN
        RAISE EXCEPTION 'Privilege escalation rejected: Only an existing Super Admin can alter system administrator privileges.';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp;

CREATE TRIGGER trg_prevent_super_admin_escalation
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION prevent_super_admin_escalation();

-- Auto-provision profile on Supabase Auth user signup
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, is_super_admin)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1), 'User'),
    false
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();





-- >>> FILE: 02_companies_and_members.sql
-- ============================================================================
-- Migration 02: Companies, Multi-Company Memberships & RBAC Permissions
-- ============================================================================

-- Companies Table (Multi-Tenant Boundary Root)
CREATE TABLE IF NOT EXISTS public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  logo_url text,
  address text,
  phone text,
  email text,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'INACTIVE')),
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- Company Memberships Table
CREATE TABLE IF NOT EXISTS public.company_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role member_role_type NOT NULL,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INVITED', 'DEACTIVATED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, user_id)
);

CREATE TRIGGER trg_company_members_updated_at
  BEFORE UPDATE ON public.company_members
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- Immutability check on company_members keys (prevents cross-tenant hijacking)
CREATE OR REPLACE FUNCTION enforce_company_members_immutability()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.company_id != OLD.company_id OR NEW.user_id != OLD.user_id THEN
    RAISE EXCEPTION 'Modifying company_id or user_id on an existing membership is prohibited.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public, auth, pg_temp;

CREATE TRIGGER trg_enforce_company_members_immutability
  BEFORE UPDATE ON public.company_members
  FOR EACH ROW EXECUTE FUNCTION enforce_company_members_immutability();

-- Role Permissions Master Table
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role member_role_type NOT NULL,
  permission text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (role, permission)
);

-- Seed Initial Role Permissions
INSERT INTO public.role_permissions (role, permission, description) VALUES
  ('ADMIN', 'users.manage', 'Invite and manage users in the company'),
  ('ADMIN', 'employees.manage', 'Create and modify employee master records'),
  ('ADMIN', 'attendance.view', 'View all company attendance'),
  ('ADMIN', 'attendance.mark', 'Mark company attendance for today'),
  ('ADMIN', 'attendance.correct', 'Approve and apply attendance corrections'),
  ('ADMIN', 'stock.view', 'View stock balances and transaction ledgers'),
  ('ADMIN', 'stock.inward', 'Record material inward receipts'),
  ('ADMIN', 'stock.outward', 'Record material outward dispatches'),
  ('ADMIN', 'stock.usage', 'Record material shop-floor usage'),
  ('ADMIN', 'stock.void', 'Void or cancel inaccurate stock entries'),
  ('ADMIN', 'reports.view', 'View and generate analytical reports'),
  ('ADMIN', 'audit.view', 'View company audit trail'),
  ('ADMIN', 'excel.import', 'Bulk import master and transaction data'),
  ('ADMIN', 'excel.export', 'Bulk export reports and muster sheets'),
  ('ACCOUNTS', 'attendance.view', 'View attendance for payroll processing'),
  ('ACCOUNTS', 'stock.view', 'View stock balances and valuation reports'),
  ('ACCOUNTS', 'stock.inward', 'Review supplier inward invoices and challans'),
  ('ACCOUNTS', 'reports.view', 'Generate muster and stock ledgers'),
  ('ACCOUNTS', 'excel.export', 'Export payroll attendance and ledger sheets'),
  ('SUPERVISOR', 'employees.view', 'View assigned worker profiles'),
  ('SUPERVISOR', 'attendance.view', 'View attendance for assigned workers'),
  ('SUPERVISOR', 'attendance.mark', 'Mark today muster for assigned workers'),
  ('SUPERVISOR', 'stock.view', 'View available stock quantities'),
  ('SUPERVISOR', 'stock.usage', 'Log daily fabrication stock consumption'),
  ('STOREKEEPER', 'stock.view', 'View stock balances and minimum alerts'),
  ('STOREKEEPER', 'stock.inward', 'Receive and record supplier inward materials'),
  ('STOREKEEPER', 'stock.outward', 'Issue gate passes and outward dispatches'),
  ('STOREKEEPER', 'stock.usage', 'Record material issues to work bays'),
  ('STOREKEEPER', 'stock.void', 'Void or cancel mistaken stock records'),
  ('ATTENDANCE_USER', 'attendance.view', 'View assigned worker attendance'),
  ('ATTENDANCE_USER', 'attendance.mark', 'Mark today muster for assigned workers'),
  ('VIEWER', 'attendance.view', 'Read-only view of attendance muster'),
  ('VIEWER', 'stock.view', 'Read-only view of stock inventory')
ON CONFLICT (role, permission) DO NOTHING;

-- Helper Security Definer Functions for Clean RLS
CREATE OR REPLACE FUNCTION public.get_user_company_ids()
RETURNS SETOF uuid AS $$
  SELECT company_id
  FROM public.company_members
  WHERE user_id = auth.uid() AND status = 'ACTIVE';
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public, auth, pg_temp;

CREATE OR REPLACE FUNCTION public.has_company_role(
  p_company_id uuid,
  VARIADIC p_roles member_role_type[]
)
RETURNS boolean AS $$
  SELECT (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1
      FROM public.company_members
      WHERE company_id = p_company_id
        AND user_id = auth.uid()
        AND status = 'ACTIVE'
        AND role = ANY(p_roles)
    )
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public, auth, pg_temp;

CREATE OR REPLACE FUNCTION public.has_company_permission(
  p_company_id uuid,
  p_permission text
)
RETURNS boolean AS $$
  SELECT (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1
      FROM public.company_members cm
      JOIN public.role_permissions rp ON rp.role = cm.role
      WHERE cm.company_id = p_company_id
        AND cm.user_id = auth.uid()
        AND cm.status = 'ACTIVE'
        AND rp.permission = p_permission
    )
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public, auth, pg_temp;





-- >>> FILE: 03_workforce_and_attendance.sql
-- ============================================================================
-- Migration 03: Employees Roster, Supervisor Assignments & Locked Attendance
-- ============================================================================

-- Employees Table (Workforce Directory)
CREATE TABLE IF NOT EXISTS public.employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_code text NOT NULL,
  name text NOT NULL,
  photo_url text,
  mobile text,
  designation text NOT NULL,
  department text NOT NULL,
  joining_date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'TERMINATED', 'ON_LEAVE')),
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, employee_code)
);

CREATE TRIGGER trg_employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- Employee Assignments Table (Supervisor Allocation with Full History)
CREATE TABLE IF NOT EXISTS public.employee_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  supervisor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE RESTRICT,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  unassigned_at timestamptz,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Partial Unique Index: Exactly one active supervisor per employee within a company
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_employee_assignment
  ON public.employee_assignments (company_id, employee_id)
  WHERE unassigned_at IS NULL;

-- Attendance Table (Server-Locked Daily Muster Records)
CREATE TABLE IF NOT EXISTS public.attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE RESTRICT,
  date date NOT NULL DEFAULT get_business_date(),
  status text NOT NULL CHECK (status IN ('PRESENT', 'ABSENT')),
  marked_at timestamptz NOT NULL DEFAULT now(),
  marked_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  client_id text, -- Offline sync idempotency key
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, employee_id, date)
);

CREATE TRIGGER trg_attendance_updated_at
  BEFORE UPDATE ON public.attendance
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- Strict Server-Side Date Lock Enforcement Trigger
CREATE OR REPLACE FUNCTION enforce_attendance_date_lock()
RETURNS TRIGGER AS $$
DECLARE
  v_today date := get_business_date();
BEGIN
  -- Controlled correction override check: only valid if authorized admin/super-admin
  IF current_setting('kfab.controlled_correction_in_progress', true) = 'true' THEN
    IF public.is_super_admin() OR public.has_company_role(COALESCE(NEW.company_id, OLD.company_id), 'ADMIN') THEN
      RETURN COALESCE(NEW, OLD);
    END IF;
  END IF;

  -- On INSERT
  IF TG_OP = 'INSERT' THEN
    IF NEW.date != v_today THEN
      RAISE EXCEPTION 'Attendance date lock violation: Date (%) is not current business day (%). Submit a correction request.',
        NEW.date, v_today;
    END IF;
    RETURN NEW;
  END IF;

  -- On UPDATE
  IF TG_OP = 'UPDATE' THEN
    IF OLD.date != v_today THEN
      RAISE EXCEPTION 'Historical attendance modification locked for date (%). Submit a formal correction request.',
        OLD.date;
    END IF;
    IF NEW.date != OLD.date THEN
      RAISE EXCEPTION 'Altering muster date on an existing attendance record is strictly forbidden.';
    END IF;
    RETURN NEW;
  END IF;

  -- On DELETE
  IF TG_OP = 'DELETE' THEN
    IF OLD.date != v_today THEN
      RAISE EXCEPTION 'Historical attendance deletion locked for date (%). Submit a formal correction request.',
        OLD.date;
    END IF;
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public, auth, pg_temp;

CREATE TRIGGER trg_enforce_attendance_date_lock
  BEFORE INSERT OR UPDATE OR DELETE ON public.attendance
  FOR EACH ROW EXECUTE FUNCTION enforce_attendance_date_lock();

-- Historical Correction Requests Table
CREATE TABLE IF NOT EXISTS public.correction_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  module text NOT NULL CHECK (module IN ('ATTENDANCE', 'STOCK_INWARD', 'STOCK_OUTWARD', 'STOCK_USAGE')),
  record_id uuid,
  target_date date NOT NULL,
  action_type text NOT NULL CHECK (action_type IN ('INSERT', 'UPDATE', 'DELETE', 'STATUS_CHANGE')),
  requested_data jsonb NOT NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')),
  requested_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_correction_requests_updated_at
  BEFORE UPDATE ON public.correction_requests
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- Controlled Procedure for Applying an Approved Correction
CREATE OR REPLACE FUNCTION public.apply_approved_correction(
  p_request_id uuid,
  p_review_notes text DEFAULT NULL
)
RETURNS boolean AS $$
DECLARE
  v_req public.correction_requests%ROWTYPE;
  v_emp_id uuid;
  v_status text;
BEGIN
  SELECT * INTO v_req
  FROM public.correction_requests
  WHERE id = p_request_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Correction request % not found.', p_request_id;
  END IF;

  IF v_req.status != 'PENDING' THEN
    RAISE EXCEPTION 'Correction request % is not pending (current status: %).', p_request_id, v_req.status;
  END IF;

  IF NOT (public.is_super_admin() OR public.has_company_role(v_req.company_id, 'ADMIN')) THEN
    RAISE EXCEPTION 'Unauthorized: Only Super Admin or Company Admin can approve correction requests.';
  END IF;

  PERFORM set_config('kfab.controlled_correction_in_progress', 'true', true);

  IF v_req.module = 'ATTENDANCE' THEN
    IF v_req.action_type = 'INSERT' THEN
      v_emp_id := (v_req.requested_data->>'employee_id')::uuid;
      v_status := (v_req.requested_data->>'status')::text;
      INSERT INTO public.attendance (
        company_id, employee_id, date, status, marked_by
      ) VALUES (
        v_req.company_id, v_emp_id, v_req.target_date, v_status, auth.uid()
      )
      ON CONFLICT (company_id, employee_id, date)
      DO UPDATE SET status = EXCLUDED.status, marked_by = auth.uid(), updated_at = now();
    ELSIF v_req.action_type = 'UPDATE' THEN
      v_status := (v_req.requested_data->>'status')::text;
      UPDATE public.attendance
      SET status = v_status, marked_by = auth.uid(), updated_at = now()
      WHERE id = v_req.record_id AND company_id = v_req.company_id;
    ELSIF v_req.action_type = 'DELETE' THEN
      DELETE FROM public.attendance
      WHERE id = v_req.record_id AND company_id = v_req.company_id;
    END IF;
  END IF;

  PERFORM set_config('kfab.controlled_correction_in_progress', 'false', true);

  UPDATE public.correction_requests
  SET status = 'APPROVED',
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      review_notes = p_review_notes,
      updated_at = now()
  WHERE id = p_request_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp;




-- >>> FILE: 04_inventory_and_stock.sql
-- ============================================================================
-- Migration 04: Materials Catalog, Suppliers, Stock Ledger & Atomic Concurrency
-- ============================================================================

-- Units of Measurement Master Table
CREATE TABLE IF NOT EXISTS public.units (
  code text PRIMARY KEY,
  name text NOT NULL,
  description text,
  is_standard boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Seed Standard Units
INSERT INTO public.units (code, name, description) VALUES
  ('KG', 'Kilogram', 'Metric mass in kilograms'),
  ('TON', 'Metric Ton', '1,000 Kilograms'),
  ('NOS', 'Numbers', 'Count of individual discrete items'),
  ('LITRE', 'Litre', 'Metric liquid volume'),
  ('METER', 'Meter', 'Linear length in meters'),
  ('MM', 'Millimeter', 'Linear length in millimeters'),
  ('BAG', 'Bag', 'Standard bagged material (e.g. cement)'),
  ('BOX', 'Box', 'Boxed packaging unit'),
  ('SET', 'Set', 'Assembled set or composite item')
ON CONFLICT (code) DO NOTHING;

-- Material Master Table
CREATE TABLE IF NOT EXISTS public.materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  material_code text NOT NULL,
  name text NOT NULL,
  category text NOT NULL,
  specification text,
  unit_code text NOT NULL REFERENCES public.units(code) ON UPDATE CASCADE,
  minimum_stock numeric(12, 3) NOT NULL DEFAULT 0 CHECK (minimum_stock >= 0),
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'DISCONTINUED', 'INACTIVE')),
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, material_code)
);

CREATE TRIGGER trg_materials_updated_at
  BEFORE UPDATE ON public.materials
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- Suppliers Table
CREATE TABLE IF NOT EXISTS public.suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  supplier_code text NOT NULL,
  name text NOT NULL,
  contact_person text,
  phone text,
  email text,
  address text,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'BLACKLISTED')),
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, supplier_code)
);

CREATE TRIGGER trg_suppliers_updated_at
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- Stock Inward Table (Material Receipts from Suppliers)
CREATE TABLE IF NOT EXISTS public.stock_inward (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT get_business_date(),
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
  material_id uuid NOT NULL REFERENCES public.materials(id) ON DELETE RESTRICT,
  quantity numeric(12, 3) NOT NULL CHECK (quantity > 0),
  unit_code text NOT NULL REFERENCES public.units(code) ON UPDATE CASCADE,
  vehicle_number text,
  invoice_number text,
  challan_number text,
  received_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  remarks text,
  attachment_url text,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'VOIDED', 'CANCELLED')),
  voided_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  voided_at timestamptz,
  void_reason text,
  client_id text,
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_stock_inward_updated_at
  BEFORE UPDATE ON public.stock_inward
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- Stock Outward Table (Dispatches to Clients / Subcontractors / Sites)
CREATE TABLE IF NOT EXISTS public.stock_outward (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT get_business_date(),
  material_id uuid NOT NULL REFERENCES public.materials(id) ON DELETE RESTRICT,
  quantity numeric(12, 3) NOT NULL CHECK (quantity > 0),
  unit_code text NOT NULL REFERENCES public.units(code) ON UPDATE CASCADE,
  destination text NOT NULL,
  vehicle_number text,
  driver text,
  challan_number text,
  issued_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  received_by_name text,
  remarks text,
  attachment_url text,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'VOIDED', 'CANCELLED')),
  voided_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  voided_at timestamptz,
  void_reason text,
  client_id text,
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_stock_outward_updated_at
  BEFORE UPDATE ON public.stock_outward
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- Stock Usage Table (Shop Floor / Fabrication Bay Consumption)
CREATE TABLE IF NOT EXISTS public.stock_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT get_business_date(),
  material_id uuid NOT NULL REFERENCES public.materials(id) ON DELETE RESTRICT,
  quantity numeric(12, 3) NOT NULL CHECK (quantity > 0),
  unit_code text NOT NULL REFERENCES public.units(code) ON UPDATE CASCADE,
  project_name text,
  used_by text,
  remarks text,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'VOIDED', 'CANCELLED')),
  voided_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  voided_at timestamptz,
  void_reason text,
  client_id text,
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_stock_usage_updated_at
  BEFORE UPDATE ON public.stock_usage
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- Stock Void & Immutability Lifecycle Policy
CREATE OR REPLACE FUNCTION enforce_stock_void_lifecycle()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF NOT public.is_super_admin() THEN
      RAISE EXCEPTION 'Hard deletion of stock transactions is prohibited. Use the void/cancel procedure instead.';
    END IF;
    RETURN OLD;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF OLD.status IN ('VOIDED', 'CANCELLED') THEN
      RAISE EXCEPTION 'Modification of voided or cancelled stock transactions is strictly prohibited.';
    END IF;

    IF OLD.status = 'ACTIVE' AND NEW.status IN ('VOIDED', 'CANCELLED') THEN
      IF NEW.void_reason IS NULL OR trim(NEW.void_reason) = '' THEN
        RAISE EXCEPTION 'A valid void_reason is mandatory when voiding a stock transaction.';
      END IF;
      NEW.voided_by := auth.uid();
      NEW.voided_at := now();
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public, auth, pg_temp;

CREATE TRIGGER trg_stock_inward_void_lifecycle
  BEFORE UPDATE OR DELETE ON public.stock_inward
  FOR EACH ROW EXECUTE FUNCTION enforce_stock_void_lifecycle();

CREATE TRIGGER trg_stock_outward_void_lifecycle
  BEFORE UPDATE OR DELETE ON public.stock_outward
  FOR EACH ROW EXECUTE FUNCTION enforce_stock_void_lifecycle();

CREATE TRIGGER trg_stock_usage_void_lifecycle
  BEFORE UPDATE OR DELETE ON public.stock_usage
  FOR EACH ROW EXECUTE FUNCTION enforce_stock_void_lifecycle();

-- Concurrency-Safe Atomic Stock Deduction Trigger (Row-Level Locking)
CREATE OR REPLACE FUNCTION validate_stock_availability_trigger()
RETURNS TRIGGER AS $$
DECLARE
  v_current_stock numeric(12, 3);
  v_inward numeric(12, 3) := 0;
  v_outward numeric(12, 3) := 0;
  v_usage numeric(12, 3) := 0;
BEGIN
  IF NEW.status IN ('VOIDED', 'CANCELLED') THEN
    RETURN NEW;
  END IF;

  -- Row lock on material to serialize concurrent deductions
  PERFORM id FROM public.materials WHERE id = NEW.material_id FOR UPDATE;

  SELECT COALESCE(SUM(quantity), 0) INTO v_inward
  FROM public.stock_inward
  WHERE material_id = NEW.material_id AND status = 'ACTIVE';

  IF TG_OP = 'INSERT' THEN
    SELECT COALESCE(SUM(quantity), 0) INTO v_outward
    FROM public.stock_outward
    WHERE material_id = NEW.material_id AND status = 'ACTIVE';

    SELECT COALESCE(SUM(quantity), 0) INTO v_usage
    FROM public.stock_usage
    WHERE material_id = NEW.material_id AND status = 'ACTIVE';
  ELSE -- UPDATE
    SELECT COALESCE(SUM(quantity), 0) INTO v_outward
    FROM public.stock_outward
    WHERE material_id = NEW.material_id AND status = 'ACTIVE'
      AND (TG_TABLE_NAME != 'stock_outward' OR id != OLD.id);

    SELECT COALESCE(SUM(quantity), 0) INTO v_usage
    FROM public.stock_usage
    WHERE material_id = NEW.material_id AND status = 'ACTIVE'
      AND (TG_TABLE_NAME != 'stock_usage' OR id != OLD.id);
  END IF;

  v_current_stock := v_inward - (v_outward + v_usage);

  IF (v_current_stock - NEW.quantity) < 0 THEN
    RAISE EXCEPTION 'Insufficient stock for material %. Available: %, Requested: %.',
      NEW.material_id, v_current_stock, NEW.quantity;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public, auth, pg_temp;

CREATE TRIGGER trg_validate_stock_outward
  BEFORE INSERT OR UPDATE ON public.stock_outward
  FOR EACH ROW EXECUTE FUNCTION validate_stock_availability_trigger();

CREATE TRIGGER trg_validate_stock_usage
  BEFORE INSERT OR UPDATE ON public.stock_usage
  FOR EACH ROW EXECUTE FUNCTION validate_stock_availability_trigger();

-- Dynamic Calculated Stock View
CREATE OR REPLACE VIEW public.v_material_stock AS
SELECT
  m.id AS material_id,
  m.company_id,
  m.material_code,
  m.name AS material_name,
  m.category,
  m.specification,
  m.unit_code,
  m.minimum_stock,
  m.status AS material_status,
  COALESCE(i.total_inward, 0)::numeric(12, 3) AS total_inward,
  COALESCE(o.total_outward, 0)::numeric(12, 3) AS total_outward,
  COALESCE(u.total_usage, 0)::numeric(12, 3) AS total_usage,
  (COALESCE(i.total_inward, 0) - COALESCE(o.total_outward, 0) - COALESCE(u.total_usage, 0))::numeric(12, 3) AS current_stock,
  ((COALESCE(i.total_inward, 0) - COALESCE(o.total_outward, 0) - COALESCE(u.total_usage, 0)) <= m.minimum_stock) AS is_low_stock
FROM public.materials m
LEFT JOIN (
  SELECT material_id, SUM(quantity) AS total_inward
  FROM public.stock_inward
  WHERE status = 'ACTIVE'
  GROUP BY material_id
) i ON i.material_id = m.id
LEFT JOIN (
  SELECT material_id, SUM(quantity) AS total_outward
  FROM public.stock_outward
  WHERE status = 'ACTIVE'
  GROUP BY material_id
) o ON o.material_id = m.id
LEFT JOIN (
  SELECT material_id, SUM(quantity) AS total_usage
  FROM public.stock_usage
  WHERE status = 'ACTIVE'
  GROUP BY material_id
) u ON u.material_id = m.id;




-- >>> FILE: 05_audit_and_indexes.sql
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




-- >>> FILE: 06_row_level_security.sql
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





-- >>> FILE: 07_chat_groups_and_granular_visibility.sql
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

-- 4. RLS POLICIES FOR CHAT GROUPS
-- Super Admin can see all groups; members see groups they belong to
CREATE POLICY "chat_groups_select" ON public.chat_groups
  FOR SELECT USING (
    public.is_super_admin()
    OR id IN (
      SELECT group_id FROM public.chat_group_members WHERE user_id = auth.uid()
    )
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
    public.is_super_admin()
    OR group_id IN (
      SELECT group_id FROM public.chat_group_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "chat_members_manage" ON public.chat_group_members
  FOR ALL USING (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.chat_groups g
      WHERE g.id = public.chat_group_members.group_id
        AND (
          g.created_by = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.chat_group_members m
            WHERE m.group_id = g.id AND m.user_id = auth.uid() AND m.is_lead = true
          )
        )
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




-- >>> FILE: 08_supervisor_operations.sql
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




-- >>> FILE: seed.sql (ISO Units)
-- ============================================================================
-- KFAB BASIC — Clean Seed Script (No Fake / Mock Data)
-- ============================================================================
-- Clean slate: Master units only (Standard ISO measurement units)
-- Real application data will be entered via the UI and authenticated users.
-- ============================================================================

-- Standard Units of Measurement (Universal Constants)
INSERT INTO public.units (code, name, description) VALUES
  ('KG', 'Kilogram', 'Metric mass in kilograms'),
  ('TON', 'Metric Ton', '1,000 Kilograms'),
  ('NOS', 'Numbers', 'Count of individual discrete items'),
  ('LITRE', 'Litre', 'Metric liquid volume'),
  ('METER', 'Meter', 'Linear length in meters'),
  ('MM', 'Millimeter', 'Linear length in millimeters'),
  ('BAG', 'Bag', 'Standard bagged material (e.g. cement)'),
  ('BOX', 'Box', 'Boxed packaging unit'),
  ('SET', 'Set', 'Assembled set or composite item')
ON CONFLICT (code) DO NOTHING;



-- >>> FILE: 09_grants_and_permissions.sql
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
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO authenticated, service_role;

-- 5. Default Privileges for any future tables created
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO authenticated, service_role;

-- 6. Make standard measurement units (KG, TON, NOS) readable globally
DROP POLICY IF EXISTS "units_select" ON public.units;
CREATE POLICY "units_select_global" ON public.units FOR SELECT USING (true);

-- ==============================================================================
-- KFAB360 — CONSOLIDATED IDEMPOTENT MIGRATION 14
-- TITLE: ENTERPRISE USER MANAGEMENT, RBAC INTEGRITY, RLS SECURITY HARDENING
-- SAFE TO RUN IN SUPABASE SQL EDITOR
-- ==============================================================================
-- This single migration applies all necessary schema changes, triggers,
-- hardened RLS policies, and authorization gates for KFab360 User Management.
-- It is completely safe to run and idempotent (can be executed multiple times
-- without causing syntax errors or duplicating columns/constraints).
-- ==============================================================================
-- KFAB360 — CONSOLIDATED PRODUCTION MIGRATION 14 (FINAL REVISED)
-- TITLE: ENTERPRISE USER MANAGEMENT, RBAC INTEGRITY, RLS SECURITY HARDENING
-- SAFE TO RUN IN SUPABASE SQL EDITOR
-- ==============================================================================
-- ARCHITECTURAL GUARANTEES:
-- 1. Supabase Auth (auth.users) is the authoritative identity provider (GoTrue).
-- 2. Fastify backend (/api/v1/users) is the authoritative business/API layer.
-- 3. NO custom SQL touches auth.users or hashes passwords.
-- 4. All legacy admin RPCs that bypassed GoTrue are DROPPED.
-- 5. public.profiles RLS and triggers prevent unauthorized role/status mutation.
-- 6. public.audit_logs is strictly append-only with immutable trigger protection.
-- 7. The last active Super Admin is protected against deletion, demotion, deactivation.
-- 8. Completely idempotent: safe to execute multiple times without error.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- STEP 1: ENHANCE public.profiles WITH ERP FIELDS
-- ------------------------------------------------------------------------------

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'SUPERVISOR';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS department text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS designation text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS force_password_reset boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_login_at timestamptz;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS session_revoked_at timestamptz;

-- Ensure all existing profiles have non-null role and status
UPDATE public.profiles
SET role = 'SUPER_ADMIN'
WHERE is_super_admin = true;

UPDATE public.profiles
SET role = 'ADMIN'
WHERE is_super_admin = false AND (role IS NULL OR role = '');

UPDATE public.profiles
SET status = 'ACTIVE'
WHERE status IS NULL OR status = '';

-- Backfill email from auth.users for any profiles missing it
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND (p.email IS NULL OR p.email = '');

-- Guarantee Super Administrator account status for Sachin
UPDATE public.profiles
SET 
  is_super_admin = true,
  role = 'SUPER_ADMIN',
  status = 'ACTIVE'
WHERE lower(email) = 'sachinasinghofficial@gmail.com';

-- ------------------------------------------------------------------------------
-- STEP 2: ENHANCE public.audit_logs WITH CORRELATION & SECURITY ATTRIBUTES
-- ------------------------------------------------------------------------------

ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS target_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS user_agent text;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'SUCCESS';
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS correlation_id text;

-- ------------------------------------------------------------------------------
-- STEP 3: PERFORMANCE AND SEARCH INDEXES
-- ------------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_department ON public.profiles(department);
CREATE INDEX IF NOT EXISTS idx_profiles_employee_id ON public.profiles(employee_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target_user ON public.audit_logs(target_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_correlation_id ON public.audit_logs(correlation_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- ------------------------------------------------------------------------------
-- STEP 4: TRIGGER — SUPER ADMIN ABSOLUTE PROTECTION
-- Prevents accidental deletion, demotion, role change, or deactivation of the last active Super Admin
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.protect_last_super_admin()
RETURNS TRIGGER AS $$
DECLARE
  v_active_super_admins int;
BEGIN
  IF TG_OP = 'DELETE' AND OLD.is_super_admin = true THEN
    SELECT COUNT(*) INTO v_active_super_admins
    FROM public.profiles
    WHERE is_super_admin = true AND id != OLD.id;
    
    IF v_active_super_admins < 1 THEN
      RAISE EXCEPTION 'Action rejected: Cannot delete the last active Super Administrator in the system.';
    END IF;
  ELSIF TG_OP = 'UPDATE' AND OLD.is_super_admin = true THEN
    -- If demoting is_super_admin, changing role away from SUPER_ADMIN, or deactivating
    IF (NEW.is_super_admin = false) 
       OR (NEW.role IS DISTINCT FROM 'SUPER_ADMIN') 
       OR (NEW.status IS DISTINCT FROM 'ACTIVE' AND OLD.status = 'ACTIVE') THEN
      SELECT COUNT(*) INTO v_active_super_admins
      FROM public.profiles
      WHERE is_super_admin = true 
        AND role = 'SUPER_ADMIN' 
        AND status = 'ACTIVE' 
        AND id != OLD.id;
      
      IF v_active_super_admins < 1 THEN
        RAISE EXCEPTION 'Action rejected: Cannot demote, deactivate, or change the role of the last active Super Administrator in the system.';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp;

DROP TRIGGER IF EXISTS trg_protect_last_super_admin ON public.profiles;
CREATE TRIGGER trg_protect_last_super_admin
  BEFORE UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_last_super_admin();

-- ------------------------------------------------------------------------------
-- STEP 5: TRIGGER — HARDENED PRIVILEGE ESCALATION PREVENTION
-- Blocks non-super-admin users from altering roles, super admin status, account status, or org mappings
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.prevent_super_admin_escalation()
RETURNS TRIGGER AS $$
BEGIN
  -- If invoked from client API by an authenticated user
  IF auth.uid() IS NOT NULL AND NOT public.is_super_admin() THEN
    -- Block altering is_super_admin
    IF NEW.is_super_admin IS DISTINCT FROM OLD.is_super_admin THEN
      RAISE EXCEPTION 'Privilege escalation rejected: Only an active Super Admin can alter system administrator privileges.';
    END IF;

    -- Block altering role
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'Privilege escalation rejected: Only an active Super Admin or authorized administrator can alter user roles.';
    END IF;

    -- Block altering account status (active/inactive)
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      RAISE EXCEPTION 'Privilege escalation rejected: Only an active Super Admin or authorized administrator can alter account status.';
    END IF;

    -- Block altering organizational links
    IF NEW.department IS DISTINCT FROM OLD.department OR 
       NEW.designation IS DISTINCT FROM OLD.designation OR 
       NEW.employee_id IS DISTINCT FROM OLD.employee_id THEN
      RAISE EXCEPTION 'Privilege escalation rejected: Only an authorized administrator can alter employee or organizational mappings.';
    END IF;

    -- Block altering security control flags
    IF NEW.force_password_reset IS DISTINCT FROM OLD.force_password_reset OR
       NEW.session_revoked_at IS DISTINCT FROM OLD.session_revoked_at THEN
      RAISE EXCEPTION 'Privilege escalation rejected: Security flags can only be altered by authorized administrators.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp;

DROP TRIGGER IF EXISTS trg_prevent_super_admin_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_super_admin_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_super_admin_escalation();

-- ------------------------------------------------------------------------------
-- STEP 6: TRIGGER — AUTO-PROVISION PROFILE ON SUPABASE AUTH SIGNUP
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    full_name,
    email,
    role,
    status,
    is_super_admin
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1), 'User'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'SUPERVISOR'),
    'ACTIVE',
    false
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- ------------------------------------------------------------------------------
-- STEP 7: FIX & HARDEN ROW LEVEL SECURITY (RLS) ON public.profiles
-- ------------------------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop all legacy, conflicting, or overly permissive policies
DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own_or_colleague_or_super" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_admin_or_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_authenticated" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy_hardened" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_service_only" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy_hardened" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_authorized" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_policy_hardened" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_service_or_super" ON public.profiles;

-- 1. SELECT: Authenticated users can view the directory roster; anon CANNOT
CREATE POLICY "profiles_select_authenticated" ON public.profiles
  FOR SELECT TO authenticated, service_role
  USING (true);

-- 2. INSERT: Only service_role (Fastify API) or Super Admin (blocks arbitrary client inserts)
CREATE POLICY "profiles_insert_service_only" ON public.profiles
  FOR INSERT TO authenticated, service_role
  WITH CHECK (
    auth.role() = 'service_role' OR public.is_super_admin()
  );

-- 3. UPDATE: Users can update their own personal info (guarded by escalation trigger),
-- Super Admins and service_role can update all profiles
CREATE POLICY "profiles_update_authorized" ON public.profiles
  FOR UPDATE TO authenticated, service_role
  USING (
    auth.role() = 'service_role' 
    OR public.is_super_admin() 
    OR id = auth.uid()
  );

-- 4. DELETE: Completely blocked from normal clients. Only service_role or Super Admin.
CREATE POLICY "profiles_delete_service_or_super" ON public.profiles
  FOR DELETE TO authenticated, service_role
  USING (
    auth.role() = 'service_role'
    OR (public.is_super_admin() AND is_super_admin = false)
  );

-- ------------------------------------------------------------------------------
-- STEP 8: FIX & HARDEN ROW LEVEL SECURITY (RLS) ON public.audit_logs
-- Ensure audit_logs is strictly APPEND-ONLY & IMMUTABLE
-- ------------------------------------------------------------------------------

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_logs_select" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_insert" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_update" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_delete" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_select_policy" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_insert_policy" ON public.audit_logs;

-- Read: Super Admins, company Admins, or actors inspecting their own actions
CREATE POLICY "audit_logs_select_policy" ON public.audit_logs
  FOR SELECT TO authenticated, service_role
  USING (
    auth.role() = 'service_role' 
    OR public.is_super_admin()
    OR user_id = auth.uid()
    OR target_user_id = auth.uid()
    OR (
      company_id IN (SELECT public.get_user_company_ids())
      AND public.has_company_role(company_id, 'ADMIN')
    )
  );

-- Insert: Service role, triggers, or authenticated actors logging actions
CREATE POLICY "audit_logs_insert_policy" ON public.audit_logs
  FOR INSERT TO authenticated, service_role
  WITH CHECK (
    auth.role() = 'service_role'
    OR auth.uid() = user_id
    OR public.is_super_admin()
  );

-- IMMUTABLE AUDIT LOG TRIGGER: Strictly rejects any UPDATE or DELETE on audit_logs
CREATE OR REPLACE FUNCTION public.prevent_audit_logs_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit logs are immutable and append-only. Modification or deletion is strictly prohibited.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_audit_logs_mutation ON public.audit_logs;
CREATE TRIGGER trg_prevent_audit_logs_mutation
  BEFORE UPDATE OR DELETE ON public.audit_logs
  FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_logs_mutation();

-- ------------------------------------------------------------------------------
-- STEP 9: DROP ALL UNNECESSARY PRIVILEGED RPCs THAT DUPLICATE FASTIFY
-- No custom SQL functions may mutate auth.users or hash passwords!
-- ------------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.admin_create_user(text, text, text, text);
DROP FUNCTION IF EXISTS public.admin_create_user(text, text, text, text, text, text, uuid);
DROP FUNCTION IF EXISTS public.admin_update_user(text, text, text, text, text, text);
DROP FUNCTION IF EXISTS public.admin_update_user(text, text, text, text, text, text, text, text, uuid, boolean);
DROP FUNCTION IF EXISTS public.admin_delete_user(text);
DROP FUNCTION IF EXISTS public.admin_get_all_users();

-- ------------------------------------------------------------------------------
-- STEP 10: REVOKE DANGEROUS ROUTINE PRIVILEGES FROM anon AND PUBLIC
-- ------------------------------------------------------------------------------

-- Reverse dangerous blanket routine grants to anon from Migration 09
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON ROUTINES FROM anon, PUBLIC;
REVOKE ALL ON ALL ROUTINES IN SCHEMA public FROM anon, PUBLIC;

-- Re-grant execution strictly on safe, read-only utilities
GRANT EXECUTE ON FUNCTION public.get_business_date() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_company_ids() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_company_role(uuid, member_role_type[]) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_permission(uuid, text) TO authenticated, service_role;

-- ==============================================================================
-- END OF CONSOLIDATED MIGRATION 14 — SAFE TO RUN IN SUPABASE SQL EDITOR
-- ==============================================================================
