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

